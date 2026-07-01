import { syncAllUsers } from '../services/userSync';
import { supabase } from '../config/supabaseClient';

async function testSync() {
    console.log('--- BEFORE SYNC: Checking Supabase row count ---');
    const { count: beforeCount, error: countErr1 } = await supabase.from('users').select('*', { count: 'exact', head: true });
    console.log('Users in Supabase:', beforeCount);

    console.log('\n--- EXECUTING SYNC ---');
    const syncedUsers = await syncAllUsers();
    console.log(`Synced ${syncedUsers.length} users successfully!`);

    console.log('\n--- AFTER SYNC: Checking Supabase row count ---');
    const { count: afterCount, error: countErr2 } = await supabase.from('users').select('*', { count: 'exact', head: true });
    console.log('Users in Supabase now:', afterCount);

    console.log('\n--- Synced User Details ---');
    syncedUsers.forEach(u => {
        console.log(`- ID: ${u.id}, Email: ${u.email}, Name: ${u.name}, Role: ${u.role}, Dept: ${u.department}`);
    });

    process.exit(0);
}

testSync();
