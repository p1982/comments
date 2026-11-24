'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useTranslations } from 'next-intl';

import type { CommentSortField, CommentSortOrder } from '@comments/shared';
import useCommentsListQuery from '@/hooks/useCommentsListQuery';
import useCommentsStore from '@/store/comments/comments.store';

import PaginationOutlined from '../Pagination/Pagination';
import CommentCard from './CommentCard';
import CommentsListSkeleton from './CommentsListSkeleton';
import { CommentsStack, SortBar, SortButton } from './CommentsList.styled';

interface CommentsListProps {
  commentsIds?: string[];
  rootId?: string;
  depth?: number;
}

const sortColumns: CommentSortField[] = ['fullName', 'email', 'createdAt'];

const CommentsList = ({ commentsIds, rootId, depth = 0 }: CommentsListProps) => {
  const t = useTranslations('HomePage');
  const tr = (key: string, fallback: string): string => (t.has(key) ? t(key) : fallback);

  const storedIds = useCommentsStore((state) => state.commentsIds);
  const bookmarkedComments = useCommentsStore((state) => state.bookmarkedComments);
  const showBookmarksOnly = useCommentsStore((state) => state.showBookmarksOnly);
  const setShowBookmarksOnly = useCommentsStore((state) => state.setShowBookmarksOnly);
  const totalPages = useCommentsStore((state) => state.totalPages);
  const page = useCommentsStore((state) => state.page);
  const searchQuery = useCommentsStore((state) => state.searchQuery);
  const isLoading = useCommentsStore((state) => state.isLoading);
  const openRootForm = useCommentsStore((state) => state.openRootForm);
  const { sort, order, setListQuery } = useCommentsListQuery();

  const bookmarkedIds = Object.keys(bookmarkedComments);
  const isBookmarksView = depth === 0 && !searchQuery && showBookmarksOnly;
  const ids = isBookmarksView ? bookmarkedIds : (commentsIds ?? storedIds);
  const showSkeleton = depth === 0 && !isBookmarksView && isLoading && ids.length > 0;
  const sortLabels: Record<CommentSortField, string> = {
    fullName: t('nameLabel'),
    email: t('emailLabel'),
    createdAt: t('dateLabel'),
  };

  const onPageChange = (nextPage: number) => {
    setListQuery({ page: nextPage });
  };

  const onSort = (field: CommentSortField) => {
    setShowBookmarksOnly(false);
    const nextOrder: CommentSortOrder = sort === field && order === 'asc' ? 'desc' : 'asc';
    setListQuery({ q: null, sort: field, order: nextOrder, page: 1 });
  };

  return (
    <CommentsStack $depth={depth}>
      {depth === 0 && (
        <SortBar>
          {!searchQuery &&
            sortColumns.map((field) => (
              <SortButton
                key={field}
                type="button"
                $active={!showBookmarksOnly && sort === field}
                aria-pressed={!showBookmarksOnly && sort === field}
                data-testid={`sort-${field}`}
                onClick={() => onSort(field)}
              >
                {sortLabels[field]}
                {!showBookmarksOnly && sort === field ? (order === 'asc' ? ' ↑' : ' ↓') : ''}
              </SortButton>
            ))}
          {!searchQuery && (
            <SortButton
              type="button"
              $active={showBookmarksOnly}
              aria-pressed={showBookmarksOnly}
              data-testid="filter-bookmarks"
              onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
            >
              ★ {tr('bookmarksFilter', 'Bookmarks')} ({bookmarkedIds.length})
            </SortButton>
          )}
          <Button type="button" onClick={openRootForm} data-testid="add-comment">
            Add Comment
          </Button>
        </SortBar>
      )}
      {showSkeleton ? (
        <CommentsListSkeleton count={Math.min(ids.length, 5)} />
      ) : isBookmarksView && ids.length === 0 ? (
        <Alert severity="info">{tr('bookmarksEmpty', 'No bookmarked comments yet')}</Alert>
      ) : (
        ids.map((id) => <CommentCard key={id} id={id} rootId={rootId ?? id} depth={depth} />)
      )}
      {depth === 0 &&
        !isBookmarksView &&
        !showSkeleton &&
        storedIds.length > 0 &&
        totalPages > 1 && (
          <PaginationOutlined totalPages={totalPages} page={page} onPageChange={onPageChange} />
        )}
    </CommentsStack>
  );
};

export default CommentsList;
