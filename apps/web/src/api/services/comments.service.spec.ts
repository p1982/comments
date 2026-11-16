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
});
