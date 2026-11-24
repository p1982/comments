import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import styled from 'styled-components';

export const Card = styled(Box)<{ $highlighted?: boolean }>`
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid ${({ $highlighted }) => ($highlighted ? '#1565c0' : '#e6e8ec')};
  background-color: #fff;
  box-shadow: ${({ $highlighted }) =>
    $highlighted ? '0 0 0 3px rgba(21, 101, 192, 0.16)' : '0 1px 2px rgba(15, 23, 42, 0.04)'};
  transition:
    border-color 200ms ease,
    box-shadow 200ms ease;
  min-width: 0;
`;

export const Header = styled(Box)`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  row-gap: ${({ theme }) => theme.spacing(1)};
  column-gap: ${({ theme }) => theme.spacing(1.25)};
  padding: ${({ theme }) => `${theme.spacing(1.25)} ${theme.spacing(2)}`};
  background-color: #f4f6f8;

  @media (max-width: 600px) {
    padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(1.5)}`};
    column-gap: ${({ theme }) => theme.spacing(1)};
  }
`;

export const CommentAvatar = styled(Avatar)<{ $color: string }>`
  && {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    background-color: ${({ $color }) => $color};
    color: #1f2937;
    font-weight: 700;
    font-size: 16px;

    @media (max-width: 600px) {
      width: 32px;
      height: 32px;
      font-size: 14px;
    }
  }
`;

export const AuthorName = styled(Typography)`
  && {
    font-weight: 700;
    color: #1f2937;
    font-size: 15px;
    overflow-wrap: anywhere;
    min-width: 0;

    @media (max-width: 600px) {
      font-size: 14px;
    }
  }
`;

export const CommentEmail = styled(Typography)`
  && {
    color: #6b7280;
    font-size: 13px;
    overflow-wrap: anywhere;
    min-width: 0;

    @media (max-width: 600px) {
      font-size: 12px;
    }
  }
`;

export const CommentDate = styled(Typography)`
  && {
    color: #8b95a7;
    font-size: 13px;
    white-space: nowrap;

    @media (max-width: 600px) {
      font-size: 12px;
    }
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
    margin-inline: ${({ theme }) => theme.spacing(0.5)};
    flex-shrink: 0;

    &:hover {
      background-color: #1565c0;
    }

    @media (max-width: 600px) {
      padding: ${({ theme }) => theme.spacing(0.75)};
      margin-inline: 0;
    }
  }

  svg {
    font-size: 20px;

    @media (max-width: 600px) {
      font-size: 18px;
    }
  }
`;

export const ActionButton = styled(IconButton)<{ $active?: boolean }>`
  && {
    color: ${({ $active }) => ($active ? '#1565c0' : '#8b95a7')};
    padding: ${({ theme }) => theme.spacing(0.5)};
  }

  svg {
    font-size: 18px;
  }
`;

export const RepliesToggleButton = styled(IconButton)`
  && {
    color: #6b7280;
    padding: 4px 8px;
    border-radius: 16px;
    gap: 2px;
    flex-shrink: 0;
  }

  svg {
    font-size: 18px;
  }
`;

export const RepliesCount = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  line-height: 1;
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

export const VoteButton = styled(IconButton)<{ $active?: 'up' | 'down' | null }>`
  && {
    padding: ${({ theme }) => theme.spacing(0.5)};
    color: ${({ $active }) =>
      $active === 'up' ? '#2e7d32' : $active === 'down' ? '#d32f2f' : '#8b95a7'};
    background-color: ${({ $active }) =>
      $active === 'up'
        ? 'rgba(46, 125, 50, 0.1)'
        : $active === 'down'
          ? 'rgba(211, 47, 47, 0.1)'
          : 'transparent'};

    &:hover {
      background-color: ${({ $active }) =>
        $active === 'up'
          ? 'rgba(46, 125, 50, 0.16)'
          : $active === 'down'
            ? 'rgba(211, 47, 47, 0.16)'
            : 'rgba(15, 23, 42, 0.05)'};
    }
  }

  svg {
    font-size: 18px;
  }
`;

export const VoteCount = styled(Typography)<{ $score?: number }>`
  && {
    min-width: 18px;
    text-align: center;
    font-size: 14px;
    font-weight: ${({ $score = 0 }) => ($score !== 0 ? 600 : 400)};
    color: ${({ $score = 0 }) => ($score > 0 ? '#2e7d32' : $score < 0 ? '#d32f2f' : '#6b7280')};
  }
`;

export const CommentText = styled(Typography)`
  && {
    padding: ${({ theme }) => `${theme.spacing(2)} ${theme.spacing(2.5)}`};
    color: #4b5568;
    font-size: 15px;
    line-height: 1.65;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    word-break: break-word;

    code {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    @media (max-width: 600px) {
      padding: ${({ theme }) => `${theme.spacing(1.5)} ${theme.spacing(1.75)}`};
      font-size: 14px;
      line-height: 1.55;
    }
  }
`;

export const AttachmentsRow = styled(Box)`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => `0 ${theme.spacing(2.5)} ${theme.spacing(2)}`};

  @media (max-width: 600px) {
    padding: ${({ theme }) => `0 ${theme.spacing(1.75)} ${theme.spacing(1.5)}`};
  }
`;

export const AttachmentThumb = styled.img`
  width: 160px;
  max-width: 100%;
  height: auto;
  max-height: 160px;
  object-fit: cover;
  border-radius: 6px;
  display: block;

  @media (max-width: 600px) {
    width: 120px;
    max-height: 120px;
  }
`;
