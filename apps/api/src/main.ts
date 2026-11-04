import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import { ENV } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const apiVersion = ENV.API_VERSION;
  const port = ENV.PORT;
  const apiBaseUrl = `http://localhost:${String(port)}`;

  app.setGlobalPrefix(`api/v${apiVersion}`);
  app.enableCors({
    origin: ENV.CORS_ORIGIN,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);

  if (ENV.NX_READY_SIGNAL_SOCKET) {
    try {
      const load = new Function('s', 'return import(s)') as (
        s: string,
      ) => Promise<{ emitReadySignal(server: unknown): boolean }>;
      (await load('@nx/js/ready-signal')).emitReadySignal(app.getHttpServer());
    } catch {
      Logger.warn('Ready signal socket not available');
    }
  }

  Logger.log(`API running on ${apiBaseUrl}/api/v${apiVersion}`);
}

void bootstrap();
