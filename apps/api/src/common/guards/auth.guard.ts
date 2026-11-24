import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request } from 'express';

import { TokenService } from '@app/auth/services/jwt.service';
import { UsersRepository } from '@app/users/repository/users.repository';
import { UsersEntity } from '@app/users/entity/users.entity';

import { ERROR_MESSAGES } from '../filter/error-messages';

export type RequestWithUser = Omit<Request, 'cookies'> & {
  user?: UsersEntity | null;
  cookies?: {
    access_token?: string;
    captcha?: string;
    voter_id?: string;
  };
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context);
    const token = request.cookies?.access_token;

    if (token) {
      const payload = await this.tokenService.verifyToken(token);
      if (payload.type === 'refresh') {
        throw new UnauthorizedException(ERROR_MESSAGES.unauthorized);
      }

      const user = await this.usersRepository.findById(payload.id);

      if (!user || user.deletedAt) {
        throw new UnauthorizedException(ERROR_MESSAGES.userNotFound);
      }

      request.user = user;
    }

    return true;
  }

  private getRequest(context: ExecutionContext): RequestWithUser {
    if (context.getType<string>() === 'graphql') {
      return GqlExecutionContext.create(context).getContext<{ req: RequestWithUser }>().req;
    }
    return context.switchToHttp().getRequest<RequestWithUser>();
  }
}
