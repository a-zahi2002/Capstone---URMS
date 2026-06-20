
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listPolicies() {
    const { data, error } = await supabase.rpc('get_policies'); // unlikely to work
    if (error) {
        // Try querying pg_policy directly
        const { data: policies, error: polError } = await supabase.from('pg_policies').select('*');
        if (polError) {
             // Try a direct SQL query via a temp function or just check if we can read it
             console.log('Could not read pg_policies directly. This is expected on restricted Supabase projects.');
             console.log('Error:', polError.message);
        } else {
            console.log('Policies:', policies);
        }
    } else {
        console.log('Policies (RPC):', data);
    }
}

listPolicies();
