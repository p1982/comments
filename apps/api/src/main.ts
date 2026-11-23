import { join } from 'node:path';

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';

import { CookiesName } from '@comments/shared';

import { AppModule } from './app/app.module';
import { COMMENT_QUEUE_NAME } from './comments/comments.constants';
import { resolveCommentQueueMode } from './comments/queue/comment-job';
import { mergeOpenApiExtras } from './swagger/openapi-extras';

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

  app.use(
    '/graphql',
    graphqlUploadExpress({
      maxFileSize: 5 * 1024 * 1024,
      maxFiles: 2,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Comments API')
    .setDescription(
      [
        `REST under \`/api/v${apiVersion}\`.`,
        'GraphQL at `/graphql` (playground outside production; graphql-ws subscriptions enabled).',
        'Realtime comments via Socket.IO (`/socket.io`, event `comment.created` after outbox publish).',
        'Create writes through a transactional outbox so list/search/WS side effects do not block the HTTP response.',
        'JWT access/refresh and captcha are httpOnly cookies — nothing in localStorage.',
      ].join(' '),
    )
    .setVersion(apiVersion)
    .addCookieAuth(
      CookiesName.ACCESS_TOKEN,
      { type: 'apiKey', in: 'cookie' },
      CookiesName.ACCESS_TOKEN,
    )
    .addCookieAuth(
      CookiesName.REFRESH_TOKEN,
      { type: 'apiKey', in: 'cookie' },
      CookiesName.REFRESH_TOKEN,
    )
    .addCookieAuth(CookiesName.CAPTCHA, { type: 'apiKey', in: 'cookie' }, CookiesName.CAPTCHA)
    .build();
  const document = mergeOpenApiExtras(SwaggerModule.createDocument(app, swaggerConfig));
  SwaggerModule.setup('docs', app, document, { useGlobalPrefix: true });

  if (resolveCommentQueueMode(config.get<string>('COMMENT_QUEUE_MODE')) === 'rabbit') {
    app.connectMicroservice({
      transport: Transport.RMQ,
      options: {
        urls: [config.getOrThrow<string>('RABBITMQ_URL')],
        queue: config.get<string>('COMMENT_QUEUE_NAME', COMMENT_QUEUE_NAME),
        queueOptions: { durable: true },
      },
    });
    await app.startAllMicroservices();
    Logger.log('RabbitMQ comment-job consumer started');
  }

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
