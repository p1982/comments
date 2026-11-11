import { HttpException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GraphQLError,
  type GraphQLFormattedError,
  type GraphQLFormattedErrorExtensions,
} from 'graphql';

import { ERROR_CODES, ERROR_MESSAGES, HTTP_ERROR_CODES } from './error-messages';

const codeForStatus = (status: number): string => {
  return (
    HTTP_ERROR_CODES[status] ??
    (status >= 500 ? ERROR_CODES.INTERNAL_SERVER_ERROR : ERROR_CODES.BAD_REQUEST)
  );
};

const toFormattedError = (
  message: string,
  formatted: GraphQLFormattedError,
  extensions: GraphQLFormattedErrorExtensions,
): GraphQLFormattedError => {
  return {
    message,
    extensions,
    ...(formatted.path === undefined ? {} : { path: formatted.path }),
    ...(formatted.locations === undefined ? {} : { locations: formatted.locations }),
  };
};

export const createGraphQLErrorFormatter = (configService: ConfigService) => {
  return (formatted: GraphQLFormattedError, error: unknown): GraphQLFormattedError => {
    const logger = new Logger(createGraphQLErrorFormatter.name);
    const originalError = error instanceof GraphQLError ? error.originalError : undefined;

    if (originalError instanceof HttpException) {
      const status = originalError.getStatus();

      return toFormattedError(originalError.message, formatted, {
        code: codeForStatus(status),
        statusCode: status,
      });
    }

    const isProduction = configService.get<string>('NODE_ENV') === 'production';
    const message = error instanceof Error ? error.message : formatted.message;
    logger.error(message, error instanceof Error ? error.stack : undefined);
    return toFormattedError(
      isProduction ? ERROR_MESSAGES.internalServerError : message,
      formatted,
      {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      },
    );
  };
};
