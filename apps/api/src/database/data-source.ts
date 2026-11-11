import { ConfigService } from '@nestjs/config';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import { join } from 'path';

import { CommentsEntity } from '@app/comments/entity/comments.entity';
import { UsersEntity } from '@app/users/entity/users.entity';
import { AttachmentsEntity } from '@app/attachments/entity/attachments.entity';
import { OutboxEventsEntity } from '@app/outbox/entity/outbox.entity';

loadEnv({ path: join(__dirname, '../../../../.env') });

const config = new ConfigService();

export const getDataSource = (config: ConfigService): DataSourceOptions => ({
  type: 'postgres',
  host: config.get<string>('DB_HOST', 'localhost'),
  port: Number(config.get<string>('DB_PORT', '5432')),
  username: config.get<string>('DB_USER', 'postgres'),
  password: config.get<string>('DB_PASSWORD', '1'),
  database: config.get<string>('DB_NAME', 'comments'),
  entities: [CommentsEntity, UsersEntity, AttachmentsEntity, OutboxEventsEntity],
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
  synchronize: false,
});

export default new DataSource(getDataSource(config));
