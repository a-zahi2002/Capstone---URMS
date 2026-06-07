import { Request, Response, NextFunction } from 'express';
import admin, { isFirebaseInitialized } from '../config/firebase.config';
import { getSupabaseClient, supabase } from '../config/supabaseClient';

export interface AuthRequest extends Request {
    user?: any;
    supabase?: any;
}

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization as string;

    const finalize = () => {
        // Create scoped supabase client for this request
        if (req.user) {
            const role = req.user.role || (req.user.admin ? 'admin' : 'student');
            
            // For admins, use the service role client to bypass RLS for administrative/analytics tasks
            if (role === 'admin' || req.user.admin) {
                req.supabase = supabase;
            } else {
                req.supabase = getSupabaseClient({
                    uid: req.user.uid,
                    role: role
                });
            }
        }
        next();
    };

    if (!header || !header.startsWith('Bearer ')) {
        if (!isFirebaseInitialized && process.env.NODE_ENV === 'development') {
            console.warn('Auth bypassed in DEV mode because Firebase is not initialized.');
            req.user = { uid: 'dev-user', role: 'admin' } as any;
            return finalize();
        }
        return res.status(401).json({ message: 'Unauthorized: No token' });
    }

    const token = header.split(' ')[1];

    // Allow dev-token bypass in development ONLY — never in production
    if (token === 'dev-token' && process.env.NODE_ENV !== 'production') {
        req.user = { uid: 'dev-user', role: 'admin', admin: true };
        return finalize();
    }

    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.user = decoded;

        // If role/admin claims are missing from the token, fetch from Supabase to ensure consistency
        if (!req.user.role && !req.user.admin) {
            try {
                const { data: profile } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', req.user.uid)
                    .single();
                
                if (profile) {
                    req.user.role = profile.role;
                }
            } catch (err) {
                console.error('Error fetching role from Supabase in middleware:', err);
            }
        }

        finalize();
    } catch (error) {
        if (!isFirebaseInitialized && process.env.NODE_ENV === 'development') {
            console.warn('Auth bypassed in DEV mode because Firebase is not initialized.');
            req.user = { uid: 'dev-user', role: 'admin' } as any;
            return finalize();
        }
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const user = req.user;

    // Pass if: dev-token user OR Firebase custom claim 'admin' is true OR role === 'admin'
    const isAdmin =
        user.uid === 'dev-user' ||
        user.admin === true ||
        user.role === 'admin';

    if (isAdmin) {
        return next();
    }

    return res.status(403).json({ message: 'Access denied: Admins only' });
};
