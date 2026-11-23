import { expect, test } from '@playwright/test';

import {
  createCommentViaApi,
  fillCommentForm,
  openRootCommentForm,
  submitCommentForm,
} from './helpers/comments';
import { LOCALE_PATH } from './helpers/env';

test.describe.configure({ mode: 'serial' });

test.describe('comments browser flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(LOCALE_PATH);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await expect(page.getByTestId('home-page')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Comment', exact: true })).toBeVisible();
  });

  test('shows preview without reload', async ({ page }) => {
    await openRootCommentForm(page);

    await fillCommentForm(page, {
      fullName: 'PreviewUser',
      email: 'preview@example.com',
      text: 'Preview <strong>works</strong>',
    });
    await page.getByTestId('comment-captcha').fill('TEMP');
    await page.getByTestId('comment-preview').click();

    const preview = page.getByTestId('comment-preview-card');
    await expect(preview).toBeVisible();
    await expect(page.getByTestId('comment-preview-name')).toHaveText('PreviewUser');
    await expect(page.getByTestId('comment-preview-text')).toContainText('Preview');
    await expect(page.getByTestId('comment-preview-text').locator('strong')).toHaveText('works');
  });

  test('creates a root comment via the form', async ({ page }) => {
    const stamp = Date.now().toString().slice(-6);
    const fullName = `FormUser${stamp}`;
    const text = `Form comment ${stamp}`;

    await openRootCommentForm(page);
    await fillCommentForm(page, {
      fullName,
      email: `form${stamp}@example.com`,
      text,
    });
    await submitCommentForm(page);

    await expect(page.getByTestId('comment-form')).toHaveCount(0);
    await expect(page.getByTestId('comment-card-name').filter({ hasText: fullName })).toBeVisible();
    await expect(page.getByTestId('comment-card-text').filter({ hasText: text })).toBeVisible();
  });

  test('uploads an image and a text file with a comment', async ({ page }) => {
    const stamp = Date.now().toString().slice(-6);
    const fullName = `FileUser${stamp}`;

    await openRootCommentForm(page);
    await fillCommentForm(page, {
      fullName,
      email: `file${stamp}@example.com`,
      text: `Attachment comment ${stamp}`,
      withImage: true,
      withTextFile: true,
    });

    const createResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/comments') &&
        response.request().method() === 'POST' &&
        response.status() < 500,
    );
    await submitCommentForm(page);
    const response = await createResponse;
    expect(response.ok()).toBeTruthy();

    const card = page
      .getByTestId('comment-card')
      .filter({ has: page.getByTestId('comment-card-name').filter({ hasText: fullName }) });
    await expect(card).toBeVisible();
    await expect(card.getByTestId('comment-attachment-image')).toBeVisible({ timeout: 20_000 });
    await expect(card.getByTestId('comment-attachment-text')).toBeVisible();
  });

  test('sorts root comments by name', async ({ page, request }) => {
    const stamp = Date.now().toString().slice(-5);
    await createCommentViaApi(request, {
      fullName: `Zed${stamp}`,
      email: `zed${stamp}@example.com`,
      text: `sort z ${stamp}`,
    });
    await createCommentViaApi(request, {
      fullName: `Ann${stamp}`,
      email: `ann${stamp}@example.com`,
      text: `sort a ${stamp}`,
    });

    await page.reload();
    await page.getByTestId('sort-fullName').click();

    const names = page.getByTestId('comment-card-name');
    await expect.poll(async () => await names.first().textContent()).toContain(`Ann${stamp}`);

    const texts = await names.allTextContents();
    const annIndex = texts.findIndex((name) => name.includes(`Ann${stamp}`));
    const zedIndex = texts.findIndex((name) => name.includes(`Zed${stamp}`));
    expect(annIndex).toBeGreaterThanOrEqual(0);
    expect(zedIndex).toBeGreaterThanOrEqual(0);
    expect(annIndex).toBeLessThan(zedIndex);
  });

  test('paginates root comments', async ({ page, request }) => {
    const stamp = Date.now().toString().slice(-5);
    for (let index = 0; index < 26; index += 1) {
      await createCommentViaApi(request, {
        fullName: `Page${stamp}${String(index).padStart(2, '0')}`,
        email: `page${stamp}${String(index)}@example.com`,
        text: `pagination ${stamp} ${String(index)}`,
      });
    }

    await page.reload();
    const pagination = page.getByTestId('comments-pagination');
    await expect(pagination).toBeVisible();

    const firstPageNames = await page.getByTestId('comment-card-name').allTextContents();
    await pagination.getByRole('button', { name: 'Go to page 2' }).click();
    await expect.poll(() => page.url()).toContain('page=2');

    const secondPageNames = await page.getByTestId('comment-card-name').allTextContents();
    expect(secondPageNames.length).toBeGreaterThan(0);
    expect(secondPageNames.join('|')).not.toEqual(firstPageNames.join('|'));
  });
});
