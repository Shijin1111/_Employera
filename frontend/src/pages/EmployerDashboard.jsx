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
  Avatar,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Alert,
  Skeleton,
  AvatarGroup,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Add,
  TrendingUp,
  Work,
  People,
  CheckCircle,
  Pending,
  AttachMoney,
  MoreVert,
  Visibility,
  Edit,
  Delete,
  LocationOn,
  Timer,
  ArrowForward,
  Assessment,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const StatCard = ({ title, value, icon, color, subtitle, trend }) => {
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
              width: 45,
              height: 45,
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
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TrendingUp sx={{ fontSize: 16, color: trend > 0 ? 'success.main' : 'error.main' }} />
            <Typography variant="caption" color={trend > 0 ? 'success.main' : 'error.main'}>
              {Math.abs(trend)}% from last month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const JobTableRow = ({ job, onAction }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => {
    handleMenuClose();
    onAction(action, job);
  };

  const statusColors = {
    open: 'success',
    in_progress: 'info',
    completed: 'default',
    cancelled: 'error',
  };

  return (
    <TableRow hover>
      <TableCell>
        <Box>
          <Typography variant="subtitle2" fontWeight="medium">
            {job.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Posted {new Date(job.posted_date).toLocaleDateString()}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2">
            {job.city}, {job.state}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          label={job.status.replace('_', ' ')}
          size="small"
          color={statusColors[job.status]}
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          ${job.budget_min} - ${job.budget_max}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Badge badgeContent={job.bid_count} color="primary">
          <People />
        </Badge>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {new Date(job.start_date).toLocaleDateString()}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <IconButton size="small" onClick={handleMenuOpen}>
          <MoreVert />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleAction('view')}>
            <Visibility sx={{ mr: 1, fontSize: 18 }} /> View Details
          </MenuItem>
          <MenuItem onClick={() => handleAction('edit')}>
            <Edit sx={{ mr: 1, fontSize: 18 }} /> Edit
          </MenuItem>
          <MenuItem onClick={() => handleAction('delete')}>
            <Delete sx={{ mr: 1, fontSize: 18 }} /> Delete
          </MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  );
};

const BidCard = ({ bid, job, onAccept, onReject }) => {
  const theme = useTheme();
  
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={bid.worker.profile_picture}
            alt={bid.worker.first_name}
            sx={{ width: 40, height: 40 }}
          >
            {bid.worker.first_name[0]}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight="medium">
              {bid.worker.first_name} {bid.worker.last_name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {[...Array(5)].map((_, i) => (
                <Box
                  key={i}
                  component="span"
                  sx={{
                    color: i < Math.floor(bid.worker.rating) ? 'warning.main' : 'action.disabled',
                  }}
                >
                  ★
                </Box>
              ))}
              <Typography variant="caption" color="text.secondary">
                ({bid.worker.total_reviews} reviews)
              </Typography>
            </Box>
          </Box>
        </Box>
        <Typography variant="h6" color="primary.main">
          ${bid.amount}
        </Typography>
      </Box>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        {bid.message}
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Submitted {new Date(bid.created_at).toLocaleDateString()}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => onReject(bid.id)}
          >
            Reject
          </Button>
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={() => onAccept(bid.id)}
          >
            Accept
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

const EmployerDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeJobs, setActiveJobs] = useState([]);
  const [recentBids, setRecentBids] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch dashboard stats
      const statsResponse = await api.get('/dashboard/stats/');
      setStats(statsResponse.data);

      // Fetch active jobs
      const jobsResponse = await api.get('/jobs/my-jobs/', {
        params: { status: 'open' }
      });
      setActiveJobs(jobsResponse.data.results || []);

      // For now, we'll simulate recent bids
      // In production, you'd fetch actual recent bids
      setRecentBids([]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobAction = (action, job) => {
    switch (action) {
      case 'view':
        navigate(`/employer/jobs/${job.id}`);
        break;
      case 'edit':
        navigate(`/employer/jobs/${job.id}/edit`);
        break;
      case 'delete':
        // Implement delete functionality
        console.log('Delete job:', job.id);
        break;
      default:
        break;
    }
  };

  const handleAcceptBid = async (bidId) => {
    try {
      // Implement accept bid logic
      console.log('Accept bid:', bidId);
    } catch (error) {
      console.error('Error accepting bid:', error);
    }
  };

  const handleRejectBid = async (bidId) => {
    try {
      // Implement reject bid logic
      console.log('Reject bid:', bidId);
    } catch (error) {
      console.error('Error rejecting bid:', error);
    }
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Welcome back, {user?.first_name}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your job postings and find the perfect workers for your tasks.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            size="large"
            onClick={() => navigate('/employer/post-job')}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Post New Job
          </Button>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{xs:12,sm:6,md:3}}>
          <StatCard
            title="Total Jobs Posted"
            value={stats?.total_jobs_posted || 0}
            icon={<Work />}
            color={theme.palette.primary.main}
            subtitle="All time"
            trend={stats?.total_jobs_trend || 0}
          />
        </Grid>
        <Grid size={{xs:12,sm:6,md:3}}>
          <StatCard
            title="Active Jobs"
            value={stats?.active_jobs || 0}
            icon={<Pending />}
            color={theme.palette.warning.main}
            subtitle="Currently open"
          />
        </Grid>
        <Grid size={{xs:12,sm:6,md:3}}>
          <StatCard
            title="In Progress"
            value={stats?.in_progress_jobs || 0}
            icon={<Timer />}
            color={theme.palette.info.main}
            subtitle="Being worked on"
          />
        </Grid>
        <Grid size={{xs:12,sm:6,md:3}}>
          <StatCard
            title="Completed"
            value={stats?.completed_jobs || 0}
            icon={<CheckCircle />}
            color={theme.palette.success.main}
            subtitle="Successfully finished"
            trend={stats?.completed_jobs_trend || 0}
          />
        </Grid>
      </Grid>

      {/* Active Jobs Table */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{xs:12}}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" fontWeight="medium">
                Active Job Postings
              </Typography>
              <Button
                variant="text"
                endIcon={<ArrowForward />}
                onClick={() => navigate('/employer/jobs')}
              >
                View All
              </Button>
            </Box>
            
            {activeJobs.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Job Title</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Budget</TableCell>
                      <TableCell align="center">Bids</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeJobs.slice(0, 5).map((job) => (
                      <JobTableRow
                        key={job.id}
                        job={job}
                        onAction={handleJobAction}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                You don't have any active job postings. Post a job to get started!
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activity and Quick Stats */}
      <Grid container spacing={3}>
        <Grid size={{xs:12,md:8}}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="medium" gutterBottom>
              Recent Bids on Your Jobs
            </Typography>
            
            {recentBids.length > 0 ? (
              <Box>
                {recentBids.map((bid) => (
                  <BidCard
                    key={bid.id}
                    bid={bid}
                    job={bid.job}
                    onAccept={handleAcceptBid}
                    onReject={handleRejectBid}
                  />
                ))}
              </Box>
            ) : (
              <Alert severity="info">
                No recent bids to show. Bids will appear here when workers apply to your jobs.
              </Alert>
            )}
          </Paper>
        </Grid>

        <Grid size={{xs:12,md:4}}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="medium" gutterBottom>
              Quick Stats
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Average Job Cost
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  ${stats?.average_job_cost || '0'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Spent
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  ${stats?.total_spent || '0'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Avg. Completion Time
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  2.5 days
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Worker Satisfaction
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  4.8/5.0
                </Typography>
              </Box>
            </Box>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<Assessment />}
              sx={{ mt: 3 }}
              onClick={() => navigate('/employer/analytics')}
            >
              View Analytics
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmployerDashboard;