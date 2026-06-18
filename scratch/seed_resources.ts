
import { getSupabaseClient } from '../backend/src/config/supabaseClient';

async function seedResources() {
    console.log('🌱 Seeding Resources Only...');

    // Use a client with admin role to bypass RLS restrictions
    const supabase = getSupabaseClient({ uid: 'seed-runner', role: 'admin' });

    try {
        console.log('Inserting Resources...');
        const { data, error } = await supabase
            .from('resources')
            .upsert([
                { name: 'Lecture Hall 01',  type: 'Lecture Halls', capacity: '150', location: 'Block B',       availability_status: 'Available', equipment: ['Projector', 'Whiteboard', 'AC'] },
                { name: 'Physics Lab',      type: 'Labs',          capacity: '40',  location: 'Science Block', availability_status: 'Available', equipment: ['Oscilloscopes', 'Multimeters'] },
                { name: 'Mini Auditorium',  type: 'Lecture Halls', capacity: '200', location: 'Main Building', availability_status: 'Available', equipment: ['Sound System', 'Projector', 'Stage'] },
                { name: 'Meeting Room A',   type: 'Rooms',         capacity: '20',  location: 'Admin Block',   availability_status: 'Available', equipment: ['Conference Phone', 'Display Screen'] },
                { name: 'Chemistry Lab',    type: 'Labs',          capacity: '50',  location: 'Science Block', availability_status: 'Available', equipment: ['Fume Hoods', 'Microscopes'] },
                { name: 'Computer Lab 01',  type: 'Labs',          capacity: '60',  location: 'IT Center',     availability_status: 'Available', equipment: ['60 PCs', 'Projector', 'High-Speed Internet'] },
                { name: 'Faculty Van 01',   type: 'Vehicles',      capacity: '14',  location: 'Transport Pool',availability_status: 'Available', equipment: ['GPS', 'AC'] },
                { name: 'Projector X1',     type: 'Equipment',     capacity: '1',   location: 'IT Desk',       availability_status: 'Available', equipment: ['VGA Cable', 'Remote'] },
                { name: 'Seminar Room 2',   type: 'Rooms',         capacity: '30',  location: 'Block C',       availability_status: 'Maintenance', equipment: ['Smart Board'] },
                { name: 'Hall 7',           type: 'Lecture Halls', capacity: '100', location: 'Block D',       availability_status: 'Booked',    equipment: ['Projector'] },
            ], { onConflict: 'name' });

        if (error) throw error;
        console.log('✅ Resources seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding resources:', error);
        process.exit(1);
    }
}

seedResources();
