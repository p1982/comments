process.env['NODE_ENV'] ??= 'test';
process.env['API_VERSION'] ??= '1';
process.env['DB_HOST'] ??= 'localhost';
process.env['DB_PORT'] ??= '5432';
process.env['DB_USER'] ??= 'postgres';
process.env['DB_PASSWORD'] ??= '1';
process.env['DB_NAME'] = 'comments_test';
process.env['DB_SYNC'] ??= 'false';
process.env['CAPTCHA_SECRET'] = 'test-captcha-secret';
process.env['CAPTCHA_MAX_AGE_MS'] ??= '300000';
process.env['JWT_SECRET'] ??= 'test-jwt-secret';
process.env['JWT_ACCESS_EXPIRES_IN'] ??= '15m';
process.env['JWT_REFRESH_EXPIRES_IN'] ??= '7d';
process.env['COMMENT_QUEUE_MODE'] ??= 'sync';
process.env['CORS_ORIGIN'] ??= 'http://localhost:3000';
// Keep API e2e independent of Elasticsearch (and avoid open client handles).
process.env['ELASTICSEARCH_NODE'] = '';
