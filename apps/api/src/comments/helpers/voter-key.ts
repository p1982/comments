import type { CookieOptions } from 'express';

import type { UsersEntity } from '@app/users/entity/users.entity';

export const VOTER_COOKIE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Resolves a stable voter key, preferring the authenticated user ID over the guest `voter_id` cookie.
 *
 * @param user Authenticated user entity, or `null`.
 * @param guestVoterId Optional value from the `voter_id` httpOnly cookie.
 * @returns `user:<id>`, `guest:<uuid>`, or `null` if neither is present.
 */
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

/**
 * Builds cookie options for the anonymous `voter_id` httpOnly cookie (1-year TTL).
 *
 * @param isProduction Sets `secure: true` in production HTTPS deployments.
 * @returns Express `CookieOptions`.
 */
export const buildVoterCookieOptions = (isProduction: boolean): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction,
  maxAge: VOTER_COOKIE_MAX_AGE_MS,
});
