import supabase from './src/config/supabaseClient';

async function testInsert() {
    console.log('Testing inserts...');
    
    const tables = ['resources', 'bookings', 'maintenance_tickets', 'notifications', 'reports', 'users'];
    
    for (const table of tables) {
        console.log(`Checking table: ${table}`);
        try {
            // We won't actually insert, just try to select first to see if RLS allows reading
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) {
                console.log(`  ❌ ${table} read error: ${error.message} (${error.code})`);
            } else {
                console.log(`  ✅ ${table} is readable.`);
            }
        } catch (e) {
            console.log(`  ❌ ${table} exception`);
        }
    }
}

testInsert();
