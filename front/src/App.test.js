import { render, screen } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import App from './App';

jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
}));

jest.mock('react-plotly.js', () => () => null);

jest.mock('./index', () => {
  const React = require('react');
  return {
    ColorModeContext: React.createContext({ toggleColorMode: jest.fn() }),
  };
});

test('renders Netan app', () => {
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: { main: '#b5501d', dark: '#9b4419' },
      secondary: { main: '#1b5b8f', dark: '#184f80' },
      background: { default: '#fcf7f1', paper: '#ffffff' },
      card: { main: '#ffffff', plot: '#fff4eb', muted: '#ffffff' },
      custom: {
        themeIconPrimary: '#b5501d',
        themeIconSecondary: '#f3dccf',
        cardBorder: 'rgba(109, 47, 18, 0.13)',
      },
    },
  });

  render(
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  );
  expect(screen.getByRole('heading', { name: /netan/i })).toBeInTheDocument();
});
