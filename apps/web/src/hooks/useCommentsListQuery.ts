'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';

export interface CommentsListQueryParams {
  q: string | null;
  page: number;
}

const parsePage = (value: string | null) => {
  const page = Number(value ?? 1);
  return Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
};

const useCommentsListQuery = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = useMemo(() => {
    const value = searchParams.get('q')?.trim() ?? '';
    return value.length > 0 ? value : null;
  }, [searchParams]);

  const page = useMemo(() => parsePage(searchParams.get('page')), [searchParams]);

  const setListQuery = useCallback(
    (next: { q?: string | null; page?: number }) => {
      const params = new URLSearchParams(searchParams.toString());
      const nextQ = next.q === undefined ? q : next.q === null ? null : next.q.trim() || null;
      const nextPage = next.page ?? 1;

      if (nextQ) {
        params.set('q', nextQ);
      } else {
        params.delete('q');
      }

      if (nextPage > 1) {
        params.set('page', String(nextPage));
      } else {
        params.delete('page');
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, q, router, searchParams],
  );

  return { q, page, setListQuery };
};

export default useCommentsListQuery;
