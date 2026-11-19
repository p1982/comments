import path from 'node:path';

import type { APIRequestContext, Page } from '@playwright/test';

import { fetchCaptcha, prepareCaptcha } from './captcha';
import { API_URL } from './env';

const fixturesDir = path.join(__dirname, '../../fixtures');

export const createCommentViaApi = async (
  request: APIRequestContext,
  input: {
    fullName: string;
    email: string;
    text: string;
    homepage?: string;
  },
) => {
  const { code, cookie } = await fetchCaptcha(request);

  const response = await request.post(`${API_URL}/comments`, {
    multipart: {
      fullName: input.fullName,
      email: input.email,
      text: input.text,
      captcha: code,
      ...(input.homepage ? { homepage: input.homepage } : {}),
    },
    headers: {
      Cookie: cookie,
    },
  });

  if (!response.ok()) {
    throw new Error(`Create comment failed: ${String(response.status())} ${await response.text()}`);
  }

  return await (response.json() as Promise<{
    id: string;
    fullName: string;
    email: string;
    text: string;
  }>);
};

export const fillCommentForm = async (
  page: Page,
  input: {
    fullName: string;
    email: string;
    text: string;
    homepage?: string;
    withImage?: boolean;
    withTextFile?: boolean;
  },
) => {
  await page.getByTestId('comment-full-name').fill(input.fullName);
  await page.getByTestId('comment-email').fill(input.email);
  if (input.homepage) {
    await page.getByTestId('comment-homepage').fill(input.homepage);
  }
  await page.getByTestId('comment-text').fill(input.text);

  if (input.withImage) {
    await page.getByTestId('comment-image').setInputFiles(path.join(fixturesDir, 'sample.png'));
  }
  if (input.withTextFile) {
    await page.getByTestId('comment-text-file').setInputFiles(path.join(fixturesDir, 'sample.txt'));
  }
};

export const openRootCommentForm = async (page: Page) => {
  await page.getByTestId('home-page').waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Add Comment', exact: true }).click();
  await expectFormVisible(page);
};

const expectFormVisible = async (page: Page) => {
  await page.getByTestId('comment-form').waitFor({ state: 'visible', timeout: 15_000 });
};

export const submitCommentForm = async (page: Page) => {
  const captcha = await prepareCaptcha(page);
  await page.getByTestId('comment-captcha').fill(captcha);
  await page.getByTestId('comment-submit').click();
};
