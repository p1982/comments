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
    margin: 16px;
  }
`;

export const AuthDialogTitle = styled(DialogTitle)`
  && {
    padding-bottom: 8px;
  }
`;

export const AuthDialogContent = styled(DialogContent)`
  && {
    padding-top: 8px;
  }
`;

export const AuthForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
`;

export const AuthFields = styled(Stack).attrs({
  spacing: 2,
})``;

export const AuthDialogActions = styled(DialogActions)`
  && {
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 24px 16px;

    @media (max-width: 600px) {
      padding: 8px 16px 16px;
    }
  }
`;

export const AuthSwitchRow = styled(Box)`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
`;
