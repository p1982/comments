'use client';

import { useEffect, useRef, useState } from 'react';
import AddCommentOutlinedIcon from '@mui/icons-material/AddCommentOutlined';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ReplyIcon from '@mui/icons-material/Reply';
import TagIcon from '@mui/icons-material/Tag';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';

import {
  getApiUrl,
  sanitizeHtml,
  type CommentAttachments,
  type CommentVoteValue,
} from '@comments/shared';
import useCommentsStore from '@/store/comments/comments.store';
import { formatCommentDate } from '@/utils';

import CommentForm from '../CommentForm/CommentForm';
import FileLightBox from '../FileLightbox/FileLightBox';
import CommentsList from './CommentsList';
import {
  ActionButton,
  ActionRow,
  AddCommentButton,
  AttachmentsRow,
  AttachmentThumb,
  AuthorName,
  Card,
  CommentAvatar,
  CommentDate,
  CommentEmail,
  CommentText,
  Header,
  RepliesCount,
  RepliesToggleButton,
  VoteButton,
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

const stripHtml = (html: string): string =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();

const buildCommentQuote = (author: string, html: string): string => {
  const plain = stripHtml(html).replace(/[<>]/g, '').replace(/&/g, 'and').slice(0, 200);
  const safeAuthor = author.replace(/[<>]/g, '').replace(/&/g, 'and').trim();
  const excerpt = plain.length === 200 ? `${plain}...` : plain;
  return `<i><strong>${safeAuthor}:</strong> ${excerpt}</i>\n`;
};

const copyToClipboard = async (value: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
};

const CommentCard = ({ id, rootId, depth = 0 }: { id: string; rootId: string; depth?: number }) => {
  const t = useTranslations('HomePage');
  const tr = (key: string, fallback: string): string => (t.has(key) ? t(key) : fallback);

  const comment = useCommentsStore(
    (state) =>
      state.comments[id] ??
      state.childrenComments[rootId]?.comments[id] ??
      state.bookmarkedComments[id] ??
      null,
  );
  const thread = useCommentsStore((state) => state.childrenComments[rootId]);
  const isLoadingChildren = useCommentsStore((state) => Boolean(state.loadingChildrenIds[id]));
  const isVoting = useCommentsStore((state) => Boolean(state.votingCommentIds[id]));
  const isBookmarked = useCommentsStore((state) => Boolean(state.bookmarkedComments[id]));
  const expanded = useCommentsStore((state) => Boolean(state.expandedRootIds[id]));
  const openReplyForm = useCommentsStore((state) => state.openReplyForm);
  const replyParentId = useCommentsStore((state) => state.commentTarget?.parentId ?? null);
  const fetchChildrenComments = useCommentsStore((state) => state.fetchChildrenComments);
  const setRootExpanded = useCommentsStore((state) => state.setRootExpanded);
  const toggleBookmark = useCommentsStore((state) => state.toggleBookmark);
  const voteComment = useCommentsStore((state) => state.voteComment);
  const [lightbox, setLightbox] = useState<CommentAttachments | null>(null);
  const [highlighted, setHighlighted] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const anchor = `#comment-${id}`;
    const checkHash = () => {
      if (window.location.hash !== anchor) {
        return;
      }
      setHighlighted(true);
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => setHighlighted(false), 2500);
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => {
      window.removeEventListener('hashchange', checkHash);
    };
  }, [id]);

  if (!comment) {
    return null;
  }

  const initial = comment.fullName.trim().charAt(0).toUpperCase() || '?';
  const directChildIds =
    thread?.commentsIds.filter((childId) => thread.comments[childId]?.parentId === id) ?? [];
  const repliesCount = Math.max(comment.repliesCount ?? 0, thread?.commentsIds.length ?? 0);
  const votesScore = comment.votesScore ?? 0;
  const userVote = comment.userVote ?? 0;
  const apiOrigin = getApiUrl().replace(/\/api\/v\d+$/, '');

  const handleRootIdClick = async () => {
    if (expanded) {
      setRootExpanded(id, false);
      return;
    }

    await fetchChildrenComments(id);
    setRootExpanded(id, true);
  };

  const handleReply = () => {
    openReplyForm(id, rootId);
    if (comment.parentId === null && repliesCount > 0) {
      setRootExpanded(id, true);
      void fetchChildrenComments(id);
    }
  };

  const handleQuote = () => {
    const quote = buildCommentQuote(comment.fullName, comment.text);
    openReplyForm(id, rootId, quote);
    if (comment.parentId === null && repliesCount > 0) {
      setRootExpanded(id, true);
      void fetchChildrenComments(id);
    }
  };

  const handleCopyLink = async () => {
    const anchor = `#comment-${comment.id}`;
    const url = `${window.location.origin}${window.location.pathname}${window.location.search}${anchor}`;
    window.history.replaceState(null, '', anchor);
    setHighlighted(true);
    window.setTimeout(() => setHighlighted(false), 2500);

    if (await copyToClipboard(url)) {
      toast.success(tr('linkCopied', 'Comment link copied'), { toastId: `copy-link-${id}` });
    }
  };

  const handleCopyText = async () => {
    const plain = stripHtml(comment.text);
    if (!plain) {
      return;
    }
    if (await copyToClipboard(plain)) {
      toast.success(tr('textCopied', 'Comment text copied'), { toastId: `copy-text-${id}` });
    }
  };

  const handleToggleBookmark = () => {
    const added = toggleBookmark(comment);
    toast.info(
      added
        ? tr('bookmarkAdded', 'Added to bookmarks')
        : tr('bookmarkRemoved', 'Removed from bookmarks'),
      { toastId: `bookmark-${id}` },
    );
  };

  const handleVote = async (value: CommentVoteValue) => {
    await voteComment(id, rootId, value);
    const message = useCommentsStore.getState().error;
    if (message) {
      toast.error(message, { toastId: `comment-vote-error-${id}` });
    }
  };

  return (
    <>
      <Card
        ref={cardRef}
        id={`comment-${comment.id}`}
        $highlighted={highlighted}
        data-testid="comment-card"
        data-comment-id={comment.id}
      >
        <Header>
          <CommentAvatar $color={avatarColor(comment.fullName)}>{initial}</CommentAvatar>
          <AuthorName data-testid="comment-card-name">{comment.fullName}</AuthorName>
          {comment.parentId === null && repliesCount > 0 && (
            <RepliesToggleButton
              size="small"
              aria-label={expanded ? 'Hide replies' : 'Show replies'}
              aria-expanded={expanded}
              disabled={isLoadingChildren}
              onClick={() => void handleRootIdClick()}
            >
              {isLoadingChildren ? (
                <CircularProgress size={14} color="inherit" />
              ) : expanded ? (
                <KeyboardArrowUpIcon />
              ) : (
                <KeyboardArrowDownIcon />
              )}
              <RepliesCount>{repliesCount}</RepliesCount>
            </RepliesToggleButton>
          )}
          <AddCommentButton type="button" aria-label="Add comment" onClick={handleReply}>
            <AddCommentOutlinedIcon />
          </AddCommentButton>
          <CommentEmail data-testid="comment-card-email">{comment.email}</CommentEmail>
          <CommentDate data-testid="comment-card-date">
            {formatCommentDate(comment.createdAt)}
          </CommentDate>
          <ActionRow>
            <ActionButton
              size="small"
              aria-label={tr('copyLink', 'Copy comment link')}
              title={tr('copyLink', 'Copy comment link')}
              data-testid="comment-copy-link"
              onClick={() => void handleCopyLink()}
            >
              <TagIcon />
            </ActionButton>
            <ActionButton
              size="small"
              aria-label={tr('quoteComment', 'Quote comment')}
              title={tr('quoteComment', 'Quote comment')}
              data-testid="comment-quote"
              onClick={handleQuote}
            >
              <FormatQuoteIcon />
            </ActionButton>
            <ActionButton
              size="small"
              aria-label={tr('replyComment', 'Reply')}
              title={tr('replyComment', 'Reply')}
              data-testid="comment-reply"
              onClick={handleReply}
            >
              <ReplyIcon />
            </ActionButton>
            <ActionButton
              size="small"
              aria-label={tr('copyText', 'Copy comment text')}
              title={tr('copyText', 'Copy comment text')}
              data-testid="comment-copy-text"
              onClick={() => void handleCopyText()}
            >
              <ContentCopyIcon />
            </ActionButton>
            <ActionButton
              size="small"
              $active={isBookmarked}
              aria-label={
                isBookmarked
                  ? tr('bookmarkRemove', 'Remove from bookmarks')
                  : tr('bookmarkAdd', 'Add to bookmarks')
              }
              title={
                isBookmarked
                  ? tr('bookmarkRemove', 'Remove from bookmarks')
                  : tr('bookmarkAdd', 'Add to bookmarks')
              }
              aria-pressed={isBookmarked}
              data-testid="comment-bookmark"
              onClick={handleToggleBookmark}
            >
              {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </ActionButton>
          </ActionRow>
          <VoteRow>
            <VoteButton
              size="small"
              aria-label="Upvote"
              aria-pressed={userVote === 1}
              data-testid="comment-upvote"
              $active={userVote === 1 ? 'up' : null}
              disabled={isVoting}
              onClick={() => void handleVote(1)}
            >
              <KeyboardArrowUpIcon />
            </VoteButton>
            <VoteCount data-testid="comment-vote-count" $score={votesScore}>
              {votesScore}
            </VoteCount>
            <VoteButton
              size="small"
              aria-label="Downvote"
              aria-pressed={userVote === -1}
              data-testid="comment-downvote"
              $active={userVote === -1 ? 'down' : null}
              disabled={isVoting}
              onClick={() => void handleVote(-1)}
            >
              <KeyboardArrowDownIcon />
            </VoteButton>
          </VoteRow>
        </Header>
        <CommentText
          data-testid="comment-card-text"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(comment.text) }}
        />
        {comment.attachments.length > 0 && (
          <AttachmentsRow>
            {comment.attachments.map((file) =>
              file.fileType === 'image' ? (
                <Button
                  type="button"
                  key={file.id}
                  data-testid="comment-attachment-image"
                  onClick={() => setLightbox(file)}
                  sx={{ p: 0.5, minWidth: 0 }}
                >
                  <AttachmentThumb src={`${apiOrigin}${file.url}`} alt={file.fileName} />
                </Button>
              ) : (
                <Button
                  type="button"
                  key={file.id}
                  variant="outlined"
                  size="small"
                  data-testid="comment-attachment-text"
                  onClick={() => setLightbox(file)}
                  sx={{ maxWidth: '100%', textTransform: 'none', overflowWrap: 'anywhere' }}
                >
                  {file.fileName}
                </Button>
              ),
            )}
          </AttachmentsRow>
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
