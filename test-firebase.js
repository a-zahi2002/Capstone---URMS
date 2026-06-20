// Quick Firebase Admin init test
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Missing env vars. Found:', { projectId: !!projectId, clientEmail: !!clientEmail, privateKey: !!privateKey });
  process.exit(1);
}

// Same transforms as firebase.config.ts
privateKey = privateKey.trim().replace(/^['"]|['"]$/g, '');
privateKey = privateKey.replace(/\\n/g, '\n');
privateKey = privateKey.replace(/\\\\n/g, '\n');

const admin = require('firebase-admin');

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey.trim(),
    })
  });
  console.log('✅ Firebase Admin initialized successfully!');
  process.exit(0);
} catch (err) {
  console.error('❌ Firebase Admin init failed:', err.message);
  process.exit(1);
}
