import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { CookiesName, ENDPOINTS } from '@comments/shared';
import { buildBaseCookieOptions } from '@app/common/cookies/cookie-options';
import { ERROR_MESSAGES } from '@app/common/filter/error-messages';

import { AuthStatusDto } from './dto/auth-status.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { AuthService } from './services/auth.service';
import type { AuthTokens } from './types/auth-tokens';

const authCookieHeader = {
  'Set-Cookie': {
    description: [
      `${CookiesName.ACCESS_TOKEN}=<jwt>; HttpOnly; Path=/; SameSite=Lax`,
      `${CookiesName.REFRESH_TOKEN}=<jwt>; HttpOnly; Path=/; SameSite=Lax`,
    ].join(' | '),
    schema: { type: 'string' },
  },
};

@ApiTags(ENDPOINTS.AUTH)
@Controller(ENDPOINTS.AUTH)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post(ENDPOINTS.SIGNUP)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Sign up',
    description: 'Creates a user with a password hash and sets access/refresh httpOnly cookies.',
  })
  @ApiBody({ type: SignUpDto })
  @ApiCreatedResponse({
    type: AuthStatusDto,
    headers: authCookieHeader,
  })
  @ApiConflictResponse({ description: ERROR_MESSAGES.emailTaken })
  async signUp(
    @Body() signUpDto: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthStatusDto> {
    this.logger.log(`POST signup email=${signUpDto.email}`);
    const tokens = await this.authService.signUp(signUpDto);
    this.setAuthCookies(res, tokens);
    return { status: 'success' };
  }

  @Post(ENDPOINTS.SIGNIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in',
    description: 'Validates email/password and sets access/refresh httpOnly cookies.',
  })
  @ApiBody({ type: SignInDto })
  @ApiOkResponse({
    type: AuthStatusDto,
    headers: authCookieHeader,
  })
  @ApiUnauthorizedResponse({ description: ERROR_MESSAGES.invalidCredentials })
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthStatusDto> {
    this.logger.log(`POST signin email=${signInDto.email}`);
    const tokens = await this.authService.signIn(signInDto);
    this.setAuthCookies(res, tokens);
    return { status: 'success' };
  }

  @Post(ENDPOINTS.REFRESH)
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth(CookiesName.REFRESH_TOKEN)
  @ApiOperation({
    summary: 'Refresh tokens',
    description:
      'Reads the refresh_token cookie, verifies it, and rotates access/refresh httpOnly cookies.',
  })
  @ApiOkResponse({
    type: AuthStatusDto,
    headers: authCookieHeader,
  })
  @ApiUnauthorizedResponse({ description: ERROR_MESSAGES.unauthorized })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthStatusDto> {
    const cookies = req.cookies as Partial<Record<string, string>> | undefined;
    const refreshToken = cookies?.[CookiesName.REFRESH_TOKEN];
    if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
      throw new UnauthorizedException(ERROR_MESSAGES.unauthorized);
    }
    const tokens = await this.authService.refresh(refreshToken);
    this.setAuthCookies(res, tokens);
    return { status: 'success' };
  }

  private setAuthCookies(res: Response, tokens: AuthTokens): void {
    const accessMaxAgeMs = Number(this.configService.get('JWT_ACCESS_MAX_AGE_MS', 15 * 60 * 1000));
    const refreshMaxAgeMs = Number(
      this.configService.get('JWT_REFRESH_MAX_AGE_MS', 7 * 24 * 60 * 60 * 1000),
    );
    const cookieOptions = buildBaseCookieOptions({
      corsOrigin: this.configService.get<string>('CORS_ORIGIN'),
      cookieSameSite: this.configService.get<string>('COOKIE_SAME_SITE'),
      cookieSecure: this.configService.get<string>('COOKIE_SECURE'),
    });

    res.cookie(CookiesName.ACCESS_TOKEN, tokens.accessToken, {
      ...cookieOptions,
      maxAge: accessMaxAgeMs,
    });
    res.cookie(CookiesName.REFRESH_TOKEN, tokens.refreshToken, {
      ...cookieOptions,
      maxAge: refreshMaxAgeMs,
    });
  }
}
