import * as React from 'react';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';

export default function LayoutFrame({ children }: { children: React.ReactNode }) {
  const appTheme = createTheme();

  return (
    <ThemeProvider theme={appTheme}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar variant="dense">
            <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" color="inherit" component="div">
              Rail
            </Typography>
          </Toolbar>
        </AppBar>
      </Box>
      <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </Box>
    </ThemeProvider>
  );
}
