'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useState } from 'react';

import { commentsSchema, type CommentsSchema } from '@comments/shared';
import useCommentsStore from '@/store/comments/comments.store';

import CommentPreview from '../CommentPreview/CommentPreview';

interface CommentFormProps {
  parentId?: string;
}

function CommentForm({ parentId }: CommentFormProps) {
  const [preview, setPreview] = useState<CommentsSchema | null>(null);
  const t = useTranslations('HomePage');
  const createComment = useCommentsStore((state) => state.createComment);
  const closeCommentForm = useCommentsStore((state) => state.closeCommentForm);

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    getValues,
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

  const handlePreview = async () => {
    const valid = await trigger();
    setPreview(valid ? getValues() : null);
  };

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
    setPreview(null);
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
      <Button variant="contained" type="button" onClick={handlePreview}>
        {t('preview')}
      </Button>
      {preview && <CommentPreview comment={preview} />}
      <Button variant="contained" type="button" onClick={closeCommentForm}>
        {t('cancel')}{' '}
      </Button>
    </form>
  );
}

export default CommentForm;
