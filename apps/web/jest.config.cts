const { readFileSync } = require('fs');

const swcJestConfig = JSON.parse(readFileSync(`${__dirname}/.spec.swcrc`, 'utf-8'));

swcJestConfig.swcrc = false;

module.exports = {
  displayName: '@comments/web',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@comments/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  coverageProvider: 'v8',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/config/**/*.ts',
    'src/lib/**/*.ts',
    'src/api/axios/**/*.ts',
    'src/api/services/comments.service.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  coverageDirectory: 'test-output/jest/coverage',
};
