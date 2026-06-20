/**
 * setupSupabase.ts
 * ─────────────────────────────────────────────────────────────
 * One-shot setup script: verifies Supabase connection and
 * confirms that tables exist (schema must be applied via the
 * Supabase SQL Editor using supabase-schema.sql first).
 *
 * Run: npm run db:setup
 * ─────────────────────────────────────────────────────────────
 */
import dotenv from 'dotenv';
import path from 'path';

// Load env files in correct priority order
dotenv.config();
dotenv.config({ path: path.join(__dirname, '../../../.env.local'), override: true });

import supabase from '../config/supabaseClient';

const TABLES = ['resources', 'bookings', 'maintenance_tickets', 'notifications', 'reports'];

async function setupSupabase() {
    console.log('\n🔍 URMS — Supabase Setup Check\n');

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;

    if (!url || url.includes('your-project-ref') || !key || key.includes('your-supabase-anon-key')) {
        console.error('❌ Supabase credentials not configured.');
        console.error('   Open .env.local and set SUPABASE_URL and SUPABASE_ANON_KEY.');
        process.exit(1);
    }

    console.log(`✅ SUPABASE_URL loaded: ${url}`);
    console.log(`✅ SUPABASE_ANON_KEY loaded: ${key.slice(0, 20)}...`);
    console.log('');

    // Check each table
    let allTablesFound = true;
    for (const table of TABLES) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error && (error.code === 'PGRST116' || error.code === 'PGRST205')) {
            console.error(`  ❌ Table missing: ${table} (Please run the SQL schema first)`);
            allTablesFound = false;
        } else if (error) {
            console.warn(`  ⚠️  ${table}: ${error.message} (Code: ${error.code})`);
        } else {
            console.log(`  ✅ Table found: ${table}`);
        }
    }

    if (!allTablesFound) {
        console.error('\n❌ Some tables are missing.');
        console.error('   Run backend/src/db/supabase-schema.sql in your Supabase SQL Editor first.');
        process.exit(1);
    }

    console.log('\n✅ All tables present. Database is ready!\n');
    process.exit(0);
}

setupSupabase();
