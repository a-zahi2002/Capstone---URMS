/**
 * seed.ts  (Clean Setup Version - Admin Only)
 * ─────────────────────────────────────────────────────────────
 * Cleans up all Firebase Auth and Supabase database records,
 * registers only one default Admin user (other users are manually
 * created from Admin User Management), and seeds resources.
 * 
 * Run with: npm run seed
 * ─────────────────────────────────────────────────────────────
 */
import admin, { isFirebaseInitialized } from '../config/firebase.config';
import supabase from '../config/supabaseClient';
import { hashPassword } from '../services/password.service';

async function seed() {
    console.log('🌱 Starting clean database setup & seeding (RLS-Aware)...');

    try {
        const createdUsers: Record<string, string> = {}; // role -> uid
        const usersToCreate = [
            { email: 'admin@demo.lk', password: 'Password123', displayName: 'System Admin', role: 'admin', department: 'Faculty of Computing' },
            { email: 'lecturer@demo.lk', password: 'Password123', displayName: 'Demo Lecturer', role: 'lecturer', department: 'Faculty of Computing' },
            { email: 'student@demo.lk', password: 'Password123', displayName: 'Demo Student', role: 'student', department: 'Faculty of Applied Sciences' },
            { email: 'maintenance@demo.lk', password: 'Password123', displayName: 'Demo Maintenance', role: 'maintenance', department: 'Faculty of Computing' },
        ];

        // ── 1. Clean up Firebase Auth Users ──────────────────────────
        if (isFirebaseInitialized) {
            console.log('Cleaning up existing Firebase Auth users...');
            let nextPageToken;
            let totalDeleted = 0;
            do {
                const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
                const uids = listUsersResult.users.map((user) => user.uid);
                if (uids.length > 0) {
                    await admin.auth().deleteUsers(uids);
                    totalDeleted += uids.length;
                }
                nextPageToken = listUsersResult.pageToken;
            } while (nextPageToken);
            console.log(`✅ Deleted ${totalDeleted} users from Firebase Auth.`);

            // Create users in Firebase Auth
            console.log('Creating admin user in Firebase Auth...');
            for (const u of usersToCreate) {
                const userRecord = await admin.auth().createUser({
                    email: u.email,
                    password: u.password,
                    displayName: u.displayName,
                    emailVerified: true
                });
                await admin.auth().setCustomUserClaims(userRecord.uid, { role: u.role });
                createdUsers[u.role] = userRecord.uid;
                console.log(`  - Created ${u.role} user: ${u.email} (UID: ${userRecord.uid})`);
            }
        } else {
            console.warn('⚠️ Firebase Admin not initialized. Creating mock fallback UIDs.');
            createdUsers['admin'] = 'mock-admin';
        }

        // ── 2. Clear Supabase Database (order respects FK constraints) ──
        console.log('Clearing existing data from Supabase...');
        await supabase.from('user_preferences').delete().neq('user_id', 'placeholder');
        await supabase.from('reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('maintenance_tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('resources').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('users').delete().neq('id', 'placeholder');
        console.log('✅ Existing Supabase data cleared.');

        // ── 3. Insert Users into Supabase ────────────────────────────
        console.log('Inserting admin user in Supabase...');
        const dbUsersPayload = [];
        for (const u of usersToCreate) {
            const uid = createdUsers[u.role];
            const passwordHash = await hashPassword(u.password);
            dbUsersPayload.push({
                id: uid,
                name: u.displayName,
                email: u.email,
                role: u.role,
                department: u.department,
                password_hash: passwordHash
            });
        }
        const { error: userErr } = await supabase.from('users').insert(dbUsersPayload);
        if (userErr) throw userErr;
        console.log('✅ Admin user inserted in Supabase.');

        // ── 4. Insert Default User Preferences ────────────────────────
        console.log('Inserting user preferences...');
        const prefPayload = dbUsersPayload.map(user => ({
            user_id: user.id,
            email_bookings: true,
            email_maintenance: true,
            email_system: true,
            push_bookings: true,
            push_maintenance: true,
            push_system: true
        }));
        const { error: prefErr } = await supabase.from('user_preferences').insert(prefPayload);
        if (prefErr) throw prefErr;
        console.log('✅ User preferences inserted.');

        // ── 5. Insert Resources ──────────────────────────────────────
        console.log('Inserting minimal resources...');
        const { data: resources, error: resErr } = await supabase
            .from('resources')
            .insert([
                { name: 'Lecture Hall 01',  type: 'Lecture Halls', capacity: 150, location: 'Block B',       availability_status: 'Available',   department: 'Faculty of Computing',        equipment: ['Projector', 'Whiteboard', 'AC'] },
                { name: 'Physics Lab',      type: 'Labs',          capacity: 40,  location: 'Science Block', availability_status: 'Available',   department: 'Faculty of Applied Sciences', equipment: ['Oscilloscopes', 'Multimeters'] },
                { name: 'Meeting Room A',   type: 'Rooms',         capacity: 20,  location: 'Admin Block',   availability_status: 'Available',   department: 'Faculty of Management',       equipment: ['Conference Phone', 'Display Screen'] },
                { name: 'Faculty Van 01',   type: 'Vehicles',      capacity: 14,  location: 'Transport Pool',availability_status: 'Available',   department: 'Faculty of Engineering',      equipment: ['GPS', 'AC'] },
                { name: 'Seminar Room 2',   type: 'Rooms',         capacity: 30,  location: 'Block C',       availability_status: 'Under Maintenance', department: 'Faculty of Applied Sciences', equipment: ['Smart Board'] },
            ])
            .select();

        if (resErr) throw resErr;
        console.log(`✅ ${resources?.length} resources inserted.`);

        // ── 6. Insert Notifications ──────────────────────────────────
        console.log('Inserting welcome notification...');
        const adminUid = createdUsers['admin'];
        const { error: notifErr } = await supabase.from('notifications').insert([
            { user_id: adminUid,        title: 'System Initialized', message: 'UniLink URMS database has been cleaned and set up with resources.', type: 'success' },
        ]);
        if (notifErr) throw notifErr;
        console.log('✅ Notifications inserted.');

        // ── 7. Insert empty report schedule ─────────────────────────
        console.log('Inserting empty report schedules...');
        await supabase.from('report_schedules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error: schedErr } = await supabase.from('report_schedules').insert([
            { report_types: ['overview'], recipients: ['admin@demo.lk'], delivery_day: 1, delivery_time: '09:00:00', format: 'pdf', is_enabled: true }
        ]);
        if (schedErr) throw schedErr;
        console.log('✅ Report schedules inserted.');

        console.log('\n🎉 Clean setup completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during setup:', error);
        process.exit(1);
    }
}

seed();
