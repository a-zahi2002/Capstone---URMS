import admin, { isFirebaseInitialized } from '../config/firebase.config';
import { supabase } from '../config/supabaseClient';

export interface SyncedUser {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'student' | 'lecturer' | 'maintenance';
    department?: string;
    approval_status?: 'Pending' | 'Approved' | 'Rejected';
    created_at?: string;
}

/**
 * Normalizes user roles to match one of the allowed types.
 */
function normalizeRole(roleStr: string | undefined, context: string): 'admin' | 'student' | 'lecturer' | 'maintenance' {
    if (!roleStr) {
        const testStr = context.toLowerCase();
        if (testStr.includes("admin")) return "admin";
        if (testStr.includes("maintenance") || testStr.includes("technician")) return "maintenance";
        if (testStr.includes("lecturer") || testStr.includes("prof") || testStr.includes("smith")) return "lecturer";
        return "student";
    }

    const lower = roleStr.toLowerCase();
    if (lower === "admin") return "admin";
    if (lower === "lecturer" || lower === "lecture") return "lecturer";
    if (lower === "maintenance" || lower === "technician") return "maintenance";
    return "student";
}

/**
 * Synchronizes a single user's record from Firebase Auth to Supabase.
 * Updates custom claims in Firebase to match the role in Supabase if needed.
 */
export async function syncSingleUser(uid: string): Promise<SyncedUser | null> {
    if (!isFirebaseInitialized) {
        console.warn("Firebase not initialized. Skipping single user sync.");
        return null;
    }

    try {
        // 1. Fetch user metadata from Firebase Auth
        const firebaseUser = await admin.auth().getUser(uid);
        if (!firebaseUser.email) return null;

        const emailLower = firebaseUser.email.toLowerCase();

        // 2. Fetch the profile from Supabase
        const { data: dbUser, error: fetchErr } = await supabase
            .from("users")
            .select("*")
            .eq("id", uid)
            .maybeSingle();

        if (fetchErr) {
            console.error(`Error querying user ${uid} from Supabase:`, fetchErr);
            return null;
        }

        if (!dbUser) {
            // User exists in Firebase but not in Supabase. Auto-create.
            const name = firebaseUser.displayName || emailLower.split("@")[0] || "Unnamed User";
            const role = normalizeRole(firebaseUser.customClaims?.role as string, `${name} ${emailLower}`);
            const department = "Faculty of Computing"; // default fallback faculty
            const createdAt = firebaseUser.metadata.creationTime 
                ? new Date(firebaseUser.metadata.creationTime).toISOString() 
                : new Date().toISOString();

            // Set the Firebase Custom Claim if it wasn't present
            if (!firebaseUser.customClaims?.role) {
                try {
                    await admin.auth().setCustomUserClaims(uid, { role });
                    console.log(`Auto-assigned Firebase claim role "${role}" for ${emailLower}`);
                } catch (claimErr) {
                    console.error(`Failed to set custom claim for ${emailLower}:`, claimErr);
                }
            }

            const newUser: SyncedUser = {
                id: uid,
                name,
                email: emailLower,
                role,
                department,
                approval_status: 'Pending',
                created_at: createdAt
            };

            const { error: insertErr } = await supabase
                .from("users")
                .insert({
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    department: newUser.department,
                    approval_status: newUser.approval_status,
                    created_at: newUser.created_at
                });

            if (insertErr) {
                console.error(`Failed to auto-create user profile in Supabase for ${emailLower}:`, insertErr);
                return null;
            }

            console.log(`Successfully auto-created Supabase profile for ${emailLower}`);
            return newUser;
        } else {
            // User exists in both. Ensure the custom role claim matches.
            const dbRole = dbUser.role;
            const firebaseRole = firebaseUser.customClaims?.role;

            if (!firebaseRole || firebaseRole !== dbRole) {
                try {
                    await admin.auth().setCustomUserClaims(uid, { role: dbRole });
                    console.log(`Synced custom claim for existing user ${emailLower} to ${dbRole}`);
                } catch (claimErr) {
                    console.error(`Failed to sync custom claims for existing user ${emailLower}:`, claimErr);
                }
            }
            return dbUser as SyncedUser;
        }
    } catch (err: any) {
        console.error(`Failed to sync single user ${uid}:`, err);
        return null;
    }
}

/**
 * Synchronizes all users from Firebase Auth to Supabase.
 * Returns the fully synchronized list of database users.
 */
export async function syncAllUsers(): Promise<SyncedUser[]> {
    try {
        // 1. Fetch current users in Supabase
        const { data: dbUsers, error: dbError } = await supabase
            .from("users")
            .select("*")
            .order("created_at", { ascending: false });

        if (dbError) {
            console.error("Error fetching users from Supabase:", dbError);
            throw dbError;
        }

        let mergedUsers: SyncedUser[] = (dbUsers || []) as SyncedUser[];

        if (!isFirebaseInitialized) {
            console.warn("Firebase not initialized. Returning Supabase profiles only.");
            return mergedUsers;
        }

        // 2. Fetch all users from Firebase Auth
        const firebaseUsersResult = await admin.auth().listUsers();
        const firebaseUsers = firebaseUsersResult.users;

        const dbUserMapById = new Map<string, SyncedUser>(mergedUsers.map(u => [u.id, u]));
        const dbUserMapByEmail = new Map<string, SyncedUser>(mergedUsers.map(u => [u.email.toLowerCase(), u]));

        for (const firebaseUser of firebaseUsers) {
            if (!firebaseUser.email) continue;
            const emailLower = firebaseUser.email.toLowerCase();

            // Match by UID or by Email
            let dbUser = dbUserMapById.get(firebaseUser.uid) || dbUserMapByEmail.get(emailLower);

            if (!dbUser) {
                // User exists in Firebase Auth but has no profile in Supabase. Auto-create it.
                const name = firebaseUser.displayName || emailLower.split("@")[0] || "Unnamed User";
                const role = normalizeRole(firebaseUser.customClaims?.role as string, `${name} ${emailLower}`);
                const department = "Faculty of Computing";
                const createdAt = firebaseUser.metadata.creationTime 
                    ? new Date(firebaseUser.metadata.creationTime).toISOString() 
                    : new Date().toISOString();

                // Set Firebase claim if missing
                if (!firebaseUser.customClaims?.role) {
                    try {
                        await admin.auth().setCustomUserClaims(firebaseUser.uid, { role });
                        console.log(`Auto-assigned Firebase claim role "${role}" for ${emailLower}`);
                    } catch (claimErr) {
                        console.error(`Failed to set custom claim during bulk creation for ${emailLower}:`, claimErr);
                    }
                }

                const newUser: SyncedUser = {
                    id: firebaseUser.uid,
                    name,
                    email: emailLower,
                    role,
                    department,
                    approval_status: 'Pending',
                    created_at: createdAt
                };

                const { error: insertErr } = await supabase
                    .from("users")
                    .insert({
                        id: newUser.id,
                        name: newUser.name,
                        email: newUser.email,
                        role: newUser.role,
                        department: newUser.department,
                        approval_status: newUser.approval_status,
                        created_at: newUser.created_at
                    });

                if (insertErr) {
                    console.error(`Failed to auto-insert Firebase user ${emailLower} into Supabase:`, insertErr);
                } else {
                    console.log(`Auto-created missing profile in Supabase for ${emailLower}`);
                    mergedUsers.push(newUser);
                    dbUserMapById.set(newUser.id, newUser);
                    dbUserMapByEmail.set(newUser.email, newUser);
                }
            } else {
                // User exists in both systems. Check if ID or role claim needs synchronization.
                
                // If matched by email but ID didn't match (e.g. dev/mock ID mismatch), sync ID.
                if (dbUser.id !== firebaseUser.uid) {
                    console.log(`Syncing ID for ${emailLower}: DB ID=${dbUser.id} -> Firebase UID=${firebaseUser.uid}`);
                    const { error: updateIdErr } = await supabase
                        .from("users")
                        .update({ id: firebaseUser.uid })
                        .eq("email", emailLower);

                    if (!updateIdErr) {
                        dbUser.id = firebaseUser.uid;
                    } else {
                        console.error(`Failed to update DB ID for ${emailLower}:`, updateIdErr);
                    }
                }

                const dbRole = dbUser.role;
                const firebaseRole = firebaseUser.customClaims?.role;

                if (!firebaseRole || firebaseRole !== dbRole) {
                    try {
                        await admin.auth().setCustomUserClaims(firebaseUser.uid, { role: dbRole });
                        console.log(`Synced claims role "${dbRole}" for ${emailLower}`);
                    } catch (claimErr) {
                        console.error(`Failed to sync claims role for ${emailLower}:`, claimErr);
                    }
                }
            }
        }

        // Sort by created_at descending
        mergedUsers.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        });

        return mergedUsers;
    } catch (err: any) {
        console.error("Bulk user sync error:", err);
        return [];
    }
}
