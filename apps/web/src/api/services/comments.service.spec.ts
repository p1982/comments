import type { AxiosResponse } from 'axios';

import { ENDPOINTS } from '@comments/shared';

import axiosInstance from '../axios/axios-instance';
import commentsService from './comments.service';

describe('commentsService', () => {
  it('loads comments with the list query', async () => {
    const response = { data: [] } as AxiosResponse;
    const get = jest.spyOn(axiosInstance, 'get').mockResolvedValue(response);
    const query = {
      page: 1,
      limit: 25,
      sort: 'createdAt' as const,
      order: 'desc' as const,
    };

    await expect(commentsService.getComments(query)).resolves.toBe(response);

    expect(get).toHaveBeenCalledWith(ENDPOINTS.COMMENTS, {
      params: {
        page: query.page,
        limit: query.limit,
        sort: query.sort,
        order: query.order,
      },
    });

    get.mockRestore();
  });

  it('loads a thread by root id', async () => {
    const response = { data: [] } as AxiosResponse;
    const get = jest.spyOn(axiosInstance, 'get').mockResolvedValue(response);

    await expect(commentsService.getCommentByIdRoot('root-1')).resolves.toBe(response);
    expect(get).toHaveBeenCalledWith(`${ENDPOINTS.COMMENTS}/root-1`, undefined);

    get.mockRestore();
  });

  it('creates a comment', async () => {
    const response = { data: { id: '1' } } as AxiosResponse;
    const post = jest.spyOn(axiosInstance, 'post').mockResolvedValue(response);
    const comment = {
      fullName: 'Formcheck',
      email: 'formcheck@example.com',
      homepage: 'https://example.com',
      text: '<strong>Form check</strong>',
      captcha: 'AB12C',
    };

    const image = new File(['png'], 'photo.png', { type: 'image/png' });

    await expect(
      commentsService.createComment({ ...comment, parentId: 'parent-1' }, image),
    ).resolves.toBe(response);

    const body = post.mock.calls[0]?.[1] as FormData;
    expect(post).toHaveBeenCalledWith(ENDPOINTS.COMMENTS, expect.any(FormData), undefined);
    expect(body.get('fullName')).toBe(comment.fullName);
    expect(body.get('email')).toBe(comment.email);
    expect(body.get('text')).toBe(comment.text);
    expect(body.get('captcha')).toBe(comment.captcha);
    expect(body.get('homepage')).toBe(comment.homepage);
    expect(body.get('parentId')).toBe('parent-1');
    expect(body.get('image')).toBe(image);

    await commentsService.createComment({
      fullName: comment.fullName,
      email: comment.email,
      text: comment.text,
      captcha: comment.captcha,
    });
    const plain = post.mock.calls[1]?.[1] as FormData;
    expect(plain.get('homepage')).toBeNull();
    expect(plain.get('parentId')).toBeNull();
    expect(plain.get('image')).toBeNull();

    post.mockRestore();
  });

  it('searches comments with query params', async () => {
    const response = { data: { data: [] } } as AxiosResponse;
    const get = jest.spyOn(axiosInstance, 'get').mockResolvedValue(response);

    await expect(
      commentsService.searchComments({ q: '8000014', page: 1, limit: 25 }),
    ).resolves.toBe(response);
    expect(get).toHaveBeenCalledWith(`${ENDPOINTS.COMMENTS}${ENDPOINTS.SEARCH}`, {
      params: { q: '8000014', page: 1, limit: 25 },
    });

    get.mockRestore();
  });

  it('votes on a comment', async () => {
    const response = { data: { commentId: 'c1', votesScore: 1, userVote: 1 } } as AxiosResponse;
    const post = jest.spyOn(axiosInstance, 'post').mockResolvedValue(response);

    await expect(commentsService.voteComment('c1', 1)).resolves.toBe(response);
    expect(post).toHaveBeenCalledWith(
      `${ENDPOINTS.COMMENTS}/c1${ENDPOINTS.VOTE}`,
      { value: 1 },
      undefined,
    );

    post.mockRestore();
  });

  it('loads captcha svg as text with cache-busting timestamp', async () => {
    const response = { data: '<svg></svg>' } as AxiosResponse<string>;
    const get = jest.spyOn(axiosInstance, 'get').mockResolvedValue(response);
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);

    await expect(commentsService.getCaptcha()).resolves.toBe(response);
    expect(get).toHaveBeenCalledWith(ENDPOINTS.CAPTCHA, {
      responseType: 'text',
      params: { t: 1_700_000_000_000 },
    });

    now.mockRestore();
    get.mockRestore();
  });
});
