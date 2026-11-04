export const ERROR_MESSAGES = {
  internalServerError: 'Internal server error',
  unknownException: 'Unknown exception',
} as const;

export const ERROR_CODES = {
  badRequest: 'BAD_REQUEST',
  unauthenticated: 'UNAUTHENTICATED',
  forbidden: 'FORBIDDEN',
  notFound: 'NOT_FOUND',
  conflict: 'CONFLICT',
  unprocessableEntity: 'UNPROCESSABLE_ENTITY',
  internalServerError: 'INTERNAL_SERVER_ERROR',
} as const;

export const HTTP_ERROR_CODES: Record<number, string> = {
  400: ERROR_CODES.badRequest,
  401: ERROR_CODES.unauthenticated,
  403: ERROR_CODES.forbidden,
  404: ERROR_CODES.notFound,
  409: ERROR_CODES.conflict,
  422: ERROR_CODES.unprocessableEntity,
};
