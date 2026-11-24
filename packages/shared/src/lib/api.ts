/**
 * Resolves the active REST API version from `NEXT_PUBLIC_API_VERSION` or `API_VERSION`.
 *
 * @returns API version number string (defaults to `'1'`).
 */
export function getApiVersion(): string {
  return process.env['NEXT_PUBLIC_API_VERSION'] ?? process.env['API_VERSION'] ?? '1';
}

/**
 * Resolves the versioned REST API base URL without a trailing slash.
 * Prefers `NEXT_PUBLIC_API_URL`, otherwise composes `${API_BASE_URL}/api/v${version}`.
 *
 * @returns Normalized API URL (e.g. `http://localhost:3001/api/v1`).
 */
export function getApiUrl(): string {
  const fromEnv = process.env['NEXT_PUBLIC_API_URL'];
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }

  const base = (process.env['API_BASE_URL'] ?? 'http://localhost:3001').replace(/\/$/, '');
  return `${base}/api/v${getApiVersion()}`;
}
