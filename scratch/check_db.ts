
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const { data: mtData } = await supabase.from('maintenance_tickets').select('*');
    const { data: resData } = await supabase.from('resources').select('id, name, department');
    
    console.log('Resources:', JSON.stringify(resData, null, 2));
    console.log('Maintenance Tickets:', JSON.stringify(mtData, null, 2));

    const missingIds = [];
    for (const ticket of mtData || []) {
        if (!resData?.find(r => r.id === ticket.resource_id)) {
            missingIds.push(ticket.resource_id);
        }
    }
    console.log('Missing Resource IDs:', missingIds);
}

checkData();
