import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { TokenService } from '@app/auth/services/jwt.service';
import { UsersRepository } from '@app/users/repository/users.repository';
import { UsersEntity } from '@app/users/entity/users.entity';
import { ERROR_MESSAGES } from '../filter/error-messages';

export type RequestWithUser = Omit<Request, 'cookies'> & {
  user?: UsersEntity | null;
  cookies?: {
    access_token?: string;
  };
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = request.cookies?.access_token;

    if (token) {
      const payload = this.tokenService.decodeToken(token);
      const user = await this.usersRepository.findById(payload.id);

      if (!user) {
        throw new UnauthorizedException(ERROR_MESSAGES.userNotFound);
      }

      request.user = user;
    }

    return true;
  }
}
