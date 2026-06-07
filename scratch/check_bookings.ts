
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBookings() {
    const { count, error } = await supabase.from('bookings').select('*', { count: 'exact', head: true });
    console.log('Bookings Count:', count);
    if (error) console.error('Error:', error.message);
}

checkBookings();
