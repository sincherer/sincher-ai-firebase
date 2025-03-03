import React from 'react';
import { Box, CssBaseline, createTheme, ThemeProvider } from '@mui/material';
import Chat from './components/Chat';

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f5f5f7'
    }
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        background: 'linear-gradient(135deg, #f5f5f7 0%, #e8e8e8 100%)'
      }}>
        <Chat />
      </Box>
    </ThemeProvider>
  );
}

export default App;