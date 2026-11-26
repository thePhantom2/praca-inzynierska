process.env.TZ = 'Europe/Warsaw';

const moduleNameMapper = { '^@/(.*)$': '<rootDir>/src/$1' };
const transform = { '^.+\\.[jt]sx?$': ['babel-jest', { presets: ['babel-preset-expo'] }] };

module.exports = {
  projects: [
    {
      displayName: 'unit',
      rootDir: '.',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/helpers/node.setup.cjs', '<rootDir>/tests/helpers/unit.setup.cjs'],
      moduleNameMapper,
      transform,
      clearMocks: true,
    },
    {
      displayName: 'ui',
      rootDir: '.',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/tests/ui/**/*.test.tsx'],
      setupFilesAfterEnv: ['<rootDir>/tests/helpers/ui.setup.cjs'],
      moduleNameMapper,
      clearMocks: true,
    },
  ],
  collectCoverageFrom: ['src/utils/**/*.{ts,tsx}', 'src/storage/**/*.{ts,tsx}', 'src/lib/subscribeToQuery.ts', 'src/components/**/*.{ts,tsx}'],
  coverageDirectory: 'reports/coverage',
  coverageReporters: ['text-summary', 'html', 'lcov'],
};
