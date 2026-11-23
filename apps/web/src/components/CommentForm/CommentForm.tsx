'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useRef, useState, type ChangeEvent } from 'react';

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
  const [image, setImage] = useState<File | null>(null);
  const [textFile, setTextFile] = useState<File | null>(null);

  const t = useTranslations('HomePage');
  const createComment = useCommentsStore((state) => state.createComment);
  const closeCommentForm = useCommentsStore((state) => state.closeCommentForm);
  const textRef = useRef<HTMLTextAreaElement | null>(null);
  const imageRef = useRef<HTMLInputElement | null>(null);
  const textFileRef = useRef<HTMLInputElement | null>(null);
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
      captcha: '',
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
    await createComment(
      {
        fullName: values.fullName,
        email: values.email,
        text: values.text,
        captcha: values.captcha,
        ...(values.homepage ? { homepage: values.homepage } : {}),
        ...(parentId ? { parentId } : {}),
      },
      image ?? undefined,
      textFile ?? undefined,
    );

    const message = useCommentsStore.getState().error;

    if (message) {
      toast.error(message, { toastId: 'comments-error' });
      return;
    }

    reset();
    setImage(null);
    setTextFile(null);
    if (imageRef.current) imageRef.current.value = '';
    if (textFileRef.current) textFileRef.current.value = '';
    closeCommentForm();
    toast.success('Comment created successfully');
    setPreview(null);
  };

  return (
    <Box data-testid="comment-form">
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
      <Box component="form" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <Box>
          <TextField
            fullWidth
            {...register('fullName')}
            placeholder={t('nameLabel')}
            error={Boolean(errors.fullName)}
            slotProps={{ htmlInput: { 'data-testid': 'comment-full-name' } }}
          />
          <Box sx={{ minHeight: 40, color: 'error.main', fontSize: 12, lineHeight: '20px' }}>
            {errors.fullName?.message}
          </Box>
        </Box>
        <Box>
          <TextField
            fullWidth
            {...register('email')}
            placeholder={t('emailLabel')}
            error={Boolean(errors.email)}
            slotProps={{ htmlInput: { 'data-testid': 'comment-email' } }}
          />
          <Box sx={{ minHeight: 40, color: 'error.main', fontSize: 12, lineHeight: '20px' }}>
            {errors.email?.message}
          </Box>
        </Box>
        <Box>
          <TextField
            fullWidth
            {...register('homepage')}
            placeholder={t('homepageLabel')}
            error={Boolean(errors.homepage)}
            slotProps={{ htmlInput: { 'data-testid': 'comment-homepage' } }}
          />
          <Box sx={{ minHeight: 40, color: 'error.main', fontSize: 12, lineHeight: '20px' }}>
            {errors.homepage?.message}
          </Box>
        </Box>
        <Box>
          <Box
            component="input"
            type="file"
            accept="image/jpeg,image/png,image/gif"
            aria-label={t('imageLabel')}
            data-testid="comment-image"
            ref={imageRef}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setImage(event.target.files?.[0] ?? null);
            }}
            sx={{ display: 'block', width: '100%' }}
          />
          <Box sx={{ minHeight: 40, color: 'error.main', fontSize: 12, lineHeight: '20px' }}>
            {image?.name}
          </Box>
        </Box>
        <Box>
          <Box
            component="input"
            type="file"
            accept=".txt,text/plain"
            aria-label={t('textFileLabel')}
            data-testid="comment-text-file"
            ref={textFileRef}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setTextFile(event.target.files?.[0] ?? null)
            }
            sx={{ display: 'block', width: '100%' }}
          />
          <Box sx={{ minHeight: 40, color: 'error.main', fontSize: 12, lineHeight: '20px' }}>
            {textFile?.name}
          </Box>
        </Box>
        <Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            {...register('text')}
            placeholder={t('textLabel')}
            {...textField}
            error={Boolean(errors.text)}
            slotProps={{ htmlInput: { 'data-testid': 'comment-text' } }}
            inputRef={(node: HTMLTextAreaElement | null) => {
              ref(node);
              textRef.current = node;
            }}
          />
          <Box sx={{ minHeight: 40, color: 'error.main', fontSize: 12, lineHeight: '20px' }}>
            {errors.text?.message}
          </Box>
        </Box>
        <Box>
          <TextField
            fullWidth
            {...register('captcha')}
            placeholder={t('captchaLabel')}
            error={Boolean(errors.captcha)}
            slotProps={{ htmlInput: { 'data-testid': 'comment-captcha' } }}
          />
          <Box sx={{ minHeight: 40, color: 'error.main', fontSize: 12, lineHeight: '20px' }}>
            {errors.captcha?.message}
          </Box>
        </Box>
        <Button
          variant="contained"
          type="submit"
          disabled={isSubmitting}
          data-testid="comment-submit"
        >
          {t('submit')}
        </Button>
        <Button
          variant="contained"
          type="button"
          onClick={handlePreview}
          data-testid="comment-preview"
        >
          {t('preview')}
        </Button>
        {preview && <CommentPreview comment={preview} />}
        <Button
          variant="contained"
          type="button"
          onClick={closeCommentForm}
          data-testid="comment-cancel"
        >
          {t('cancel')}{' '}
        </Button>
      </Box>
    </Box>
  );
}

export default CommentForm;
