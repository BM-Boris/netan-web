import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {
  ThemeProvider,
  createTheme,
} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const THEME_KEY = 'netan-theme';
const THEME_MODE_KEY = 'netan-theme-mode';

function systemTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function initialTheme() {
  if (typeof window === 'undefined') return 'light';
  const mode = window.localStorage.getItem(THEME_MODE_KEY);
  const stored = window.localStorage.getItem(THEME_KEY);
  if (mode === 'manual' && (stored === 'light' || stored === 'dark')) return stored;
  return systemTheme();
}

const lightTokens = {
  pageBg: '#fcf7f1',
  heroStart: '#9f4518',
  heroEnd: '#b5501d',
  selection: '#b5501d',
  textPrimary: '#2f211b',
  textSecondary: '#6a5851',
  border: '#e7d4c8',
  cardBg: '#ffffff',
  surfaceMuted: '#ffffff',
  searchBg: '#fefbf8',
  chipBg: '#f8ebe2',
  tableStripe: '#fdf8f3',
  cardBorder: 'rgba(109, 47, 18, 0.13)',
  focus: 'rgba(181, 80, 29, 0.18)',
  codeBg: '#fdf8f4',
  codeText: '#5f3827',
  plotBg: '#fff4eb',
  shadow: '0 16px 34px rgba(52, 27, 15, 0.075)',
  primary: '#b5501d',
  primaryHover: '#9b4419',
  secondary: '#1b5b8f',
  secondaryHover: '#184f80',
  error: '#c14953',
  success: '#4f8a5d',
  warning: '#d4892d',
  themeIconPrimary: '#b5501d',
  themeIconSecondary: '#f3dccf',
};

const darkTokens = {
  pageBg: '#0d0705',
  heroStart: '#281208',
  heroEnd: '#462213',
  selection: '#a74f2a',
  textPrimary: '#f7e7de',
  textSecondary: '#dbc6ba',
  border: '#5e3b2c',
  cardBg: '#160c09',
  surfaceMuted: '#26160f',
  searchBg: '#24150f',
  chipBg: '#2b1912',
  tableStripe: '#1f120d',
  cardBorder: 'rgba(159, 77, 39, 0.24)',
  focus: 'rgba(217, 120, 72, 0.18)',
  codeBg: '#281710',
  codeText: '#f2e1d6',
  plotBg: '#21130d',
  shadow: '0 18px 42px rgba(0, 0, 0, 0.48)',
  primary: '#4a2010',
  primaryHover: '#632c19',
  secondary: '#1f4f80',
  secondaryHover: '#1a446d',
  error: '#d97848',
  success: '#6fa36f',
  warning: '#d4aa50',
  themeIconPrimary: '#d97848',
  themeIconSecondary: '#f4ddd0',
};

const getDesignTokens = (mode) => {
  const tokens = mode === 'light' ? lightTokens : darkTokens;

  return {
    palette: {
      mode,
      primary: { main: tokens.primary, dark: tokens.primaryHover, contrastText: '#fff8f2' },
      secondary: { main: tokens.secondary, dark: tokens.secondaryHover, contrastText: '#f6fbff' },
      success: { main: tokens.success, contrastText: '#ffffff' },
      error: { main: tokens.error, contrastText: '#ffffff' },
      warning: { main: tokens.warning, contrastText: mode === 'light' ? '#2f211b' : '#0d0705' },
      background: {
        default: tokens.pageBg,
        paper: tokens.cardBg,
      },
      text: {
        primary: tokens.textPrimary,
        secondary: tokens.textSecondary,
      },
      divider: tokens.border,
      appBar: `linear-gradient(180deg, ${tokens.heroStart}, ${tokens.heroEnd})`,
      card: {
        main: tokens.cardBg,
        plot: tokens.plotBg,
        muted: tokens.surfaceMuted,
      },
      custom: tokens,
    },
    shape: {
      borderRadius: 8,
    },
    shadows: [
      'none',
      tokens.shadow,
      tokens.shadow,
      tokens.shadow,
      tokens.shadow,
      tokens.shadow,
      tokens.shadow,
      tokens.shadow,
      tokens.shadow,
      tokens.shadow,
      tokens.shadow,
      tokens.shadow,
      tokens.shadow,
      tokens.shadow,
      tokens.shadow,
      tokens.shadow,
      tokens.shadow,
      tokens.shadow,
      tokens.shadow,
      tokens.shadow,
      tokens.shadow,
      tokens.shadow,
      tokens.shadow,
      tokens.shadow,
      tokens.shadow,
    ],
    typography: {
      fontFamily: '"Manrope", "Space Grotesk", "Inter", "Helvetica", sans-serif',
      h1: { fontSize: 'clamp(3.1rem, 11vw, 9rem)', lineHeight: 0.95, fontWeight: 600 },
      h4: { fontWeight: 800 },
      h5: { fontSize: '1.5rem', fontWeight: 700 },
      h6: { fontSize: '1.08rem', fontWeight: 800 },
      subtitle1: { fontWeight: 700 },
      body1: { fontSize: '1rem', lineHeight: 1.5 },
      body2: { fontSize: '0.9rem', lineHeight: 1.45 },
      button: { fontWeight: 700 },
    },

    components: {
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            background: theme.palette.appBar,
            color: '#ffffff',
            boxShadow: 'none',
            borderBottom: `1px solid ${theme.palette.custom.cardBorder}`,
          }),
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.card.main,
            borderRadius: 16,
            border: `1px solid ${theme.palette.custom.cardBorder}`,
            boxShadow: theme.palette.custom.shadow,
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: 'none',
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.custom.cardBorder,
          }),
          outlined: ({ theme }) => ({
            borderColor: theme.palette.custom.cardBorder,
          }),
        },
      },
      MuiButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            textTransform: 'none',
            fontWeight: 800,
            borderRadius: 10,
            minHeight: 40,
            padding: '0.46rem 0.95rem',
            lineHeight: 1.25,
          }),
          contained: ({ theme }) => ({
            boxShadow: `0 10px 24px ${
              theme.palette.mode === 'light'
                ? 'rgba(109, 47, 18, 0.18)'
                : 'rgba(0, 0, 0, 0.34)'
            }`,
            '&:hover': {
              boxShadow: `0 12px 28px ${
                theme.palette.mode === 'light'
                  ? 'rgba(109, 47, 18, 0.22)'
                  : 'rgba(0, 0, 0, 0.42)'
              }`,
            },
          }),
          outlined: ({ theme }) => ({
            borderColor: theme.palette.custom.cardBorder,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.mode === 'light' ? '#6a3014' : '#f5e1d6',
            '&:hover': {
              borderColor: theme.palette.primary.main,
              backgroundColor: theme.palette.custom.chipBg,
            },
          }),
          text: ({ theme }) => ({
            color: theme.palette.mode === 'light' ? '#6a3014' : '#f5e1d6',
            '&:hover': {
              backgroundColor: theme.palette.custom.chipBg,
            },
          }),
        },
      },
      MuiChip: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 12,
            fontWeight: 700,
            backgroundColor: theme.palette.custom.chipBg,
          }),
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 14,
            backgroundColor: theme.palette.custom.searchBg,
            transition: 'border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.divider,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
            },
            '&.Mui-focused': {
              backgroundColor: theme.palette.background.paper,
              boxShadow: `0 0 0 4px ${theme.palette.custom.focus}`,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
            },
          }),
          notchedOutline: {
            borderRadius: 14,
          },
          input: {
            paddingTop: 12,
            paddingBottom: 12,
          },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'medium' },
      },
      MuiFormControl: {
        defaultProps: { size: 'medium' },
      },
      MuiSelect: {
        defaultProps: { size: 'medium' },
      },
      MuiSwitch: {
        styleOverrides: {
          root: ({ theme }) => ({
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: theme.palette.primary.main,
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: theme.palette.primary.main,
            },
          }),
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 10,
            fontWeight: 800,
            borderColor: theme.palette.custom.cardBorder,
            '&.Mui-selected': {
              color: theme.palette.primary.contrastText,
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            },
          }),
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: ({ theme }) => ({
            borderRadius: 16,
            border: `1px solid ${theme.palette.custom.cardBorder}`,
            boxShadow: theme.palette.custom.shadow,
          }),
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: ({ theme }) => ({
            fontWeight: 800,
            color: theme.palette.text.primary,
          }),
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: ({ theme }) => ({
            backgroundColor: theme.palette.custom.chipBg,
            color: theme.palette.text.primary,
            fontWeight: 800,
          }),
          body: ({ theme }) => ({
            color: theme.palette.text.secondary,
            borderBottomColor: theme.palette.divider,
          }),
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: ({ theme }) => ({
            height: 8,
            borderRadius: 999,
            backgroundColor: theme.palette.custom.chipBg,
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
  const [mode, setMode] = React.useState(initialTheme);
  const [isUserTheme, setIsUserTheme] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(THEME_MODE_KEY) === 'manual';
  });

  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setIsUserTheme(true);
        setMode((current) => {
          const next = current === 'dark' ? 'light' : 'dark';
          window.localStorage.setItem(THEME_KEY, next);
          window.localStorage.setItem(THEME_MODE_KEY, 'manual');
          return next;
        });
      },
    }),
    []
  );

  const theme = React.useMemo(
    () => createTheme(getDesignTokens(mode)),
    [mode]
  );

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (isUserTheme) return undefined;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event) => setMode(event.matches ? 'dark' : 'light');

    if (media.addEventListener) {
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, [isUserTheme]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ThemeWrapper />);
