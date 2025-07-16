// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';

import NetworkBuilder from './NetworkBuilder';
import Guide from './Guide';

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {/* Header */}
      <AppBar position="static" sx={{ backgroundColor: '#B8A383' }}>
        <Toolbar
          sx={{
            position: 'relative',
            justifyContent: 'center',
            alignItems: 'center',
            mt: 5,
            mb: 3,
            px: 3
          }}
        >
          {/* Title block */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              component="div"
              sx={{
                fontWeight: 500,
                fontSize: { xs: 72, sm: 96, md: 126 },   // адаптивный заголовок
                color: '#fff',
                lineHeight: 1
              }}
            >
              NeTan
            </Typography>
            <Typography
              component="div"
              sx={{
                fontWeight: 'bold',
                fontSize: { xs: 16, md: 20 },
                color: '#fff',
                mt: 3
              }}
            >
              Threads Converge, Shapes Emerge – Creating a Harmony of Connections
            </Typography>

            {/* Guide / Back button */}
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

          {/* GitHub link */}
          <Box
            sx={{
              position: 'absolute',
              top: { xs: -6, md: -10 },
              right: { xs: 20, md: 46 }
            }}
          >
            <a
              href="https://github.com/bm-boris"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <GitHubIcon
                sx={{
                  fontSize: { xs: 28, sm: 40, md: 55 },  // xs-экраны заметно меньше
                  color: '#fff'
                }}
              />
            </a>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main content */}
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
          bgcolor: '#B8A383',
          textAlign: 'center'
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

function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}

export default App;
