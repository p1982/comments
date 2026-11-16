'use client';

import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ReplyIcon from '@mui/icons-material/Reply';
import TagIcon from '@mui/icons-material/Tag';

import useCommentsStore from '@/store/comments/comments.store';

import Loader from '../Loader/Loader';
import CommentsList from './CommentsList';
import {
  ActionButton,
  ActionRow,
  AuthorName,
  Card,
  CommentAvatar,
  CommentDate,
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

const CommentCard = ({ id }: { id: string }) => {
  const comment = useCommentsStore((state) => {
    const parent = state.comments[id];
    if (parent) {
      return parent;
    }

    const children = state.childrenComments['rootId']
      ? state.childrenComments['rootId'].comments[id]
      : null;
    if (children) {
      return children;
    }
    return null;
  });
  const fetchChildrenComments = useCommentsStore((state) => state.fetchChildrenComments);
  const isLoading = useCommentsStore((state) => state.isLoading);
  const childrenCommentsIds = useCommentsStore((state) => state.childrenComments[id]?.commentsIds);

  if (!comment) {
    return null;
  }

  const initial = comment.fullName.trim().charAt(0).toUpperCase() || '?';

  const handleRootIdClick = async () => {
    await fetchChildrenComments(id);
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Card>
      <Header>
        <CommentAvatar $color={avatarColor(comment.fullName)}>{initial}</CommentAvatar>
        <AuthorName>{comment.fullName}</AuthorName>
        {comment.parentId === null && (
          <ActionButton
            size="small"
            aria-label="Show replies"
            onClick={() => void handleRootIdClick()}
          >
            <KeyboardArrowDownIcon />
          </ActionButton>
        )}
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
      {childrenCommentsIds && <CommentsList commentsIds={childrenCommentsIds} depth={3} />}
    </Card>
  );
};

export default CommentCard;
