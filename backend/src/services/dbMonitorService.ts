/**
 * dbMonitorService.ts
 * ─────────────────────────────────────────────────────────────
 * Background service to monitor database connectivity and 
 * attempt recovery/restart logic if a crash is detected.
 * ─────────────────────────────────────────────────────────────
 */

import { checkSupabaseConnection } from '../config/supabaseClient';
import { exec } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

let isMonitoring = false;
let monitorInterval: NodeJS.Timeout | null = null;
let isDbDown = false;

/**
 * Periodically checks the DB connection.
 * If the connection fails, it enters a "Recovery Mode" where it 
 * retries more frequently and can optionally attempt to restart
 * a local DB service if configured.
 */
export async function startDbWatchdog(intervalMs: number = 60000) {
    if (isMonitoring) return;
    isMonitoring = true;

    console.log(`[Watchdog] Database monitor started (Check every ${intervalMs / 1000}s)`);

    monitorInterval = setInterval(async () => {
        await performHealthCheck();
    }, intervalMs);
}

/**
 * Performs the actual health check and handles transitions
 */
async function performHealthCheck() {
    const isConnected = await checkSupabaseConnection();

    if (!isConnected) {
        if (!isDbDown) {
            console.error('\x1b[31m%s\x1b[0m', '[Watchdog] 🚨 CRITICAL: Database connection lost or DB crashed!');
            isDbDown = true;
            handleDbCrash();
        }
    } else {
        if (isDbDown) {
            console.log('\x1b[32m%s\x1b[0m', '[Watchdog] ✅ Database connection restored.');
            isDbDown = false;
        }
    }
}

/**
 * Logic to handle a crash (e.g., intensive retries or service restart)
 */
async function handleDbCrash() {
    const retryDelay = 5000; // 5 seconds
    const maxRetries = 12;   // Try for 1 minute before logging a "Still Down" status
    
    console.log(`[Watchdog] Attempting auto-recovery (Retrying every ${retryDelay / 1000}s)...`);

    // Optionally attempt to restart local service if on Windows and configured
    const restartCommand = process.env.DB_RESTART_COMMAND;
    if (restartCommand) {
        console.log(`[Watchdog] Executing restart command: ${restartCommand}`);
        exec(restartCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`[Watchdog] Failed to execute restart command: ${error.message}`);
                return;
            }
            console.log(`[Watchdog] Restart command output: ${stdout || 'Success'}`);
        });
    }

    let retryCount = 0;
    const retryInterval = setInterval(async () => {
        retryCount++;
        const connected = await checkSupabaseConnection();
        
        if (connected) {
            console.log('\x1b[32m%s\x1b[0m', `[Watchdog] Recovery successful after ${retryCount} attempts.`);
            isDbDown = false;
            clearInterval(retryInterval);
        } else if (retryCount >= maxRetries) {
            console.warn(`[Watchdog] Recovery still failing after ${retryCount} attempts. Will continue checking in background.`);
            clearInterval(retryInterval);
        }
    }, retryDelay);
}

/**
 * Stops the monitoring interval
 */
export function stopDbWatchdog() {
    if (monitorInterval) {
        clearInterval(monitorInterval);
        isMonitoring = false;
        console.log('[Watchdog] Database monitor stopped.');
    }
}
