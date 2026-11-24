import { isAxiosError } from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  CommentResponse,
  CommentSortField,
  CommentSortOrder,
  CommentsListQuery,
  CommentsSchema,
  CommentsSearchQuery,
  CommentVotedEventPayload,
  CommentVoteValue,
  GetCommentsQuery,
  UserVoteValue,
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
  bookmarkedComments: Record<string, CommentResponse>;
  showBookmarksOnly: boolean;
  page: number;
  limit: number;
  sort: CommentSortField;
  order: CommentSortOrder;
  searchQuery: string | null;
  total: number;
  totalPages: number;
  comment: CommentResponse | null;
  isLoading: boolean;
  loadingChildrenIds: Record<string, boolean>;
  votingCommentIds: Record<string, boolean>;
  expandedRootIds: Record<string, boolean>;
  error: string | null;
  commentTarget: CommentTarget | null;
  fetchComments: (query?: GetCommentsQuery) => Promise<void>;
  fetchChildrenComments: (rootId: string) => Promise<void>;
  setRootExpanded: (rootId: string, expanded: boolean) => void;
  createComment: (comment: CommentsSchema, image?: File, textFile?: File) => Promise<void>;
  openRootForm: () => void;
  openReplyForm: (parentId: string, rootId: string, initialText?: string) => void;
  closeCommentForm: () => void;
  toggleBookmark: (comment: CommentResponse) => boolean;
  setShowBookmarksOnly: (show: boolean) => void;
  applyRemoteComment: (comment: CommentResponse) => void;
  applyRemoteVote: (payload: CommentVotedEventPayload) => void;
  voteComment: (commentId: string, rootId: string, value: CommentVoteValue) => Promise<void>;
  searchComments: (query: CommentsSearchQuery) => Promise<void>;
}

interface CommentTarget {
  parentId: string | null;
  rootId: string | null;
  initialText?: string;
}

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError<{ message?: string | string[] } | undefined>(error)) {
    const apiMessage = error.response?.data?.message;
    if (Array.isArray(apiMessage) && apiMessage.length > 0) {
      return apiMessage.join(', ');
    }
    if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
      return apiMessage;
    }
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

const omitKey = (record: Record<string, boolean>, target: string): Record<string, boolean> =>
  Object.fromEntries(Object.entries(record).filter(([key]) => key !== target));

const useCommentsStore = create<CommentsState>()(
  persist(
    (set, get) => ({
      comments: {},
      childrenComments: {},
      bookmarkedComments: {},
      showBookmarksOnly: false,
      isLoading: false,
      loadingChildrenIds: {},
      votingCommentIds: {},
      expandedRootIds: {},
      error: null,
      commentsIds: [],
      total: 0,
      totalPages: 0,
      comment: null,
      page: 1,
      limit: 25,
      sort: 'createdAt',
      order: 'desc',
      searchQuery: null,
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
            searchQuery: null,
            total: data.total ?? 0,
            totalPages: data.totalPages ?? 0,
          });
        } catch (error) {
          const message = extractErrorMessage(error, 'Failed to load comments');
          set({ error: message });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchChildrenComments: async (rootId: string) => {
        set((state) => ({
          loadingChildrenIds: { ...state.loadingChildrenIds, [rootId]: true },
          error: null,
        }));
        try {
          const { data } = await commentsService.getCommentByIdRoot(rootId);
          const [comments, commentsIds] = reduceComments(data.data);
          set((state) => {
            const rootComment = state.comments[rootId];
            return {
              childrenComments: {
                ...state.childrenComments,
                [rootId]: {
                  comments,
                  commentsIds,
                  rootId,
                },
              },
              ...(rootComment
                ? {
                    comments: {
                      ...state.comments,
                      [rootId]: { ...rootComment, repliesCount: commentsIds.length },
                    },
                  }
                : {}),
            };
          });
        } catch (error) {
          const message = extractErrorMessage(error, 'Failed to load comments');
          set({ error: message });
        } finally {
          set((state) => ({
            loadingChildrenIds: omitKey(state.loadingChildrenIds, rootId),
          }));
        }
      },
      setRootExpanded: (rootId: string, expanded: boolean) => {
        set((state) => ({
          expandedRootIds: expanded
            ? { ...state.expandedRootIds, [rootId]: true }
            : omitKey(state.expandedRootIds, rootId),
        }));
      },
      createComment: async (comment: CommentsSchema, image?: File, textFile?: File) => {
        const rootId = comment.parentId ? (get().commentTarget?.rootId ?? comment.parentId) : null;
        if (rootId) {
          set((state) => ({
            loadingChildrenIds: { ...state.loadingChildrenIds, [rootId]: true },
            error: null,
          }));
        } else {
          set({ isLoading: true, error: null });
        }
        try {
          await commentsService.createComment(comment, image, textFile);
          if (rootId) {
            await get().fetchChildrenComments(rootId);
            get().setRootExpanded(rootId, true);
            return;
          }
          await get().fetchComments({ page: 1 });
        } catch (error) {
          const message = extractErrorMessage(error, 'Failed to create comment');
          set({ error: message });
        } finally {
          if (rootId) {
            set((state) => ({
              loadingChildrenIds: omitKey(state.loadingChildrenIds, rootId),
            }));
          } else {
            set({ isLoading: false });
          }
        }
      },
      openRootForm: () => {
        set({ commentTarget: { parentId: null, rootId: null } });
      },
      openReplyForm: (parentId: string, rootId: string, initialText?: string) => {
        set({
          commentTarget: {
            parentId,
            rootId,
            ...(initialText ? { initialText } : {}),
          },
        });
      },
      closeCommentForm: () => {
        set({ commentTarget: null, error: null });
      },
      toggleBookmark: (comment: CommentResponse) => {
        const exists = Boolean(get().bookmarkedComments[comment.id]);
        if (exists) {
          set((state) => ({
            bookmarkedComments: Object.fromEntries(
              Object.entries(state.bookmarkedComments).filter(([id]) => id !== comment.id),
            ),
          }));
          return false;
        }
        set((state) => ({
          bookmarkedComments: {
            ...state.bookmarkedComments,
            [comment.id]: comment,
          },
        }));
        return true;
      },
      setShowBookmarksOnly: (show: boolean) => {
        set({ showBookmarksOnly: show });
      },
      applyRemoteComment: (comment: CommentResponse) => {
        const state = get();

        if (comment.parentId === null) {
          if (state.comments[comment.id]) {
            set({
              comments: { ...state.comments, [comment.id]: comment },
            });
            return;
          }

          const nextIds = (
            state.sort === 'createdAt' && state.order === 'desc'
              ? [comment.id, ...state.commentsIds]
              : [...state.commentsIds, comment.id]
          ).slice(0, state.limit);
          const keptIds = new Set(nextIds);
          const nextComments = Object.fromEntries(
            Object.entries({ ...state.comments, [comment.id]: comment }).filter(([id]) =>
              keptIds.has(id),
            ),
          );

          set({
            comments: nextComments,
            commentsIds: nextIds,
            total: state.total + 1,
            totalPages: Math.ceil((state.total + 1) / state.limit),
          });
          return;
        }

        const parentId = comment.parentId;
        const rootId = Object.keys(state.childrenComments).find((id) => {
          const thread = state.childrenComments[id];
          return Boolean(thread?.comments[parentId]) || thread?.rootId === parentId;
        });

        if (!rootId) {
          const directRoot = state.comments[parentId];
          if (directRoot) {
            set({
              comments: {
                ...state.comments,
                [parentId]: {
                  ...directRoot,
                  repliesCount: (directRoot.repliesCount ?? 0) + 1,
                },
              },
            });
          }
          return;
        }

        const thread = state.childrenComments[rootId];
        if (!thread || thread.comments[comment.id]) {
          if (thread?.comments[comment.id]) {
            set({
              childrenComments: {
                ...state.childrenComments,
                [rootId]: {
                  ...thread,
                  comments: { ...thread.comments, [comment.id]: comment },
                },
              },
            });
          }
          return;
        }

        const nextCommentsIds = [...thread.commentsIds, comment.id];
        const rootComment = state.comments[rootId];

        set({
          childrenComments: {
            ...state.childrenComments,
            [rootId]: {
              ...thread,
              comments: { ...thread.comments, [comment.id]: comment },
              commentsIds: nextCommentsIds,
            },
          },
          ...(rootComment
            ? {
                comments: {
                  ...state.comments,
                  [rootId]: {
                    ...rootComment,
                    repliesCount: Math.max(
                      (rootComment.repliesCount ?? 0) + 1,
                      nextCommentsIds.length,
                    ),
                  },
                },
              }
            : {}),
        });
      },
      applyRemoteVote: ({ commentId, rootId, votesScore }: CommentVotedEventPayload) => {
        set((state) => {
          const topLevel = state.comments[commentId];
          const thread = state.childrenComments[rootId];
          const nested = thread?.comments[commentId];
          const bookmarked = state.bookmarkedComments[commentId];

          if (!topLevel && !nested && !bookmarked) {
            return state;
          }

          return {
            ...(topLevel
              ? {
                  comments: {
                    ...state.comments,
                    [commentId]: { ...topLevel, votesScore },
                  },
                }
              : {}),
            ...(thread && nested
              ? {
                  childrenComments: {
                    ...state.childrenComments,
                    [rootId]: {
                      ...thread,
                      comments: {
                        ...thread.comments,
                        [commentId]: { ...nested, votesScore },
                      },
                    },
                  },
                }
              : {}),
            ...(bookmarked
              ? {
                  bookmarkedComments: {
                    ...state.bookmarkedComments,
                    [commentId]: { ...bookmarked, votesScore },
                  },
                }
              : {}),
          };
        });
      },
      voteComment: async (commentId: string, rootId: string, value: CommentVoteValue) => {
        const snapshot = get();
        const existing =
          snapshot.comments[commentId] ??
          snapshot.childrenComments[rootId]?.comments[commentId] ??
          snapshot.bookmarkedComments[commentId];
        if (!existing || snapshot.votingCommentIds[commentId]) {
          return;
        }

        const prevScore = existing.votesScore ?? 0;
        const prevVote: UserVoteValue = existing.userVote ?? 0;
        const nextVote: UserVoteValue = prevVote === value ? 0 : value;
        const nextScore = prevScore + (nextVote - prevVote);

        const patchVote = (votesScore: number, userVote: UserVoteValue) => {
          set((state) => {
            const topLevel = state.comments[commentId];
            const thread = state.childrenComments[rootId];
            const nested = thread?.comments[commentId];
            const bookmarked = state.bookmarkedComments[commentId];

            return {
              ...(topLevel
                ? {
                    comments: {
                      ...state.comments,
                      [commentId]: { ...topLevel, votesScore, userVote },
                    },
                  }
                : {}),
              ...(thread && nested
                ? {
                    childrenComments: {
                      ...state.childrenComments,
                      [rootId]: {
                        ...thread,
                        comments: {
                          ...thread.comments,
                          [commentId]: { ...nested, votesScore, userVote },
                        },
                      },
                    },
                  }
                : {}),
              ...(bookmarked
                ? {
                    bookmarkedComments: {
                      ...state.bookmarkedComments,
                      [commentId]: { ...bookmarked, votesScore, userVote },
                    },
                  }
                : {}),
            };
          });
        };

        set((state) => ({
          votingCommentIds: { ...state.votingCommentIds, [commentId]: true },
          error: null,
        }));
        patchVote(nextScore, nextVote);

        try {
          const { data } = await commentsService.voteComment(commentId, value);
          patchVote(data.votesScore, data.userVote);
        } catch (error) {
          patchVote(prevScore, prevVote);
          const message = extractErrorMessage(error, 'Failed to vote comment');
          set({ error: message });
        } finally {
          set((state) => ({
            votingCommentIds: omitKey(state.votingCommentIds, commentId),
          }));
        }
      },
      searchComments: async (query: CommentsSearchQuery) => {
        set({ isLoading: true, error: null, showBookmarksOnly: false });
        try {
          const { data } = await commentsService.searchComments(query);
          const [comments, commentsIds] = reduceComments(data.data);
          set({
            comments,
            commentsIds,
            page: query.page,
            limit: query.limit,
            searchQuery: query.q,
            total: data.total ?? 0,
            totalPages: data.totalPages ?? 0,
          });
        } catch (error) {
          const message = extractErrorMessage(error, 'Failed to search comments');
          set({
            comments: {},
            commentsIds: [],
            page: query.page,
            limit: query.limit,
            searchQuery: query.q,
            total: 0,
            totalPages: 0,
            error: message,
          });
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
        childrenComments: state.childrenComments,
        bookmarkedComments: state.bookmarkedComments,
      }),
    },
  ),
);

export default useCommentsStore;
