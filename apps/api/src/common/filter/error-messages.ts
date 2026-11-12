import { HttpStatus } from '@nestjs/common';

export const ERROR_MESSAGES = {
  internalServerError: 'Internal server error',
  unknownException: 'Unknown exception',
  unauthorized: 'Unauthorized',
  userNotFound: 'User not found',
  validationError: 'Validation error',
  notFound: 'Not found',
} as const;

export const ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export const HTTP_ERROR_CODES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: ERROR_CODES.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ERROR_CODES.UNAUTHENTICATED,
  [HttpStatus.FORBIDDEN]: ERROR_CODES.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ERROR_CODES.NOT_FOUND,
  [HttpStatus.CONFLICT]: ERROR_CODES.CONFLICT,
  [HttpStatus.UNPROCESSABLE_ENTITY]: ERROR_CODES.UNPROCESSABLE_ENTITY,
  [HttpStatus.INTERNAL_SERVER_ERROR]: ERROR_CODES.INTERNAL_SERVER_ERROR,
};
