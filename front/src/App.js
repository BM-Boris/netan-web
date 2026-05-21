import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  Typography,
  Container,
  Box,
  Button,
  IconButton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import GitHubIcon from '@mui/icons-material/GitHub';

import NetworkBuilder from './NetworkBuilder';
import Guide from './Guide';
import { ColorModeContext } from './index';

function MoonIcon({ theme }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path
        opacity="0.5"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22 12.0004C22 17.5232 17.5228 22.0004 12 22.0004C10.8358 22.0004 9.71801 21.8014 8.67887 21.4357C8.24138 20.3772 8 19.217 8 18.0004C8 15.7792 8.80467 13.7459 10.1384 12.1762C11.31 13.8818 13.2744 15.0004 15.5 15.0004C17.8615 15.0004 19.9289 13.741 21.0672 11.8572C21.3065 11.4612 22 11.5377 22 12.0004Z"
        fill="#3b160b"
      />
      <path
        d="M2 12C2 16.3586 4.78852 20.0659 8.67887 21.4353C8.24138 20.3768 8 19.2166 8 18C8 15.7788 8.80467 13.7455 10.1384 12.1758C9.42027 11.1303 9 9.86422 9 8.5C9 6.13845 10.2594 4.07105 12.1432 2.93276C12.5392 2.69347 12.4627 2 12 2C6.47715 2 2 6.47715 2 12Z"
        fill="#000000"
      />
    </svg>
  );
}

function SunIcon({ theme }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path
        d="M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12Z"
        fill={theme.palette.custom.themeIconPrimary}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 1.25C12.4142 1.25 12.75 1.58579 12.75 2V4C12.75 4.41421 12.4142 4.75 12 4.75C11.5858 4.75 11.25 4.41421 11.25 4V2C11.25 1.58579 11.5858 1.25 12 1.25ZM1.25 12C1.25 11.5858 1.58579 11.25 2 11.25H4C4.41421 11.25 4.75 11.5858 4.75 12C4.75 12.4142 4.41421 12.75 4 12.75H2C1.58579 12.75 1.25 12.4142 1.25 12ZM19.25 12C19.25 11.5858 19.5858 11.25 20 11.25H22C22.4142 11.25 22.75 11.5858 22.75 12C22.75 12.4142 22.4142 12.75 22 12.75H20C19.5858 12.75 19.25 12.4142 19.25 12ZM12.4142 19.25C12.4142 19.25 12.75 19.5858 12.75 20V22C12.75 22.4142 12.4142 22.75 12 22.75C11.5858 22.75 11.25 22.4142 11.25 22V20C11.25 19.5858 11.5858 19.25 12 19.25Z"
        fill={theme.palette.custom.themeIconPrimary}
      />
      <g opacity="0.5">
        <path d="M5.63604 5.63604C5.92893 5.34315 6.40381 5.34315 6.6967 5.63604L8.11091 7.05025C8.40381 7.34315 8.40381 7.81802 8.11091 8.11091C7.81802 8.40381 7.34315 8.40381 7.05025 8.11091L5.63604 6.6967C5.34315 6.40381 5.34315 5.92893 5.63604 5.63604Z" fill={theme.palette.custom.themeIconSecondary} />
        <path d="M15.8891 15.8891C16.182 15.5962 16.6569 15.5962 16.9497 15.8891L18.364 17.3033C18.6569 17.5962 18.6569 18.0711 18.364 18.364C18.0711 18.6569 17.5962 18.6569 17.3033 18.364L15.8891 16.9497C15.5962 16.6569 15.5962 16.182 15.8891 15.8891Z" fill={theme.palette.custom.themeIconSecondary} />
        <path d="M18.364 5.63604C18.6569 5.92893 18.6569 6.40381 18.364 6.6967L16.9497 8.11091C16.6569 8.40381 16.182 8.40381 15.8891 8.11091C15.5962 7.81802 15.5962 7.34315 15.8891 7.05025L17.3033 5.63604C17.5962 5.34315 18.0711 5.34315 18.364 5.63604Z" fill={theme.palette.custom.themeIconSecondary} />
        <path d="M8.11091 15.8891C8.40381 16.182 8.40381 16.6569 8.11091 16.9497L6.6967 18.364C6.40381 18.6569 5.92893 18.6569 5.63604 18.364C5.34315 18.0711 5.34315 17.5962 5.63604 17.3033L7.05025 15.8891C7.34315 15.5962 7.81802 15.5962 8.11091 15.8891Z" fill={theme.palette.custom.themeIconSecondary} />
      </g>
    </svg>
  );
}

/*────────────  главная раскладка  ────────────*/
function MainLayout() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const theme      = useTheme();
  const colorMode  = React.useContext(ColorModeContext);
  const isGuide = location.pathname.replace(/\/$/, '') === '/guide';
  const toggleGuide = () => navigate(isGuide ? '/' : '/guide');

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box
        component="header"
        sx={{
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          pt: { xs: '1.7rem', sm: '2.4rem' },
          pb: { xs: 1, sm: 1.5 },
          px: 0,
          //borderBottom: `1px solid ${theme.palette.custom.cardBorder}`,
        }}
      >
        <Box
          sx={{
            width: {
              xs: 'calc(100% - 32px)',
              md: 'min(900px, calc(100% - 48px))',
            },
            mx: 'auto',
            position: 'relative',
            textAlign: 'center',
          }}
        >
          <IconButton
            color="inherit"
            onClick={colorMode.toggleColorMode}
            aria-label={theme.palette.mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            sx={{
              position: 'absolute',
              top: { xs: 0, sm: 4 },
              left: { xs: 0, sm: '1.3rem' },
              width: 'auto',
              height: 'auto',
              p: '0.08rem',
              borderRadius: 0,
              backgroundColor: 'transparent',
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.18))',
              '&:hover': {
                backgroundColor: 'transparent',
                opacity: 0.9,
              },
              '& svg': {
                display: 'block',
                width: { xs: '1.96rem', sm: '2.72rem' },
                height: { xs: '1.96rem', sm: '2.72rem' },
              },
            }}
          >
            {theme.palette.mode === 'dark' ? (
              <SunIcon theme={theme} />
            ) : (
              <MoonIcon theme={theme} />
            )}
          </IconButton>

          <Typography
            variant="h1"
            sx={{
              m: 0,
              mt: '0.3rem',
              color: theme.palette.mode === 'light' ? '#561c03' : '#f3e9e3',
              fontSize: {
                xs: 'clamp(5rem, 20vw, 5rem)',
                sm: 'clamp(5rem, 15vw, 8.5rem)',
              },
            }}
          >
            Netan
          </Typography>
          <Typography
            component="p"
            sx={{
              m: 0,
              mt: 1,
              mx: 'auto',
              color: theme.palette.mode === 'light' ? '#561c03' : '#f5e1d6',
              fontSize: 'clamp(1rem, 2.2vw, 1.5rem)',
              fontWeight: 600,
              lineHeight: 1.25,
              maxWidth: 620,
            }}
          >
            «Threads Converge, Shapes Emerge
            <br />
            Creating a Harmony of Connections»
          </Typography>

          <Box sx={{ mt: { xs: 1, sm: 1 }, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="text"
              size="medium"
              onClick={toggleGuide}
              aria-label={isGuide ? 'Main' : 'Guide'}
              sx={{
                px: 2,
                py: 0.6,
                width: 82,
                minWidth: 82,
                border: '1px solid transparent',
                color: theme.palette.mode === 'light' ? 'rgb(89, 38, 12)' : '#f5e1d6',
                fontSize: '0.95rem',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: 'transparent',
                },
              }}
            >
              {isGuide ? 'Main' : 'Guide'}
            </Button>
          </Box>

          <Box
            sx={{
              position: 'absolute',
              top: { xs: -5, sm: 9 },
              right: { xs: 0, sm: '1.3rem' },
            }}
          >
            <a
              href="https://github.com/bm-boris/netan"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <GitHubIcon
                sx={{ fontSize: { xs: 31, sm: 45 }, color: theme.palette.text.primary }}
              />
            </a>
          </Box>
        </Box>
      </Box>

      <Container
        component="main"
        maxWidth={false}
        sx={{
          flex: 1,
          px: { xs: 2, md: 3 },
          py: { xs: 1.5, md: 2 },
        }}
      >
        <Routes>
          <Route path="/" element={<NetworkBuilder />} />
          <Route path="/guide" element={<Guide />} />
        </Routes>
      </Container>

      <Box
        component="footer"
        sx={{
          py: 2.5,
          backgroundColor: theme.palette.background.default,
          textAlign: 'center',
        }}
      >
        <Button
          color="inherit"
          onClick={toggleGuide}
          sx={{ textTransform: 'none' }}
        >
          {isGuide
            ? 'Main'
            : 'Guide | Privacy Policy | Contacts'}
        </Button>
      </Box>
    </Box>
  );
}

/*────────────  Router wrapper  ────────────*/
function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}

export default App;
