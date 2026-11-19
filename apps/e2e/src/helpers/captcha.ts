import type { APIRequestContext, Page } from '@playwright/test';

import { API_URL } from './env';

const CODE_RE = /letter-spacing="6"[^>]*>([A-Z2-9]{5})</;

export const fetchCaptcha = async (
  request: APIRequestContext,
): Promise<{ code: string; cookie: string }> => {
  const response = await request.get(`${API_URL}/captcha`);
  if (!response.ok()) {
    throw new Error(`Captcha request failed: ${String(response.status())}`);
  }

  const svg = await response.text();
  const code = CODE_RE.exec(svg)?.[1];
  if (!code) {
    throw new Error('Could not parse captcha code from SVG');
  }

  const setCookie = response.headers()['set-cookie'];
  if (!setCookie) {
    throw new Error('Captcha response missing Set-Cookie');
  }

  const cookie = setCookie.split(';')[0] ?? setCookie;
  return { code, cookie };
};

export const prepareCaptcha = async (page: Page) => {
  const response = await page.request.get(`${API_URL}/captcha`);
  if (!response.ok()) {
    throw new Error(`Captcha request failed: ${String(response.status())}`);
  }

  const svg = await response.text();
  const code = CODE_RE.exec(svg)?.[1];
  if (!code) {
    throw new Error('Could not parse captcha code from SVG');
  }

  // Ensure the browser context has the httpOnly captcha cookie for API origin.
  const setCookie = response.headers()['set-cookie'];
  if (setCookie) {
    const [pair] = setCookie.split(';');
    const [name, ...rest] = (pair ?? '').split('=');
    const value = rest.join('=');
    if (name && value) {
      await page.context().addCookies([
        {
          name,
          value,
          url: API_URL,
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);
    }
  }

  return code;
};
