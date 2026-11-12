import type { AxiosResponse } from 'axios';

import { ENDPOINTS, type CommentResponse, type CommentsListQuery } from '@comments/shared';

import axiosInstance from '../axios/axios-instance';
import AbstractApiServices from './abstract.service';

class CommentsServices extends AbstractApiServices {
  constructor() {
    super(axiosInstance);
  }

  getComments(query: CommentsListQuery): Promise<AxiosResponse<CommentResponse[]>> {
    return this.get(ENDPOINTS.COMMENTS, {
      params: {
        page: query.page,
        limit: query.limit,
        sort: query.sort,
        order: query.order,
      },
    });
  }
}

const commentsService = new CommentsServices();

export default commentsService;
