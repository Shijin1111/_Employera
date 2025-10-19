import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  Button,
  Grid,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Alert,
  Skeleton,
  LinearProgress,
  Tooltip,
  Badge,
  useTheme,
  Divider,
} from '@mui/material';
import {
  AccessTime,
  CheckCircle,
  Cancel,
  Edit,
  Delete,
  MoreVert,
  AttachMoney,
  LocationOn,
  Schedule,
  Person,
  TrendingUp,
  TrendingDown,
  Message,
  Visibility,
  Timer,
  WorkOutline,
  EmojiEvents,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const BidStatusIcon = ({ status }) => {
  const icons = {
    pending: <AccessTime color="warning" />,
    accepted: <CheckCircle color="success" />,
    rejected: <Cancel color="error" />,
    withdrawn: <Delete color="disabled" />,
  };
  return icons[status] || <AccessTime />;
};

const BidCard = ({ bid, onUpdate, onWithdraw, onViewJob }) => {
  console.log('Inspecting bid prop in BidCard:', bid);
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const statusColors = {
    pending: 'warning',
    accepted: 'success',
    rejected: 'error',
    withdrawn: 'default',
  };

  const urgencyColors = {
    urgent: 'error',
    high: 'warning',
    medium: 'info',
    low: 'success',
  };

  const getDaysUntilStart = () => {
    const today = new Date();
    const startDate = new Date(bid.start_date);
    const diffTime = startDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilStart = getDaysUntilStart();

  return (
    <Card 
      sx={{ 
        mb: 2,
        position: 'relative',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        },
        ...(bid.status === 'accepted' && {
          border: `2px solid ${theme.palette.success.main}`,
        }),
      }}
    >
      {bid.status === 'accepted' && (
        <LinearProgress 
          variant="determinate" 
          value={100} 
          color="success"
          sx={{ height: 3 }}
        />
      )}
      
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48 }}>
              <WorkOutline />
            </Avatar>
            <Box>
              <Typography variant="h6" gutterBottom>
                {bid.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Avatar 
                  src={bid.employer.profile_picture} 
                  sx={{ width: 24, height: 24 }}
                >
                  {bid.employer.first_name[0]}
                </Avatar>
                <Typography variant="body2" color="text.secondary">
                  {bid.employer.first_name} {bid.employer.last_name}
                </Typography>
                {bid.employer.company_name && (
                  <Typography variant="body2" color="text.secondary">
                    • {bid.employer.company_name}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  icon={<BidStatusIcon status={bid.status} />}
                  label={bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                  size="small"
                  color={statusColors[bid.status]}
                />
                <Chip
                  label={bid.urgency}
                  size="small"
                  color={urgencyColors[bid.urgency]}
                  variant="outlined"
                />
                {bid.status === 'accepted' && daysUntilStart > 0 && (
                  <Chip
                    icon={<Timer />}
                    label={`Starts in ${daysUntilStart} day${daysUntilStart > 1 ? 's' : ''}`}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
            <Box sx={{ mt: 1, textAlign: 'right' }}>
              <Typography variant="h5" color="primary.main" fontWeight="bold">
                ${bid.amount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Budget: ${bid.budget_min}-${bid.budget_max}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid size={{xs:12,sm:4}}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body2">
                  {bid.city}, {bid.state}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid size={{xs:12,sm:4}}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Start Date
                </Typography>
                <Typography variant="body2">
                  {new Date(bid.start_date).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid size={{xs:12,sm:4}}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Competition
                </Typography>
                <Typography variant="body2">
                  {bid.bid_count} total bids
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {bid.message && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Message sx={{ fontSize: 18, color: 'text.secondary', mt: 0.5 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Your Message
                </Typography>
                <Typography variant="body2">
                  {bid.message}
                </Typography>
              </Box>
            </Box>
          </>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Submitted {new Date(bid.created_at).toLocaleDateString()}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {bid.status === 'pending' && (
              <>
                <Button 
                  size="small" 
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => onUpdate(bid)}
                >
                  Update
                </Button>
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="error"
                  startIcon={<Cancel />}
                  onClick={() => onWithdraw(bid)}
                >
                  Withdraw
                </Button>
              </>
            )}
            <Button 
              size="small" 
              variant="contained"
              startIcon={<Visibility />}
              onClick={() => onViewJob(bid.id)}
            >
              View Job
            </Button>
          </Box>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { handleMenuClose(); onViewJob(bid.id); }}>
            <Visibility sx={{ mr: 1, fontSize: 18 }} /> View Job Details
          </MenuItem>
          {bid.status === 'pending' && (
            <>
              <MenuItem onClick={() => { handleMenuClose(); onUpdate(bid); }}>
                <Edit sx={{ mr: 1, fontSize: 18 }} /> Update Bid
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); onWithdraw(bid); }}>
                <Delete sx={{ mr: 1, fontSize: 18 }} /> Withdraw Bid
              </MenuItem>
            </>
          )}
        </Menu>
      </CardContent>
    </Card>
  );
};

const StatsCard = ({ title, value, icon, color, trend }) => {
  const theme = useTheme();
  
  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
              {trend > 0 ? (
                <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
              ) : (
                <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
              )}
              <Typography variant="caption" color={trend > 0 ? 'success.main' : 'error.main'}>
                {Math.abs(trend)}% from last week
              </Typography>
            </Box>
          )}
        </Box>
        <Avatar sx={{ bgcolor: `${color}.light`, width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </Paper>
  );
};

const MyBids = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState('all');
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  });
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [newBidAmount, setNewBidAmount] = useState('');
  const [newBidMessage, setNewBidMessage] = useState('');

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    setLoading(true);
    try {
      const response = await api.get('/jobs/my-jobs/');
      const myBids = response.data.results || [];
      setBids(myBids);
      
      // Calculate stats
      const stats = {
        total: myBids.length,
        pending: myBids.filter(b => b.status === 'pending').length,
        accepted: myBids.filter(b => b.status === 'accepted').length,
        rejected: myBids.filter(b => b.status === 'rejected').length,
      };
      setStats(stats);
    } catch (error) {
      console.error('Error fetching bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBid = (bid) => {
    setSelectedBid(bid);
    setNewBidAmount(bid.amount.toString());
    setNewBidMessage(bid.message);
    setUpdateDialogOpen(true);
  };

  const handleSubmitUpdate = async () => {
    try {
      await api.patch(`/bids/${selectedBid.id}/`, {
        amount: parseFloat(newBidAmount),
        message: newBidMessage,
      });
      setUpdateDialogOpen(false);
      fetchBids();
    } catch (error) {
      console.error('Error updating bid:', error);
    }
  };

  const handleWithdrawBid = async (bid) => {
    if (window.confirm('Are you sure you want to withdraw this bid?')) {
      try {
        await api.patch(`/bids/${bid.id}/`, {
          status: 'withdrawn',
        });
        fetchBids();
      } catch (error) {
        console.error('Error withdrawing bid:', error);
      }
    }
  };

  const handleViewJob = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const filteredBids = bids.filter(bid => {
    if (tabValue === 'all') return true;
    return bid.status === tabValue;
  });

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item}>
              <Skeleton variant="rectangular" height={120} />
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
          My Bids
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track and manage all your job applications
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{xs:12,sm:6,md:3}}>
          <StatsCard
            title="Total Bids"
            value={stats.total}
            icon={<WorkOutline />}
            color={theme.palette.primary}
            trend={12}
          />
        </Grid>
        <Grid size={{xs:12,sm:6,md:3}}>
          <StatsCard
            title="Pending"
            value={stats.pending}
            icon={<AccessTime />}
            color={theme.palette.warning}
          />
        </Grid>
        <Grid size={{xs:12,sm:6,md:3}}>
          <StatsCard
            title="Accepted"
            value={stats.accepted}
            icon={<EmojiEvents />}
            color={theme.palette.success}
            trend={8}
          />
        </Grid>
        <Grid size={{xs:12,sm:6,md:3}}>
          <StatsCard
            title="Success Rate"
            value={`${stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0}%`}
            icon={<TrendingUp />}
            color={theme.palette.info}
          />
        </Grid>
      </Grid>

      {/* Tabs and Bid List */}
      <Paper sx={{ p: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, v) => setTabValue(v)}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={
              <Badge badgeContent={stats.total} color="primary">
                All Bids
              </Badge>
            } 
            value="all" 
          />
          <Tab 
            label={
              <Badge badgeContent={stats.pending} color="warning">
                Pending
              </Badge>
            } 
            value="pending" 
          />
          <Tab 
            label={
              <Badge badgeContent={stats.accepted} color="success">
                Accepted
              </Badge>
            } 
            value="accepted" 
          />
          <Tab 
            label={
              <Badge badgeContent={stats.rejected} color="error">
                Rejected
              </Badge>
            } 
            value="rejected" 
          />
        </Tabs>

        {filteredBids.length > 0 ? (
          filteredBids.map((item) => (
            <BidCard
              key={item.id}
              bid={item}
              onUpdate={handleUpdateBid}
              onWithdraw={handleWithdrawBid}
              onViewJob={handleViewJob}
            />
          ))
        ) : (
          <Alert severity="info">
            {tabValue === 'all' 
              ? "You haven't placed any bids yet. Browse jobs to get started!"
              : `No ${tabValue} bids to show.`}
          </Alert>
        )}
      </Paper>

      {/* Update Bid Dialog */}
      <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Your Bid</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              type="number"
              label="New Bid Amount"
              value={newBidAmount}
              onChange={(e) => setNewBidAmount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{ mb: 3 }}
            />
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Update Your Message"
              value={newBidMessage}
              onChange={(e) => setNewBidMessage(e.target.value)}
              placeholder="Explain any changes or add new information..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitUpdate}>
            Update Bid
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyBids;