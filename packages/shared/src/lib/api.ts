export function getApiVersion(): string {
  return process.env['NEXT_PUBLIC_API_VERSION'] ?? process.env['API_VERSION'] ?? '1';
}

export function getApiUrl(): string {
  const fromEnv = process.env['NEXT_PUBLIC_API_URL'];
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }

  const base = (process.env['API_BASE_URL'] ?? 'http://localhost:3001').replace(/\/$/, '');
  return `${base}/api/v${getApiVersion()}`;
}
