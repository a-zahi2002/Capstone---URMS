
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBookingDetails() {
    const { data, error } = await supabase.from('bookings').select('*');
    console.log('Bookings:', JSON.stringify(data, null, 2));
    if (error) console.error('Error:', error.message);
}

checkBookingDetails();
