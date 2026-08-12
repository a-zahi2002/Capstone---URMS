/**
 * migrate.ts
 * ─────────────────────────────────────────────────────────────
 * Automated database migration runner for UniLink URMS.
 * Runs SQL scripts sequentially and maintains a schema_migrations
 * table to guarantee idempotency and rollback capabilities.
 *
 * Requirements:
 *   DATABASE_URL must be defined in root .env.local or backend/.env.
 *   Format: postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
 * ─────────────────────────────────────────────────────────────
 */
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// 1. Load env configurations (consistent with backend startup)
dotenv.config();
dotenv.config({ path: path.join(__dirname, '../../../.env.local'), override: true });

const connectionString = process.env.DATABASE_URL;

async function runMigrations() {
    console.log('🚀 URMS Database Migration Runner Starting...');

    if (!connectionString) {
        console.error('\n❌ DATABASE_URL is missing in environment variables.');
        console.error('   Please add the direct PostgreSQL connection string to your root .env.local file:');
        console.error('   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres\n');
        process.exit(1);
    }

    // Determine command-line options
    const isRollback = process.argv.includes('--rollback') || process.argv.includes('-r');

    const client = new Client({
        connectionString,
        ssl: connectionString.includes('supabase.co') || connectionString.includes('pooler.supabase.com')
            ? { rejectUnauthorized: false }
            : undefined
    });

    try {
        console.log('🔌 Connecting to PostgreSQL database...');
        await client.connect();
        console.log('✅ Connected successfully!');

        // 2. Ensure schema_migrations table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        // 3. Scan migrations directory
        const migrationsDir = path.join(__dirname, 'migrations');
        if (!fs.existsSync(migrationsDir)) {
            console.error(`❌ Migrations directory not found at: ${migrationsDir}`);
            process.exit(1);
        }

        const files = fs.readdirSync(migrationsDir);
        
        if (isRollback) {
            // ROLLBACK FLOW
            console.log('🔄 Initiating Rollback sequence...');
            
            // Get last applied migration
            const res = await client.query('SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1;');
            
            if (res.rows.length === 0) {
                console.log('✨ No migrations applied yet. Nothing to roll back.');
                return;
            }

            const lastVersion = res.rows[0].version;
            const rollbackFile = files.find(f => f.startsWith(lastVersion) && f.endsWith('.down.sql'));

            if (!rollbackFile) {
                console.error(`❌ Rollback file for version ${lastVersion} not found in ${migrationsDir}`);
                process.exit(1);
            }

            console.log(`⏳ Reverting migration: ${rollbackFile}...`);
            const filePath = path.join(migrationsDir, rollbackFile);
            const sql = fs.readFileSync(filePath, 'utf8');

            await client.query('BEGIN;');
            await client.query(sql);
            await client.query('DELETE FROM schema_migrations WHERE version = $1;', [lastVersion]);
            await client.query('COMMIT;');

            console.log(`✅ Rollback of migration version ${lastVersion} completed successfully!`);
        } else {
            // FORWARD MIGRATION FLOW
            console.log('⏳ Scanning pending migrations...');

            const upMigrations = files
                .filter(f => f.endsWith('.up.sql'))
                .sort((a, b) => a.localeCompare(b)); // Sort alphabetically

            // Fetch already applied migrations
            const res = await client.query('SELECT version FROM schema_migrations;');
            const appliedVersions = new Set(res.rows.map(row => row.version));

            let appliedCount = 0;
            for (const file of upMigrations) {
                const version = file.split('_')[0]; // Extract XXXX prefix

                if (appliedVersions.has(version)) {
                    // Already applied, skip
                    continue;
                }

                console.log(`⏳ Applying migration: ${file}...`);
                const filePath = path.join(migrationsDir, file);
                const sql = fs.readFileSync(filePath, 'utf8');

                await client.query('BEGIN;');
                await client.query(sql);
                await client.query('INSERT INTO schema_migrations (version) VALUES ($1);', [version]);
                await client.query('COMMIT;');

                console.log(`✅ Migration ${version} (${file}) applied successfully!`);
                appliedCount++;
            }

            if (appliedCount === 0) {
                console.log('✨ Database is already up to date. No pending migrations.');
            } else {
                console.log(`\n🎉 Migrations complete! Applied ${appliedCount} schema file(s).`);
            }
        }
    } catch (err: any) {
        console.error('\n❌ Migration execution failed!');
        console.error('   Error details:', err.message);
        
        try {
            await client.query('ROLLBACK;');
        } catch (rollErr) {
            // Ignore rollback errors if transaction wasn't active
        }
        
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔌 Connection to database closed.\n');
    }
}

runMigrations();
