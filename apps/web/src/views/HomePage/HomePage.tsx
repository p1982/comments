'use client';

import Alert from '@mui/material/Alert';
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
  const error = useCommentsStore((state) => state.error);
  const limit = useCommentsStore((state) => state.limit);
  const commentTarget = useCommentsStore((state) => state.commentTarget);
  const { q, page, sort, order } = useCommentsListQuery();

  useCommentsSocket();

  useEffect(() => {
    void (async () => {
      if (q) {
        await searchComments({ q, page, limit });
      } else {
        await fetchComments({ page, sort, order });
      }

      const message = useCommentsStore.getState().error;
      if (message) {
        toast.error(message, { toastId: q ? 'comments-search-error' : 'comments-error' });
      }
    })();
  }, [fetchComments, limit, order, page, q, searchComments, sort]);

  const showRootForm = commentTarget !== null && commentTarget.parentId === null;

  if (isLoading && commentsIds.length === 0 && !showRootForm) {
    return <Loader />;
  }

  return (
    <main data-testid="home-page">
      {showRootForm && <CommentForm key="root" />}
      {error && !showRootForm && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <CommentsList commentsIds={commentsIds} />
    </main>
  );
};

export default HomePage;
