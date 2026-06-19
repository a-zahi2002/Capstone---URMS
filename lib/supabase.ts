import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function setSupabaseAuthHeaders(userId: string, role: string) {
  const client = supabase as any;
  if (client.rest) {
    client.rest.headers = {
      ...client.rest.headers,
      "x-urms-user-id": userId,
      "x-urms-user-role": role,
    };
  }
}

export function clearSupabaseAuthHeaders() {
  const client = supabase as any;
  if (client.rest) {
    delete client.rest.headers["x-urms-user-id"];
    delete client.rest.headers["x-urms-user-role"];
  }
}

export type UserRole = "admin" | "lecturer" | "student" | "maintenance";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  password_hash?: string;
  created_at: string;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", uid)
    .maybeSingle();

  if (error) {
    // Log full error details for debugging
    console.error("Error fetching user profile:", JSON.stringify(error, null, 2));
    return null;
  }

  // data is null when no matching row exists (new user without a profile yet)
  return data as UserProfile | null;
}

export async function createUserProfile(profile: Omit<UserProfile, "created_at">) {
  // Build the profile data, only including password_hash if it's provided
  const profileData: Record<string, unknown> = { ...profile };
  if (!profileData.password_hash) {
    delete profileData.password_hash;
  }

  const { error } = await supabase.from("users").upsert(profileData);
  if (error) {
    console.error("Error creating user profile:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to create user profile: ${error.message || JSON.stringify(error)}`);
  }
}
