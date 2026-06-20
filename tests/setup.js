// Setup file for Jest
// This file runs before any tests are executed.

// Mock the SUPABASE_JWT_SECRET for testing purposes
// This ensures our mock tokens are signed and verified consistently in tests
require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
process.env.SUPABASE_JWT_SECRET = 'super-secret-test-jwt-key-for-urms';

// Set dummy Firebase credentials to trigger successful initialization check in tests
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_CLIENT_EMAIL = 'test-client@test.com';
process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----';

jest.mock('firebase-admin', () => {
  return {
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn(() => ({})),
    },
    auth: () => ({
      verifyIdToken: async (token) => {
        const jwt = require('jsonwebtoken');
        const secret = process.env.SUPABASE_JWT_SECRET || 'super-secret-test-jwt-key-for-urms';
        try {
          const decoded = jwt.verify(token, secret);
          return {
            uid: decoded.sub || 'test-user-id',
            email: decoded.email,
            role: decoded.role,
            admin: decoded.role === 'admin',
            ...decoded
          };
        } catch (err) {
          throw new Error('Invalid token');
        }
      }
    }),
    apps: [{ name: '[DEFAULT]' }]
  };
});

// If you need to establish database connections or other global setups, do it here.
// Example:
// beforeAll(async () => { await connectToTestDB(); });
// afterAll(async () => { await closeTestDB(); });
