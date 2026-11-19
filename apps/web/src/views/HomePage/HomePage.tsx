'use client';

import React, { useEffect } from 'react';
import { toast } from 'react-toastify';

import CommentForm from '@/components/CommentForm/CommentForm';
import CommentsList from '@/components/CommentsList/CommentsList';
import Loader from '@/components/Loader/Loader';
import useCommentsListQuery from '@/hooks/useCommentsListQuery';
import { useCommentsSocket } from '@/hooks/useCommentsSocket';
import useCommentsStore from '@/store/comments/comments.store';

const HomePage = () => {
  const fetchComments = useCommentsStore((state) => state.fetchComments);
  const searchComments = useCommentsStore((state) => state.searchComments);
  const commentsIds = useCommentsStore((state) => state.commentsIds);
  const isLoading = useCommentsStore((state) => state.isLoading);
  const limit = useCommentsStore((state) => state.limit);
  const commentTarget = useCommentsStore((state) => state.commentTarget);
  const { q, page } = useCommentsListQuery();

  useCommentsSocket();

  useEffect(() => {
    void (async () => {
      if (q) {
        await searchComments({ q, page, limit });
      } else {
        await fetchComments({ page });
      }

      const message = useCommentsStore.getState().error;
      if (message) {
        toast.error(message, { toastId: q ? 'comments-search-error' : 'comments-error' });
      }
    })();
  }, [fetchComments, limit, page, q, searchComments]);

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
