'use client';

import Stack from '@mui/material/Stack';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

import useCommentsStore from '@/store/comments/comments.store';

import Loader from '../Loader/Loader';
import CommentCard from './CommentCard';

const CommentsList = () => {
  const commentsIds = useCommentsStore((state) => state.commentsIds);
  const isLoading = useCommentsStore((state) => state.isLoading);
  const fetchComments = useCommentsStore((state) => state.fetchComments);

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
    <Stack spacing={2}>
      {commentsIds.map((id) => (
        <CommentCard key={id} id={id} />
      ))}
    </Stack>
  );
};

export default CommentsList;
