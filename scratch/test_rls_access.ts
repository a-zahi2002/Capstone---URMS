
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRLS() {
    console.log('Testing with ANON key (no headers)...');
    const { data, error } = await supabase.from('maintenance_tickets').select('*');
    console.log('Data (Anon):', data?.length);
    console.log('Error (Anon):', error);

    console.log('\nTesting with ANON key + x-urms headers...');
    const supabaseWithHeaders = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                'x-urms-user-id': 'dev-user',
                'x-urms-user-role': 'admin'
            }
        }
    });
    const { data: data2, error: error2 } = await supabaseWithHeaders.from('maintenance_tickets').select('*');
    console.log('Data (With Headers):', data2?.length);
    console.log('Error (With Headers):', error2);
}

testRLS();
