import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { CookiesName, ENDPOINTS } from '@comments/shared';

import { CaptchaService } from './captcha.service';

@ApiTags(ENDPOINTS.CAPTCHA)
@ApiCookieAuth(CookiesName.CAPTCHA)
@Controller(ENDPOINTS.CAPTCHA)
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get captcha' })
  @ApiProduces('image/svg+xml')
  @ApiOkResponse({
    description: 'SVG image. Sets the httpOnly captcha cookie.',
    headers: {
      'Set-Cookie': {
        description: `${CookiesName.CAPTCHA}=<hmac>; HttpOnly; Path=/; SameSite=Lax; Max-Age=300`,
        schema: { type: 'string' },
      },
    },
    content: { 'image/svg+xml': { schema: { type: 'string', format: 'binary' } } },
  })
  getCaptcha(@Res() res: Response): void {
    const { svg, token } = this.captchaService.getCaptcha();

    res.cookie(CookiesName.CAPTCHA, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 5 * 60 * 1000,
    });
    res.type('image/svg+xml').send(svg);
  }
}
