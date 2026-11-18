export enum ENDPOINTS {
  AUTH = '/auth',
  SIGNIN = '/signin',
  SIGNUP = '/signup',
  REFRESH = '/refresh',
  COMMENTS = '/comments',
  CAPTCHA = '/captcha',
}

export const authEndpoint = (
  path: typeof ENDPOINTS.SIGNIN | typeof ENDPOINTS.SIGNUP | typeof ENDPOINTS.REFRESH,
): string => `${ENDPOINTS.AUTH}${path}`;
