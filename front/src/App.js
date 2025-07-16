import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  IconButton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import GitHubIcon from '@mui/icons-material/GitHub';

import NetworkBuilder from './NetworkBuilder';
import Guide from './Guide';
import { ColorModeContext } from './index';

/*────────────  главная раскладка  ────────────*/
function MainLayout() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const theme      = useTheme();
  const colorMode  = React.useContext(ColorModeContext);

  return (
    <>
      {/* Header */}
      <AppBar position="static">
        <Toolbar
          sx={{
            position: 'relative',
            justifyContent: 'center',
            alignItems: 'center',
            mt: 5,
            mb: 3,
            px: 3,
          }}
        >
          {/* переключатель темы */}
          <IconButton
            color="inherit"
            onClick={colorMode.toggleColorMode}
            sx={{
              position: 'absolute',
              top: { xs: -6, md: -10 },
              left: { xs: 20, md: 46 },
            }}
          >
            {theme.palette.mode === 'dark' ? (
              <LightModeIcon sx={{ fontSize: { xs: 28, sm: 40, md: 55 } }} />
            ) : (
              <DarkModeIcon sx={{ fontSize: { xs: 28, sm: 40, md: 55 } }} />
            )}
          </IconButton>

          {/* заголовок */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: { xs: 72, sm: 96, md: 126 },
                color: '#fff',
                lineHeight: 1,
              }}
            >
              NeTan
            </Typography>
            <Typography
              sx={{
                fontWeight: 'bold',
                fontSize: { xs: 16, md: 20 },
                color: '#fff',
                mt: 3,
              }}
            >
              Threads Converge, Shapes Emerge – Creating a Harmony of Connections
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() =>
                  location.pathname === '/guide'
                    ? navigate(-1)
                    : navigate('/guide')
                }
                sx={{ textTransform: 'none' }}
              >
                {location.pathname === '/guide' ? 'Back' : 'GUIDE v1.77'}
              </Button>
            </Box>
          </Box>

          {/* GitHub */}
          <Box
            sx={{
              position: 'absolute',
              top: { xs: -6, md: -10 },
              right: { xs: 20, md: 46 },
            }}
          >
            <a
              href="https://github.com/bm-boris"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <GitHubIcon
                sx={{ fontSize: { xs: 28, sm: 40, md: 55 }, color: '#fff' }}
              />
            </a>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Container sx={{ mt: 1, mb: 5 }}>
        <Routes>
          <Route path="/" element={<NetworkBuilder />} />
          <Route path="/guide" element={<Guide />} />
        </Routes>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 2,
          bgcolor: theme.palette.appBar,
          textAlign: 'center',
        }}
      >
        <Button
          color="inherit"
          onClick={() =>
            location.pathname === '/guide' ? navigate(-1) : navigate('/guide')
          }
          sx={{ textTransform: 'none' }}
        >
          {location.pathname === '/guide'
            ? 'HOME'
            : 'Guide | Privacy Policy | Contacts'}
        </Button>
      </Box>
    </>
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
