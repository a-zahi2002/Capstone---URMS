import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    console.log('Testing bookings join with resources...');
    const { data, error } = await supabase
      .from('bookings')
      .select('id, resource_id, resources(name, location)')
      .limit(5);
    if (error) {
        console.error('Error with resources relation:', error);
    } else {
        console.log('Query succeeded with resources relation:', data);
    }
}

testQuery();
