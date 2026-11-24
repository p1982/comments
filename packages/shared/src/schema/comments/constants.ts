export const ALLOWED_TAGS = ['a', 'code', 'i', 'strong'] as const;

export const ALLOWED_ATTRIBUTES = ['href', 'title'] as const;

/**
 * Checks whether a string is a valid `http:` or `https:` URL.
 *
 * @param value Candidate URL string.
 * @returns `true` for `http:` / `https:` URLs, `false` otherwise.
 */
export const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);

    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};
