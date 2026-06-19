import { Response } from "express";
import admin from "../config/firebase.config";
import { AuthRequest } from "../middleware/auth.middleware";
import { hashPassword, verifyPassword } from "../services/password.service";
import { supabase } from "../config/supabaseClient";

export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userRecord = await admin.auth().getUser(uid);
        
        return res.status(200).json({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || "",
            photoURL: userRecord.photoURL || "",
            role: userRecord.customClaims?.role || "user",
            metadata: userRecord.metadata,
        });
    } catch (error: any) {
        console.error("Error fetching user profile:", error);
        return res.status(500).json({ message: "Failed to fetch profile", error: error.message });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { displayName } = req.body;

        const updatedUser = await admin.auth().updateUser(uid, {
            displayName: displayName,
        });

        return res.status(200).json({
            message: "Profile updated successfully",
            user: {
                uid: updatedUser.uid,
                email: updatedUser.email,
                displayName: updatedUser.displayName,
                photoURL: updatedUser.photoURL,
                role: updatedUser.customClaims?.role || "user",
            }
        });
    } catch (error: any) {
        console.error("Error updating user profile:", error);
        return res.status(500).json({ message: "Failed to update profile", error: error.message });
    }
};

/**
 * Hash a password using bcrypt.
 * Called during registration to generate a hash for storage.
 *
 * POST /api/users/hash-password
 * Body: { password: string }
 * Returns: { password_hash: string }
 */
export const hashPasswordHandler = async (req: AuthRequest, res: Response) => {
    try {
        const { password } = req.body;

        if (!password || typeof password !== "string") {
            return res.status(400).json({ message: "Password is required." });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long." });
        }

        const password_hash = await hashPassword(password);

        return res.status(200).json({ password_hash });
    } catch (error: any) {
        console.error("Error hashing password:", error);
        return res.status(500).json({ message: "Failed to hash password.", error: error.message });
    }
};

/**
 * Verify a password against the stored bcrypt hash.
 * Called during login as a secondary validation step.
 *
 * POST /api/users/verify-password
 * Body: { email: string, password: string }
 * Returns: { valid: boolean }
 */
export const verifyPasswordHandler = async (req: AuthRequest, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        // Look up the user's password_hash from Supabase
        const { data: user, error: dbError } = await supabase
            .from("users")
            .select("password_hash")
            .eq("email", email.toLowerCase())
            .maybeSingle();

        if (dbError) {
            console.error("Error fetching user for password verification:", dbError);
            return res.status(500).json({ message: "Internal server error." });
        }

        // If no user found, return generic invalid response (prevent user enumeration)
        if (!user) {
            return res.status(200).json({ valid: false });
        }

        // If user has no stored hash (legacy/mock user), skip bcrypt check
        if (!user.password_hash) {
            return res.status(200).json({ valid: true, skipped: true });
        }

        // Verify the password against the stored hash
        const isValid = await verifyPassword(password, user.password_hash);

        return res.status(200).json({ valid: isValid });
    } catch (error: any) {
        console.error("Error verifying password:", error);
        return res.status(500).json({ message: "Failed to verify password.", error: error.message });
    }
};
