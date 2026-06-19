const jwt = require('jsonwebtoken');

/**
 * Generates a mock Supabase JWT token for a specific role.
 * 
 * @param {string} role - The user role (e.g., 'student', 'lecturer', 'maintenance', 'admin')
 * @param {string} [userId='test-user-id'] - Optional user ID
 * @returns {string} Signed JWT token
 */
const generateMockToken = (role, userId = 'test-user-id') => {
  const payload = {
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // Token expires in 1 hour
    sub: userId,
    email: `${role}@urms.test`,
    app_metadata: {
      provider: 'email',
      providers: ['email'],
    },
    user_metadata: {
      role: role
    },
    role: role
  };

  // Sign with the test secret defined in tests/setup.js
  const secret = process.env.SUPABASE_JWT_SECRET || 'super-secret-test-jwt-key-for-urms';
  
  return jwt.sign(payload, secret);
};

/**
 * Generates an expired mock Supabase JWT token.
 */
const generateExpiredToken = (role = 'student') => {
  const payload = {
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) - (60 * 60), // Expired 1 hour ago
    sub: 'expired-user-id',
    role: role
  };
  const secret = process.env.SUPABASE_JWT_SECRET || 'super-secret-test-jwt-key-for-urms';
  return jwt.sign(payload, secret);
};

module.exports = {
  generateMockToken,
  generateExpiredToken
};
