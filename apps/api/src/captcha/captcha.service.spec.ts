jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

import { CaptchaService, signCaptcha } from './captcha.service';

describe('CaptchaService', () => {
  const secret = 'test-captcha-secret';
  const config = { getOrThrow: jest.fn(() => secret) };
  const service = new CaptchaService(config as never);

  it('signs the trimmed lowercase code', () => {
    expect(signCaptcha(' AB12C ', secret)).toBe(signCaptcha('ab12c', secret));
  });

  it('returns an svg and the hmac of the drawn code', () => {
    const { svg, token } = service.getCaptcha();
    const code = />([A-Z2-9]{5})</.exec(svg)?.[1] ?? '';

    expect(code).toHaveLength(5);
    expect(token).toBe(signCaptcha(code, secret));
    expect(svg.startsWith('<svg')).toBe(true);
  });
});
