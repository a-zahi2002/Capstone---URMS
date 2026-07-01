import { Response } from "express";
import admin, { isFirebaseInitialized } from "../config/firebase.config";
import { AuthRequest } from "../middleware/auth.middleware";
import { hashPassword, verifyPassword } from "../services/password.service";
import { supabase } from "../config/supabaseClient";
import { syncAllUsers, syncSingleUser } from "../services/userSync";

export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            return res.status(401).json({ status: "error", message: "Unauthorized" });
        }

        // Auto-sync user profile to Supabase and ensure claims are correct
        const syncedUser = await syncSingleUser(uid);
        const userRecord = await admin.auth().getUser(uid);
        
        const profileData = {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || "",
            photoURL: userRecord.photoURL || "",
            role: userRecord.customClaims?.role || syncedUser?.role || "user",
            metadata: userRecord.metadata,
        };

        return res.status(200).json({
            status: "success",
            ...profileData,
            data: profileData
        });
    } catch (error: any) {
        console.error("Error fetching user profile:", error);
        return res.status(500).json({ status: "error", message: "Failed to fetch profile", error: error.message });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            return res.status(401).json({ status: "error", message: "Unauthorized" });
        }

        const { displayName, phone } = req.body;

        let updatedUser: any = { uid, displayName };
        if (isFirebaseInitialized) {
            updatedUser = await admin.auth().updateUser(uid, {
                displayName: displayName,
            });
        }

        // Update name and phone in Supabase users table
        const { error: dbError } = await supabase
            .from("users")
            .update({
                name: displayName,
                phone: phone
            })
            .eq("id", uid);

        if (dbError) throw dbError;

        const userObj = {
            uid: updatedUser.uid,
            email: updatedUser.email || req.user?.email || "",
            displayName: updatedUser.displayName,
            photoURL: updatedUser.photoURL || "",
            role: updatedUser.customClaims?.role || req.user?.role || "user",
            phone: phone
        };

        return res.status(200).json({
            status: "success",
            message: "Profile updated successfully",
            user: userObj,
            data: { user: userObj }
        });
    } catch (error: any) {
        console.error("Error updating user profile:", error);
        return res.status(500).json({ status: "error", message: "Failed to update profile", error: error.message });
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
            return res.status(400).json({ status: "error", message: "Password is required." });
        }

        if (password.length < 8) {
            return res.status(400).json({ status: "error", message: "Password must be at least 8 characters long." });
        }

        const password_hash = await hashPassword(password);

        return res.status(200).json({ status: "success", password_hash, data: { password_hash } });
    } catch (error: any) {
        console.error("Error hashing password:", error);
        return res.status(500).json({ status: "error", message: "Failed to hash password.", error: error.message });
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
            return res.status(400).json({ status: "error", message: "Email and password are required." });
        }

        // Look up the user's password_hash from Supabase
        const { data: user, error: dbError } = await supabase
            .from("users")
            .select("password_hash")
            .eq("email", email.toLowerCase())
            .maybeSingle();

        if (dbError) {
            console.error("Error fetching user for password verification:", dbError);
            return res.status(500).json({ status: "error", message: "Internal server error." });
        }

        // If no user found, return generic invalid response (prevent user enumeration)
        if (!user) {
            return res.status(200).json({ status: "success", valid: false, data: { valid: false } });
        }

        // If user has no stored hash (legacy/mock user), skip bcrypt check
        if (!user.password_hash) {
            return res.status(200).json({ status: "success", valid: true, skipped: true, data: { valid: true, skipped: true } });
        }

        // Verify the password against the stored hash
        const isValid = await verifyPassword(password, user.password_hash);

        return res.status(200).json({ status: "success", valid: isValid, data: { valid: isValid } });
    } catch (error: any) {
        console.error("Error verifying password:", error);
        return res.status(500).json({ status: "error", message: "Failed to verify password.", error: error.message });
    }
};

/**
 * Get all users from database (Admin only)
 */
export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        // Fetch users directly from Supabase database for instantaneous loading
        const { data: users, error: dbError } = await supabase
            .from("users")
            .select("*")
            .order("created_at", { ascending: false });

        if (dbError) throw dbError;

        // Trigger synchronization with Firebase in the background so it doesn't block the response
        if (isFirebaseInitialized) {
            syncAllUsers().catch((syncErr) => {
                console.error("❌ Background syncAllUsers failed:", syncErr);
            });
        }

        return res.status(200).json({ status: "success", data: users || [] });
    } catch (error: any) {
        console.error("Error fetching all users:", error);
        return res.status(500).json({ status: "error", message: "Failed to fetch users", error: error.message });
    }
};

/**
 * Create a new user (Admin only)
 */
export const adminCreateUser = async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, role, department, password, phone } = req.body;

        if (!name || !email || !role || !department || !password) {
            return res.status(400).json({ status: "error", message: "All fields are required (name, email, role, department, password)." });
        }

        const validRoles = ["admin", "lecturer", "student", "maintenance"];
        if (!validRoles.includes(role.toLowerCase())) {
            return res.status(400).json({ status: "error", message: `Invalid role. Must be one of ${validRoles.join(", ")}.` });
        }

        let uid = "";
        let firebaseCreated = false;

        if (isFirebaseInitialized) {
            try {
                const userRecord = await admin.auth().createUser({
                    email: email.toLowerCase(),
                    password: password,
                    displayName: name,
                    emailVerified: true
                });
                uid = userRecord.uid;
                firebaseCreated = true;

                // Set Firebase Custom Claims for Role
                await admin.auth().setCustomUserClaims(uid, { role: role.toLowerCase() });
            } catch (err: any) {
                console.error("Error creating user in Firebase Auth:", err);
                return res.status(500).json({ status: "error", message: "Failed to create user in Firebase Auth.", error: err.message });
            }
        } else {
            // Dev mode fallback
            uid = `dev-${Date.now()}`;
            console.warn(`Firebase Admin not initialized. Generated mock UID: ${uid}`);
        }

        // Hash password for local db check fallback
        const passwordHash = await hashPassword(password);

        // Save profile in Supabase
        const { error: dbError } = await supabase
            .from("users")
            .insert({
                id: uid,
                name,
                email: email.toLowerCase(),
                role: role.toLowerCase(),
                department,
                password_hash: passwordHash,
                phone: phone || null,
                approval_status: "Approved" // Admin-created members are Approved by default
            });

        if (dbError) {
            console.error("Error inserting user in Supabase:", dbError);
            // Rollback Firebase user if created
            if (firebaseCreated && isFirebaseInitialized) {
                await admin.auth().deleteUser(uid).catch(err => console.error("Failed to rollback Firebase user:", err));
            }
            return res.status(500).json({ status: "error", message: "Failed to create user profile in database.", error: dbError.message });
        }

        return res.status(201).json({
            status: "success",
            message: "User created successfully.",
            data: {
                id: uid,
                name,
                email,
                role: role.toLowerCase(),
                department,
                phone: phone || null,
                approval_status: "Approved"
            }
        });
    } catch (error: any) {
        console.error("Error in adminCreateUser:", error);
        return res.status(500).json({ status: "error", message: "Failed to create user.", error: error.message });
    }
};

/**
 * Update user details (Admin only)
 */
export const adminUpdateUser = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name, role, department, password, phone, approval_status } = req.body;

        if (!name || !role || !department) {
            return res.status(400).json({ status: "error", message: "Name, role, and department are required." });
        }

        const validRoles = ["admin", "lecturer", "student", "maintenance"];
        if (!validRoles.includes(role.toLowerCase())) {
            return res.status(400).json({ status: "error", message: `Invalid role. Must be one of ${validRoles.join(", ")}.` });
        }

        // Check if user exists in DB first
        const { data: existingUser, error: checkError } = await supabase
            .from("users")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (checkError || !existingUser) {
            return res.status(404).json({ status: "error", message: "User not found in database." });
        }

        if (isFirebaseInitialized && !id.startsWith("dev-")) {
            try {
                // Update Firebase Auth details
                await admin.auth().updateUser(id, {
                    displayName: name,
                    ...(password ? { password } : {})
                });

                // Update claims if role has changed
                if (existingUser.role !== role.toLowerCase()) {
                    await admin.auth().setCustomUserClaims(id, { role: role.toLowerCase() });
                }
            } catch (err: any) {
                console.error("Error updating user in Firebase Auth:", err);
                return res.status(500).json({ status: "error", message: "Failed to update user in Firebase Auth.", error: err.message });
            }
        }

        // Hash new password if provided
        let passwordHash = undefined;
        if (password) {
            passwordHash = await hashPassword(password);
        }

        // Update profile in Supabase
        const { error: dbError } = await supabase
            .from("users")
            .update({
                name,
                role: role.toLowerCase(),
                department,
                phone: phone !== undefined ? phone : undefined,
                approval_status: approval_status !== undefined ? approval_status : undefined,
                ...(passwordHash ? { password_hash: passwordHash } : {})
            })
            .eq("id", id);

        if (dbError) {
            console.error("Error updating user in Supabase:", dbError);
            return res.status(500).json({ status: "error", message: "Failed to update user profile in database.", error: dbError.message });
        }

        return res.status(200).json({
            status: "success",
            message: "User updated successfully.",
            data: {
                id,
                name,
                role: role.toLowerCase(),
                department,
                phone,
                approval_status,
            }
        });
    } catch (error: any) {
        console.error("Error in adminUpdateUser:", error);
        return res.status(500).json({ status: "error", message: "Failed to update user.", error: error.message });
    }
};

/**
 * Delete a user (Admin only)
 */
export const adminDeleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;

        // Check if user exists
        const { data: existingUser, error: checkError } = await supabase
            .from("users")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (checkError || !existingUser) {
            return res.status(404).json({ status: "error", message: "User not found." });
        }

        // Delete from Firebase Auth if initialized and not a mock/dev user
        if (isFirebaseInitialized && !id.startsWith("dev-")) {
            try {
                await admin.auth().deleteUser(id);
            } catch (err: any) {
                if (err.code === "auth/user-not-found") {
                    console.warn(`User ${id} not found in Firebase Auth, proceeding with DB deletion.`);
                } else {
                    console.error("Error deleting user from Firebase Auth:", err);
                    return res.status(500).json({ status: "error", message: "Failed to delete user from Firebase Auth.", error: err.message });
                }
            }
        }

        // Delete from Supabase
        const { error: dbError } = await supabase
            .from("users")
            .delete()
            .eq("id", id);

        if (dbError) {
            console.error("Error deleting user from Supabase:", dbError);
            return res.status(500).json({ status: "error", message: "Failed to delete user profile from database.", error: dbError.message });
        }

        return res.status(200).json({
            status: "success",
            message: "User deleted successfully."
        });
    } catch (error: any) {
        console.error("Error in adminDeleteUser:", error);
        return res.status(500).json({ status: "error", message: "Failed to delete user.", error: error.message });
    }
};
