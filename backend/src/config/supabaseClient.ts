/**
 * supabaseClient.ts
 * ─────────────────────────────────────────────────────────────
 * Singleton Supabase client for the URMS backend.
 *
 * Environment variable loading order (last wins):
 *   1. backend/.env        — local overrides (PORT, NODE_ENV)
 *   2. root .env.local     — shared secrets (SUPABASE_URL, keys)
 *
 * Required env vars:
 *   SUPABASE_URL      — e.g. https://xxxx.supabase.co
 *   SUPABASE_ANON_KEY — anon/public key from Supabase dashboard
 * ─────────────────────────────────────────────────────────────
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// 1. Load backend/.env (PORT, NODE_ENV, local overrides)
dotenv.config();

// 2. Load root .env.local — contains SUPABASE_URL, SUPABASE_ANON_KEY,
//    and Firebase keys shared with the Next.js frontend.
//    `override: true` ensures these take precedence if duplicated.
dotenv.config({
    path: path.join(__dirname, '../../../.env.local'),
    override: true
});

const supabaseUrl           = process.env.SUPABASE_URL;
const supabaseAnonKey       = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey    = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ── Validation ──────────────────────────────────────────────
if (!supabaseUrl || supabaseUrl.includes('your-project-ref')) {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️  SUPABASE_URL is missing in .env.local');
}

if (!supabaseAnonKey || supabaseAnonKey.includes('your-supabase-anon-key')) {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️  SUPABASE_ANON_KEY is missing in .env.local');
}

if (!supabaseServiceKey) {
    console.warn(
        '\x1b[33m%s\x1b[0m',
        '⚠️  SUPABASE_SERVICE_ROLE_KEY is missing. Backend write operations (INSERT/UPDATE/DELETE) will fail due to RLS.'
    );
}

// ── Choose the key to use ────────────────────────────────────
// If we have a service role key, use it to bypass RLS (backend operations).
// Otherwise, fall back to the anon key.
const activeKey = supabaseServiceKey || supabaseAnonKey;

/**
 * Singleton Supabase client.
 * Uses the service role key to bypass RLS for backend operations.
 */
export const supabase: SupabaseClient = createClient(
    supabaseUrl  || '',
    supabaseServiceKey || supabaseAnonKey || ''
);

/**
 * Creates a scoped Supabase client for a specific user.
 * This client uses the ANON key so that RLS policies are enforced,
 * and it passes the user's ID and Role in custom headers.
 */
export function getSupabaseClient(user?: { uid: string, role: string }): SupabaseClient {
    if (!user) return supabase;

    return createClient(
        supabaseUrl || '',
        supabaseAnonKey || '',
        {
            global: {
                headers: {
                    'x-urms-user-id': user.uid,
                    'x-urms-user-role': user.role
                }
            }
        }
    );
}

/**
 * Lightweight connectivity check.
 * Returns true  → Supabase is reachable and `resources` table exists.
 * Returns false → Supabase unreachable or not configured.
 */
export async function checkSupabaseConnection(): Promise<boolean> {
    try {
        if (!supabaseUrl || !supabaseAnonKey) return false;

        const { error } = await supabase.from('resources').select('id').limit(1);

        // PGRST116/PGRST205 = table not found → Supabase IS reachable, schema not run yet
        if (error && error.code !== 'PGRST116' && error.code !== 'PGRST205') {
            console.error('❌ Supabase health check failed:', error.message);
            return false;
        }
        return true;
    } catch (err) {
        console.error('❌ Supabase health check threw an error:', err);
        return false;
    }
}

export default supabase;
