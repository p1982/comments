import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  CommentResponse,
  CommentSortField,
  CommentSortOrder,
  CommentsListQuery,
  GetCommentsQuery,
} from '@comments/shared';
import commentsService from '@/api/services/comments.service';

interface CommentsState {
  comments: Record<string, CommentResponse>;
  commentsIds: string[];
  page: number;
  limit: number;
  sort: CommentSortField;
  order: CommentSortOrder;
  total: number;
  totalPages: number;
  comment: CommentResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchComments: (query?: GetCommentsQuery) => Promise<void>;
}

const useCommentsStore = create<CommentsState>()(
  persist(
    (set, get) => ({
      comments: {},
      isLoading: false,
      error: null,
      commentsIds: [],
      total: 0,
      totalPages: 0,
      comment: null,
      page: 1,
      limit: 25,
      sort: 'createdAt',
      order: 'desc',
      fetchComments: async (query: GetCommentsQuery = {}) => {
        const state = get();
        const nextQuery: CommentsListQuery = {
          page: query.page ?? state.page,
          limit: query.limit ?? state.limit,
          sort: query.sort ?? state.sort,
          order: query.order ?? state.order,
        };

        set({ isLoading: true, error: null });
        try {
          const { data } = await commentsService.getComments(nextQuery);
          const comments = {
            ...state.comments,
            ...Object.fromEntries(data.map((comment) => [comment.id, comment])),
          };

          set({
            comments,
            commentsIds: data.map((comment) => comment.id),
            page: nextQuery.page,
            limit: nextQuery.limit,
            sort: nextQuery.sort,
            order: nextQuery.order,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to load comments';
          set({ error: message });
        } finally {
          set({ isLoading: false });
        }
      },
    }),

    {
      name: 'comments-store',
      partialize: (state) => ({
        comments: state.comments,
        commentsIds: state.commentsIds,
        page: state.page,
        limit: state.limit,
        sort: state.sort,
        order: state.order,
        total: state.total,
        totalPages: state.totalPages,
        comment: state.comment,
      }),
    },
  ),
);

export default useCommentsStore;
