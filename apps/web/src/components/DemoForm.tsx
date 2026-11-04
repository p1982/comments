'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import styled from 'styled-components';
import { z } from 'zod';

const FormCard = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 28rem;
  width: 100%;
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background: #fff;
`;

const schema = z.object({
  name: z.string().min(1),
  message: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function DemoForm() {
  const t = useTranslations('HomePage');
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', message: '' },
  });

  return (
    <FormCard
      onSubmit={handleSubmit((_values) => {
        // Wire to API when ready
      })}
    >
      <Stack spacing={2}>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t('nameLabel')}
              error={Boolean(errors.name)}
              helperText={errors.name ? t('nameRequired') : undefined}
              fullWidth
            />
          )}
        />
        <Controller
          name="message"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t('messageLabel')}
              error={Boolean(errors.message)}
              helperText={errors.message ? t('messageRequired') : undefined}
              fullWidth
              multiline
              minRows={3}
            />
          )}
        />
        <Button type="submit" variant="contained">
          {t('submit')}
        </Button>
      </Stack>
    </FormCard>
  );
}
