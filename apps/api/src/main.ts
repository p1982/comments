import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const apiVersion = config.get<string>('API_VERSION', '1');
  const port = config.get<number>('PORT', 3000);
  const apiBaseUrl = `http://localhost:${String(port)}`;

  app.setGlobalPrefix(`api/v${apiVersion}`);
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
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

  if (config.get<string>('NX_READY_SIGNAL_SOCKET', 'false') === 'true') {
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
