import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HashService {
  private readonly logger = new Logger(HashService.name);
  private readonly saltRounds: number;
  constructor(private readonly configService: ConfigService) {
    this.saltRounds = Number(this.configService.get<number>('SALT_ROUNDS'));
  }

  async hashPassword(password: string): Promise<string> {
    this.logger.debug('Hashing password');
    return await bcrypt.hash(password, this.saltRounds);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    this.logger.debug('Comparing password hash');
    return await bcrypt.compare(password, hashedPassword);
  }
}
