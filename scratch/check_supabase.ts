
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local from root
dotenv.config({ path: path.join(__dirname, '../.env.local'), override: true });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

async function checkResources() {
    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('resources').select('*');

    if (error) {
        console.error('Error fetching resources:', error);
    } else {
        console.log('Resources in Supabase:', data);
    }
}

checkResources();
