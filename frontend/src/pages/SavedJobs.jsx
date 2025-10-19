import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Alert,
  Skeleton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  BookmarkRemove,
  LocationOn,
  AttachMoney,
  Schedule,
  Search,
  Visibility,
  Timer,
  People,
  FlashOn,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const SavedJobCard = ({ savedJob, onRemove }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const job = savedJob.job;

  const urgencyColors = {
    urgent: 'error',
    high: 'warning',
    medium: 'info',
    low: 'success',
  };

  const calculateDaysLeft = () => {
    const today = new Date();
    const startDate = new Date(job.start_date);
    const diffTime = startDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = calculateDaysLeft();

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={job.urgency}
              size="small"
              color={urgencyColors[job.urgency]}
              variant="outlined"
            />
            {job.instant_hire_price && (
              <Chip
                icon={<FlashOn />}
                label="Instant Hire"
                size="small"
                color="success"
                variant="outlined"
              />
            )}
          </Box>
          <IconButton 
            size="small" 
            onClick={() => onRemove(savedJob.id)}
            color="error"
          >
            <BookmarkRemove />
          </IconButton>
        </Box>

        <Typography variant="h6" gutterBottom>
          {job.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" paragraph>
          {job.description.substring(0, 100)}...
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
              {daysLeft > 0 && ` (${daysLeft} days left)`}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <People sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {job.bid_count} bids
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" color="primary.main">
            ${job.budget_min} - ${job.budget_max}
          </Typography>
          {job.instant_hire_price && (
            <Typography variant="caption" color="success.main">
              Instant hire: ${job.instant_hire_price}
            </Typography>
          )}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Saved {new Date(savedJob.saved_at).toLocaleDateString()}
        </Typography>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<Visibility />}
          onClick={() => navigate(`/jobs/${job.id}`)}
        >
          View & Bid
        </Button>
      </CardActions>
    </Card>
  );
};

const SavedJobs = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('saved_date');
  const [filterUrgency, setFilterUrgency] = useState('all');

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/saved-jobs/');
      setSavedJobs(response.data.results || []);
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSavedJob = async (savedJobId) => {
    try {
      const savedJob = savedJobs.find(sj => sj.id === savedJobId);
      await api.delete(`/jobs/${savedJob.job.id}/save/`);
      setSavedJobs(savedJobs.filter(sj => sj.id !== savedJobId));
    } catch (error) {
      console.error('Error removing saved job:', error);
    }
  };

  const filteredJobs = savedJobs.filter(savedJob => {
    const job = savedJob.job;
    
    // Search filter
    if (searchQuery && !job.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Urgency filter
    if (filterUrgency !== 'all' && job.urgency !== filterUrgency) {
      return false;
    }
    
    return true;
  });

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'saved_date':
        return new Date(b.saved_at) - new Date(a.saved_at);
      case 'start_date':
        return new Date(a.job.start_date) - new Date(b.job.start_date);
      case 'price_low':
        return a.job.budget_min - b.job.budget_min;
      case 'price_high':
        return b.job.budget_max - a.job.budget_max;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item}>
              <Skeleton variant="rectangular" height={300} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Saved Jobs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Keep track of jobs you're interested in
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search saved jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="saved_date">Recently Saved</MenuItem>
                <MenuItem value="start_date">Start Date</MenuItem>
                <MenuItem value="price_low">Price: Low to High</MenuItem>
                <MenuItem value="price_high">Price: High to Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Urgency</InputLabel>
              <Select
                value={filterUrgency}
                label="Urgency"
                onChange={(e) => setFilterUrgency(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="text.secondary">
              {sortedJobs.length} saved job{sortedJobs.length !== 1 ? 's' : ''}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Saved Jobs Grid */}
      {sortedJobs.length > 0 ? (
        <Grid container spacing={3}>
          {sortedJobs.map((savedJob) => (
            <Grid item xs={12} sm={6} md={4} key={savedJob.id}>
              <SavedJobCard
                savedJob={savedJob}
                onRemove={handleRemoveSavedJob}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity="info">
          {searchQuery || filterUrgency !== 'all'
            ? 'No saved jobs match your filters.'
            : "You haven't saved any jobs yet. Browse available jobs to get started!"}
        </Alert>
      )}
    </Box>
  );
};

export default SavedJobs;