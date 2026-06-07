
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const { data: resData } = await supabase.from('resources').select('id, name, availability_status');
    console.log('Resources Availability Statuses:', resData?.map(r => r.availability_status));
}

checkData();
