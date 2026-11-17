jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

import { CookiesName } from '@comments/shared';

import { CaptchaController } from './captcha.controller';
import type { CaptchaService } from './captcha.service';

describe('CaptchaController', () => {
  const captchaService = { getCaptcha: jest.fn() };
  const controller = new CaptchaController(captchaService as unknown as CaptchaService);

  it('sets the captcha cookie and sends the svg', () => {
    const response = {
      cookie: jest.fn(),
      type: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    captchaService.getCaptcha.mockReturnValue({ svg: '<svg></svg>', token: 'signed' });

    controller.getCaptcha(response as never);

    expect(response.cookie).toHaveBeenCalledWith(CookiesName.CAPTCHA, 'signed', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 5 * 60 * 1000,
    });
    expect(response.type).toHaveBeenCalledWith('image/svg+xml');
    expect(response.send).toHaveBeenCalledWith('<svg></svg>');
  });
});
