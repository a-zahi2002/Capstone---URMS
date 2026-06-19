import supabase from '../config/supabaseClient';

async function listUsers() {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
        console.error('Error fetching users:', error);
    } else {
        console.log('Users in DB:', data);
    }
}
listUsers();
