import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import styled from 'styled-components';

export const Card = styled(Box)`
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid #e6e8ec;
  background-color: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
`;

export const Header = styled(Box)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.25)};
  padding: ${({ theme }) => `${theme.spacing(1.25)} ${theme.spacing(2)}`};
  background-color: #f4f6f8;
`;

export const CommentAvatar = styled(Avatar)<{ $color: string }>`
  && {
    width: 40px;
    height: 40px;
    background-color: ${({ $color }) => $color};
    color: #1f2937;
    font-weight: 700;
    font-size: 16px;
  }
`;

export const AuthorName = styled(Typography)`
  && {
    font-weight: 700;
    color: #1f2937;
    font-size: 15px;
  }
`;

export const CommentEmail = styled(Typography)`
  && {
    color: #6b7280;
    font-size: 13px;
  }
`;

export const CommentDate = styled(Typography)`
  && {
    color: #8b95a7;
    font-size: 13px;
    white-space: nowrap;
  }
`;

export const ActionRow = styled(Stack).attrs({
  direction: 'row' as const,
})`
  && {
    align-items: center;
    gap: ${({ theme }) => theme.spacing(0.25)};
  }
`;

export const AddCommentButton = styled(IconButton)`
  && {
    color: #fff;
    background-color: #1976d2;
    padding: ${({ theme }) => theme.spacing(1)};
    margin-inline: ${({ theme }) => theme.spacing(0.75)};

    &:hover {
      background-color: #1565c0;
    }
  }

  svg {
    font-size: 20px;
  }
`;

export const ActionButton = styled(IconButton)`
  && {
    color: #8b95a7;
    padding: ${({ theme }) => theme.spacing(0.5)};
  }

  svg {
    font-size: 18px;
  }
`;

export const VoteRow = styled(Stack).attrs({
  direction: 'row' as const,
})`
  && {
    align-items: center;
    margin-left: auto;
    color: #8b95a7;
    gap: ${({ theme }) => theme.spacing(0.25)};
  }
`;

export const VoteCount = styled(Typography)`
  && {
    min-width: 12px;
    text-align: center;
    font-size: 14px;
    color: #6b7280;
  }
`;

export const CommentText = styled(Typography)`
  && {
    padding: ${({ theme }) => `${theme.spacing(2)} ${theme.spacing(2.5)}`};
    color: #4b5568;
    font-size: 15px;
    line-height: 1.65;
    white-space: pre-wrap;
  }
`;
