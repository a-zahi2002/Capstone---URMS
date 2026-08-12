import admin from '../config/firebase.config';

/**
 * Utility script to set Firebase Custom Claims for a user.
 * 
 * Usage: 
 * Run this script using ts-node or compile it and run with node.
 * You can pass the UID and the role as arguments, or hardcode them below for quick use.
 * 
 * Example command:
 * npx ts-node src/scripts/setCustomClaims.ts <TARGET_UID> <ROLE>
 */

const setCustomUserClaims = async (uid: string, role: string) => {
    try {
        console.log(`Setting role '${role}' for user UID: ${uid}...`);

        // Set the custom claims
        await admin.auth().setCustomUserClaims(uid, { role });

        // Verify it was set
        const userRecord = await admin.auth().getUser(uid);
        console.log('✅ Successfully set custom claims!');
        console.log('Current custom claims:', userRecord.customClaims);
        
        console.log('\nNOTE: The user must sign out and sign back in (or force token refresh) for the new claim to propagate to their ID Token.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting custom claims:', error);
        process.exit(1);
    }
};

// --- Execution ---

const args = process.argv.slice(2);
const targetUid = args[0] || 'REPLACE_WITH_ACTUAL_UID'; // e.g., 'abc123xyz'
const targetRole = args[1] || 'admin';                 // 'admin', 'lecturer', 'maintenance', 'student'

if (targetUid === 'REPLACE_WITH_ACTUAL_UID') {
    console.error('Please provide a valid UID.');
    console.error('Usage: npx ts-node src/scripts/setCustomClaims.ts <UID> <ROLE>');
    process.exit(1);
}

setCustomUserClaims(targetUid, targetRole);
