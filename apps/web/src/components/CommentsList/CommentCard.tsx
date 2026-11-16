'use client';

import { useState } from 'react';

import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ReplyIcon from '@mui/icons-material/Reply';
import TagIcon from '@mui/icons-material/Tag';

import useCommentsStore from '@/store/comments/comments.store';

import CommentsList from './CommentsList';
import {
  ActionButton,
  ActionRow,
  AuthorName,
  Card,
  CommentAvatar,
  CommentDate,
  CommentEmail,
  CommentText,
  Header,
  VoteCount,
  VoteRow,
} from './CommentCard.styled';
import { formatCommentDate } from '@/utils';

const defaultAvatarColor = '#90caf9';

const avatarColors = ['#90caf9', '#ce93d8', '#a5d6a7', '#ffcc80', '#80cbc4', '#f48fb1'];

const avatarColor = (name: string) => {
  let sum = 0;
  for (let index = 0; index < name.length; index += 1) {
    sum += name.charCodeAt(index);
  }
  return avatarColors[sum % avatarColors.length] ?? defaultAvatarColor;
};

const CommentCard = ({ id, rootId, depth = 0 }: { id: string; rootId: string; depth?: number }) => {
  const comment = useCommentsStore(
    (state) => state.comments[id] ?? state.childrenComments[rootId]?.comments[id] ?? null,
  );
  const thread = useCommentsStore((state) => state.childrenComments[rootId]);
  const fetchChildrenComments = useCommentsStore((state) => state.fetchChildrenComments);
  const [expanded, setExpanded] = useState(false);

  if (!comment) {
    return null;
  }

  const initial = comment.fullName.trim().charAt(0).toUpperCase() || '?';
  const directChildIds =
    thread?.commentsIds.filter((childId) => thread.comments[childId]?.parentId === id) ?? [];

  const handleRootIdClick = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }

    await fetchChildrenComments(id);
    setExpanded(true);
  };

  return (
    <Card>
      <Header>
        <CommentAvatar $color={avatarColor(comment.fullName)}>{initial}</CommentAvatar>
        <AuthorName>{comment.fullName}</AuthorName>
        {comment.parentId === null && (
          <ActionButton
            size="small"
            aria-label={expanded ? 'Hide replies' : 'Show replies'}
            aria-expanded={expanded}
            onClick={() => void handleRootIdClick()}
          >
            {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </ActionButton>
        )}
        <CommentEmail>{comment.email}</CommentEmail>
        <CommentDate>{formatCommentDate(comment.createdAt)}</CommentDate>
        <ActionRow>
          <ActionButton size="small" aria-label="Link">
            <TagIcon />
          </ActionButton>
          <ActionButton size="small" aria-label="Quote">
            <FormatQuoteIcon />
          </ActionButton>
          <ActionButton size="small" aria-label="Reply">
            <ReplyIcon />
          </ActionButton>
          <ActionButton size="small" aria-label="Add">
            <AddCircleOutlineOutlinedIcon />
          </ActionButton>
        </ActionRow>
        <VoteRow>
          <ActionButton size="small" aria-label="Upvote">
            <KeyboardArrowUpIcon />
          </ActionButton>
          <VoteCount>0</VoteCount>
          <ActionButton size="small" aria-label="Downvote">
            <KeyboardArrowDownIcon />
          </ActionButton>
        </VoteRow>
      </Header>
      <CommentText>{comment.text}</CommentText>
      {(comment.parentId !== null || expanded) && directChildIds.length > 0 && (
        <CommentsList commentsIds={directChildIds} rootId={rootId} depth={depth + 1} />
      )}
    </Card>
  );
};

export default CommentCard;
