import React, { useState } from 'react';

import {
  Box,
  Container,
  Paper,
  Typography,
  IconButton,
  useTheme,
  Grid,
} from '@mui/material';

import {
  LightMode,
  DarkMode,
  Construction,
  Groups,
  Speed,
  Verified,
} from '@mui/icons-material';

import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import { useTheme as useAppTheme } from '../theme/ThemeProvider';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const theme = useTheme();
  const { mode, toggleColorMode } = useAppTheme();

  const features = [
    {
      icon: <Construction />,
      title: 'Non-Technical Jobs',
      description: "Find or post jobs that don't require technical skills",
    },
    {
      icon: <Groups />,
      title: 'Competitive Bidding',
      description: 'Get the best rates through transparent bidding',
    },
    {
      icon: <Speed />,
      title: 'Quick Hiring',
      description: 'Instant hire options for urgent requirements',
    },
    {
      icon: <Verified />,
      title: 'Verified Profiles',
      description: 'Trust through verified IDs and work history',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background:
          mode === 'light'
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>
          {/* Main Content (Header removed) */}
          <Grid
            container
            columns={{ xs: 12, sm: 10, md: 10, lg: 10 }}
            spacing={{ xs: 2, md: 4 }}
            alignItems="center"
            sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' } }}
          >
            {/* Left Side - Features + Employera */}
            <Grid
              size={{ xs: 12, sm: 7, md: 7, lg: 7 }}
              sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0, alignSelf: 'flex-start' }}
            >
              <Box sx={{ color: 'white' }}>
                <Typography
                variant="h2"
                sx={{
                    fontFamily: "'Black Ops One', cursive", // <-- Apply the new font here
                    fontWeight: 400, // This font doesn't have a bold weight, so use 400
                    color: 'white',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                    fontSize: { xs: 32, sm: 40, md: 108 },
                    lineHeight: 1.1,
                    mb: 1,
                }}
                >
                EmployEra
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    fontFamily: "'Black Ops One', cursive", // <-- Apply the new font here
                    fontWeight: 400, // This font doesn't have a bold weight, so use 400
                    color: 'white',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                    fontSize: { xs: 32, sm: 40, md: 48 },
                    lineHeight: 1.1,
                    mb: 1,
                  }}
                >
                  Find Work or Hire Help
                </Typography>
                <Typography variant="h5" sx={{ mb: 4, opacity: 0.95, fontWeight: 300 }}>
                  The marketplace for non-technical jobs with transparent bidding
                </Typography>

                <Grid container spacing={2}>
                  {features.map((feature, index) => (
                    <Grid key={index} size={{ xs: 12, sm: 6 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 2,
                          p: 2,
                          borderRadius: 2,
                          bgcolor: 'rgba(255,255,255,0.1)',
                          backdropFilter: 'blur(10px)',
                          transition: 'all 0.3s',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.15)',
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            borderRadius: 1,
                            p: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {React.cloneElement(feature.icon, { sx: { fontSize: 24 } })}
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {feature.title}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            {feature.description}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>

            {/* Right Side - Auth Form + Theme Toggle */}
            <Grid size={{ xs: 12, sm: 4, md: 4, lg: 4 }} sx={{ minWidth: 0, display: 'flex' }}>
              <Paper
                elevation={24}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  width: '100%',
                  bgcolor: theme.palette.background.paper,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                }}
              >
                {/* Theme toggle moved here */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                  <IconButton
                    onClick={toggleColorMode}
                    aria-label="Toggle theme"
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      bgcolor: 'action.hover',
                      '&:hover': { bgcolor: 'action.selected' },
                    }}
                  >
                    {mode === 'light' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
                  </IconButton>
                </Box>

                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={600} gutterBottom>
                    {isLogin ? 'Welcome Back' : 'Get Started'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isLogin
                      ? 'Sign in to access your account'
                      : 'Create your account to start bidding or hiring'}
                  </Typography>
                </Box>

                {isLogin ? (
                  <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
                ) : (
                  <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default AuthPage;