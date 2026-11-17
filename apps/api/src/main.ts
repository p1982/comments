import { join } from 'node:path';

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

import { CookiesName } from '@comments/shared';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  const apiVersion = config.get<string>('API_VERSION', '1');
  const port = config.get<number>('PORT', 3000);
  const apiBaseUrl = `http://localhost:${String(port)}`;
  const globalPrefix = `api/v${apiVersion}`;

  app.setGlobalPrefix(globalPrefix);
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
  app.use(cookieParser());
  app.useStaticAssets(join(process.cwd(), 'apps', 'api', 'assets'), { prefix: '/assets/' });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Comments API')
    .setDescription('REST API for comments')
    .setVersion(apiVersion)
    .addCookieAuth(
      CookiesName.ACCESS_TOKEN,
      { type: 'apiKey', in: 'cookie' },
      CookiesName.ACCESS_TOKEN,
    )
    .addCookieAuth(CookiesName.CAPTCHA, { type: 'apiKey', in: 'cookie' }, CookiesName.CAPTCHA)
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, { useGlobalPrefix: true });

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

  Logger.log(`API running on ${apiBaseUrl}/${globalPrefix}`);
  Logger.log(`Swagger UI on ${apiBaseUrl}/${globalPrefix}/docs`);
}

void bootstrap();
