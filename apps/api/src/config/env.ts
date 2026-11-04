export const ENV = {
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
  PORT: Number(process.env['PORT'] ?? '3001'),
  API_VERSION: process.env['API_VERSION'] ?? '1',
  CORS_ORIGIN: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000',
  DB_HOST: process.env['DB_HOST'] ?? 'localhost',
  DB_PORT: Number(process.env['DB_PORT'] ?? '5432'),
  DB_USER: process.env['DB_USER'] ?? 'comments',
  DB_PASSWORD: process.env['DB_PASSWORD'] ?? 'comments',
  DB_NAME: process.env['DB_NAME'] ?? 'comments',
  DB_SYNC: process.env['DB_SYNC'] === 'true',
  DB_LOGGING: process.env['DB_LOGGING'] === 'true',
  NX_READY_SIGNAL_SOCKET: process.env['NX_READY_SIGNAL_SOCKET'],
} as const;
