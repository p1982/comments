import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { UsersEntity } from '../entity/users.entity';

export interface CreateUserData {
  email: string;
  fullName: string;
  homepage?: string;
}

export interface CreateAuthUserData extends CreateUserData {
  passwordHash: string;
}

@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
  ) {}

  findByEmail(email: string): Promise<UsersEntity | null> {
    this.logger.debug(email);
    return this.usersRepository.findOne({
      where: { email: email.trim().toLowerCase() },
      relations: { comments: true },
    });
  }

  findById(id: string): Promise<UsersEntity | null> {
    this.logger.debug(id);
    return this.usersRepository.findOne({
      where: { id },
      relations: { comments: true },
    });
  }

  findByEmailForAuth(email: string): Promise<UsersEntity | null> {
    return this.usersRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }

  async create(data: CreateUserData, manager: EntityManager): Promise<UsersEntity> {
    this.logger.debug(data);
    const users = manager.getRepository(UsersEntity);
    const user = users.create({
      fullName: data.fullName,
      email: data.email.trim().toLowerCase(),
      homepage: data.homepage ?? '',
    });
    const saved = await users.save(user);
    return (await users.findOne({ where: { id: saved.id } })) ?? saved;
  }

  async createWithPassword(data: CreateAuthUserData): Promise<UsersEntity> {
    this.logger.debug({ email: data.email, fullName: data.fullName });
    const user = this.usersRepository.create({
      fullName: data.fullName,
      email: data.email.trim().toLowerCase(),
      homepage: data.homepage ?? '',
      passwordHash: data.passwordHash,
    });
    return await this.usersRepository.save(user);
  }
}
