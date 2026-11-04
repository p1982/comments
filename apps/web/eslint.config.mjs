import nextEslintPluginNext from '@next/eslint-plugin-next';
import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  { plugins: { '@next/next': nextEslintPluginNext } },
  ...nx.configs['flat/react-typescript'],
  ...baseConfig,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@next/next/no-html-link-for-pages': 'error',
      // next-intl currently marks requestLocale/setRequestLocale while migrating
      '@typescript-eslint/no-deprecated': 'off',
    },
  },
  {
    ignores: ['.next/**/*', '**/out-tsc'],
  },
];
