import Stack from '@mui/material/Stack';
import styled from 'styled-components';

export const CommentsStack = styled(Stack)<{ $depth: number }>`
  gap: ${({ theme, $depth }) => theme.spacing($depth === 0 ? 2 : 1.5)};
  padding: ${({ $depth }) => {
    if ($depth === 0) return '0';
    return $depth <= 4 ? '0 16px 16px 20px' : '0 8px 12px 8px';
  }};

  @media (max-width: 600px) {
    gap: ${({ theme, $depth }) => theme.spacing($depth === 0 ? 1.5 : 1)};
    padding: ${({ $depth }) => {
      if ($depth === 0) return '0';
      return $depth <= 3 ? '0 10px 10px 12px' : '0 6px 8px 6px';
    }};
  }
`;

export const SortBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};

  & > button:last-child {
    margin-left: auto;
  }

  @media (max-width: 480px) {
    & > button:last-child {
      margin-left: 0;
      width: 100%;
    }
  }
`;

export const SortButton = styled.button<{ $active: boolean }>`
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: ${({ theme }) => `${theme.spacing(0.5)} ${theme.spacing(1)}`};
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  color: ${({ $active }) => ($active ? '#1f2937' : '#6b7280')};
  white-space: nowrap;
`;
