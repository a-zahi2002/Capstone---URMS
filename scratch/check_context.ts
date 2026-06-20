
import { getSupabaseClient } from '../backend/src/config/supabaseClient';

async function checkHeaders() {
    console.log('🔍 Checking Database Context...');

    const supabase = getSupabaseClient({ uid: 'test-user', role: 'admin' });

    try {
        const { data, error } = await supabase.rpc('get_context_debug');
        if (error) {
            // If RPC doesn't exist, try a simple select with current_setting
            const { data: data2, error: error2 } = await supabase.from('resources').select('name').limit(1);
            console.log('Resources Select Error:', error2?.message);
            
            const { data: data3, error: error3 } = await supabase.rpc('echo_headers');
             console.log('Echo Headers Error:', error3?.message);
        }
        console.log('Context Data:', data);
    } catch (err) {
        console.error('Test failed:', err);
    }
}

checkHeaders();
