import { useEffect } from 'react';
import { io } from 'socket.io-client';

import {
  getApiUrl,
  WS_COMMENT_CREATED,
  WS_COMMENT_VOTED,
  type CommentResponse,
  type CommentVotedEventPayload,
} from '@comments/shared';
import useCommentsStore from '@/store/comments/comments.store';

const wsUrl = getApiUrl().replace(/\/api\/v\d+$/, '');

export const useCommentsSocket = () => {
  const applyRemoteComment = useCommentsStore((state) => state.applyRemoteComment);
  const applyRemoteVote = useCommentsStore((state) => state.applyRemoteVote);

  useEffect(() => {
    const socket = io(wsUrl, { withCredentials: true });

    socket.on(WS_COMMENT_CREATED, (comment: CommentResponse) => {
      applyRemoteComment(comment);
    });
    socket.on(WS_COMMENT_VOTED, (payload: CommentVotedEventPayload) => {
      applyRemoteVote(payload);
    });

    return () => {
      socket.disconnect();
    };
  }, [applyRemoteComment, applyRemoteVote]);
};
