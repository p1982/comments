import { createHmac, randomInt } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const signCaptcha = (code: string, secret: string): string =>
  createHmac('sha256', secret).update(code.trim().toLowerCase()).digest('hex');

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);
  constructor(private readonly config: ConfigService) {}

  getCaptcha(): { svg: string; token: string } {
    this.logger.log(`Generate captcha`);

    const code = Array.from({ length: 5 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

    const secret = this.config.getOrThrow<string>('CAPTCHA_SECRET');
    const token = signCaptcha(code, secret);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60" viewBox="0 0 180 60">
      <rect width="180" height="60" fill="#f4f4f5"/>
      <path d="M8 34 C 40 8, 90 52, 172 22" stroke="#94a3b8" fill="none"/>
      <text x="16" y="42" font-size="32" font-family="monospace" letter-spacing="6" fill="#111827">${code}</text>
    </svg>`;
    return {
      svg,
      token,
    };
  }
}
