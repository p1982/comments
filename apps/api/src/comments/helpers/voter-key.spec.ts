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

  it('builds httpOnly cookie options for dev and production', () => {
    expect(buildVoterCookieOptions(false)).toEqual({
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: VOTER_COOKIE_MAX_AGE_MS,
    });
    expect(buildVoterCookieOptions(true).secure).toBe(true);
  });
});
