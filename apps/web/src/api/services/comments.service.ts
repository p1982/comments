import type { AxiosResponse } from 'axios';

import {
  ENDPOINTS,
  type CommentsListQuery,
  type CommentsResult,
  type CommentsSchema,
  type CommentsSearchQuery,
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

  createComment(
    comment: CommentsSchema,
    image?: File,
    textFile?: File,
  ): Promise<AxiosResponse<CreateCommentResponse>> {
    const body = new FormData();
    body.append('fullName', comment.fullName);
    body.append('email', comment.email);
    body.append('text', comment.text);
    body.append('captcha', comment.captcha);
    if (comment.homepage) body.append('homepage', comment.homepage);
    if (comment.parentId) body.append('parentId', comment.parentId);
    if (image) body.append('image', image);
    if (textFile) body.append('textFile', textFile);
    return this.post(ENDPOINTS.COMMENTS, body);
  }

  searchComments(query: CommentsSearchQuery): Promise<AxiosResponse<CommentsResult>> {
    return this.get(`${ENDPOINTS.COMMENTS}${ENDPOINTS.SEARCH}`, {
      params: {
        q: query.q,
        page: query.page,
        limit: query.limit,
      },
    });
  }
}

const commentsService = new CommentsServices();

export default commentsService;
