import { AuthGuard } from '@app/common/guards/auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';

import { TokenService } from './services/jwt.service';
import { UsersModule } from '@app/users/users.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
    UsersModule,
  ],
  providers: [TokenService, AuthGuard],
  exports: [TokenService, AuthGuard],
})
export class AuthModule {}
