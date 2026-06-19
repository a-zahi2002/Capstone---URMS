// Setup file for Jest
// This file runs before any tests are executed.

// Mock the SUPABASE_JWT_SECRET for testing purposes
// This ensures our mock tokens are signed and verified consistently in tests
process.env.SUPABASE_JWT_SECRET = 'super-secret-test-jwt-key-for-urms';

// If you need to establish database connections or other global setups, do it here.
// Example:
// beforeAll(async () => { await connectToTestDB(); });
// afterAll(async () => { await closeTestDB(); });
