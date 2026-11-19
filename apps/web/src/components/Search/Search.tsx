'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { commentsSearchSchema } from '@comments/shared';
import useCommentsListQuery from '@/hooks/useCommentsListQuery';
import useCommentsStore from '@/store/comments/comments.store';

const searchFormSchema = z.object({
  q: commentsSearchSchema.shape.q,
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

const Search = () => {
  const t = useTranslations('HomePage');
  const isLoading = useCommentsStore((state) => state.isLoading);
  const { q, setListQuery } = useCommentsListQuery();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      q: q ?? '',
    },
  });

  useEffect(() => {
    reset({ q: q ?? '' });
  }, [q, reset]);

  const onSubmit = handleSubmit((values) => {
    setListQuery({ q: values.q, page: 1 });
  });

  const onClear = () => {
    reset({ q: '' });
    setListQuery({ q: null, page: 1 });
  };

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      noValidate
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        width: '100%',
        maxWidth: 480,
      }}
    >
      <TextField
        label={t('searchLabel')}
        fullWidth
        size="small"
        autoComplete="off"
        disabled={isSubmitting || isLoading}
        error={Boolean(errors.q)}
        helperText={errors.q?.message}
        {...register('q')}
      />
      <Button type="submit" variant="contained" disabled={isSubmitting || isLoading}>
        {t('search')}
      </Button>
      <Button
        type="button"
        variant="outlined"
        disabled={isSubmitting || isLoading}
        onClick={onClear}
      >
        {t('searchClear')}
      </Button>
    </Box>
  );
};

export default Search;
