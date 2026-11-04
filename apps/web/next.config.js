//@ts-check
const fs = require('fs');
const path = require('path');
const { config: loadEnv } = require('dotenv');
const createNextIntlPlugin = require('next-intl/plugin');

loadEnv({ path: path.resolve(__dirname, '../../.env') });

function resolveI18nPath() {
  const absolute = path.join(__dirname, 'src/i18n/request.ts');
  if (!fs.existsSync(absolute)) {
    throw new Error(`Missing i18n config at ${absolute}`);
  }

  // next-intl requires a path relative to process.cwd()
  return `./${path.relative(process.cwd(), absolute).replace(/\\/g, '/')}`;
}

const apiBaseUrl = process.env['API_BASE_URL'] ?? 'http://localhost:3001';
const apiVersion = process.env['API_VERSION'] ?? '1';
const apiUrl = `${apiBaseUrl.replace(/\/$/, '')}/api/v${apiVersion}`;

const withNextIntl = createNextIntlPlugin(resolveI18nPath());

/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
  transpilePackages: ['@comments/shared'],
  env: {
    // Composed from API_BASE_URL + API_VERSION (single source of truth in root .env)
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_API_VERSION: apiVersion,
  },
};

module.exports = withNextIntl(nextConfig);
