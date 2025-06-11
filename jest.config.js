/**
 * Jest configuration for Promethios Extension Integration Tests
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: [
    '**/src/core/extensions/__tests__/*.test.ts',
    '**/src/admin/__tests__/*.test.tsx'
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Ignore node_modules
  transformIgnorePatterns: [
    '/node_modules/'
  ],
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
    '<rootDir>/src/admin/__tests__/setup-jest-dom.ts'
  ]
};
