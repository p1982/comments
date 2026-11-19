'use client';

import { useState } from 'react';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import AddCommentOutlinedIcon from '@mui/icons-material/AddCommentOutlined';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ReplyIcon from '@mui/icons-material/Reply';
import TagIcon from '@mui/icons-material/Tag';
import Button from '@mui/material/Button';

import { getApiUrl, sanitizeHtml, type CommentAttachments } from '@comments/shared';
import useCommentsStore from '@/store/comments/comments.store';
import { formatCommentDate } from '@/utils';

import CommentForm from '../CommentForm/CommentForm';
import FileLightBox from '../FileLightbox/FileLightBox';
import CommentsList from './CommentsList';
import {
  ActionButton,
  ActionRow,
  AddCommentButton,
  AttachmentThumb,
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
  const openReplyForm = useCommentsStore((state) => state.openReplyForm);
  const replyParentId = useCommentsStore((state) => state.commentTarget?.parentId ?? null);
  const fetchChildrenComments = useCommentsStore((state) => state.fetchChildrenComments);
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState<CommentAttachments | null>(null);

  if (!comment) {
    return null;
  }

  const initial = comment.fullName.trim().charAt(0).toUpperCase() || '?';
  const directChildIds =
    thread?.commentsIds.filter((childId) => thread.comments[childId]?.parentId === id) ?? [];
  const apiOrigin = getApiUrl().replace(/\/api\/v\d+$/, '');

  const handleRootIdClick = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }

    await fetchChildrenComments(id);
    setExpanded(true);
  };

  const handleReply = () => {
    openReplyForm(id, rootId);
    if (comment.parentId === null) {
      setExpanded(true);
      void fetchChildrenComments(id);
    }
  };

  return (
    <>
      <Card data-testid="comment-card" data-comment-id={comment.id}>
        <Header>
          <CommentAvatar $color={avatarColor(comment.fullName)}>{initial}</CommentAvatar>
          <AuthorName data-testid="comment-card-name">{comment.fullName}</AuthorName>
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
          <AddCommentButton type="button" aria-label="Add comment" onClick={handleReply}>
            <AddCommentOutlinedIcon />
          </AddCommentButton>
          <CommentEmail data-testid="comment-card-email">{comment.email}</CommentEmail>
          <CommentDate data-testid="comment-card-date">
            {formatCommentDate(comment.createdAt)}
          </CommentDate>
          <ActionRow>
            <ActionButton size="small" aria-label="Link">
              <TagIcon />
            </ActionButton>
            <ActionButton size="small" aria-label="Quote">
              <FormatQuoteIcon />
            </ActionButton>
            <ActionButton size="small" aria-label="Reply" onClick={handleReply}>
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
        <CommentText
          data-testid="comment-card-text"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(comment.text) }}
        />
        {comment.attachments.map((file) =>
          file.fileType === 'image' ? (
            <Button
              type="button"
              key={file.id}
              data-testid="comment-attachment-image"
              onClick={() => setLightbox(file)}
            >
              <AttachmentThumb src={`${apiOrigin}${file.url}`} alt={file.fileName} />
            </Button>
          ) : (
            <Button
              type="button"
              key={file.id}
              data-testid="comment-attachment-text"
              onClick={() => setLightbox(file)}
            >
              {file.fileName}
            </Button>
          ),
        )}
        {replyParentId === id && <CommentForm parentId={id} />}
        {(comment.parentId !== null || expanded) && directChildIds.length > 0 && (
          <CommentsList commentsIds={directChildIds} rootId={rootId} depth={depth + 1} />
        )}
      </Card>
      {lightbox && <FileLightBox file={lightbox} onClose={() => setLightbox(null)} />}
    </>
  );
};

export default CommentCard;
