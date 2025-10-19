import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Skeleton,
  Badge,
  Avatar,
  AvatarGroup,
  Tooltip,
  useTheme,
  LinearProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  Visibility,
  People,
  AttachMoney,
  Schedule,
  LocationOn,
  CheckCircle,
  Cancel,
  AccessTime,
  Search,
  FilterList,
  Download,
  Share,
  ContentCopy,
  Pause,
  PlayArrow,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const JobStatusChip = ({ status }) => {
  const statusConfig = {
    draft: { color: 'default', label: 'Draft' },
    open: { color: 'success', label: 'Open' },
    in_progress: { color: 'info', label: 'In Progress' },
    completed: { color: 'default', label: 'Completed' },
    cancelled: { color: 'error', label: 'Cancelled' },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
    />
  );
};

const JobRow = ({ job, onAction }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();

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
        <JobStatusChip status={job.status} />
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
      
      <TableCell>
        <Typography variant="caption" color="text.secondary">
          {new Date(job.posted_date).toLocaleDateString()}
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
          <MenuItem onClick={() => handleAction('duplicate')}>
            <ContentCopy sx={{ mr: 1, fontSize: 18 }} /> Duplicate
          </MenuItem>
          {job.status === 'open' && (
            <MenuItem onClick={() => handleAction('pause')}>
              <Pause sx={{ mr: 1, fontSize: 18 }} /> Pause
            </MenuItem>
          )}
          {job.status === 'draft' && (
            <MenuItem onClick={() => handleAction('publish')}>
              <PlayArrow sx={{ mr: 1, fontSize: 18 }} /> Publish
            </MenuItem>
          )}
          <MenuItem onClick={() => handleAction('delete')}>
            <Delete sx={{ mr: 1, fontSize: 18, color: 'error.main' }} /> Delete
          </MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  );
};

const JobCard = ({ job, onAction }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <JobStatusChip status={job.status} />
          <IconButton size="small">
            <MoreVert />
          </IconButton>
        </Box>
        
        <Typography variant="h6" gutterBottom>
          {job.title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {job.description.substring(0, 100)}...
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AttachMoney sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption">
                ${job.budget_min}-${job.budget_max}
              </Typography>
            </Box>
          </Grid>
          <Grid xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <People sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption">
                {job.bid_count} bids
              </Typography>
            </Box>
          </Grid>
          <Grid xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption">
                {new Date(job.start_date).toLocaleDateString()}
              </Typography>
            </Box>
          </Grid>
          <Grid xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption">
                {job.city}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            fullWidth
            onClick={() => onAction('view', job)}
          >
            View
          </Button>
          <Button
            size="small"
            variant="contained"
            fullWidth
            onClick={() => onAction('edit', job)}
          >
            Edit
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

const EmployerJobs = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState('all');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewType, setViewType] = useState('table'); // 'table' or 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    completed: 0,
    draft: 0,
  });

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await api.get('/jobs/my-jobs/', { params });
      const jobsData = response.data.results || [];
      setJobs(jobsData);
      
      // Calculate stats
      const stats = {
        total: jobsData.length,
        open: jobsData.filter(j => j.status === 'open').length,
        in_progress: jobsData.filter(j => j.status === 'in_progress').length,
        completed: jobsData.filter(j => j.status === 'completed').length,
        draft: jobsData.filter(j => j.status === 'draft').length,
      };
      setStats(stats);
    } catch (error) {
      console.error('Error fetching jobs:', error);
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
        setSelectedJob(job);
        setDeleteDialogOpen(true);
        break;
      case 'duplicate':
        // Implement duplicate functionality
        console.log('Duplicate job:', job.id);
        break;
      case 'pause':
        // Implement pause functionality
        handleUpdateJobStatus(job.id, 'draft');
        break;
      case 'publish':
        // Implement publish functionality
        handleUpdateJobStatus(job.id, 'open');
        break;
      default:
        break;
    }
  };

  const handleUpdateJobStatus = async (jobId, newStatus) => {
    try {
      await api.patch(`/jobs/${jobId}/`, { status: newStatus });
      fetchJobs();
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  const handleDeleteJob = async () => {
    try {
      await api.delete(`/jobs/${selectedJob.id}/`);
      setDeleteDialogOpen(false);
      fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (searchQuery) {
      return job.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={100} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            My Job Postings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and track all your job postings
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/employer/post-job')}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          Post New Job
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Jobs
            </Typography>
          </Paper>
        </Grid>
        <Grid xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {stats.open}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Open
            </Typography>
          </Paper>
        </Grid>
        <Grid xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold" color="info.main">
              {stats.in_progress}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              In Progress
            </Typography>
          </Paper>
        </Grid>
        <Grid xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold">
              {stats.completed}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completed
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search jobs..."
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
          <Grid xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Jobs Table */}
      {viewType === 'table' ? (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Job Title</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Budget</TableCell>
                  <TableCell align="center">Bids</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>Posted</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredJobs
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((job) => (
                    <JobRow key={job.id} job={job} onAction={handleJobAction} />
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredJobs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredJobs.map((job) => (
            <Grid xs={12} sm={6} md={4} key={job.id}>
              <JobCard job={job} onAction={handleJobAction} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Job</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Are you sure you want to delete "{selectedJob?.title}"? This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteJob}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployerJobs;