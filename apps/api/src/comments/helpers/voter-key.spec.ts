import type { UsersEntity } from '@app/users/entity/users.entity';

import { buildVoterCookieOptions, resolveVoterKey, VOTER_COOKIE_MAX_AGE_MS } from './voter-key';

describe('voter-key helper', () => {
  it('prefers the authenticated user id over guest cookie', () => {
    expect(resolveVoterKey({ id: 'user-1' } as UsersEntity, 'guest-1')).toBe('user:user-1');
  });

  it('uses the trimmed guest cookie when user is null', () => {
    expect(resolveVoterKey(null, '  guest-1  ')).toBe('guest:guest-1');
    expect(resolveVoterKey(null, '   ')).toBeNull();
    expect(resolveVoterKey(null, undefined)).toBeNull();
  });

  it('builds httpOnly cookie options for local HTTP and HTTPS cross-site origins', () => {
    expect(buildVoterCookieOptions({ corsOrigin: 'http://localhost:3000' })).toEqual({
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: VOTER_COOKIE_MAX_AGE_MS,
    });
    expect(
      buildVoterCookieOptions({ corsOrigin: 'https://comments-front-production.up.railway.app' }),
    ).toEqual({
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      partitioned: true,
      path: '/',
      maxAge: VOTER_COOKIE_MAX_AGE_MS,
    });
  });
});
