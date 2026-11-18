'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import AuthModal, { type AuthMode } from '@/components/AuthModal/AuthModal';

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
      <Box
        component="header"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 1,
          width: '100%',
          px: 2,
          py: 1.5,
        }}
      >
        {signedIn ? (
          <Typography variant="body2">{t('signedIn')}</Typography>
        ) : (
          <>
            <Button
              type="button"
              variant="contained"
              color="primary"
              onClick={() => openAuth('signin')}
            >
              {t('signIn')}
            </Button>
            <Button
              type="button"
              variant="contained"
              color="primary"
              onClick={() => openAuth('signup')}
            >
              {t('signUp')}
            </Button>
          </>
        )}
      </Box>
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
