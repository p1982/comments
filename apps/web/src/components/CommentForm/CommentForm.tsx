'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { commentsSchema, type CommentsSchema } from '@comments/shared';
import useCommentsStore from '@/store/comments/comments.store';

interface CommentFormProps {
  parentId?: string;
}

function CommentForm({ parentId }: CommentFormProps) {
  const t = useTranslations('HomePage');
  const createComment = useCommentsStore((state) => state.createComment);
  const closeCommentForm = useCommentsStore((state) => state.closeCommentForm);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentsSchema>({
    resolver: zodResolver(commentsSchema),
    defaultValues: {
      fullName: '',
      email: '',
      homepage: '',
      text: '',
      ...(parentId ? { parentId } : {}),
    },
  });

  const onSubmit = async (values: CommentsSchema) => {
    await createComment({
      fullName: values.fullName,
      email: values.email,
      text: values.text,
      ...(values.homepage ? { homepage: values.homepage } : {}),
      ...(parentId ? { parentId } : {}),
    });

    const message = useCommentsStore.getState().error;

    if (message) {
      toast.error(message, { toastId: 'comments-error' });
      return;
    }

    reset();
    closeCommentForm();
    toast.success('Comment created successfully');
  };

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
      <TextField fullWidth {...register('fullName')} placeholder={t('nameLabel')} />
      {errors.fullName && <span>{errors.fullName.message}</span>}
      <TextField fullWidth {...register('email')} placeholder={t('emailLabel')} />
      {errors.email && <span>{errors.email.message}</span>}
      <TextField fullWidth {...register('homepage')} placeholder={t('homepageLabel')} />
      {errors.homepage && <span>{errors.homepage.message}</span>}
      <TextField fullWidth multiline rows={4} {...register('text')} placeholder={t('textLabel')} />
      {errors.text && <span>{errors.text.message}</span>}
      <Button variant="contained" type="submit" disabled={isSubmitting}>
        {t('submit')}
      </Button>
      <Button variant="contained" type="button" onClick={closeCommentForm}>
        Cancel
      </Button>
    </form>
  );
}

export default CommentForm;
