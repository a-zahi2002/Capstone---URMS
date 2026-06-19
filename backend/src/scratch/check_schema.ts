import supabase from '../config/supabaseClient';

async function checkSchema() {
    console.log('--- Inspecting Supabase Database Columns ---');

    const tables = ['users', 'user_preferences', 'notifications', 'bookings', 'resources', 'maintenance_tickets', 'reports', 'report_schedules'];

    for (const table of tables) {
        console.log(`\nTable: ${table}`);
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) {
                console.error(`  ❌ Error querying table: ${error.message} (${error.code})`);
            } else {
                console.log(`  ✅ Table query succeeded.`);
                if (data && data.length > 0) {
                    console.log(`  Columns found (from sample row):`, Object.keys(data[0]));
                } else {
                    // Try to insert a dummy/empty/failed item to see columns or query a system view if possible
                    // Or let's try selecting a non-existent column to see the error message which might list columns,
                    // or just check if specific expected columns are present by selecting them.
                    console.log(`  No rows found in ${table}. Checking column presence via specific SELECTs:`);
                    
                    if (table === 'users') {
                        // Check if password_hash, department etc exist
                        const { error: colErr } = await supabase.from('users').select('id, name, email, role, department, password_hash, created_at').limit(0);
                        if (colErr) {
                            console.error(`    ❌ Columns check failed: ${colErr.message}`);
                        } else {
                            console.log(`    ✅ All expected columns (including password_hash) are present.`);
                        }
                    } else if (table === 'user_preferences') {
                        const { error: colErr } = await supabase.from('user_preferences').select('user_id, email_bookings, email_maintenance, email_system, push_bookings, push_maintenance, push_system, updated_at').limit(0);
                        if (colErr) {
                            console.error(`    ❌ Columns check failed: ${colErr.message}`);
                        } else {
                            console.log(`    ✅ All expected columns are present.`);
                        }
                    } else if (table === 'notifications') {
                        const { error: colErr } = await supabase.from('notifications').select('id, user_id, title, message, type, is_read, timestamp').limit(0);
                        if (colErr) {
                            console.error(`    ❌ Columns check failed: ${colErr.message}`);
                        } else {
                            console.log(`    ✅ All expected columns (including title) are present.`);
                        }
                    } else if (table === 'report_schedules') {
                        const { error: colErr } = await supabase.from('report_schedules').select('id, report_types, recipients, delivery_day, delivery_time, format, is_enabled, last_run_at, created_at, updated_at').limit(0);
                        if (colErr) {
                            console.error(`    ❌ Columns check failed: ${colErr.message}`);
                        } else {
                            console.log(`    ✅ All expected columns are present.`);
                        }
                    } else {
                        console.log(`    Readable, but table is empty.`);
                    }
                }
            }
        } catch (err: any) {
            console.error(`  ❌ Exception querying table: ${err.message}`);
        }
    }
}

checkSchema();
