'use client';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'react-toastify';

import authService from '@/api/services/auth.service';

import {
  AuthDialog,
  AuthDialogActions,
  AuthDialogContent,
  AuthDialogTitle,
  AuthFields,
  AuthForm,
  AuthSwitchRow,
} from './AuthModal.styled';

export type AuthMode = 'signin' | 'signup';

interface AuthModalProps {
  open: boolean;
  mode: AuthMode;
  onClose: () => void;
  onModeChange: (mode: AuthMode) => void;
  onSuccess?: () => void;
}

const emptyForm = {
  fullName: '',
  email: '',
  password: '',
  homepage: '',
};

const AuthModal = ({ open, mode, onClose, onModeChange, onSuccess }: AuthModalProps) => {
  const t = useTranslations('Auth');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(emptyForm);
    setError(null);
    setSubmitting(false);
  }, [open, mode]);

  const isSignUp = mode === 'signup';

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isSignUp) {
        await authService.signUp({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          ...(form.homepage.trim() ? { homepage: form.homepage.trim() } : {}),
        });
      } else {
        await authService.signIn({
          email: form.email.trim(),
          password: form.password,
        });
      }

      toast.success(t('signedIn'));
      onSuccess?.();
      onClose();
    } catch {
      const message = isSignUp ? t('signUpError') : t('error');
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthDialog open={open} onClose={onClose} aria-labelledby="auth-dialog-title">
      <AuthDialogTitle id="auth-dialog-title">
        {isSignUp ? t('signUp') : t('signIn')}
      </AuthDialogTitle>
      <AuthForm noValidate onSubmit={onSubmit}>
        <AuthDialogContent>
          <AuthFields>
            {isSignUp ? (
              <TextField
                label={t('fullName')}
                value={form.fullName}
                onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                required
                fullWidth
                autoComplete="name"
              />
            ) : null}
            <TextField
              label={t('email')}
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
              fullWidth
              autoComplete="email"
            />
            <TextField
              label={t('password')}
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required
              fullWidth
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
            {isSignUp ? (
              <TextField
                label={t('homepage')}
                value={form.homepage}
                onChange={(event) => setForm((prev) => ({ ...prev, homepage: event.target.value }))}
                fullWidth
                autoComplete="url"
              />
            ) : null}
            {error ? (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            ) : null}
          </AuthFields>
        </AuthDialogContent>
        <AuthDialogActions>
          <AuthSwitchRow>
            <Typography variant="body2" color="text.secondary">
              {isSignUp ? t('haveAccount') : t('noAccount')}
            </Typography>
            <Button
              type="button"
              size="small"
              onClick={() => onModeChange(isSignUp ? 'signin' : 'signup')}
              disabled={submitting}
            >
              {isSignUp ? t('signIn') : t('signUp')}
            </Button>
          </AuthSwitchRow>
          <Button type="submit" variant="contained" disabled={submitting}>
            {isSignUp ? t('signUp') : t('signIn')}
          </Button>
        </AuthDialogActions>
      </AuthForm>
    </AuthDialog>
  );
};

export default AuthModal;
