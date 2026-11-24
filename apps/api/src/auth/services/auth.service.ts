import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';

import { ERROR_MESSAGES } from '@app/common/filter/error-messages';
import { UsersEntity } from '@app/users/entity/users.entity';
import { UsersRepository } from '@app/users/repository/users.repository';

import { SignInDto } from '../dto/sign-in.dto';
import { SignUpDto } from '../dto/sign-up.dto';
import type { AuthTokens } from '../types/auth-tokens';
import { HashService } from './hash.service';
import { TokenService } from './jwt.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UsersRepository,
    private readonly hashService: HashService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<AuthTokens> {
    const { email, password, fullName, homepage } = signUpDto;
    const existing = await this.userRepository.findByEmailForAuth(email);

    if (existing) {
      this.logger.warn(`Signup failed email taken email=${email}`);
      throw new ConflictException(ERROR_MESSAGES.emailTaken);
    }

    const passwordHash = await this.hashService.hashPassword(password);
    const user = await this.userRepository.createWithPassword({
      email,
      fullName,
      passwordHash,
      ...(homepage !== undefined ? { homepage } : {}),
    });

    this.logger.log(`Signup success userId=${user.id}`);
    return await this.issueAuthTokens(user);
  }

  async signIn(signInDto: SignInDto): Promise<AuthTokens> {
    const { email, password } = signInDto;
    const user = await this.userRepository.findByEmailForAuth(email);

    if (!user || user.deletedAt) {
      this.logger.warn(`Signin failed user not found email=${email}`);
      throw new UnauthorizedException(ERROR_MESSAGES.invalidCredentials);
    }

    if (!user.passwordHash) {
      this.logger.warn(`Signin failed no password hash userId=${user.id}`);
      throw new UnauthorizedException(ERROR_MESSAGES.invalidCredentials);
    }

    const isValidPassword = await this.hashService.comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      this.logger.warn(`Signin failed invalid password userId=${user.id}`);
      throw new UnauthorizedException(ERROR_MESSAGES.invalidCredentials);
    }

    return await this.issueAuthTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = await this.tokenService.verifyToken(refreshToken);
    if (payload.type && payload.type !== 'refresh') {
      throw new UnauthorizedException(ERROR_MESSAGES.unauthorized);
    }
    const user = await this.userRepository.findById(payload.id);

    if (!user || user.deletedAt) {
      throw new UnauthorizedException(ERROR_MESSAGES.userNotFound);
    }

    return await this.issueAuthTokens(user);
  }

  private async issueAuthTokens(user: UsersEntity): Promise<AuthTokens> {
    const basePayload = { id: user.id, email: user.email };
    const accessExpiresIn = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '15m',
    ) as StringValue;
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    ) as StringValue;

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.generateToken(
        { ...basePayload, type: 'access' },
        { expiresIn: accessExpiresIn },
      ),
      this.tokenService.generateToken(
        { ...basePayload, type: 'refresh' },
        { expiresIn: refreshExpiresIn },
      ),
    ]);
    return { accessToken, refreshToken };
  }
}
