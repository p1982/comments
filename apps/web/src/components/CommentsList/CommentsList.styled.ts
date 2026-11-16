import Stack from '@mui/material/Stack';
import styled from 'styled-components';

export const CommentsStack = styled(Stack)<{ $depth: number }>`
  gap: ${({ theme }) => theme.spacing(2)};
  padding-left: ${({ theme, $depth }) => theme.spacing($depth * 2)};
`;
