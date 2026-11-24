'use client';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { isAxiosError } from 'axios';
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

type FormField = keyof typeof emptyForm;
type FieldErrors = Partial<Record<FormField, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/i;

const AuthModal = ({ open, mode, onClose, onModeChange, onSuccess }: AuthModalProps) => {
  const t = useTranslations('Auth');
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tr = (key: string, fallback: string): string => (t.has(key) ? t(key) : fallback);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(emptyForm);
    setFieldErrors({});
    setShowPassword(false);
    setError(null);
    setSubmitting(false);
  }, [open, mode]);

  const isSignUp = mode === 'signup';

  const updateField = (field: FormField, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (error) {
      setError(null);
    }
  };

  const validateForm = (): FieldErrors => {
    const nextErrors: FieldErrors = {};
    const email = form.email.trim();
    const homepage = form.homepage.trim();

    if (isSignUp && !form.fullName.trim()) {
      nextErrors.fullName = tr('fullNameRequired', 'Please enter your full name');
    }

    if (!EMAIL_RE.test(email)) {
      nextErrors.email = tr('invalidEmail', 'Please enter a valid email address');
    }

    if (!form.password) {
      nextErrors.password = tr('passwordRequired', 'Please enter your password');
    } else if (isSignUp && form.password.length < 6) {
      nextErrors.password = tr('passwordTooShort', 'Password must be at least 6 characters');
    }

    if (isSignUp && homepage && !URL_RE.test(homepage)) {
      nextErrors.homepage = tr('invalidHomepage', 'Homepage must start with http:// or https://');
    }

    return nextErrors;
  };

  const mapBackendMessage = (raw: string): string => {
    const normalized = raw.trim().toLowerCase();
    if (normalized.includes('already registered')) {
      return tr('emailTaken', 'This email is already registered');
    }
    if (normalized.includes('invalid credentials')) {
      return tr('invalidCredentials', 'Invalid email or password');
    }
    if (normalized.includes('valid email')) {
      return tr('invalidEmail', 'Please enter a valid email address');
    }
    if (normalized.includes('at least 6 characters')) {
      return tr('passwordTooShort', 'Password must be at least 6 characters');
    }
    if (normalized.includes('full name is required')) {
      return tr('fullNameRequired', 'Please enter your full name');
    }
    if (normalized.includes('password is required')) {
      return tr('passwordRequired', 'Please enter your password');
    }
    if (normalized.includes('valid url')) {
      return tr('invalidHomepage', 'Homepage must start with http:// or https://');
    }
    return raw;
  };

  const resolveErrorMessage = (err: unknown): string => {
    const fallback = isSignUp ? t('signUpError') : t('error');

    if (isAxiosError<{ message?: string | string[] } | undefined>(err)) {
      const apiMessage = err.response?.data?.message;
      if (Array.isArray(apiMessage) && apiMessage.length > 0) {
        return apiMessage.map(mapBackendMessage).join('. ');
      }
      if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
        return mapBackendMessage(apiMessage);
      }
    }

    return fallback;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

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
    } catch (err) {
      const message = resolveErrorMessage(err);
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
                onChange={(event) => updateField('fullName', event.target.value)}
                error={Boolean(fieldErrors.fullName)}
                helperText={fieldErrors.fullName}
                required
                fullWidth
                autoComplete="name"
              />
            ) : null}
            <TextField
              label={t('email')}
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              error={Boolean(fieldErrors.email)}
              helperText={fieldErrors.email}
              required
              fullWidth
              autoComplete="email"
            />
            <TextField
              label={t('password')}
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              error={Boolean(fieldErrors.password)}
              helperText={fieldErrors.password}
              required
              fullWidth
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        edge="end"
                        aria-label={
                          showPassword
                            ? tr('hidePassword', 'Hide password')
                            : tr('showPassword', 'Show password')
                        }
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword((prev) => !prev)}
                        onMouseDown={(event) => event.preventDefault()}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            {isSignUp ? (
              <TextField
                label={t('homepage')}
                value={form.homepage}
                onChange={(event) => updateField('homepage', event.target.value)}
                error={Boolean(fieldErrors.homepage)}
                helperText={fieldErrors.homepage}
                fullWidth
                autoComplete="url"
              />
            ) : null}
            {error ? <Alert severity="error">{error}</Alert> : null}
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
