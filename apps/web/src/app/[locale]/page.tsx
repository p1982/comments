import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTranslations } from 'next-intl/server';

import CommentsList from '@/components/CommentsList/CommentsList';

import { Link } from '../../i18n/navigation';

export default async function HomePage() {
  const t = await getTranslations('HomePage');

  return (
    <Box sx={{ bgcolor: '#f7f8fa', minHeight: '100vh' }}>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant="h3" component="h1">
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
          <CommentsList />
        </Stack>
      </Container>
    </Box>
  );
}
