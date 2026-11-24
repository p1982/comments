'use client';

import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import authService from '@/api/services/auth.service';
import AuthModal, { type AuthMode } from '@/components/AuthModal/AuthModal';
import Search from '@/components/Search/Search';

import { HeaderActions, HeaderCenter, HeaderRoot } from './Header.styled';

const Header = () => {
  const t = useTranslations('Auth');
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('signin');
  const [signedIn, setSignedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let active = true;

    void authService
      .refresh()
      .then(() => {
        if (active) {
          setSignedIn(true);
        }
      })
      .catch(() => {
        if (active) {
          setSignedIn(false);
        }
      })
      .finally(() => {
        if (active) {
          setCheckingAuth(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const openAuth = (nextMode: AuthMode) => {
    setMode(nextMode);
    setOpen(true);
  };

  return (
    <>
      <HeaderRoot>
        <div />
        <HeaderCenter>
          <Search />
        </HeaderCenter>
        <HeaderActions>
          {checkingAuth ? null : signedIn ? (
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
        </HeaderActions>
      </HeaderRoot>
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
