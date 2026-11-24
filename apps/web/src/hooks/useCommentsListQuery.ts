'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import {
  commentSortFields,
  commentSortOrders,
  type CommentSortField,
  type CommentSortOrder,
} from '@comments/shared';
import { usePathname, useRouter } from '@/i18n/navigation';

export interface CommentsListQueryParams {
  q: string | null;
  page: number;
  sort: CommentSortField;
  order: CommentSortOrder;
}

const DEFAULT_SORT: CommentSortField = 'createdAt';
const DEFAULT_ORDER: CommentSortOrder = 'desc';

const parsePage = (value: string | null): number => {
  const page = Number(value ?? 1);
  return Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
};

const parseSort = (value: string | null): CommentSortField =>
  value && (commentSortFields as readonly string[]).includes(value)
    ? (value as CommentSortField)
    : DEFAULT_SORT;

const parseOrder = (value: string | null): CommentSortOrder =>
  value && (commentSortOrders as readonly string[]).includes(value)
    ? (value as CommentSortOrder)
    : DEFAULT_ORDER;

const useCommentsListQuery = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = useMemo(() => {
    const value = searchParams.get('q')?.trim() ?? '';
    return value.length > 0 ? value : null;
  }, [searchParams]);

  const page = useMemo(() => parsePage(searchParams.get('page')), [searchParams]);
  const sort = useMemo(() => parseSort(searchParams.get('sort')), [searchParams]);
  const order = useMemo(() => parseOrder(searchParams.get('order')), [searchParams]);

  const setListQuery = useCallback(
    (next: {
      q?: string | null;
      page?: number;
      sort?: CommentSortField;
      order?: CommentSortOrder;
    }) => {
      const params = new URLSearchParams(searchParams.toString());
      const nextQ = next.q === undefined ? q : next.q === null ? null : next.q.trim() || null;
      const nextPage = next.page ?? 1;
      const nextSort = next.sort ?? sort;
      const nextOrder = next.order ?? order;

      if (nextQ) {
        params.set('q', nextQ);
        params.delete('sort');
        params.delete('order');
      } else {
        params.delete('q');
        if (nextSort !== DEFAULT_SORT || nextOrder !== DEFAULT_ORDER) {
          params.set('sort', nextSort);
          params.set('order', nextOrder);
        } else {
          params.delete('sort');
          params.delete('order');
        }
      }

      if (nextPage > 1) {
        params.set('page', String(nextPage));
      } else {
        params.delete('page');
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [order, pathname, q, router, searchParams, sort],
  );

  return { q, page, sort, order, setListQuery };
};

export default useCommentsListQuery;
