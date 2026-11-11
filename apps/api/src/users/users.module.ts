import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersRepository } from './repository/users.repository';
import { UsersEntity } from './entity/users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UsersEntity])],

  controllers: [],

  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
