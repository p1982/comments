import type { CookieOptions } from 'express';

import { buildBaseCookieOptions, type CookieSecurityEnv } from '@app/common/cookies/cookie-options';
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
 * @param env Optional cookie security env override (defaults to `process.env`).
 * @returns Express `CookieOptions`.
 */
export const buildVoterCookieOptions = (env?: CookieSecurityEnv): CookieOptions => ({
  ...buildBaseCookieOptions(env),
  maxAge: VOTER_COOKIE_MAX_AGE_MS,
});
