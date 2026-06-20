/**
 * db.ts
 * ─────────────────────────────────────────────────────────────
 * Re-exports the Supabase client as the canonical `db` object.
 * Previously this re-exported the mysql2 promisePool.
 *
 * All modules that imported `db` from this path will now use
 * the Supabase client transparently.
 * ─────────────────────────────────────────────────────────────
 */
import supabase from '../config/supabaseClient';

// Expose the supabase client as the default db export so any
// remaining code that did `import db from './db'` continues
// to compile without modification.
export default supabase;