import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Rating,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  useTheme,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  AttachMoney,
  Person,
  RateReview,
  Visibility,
  Download,
  FilterList,
  Star,
  Comment,
  Work,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const JobHistoryRow = ({ job, onViewDetails, onLeaveReview, isEmployer }) => {
  const theme = useTheme();
  
  const statusColors = {
    completed: 'success',
    cancelled: 'error',
    in_progress: 'info',
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle sx={{ fontSize: 20 }} />;
      case 'cancelled':
        return <Cancel sx={{ fontSize: 20 }} />;
      default:
        return <Schedule sx={{ fontSize: 20 }} />;
    }
  };

  return (
    <TableRow hover>
      <TableCell>
        <Box>
          <Typography variant="subtitle2" fontWeight="medium">
            {job.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {job.category?.display_name}
          </Typography>
        </Box>
      </TableCell>
      
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 24, height: 24 }}>
            {isEmployer ? job.worker?.first_name?.[0] : job.employer?.first_name?.[0]}
          </Avatar>
          <Typography variant="body2">
            {isEmployer 
              ? `${job.worker?.first_name} ${job.worker?.last_name}`
              : `${job.employer?.first_name} ${job.employer?.last_name}`
            }
          </Typography>
        </Box>
      </TableCell>
      
      <TableCell>
        <Chip
          icon={getStatusIcon(job.status)}
          label={job.status.replace('_', ' ')}
          size="small"
          color={statusColors[job.status]}
        />
      </TableCell>
      
      <TableCell>
        <Typography variant="body2">
          ${job.final_amount || job.budget_max}
        </Typography>
      </TableCell>
      
      <TableCell>
        <Typography variant="body2">
          {new Date(job.completion_date || job.start_date).toLocaleDateString()}
        </Typography>
      </TableCell>
      
      <TableCell>
        {job.has_review ? (
          <Rating value={job.review_rating} readOnly size="small" />
        ) : job.status === 'completed' ? (
          <Button
            size="small"
            variant="outlined"
            startIcon={<RateReview />}
            onClick={() => onLeaveReview(job)}
          >
            Leave Review
          </Button>
        ) : (
          <Typography variant="caption" color="text.secondary">
            N/A
          </Typography>
        )}
      </TableCell>
      
      <TableCell>
        <IconButton size="small" onClick={() => onViewDetails(job)}>
          <Visibility />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

const ReviewDialog = ({ open, onClose, job, isEmployer }) => {
  const [ratings, setRatings] = useState({
    quality: 5,
    communication: 5,
    punctuality: 5,
    professionalism: 5,
  });
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const reviewData = {
        quality_rating: ratings.quality,
        communication_rating: ratings.communication,
        punctuality_rating: ratings.punctuality,
        professionalism_rating: ratings.professionalism,
        comment: comment,
        job:job.id,
      };
      
      await api.post(`/jobs/${job.id}/review/`, reviewData);
      
      onClose(true); // Pass true to indicate success
    } catch (error) {
      console.error('Error submitting review:', error);
      console.log("Validation Error Details:", error.response.data);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const reviewedPerson = isEmployer ? job.worker : job.employer;

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        Leave Review for {reviewedPerson?.first_name} {reviewedPerson?.last_name}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Job: {job?.title}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2">Quality of Work</Typography>
                <Rating
                  value={ratings.quality}
                  onChange={(e, value) => setRatings({ ...ratings, quality: value })}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2">Communication</Typography>
                <Rating
                  value={ratings.communication}
                  onChange={(e, value) => setRatings({ ...ratings, communication: value })}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2">Punctuality</Typography>
                <Rating
                  value={ratings.punctuality}
                  onChange={(e, value) => setRatings({ ...ratings, punctuality: value })}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2">Professionalism</Typography>
                <Rating
                  value={ratings.professionalism}
                  onChange={(e, value) => setRatings({ ...ratings, professionalism: value })}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Comments"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience working with this person..."
                helperText="Your feedback helps build trust in our community"
              />
            </Grid>
          </Grid>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            Overall Rating: {((ratings.quality + ratings.communication + ratings.punctuality + ratings.professionalism) / 4).toFixed(1)} / 5.0
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !comment}
          startIcon={<Star />}
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const History = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialog, setReviewDialog] = useState({ open: false, job: null });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    cancelled: 0,
    totalEarned: 0,
    totalSpent: 0,
    pendingReviews: 0,
  });

  const isEmployer = user?.account_type === 'employer';
  // Replace the fetchHistory function with this:

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Fetch jobs based on current tab
      const jobsResponse = await api.get('/history/', {
        params: { 
          status: tabValue === 0 ? 'completed' : 'cancelled'
        }
      });
      
      // Fetch stats
      const statsResponse = await api.get('/history/stats/');
      
      const jobsData = jobsResponse.data.results || jobsResponse.data || [];
      setJobs(jobsData);
      
      // Use actual stats from backend
      setStats({
        total: statsResponse.data.total || 0,
        completed: statsResponse.data.completed || 0,
        cancelled: statsResponse.data.cancelled || 0,
        totalEarned: statsResponse.data.total_earned || 0,
        totalSpent: statsResponse.data.total_spent || 0,
        pendingReviews: statsResponse.data.pending_reviews || 0,
      });
    } catch (error) {
      console.error('Error fetching history:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Also update the useEffect to refetch when tab changes:
  useEffect(() => {
    fetchHistory();
  }, [tabValue]);

  const handleLeaveReview = (job) => {
    setReviewDialog({ open: true, job });
  };

  const handleReviewClose = (success) => {
    setReviewDialog({ open: false, job: null });
    if (success) {
      fetchHistory(); // Refresh the list
    }
  };

  const handleViewDetails = (job) => {
    navigate(`/jobs/${job.id}`);
  };

  const filteredJobs = jobs.filter(job => {
    if (tabValue === 0) return job.status === 'completed';
    if (tabValue === 1) return job.status === 'cancelled';
    return true;
  });

  if (loading) {
    return (
      <Box>
        <LinearProgress />
        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
          Job History
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Job History
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your completed and cancelled jobs
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Jobs
                </Typography>
                <Typography variant="h4">{stats.total}</Typography>
              </Box>
              <Work sx={{ fontSize: 40, color: 'primary.main' }} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.completed}
                </Typography>
              </Box>
              <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {isEmployer ? 'Total Spent' : 'Total Earned'}
                </Typography>
                <Typography variant="h4">
                  ${isEmployer ? stats.totalSpent : stats.totalEarned}
                </Typography>
              </Box>
              <AttachMoney sx={{ fontSize: 40, color: 'success.main' }} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Pending Reviews
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.pendingReviews}
                </Typography>
              </Box>
              <RateReview sx={{ fontSize: 40, color: 'warning.main' }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Alert for pending reviews */}
      {stats.pendingReviews > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have {stats.pendingReviews} completed job(s) waiting for your review. 
          Please leave reviews to help build trust in our community.
        </Alert>
      )}

      {/* Tabs and Table */}
      <Paper>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Completed Jobs" />
          <Tab label="Cancelled Jobs" />
        </Tabs>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Job Title</TableCell>
                <TableCell>{isEmployer ? 'Worker' : 'Employer'}</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Review</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <JobHistoryRow
                    key={job.id}
                    job={job}
                    onViewDetails={handleViewDetails}
                    onLeaveReview={handleLeaveReview}
                    isEmployer={isEmployer}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No {tabValue === 0 ? 'completed' : 'cancelled'} jobs found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Review Dialog */}
      {reviewDialog.job && (
      <ReviewDialog
        open={reviewDialog.open}
        onClose={handleReviewClose}
        job={reviewDialog.job}
        isEmployer={isEmployer}
      />
      )}
    </Box>
  );
};

export default History;