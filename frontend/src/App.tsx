import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { ClinicalScribe } from './components/ClinicalScribe';
import { MonitorHeart, HealthAndSafety } from '@mui/icons-material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0891b2',    // Cyan-600 — clean medical teal
      light: '#67e8f9',
      dark: '#0e7490',
    },
    secondary: {
      main: '#059669',    // Emerald-600 — health green
      light: '#6ee7b7',
      dark: '#047857',
    },
    success: {
      main: '#16a34a',
      light: '#bbf7d0',
    },
    error: {
      main: '#dc2626',
      light: '#fecaca',
    },
    warning: {
      main: '#d97706',
      light: '#fde68a',
    },
    background: {
      default: '#f0fdfa',   // Lightest teal tint
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',   // Deep slate
      secondary: '#475569',
    },
    divider: '#ccfbf1',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 800,
      letterSpacing: '-0.5px',
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
    body1: {
      lineHeight: 1.7,
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px -2px rgba(8,145,178,0.12), 0 1px 4px -1px rgba(8,145,178,0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          padding: '12px 24px',
          letterSpacing: '0.02em',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 16px -4px rgba(8,145,178,0.15), 0 2px 6px -2px rgba(8,145,178,0.08)',
          border: '1px solid #e0f2fe',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(160deg, #ecfeff 0%, #f0fdf4 50%, #f0fdfa 100%)',
          py: 5,
        }}
      >
        <Container maxWidth="lg">
          {/* Top nav bar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 5,
              px: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0891b2 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(8,145,178,0.3)',
                }}
              >
                <HealthAndSafety sx={{ color: 'white', fontSize: 26 }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: 'primary.dark',
                    lineHeight: 1.1,
                  }}
                >
                  ClinicalScribe AI
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Medical Documentation Platform
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <MonitorHeart sx={{ color: 'secondary.main', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                AI-Powered · SOAP Notes · Entity Extraction
              </Typography>
            </Box>
          </Box>

          {/* Main card */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(8,145,178,0.12)',
              borderRadius: 3,
            }}
          >
            <ClinicalScribe />
          </Paper>

          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Built for clinical research · Whisper STT · spaCy NLP · Groq LLM
            </Typography>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
