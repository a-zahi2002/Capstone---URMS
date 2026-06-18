
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testJoin() {
    const { data, error, count } = await supabase
        .from('maintenance_tickets')
        .select('*, resources!inner(department)', { count: 'exact' });
    
    console.log('Error:', error);
    console.log('Count:', count);
    console.log('Data sample:', data?.[0]);
}

testJoin();
