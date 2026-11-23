import dayjs from 'dayjs';

import type { CommentResponse } from '@comments/shared';

export const reduceComments = (comments: CommentResponse[]) => {
  const commentsMap: Record<string, CommentResponse> = {};
  for (const comment of comments) {
    commentsMap[comment.id] = comment;
  }

  const ids = comments.map((comment) => comment.id);
  return [commentsMap, ids] as const;
};

export const formatCommentDate = (value: string) => dayjs(value).format('DD.MM.YY [в] HH:mm');
