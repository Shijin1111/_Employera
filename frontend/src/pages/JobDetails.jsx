import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  Card,
  CardContent,
  CardMedia,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Rating,
  Skeleton,
  useTheme,
  Tooltip,
  Tab,
  Tabs,
} from '@mui/material';
import {
  LocationOn,
  Schedule,
  AttachMoney,
  Person,
  Build,
  FitnessCenter,
  BookmarkBorder,
  Bookmark,
  Share,
  Flag,
  CheckCircle,
  Cancel,
  Timer,
  FlashOn,
  Star,
  Work,
  ArrowBack,
  Send,
  Edit,
  Delete,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const BidCard = ({ bid, isOwner, onAccept, onReject }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Avatar
              src={bid.worker.profile_picture}
              alt={bid.worker.first_name}
              sx={{ width: 48, height: 48 }}
            >
              {bid.worker.first_name[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="medium">
                {bid.worker.first_name} {bid.worker.last_name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Rating value={bid.worker.rating} readOnly size="small" />
                <Typography variant="caption" color="text.secondary">
                  ({bid.worker.total_reviews} reviews)
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {bid.message}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Submitted {new Date(bid.created_at).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" color="primary.main" fontWeight="bold">
              ${bid.amount}
            </Typography>
            {bid.estimated_completion_time && (
              <Typography variant="caption" color="text.secondary">
                Est. {bid.estimated_completion_time} mins
              </Typography>
            )}
            
            {isOwner && bid.status === 'pending' && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
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
            )}
            
            {bid.status !== 'pending' && (
              <Chip
                label={bid.status}
                size="small"
                color={
                  bid.status === 'accepted' ? 'success' :
                  bid.status === 'rejected' ? 'error' : 'default'
                }
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const JobDetails = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [userBid, setUserBid] = useState(null);
  const [submittingBid, setSubmittingBid] = useState(false);

  const isOwner = job?.employer?.id === user?.id;
  const isJobSeeker = user?.account_type === 'jobseeker';

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/jobs/${id}/`);
      setJob(response.data);
      setIsSaved(response.data.is_saved);
      setUserBid(response.data.user_bid);
      
      // Set default bid amount to minimum budget
      setBidAmount(response.data.budget_min.toString());
    } catch (error) {
      console.error('Error fetching job details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveJob = async () => {
    try {
      if (isSaved) {
        await api.delete(`/jobs/${id}/save/`);
        setIsSaved(false);
      } else {
        await api.post(`/jobs/${id}/save/`);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const handleSubmitBid = async () => {
    setSubmittingBid(true);
    try {
      const response = await api.post(`/jobs/${id}/bids/create/`, {
        amount: parseFloat(bidAmount),
        message: bidMessage,
      });
      
      setUserBid(response.data);
      setBidDialogOpen(false);
      
      // Refresh job details to get updated bid count
      fetchJobDetails();
    } catch (error) {
      console.error('Error submitting bid:', error);
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleInstantHire = async () => {
    try {
      const response = await api.post(`/jobs/${id}/bids/create/`, {
        amount: job.instant_hire_price,
        message: 'Instant hire accepted',
        is_instant_hire: true,
      });
      
      // Navigate to success page or show confirmation
      navigate('/jobseeker/bids', {
        state: { message: 'Instant hire successful!' }
      });
    } catch (error) {
      console.error('Error with instant hire:', error);
    }
  };

  const handleAcceptBid = async (bidId) => {
    try {
      await api.post(`/jobs/${id}/bids/${bidId}/accept/`);
      fetchJobDetails();
    } catch (error) {
      console.error('Error accepting bid:', error);
    }
  };

  const handleRejectBid = async (bidId) => {
    try {
      await api.post(`/jobs/${id}/bids/${bidId}/reject/`);
      fetchJobDetails();
    } catch (error) {
      console.error('Error rejecting bid:', error);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
        <Grid size={{xs:12,md:8}}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
        <Grid size={{xs:12,md:4}}>
            <Skeleton variant="rectangular" height={300} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (!job) {
    return (
      <Alert severity="error">
        Job not found or you don't have permission to view it.
      </Alert>
    );
  }

  const statusColors = {
    open: 'success',
    in_progress: 'info',
    completed: 'default',
    cancelled: 'error',
  };

  const urgencyColors = {
    urgent: 'error',
    high: 'warning',
    medium: 'info',
    low: 'success',
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back to Jobs
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {job.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                label={job.status.replace('_', ' ')}
                color={statusColors[job.status]}
              />
              <Chip
                label={job.urgency}
                color={urgencyColors[job.urgency]}
              />
              {job.instant_hire_price && (
                <Chip
                  icon={<FlashOn />}
                  label={`Instant Hire: $${job.instant_hire_price}`}
                  color="success"
                  variant="outlined"
                />
              )}
              <Chip
                icon={<Person />}
                label={`${job.number_of_workers} worker(s) needed`}
                variant="outlined"
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isJobSeeker && (
              <IconButton onClick={handleSaveJob}>
                {isSaved ? <Bookmark color="primary" /> : <BookmarkBorder />}
              </IconButton>
            )}
            <IconButton>
              <Share />
            </IconButton>
            {isOwner && (
              <>
                <IconButton onClick={() => navigate(`/employer/jobs/${id}/edit`)}>
                  <Edit />
                </IconButton>
                <IconButton color="error">
                  <Delete />
                </IconButton>
              </>
            )}
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
                <Grid size={{xs:12,md:8}}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Job Description
            </Typography>
            <Typography variant="body1" paragraph>
              {job.description}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Job Details
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{xs:12,sm:6}}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocationOn color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body2">
                      {job.location_type === 'onsite' 
                        ? `${job.address}, ${job.city}, ${job.state}`
                        : 'Remote'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid size={{xs:12,sm:6}}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Schedule color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Start Date
                    </Typography>
                    <Typography variant="body2">
                      {new Date(job.start_date).toLocaleDateString()}
                      {job.is_flexible && ' (Flexible)'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid size={{xs:12,sm:6}}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Timer color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Estimated Duration
                    </Typography>
                    <Typography variant="body2">
                      {job.estimated_duration} minutes
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid size={{xs:12,sm:6}}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <FitnessCenter color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Physical Requirements
                    </Typography>
                    <Typography variant="body2">
                      {job.physical_requirements.replace('_', ' ')}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid size={{xs:12,sm:6}}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Build color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Tools
                    </Typography>
                    <Typography variant="body2">
                      {job.tools_provided ? 'Provided by employer' : 'Must bring own tools'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {job.skills_required.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom>
                  Required Skills
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {job.skills_required.map((skill) => (
                    <Chip key={skill.id} label={skill.name} />
                  ))}
                </Box>
              </>
            )}
          </Paper>

          {/* Bids Section */}
          {(isOwner || userBid) && (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                  <Tab label={`All Bids (${job.bid_count})`} />
                  {userBid && <Tab label="My Bid" />}
                </Tabs>
              </Box>

              {tabValue === 0 && (
                <Box>
                  {job.bids.length > 0 ? (
                    job.bids.map((bid) => (
                      <BidCard
                        key={bid.id}
                        bid={bid}
                        isOwner={isOwner}
                        onAccept={handleAcceptBid}
                        onReject={handleRejectBid}
                      />
                    ))
                  ) : (
                    <Alert severity="info">
                      No bids yet. Be the first to bid!
                    </Alert>
                  )}
                </Box>
              )}

              {tabValue === 1 && userBid && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Your Bid
                    </Typography>
                    <Typography variant="h4" color="primary.main" gutterBottom>
                      ${userBid.amount}
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {userBid.message}
                    </Typography>
                    <Chip
                      label={userBid.status}
                      color={
                        userBid.status === 'accepted' ? 'success' :
                        userBid.status === 'rejected' ? 'error' : 'default'
                      }
                    />
                  </CardContent>
                </Card>
              )}
            </Paper>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid size={{xs:12,md:4}}>
          {/* Employer Info */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Posted By
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar
                src={job.employer.profile_picture}
                alt={job.employer.first_name}
                sx={{ width: 56, height: 56 }}
              >
                {job.employer.first_name[0]}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="medium">
                  {job.employer.first_name} {job.employer.last_name}
                </Typography>
                {job.employer.company_name && (
                  <Typography variant="body2" color="text.secondary">
                    {job.employer.company_name}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Rating value={job.employer.rating} readOnly size="small" />
                  <Typography variant="caption" color="text.secondary">
                    ({job.employer.total_reviews})
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Member since
              </Typography>
              <Typography variant="body2">
                {new Date(job.employer.date_joined).toLocaleDateString()}
              </Typography>
            </Box>
            
            {job.employer.is_verified && (
              <Chip
                icon={<CheckCircle />}
                label="Verified Employer"
                color="success"
                size="small"
                sx={{ mt: 2 }}
              />
            )}
          </Paper>

          {/* Budget Card */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Budget
            </Typography>
            <Typography variant="h4" color="primary.main" gutterBottom>
              ${job.budget_min} - ${job.budget_max}
            </Typography>
            
            {job.instant_hire_price && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Instant Hire Available
                </Typography>
                <Typography variant="h5" color="success.main">
                  ${job.instant_hire_price}
                </Typography>
                <Typography variant="caption">
                  Accept immediately at this price
                </Typography>
              </Alert>
            )}

            {job.lowest_bid && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Lowest bid so far
                </Typography>
                <Typography variant="h6">
                  ${job.lowest_bid}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Action Buttons */}
          {isJobSeeker && job.status === 'open' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {!userBid ? (
                <>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<Send />}
                    onClick={() => setBidDialogOpen(true)}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                  >
                    Place Bid
                  </Button>
                  
                  {job.instant_hire_price && (
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      size="large"
                      startIcon={<FlashOn />}
                      onClick={handleInstantHire}
                    >
                      Instant Hire - ${job.instant_hire_price}
                    </Button>
                  )}
                </>
              ) : (
                <Alert severity="info">
                  You have already bid on this job
                </Alert>
              )}
            </Box>
          )}

          {isOwner && (
            <Alert severity="info">
              This is your job posting. You have {job.bid_count} bid(s) to review.
            </Alert>
          )}
        </Grid>
      </Grid>

      {/* Bid Dialog */}
      <Dialog open={bidDialogOpen} onClose={() => setBidDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Place Your Bid</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              type="number"
              label="Bid Amount"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                inputProps: {
                  min: job.budget_min,
                  max: job.budget_max,
                },
              }}
              helperText={`Budget range: $${job.budget_min} - $${job.budget_max}`}
              sx={{ mb: 3 }}
            />
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Message to Employer"
              value={bidMessage}
              onChange={(e) => setBidMessage(e.target.value)}
              placeholder="Explain why you're the best fit for this job..."
              helperText="A good message increases your chances of getting hired"
            />
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                Tips for a winning bid:
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>Mention relevant experience</li>
                  <li>Be specific about your approach</li>
                  <li>Show enthusiasm for the job</li>
                  <li>Confirm availability for the dates</li>
                </ul>
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBidDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitBid}
            disabled={!bidAmount || !bidMessage || submittingBid}
          >
            {submittingBid ? 'Submitting...' : 'Submit Bid'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobDetails;