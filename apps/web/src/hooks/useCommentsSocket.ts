import { useEffect } from 'react';
import { io } from 'socket.io-client';

import { getApiUrl, WS_COMMENT_CREATED, type CommentResponse } from '@comments/shared';
import useCommentsStore from '@/store/comments/comments.store';

const wsUrl = getApiUrl().replace(/\/api\/v\d+$/, '');

export const useCommentsSocket = () => {
  const applyRemoteComment = useCommentsStore((state) => state.applyRemoteComment);

  useEffect(() => {
    const socket = io(wsUrl, { withCredentials: true });

    socket.on(WS_COMMENT_CREATED, (comment: CommentResponse) => {
      applyRemoteComment(comment);
    });

    return () => {
      socket.off(WS_COMMENT_CREATED);
      socket.disconnect();
    };
  }, [applyRemoteComment]);
};
