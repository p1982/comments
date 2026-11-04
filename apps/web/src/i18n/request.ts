import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import * as nextRootParams from 'next/root-params';

import { routing } from './routing';

// next/root-params is a compiler stub; concrete exports live in .next/types.
const rootParams = nextRootParams as {
  locale: () => Promise<string | undefined>;
};

export default getRequestConfig(async ({ locale }) => {
  let resolvedLocale = locale;

  if (!resolvedLocale) {
    const paramValue = await rootParams.locale();
    if (!hasLocale(routing.locales, paramValue)) {
      notFound();
    }
    resolvedLocale = paramValue;
  }

  const messages = (await import(`../../messages/${resolvedLocale}.json`)) as {
    default: Record<string, unknown>;
  };

  return {
    locale: resolvedLocale,
    messages: messages.default,
  };
});
