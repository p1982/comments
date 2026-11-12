'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { ToastContainer } from 'react-toastify';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';

import { theme } from '../../lib/theme';
import { StyledComponentsRegistry } from './StyledComponentsRegistry';

import 'react-toastify/dist/ReactToastify.css';

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <StyledComponentsRegistry>
      <AppRouterCacheProvider>
        <MuiThemeProvider theme={theme}>
          <StyledThemeProvider theme={theme}>
            <CssBaseline />
            {children}
            <ToastContainer position="top-right" autoClose={3000} />
          </StyledThemeProvider>
        </MuiThemeProvider>
      </AppRouterCacheProvider>
    </StyledComponentsRegistry>
  );
};
