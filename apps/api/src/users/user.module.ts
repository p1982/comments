import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserRepository } from './repository/user.repository';
import { UserEntity } from './entity/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],

  controllers: [],

  providers: [UserRepository],
  exports: [UserRepository],
})
export class UsersModule {}
