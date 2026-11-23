export const ALLOWED_TAGS = ['a', 'code', 'i', 'strong'] as const;

export const ALLOWED_ATTRIBUTES = ['href', 'title'] as const;

export const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);

    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};
