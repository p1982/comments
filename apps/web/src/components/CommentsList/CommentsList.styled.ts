import Stack from '@mui/material/Stack';
import styled from 'styled-components';

export const CommentsStack = styled(Stack)<{ $depth: number }>`
  gap: ${({ theme }) => theme.spacing(2)};
  padding-left: ${({ theme, $depth }) => theme.spacing($depth * 2)};
`;

export const SortBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const SortButton = styled.button<{ $active: boolean }>`
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: ${({ theme }) => `${theme.spacing(0.5)} ${theme.spacing(1)}`};
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  color: ${({ $active }) => ($active ? '#1f2937' : '#6b7280')};
`;
