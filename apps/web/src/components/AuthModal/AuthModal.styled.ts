import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import styled from 'styled-components';

export const AuthDialog = styled(Dialog)`
  .MuiDialog-paper {
    width: 100%;
    max-width: 420px;
    margin: ${({ theme }) => theme.spacing(2)};
  }
`;

export const AuthDialogTitle = styled(DialogTitle)`
  && {
    padding-bottom: ${({ theme }) => theme.spacing(1)};
  }
`;

export const AuthDialogContent = styled(DialogContent)`
  && {
    padding-top: ${({ theme }) => theme.spacing(1)};
  }
`;

export const AuthForm = styled(Box).attrs({
  component: 'form',
  noValidate: true,
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  padding-top: ${({ theme }) => theme.spacing(1)};
`;

export const AuthFields = styled(Stack).attrs({
  spacing: 2,
})``;

export const AuthDialogActions = styled(DialogActions)`
  && {
    justify-content: space-between;
    padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(3)} ${theme.spacing(2)}`};
  }
`;

export const AuthSwitchRow = styled(Box)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;
