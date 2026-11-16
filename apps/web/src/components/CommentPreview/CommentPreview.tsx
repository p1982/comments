import { sanitizeHtml, type CommentsSchema } from '@comments/shared';
import { formatCommentDate } from '@/utils';

import {
  AuthorName,
  Card,
  CommentAvatar,
  CommentDate,
  CommentEmail,
  CommentText,
  Header,
} from '../CommentsList/CommentCard.styled';

const defaultAvatarColor = '#90caf9';

const avatarColors = ['#90caf9', '#ce93d8', '#a5d6a7', '#ffcc80', '#80cbc4', '#f48fb1'];

const avatarColor = (name: string) => {
  let sum = 0;
  for (let index = 0; index < name.length; index += 1) {
    sum += name.charCodeAt(index);
  }
  return avatarColors[sum % avatarColors.length] ?? defaultAvatarColor;
};

function CommentPreview({ comment }: { comment: CommentsSchema }) {
  const initial = comment.fullName.trim().charAt(0).toUpperCase() || '?';

  return (
    <Card>
      <Header>
        <CommentAvatar $color={avatarColor(comment.fullName)}>{initial}</CommentAvatar>
        <AuthorName>{comment.fullName}</AuthorName>
        <CommentEmail>{comment.email}</CommentEmail>
        {comment.homepage ? (
          <CommentEmail as="a" href={comment.homepage} target="_blank" rel="noreferrer">
            {comment.homepage}
          </CommentEmail>
        ) : null}
        <CommentDate>{formatCommentDate(new Date().toISOString())}</CommentDate>
      </Header>
      <CommentText dangerouslySetInnerHTML={{ __html: sanitizeHtml(comment.text) }} />
    </Card>
  );
}

export default CommentPreview;
