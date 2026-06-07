import { Response } from "express";
import admin from "../config/firebase.config";
import { AuthRequest } from "../middleware/auth.middleware";

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
