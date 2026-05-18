/**
 * server.ts
 * ─────────────────────────────────────────────────────────────
 * Application entry point.
 * Starts the Express server and verifies Supabase connectivity.
 * ─────────────────────────────────────────────────────────────
 */
import app from './app';
import dotenv from 'dotenv';
import { checkSupabaseConnection } from './config/supabaseClient';
import { startDbWatchdog } from './services/dbMonitorService';
import { startReportScheduler } from './services/schedulerService';
import { startBackupCron } from './cron/backup.cron';

dotenv.config();

import { createServer } from 'http';
import { initSocket } from './services/socketService';

const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

/**
 * Verify Supabase connection on startup with retry logic.
 */
async function connectWithRetry(retries = 10, delay = 5000): Promise<void> {
    const connected = await checkSupabaseConnection();

    if (connected) {
        console.log('✅ Connected to Supabase (PostgreSQL).');
        // Start the continuous monitor after initial connection
        startDbWatchdog();
        return;
    }

    if (retries > 0) {
        console.log(`⚠️  Supabase connection check failed. Retrying in ${delay / 1000}s... (${11 - retries}/10)`);
        setTimeout(() => connectWithRetry(retries - 1, delay), delay);
    } else {
        console.log(
            '\x1b[33m%s\x1b[0m',
            'ℹ️  Supabase not reachable after maximum retries. Application will run using Mock Data. Watchdog will keep trying...'
        );
        // Even if it fails initially, start the watchdog to recover when DB comes back
        startDbWatchdog();
    }
}

httpServer.listen(PORT, () => {
    console.log(`🚀 URMS Server running on http://localhost:${PORT}`);
    connectWithRetry();
    
    // Start automated background tasks
    startReportScheduler();
    startBackupCron();
});
