'use client';

import Button from '@mui/material/Button';
import { useTranslations } from 'next-intl';

import type { CommentSortField } from '@comments/shared';
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
  const storedIds = useCommentsStore((state) => state.commentsIds);
  const totalPages = useCommentsStore((state) => state.totalPages);
  const page = useCommentsStore((state) => state.page);
  const sort = useCommentsStore((state) => state.sort);
  const order = useCommentsStore((state) => state.order);
  const searchQuery = useCommentsStore((state) => state.searchQuery);
  const isLoading = useCommentsStore((state) => state.isLoading);
  const openRootForm = useCommentsStore((state) => state.openRootForm);
  const fetchComments = useCommentsStore((state) => state.fetchComments);
  const { setListQuery } = useCommentsListQuery();
  const ids = commentsIds ?? storedIds;
  const showSkeleton = depth === 0 && isLoading && ids.length > 0;
  const sortLabels: Record<CommentSortField, string> = {
    fullName: t('nameLabel'),
    email: t('emailLabel'),
    createdAt: t('dateLabel'),
  };

  const onPageChange = (nextPage: number) => {
    setListQuery({ page: nextPage });
  };

  const onSort = (field: CommentSortField) => {
    const nextOrder = sort === field && order === 'asc' ? 'desc' : 'asc';

    if (searchQuery || page !== 1) {
      useCommentsStore.setState({ sort: field, order: nextOrder });
      setListQuery({ q: null, page: 1 });
      return;
    }

    void fetchComments({ sort: field, order: nextOrder, page: 1 });
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
                $active={sort === field}
                aria-pressed={sort === field}
                data-testid={`sort-${field}`}
                onClick={() => onSort(field)}
              >
                {sortLabels[field]}
                {sort === field ? (order === 'asc' ? ' ↑' : ' ↓') : ''}
              </SortButton>
            ))}
          <Button type="button" onClick={openRootForm} data-testid="add-comment">
            Add Comment
          </Button>
        </SortBar>
      )}
      {showSkeleton ? (
        <CommentsListSkeleton count={Math.min(ids.length, 5)} />
      ) : (
        ids.map((id) => <CommentCard key={id} id={id} rootId={rootId ?? id} depth={depth} />)
      )}
      {depth === 0 && !showSkeleton && storedIds.length > 0 && totalPages > 1 && (
        <PaginationOutlined totalPages={totalPages} page={page} onPageChange={onPageChange} />
      )}
    </CommentsStack>
  );
};

export default CommentsList;
