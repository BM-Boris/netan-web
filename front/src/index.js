// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {
  createTheme,
  responsiveFontSizes,
  ThemeProvider,
} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

/* ─────────────────────────────────────────────
   1. Базовая палитра + шрифт
───────────────────────────────────────────── */
let theme = createTheme({
  palette: {
    primary:   { main: '#b88983' },
    secondary: { main: '#597D94' },
    success:   { main: '#83b889' },
    error:     { main: '#732d2d' },
    warning:   { main: '#ff9800' },
    info:      { main: '#83b2b8' },
  },
  typography: {
    fontFamily: '"Secular One", sans-serif',
  },
});

/* ─────────────────────────────────────────────
   2. Авто-масштаб заголовков (H1-H6)
───────────────────────────────────────────── */
theme = responsiveFontSizes(theme);

/* ─────────────────────────────────────────────
   3. Глобальные уменьшающие правила для xs (<600 px)
───────────────────────────────────────────── */
theme.components = {
  /* Кнопки */
  MuiButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        textTransform: 'none',
        [theme.breakpoints.down('sm')]: {
          minWidth: '150px',
          padding: '4px 10px',
          fontSize: '0.9rem',
        },
      }),
    },
  },


  /* Поля ввода */
  MuiTextField: {
  styleOverrides: {
    root: ({ theme }) => ({
      [theme.breakpoints.down('sm')]: {
        minWidth: 120,     // компактно, но не «во всю строку»
        maxWidth: 160,
        '& .MuiInputBase-input': {
          fontSize: '0.9rem',
          padding: '6px 8px',   // чуть ниже высота
          textAlign: 'left',     // ← вернули левое выравнивание
        },
        '& .MuiInputLabel-root': {
          fontSize: '0.9rem',
        },
      },
    }),
  },
},

  /* Икон-кнопки */
  MuiIconButton: {
    styleOverrides: {
      root: {
        [theme.breakpoints.down('sm')]: {
          padding: 4,
          fontSize: '1rem',
        },
      },
    },
  },

  /* Весь текст */
  MuiTypography: {
    styleOverrides: {
      root: {
        [theme.breakpoints.down('sm')]: {
          fontSize: '0.9em',   // –10 % к базовому
        },
      },
    },
  },

  
  MuiOutlinedInput: {
  styleOverrides: {
    root: ({ theme }) => ({
      [theme.breakpoints.down('md')]: {
        paddingRight: 0,
        '& input': {
          textAlign: 'left',    // ← тоже слева
        },
      },
    }),
  },
},


  
};

/* ─────────────────────────────────────────────
   4. Рендер приложения
───────────────────────────────────────────── */
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);
