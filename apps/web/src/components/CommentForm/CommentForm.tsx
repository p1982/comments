'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useRef, useState } from 'react';

import { commentsSchema, type CommentsSchema } from '@comments/shared';
import useCommentsStore from '@/store/comments/comments.store';

import CommentPreview from '../CommentPreview/CommentPreview';

interface CommentFormProps {
  parentId?: string;
}

function CommentForm({ parentId }: CommentFormProps) {
  const [preview, setPreview] = useState<CommentsSchema | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkHref, setLinkHref] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const t = useTranslations('HomePage');
  const createComment = useCommentsStore((state) => state.createComment);
  const closeCommentForm = useCommentsStore((state) => state.closeCommentForm);
  const textRef = useRef<HTMLTextAreaElement | null>(null);
  const linkSelection = useRef({ start: 0, end: 0 });

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    getValues,
    setValue,
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

  const { ref, ...textField } = register('text');

  const insertTag = (
    tag: 'i' | 'strong' | 'code' | 'a',
    attributes = '',
    range?: { start: number; end: number },
  ) => {
    const field = textRef.current;
    const value = getValues('text');
    const start = range?.start ?? field?.selectionStart ?? value.length;
    const end = range?.end ?? field?.selectionEnd ?? value.length;
    const selected = value.slice(start, end);
    const open = attributes ? `<${tag} ${attributes}>` : `<${tag}>`;
    const close = `</${tag}>`;
    const next = `${value.slice(0, start)}${open}${selected}${close}${value.slice(end)}`;

    setValue('text', next, { shouldDirty: true, shouldValidate: true });

    const cursor = start + open.length + selected.length;
    requestAnimationFrame(() => {
      field?.focus();
      field?.setSelectionRange(
        selected ? start : cursor,
        selected ? cursor + close.length : cursor,
      );
    });
  };

  const handlePreview = async () => {
    const valid = await trigger();
    setPreview(valid ? getValues() : null);
  };

  const openLink = () => {
    const field = textRef.current;
    const value = getValues('text');
    linkSelection.current = {
      start: field?.selectionStart ?? value.length,
      end: field?.selectionEnd ?? value.length,
    };
    setLinkOpen(true);
  };

  const insertLink = () => {
    const href = linkHref.trim();
    if (!/^https?:\/\//.test(href) || href.includes('"')) return;

    const title = linkTitle.trim();
    if (title.includes('"')) return;

    const attributes = title ? `href="${href}" title="${title}"` : `href="${href}"`;
    insertTag('a', attributes, linkSelection.current);
    setLinkHref('');
    setLinkTitle('');
    setLinkOpen(false);
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
    <Box>
      <Box>
        <Button type="button" onClick={() => insertTag('i')}>
          [i]
        </Button>
        <Button type="button" onClick={() => insertTag('strong')}>
          [strong]
        </Button>
        <Button type="button" onClick={() => insertTag('code')}>
          [code]
        </Button>
        <Button type="button" onClick={openLink}>
          [a]
        </Button>
        {linkOpen && (
          <>
            <TextField
              value={linkHref}
              onChange={(event) => setLinkHref(event.target.value)}
              placeholder="https://"
            />
            <TextField
              value={linkTitle}
              onChange={(event) => setLinkTitle(event.target.value)}
              placeholder="title"
            />
            <Button type="button" onClick={insertLink}>
              [a]
            </Button>
          </>
        )}
      </Box>
      <form onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <TextField fullWidth {...register('fullName')} placeholder={t('nameLabel')} />
        {errors.fullName && <span>{errors.fullName.message}</span>}
        <TextField fullWidth {...register('email')} placeholder={t('emailLabel')} />
        {errors.email && <span>{errors.email.message}</span>}
        <TextField fullWidth {...register('homepage')} placeholder={t('homepageLabel')} />
        {errors.homepage && <span>{errors.homepage.message}</span>}
        <TextField
          fullWidth
          multiline
          rows={4}
          {...register('text')}
          placeholder={t('textLabel')}
          {...textField}
          inputRef={(node: HTMLTextAreaElement | null) => {
            ref(node);
            textRef.current = node;
          }}
        />
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
    </Box>
  );
}

export default CommentForm;
