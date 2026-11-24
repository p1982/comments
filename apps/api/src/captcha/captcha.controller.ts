import { Controller, Get, HttpCode, HttpStatus, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { CookiesName, ENDPOINTS } from '@comments/shared';
import { buildBaseCookieOptions } from '@app/common/cookies/cookie-options';

import { CaptchaService } from './captcha.service';

const DEFAULT_CAPTCHA_MAX_AGE_MS = 5 * 60 * 1000;

@ApiTags(ENDPOINTS.CAPTCHA)
@ApiCookieAuth(CookiesName.CAPTCHA)
@Controller(ENDPOINTS.CAPTCHA)
export class CaptchaController {
  constructor(
    private readonly captchaService: CaptchaService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get captcha' })
  @ApiProduces('image/svg+xml')
  @ApiOkResponse({
    description: 'SVG image. Sets the httpOnly captcha cookie.',
    headers: {
      'Set-Cookie': {
        description: `${CookiesName.CAPTCHA}=<hmac>; HttpOnly; Path=/; SameSite=Lax; Max-Age=<CAPTCHA_MAX_AGE_MS/1000>`,
        schema: { type: 'string' },
      },
    },
    content: { 'image/svg+xml': { schema: { type: 'string', format: 'binary' } } },
  })
  getCaptcha(@Res() res: Response, @Req() req?: Request): void {
    const { svg, token } = this.captchaService.getCaptcha();
    const maxAge = Number(this.config.get('CAPTCHA_MAX_AGE_MS', DEFAULT_CAPTCHA_MAX_AGE_MS));
    const baseCookieOptions = buildBaseCookieOptions(
      {
        corsOrigin: this.config.get<string>('CORS_ORIGIN'),
        cookieSameSite: this.config.get<string>('COOKIE_SAME_SITE'),
        cookieSecure: this.config.get<string>('COOKIE_SECURE'),
      },
      req,
    );

    res.setHeader('Cache-Control', 'no-store');
    res.cookie(CookiesName.CAPTCHA, token, {
      ...baseCookieOptions,
      maxAge,
    });
    res.type('image/svg+xml').send(svg);
  }
}
