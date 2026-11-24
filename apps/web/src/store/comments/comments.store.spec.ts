import type { AxiosResponse } from 'axios';

import type { CommentAttachments, CommentResponse, CommentsResult } from '@comments/shared';
import commentsService from '@/api/services/comments.service';

import useCommentsStore, { mergeComment, resetRecentRemoteAttachments } from './comments.store';

jest.mock('@/api/services/comments.service', () => ({
  __esModule: true,
  default: {
    getComments: jest.fn(),
    getCommentByIdRoot: jest.fn(),
    createComment: jest.fn(),
    searchComments: jest.fn(),
    voteComment: jest.fn(),
    getCaptcha: jest.fn(),
  },
}));

const makeAttachment = (overrides: Partial<CommentAttachments> = {}): CommentAttachments => ({
  id: 'att-1',
  fileName: 'photo.jpg',
  fileType: 'image',
  mimeType: 'image/jpeg',
  url: '/assets/att-1.jpeg',
  ...overrides,
});

const makeComment = (overrides: Partial<CommentResponse> = {}): CommentResponse => ({
  id: 'comment-1',
  text: 'hello',
  createdAt: '2026-11-24T19:00:00.000Z',
  fullName: 'PavloIermakov',
  email: 'ptopdruk@gmail.com',
  homepage: '',
  parentId: null,
  repliesCount: 0,
  votesScore: 0,
  userVote: 0,
  attachments: [],
  ...overrides,
});

const axiosOk = <T>(data: T): AxiosResponse<T> =>
  ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  }) as AxiosResponse<T>;

const resetStore = () => {
  useCommentsStore.setState({
    comments: {},
    commentsIds: [],
    childrenComments: {},
    bookmarkedComments: {},
    showBookmarksOnly: false,
    page: 1,
    limit: 25,
    sort: 'createdAt',
    order: 'desc',
    searchQuery: null,
    total: 0,
    totalPages: 0,
    comment: null,
    isLoading: false,
    loadingChildrenIds: {},
    votingCommentIds: {},
    expandedRootIds: {},
    error: null,
    commentTarget: null,
  });
};

describe('comments.store async image attachment sync', () => {
  const getCommentByIdRootMock = jest.mocked(commentsService.getCommentByIdRoot);
  const createCommentMock = jest.mocked(commentsService.createComment);

  beforeEach(() => {
    jest.clearAllMocks();
    resetRecentRemoteAttachments();
    resetStore();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('mergeComment preserves existing attachments, repliesCount, and userVote on stale WS payloads', () => {
    const photo = makeAttachment();
    const existing = makeComment({
      id: 'root-1',
      repliesCount: 3,
      userVote: 1,
      votesScore: 5,
      attachments: [photo],
    });
    const staleOutbox = makeComment({
      id: 'root-1',
      repliesCount: 0,
      userVote: 0,
      votesScore: 5,
      attachments: [],
    });

    const merged = mergeComment(existing, staleOutbox, { preserveUserState: true });

    expect(merged.attachments).toEqual([photo]);
    expect(merged.repliesCount).toBe(3);
    expect(merged.userVote).toBe(1);
    expect(merged.votesScore).toBe(5);
  });

  it('applyRemoteComment keeps processed reply photo when stale outbox event arrives later', () => {
    const photo = makeAttachment({ id: 'att-2', url: '/assets/att-2.jpeg' });
    const root = makeComment({ id: 'root-1', repliesCount: 1 });
    const replyWithPhoto = makeComment({
      id: 'reply-2',
      parentId: 'root-1',
      attachments: [photo],
    });

    useCommentsStore.setState({
      comments: { 'root-1': root },
      commentsIds: ['root-1'],
      childrenComments: {
        'root-1': {
          rootId: 'root-1',
          commentsIds: ['reply-2'],
          comments: { 'reply-2': replyWithPhoto },
        },
      },
    });

    useCommentsStore.getState().applyRemoteComment(
      makeComment({
        id: 'reply-2',
        parentId: 'root-1',
        attachments: [],
      }),
    );

    expect(
      useCommentsStore.getState().childrenComments['root-1']?.comments['reply-2']?.attachments,
    ).toEqual([photo]);
  });

  it('fetchChildrenComments does not erase an image attachment just received via WS', async () => {
    const photo = makeAttachment({ id: 'att-3', url: '/assets/att-3.jpeg' });
    const replyPending = makeComment({
      id: 'reply-3',
      parentId: 'reply-1',
      attachments: [],
    });

    useCommentsStore.setState({
      comments: { 'root-1': makeComment({ id: 'root-1' }) },
      commentsIds: ['root-1'],
      childrenComments: {
        'root-1': {
          rootId: 'root-1',
          commentsIds: ['reply-1', 'reply-3'],
          comments: {
            'reply-1': makeComment({ id: 'reply-1', parentId: 'root-1' }),
            'reply-3': replyPending,
          },
        },
      },
    });

    useCommentsStore.getState().applyRemoteComment({
      ...replyPending,
      attachments: [photo],
    });

    getCommentByIdRootMock.mockResolvedValue(
      axiosOk<CommentsResult>({
        data: [
          makeComment({ id: 'reply-1', parentId: 'root-1' }),
          makeComment({ id: 'reply-3', parentId: 'reply-1', attachments: [] }),
        ],
        status: 'success',
        message: 'ok',
      }),
    );

    await useCommentsStore.getState().fetchChildrenComments('root-1');

    expect(
      useCommentsStore.getState().childrenComments['root-1']?.comments['reply-3']?.attachments,
    ).toEqual([photo]);
  });

  it('fetchChildrenComments drops attachments that were deleted in DB on normal refresh', async () => {
    const stalePhoto = makeAttachment({ id: 'att-old', url: '/assets/att-old.jpeg' });

    useCommentsStore.setState({
      comments: { 'root-1': makeComment({ id: 'root-1' }) },
      commentsIds: ['root-1'],
      childrenComments: {
        'root-1': {
          rootId: 'root-1',
          commentsIds: ['reply-old'],
          comments: {
            'reply-old': makeComment({
              id: 'reply-old',
              parentId: 'root-1',
              attachments: [stalePhoto],
            }),
          },
        },
      },
    });

    getCommentByIdRootMock.mockResolvedValue(
      axiosOk<CommentsResult>({
        data: [makeComment({ id: 'reply-old', parentId: 'root-1', attachments: [] })],
        status: 'success',
        message: 'ok',
      }),
    );

    await useCommentsStore.getState().fetchChildrenComments('root-1');

    expect(
      useCommentsStore.getState().childrenComments['root-1']?.comments['reply-old']?.attachments,
    ).toEqual([]);
  });

  it('createComment schedules silent fallback sync when an uploaded reply image is not ready yet', async () => {
    jest.useFakeTimers();

    const photo = makeAttachment({ id: 'att-4', url: '/assets/att-4.jpeg' });
    const replyPending = makeComment({ id: 'reply-4', parentId: 'root-1', attachments: [] });
    const replyReady = makeComment({ id: 'reply-4', parentId: 'root-1', attachments: [photo] });

    useCommentsStore.setState({
      comments: { 'root-1': makeComment({ id: 'root-1' }) },
      commentsIds: ['root-1'],
      commentTarget: { parentId: 'root-1', rootId: 'root-1' },
    });

    createCommentMock.mockResolvedValue(
      axiosOk({
        data: replyPending,
        status: 'success',
        message: 'ok',
      }),
    );
    getCommentByIdRootMock
      .mockResolvedValueOnce(
        axiosOk<CommentsResult>({ data: [replyPending], status: 'success', message: 'ok' }),
      )
      .mockResolvedValueOnce(
        axiosOk<CommentsResult>({ data: [replyReady], status: 'success', message: 'ok' }),
      );

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    await useCommentsStore.getState().createComment(
      {
        fullName: 'PavloIermakov',
        email: 'ptopdruk@gmail.com',
        text: 'why?',
        captcha: 'ABCDE',
        parentId: 'root-1',
      },
      file,
    );

    expect(getCommentByIdRootMock).toHaveBeenCalledTimes(1);
    expect(
      useCommentsStore.getState().childrenComments['root-1']?.comments['reply-4']?.attachments,
    ).toEqual([]);

    await jest.advanceTimersByTimeAsync(1000);

    expect(getCommentByIdRootMock).toHaveBeenCalledTimes(2);
    expect(
      useCommentsStore.getState().childrenComments['root-1']?.comments['reply-4']?.attachments,
    ).toEqual([photo]);
  });
});
