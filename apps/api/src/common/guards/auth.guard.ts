import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { TokenService } from '@app/auth/services/jwt.service';
import { UserRepository } from '@app/users/repository/user.repository';
import { UserEntity } from '@app/users/entity/user.entity';
import { ERROR_MESSAGES } from '../filter/error-messages';

type RequestWithUser = Omit<Request, 'cookies'> & {
  user?: UserEntity;
  cookies?: {
    access_token?: string;
  };
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = request.cookies?.access_token;

    if (token) {
      const payload = this.tokenService.decodeToken(token);
      const user = await this.userRepository.findById(payload.id);

      if (!user) {
        throw new UnauthorizedException(ERROR_MESSAGES.userNotFound);
      }

      request.user = user;
    }

    return true;
  }
}
