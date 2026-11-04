'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { theme } from '../../lib/theme';
import { StyledComponentsRegistry } from './StyledComponentsRegistry';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <StyledComponentsRegistry>
      <AppRouterCacheProvider>
        <MuiThemeProvider theme={theme}>
          <StyledThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </StyledThemeProvider>
        </MuiThemeProvider>
      </AppRouterCacheProvider>
    </StyledComponentsRegistry>
  );
}
