'use client';

import Typography from '@mui/material/Typography';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import AuthModal, { type AuthMode } from '@/components/AuthModal/AuthModal';

import { HeaderBar, SignInButton } from './Header.styled';

const Header = () => {
  const t = useTranslations('Auth');
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('signin');
  const [signedIn, setSignedIn] = useState(false);

  const openAuth = (nextMode: AuthMode) => {
    setMode(nextMode);
    setOpen(true);
  };

  return (
    <>
      <HeaderBar>
        {signedIn ? (
          <Typography variant="body2">{t('signedIn')}</Typography>
        ) : (
          <>
            <SignInButton type="button" onClick={() => openAuth('signin')}>
              {t('signIn')}
            </SignInButton>
            <SignInButton type="button" onClick={() => openAuth('signup')}>
              {t('signUp')}
            </SignInButton>
          </>
        )}
      </HeaderBar>
      <AuthModal
        open={open}
        mode={mode}
        onClose={() => setOpen(false)}
        onModeChange={setMode}
        onSuccess={() => setSignedIn(true)}
      />
    </>
  );
};

export default Header;
