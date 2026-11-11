import { ERROR_MESSAGES } from '@app/common/filter/error-messages';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

export interface TokenPayload {
  id: string;
  email: string;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(private readonly jwtService: JwtService) {}

  async generateToken(payload: TokenPayload, options?: JwtSignOptions): Promise<string> {
    this.logger.debug(`Generating token userId=${payload.id}`);
    return await this.jwtService.signAsync(payload, options);
  }

  async verifyToken(token: string, options?: { secret?: string }): Promise<TokenPayload> {
    this.logger.debug(token);
    try {
      return await this.jwtService.verifyAsync(token, options);
    } catch {
      this.logger.warn('Token verification failed');
      throw new UnauthorizedException(ERROR_MESSAGES.unauthorized);
    }
  }

  decodeToken(token: string): TokenPayload {
    this.logger.debug(token);
    return this.jwtService.decode<TokenPayload>(token);
  }
}
