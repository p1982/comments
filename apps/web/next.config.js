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

const apiVersion = process.env['NEXT_PUBLIC_API_VERSION'] || process.env['API_VERSION'] || '1';
const rawApiUrl =
  process.env['NEXT_PUBLIC_API_URL'] || process.env['API_BASE_URL'] || 'http://localhost:3001';
const normalizedApiUrl = rawApiUrl.replace(/\/$/, '');
const apiUrl = /\/api\/v\d+$/.test(normalizedApiUrl)
  ? normalizedApiUrl
  : `${normalizedApiUrl}/api/v${apiVersion}`;
const apiOrigin = apiUrl.replace(/\/api\/v\d+$/, '');
const graphqlUrl = process.env['NEXT_PUBLIC_GRAPHQL_URL'] || `${apiOrigin}/graphql`;

const withNextIntl = createNextIntlPlugin(resolveI18nPath());

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compiler: {
    styledComponents: true,
  },
  transpilePackages: ['@comments/shared'],
  env: {
    // Composed from NEXT_PUBLIC_API_URL or API_BASE_URL + API_VERSION
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_API_VERSION: apiVersion,
    NEXT_PUBLIC_GRAPHQL_URL: graphqlUrl,
  },
};

module.exports = withNextIntl(nextConfig);
