import { buildBaseCookieOptions, isHttpsRequest } from './cookie-options';

describe('buildBaseCookieOptions', () => {
  it('uses SameSite=Lax and secure=false for local HTTP origins', () => {
    expect(buildBaseCookieOptions({ corsOrigin: 'http://localhost:3000' })).toEqual({
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });
  });

  it('uses SameSite=None, secure=true, and partitioned=true for HTTPS cross-site origins', () => {
    expect(
      buildBaseCookieOptions({ corsOrigin: 'https://comments-front-production.up.railway.app' }),
    ).toEqual({
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      partitioned: true,
      path: '/',
    });
  });

  it('detects HTTPS from req.secure, x-forwarded-proto, or HTTPS Origin header', () => {
    expect(isHttpsRequest(undefined)).toBe(false);
    expect(isHttpsRequest({ secure: true })).toBe(true);
    expect(isHttpsRequest({ headers: { 'x-forwarded-proto': 'https, http' } })).toBe(true);
    expect(isHttpsRequest({ headers: { 'x-forwarded-proto': ['https'] } })).toBe(true);
    expect(
      isHttpsRequest({ headers: { origin: 'https://comments-front-production.up.railway.app' } }),
    ).toBe(true);
    expect(isHttpsRequest({ headers: { origin: 'http://localhost:3000' } })).toBe(false);

    expect(buildBaseCookieOptions({}, { headers: { 'x-forwarded-proto': 'https' } })).toMatchObject(
      {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        partitioned: true,
      },
    );
  });

  it('honors explicit COOKIE_SAME_SITE and COOKIE_SECURE overrides', () => {
    expect(
      buildBaseCookieOptions({
        corsOrigin: 'https://example.com',
        cookieSameSite: 'strict',
        cookieSecure: 'false',
      }),
    ).toEqual({
      httpOnly: true,
      sameSite: 'strict',
      secure: false,
      path: '/',
    });

    expect(
      buildBaseCookieOptions({
        corsOrigin: 'http://localhost:3000',
        cookieSameSite: 'lax',
        cookieSecure: 'true',
      }),
    ).toEqual({
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
    });

    expect(
      buildBaseCookieOptions({
        corsOrigin: 'http://localhost:3000',
        cookieSameSite: 'none',
        cookieSecure: 'false',
      }),
    ).toEqual({
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      partitioned: true,
      path: '/',
    });
  });
});
