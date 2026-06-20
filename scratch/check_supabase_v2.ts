
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Manually load .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = Object.fromEntries(
    envContent.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('=').map(s => s.trim()))
);

const supabaseUrl = envVars.SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_ANON_KEY;

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
