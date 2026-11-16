'use client';

import React, { useEffect } from 'react';
import { toast } from 'react-toastify';

import CommentsList from '@/components/CommentsList/CommentsList';
import Loader from '@/components/Loader/Loader';
import useCommentsStore from '@/store/comments/comments.store';

const HomePage = () => {
  const fetchComments = useCommentsStore((state) => state.fetchComments);
  const commentsIds = useCommentsStore((state) => state.commentsIds);
  const isLoading = useCommentsStore((state) => state.isLoading);

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

  if (isLoading) {
    return <Loader />;
  }
  return (
    <main>
      <CommentsList commentsIds={commentsIds} />
    </main>
  );
};

export default HomePage;
