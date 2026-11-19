import {
  createParamDecorator,
  ExecutionContext,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import type { UsersEntity } from '@app/users/entity/users.entity';

import type { RequestWithUser } from '../guards/auth.guard';

const getRequest = (context: ExecutionContext): RequestWithUser => {
  if (context.getType<string>() === 'graphql') {
    return GqlExecutionContext.create(context).getContext<{ req: RequestWithUser }>().req;
  }
  return context.switchToHttp().getRequest<RequestWithUser>();
};

@Injectable()
export class UserPipe implements PipeTransform<RequestWithUser, UsersEntity | null> {
  transform(request: RequestWithUser): UsersEntity | null {
    return request.user ?? null;
  }
}

export const resolveRequestUser = (context: ExecutionContext): UsersEntity | null =>
  new UserPipe().transform(getRequest(context));

export const User = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UsersEntity | null => resolveRequestUser(context),
);
