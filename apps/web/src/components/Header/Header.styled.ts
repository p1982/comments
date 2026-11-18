import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import styled from 'styled-components';

export const HeaderBar = styled(Box).attrs({
  component: 'header',
})`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing(1)};
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing(1.5)} ${theme.spacing(2)}`};
`;

export const SignInButton = styled(Button).attrs({
  variant: 'contained',
  color: 'primary',
})``;
