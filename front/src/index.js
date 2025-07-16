import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {
  ThemeProvider,
  createTheme,
  responsiveFontSizes,
} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const brandColors = (mode) =>
  mode === 'light'
    ? {
        primary:   { main: '#b88983', contrastText: '#fff' }, // песок
        secondary: { main: '#597D94', contrastText: '#fff' }, // океан
        success:   { main: '#4fa46d', contrastText: '#fff' },
        error:     { main: '#c14953', contrastText: '#fff' },
        warning:   { main: '#ff9800', contrastText: '#000' },
        info:      { main: '#4d9abf', contrastText: '#fff' },
      }
    : {
        primary:   { main: '#85574E', contrastText: '#fff' }, // ночной песок (кнопки)
        secondary: { main: '#17494B', contrastText: '#fff' }, // ночная вода (кнопки)
        success:   { main: '#3d7b5f', contrastText: '#fff' },
        error:     { main: '#9f464e', contrastText: '#fff' },
        warning:   { main: '#d89d3a', contrastText: '#000' },
        info:      { main: '#386c92', contrastText: '#fff' },
      };

/*─────────────────────────────────────────────
  2. Генератор токенов
─────────────────────────────────────────────*/
const getDesignTokens = (mode) => {
  const surfaces =
    mode === 'light'
      ? {
          appBar: '#B8A383',
          card:   { main: '#f3efeb', plot: '#D7DFE3' },
          background: { default: '#f5f5f5', paper: '#ffffff' },
        }
      : {
          appBar: '#32211D',                // песок во тьме (шапка/футер)
          card:   {
            main: '#2C2C2C',                // плотный ночной песок
            plot: '#0d2533',                // тёмная вода (графики)
          },
          background: {
            default: '#161819',             // звёздно‑серое небо
            paper:   '#1c1f20',
          },
        };

  return {
    palette: {
      mode,
      ...brandColors(mode),  // кнопки / акценты
      ...surfaces,           // шапка / карточки / фон
    },

    typography: { fontFamily: '"Secular One", sans-serif' },

    components: {
      /* AppBar / Card */
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({ backgroundColor: theme.palette.appBar }),
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.card.main,
            borderRadius: 8,
            boxShadow: theme.shadows[2],
          }),
        },
      },

      /* Кнопки — плотнее шрифт и явный border в dark‑режиме для outlined */
      MuiButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            textTransform: 'none',
            fontWeight: 500,
            ...(theme.palette.mode === 'dark' && {
              '&.MuiButton-outlined': {
                borderColor: 'rgba(255,255,255,0.3)',
              },
            }),
            [theme.breakpoints.down('sm')]: {
              minWidth: 150,
              padding: '4px 10px',
              fontSize: '0.9rem',
            },
          }),
        },
      },

      /* Текстовые поля */
      MuiTextField: {
        styleOverrides: {
          root: ({ theme }) => ({
            [theme.breakpoints.down('sm')]: {
              minWidth: 120,
              maxWidth: 160,
              '& .MuiInputBase-input': {
                fontSize: '0.9rem',
                padding: '6px 8px',
                textAlign: 'left',
              },
              '& .MuiInputLabel-root': { fontSize: '0.9rem' },
            },
          }),
        },
      },

      MuiIconButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            [theme.breakpoints.down('sm')]: {
              padding: 4,
              fontSize: '1rem',
            },
          }),
        },
      },

      MuiTypography: {
        styleOverrides: {
          root: ({ theme }) => ({
            [theme.breakpoints.down('sm')]: { fontSize: '0.9em' },
          }),
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            [theme.breakpoints.down('md')]: {
              paddingRight: 0,
              '& input': { textAlign: 'left' },
            },
          }),
        },
      },
    },
  };
};

/*─────────────────────────────────────────────
  3. Контекст «сменить тему»
─────────────────────────────────────────────*/
export const ColorModeContext = React.createContext({
  toggleColorMode: () => {},
});

function ThemeWrapper() {
  const [mode, setMode] = React.useState('light');

  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () =>
        setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
    }),
    []
  );

  const theme = React.useMemo(
    () => responsiveFontSizes(createTheme(getDesignTokens(mode))),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

/*─────────────────────────────────────────────
  4. Bootstrap
─────────────────────────────────────────────*/
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ThemeWrapper />);
