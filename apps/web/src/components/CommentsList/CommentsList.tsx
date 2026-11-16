'use client';

import { useTranslations } from 'next-intl';

import type { CommentSortField } from '@comments/shared';
import useCommentsStore from '@/store/comments/comments.store';

import PaginationOutlined from '../Pagination/Pagination';
import CommentCard from './CommentCard';
import { CommentsStack, SortBar, SortButton } from './CommentsList.styled';

interface CommentsListProps {
  commentsIds?: string[];
  rootId?: string;
  depth?: number;
}

const sortColumns: CommentSortField[] = ['fullName', 'email', 'createdAt'];

const CommentsList = ({ commentsIds, rootId, depth = 0 }: CommentsListProps) => {
  const t = useTranslations('HomePage');
  const storedIds = useCommentsStore((state) => state.commentsIds);
  const totalPages = useCommentsStore((state) => state.totalPages);
  const page = useCommentsStore((state) => state.page);
  const sort = useCommentsStore((state) => state.sort);
  const order = useCommentsStore((state) => state.order);
  const fetchComments = useCommentsStore((state) => state.fetchComments);
  const ids = commentsIds ?? storedIds;
  const sortLabels: Record<CommentSortField, string> = {
    fullName: t('nameLabel'),
    email: t('emailLabel'),
    createdAt: t('dateLabel'),
  };

  const onPageChange = (nextPage: number) => {
    void fetchComments({ page: nextPage });
  };

  const onSort = (field: CommentSortField) => {
    const nextOrder = sort === field && order === 'asc' ? 'desc' : 'asc';
    void fetchComments({ sort: field, order: nextOrder, page: 1 });
  };

  return (
    <CommentsStack $depth={depth}>
      {depth === 0 && (
        <SortBar>
          {sortColumns.map((field) => (
            <SortButton
              key={field}
              type="button"
              $active={sort === field}
              aria-pressed={sort === field}
              onClick={() => onSort(field)}
            >
              {sortLabels[field]}
              {sort === field ? (order === 'asc' ? ' ↑' : ' ↓') : ''}
            </SortButton>
          ))}
        </SortBar>
      )}
      {ids.map((id) => (
        <CommentCard key={id} id={id} rootId={rootId ?? id} depth={depth} />
      ))}
      {depth === 0 && storedIds.length > 0 && totalPages > 1 && (
        <PaginationOutlined totalPages={totalPages} page={page} onPageChange={onPageChange} />
      )}
    </CommentsStack>
  );
};

export default CommentsList;
