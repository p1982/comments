import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  CommentResponse,
  CommentSortField,
  CommentSortOrder,
  CommentsListQuery,
  CommentsSchema,
  GetCommentsQuery,
} from '@comments/shared';
import commentsService from '@/api/services/comments.service';
import { reduceComments } from '@/utils';

interface ChildrenCommentsState {
  comments: Record<string, CommentResponse>;
  commentsIds: string[];
  rootId: string | null;
}

interface CommentsState {
  comments: Record<string, CommentResponse>;
  commentsIds: string[];
  childrenComments: Record<string, ChildrenCommentsState>;
  page: number;
  limit: number;
  sort: CommentSortField;
  order: CommentSortOrder;
  total: number;
  totalPages: number;
  comment: CommentResponse | null;
  isLoading: boolean;
  error: string | null;
  commentTarget: CommentTarget | null;
  fetchComments: (query?: GetCommentsQuery) => Promise<void>;
  fetchChildrenComments: (rootId: string) => Promise<void>;
  createComment: (comment: CommentsSchema, image?: File, textFile?: File) => Promise<void>;
  openRootForm: () => void;
  openReplyForm: (parentId: string, rootId: string) => void;
  closeCommentForm: () => void;
}

interface CommentTarget {
  parentId: string | null;
  rootId: string | null;
}

const useCommentsStore = create<CommentsState>()(
  persist(
    (set, get) => ({
      comments: {},
      childrenComments: {},
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
      commentTarget: null,
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
          const [comments, commentsIds] = reduceComments(data.data);

          set({
            comments,
            commentsIds,
            page: nextQuery.page,
            limit: nextQuery.limit,
            sort: nextQuery.sort,
            order: nextQuery.order,
            total: data.total ?? 0,
            totalPages: data.totalPages ?? 0,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to load comments';
          set({ error: message });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchChildrenComments: async (rootId: string) => {
        const state = get();
        set({ isLoading: true, error: null });
        try {
          const { data } = await commentsService.getCommentByIdRoot(rootId);
          const [comments, commentsIds] = reduceComments(data.data);
          set({
            childrenComments: {
              ...state.childrenComments,
              [rootId]: {
                comments,
                commentsIds,
                rootId,
              },
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to load comments';
          set({ error: message });
        } finally {
          set({ isLoading: false });
        }
      },
      createComment: async (comment: CommentsSchema, image?: File, textFile?: File) => {
        const rootId = comment.parentId ? (get().commentTarget?.rootId ?? comment.parentId) : null;
        set({ isLoading: true, error: null });
        try {
          await commentsService.createComment(comment, image, textFile);
          if (rootId) {
            await get().fetchChildrenComments(rootId);
            return;
          }
          await get().fetchComments({ page: 1 });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create comment';
          set({ error: message });
        } finally {
          set({ isLoading: false });
        }
      },
      openRootForm: () => {
        set({ commentTarget: { parentId: null, rootId: null } });
      },
      openReplyForm: (parentId: string, rootId: string) => {
        set({ commentTarget: { parentId, rootId } });
      },
      closeCommentForm: () => {
        set({ commentTarget: null });
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
        childrenComments: state.childrenComments,
      }),
    },
  ),
);

export default useCommentsStore;
