import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  Tab,
  Tabs,
  useTheme,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  TrendingUp,
  Work,
  Gavel,
  CheckCircle,
  AccessTime,
  AttachMoney,
  Star,
  ArrowForward,
  LocationOn,
  Schedule,
  Refresh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const StatCard = ({ title, value, icon, color, trend }) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}30 100%)`,
        border: `1px solid ${color}40`,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: color,
              width: 40,
              height: 40,
              mr: 2,
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
          </Box>
        </Box>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
            <Typography variant="caption" color="success.main">
              {trend}% from last month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const JobCard = ({ job, onViewDetails }) => {
  const theme = useTheme();
  const urgencyColors = {
    urgent: 'error',
    high: 'warning',
    medium: 'info',
    low: 'success',
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'all 0.3s',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
      onClick={() => onViewDetails(job.id)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {job?.title || 'Job Title Not Found'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {job.employer.first_name} {job.employer.last_name}
            </Typography>
          </Box>
          <Chip
            label={job.urgency}
            size="small"
            color={urgencyColors[job.urgency]}
            variant="outlined"
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            {job.description.substring(0, 100)}...
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {job.city}, {job.state}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {new Date(job.start_date).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" color="primary.main">
              ${job.budget_min} - ${job.budget_max}
            </Typography>
            {job.instant_hire_price && (
              <Typography variant="caption" color="success.main">
                Instant hire: ${job.instant_hire_price}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {job.bid_count} bids
            </Typography>
            <IconButton size="small" color="primary">
              <ArrowForward />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const ActiveBidCard = ({ bid }) => {
  const theme = useTheme();
  const statusColors = {
    pending: 'warning',
    accepted: 'success',
    rejected: 'error',
    withdrawn: 'default',
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight="medium">
          {bid?.title || 'Job Title Not Found'}
        </Typography>
        <Chip
          label={bid.status}
          size="small"
          color={statusColors[bid.status]}
        />
      </Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Your bid: ${bid.amount}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Submitted {new Date(bid.created_at).toLocaleDateString()}
        </Typography>
        {bid.status === 'pending' && (
          <Button size="small" variant="outlined">
            Update Bid
          </Button>
        )}
      </Box>
    </Paper>
  );
};

const JobSeekerDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [activeBids, setActiveBids] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch dashboard stats
      const statsResponse = await api.get('/dashboard/stats/');
      setStats(statsResponse.data);

      // Fetch recommended jobs
      const jobsResponse = await api.get('/jobs/', {
        params: { limit: 6 }
      });
      setRecommendedJobs(jobsResponse.data.results || []);

      // Fetch active bids
      const bidsResponse = await api.get('/jobs/my-jobs/', {
        params: { status: 'open' }
      });
      setActiveBids(bidsResponse.data.results || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewJobDetails = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  if (loading) {
    return (
      <Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Box sx={{ mt: 4 }}>
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Welcome back, {user?.first_name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your job applications today.
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{xs:12,sm:6,md:3}}>
          <StatCard
            title="Total Bids"
            value={stats?.total_bids || 0}
            icon={<Gavel />}
            color={theme.palette.primary.main}
            trend={12}
          />
        </Grid>
        <Grid size={{xs:12,sm:6,md:3}}>
          <StatCard
            title="Pending Bids"
            value={stats?.pending_bids || 0}
            icon={<AccessTime />}
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid size={{xs:12,sm:6,md:3}}>
          <StatCard
            title="Jobs Won"
            value={stats?.accepted_bids || 0}
            icon={<CheckCircle />}
            color={theme.palette.success.main}
            trend={8}
          />
        </Grid>
        <Grid size={{xs:12,sm:6,md:3}}>
          <StatCard
            title="Avg Rating"
            value={stats?.average_rating?.toFixed(1) || '0.0'}
            icon={<Star />}
            color={theme.palette.info.main}
          />
        </Grid>
      </Grid>

      {/* Earnings Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{xs:12,md:8}}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" fontWeight="medium">
                Recommended Jobs
              </Typography>
              <Button
                startIcon={<Refresh />}
                onClick={fetchDashboardData}
                size="small"
              >
                Refresh
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              {recommendedJobs.length > 0 ? (
                recommendedJobs.map((job) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={job.id}>
                    <JobCard job={job} onViewDetails={handleViewJobDetails} />
                  </Grid>
                ))
              ) : (
                <Grid size={{xs:12}}>
                  <Alert severity="info">
                    No recommended jobs at the moment. Check back later!
                  </Alert>
                </Grid>
              )}
            </Grid>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/jobs')}
                endIcon={<ArrowForward />}
              >
                View All Jobs
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{xs:12,md:4}}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="medium" gutterBottom>
              Active Bids
            </Typography>
            
            {activeBids.length > 0 ? (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {activeBids.map((bid) => (
                  <ActiveBidCard key={bid.id} bid={bid} />
                ))}
              </Box>
            ) : (
              <Alert severity="info">
                You don't have any active bids.
              </Alert>
            )}

            <Box sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/jobseeker/bids')}
              >
                View All Bids
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="medium" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{xs:12,sm:6,md:3}}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Work />}
              onClick={() => navigate('/jobs')}
              sx={{ py: 2 }}
            >
              Browse Jobs
            </Button>
          </Grid>
          <Grid size={{xs:12,sm:6,md:3}}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Star />}
              onClick={() => navigate('/jobseeker/reviews')}
              sx={{ py: 2 }}
            >
              My Reviews
            </Button>
          </Grid>
          <Grid size={{xs:12,sm:6,md:3}}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Schedule />}
              onClick={() => navigate('/jobseeker/availability')}
              sx={{ py: 2 }}
            >
              Set Availability
            </Button>
          </Grid>
          <Grid size={{xs:12,sm:6,md:3}}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AttachMoney />}
              onClick={() => navigate('/jobseeker/earnings')}
              sx={{ py: 2 }}
            >
              Earnings
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default JobSeekerDashboard;