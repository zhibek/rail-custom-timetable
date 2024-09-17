import * as React from 'react';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';

export default function LayoutFrame({ children }: { children: React.ReactNode }) {
  const appTheme = createTheme();

  return (
    <ThemeProvider theme={appTheme}>
      <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: '1 1', overflow: 'auto' }}>
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
