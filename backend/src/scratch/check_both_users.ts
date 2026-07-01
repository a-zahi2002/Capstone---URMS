import admin, { isFirebaseInitialized } from '../config/firebase.config';
import { supabase } from '../config/supabaseClient';

async function checkBothUsers() {
    console.log('Firebase initialized:', isFirebaseInitialized);

    // Fetch Supabase users
    const { data: dbUsers, error: dbError } = await supabase.from('users').select('*');
    if (dbError) {
        console.error('❌ Error fetching Supabase users:', dbError.message);
    } else {
        console.log(`\n✅ Found ${dbUsers?.length || 0} users in Supabase:`);
        dbUsers?.forEach(u => {
            console.log(`- ID: ${u.id}, Email: ${u.email}, Name: ${u.name}, Role: ${u.role}, Dept: ${u.department}`);
        });
    }

    // Fetch Firebase users if initialized
    if (isFirebaseInitialized) {
        try {
            const firebaseUsersResult = await admin.auth().listUsers();
            const firebaseUsers = firebaseUsersResult.users;
            console.log(`\n✅ Found ${firebaseUsers.length} users in Firebase Auth:`);
            firebaseUsers.forEach(u => {
                console.log(`- UID: ${u.uid}, Email: ${u.email}, Name: ${u.displayName}, Role (Claim): ${u.customClaims?.role}, Created: ${u.metadata.creationTime}`);
            });
        } catch (err: any) {
            console.error('❌ Error fetching Firebase users:', err.message);
        }
    } else {
        console.log('\n⚠️ Firebase Admin not initialized.');
    }
    process.exit(0);
}

checkBothUsers();
