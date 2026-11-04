import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      // Nest DI needs value imports for injected classes
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      // Nx ready-signal bootstrap uses dynamic Function import
      '@typescript-eslint/no-implied-eval': 'off',
      'no-new-func': 'off',
    },
  },
];
