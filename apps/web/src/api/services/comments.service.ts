import type { AxiosResponse } from 'axios';

import {
  ENDPOINTS,
  type CommentsListQuery,
  type CommentsResult,
  type CommentsSchema,
  type CreateCommentResponse,
} from '@comments/shared';

import axiosInstance from '../axios/axios-instance';
import AbstractApiServices from './abstract.service';

class CommentsServices extends AbstractApiServices {
  constructor() {
    super(axiosInstance);
  }

  getComments(query: CommentsListQuery): Promise<AxiosResponse<CommentsResult>> {
    return this.get(ENDPOINTS.COMMENTS, {
      params: {
        page: query.page,
        limit: query.limit,
        sort: query.sort,
        order: query.order,
      },
    });
  }

  getCommentByIdRoot(rootId: string): Promise<AxiosResponse<CommentsResult>> {
    return this.get(`${ENDPOINTS.COMMENTS}/${rootId}`);
  }

  createComment(comment: CommentsSchema): Promise<AxiosResponse<CreateCommentResponse>> {
    return this.post(ENDPOINTS.COMMENTS, comment);
  }
}

const commentsService = new CommentsServices();

export default commentsService;
