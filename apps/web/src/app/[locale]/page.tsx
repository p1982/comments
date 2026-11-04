import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DemoForm } from '../../components/DemoForm';
import { Link } from '../../i18n/navigation';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('HomePage');

  return (
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
        <DemoForm />
      </Stack>
    </Container>
  );
}
