import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrphans() {
    console.log('--- Checking for orphaned rows relative to the users table ---');
    
    // Fetch all users
    const { data: users, error: usersErr } = await supabase.from('users').select('id');
    if (usersErr) {
        console.error('Error fetching users:', usersErr);
        return;
    }
    const userIds = new Set(users.map(u => u.id));
    console.log(`Found ${userIds.size} users in database.`);

    // 1. Check bookings
    const { data: bookings, error: bookingsErr } = await supabase.from('bookings').select('id, user_id');
    if (bookingsErr) {
        console.error('Error fetching bookings:', bookingsErr);
    } else {
        const orphans = bookings.filter(b => b.user_id && !userIds.has(b.user_id));
        console.log(`Bookings: ${orphans.length} orphaned rows found out of ${bookings.length} total.`);
        if (orphans.length > 0) {
            console.log('Sample orphaned booking user_ids:', orphans.slice(0, 5).map(o => o.user_id));
        }
    }

    // 2. Check maintenance_tickets
    const { data: tickets, error: ticketsErr } = await supabase.from('maintenance_tickets').select('id, created_by, assigned_to');
    if (ticketsErr) {
        console.error('Error fetching maintenance_tickets:', ticketsErr);
    } else {
        const creatorOrphans = tickets.filter(t => t.created_by && !userIds.has(t.created_by));
        const assigneeOrphans = tickets.filter(t => t.assigned_to && !userIds.has(t.assigned_to));
        console.log(`Maintenance Tickets (created_by): ${creatorOrphans.length} orphaned rows found.`);
        console.log(`Maintenance Tickets (assigned_to): ${assigneeOrphans.length} orphaned rows found.`);
    }

    // 3. Check notifications
    const { data: notifications, error: notificationsErr } = await supabase.from('notifications').select('id, user_id');
    if (notificationsErr) {
        console.error('Error fetching notifications:', notificationsErr);
    } else {
        const orphans = notifications.filter(n => n.user_id && !userIds.has(n.user_id));
        console.log(`Notifications: ${orphans.length} orphaned rows found.`);
    }

    // 4. Check reports
    const { data: reports, error: reportsErr } = await supabase.from('reports').select('id, generated_by');
    if (reportsErr) {
        console.error('Error fetching reports:', reportsErr);
    } else {
        const orphans = reports.filter(r => r.generated_by && !userIds.has(r.generated_by));
        console.log(`Reports: ${orphans.length} orphaned rows found.`);
    }
}

checkOrphans();
