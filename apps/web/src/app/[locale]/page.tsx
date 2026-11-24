import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import Loader from '@/components/Loader/Loader';
import HomePage from '@/views/HomePage/HomePage';

import { Link } from '../../i18n/navigation';

export default async function page() {
  const t = await getTranslations('HomePage');

  return (
    <Box sx={{ bgcolor: '#f7f8fa', minHeight: '100vh' }}>
      <Container maxWidth="md" sx={{ py: { xs: 2.5, sm: 4, md: 6 }, px: { xs: 1.5, sm: 3 } }}>
        <Stack spacing={{ xs: 2, sm: 3 }}>
          <Stack spacing={1}>
            <Typography
              variant="h3"
              component="h1"
              sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}
            >
              {t('title')}
            </Typography>
            <Typography color="text.secondary">{t('subtitle')}</Typography>
            <Stack direction="row" spacing={2}>
              <Link href="/" locale="en">
                EN
              </Link>
              <Link href="/" locale="uk">
                UK
              </Link>
            </Stack>
          </Stack>
          <Suspense fallback={<Loader />}>
            <HomePage />
          </Suspense>
        </Stack>
      </Container>
    </Box>
  );
}
