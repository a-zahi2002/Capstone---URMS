module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  clearMocks: true,
  moduleDirectories: ['node_modules', '<rootDir>/backend/node_modules'],
};
