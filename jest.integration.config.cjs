process.env.TZ = 'Europe/Warsaw';
module.exports = {
  displayName: 'integration',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transform: { '^.+\\.[jt]sx?$': ['babel-jest', { presets: ['babel-preset-expo'] }] },
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/node.setup.cjs'],
  testTimeout: 20000,
  clearMocks: true,
};
