const {
  coverageThreshold,
  collectCoverageFrom,
  coverageDirectory,
  ...unitConfig
} = require('./jest.config.cts');

const sourceTransform = unitConfig.transform['^.+\\.[tj]s$'];

module.exports = {
  ...unitConfig,
  displayName: '@comments/api-e2e',
  testMatch: ['<rootDir>/src/**/*.e2e-spec.ts'],
  setupFiles: ['<rootDir>/src/test/e2e-env.ts'],
  moduleNameMapper: {
    ...unitConfig.moduleNameMapper,
    '^@comments/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.(js|mjs|cjs)$': [
      '@swc/jest',
      {
        jsc: { target: 'es2022', parser: { syntax: 'ecmascript' } },
        module: { type: 'commonjs' },
      },
    ],
    '^.+\\.ts$': sourceTransform,
  },
  transformIgnorePatterns: ['/__does_not_transform_ignore__/'],
  maxWorkers: 1,
  testTimeout: 60000,
  collectCoverage: false,
};
