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
    };

    await expect(commentsService.createComment(comment)).resolves.toBe(response);
    expect(post).toHaveBeenCalledWith(ENDPOINTS.COMMENTS, comment, undefined);

    post.mockRestore();
  });
});
