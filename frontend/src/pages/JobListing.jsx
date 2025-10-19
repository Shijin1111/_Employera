import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  CardActions,
  Pagination,
  useTheme,
  Alert,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Search,
  FilterList,
  LocationOn,
  AttachMoney,
  Schedule,
  ExpandMore,
  ViewList,
  ViewModule,
  BookmarkBorder,
  Bookmark,
  FlashOn,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const JobCard = ({ job, view, onSave, isSaved }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const urgencyColors = {
    urgent: 'error',
    high: 'warning',
    medium: 'info',
    low: 'success',
  };

  if (view === 'list') {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h6">
                  {job.title}
                </Typography>
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
              
              <Typography variant="body2" color="text.secondary" paragraph>
                {job.description.substring(0, 200)}...
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {job.city}, {job.state}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AttachMoney sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" fontWeight="medium">
                    ${job.budget_min} - ${job.budget_max}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Schedule sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {new Date(job.start_date).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              <IconButton onClick={() => onSave(job.id)}>
                {isSaved ? <Bookmark color="primary" /> : <BookmarkBorder />}
              </IconButton>
              <Typography variant="caption" color="text.secondary">
                {job.bid_count} bids
              </Typography>
            </Box>
          </Box>
        </CardContent>
        <CardActions>
          <Button 
            size="small" 
            variant="contained"
            onClick={() => navigate(`/jobs/${job.id}`)}
          >
            View Details & Bid
          </Button>
          {job.instant_hire_price && (
            <Button size="small" color="success">
              Instant Hire - ${job.instant_hire_price}
            </Button>
          )}
        </CardActions>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Chip
            label={job.urgency}
            size="small"
            color={urgencyColors[job.urgency]}
            variant="outlined"
          />
          <IconButton size="small" onClick={() => onSave(job.id)}>
            {isSaved ? <Bookmark color="primary" /> : <BookmarkBorder />}
          </IconButton>
        </Box>
        
        <Typography variant="h6" gutterBottom>
          {job.title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {job.description.substring(0, 100)}...
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
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
                Instant: ${job.instant_hire_price}
              </Typography>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary">
            {job.bid_count} bids
          </Typography>
        </Box>
      </CardContent>
      <CardActions>
        <Button 
          fullWidth 
          variant="contained"
          onClick={() => navigate(`/jobs/${job.id}`)}
        >
          View & Bid
        </Button>
      </CardActions>
    </Card>
  );
};

const JobListing = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewType, setViewType] = useState('grid');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedUrgency, setSelectedUrgency] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchJobs();
    fetchSavedJobs();
  }, [page, selectedCategory, selectedUrgency]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories/');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Replace the fetchJobs function in JobListing.jsx with this:
const fetchJobs = async () => {
  setLoading(true);
  try {
    const params = {
      page,
    };
    
    // Only add parameters if they have values
    if (searchQuery) params.search = searchQuery;
    if (selectedCategory) params.category = selectedCategory;
    if (selectedUrgency) params.urgency = selectedUrgency;
    if (priceRange[0] > 0) params.min_price = priceRange[0];
    if (priceRange[1] < 1000) params.max_price = priceRange[1];
    if (selectedLocation) params.city = selectedLocation;
    
    console.log('Fetching jobs with params:', params); // Debug log
    
    const response = await api.get('/jobs/', { params });
    console.log('Jobs response:', response.data); // Debug log
    
    // Handle both paginated and non-paginated responses
    if (response.data.results !== undefined) {
      // Paginated response
      setJobs(response.data.results);
      setTotalPages(Math.ceil(response.data.count / 10));
    } else if (Array.isArray(response.data)) {
      // Non-paginated array response
      setJobs(response.data);
      setTotalPages(1);
    } else {
      // Single page response with jobs directly
      setJobs([]);
      setTotalPages(1);
    }
  } catch (error) {
    console.error('Error fetching jobs:', error);
    setJobs([]);
  } finally {
    setLoading(false);
  }
};

  const fetchSavedJobs = async () => {
    try {
      const response = await api.get('/saved-jobs/');
      setSavedJobs(response.data.results?.map(item => item.job.id) || []);
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchJobs();
  };

  const handleSaveJob = async (jobId) => {
    try {
      if (savedJobs.includes(jobId)) {
        await api.delete(`/jobs/${jobId}/save/`);
        setSavedJobs(savedJobs.filter(id => id !== jobId));
      } else {
        await api.post(`/jobs/${jobId}/save/`);
        setSavedJobs([...savedJobs, jobId]);
      }
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Browse Jobs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find the perfect job that matches your skills and availability
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
                <Select
                 value={selectedCategory}
                label="Category"
                 onChange={(e) => setSelectedCategory(e.target.value)}
                >
                <MenuItem value="">All</MenuItem>
                {/* The check is needed here */}
                {Array.isArray(categories) && categories.map((cat) => (
                <MenuItem key={cat.name} value={cat.name}>
                {cat.display_name}
                </MenuItem>
                ))}
                </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Urgency</InputLabel>
              <Select
                value={selectedUrgency}
                label="Urgency"
                onChange={(e) => setSelectedUrgency(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Search />}
              onClick={handleSearch}
              sx={{ height: 56 }}
            >
              Search
            </Button>
          </Grid>
        </Grid>

        {/* Advanced Filters */}
        <Accordion sx={{ mt: 2, boxShadow: 0 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle2">
              <FilterList sx={{ mr: 1, fontSize: 18, verticalAlign: 'middle' }} />
              Advanced Filters
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Price Range</Typography>
                <Slider
                  value={priceRange}
                  onChange={(e, newValue) => setPriceRange(newValue)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={5000}
                  marks={[
                    { value: 0, label: '$0' },
                    { value: 2500, label: '$2500' },
                    { value: 5000, label: '$5000' },
                  ]}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  placeholder="Enter city name"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* View Toggle and Results Count */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Found {jobs.length} jobs
        </Typography>
        <ToggleButtonGroup
          value={viewType}
          exclusive
          onChange={(e, newView) => newView && setViewType(newView)}
          size="small"
        >
          <ToggleButton value="grid">
            <ViewModule />
          </ToggleButton>
          <ToggleButton value="list">
            <ViewList />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Job Cards */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Grid item xs={12} md={viewType === 'grid' ? 4 : 12} key={item}>
              <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      ) : jobs.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {jobs.map((job) => (
              <Grid item xs={12} md={viewType === 'grid' ? 4 : 12} key={job.id}>
                <JobCard
                  job={job}
                  view={viewType}
                  onSave={handleSaveJob}
                  isSaved={savedJobs.includes(job.id)}
                />
              </Grid>
            ))}
          </Grid>
          
          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
              size="large"
            />
          </Box>
        </>
      ) : (
        <Alert severity="info">
          No jobs found matching your criteria. Try adjusting your filters.
        </Alert>
      )}
    </Box>
  );
};

export default JobListing;