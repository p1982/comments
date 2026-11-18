import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';

import { AuthGuard } from '@app/common/guards/auth.guard';
import { UsersModule } from '@app/users/users.module';

import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { HashService } from './services/hash.service';
import { TokenService } from './services/jwt.service';

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
  controllers: [AuthController],
  providers: [AuthService, TokenService, HashService, AuthGuard],
  exports: [AuthService, TokenService, HashService, AuthGuard],
})
export class AuthModule {}
