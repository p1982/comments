import type { CookieOptions } from 'express';

import type { UsersEntity } from '@app/users/entity/users.entity';

export const VOTER_COOKIE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

export const resolveVoterKey = (
  user: UsersEntity | null,
  guestVoterId?: string | null,
): string | null => {
  if (user) {
    return `user:${user.id}`;
  }
  const normalized = guestVoterId?.trim();
  if (normalized) {
    return `guest:${normalized}`;
  }
  return null;
};

export const buildVoterCookieOptions = (isProduction: boolean): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction,
  maxAge: VOTER_COOKIE_MAX_AGE_MS,
});
