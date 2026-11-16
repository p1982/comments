'use client';

import CommentCard from './CommentCard';
import { CommentsStack } from './CommentsList.styled';

interface CommentsListProps {
  commentsIds: string[];
  depth?: number;
}

const CommentsList = ({ commentsIds, depth = 0 }: CommentsListProps) => {
  return (
    <CommentsStack $depth={depth}>
      {commentsIds.map((id) => (
        <CommentCard key={id} id={id} />
      ))}
    </CommentsStack>
  );
};

export default CommentsList;
