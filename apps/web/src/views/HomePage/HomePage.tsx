'use client';

import React, { useEffect } from 'react';
import { toast } from 'react-toastify';

import CommentForm from '@/components/CommentForm/CommentForm';
import CommentsList from '@/components/CommentsList/CommentsList';
import Loader from '@/components/Loader/Loader';
import useCommentsStore from '@/store/comments/comments.store';
import { useCommentsSocket } from '@/hooks/useCommentsSocket';

const HomePage = () => {
  const fetchComments = useCommentsStore((state) => state.fetchComments);
  const commentsIds = useCommentsStore((state) => state.commentsIds);
  const isLoading = useCommentsStore((state) => state.isLoading);
  const commentTarget = useCommentsStore((state) => state.commentTarget);

  useCommentsSocket();

  useEffect(() => {
    void (async () => {
      await fetchComments();
      const message = useCommentsStore.getState().error;
      if (message) {
        toast.error(message, { toastId: 'comments-error' });
        return;
      }

      toast.success('Comments loaded', { toastId: 'comments-loaded' });
    })();
  }, [fetchComments]);

  if (isLoading && commentsIds.length === 0) {
    return <Loader />;
  }
  return (
    <main>
      {commentTarget?.parentId === null && <CommentForm key="root" />}
      <CommentsList commentsIds={commentsIds} />
    </main>
  );
};

export default HomePage;
