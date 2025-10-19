import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Rating,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  LinearProgress,
  Alert,
  Skeleton,
  useTheme,
  Divider,
  IconButton,
} from '@mui/material';
// Each icon must be imported from its own specific file
import Star from '@mui/icons-material/Star';
import Work from '@mui/icons-material/Work';
import CheckCircle from '@mui/icons-material/CheckCircle';
import TrendingUp from '@mui/icons-material/TrendingUp';
import Person from '@mui/icons-material/Person';
import ThumbUp from '@mui/icons-material/ThumbUp';
import Flag from '@mui/icons-material/Flag';
import Reply from '@mui/icons-material/Reply';
import MoreVert from '@mui/icons-material/MoreVert';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import Speed from '@mui/icons-material/Speed';
import Handshake from '@mui/icons-material/Handshake';
import Home from '@mui/icons-material/Home';

// There is no icon named "Communication". 
// A common replacement is "Chat" or "Forum". Let's use "Chat".
import Chat from '@mui/icons-material/Chat';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const RatingCategory = ({ icon, label, value }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 140 }}>
        {icon}
        <Typography variant="body2">{label}</Typography>
      </Box>
      <Rating value={value} readOnly size="small" />
      <Typography variant="body2" color="text.secondary">
        {value.toFixed(1)}
      </Typography>
    </Box>
  );
};

const ReviewCard = ({ review, onRespond, isReceived }) => {
  const theme = useTheme();
  const [showResponse, setShowResponse] = useState(false);
  
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Avatar
              src={isReceived ? review.reviewer.profile_picture : review.reviewed_user.profile_picture}
              sx={{ width: 48, height: 48 }}
            >
              {isReceived ? review.reviewer.first_name[0] : review.reviewed_user.first_name[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="medium">
                {isReceived 
                  ? `${review.reviewer.first_name} ${review.reviewer.last_name}`
                  : `${review.reviewed_user.first_name} ${review.reviewed_user.last_name}`
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {review.job.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(review.created_at).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Rating value={review.overall_rating} readOnly />
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              {review.overall_rating.toFixed(1)}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body1" paragraph>
          {review.comment}
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <EmojiEvents sx={{ color: 'text.secondary' }} />
              <Typography variant="caption" display="block" color="text.secondary">
                Quality
              </Typography>
              <Rating value={review.quality_rating} readOnly size="small" />
            </Box>
          </Grid>
          <Grid xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Chat sx={{ color: 'text.secondary' }} />
              <Typography variant="caption" display="block" color="text.secondary">
                Communication
              </Typography>
              <Rating value={review.communication_rating} readOnly size="small" />
            </Box>
          </Grid>
          <Grid xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Speed sx={{ color: 'text.secondary' }} />
              <Typography variant="caption" display="block" color="text.secondary">
                Punctuality
              </Typography>
              <Rating value={review.punctuality_rating} readOnly size="small" />
            </Box>
          </Grid>
          <Grid xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Handshake sx={{ color: 'text.secondary' }} />
              <Typography variant="caption" display="block" color="text.secondary">
                Professionalism
              </Typography>
              <Rating value={review.professionalism_rating} readOnly size="small" />
            </Box>
          </Grid>
        </Grid>

        {isReceived && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<ThumbUp />}
              variant="outlined"
            >
              Helpful
            </Button>
            <Button
              size="small"
              startIcon={<Reply />}
              onClick={() => setShowResponse(!showResponse)}
            >
              Respond
            </Button>
            <Button
              size="small"
              startIcon={<Flag />}
              color="error"
            >
              Report
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const Reviews = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [reviews, setReviews] = useState({ received: [], given: [] });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    qualityRating: 0,
    communicationRating: 0,
    punctualityRating: 0,
    professionalismRating: 0,
    ratingBreakdown: [0, 0, 0, 0, 0],
  });
  const [writeReviewOpen, setWriteReviewOpen] = useState(false);
  const [pendingReviews, setPendingReviews] = useState([]);

  useEffect(() => {
    fetchReviews();
    fetchStats();
    fetchPendingReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Fetch reviews received
      const receivedResponse = await api.get('/reviews/received/');
      // Fetch reviews given
      const givenResponse = await api.get('/reviews/given/');
      
      setReviews({
        received: receivedResponse.data.results || [],
        given: givenResponse.data.results || [],
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/reviews/stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPendingReviews = async () => {
    try {
      const response = await api.get('/reviews/pending/');
      setPendingReviews(response.data.results || []);
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
    }
  };

  const isEmployer = user?.account_type === 'employer';

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3].map((item) => (
            <Grid xs={12} key={item}>
              <Skeleton variant="rectangular" height={150} />
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
          Reviews & Ratings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your reputation and feedback from {isEmployer ? 'workers' : 'employers'}
        </Typography>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h2" fontWeight="bold" color="primary.main">
              {stats.averageRating.toFixed(1)}
            </Typography>
            <Rating value={stats.averageRating} readOnly size="large" />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Based on {stats.totalReviews} reviews
            </Typography>
          </Paper>
        </Grid>

        <Grid xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              Rating Breakdown
            </Typography>
            {[5, 4, 3, 2, 1].map((rating) => (
              <Box key={rating} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="body2" sx={{ minWidth: 20 }}>
                  {rating}
                </Typography>
                <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                <Box sx={{ flexGrow: 1, mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={(stats.ratingBreakdown[rating - 1] / stats.totalReviews) * 100 || 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 30 }}>
                  {stats.ratingBreakdown[rating - 1] || 0}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              Category Ratings
            </Typography>
            <RatingCategory
              icon={<EmojiEvents sx={{ color: 'text.secondary' }} />}
              label="Quality"
              value={stats.qualityRating}
            />
            <RatingCategory
              icon={<Chat sx={{ color: 'text.secondary' }} />}
              label="Communication"
              value={stats.communicationRating}
            />
            <RatingCategory
              icon={<Speed sx={{ color: 'text.secondary' }} />}
              label="Punctuality"
              value={stats.punctualityRating}
            />
            <RatingCategory
              icon={<Handshake sx={{ color: 'text.secondary' }} />}
              label="Professionalism"
              value={stats.professionalismRating}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Pending Reviews Alert */}
      {pendingReviews.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have {pendingReviews.length} completed job(s) waiting for your review
          <Button size="small" sx={{ ml: 2 }} onClick={() => setWriteReviewOpen(true)}>
            Write Reviews
          </Button>
        </Alert>
      )}

      {/* Reviews Tabs */}
      <Paper sx={{ p: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
          <Tab label={`Reviews Received (${reviews.received.length})`} />
          <Tab label={`Reviews Given (${reviews.given.length})`} />
        </Tabs>

        {tabValue === 0 && (
          <Box>
            {reviews.received.length > 0 ? (
              reviews.received.map((review) => (
                <ReviewCard key={review.id} review={review} isReceived={true} />
              ))
            ) : (
              <Alert severity="info">
                No reviews received yet. Complete more jobs to get reviews!
              </Alert>
            )}
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            {reviews.given.length > 0 ? (
              reviews.given.map((review) => (
                <ReviewCard key={review.id} review={review} isReceived={false} />
              ))
            ) : (
              <Alert severity="info">
                You haven't written any reviews yet.
              </Alert>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Reviews;