import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware'; // Reuse AuthRequest from your auth middleware
// import { supabase } from '../config/supabaseClient'; // Only needed if you use the fallback

/**
 * Role-Based Access Control Middleware Factory
 * Checks if the authenticated user's role is within the allowed roles array.
 * 
 * @param allowedRoles - An array of roles that are permitted to access the route.
 * @returns Express Middleware function
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // 1. Ensure the user object exists (verifyToken must run before this)
            if (!req.user) {
                return res.status(401).json({ message: 'Unauthorized: No user found. verifyToken middleware must run first.' });
            }

            // 2. Extract the user's role
            // This assumes the role was set as a Firebase Custom Claim and attached to req.user by verifyToken
            let userRole = req.user.role;
            
            // Allow bypassing if it's the dev-user created by your existing auth middleware
            if (req.user.uid === 'dev-user' && req.user.role === 'admin') {
                userRole = 'admin';
            }

            // 3. Fallback Strategy (Supabase)
            // If the role is missing from Custom Claims, you can query Supabase to resolve it.
            /*
            if (!userRole) {
                const { data: profile, error } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', req.user.uid)
                    .single();

                if (profile && profile.role) {
                    userRole = profile.role;
                    // Optional: You could update req.user.role here for downstream middleware
                    req.user.role = userRole; 
                }
            }
            */

            // 4. Check if a role was found
            if (!userRole) {
                return res.status(403).json({ message: 'Forbidden: No role assigned to user' });
            }

            // 5. Authorize against allowed roles
            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({ 
                    message: `Forbidden: User role '${userRole}' is not authorized to access this resource.` 
                });
            }

            // Authorized! Proceed to the next middleware or route controller
            next();
        } catch (error) {
            console.error('RBAC Middleware Error:', error);
            return res.status(500).json({ message: 'Internal Server Error during authorization check' });
        }
    };
};
