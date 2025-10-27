import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  Rating,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tab,
  Tabs,
  Badge,
  Alert,
  useTheme,
  Divider,
} from '@mui/material';
import {
  Search,
  Star,
  Message,
  Bookmark,
  BookmarkBorder,
  MoreVert,
  Work,
  LocationOn,
  AttachMoney,
  CheckCircle,
  Schedule,
  Groups,
  PersonAdd,
  FilterList,
  Sort,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const WorkerCard = ({ worker, onMessage, onSave, onHire, isSaved }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Avatar
              src={worker.profile_picture}
              sx={{ width: 56, height: 56 }}
            >
              {worker.first_name[0]}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {worker.first_name} {worker.last_name}
              </Typography>
              {worker.is_verified && (
                <Chip
                  icon={<CheckCircle />}
                  label="Verified"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Rating value={worker.rating} readOnly size="small" />
            <Typography variant="body2" color="text.secondary">
              {worker.rating} ({worker.total_reviews} reviews)
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            {worker.bio || 'No bio available'}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {worker.skills?.slice(0, 3).map((skill, index) => (
              <Chip key={index} label={skill} size="small" variant="outlined" />
            ))}
            {worker.skills?.length > 3 && (
              <Chip label={`+${worker.skills.length - 3}`} size="small" />
            )}
          </Box>

          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Work sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {worker.completed_jobs || 0} jobs
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AttachMoney sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  ${worker.hourly_rate || 0}/hr
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {worker.location || 'Not specified'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  Available
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Message />}
            onClick={() => onMessage(worker)}
          >
            Message
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={() => onHire(worker)}
          >
            Hire
          </Button>
          <IconButton
            onClick={() => onSave(worker.id)}
            color={isSaved ? 'primary' : 'default'}
          >
            {isSaved ? <Bookmark /> : <BookmarkBorder />}
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>View Profile</MenuItem>
          <MenuItem onClick={handleMenuClose}>View Work History</MenuItem>
          <MenuItem onClick={handleMenuClose}>Add to Favorites</MenuItem>
          <MenuItem onClick={handleMenuClose}>Block Worker</MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

const Workers = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [workers, setWorkers] = useState({
    all: [],
    favorites: [],
    recent: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedWorkers, setSavedWorkers] = useState([]);
  const [messageDialog, setMessageDialog] = useState({ open: false, worker: null });
  const [hireDialog, setHireDialog] = useState({ open: false, worker: null });
  // Replace the fetchWorkers function and useEffect with this:

  useEffect(() => {
    fetchWorkers();
  }, [tabValue]); // Refetch when tab changes

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      let allWorkersPromise = api.get('/workers/');
      let favoritesPromise = api.get('/workers/favorites/');
      let recentPromise = api.get('/workers/recent/');
      
      const [allResponse, favoritesResponse, recentResponse] = await Promise.all([
        allWorkersPromise,
        favoritesPromise,
        recentPromise
      ]);
      
      setWorkers({
        all: allResponse.data.results || allResponse.data || [],
        favorites: favoritesResponse.data.results || favoritesResponse.data || [],
        recent: recentResponse.data.results || recentResponse.data || [],
      });
    } catch (error) {
      console.error('Error fetching workers:', error);
      // Set empty arrays if there's an error
      setWorkers({
        all: [],
        favorites: [],
        recent: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorker = (workerId) => {
    if (savedWorkers.includes(workerId)) {
      setSavedWorkers(savedWorkers.filter(id => id !== workerId));
    } else {
      setSavedWorkers([...savedWorkers, workerId]);
    }
  };

  const handleMessage = (worker) => {
    setMessageDialog({ open: true, worker });
  };

  const handleHire = (worker) => {
    setHireDialog({ open: true, worker });
  };

  const getDisplayedWorkers = () => {
    let workersList = [];
    switch (tabValue) {
      case 0:
        workersList = workers.all;
        break;
      case 1:
        workersList = workers.favorites;
        break;
      case 2:
        workersList = workers.recent;
        break;
      default:
        workersList = workers.all;
    }

    if (searchQuery) {
      workersList = workersList.filter(worker =>
        `${worker.first_name} ${worker.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        worker.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return workersList;
  };

  const displayedWorkers = getDisplayedWorkers();

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Workers
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item}>
              <Card sx={{ height: 300 }} />
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
          Workers
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find and manage workers for your jobs
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search workers by name or skills..."
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
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button startIcon={<FilterList />}>
                Filters
              </Button>
              <Button startIcon={<Sort />}>
                Sort
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label={<Badge badgeContent={workers.all.length} color="primary">All Workers</Badge>} />
          <Tab label={<Badge badgeContent={workers.favorites.length} color="primary">Favorites</Badge>} />
          <Tab label={<Badge badgeContent={workers.recent.length} color="primary">Recently Hired</Badge>} />
        </Tabs>
      </Paper>

      {/* Workers Grid */}
      {displayedWorkers.length > 0 ? (
        <Grid container spacing={3}>
          {displayedWorkers.map((worker) => (
            <Grid item xs={12} sm={6} md={4} key={worker.id}>
              <WorkerCard
                worker={worker}
                onMessage={handleMessage}
                onSave={handleSaveWorker}
                onHire={handleHire}
                isSaved={savedWorkers.includes(worker.id)}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity="info">
          No workers found matching your criteria.
        </Alert>
      )}

      {/* Message Dialog */}
      <Dialog
        open={messageDialog.open}
        onClose={() => setMessageDialog({ open: false, worker: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Message {messageDialog.worker?.first_name} {messageDialog.worker?.last_name}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Type your message..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessageDialog({ open: false, worker: null })}>
            Cancel
          </Button>
          <Button variant="contained">
            Send Message
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hire Dialog */}
      <Dialog
        open={hireDialog.open}
        onClose={() => setHireDialog({ open: false, worker: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Hire {hireDialog.worker?.first_name} {hireDialog.worker?.last_name}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 2 }}>
            To hire this worker, you can:
            <ul>
              <li>Create a new job and invite them to bid</li>
              <li>Offer them an instant hire on an existing job</li>
              <li>Send them a direct message to discuss</li>
            </ul>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHireDialog({ open: false, worker: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setHireDialog({ open: false, worker: null });
              navigate('/employer/post-job');
            }}
          >
            Create New Job
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Workers;