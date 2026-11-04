import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = (config: ConfigService) => {
  const isProduction = config.get<string>('NODE_ENV') === 'production';
  const databaseUrl = config.get<string>('DATABASE_URL');

  const common = {
    type: 'postgres' as const,
    entities: [],
    synchronize: !isProduction,
    logging: !isProduction,
  };
  if (databaseUrl) {
    return {
      ...common,
      url: databaseUrl,
    };
  }
  return {
    ...common,
    host: config.get<string>('DB_HOST', 'localhost'),
    port: config.get<number>('DB_PORT', 5432),
    username: config.get<string>('DB_USERNAME'),
    password: config.get<string>('DB_PASSWORD'),
    database: config.get<string>('DB_DATABASE'),
  };
};
