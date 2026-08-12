import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

async function main() {
    const url = `${process.env.SUPABASE_URL}/rest/v1/`;
    console.log('Fetching OpenAPI schema from:', url);
    const response = await fetch(url, {
        headers: {
            'apikey': process.env.SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY!}`
        }
    });
    const schema: any = await response.json();
    
    // We only care about the paths and definitions related to bookings/users
    console.log('Tables:', Object.keys(schema.definitions || {}));
    if (schema.definitions && schema.definitions.bookings) {
        console.log('Bookings Definition:', JSON.stringify(schema.definitions.bookings, null, 2));
    }
    // Search for relationships or descriptions in OpenAPI
    console.log('Searching for relationship info in bookings path description:');
    if (schema.paths && schema.paths['/bookings']) {
        console.log('Bookings Path:', JSON.stringify(schema.paths['/bookings'], null, 2));
    }
}

main();
