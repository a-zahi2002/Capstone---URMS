
import supabase from './src/config/supabaseClient';

async function testRealInsert() {
    console.log('Testing REAL insert into resources...');
    
    const testResource = {
        name: 'Test Resource ' + Date.now(),
        type: 'Labs',
        capacity: '10',
        location: 'Test Location',
        availability_status: 'Available'
    };

    const { data, error } = await supabase
        .from('resources')
        .insert(testResource)
        .select();

    if (error) {
        console.error('❌ Insert failed:', error.message, 'Code:', error.code);
    } else {
        console.log('✅ Insert succeeded:', data);
    }
}

testRealInsert();
