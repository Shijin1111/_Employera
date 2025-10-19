import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Stepper,
  Step,
  StepLabel,
  Grid,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Phone,
  Google,
  Facebook,
  Business,
  Work,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';

const steps = ['Account Type', 'Basic Info', 'Verification'];

const RegisterForm = ({ onSwitchToLogin }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [accountType, setAccountType] = useState('jobseeker');
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch('password');

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };


// Add these at the top of RegisterForm component
const navigate = useNavigate();
const { register: registerUser } = useAuth();
const [isLoading, setIsLoading] = useState(false);

  // Replace the onSubmit function with this:
  const onSubmit = async (data) => {
    try {
      setError('');
      setIsLoading(true);
      
      const userData = {
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        account_type: accountType,
      };
      
      const result = await registerUser(userData);
      
      if (result.success) {
        // Navigate based on account type
        if (result.user.account_type === 'employer') {
          navigate('/employer/dashboard');
        } else {
          navigate('/jobseeker/dashboard');
        }
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">
                <Typography variant="h6" sx={{ mb: 2 }}>
                  How do you want to use Employera?
                </Typography>
              </FormLabel>
              <RadioGroup
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
              >
                <Box
                  sx={{
                    border: 1,
                    borderColor: accountType === 'jobseeker' ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    p: 2,
                    mb: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => setAccountType('jobseeker')}
                >
                  <FormControlLabel
                    value="jobseeker"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Work color="primary" />
                        <Box>
                          <Typography variant="subtitle1" fontWeight={500}>
                            I'm looking for work
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Find jobs and bid on opportunities
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </Box>
                
                <Box
                  sx={{
                    border: 1,
                    borderColor: accountType === 'employer' ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    p: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => setAccountType('employer')}
                >
                  <FormControlLabel
                    value="employer"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Business color="primary" />
                        <Box>
                          <Typography variant="subtitle1" fontWeight={500}>
                            I want to hire
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Post jobs and find workers
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </Box>
              </RadioGroup>
            </FormControl>
            
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleNext}
              sx={{ mt: 3 }}
            >
              Continue
            </Button>
          </Box>
        );
        
      case 1:
        return (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                  {...register('firstName', {
                    required: 'First name is required',
                  })}
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  {...register('lastName', {
                    required: 'Last name is required',
                  })}
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
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
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  type="tel"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone color="action" />
                      </InputAdornment>
                    ),
                  }}
                  {...register('phone', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[\d\s\-\+KATEX_INLINE_OPENKATEX_INLINE_CLOSE]+$/,
                      message: 'Invalid phone number',
                    },
                  })}
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
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
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
                      message: 'Password must contain uppercase, lowercase and number',
                    },
                  })}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value =>
                      value === password || 'Passwords do not match',
                  })}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={handleBack}
              >
                Back
              </Button>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleNext}
              >
                Continue
              </Button>
            </Box>
          </Box>
        );
        
      case 2:
        return (
          <Box sx={{ mt: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              We'll send you a verification code to confirm your email address
            </Alert>
            
            <Typography variant="body1" sx={{ mb: 3 }}>
              By creating an account, you agree to our{' '}
              <Link href="#" onClick={(e) => e.preventDefault()}>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="#" onClick={(e) => e.preventDefault()}>
                Privacy Policy
              </Link>
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={handleBack}
              >
                Back
              </Button>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </Box>
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <Box sx={{ mt: 1 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent()}

      <Divider sx={{ my: 3 }}>OR</Divider>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Google />}
          onClick={() => alert('Google signup coming soon!')}
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
          onClick={() => alert('Facebook signup coming soon!')}
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
          Already have an account?{' '}
          <Link
            component="button"
            variant="body2"
            onClick={(e) => {
              e.preventDefault();
              onSwitchToLogin();
            }}
            sx={{ fontWeight: 500 }}
          >
            Sign In
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterForm;