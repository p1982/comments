import type { CookieOptions, Request } from 'express';

export interface CookieSecurityEnv {
  corsOrigin?: string | undefined;
  cookieSameSite?: string | undefined;
  cookieSecure?: string | undefined;
}

type CookieRequestLike = Partial<Pick<Request, 'secure' | 'headers'>>;

/**
 * Detects whether an incoming request arrived over HTTPS (directly, behind a TLS-terminating
 * reverse proxy via `X-Forwarded-Proto`, or from an HTTPS browser `Origin`).
 *
 * @param req Optional Express request object.
 * @returns `true` when HTTPS transport or an HTTPS origin is detected.
 */
export const isHttpsRequest = (req?: CookieRequestLike): boolean => {
  if (!req) {
    return false;
  }
  if (req.secure === true) {
    return true;
  }
  const forwardedProto = req.headers?.['x-forwarded-proto'];
  const firstProto = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto)
    ?.split(',')[0]
    ?.trim()
    .toLowerCase();
  if (firstProto === 'https') {
    return true;
  }
  const origin = req.headers?.origin;
  const originValue = typeof origin === 'string' ? origin : '';
  return originValue.trim().toLowerCase().startsWith('https://');
};

/**
 * Resolves `httpOnly`, `sameSite`, `secure`, `partitioned`, and `path` flags for API cookies.
 * Uses `SameSite=None; Secure; Partitioned` automatically when `CORS_ORIGIN` or the incoming
 * request is HTTPS (required for cross-site deployments such as `*.up.railway.app`), and
 * `SameSite=Lax` for local HTTP origins (`http://localhost:3000`).
 *
 * @param env Optional environment override (defaults to `process.env`).
 * @param req Optional Express request used to detect HTTPS behind reverse proxies.
 * @returns Base Express cookie options shared by auth, captcha, and guest voter cookies.
 */
export const buildBaseCookieOptions = (
  env: CookieSecurityEnv = {
    corsOrigin: process.env['CORS_ORIGIN'],
    cookieSameSite: process.env['COOKIE_SAME_SITE'],
    cookieSecure: process.env['COOKIE_SECURE'],
  },
  req?: CookieRequestLike,
): CookieOptions => {
  const isHttps =
    (env.corsOrigin ?? '').trim().toLowerCase().startsWith('https://') || isHttpsRequest(req);
  const explicitSameSite = env.cookieSameSite?.trim().toLowerCase();
  const sameSite: 'lax' | 'strict' | 'none' =
    explicitSameSite === 'none' || explicitSameSite === 'strict' || explicitSameSite === 'lax'
      ? explicitSameSite
      : isHttps
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
          : isHttps;

  return {
    httpOnly: true,
    sameSite,
    secure,
    path: '/',
    ...(sameSite === 'none' && secure ? { partitioned: true } : {}),
  };
};
