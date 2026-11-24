jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

import type { ConfigService } from '@nestjs/config';

import { CookiesName } from '@comments/shared';

import { CaptchaController } from './captcha.controller';
import type { CaptchaService } from './captcha.service';

describe('CaptchaController', () => {
  const captchaService = { getCaptcha: jest.fn() };
  const config = {
    get: jest.fn((key: string, fallback?: number) =>
      key === 'CAPTCHA_MAX_AGE_MS' ? (fallback ?? 5 * 60 * 1000) : undefined,
    ),
  };
  const controller = new CaptchaController(
    captchaService as unknown as CaptchaService,
    config as unknown as ConfigService,
  );

  it('sets the captcha cookie and sends the svg', () => {
    const response = {
      setHeader: jest.fn(),
      cookie: jest.fn(),
      type: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    captchaService.getCaptcha.mockReturnValue({ svg: '<svg></svg>', token: 'signed' });

    controller.getCaptcha(response as never);

    expect(config.get).toHaveBeenCalledWith('CAPTCHA_MAX_AGE_MS', 5 * 60 * 1000);
    expect(response.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(response.cookie).toHaveBeenCalledWith(CookiesName.CAPTCHA, 'signed', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: 5 * 60 * 1000,
    });
    expect(response.type).toHaveBeenCalledWith('image/svg+xml');
    expect(response.send).toHaveBeenCalledWith('<svg></svg>');
  });
});
