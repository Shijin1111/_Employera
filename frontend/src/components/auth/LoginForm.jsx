import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  IconButton,
  InputAdornment,
  Alert,
  Divider,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Google,
  Facebook,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm = ({ onSwitchToRegister }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setError('');
      setIsLoading(true);
      
      const result = await login(data.email, data.password);
      
      if (result.success) {
        // Navigate based on account type
        if (result.user.account_type === 'employer') {
          navigate('/employer/dashboard');
        } else {
          navigate('/jobseeker/dashboard');
        }
      } else {
        setError(result.error || 'Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Email Address"
        type="email"
        margin="normal"
        autoComplete="email"
        autoFocus
        disabled={isLoading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Email color="action" />
            </InputAdornment>
          ),
        }}
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email address',
          },
        })}
        error={!!errors.email}
        helperText={errors.email?.message}
      />

      <TextField
        fullWidth
        label="Password"
        type={showPassword ? 'text' : 'password'}
        margin="normal"
        autoComplete="current-password"
        disabled={isLoading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Lock color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                disabled={isLoading}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        {...register('password', {
          required: 'Password is required',
          minLength: {
            value: 6,
            message: 'Password must be at least 6 characters',
          },
        })}
        error={!!errors.password}
        helperText={errors.password?.message}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              color="primary"
              disabled={isLoading}
            />
          }
          label="Remember me"
        />
        <Link
          component="button"
          variant="body2"
          onClick={(e) => {
            e.preventDefault();
            alert('Password reset feature coming soon!');
          }}
          sx={{ mt: 1 }}
          disabled={isLoading}
        >
          Forgot password?
        </Link>
      </Box>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={isLoading}
        sx={{ mb: 2 }}
      >
        {isLoading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          'Sign In'
        )}
      </Button>

      <Divider sx={{ my: 3 }}>OR</Divider>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Google />}
          onClick={() => alert('Google login coming soon!')}
          disabled={isLoading}
          sx={{
            borderColor: 'divider',
            color: 'text.primary',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          Google
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Facebook />}
          onClick={() => alert('Facebook login coming soon!')}
          disabled={isLoading}
          sx={{
            borderColor: 'divider',
            color: 'text.primary',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          Facebook
        </Button>
      </Box>

      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Don't have an account?{' '}
          <Link
            component="button"
            variant="body2"
            onClick={(e) => {
              e.preventDefault();
              onSwitchToRegister();
            }}
            sx={{ fontWeight: 500 }}
            disabled={isLoading}
          >
            Sign Up
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginForm;