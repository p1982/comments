import { join } from 'path';

import { ConfigService } from '@nestjs/config';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { config as loadEnv } from 'dotenv';

import { CommentsEntity } from '@app/comments/entity/comments.entity';
import { CommentVotesEntity } from '@app/comments/entity/comment-votes.entity';
import { UsersEntity } from '@app/users/entity/users.entity';
import { AttachmentsEntity } from '@app/attachments/entity/attachments.entity';
import { OutboxEventsEntity } from '@app/outbox/entity/outbox.entity';

loadEnv({ path: join(__dirname, '../../../../.env') });

const config = new ConfigService();

const entities = [
  CommentsEntity,
  CommentVotesEntity,
  UsersEntity,
  AttachmentsEntity,
  OutboxEventsEntity,
];

export const getDataSource = (config: ConfigService): DataSourceOptions => {
  const databaseUrl = config.get<string>('DATABASE_URL');
  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      ssl: { rejectUnauthorized: false },
      entities,
      migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
      synchronize: ['true', '1', 'yes'].includes(
        (config.get<string>('DB_SYNC') ?? 'false').toLowerCase(),
      ),
    };
  }
  return {
    type: 'postgres',
    host: config.get<string>('DB_HOST', 'localhost'),
    port: Number(config.get<string>('DB_PORT', '5432')),
    username: config.get<string>('DB_USER', 'postgres'),
    password: config.get<string>('DB_PASSWORD', '1'),
    database: config.get<string>('DB_NAME', 'comments'),
    entities,
    migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
    synchronize: ['true', '1', 'yes'].includes(
      (config.get<string>('DB_SYNC') ?? 'false').toLowerCase(),
    ),
  };
};

export default new DataSource(getDataSource(config));
