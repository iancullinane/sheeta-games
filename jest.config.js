module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  // Resolve TS source before any stale compiled .js of the same name. Jest's
  // default puts 'js' first, so `import "../lib/foundation"` would load a stale
  // lib/foundation.js (leftover tsc emit) instead of the .ts we actually edit.
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  }
};
