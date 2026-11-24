'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import RefreshIcon from '@mui/icons-material/Refresh';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent } from 'react';

import { commentsSchema, type CommentsSchema } from '@comments/shared';
import commentsService from '@/api/services/comments.service';
import useCommentsStore from '@/store/comments/comments.store';

import CommentPreview from '../CommentPreview/CommentPreview';

interface CommentFormProps {
  parentId?: string;
}

const toSvgDataUrl = (svg: string): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif']);
const ALLOWED_IMAGE_EXT = /\.(jpe?g|png|gif)$/i;
const MAX_TEXT_FILE_BYTES = 100 * 1024;

function CommentForm({ parentId }: CommentFormProps) {
  const [preview, setPreview] = useState<CommentsSchema | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkHref, setLinkHref] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [textFile, setTextFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [textFileError, setTextFileError] = useState<string | null>(null);
  const [captchaSrc, setCaptchaSrc] = useState<string | null>(null);
  const [captchaLoading, setCaptchaLoading] = useState(true);

  const t = useTranslations('HomePage');
  const tr = (key: string, fallback: string) => (t.has(key) ? t(key) : fallback);
  const imageInputId = useId();
  const textFileInputId = useId();
  const createComment = useCommentsStore((state) => state.createComment);
  const closeCommentForm = useCommentsStore((state) => state.closeCommentForm);
  const initialText = useCommentsStore((state) =>
    parentId && state.commentTarget?.parentId === parentId
      ? (state.commentTarget.initialText ?? '')
      : '',
  );
  const textRef = useRef<HTMLTextAreaElement | null>(null);
  const imageRef = useRef<HTMLInputElement | null>(null);
  const textFileRef = useRef<HTMLInputElement | null>(null);
  const linkSelection = useRef({ start: 0, end: 0 });
  const mountedRef = useRef(true);
  const captchaRequestIdRef = useRef(0);

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<CommentsSchema>({
    resolver: zodResolver(commentsSchema),
    defaultValues: {
      fullName: '',
      email: '',
      homepage: '',
      captcha: '',
      text: initialText,
      ...(parentId ? { parentId } : {}),
    },
  });

  const loadCaptcha = useCallback(
    async (options?: { clearInput?: boolean; clearError?: boolean }) => {
      const requestId = captchaRequestIdRef.current + 1;
      captchaRequestIdRef.current = requestId;
      setCaptchaLoading(true);
      if (options?.clearInput) {
        setValue('captcha', '');
      }
      if (options?.clearError) {
        clearErrors('captcha');
      }

      try {
        const { data } = await commentsService.getCaptcha();
        if (!mountedRef.current || captchaRequestIdRef.current !== requestId) {
          return;
        }
        const trimmed = data.trim();
        setCaptchaSrc(trimmed.startsWith('<svg') ? toSvgDataUrl(trimmed) : null);
      } catch {
        if (!mountedRef.current || captchaRequestIdRef.current !== requestId) {
          return;
        }
        setCaptchaSrc(null);
      } finally {
        if (mountedRef.current && captchaRequestIdRef.current === requestId) {
          setCaptchaLoading(false);
        }
      }
    },
    [clearErrors, setValue],
  );

  useEffect(() => {
    mountedRef.current = true;
    void loadCaptcha();
    return () => {
      mountedRef.current = false;
    };
  }, [loadCaptcha]);

  useEffect(() => {
    if (!initialText) {
      return;
    }
    const current = getValues('text');
    if (current.includes(initialText)) {
      return;
    }
    const next = current ? `${initialText}${current}` : initialText;
    setValue('text', next, { shouldDirty: true });
    requestAnimationFrame(() => {
      const field = textRef.current;
      field?.focus();
      field?.setSelectionRange(next.length, next.length);
    });
  }, [getValues, initialText, setValue]);

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

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setImage(null);
      setImageError(null);
      return;
    }
    const validType = file.type
      ? ALLOWED_IMAGE_TYPES.has(file.type)
      : ALLOWED_IMAGE_EXT.test(file.name);
    if (!validType) {
      setImage(null);
      setImageError(tr('invalidImageFile', 'Only JPG, PNG, or GIF images are allowed'));
      if (imageRef.current) imageRef.current.value = '';
      return;
    }
    setImage(file);
    setImageError(null);
  };

  const handleTextFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setTextFile(null);
      setTextFileError(null);
      return;
    }
    const validTxt =
      file.name.toLowerCase().endsWith('.txt') && (file.type === '' || file.type === 'text/plain');
    if (!validTxt) {
      setTextFile(null);
      setTextFileError(tr('invalidTextFileType', 'Only .txt text files are allowed'));
      if (textFileRef.current) textFileRef.current.value = '';
      return;
    }
    if (file.size > MAX_TEXT_FILE_BYTES) {
      setTextFile(null);
      setTextFileError(tr('textFileTooLarge', 'Text file must be at most 100 KB'));
      if (textFileRef.current) textFileRef.current.value = '';
      return;
    }
    setTextFile(file);
    setTextFileError(null);
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
      const isCaptchaError = message.toLowerCase().includes('captcha');
      const displayMessage = isCaptchaError ? tr('invalidCaptcha', message) : message;
      toast.error(displayMessage, { toastId: 'comments-error' });
      if (isCaptchaError) {
        setError('captcha', { type: 'server', message: displayMessage });
        void loadCaptcha({ clearInput: true });
      }
      return;
    }

    reset();
    setImage(null);
    setTextFile(null);
    setImageError(null);
    setTextFileError(null);
    if (imageRef.current) imageRef.current.value = '';
    if (textFileRef.current) textFileRef.current.value = '';
    closeCommentForm();
    toast.success('Comment created successfully');
    setPreview(null);
  };

  return (
    <Box
      data-testid="comment-form"
      sx={{
        p: { xs: 1.5, sm: 2.5 },
        bgcolor: '#fff',
        ...(parentId
          ? { borderTop: '1px solid #e6e8ec' }
          : {
              mb: 2,
              borderRadius: '10px',
              border: '1px solid #e6e8ec',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
            }),
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1,
          mb: 1.5,
        }}
      >
        <Button type="button" size="small" variant="outlined" onClick={() => insertTag('i')}>
          [i]
        </Button>
        <Button type="button" size="small" variant="outlined" onClick={() => insertTag('strong')}>
          [strong]
        </Button>
        <Button type="button" size="small" variant="outlined" onClick={() => insertTag('code')}>
          [code]
        </Button>
        <Button type="button" size="small" variant="outlined" onClick={openLink}>
          [a]
        </Button>
        {linkOpen && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1,
              width: '100%',
              mt: 0.5,
            }}
          >
            <TextField
              size="small"
              fullWidth
              value={linkHref}
              onChange={(event) => setLinkHref(event.target.value)}
              placeholder="https://"
            />
            <TextField
              size="small"
              fullWidth
              value={linkTitle}
              onChange={(event) => setLinkTitle(event.target.value)}
              placeholder="title"
            />
            <Button
              type="button"
              size="small"
              variant="contained"
              onClick={insertLink}
              sx={{ flexShrink: 0 }}
            >
              [a]
            </Button>
          </Box>
        )}
      </Box>
      <Box component="form" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <Box>
          <TextField
            fullWidth
            size="small"
            {...register('fullName')}
            placeholder={t('nameLabel')}
            error={Boolean(errors.fullName)}
            slotProps={{ htmlInput: { 'data-testid': 'comment-full-name' } }}
          />
          <Box sx={{ minHeight: 22, color: 'error.main', fontSize: 12, lineHeight: '20px' }}>
            {errors.fullName?.message}
          </Box>
        </Box>
        <Box>
          <TextField
            fullWidth
            size="small"
            {...register('email')}
            placeholder={t('emailLabel')}
            error={Boolean(errors.email)}
            slotProps={{ htmlInput: { 'data-testid': 'comment-email' } }}
          />
          <Box sx={{ minHeight: 22, color: 'error.main', fontSize: 12, lineHeight: '20px' }}>
            {errors.email?.message}
          </Box>
        </Box>
        <Box>
          <TextField
            fullWidth
            size="small"
            {...register('homepage')}
            placeholder={t('homepageLabel')}
            error={Boolean(errors.homepage)}
            slotProps={{ htmlInput: { 'data-testid': 'comment-homepage' } }}
          />
          <Box sx={{ minHeight: 22, color: 'error.main', fontSize: 12, lineHeight: '20px' }}>
            {errors.homepage?.message}
          </Box>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              border: '1px dashed #cbd5e1',
              bgcolor: '#fafbfc',
              minWidth: 0,
            }}
          >
            <Typography
              component="label"
              htmlFor={imageInputId}
              variant="body2"
              sx={{ display: 'block', fontWeight: 600, color: 'text.primary', mb: 0.75 }}
            >
              {t('imageLabel')}
            </Typography>
            <Box
              component="input"
              id={imageInputId}
              type="file"
              accept="image/jpeg,image/png,image/gif"
              aria-label={t('imageLabel')}
              data-testid="comment-image"
              ref={imageRef}
              onChange={handleImageChange}
              sx={{ display: 'block', width: '100%', maxWidth: '100%', fontSize: 13 }}
            />
            {image?.name && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 0.5,
                  color: 'text.secondary',
                  overflowWrap: 'anywhere',
                }}
              >
                {image.name}
              </Typography>
            )}
            {imageError && (
              <Box
                data-testid="comment-image-error"
                sx={{ mt: 0.5, color: 'error.main', fontSize: 12, lineHeight: '18px' }}
              >
                {imageError}
              </Box>
            )}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              border: '1px dashed #cbd5e1',
              bgcolor: '#fafbfc',
              minWidth: 0,
            }}
          >
            <Typography
              component="label"
              htmlFor={textFileInputId}
              variant="body2"
              sx={{ display: 'block', fontWeight: 600, color: 'text.primary', mb: 0.75 }}
            >
              {t('textFileLabel')}
            </Typography>
            <Box
              component="input"
              id={textFileInputId}
              type="file"
              accept=".txt,text/plain"
              aria-label={t('textFileLabel')}
              data-testid="comment-text-file"
              ref={textFileRef}
              onChange={handleTextFileChange}
              sx={{ display: 'block', width: '100%', maxWidth: '100%', fontSize: 13 }}
            />
            {textFile?.name && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 0.5,
                  color: 'text.secondary',
                  overflowWrap: 'anywhere',
                }}
              >
                {textFile.name}
              </Typography>
            )}
            {textFileError && (
              <Box
                data-testid="comment-text-file-error"
                sx={{ mt: 0.5, color: 'error.main', fontSize: 12, lineHeight: '18px' }}
              >
                {textFileError}
              </Box>
            )}
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
          <Box sx={{ minHeight: 22, color: 'error.main', fontSize: 12, lineHeight: '20px' }}>
            {errors.text?.message}
          </Box>
        </Box>
        <Box sx={{ mb: 0.5 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'flex-start' },
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: 180,
                  height: 60,
                  borderRadius: 1,
                  border: '1px solid #d0d7de',
                  bgcolor: '#f4f4f5',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {captchaLoading && !captchaSrc ? (
                  <Skeleton variant="rectangular" width={180} height={60} />
                ) : captchaSrc ? (
                  <Box
                    component="img"
                    src={captchaSrc}
                    alt={tr('captchaImageAlt', 'CAPTCHA image')}
                    data-testid="comment-captcha-image"
                    sx={{
                      display: 'block',
                      width: 180,
                      height: 60,
                      objectFit: 'contain',
                      userSelect: 'none',
                      opacity: captchaLoading ? 0.5 : 1,
                      transition: 'opacity 150ms ease',
                    }}
                  />
                ) : (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ px: 1, textAlign: 'center', lineHeight: 1.3 }}
                  >
                    {tr('captchaLoadError', 'Failed to load CAPTCHA')}
                  </Typography>
                )}
              </Box>
              <IconButton
                type="button"
                size="small"
                onClick={() => void loadCaptcha({ clearInput: true, clearError: true })}
                disabled={captchaLoading}
                aria-label={tr('captchaRefresh', 'Refresh CAPTCHA')}
                title={tr('captchaRefresh', 'Refresh CAPTCHA')}
                data-testid="comment-captcha-refresh"
                sx={{
                  border: '1px solid #d0d7de',
                  borderRadius: 1,
                  width: 38,
                  height: 38,
                  flexShrink: 0,
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <TextField
                fullWidth
                size="small"
                {...register('captcha')}
                placeholder={t('captchaLabel')}
                error={Boolean(errors.captcha)}
                slotProps={{
                  htmlInput: {
                    'data-testid': 'comment-captcha',
                    autoComplete: 'off',
                  },
                }}
              />
              <Box sx={{ minHeight: 22, color: 'error.main', fontSize: 12, lineHeight: '20px' }}>
                {errors.captcha?.message}
              </Box>
            </Box>
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            mt: 0.5,
          }}
        >
          <Button
            variant="contained"
            type="submit"
            disabled={isSubmitting}
            data-testid="comment-submit"
            sx={{ flex: { xs: '1 1 auto', sm: 'none' } }}
          >
            {t('submit')}
          </Button>
          <Button
            variant="outlined"
            type="button"
            onClick={handlePreview}
            data-testid="comment-preview"
            sx={{ flex: { xs: '1 1 auto', sm: 'none' } }}
          >
            {t('preview')}
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            type="button"
            onClick={closeCommentForm}
            data-testid="comment-cancel"
            sx={{ flex: { xs: '1 1 auto', sm: 'none' } }}
          >
            {t('cancel')}
          </Button>
        </Box>
        {preview && (
          <Box sx={{ mt: 2 }}>
            <CommentPreview comment={preview} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default CommentForm;
