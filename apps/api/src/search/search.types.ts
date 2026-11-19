export interface IndexCommentInput {
  id: string;
  parentId: string | null;
  fullName: string;
  text: string;
  createdAt: string;
}

export interface CommentSearchDocument {
  id: string;
  parentId: string | null;
  username: string;
  plainText: string;
  createdAt: string;
}
