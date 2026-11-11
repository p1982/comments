import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entity/user.entity';

export interface CreateUserData {
  email: string;
  fullname: string;
  homepage?: string;
}

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  findByEmail(email: string): Promise<UserEntity | null> {
    this.logger.debug(email);
    return this.repo.findOne({
      where: { email: email.trim().toLowerCase() },
      relations: { comments: true },
    });
  }

  findById(id: string): Promise<UserEntity | null> {
    this.logger.debug(id);
    return this.repo.findOne({
      where: { id },
      relations: { comments: true },
    });
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    this.logger.debug(data);
    const user = this.repo.create({
      ...data,
      email: data.email.trim().toLowerCase(),
    });
    const saved = await this.repo.save(user);
    return (await this.findById(saved.id)) ?? saved;
  }
}
