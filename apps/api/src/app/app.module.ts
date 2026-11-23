import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AuthModule } from '@app/auth/auth.module';
import { CaptchasModule } from '@app/captcha/captcha.module';
import { CommentsModule } from '@app/comments/comments.module';
import { getDataSource } from '@app/database/data-source';
import { HealthModule } from '@app/health/health.module';
import { UsersModule } from '@app/users/users.module';

import { AppResolver } from './app.resolver';
import { AppService } from './app.service';
import { GlobalExceptionFilter } from '../common/filter/global-exception.filter';
import { buildGraphQLOptions } from './graphql.options';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),

    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: buildGraphQLOptions,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDataSource,
    }),
    EventEmitterModule.forRoot(),
    AuthModule,
    CommentsModule,
    UsersModule,
    CaptchasModule,
    HealthModule,
  ],

  providers: [
    AppService,
    AppResolver,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
