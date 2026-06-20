import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
// Also try loading from root .env.local
dotenv.config({ path: path.join(__dirname, '../../../.env.local') });

let isFirebaseInitialized = false;

let serviceAccount: any = null;

// 1. Try loading from serviceAccountKey.json file
try {
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    serviceAccount = require(serviceAccountPath);
} catch (error) {
    // 2. If file missing, try loading from environment variables
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        
        // Remove any surrounding quotes
        privateKey = privateKey.trim().replace(/^['"]|['"]$/g, '');
        
        // Replace literal \n with real newlines
        privateKey = privateKey.replace(/\\n/g, '\n');
        
        // Sometimes double backslashes occur
        privateKey = privateKey.replace(/\\\\n/g, '\n');

        serviceAccount = {
            project_id: process.env.FIREBASE_PROJECT_ID,
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            private_key: privateKey.trim(),
        };
    }
}

if (serviceAccount) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        isFirebaseInitialized = true;
        console.log('✅ Firebase Admin initialized successfully');
    } catch (error) {
        console.error('❌ Firebase Admin initialization failed:', error);
    }
} else {
    if (process.env.NODE_ENV === 'development') {
        console.log('\x1b[33m%s\x1b[0m', 'ℹ️  Firebase Admin not initialized. Auth bypass active for DEV mode.');
    } else {
        console.error('❌ Firebase Admin initialization failed: No credentials provided.');
    }
}

export { isFirebaseInitialized };
export default admin;
