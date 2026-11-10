import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppResolver } from './app.resolver';
import { AppService } from './app.service';
import { ERROR_CODES } from '../common/filter/error-messages';
import { GlobalExceptionFilter } from '../common/filter/global-exception.filter';
import { getDataSource } from '@app/database/data-source';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),

    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        autoSchemaFile: join(process.cwd(), 'apps/api/schema.gql'),
        sortSchema: true,
        playground: config.get<string>('NODE_ENV') !== 'production',
        formatError: (error) => ({
          message: error.message,
          code: error.extensions?.['code'] ?? ERROR_CODES.internalServerError,
        }),
      }),
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDataSource,
    }),
  ],

  controllers: [AppController],

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
