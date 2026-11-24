import type { CookieOptions } from 'express';

export interface CookieSecurityEnv {
  corsOrigin?: string | undefined;
  cookieSameSite?: string | undefined;
  cookieSecure?: string | undefined;
}

/**
 * Resolves `httpOnly`, `sameSite`, `secure`, `partitioned`, and `path` flags for API cookies.
 * Uses `SameSite=None; Secure; Partitioned` automatically when `CORS_ORIGIN` is HTTPS
 * (required for cross-site deployments such as `*.up.railway.app`), and `SameSite=Lax`
 * for local HTTP origins (`http://localhost:3000`).
 *
 * @param env Optional environment override (defaults to `process.env`).
 * @returns Base Express cookie options shared by auth, captcha, and guest voter cookies.
 */
export const buildBaseCookieOptions = (
  env: CookieSecurityEnv = {
    corsOrigin: process.env['CORS_ORIGIN'],
    cookieSameSite: process.env['COOKIE_SAME_SITE'],
    cookieSecure: process.env['COOKIE_SECURE'],
  },
): CookieOptions => {
  const isHttpsCors = (env.corsOrigin ?? '').trim().toLowerCase().startsWith('https://');
  const explicitSameSite = env.cookieSameSite?.trim().toLowerCase();
  const sameSite: 'lax' | 'strict' | 'none' =
    explicitSameSite === 'none' || explicitSameSite === 'strict' || explicitSameSite === 'lax'
      ? explicitSameSite
      : isHttpsCors
        ? 'none'
        : 'lax';

  const explicitSecure = env.cookieSecure?.trim().toLowerCase();
  const secure =
    sameSite === 'none'
      ? true
      : explicitSecure === 'true'
        ? true
        : explicitSecure === 'false'
          ? false
          : isHttpsCors;

  return {
    httpOnly: true,
    sameSite,
    secure,
    path: '/',
    ...(sameSite === 'none' && secure ? { partitioned: true } : {}),
  };
};
