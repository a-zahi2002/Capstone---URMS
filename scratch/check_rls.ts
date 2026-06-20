
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
    const { data, error } = await supabase.rpc('get_policies'); // This might not exist
    if (error) {
        // Fallback: check if table has RLS enabled via postgres info
        console.log('Querying pg_tables for RLS status...');
        const { data: rlsData, error: rlsError } = await supabase.from('pg_tables').select('tablename, rowsecurity').eq('schemaname', 'public');
        console.log('RLS Status:', rlsData);
    } else {
        console.log('Policies:', data);
    }
}

checkRLS();
