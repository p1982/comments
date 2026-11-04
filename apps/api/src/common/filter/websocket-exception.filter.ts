import { ArgumentsHost, Catch, Logger } from '@nestjs/common';

import { BaseWsExceptionFilter, type ErrorPayload, WsException } from '@nestjs/websockets';

import { ERROR_MESSAGES } from './error-messages';

const toWsException = (exception: unknown, message: string): WsException => {
  if (exception instanceof WsException) {
    return exception;
  }

  const payload: ErrorPayload = {
    status: 'error',
    message,
  };
  return new WsException(payload);
};

@Catch()
export class WebsocketExceptionFilter extends BaseWsExceptionFilter<WsException> {
  private readonly logger = new Logger(WebsocketExceptionFilter.name);
  override catch(exception: unknown, host: ArgumentsHost): void {
    const message =
      exception instanceof Error ? exception.message : ERROR_MESSAGES.unknownException;
    this.logger.error(message, exception instanceof Error ? exception.stack : undefined);

    super.catch(toWsException(exception, message), host);
  }
}
