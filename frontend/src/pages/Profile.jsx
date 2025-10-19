import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Chip,
  Rating,
  Tab,
  Tabs,
  Card,
  CardContent,
  CardMedia,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  useTheme,
  Skeleton,
  LinearProgress,
  Badge,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  LocationOn,
  Email,
  Phone,
  Verified,
  Work,
  Star,
  AttachMoney,
  Schedule,
  CheckCircle,
  Add,
  Delete,
  CalendarMonth,
  Build,
  DirectionsCar,
  CleaningServices,
  Yard,
  Pets,
  Event,
  LocalShipping,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const SkillIcon = {
  gardening: <Yard />,
  cleaning: <CleaningServices />,
  driving: <DirectionsCar />,
  'pet care': <Pets />,
  'event setup': <Event />,
  moving: <LocalShipping />,
  repairs: <Build />,
};

const TabPanel = ({ children, value, index }) => (
  <Box hidden={value !== index} sx={{ pt: 3 }}>
    {value === index && children}
  </Box>
);

const AvailabilitySchedule = ({ availability, onChange, editMode }) => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    { label: 'Morning (6AM-12PM)', value: 'morning' },
    { label: 'Afternoon (12PM-6PM)', value: 'afternoon' },
    { label: 'Evening (6PM-12AM)', value: 'evening' },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Availability Schedule
      </Typography>
      <Grid container spacing={2}>
        {daysOfWeek.map((day, dayIndex) => (
          <Grid size={{ xs: 12}} key={day}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {day}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {timeSlots.map((slot) => (
                  <Chip
                    key={slot.value}
                    label={slot.label}
                    color={
                      availability?.[dayIndex]?.[slot.value] ? 'primary' : 'default'
                    }
                    onClick={() => editMode && onChange(dayIndex, slot.value)}
                    variant={availability?.[dayIndex]?.[slot.value] ? 'filled' : 'outlined'}
                    disabled={!editMode}
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const ReviewCard = ({ review }) => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={review.reviewer.profile_picture}>
            {review.reviewer.first_name[0]}
          </Avatar>
          <Box>
            <Typography variant="subtitle2">
              {review.reviewer.first_name} {review.reviewer.last_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(review.created_at).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
        <Rating value={review.overall_rating} readOnly size="small" />
      </Box>
      
      <Typography variant="body2" paragraph>
        {review.comment}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="caption" color="text.secondary">Quality</Typography>
          <Rating value={review.quality_rating} readOnly size="small" />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Communication</Typography>
          <Rating value={review.communication_rating} readOnly size="small" />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Punctuality</Typography>
          <Rating value={review.punctuality_rating} readOnly size="small" />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Professionalism</Typography>
          <Rating value={review.professionalism_rating} readOnly size="small" />
        </Box>
      </Box>
      
      <Divider sx={{ mt: 2 }} />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Job: {review.job.title}
      </Typography>
    </CardContent>
  </Card>
);

const PortfolioItem = ({ item, onDelete, editMode }) => (
  <Card>
    <CardMedia
      component="img"
      height="200"
      image={item.image}
      alt={item.caption}
    />
    <CardContent>
      <Typography variant="caption">{item.caption}</Typography>
      {editMode && (
        <IconButton
          size="small"
          color="error"
          onClick={() => onDelete(item.id)}
          sx={{ float: 'right' }}
        >
          <Delete />
        </IconButton>
      )}
    </CardContent>
  </Card>
);

const Profile = () => {
  const theme = useTheme();
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [profileData, setProfileData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [availability, setAvailability] = useState({});
  const [skillsDialogOpen, setSkillsDialogOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isJobSeeker = user?.account_type === 'jobseeker';

  useEffect(() => {
    fetchProfileData();
    fetchReviews();
    if (isJobSeeker) {
      fetchSkills();
      fetchPortfolio();
    }
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/profile/');
      setProfileData(response.data.user);
      setSelectedSkills(response.data.user.skills || []);
      setAvailability(response.data.user.availability || {});
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      // Fetch reviews for current user
      // This would need an endpoint to get reviews for a specific user
      setReviews([]);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await api.get('/skills/');
      setAllSkills(response.data);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const fetchPortfolio = async () => {
    try {
      // Fetch portfolio items
      setPortfolio([]);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const response = await updateProfile(profileData);
      if (response.success) {
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('profile_picture', file);
      
      try {
        setUploadProgress(30);
        const response = await api.patch('/auth/profile/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          },
        });
        
        setProfileData({ ...profileData, profile_picture: response.data.user.profile_picture });
        setUploadProgress(0);
      } catch (error) {
        console.error('Error uploading avatar:', error);
        setUploadProgress(0);
      }
    }
  };

  const handleAvailabilityChange = (dayIndex, slot) => {
    const newAvailability = { ...availability };
    if (!newAvailability[dayIndex]) {
      newAvailability[dayIndex] = {};
    }
    newAvailability[dayIndex][slot] = !newAvailability[dayIndex][slot];
    setAvailability(newAvailability);
  };

  const handleSkillsSave = () => {
    setProfileData({ ...profileData, skills: selectedSkills });
    setSkillsDialogOpen(false);
  };

  if (loading && !profileData) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid size={{xs:12,md:4}}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
        <Grid size={{xs:12,md:8}}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (!profileData) {
    return <Alert severity="error">Failed to load profile data</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                editMode && (
                  <IconButton
                    component="label"
                    sx={{
                      bgcolor: 'white',
                      '&:hover': { bgcolor: 'grey.100' },
                    }}
                  >
                    <PhotoCamera />
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </IconButton>
                )
              }
            >
              <Avatar
                src={profileData.profile_picture}
                sx={{ width: 100, height: 100, border: '4px solid white' }}
              >
                {profileData.first_name[0]}
              </Avatar>
            </Badge>
            
            <Box>
              <Typography variant="h4" fontWeight="bold">
                {profileData.first_name} {profileData.last_name}
              </Typography>
              <Typography variant="body1">
                {isJobSeeker ? 'Job Seeker' : 'Employer'}
              </Typography>
              {profileData.is_verified && (
                <Chip
                  icon={<Verified />}
                  label="Verified"
                  size="small"
                  sx={{ mt: 1, bgcolor: 'white', color: 'primary.main' }}
                />
              )}
            </Box>
          </Box>
          
          <Box>
            {!editMode ? (
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => setEditMode(true)}
                sx={{ bgcolor: 'white', color: 'primary.main' }}
              >
                Edit Profile
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={() => {
                    setEditMode(false);
                    fetchProfileData();
                  }}
                  sx={{ borderColor: 'white', color: 'white' }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveProfile}
                  disabled={loading}
                  sx={{ bgcolor: 'white', color: 'primary.main' }}
                >
                  Save Changes
                </Button>
              </Box>
            )}
          </Box>
        </Box>
        
        {uploadProgress > 0 && (
          <LinearProgress
            variant="determinate"
            value={uploadProgress}
            sx={{ mt: 2 }}
          />
        )}
      </Paper>

      <Grid container spacing={3}>
        {/* Left Sidebar */}
        <Grid size={{xs:12,md:4}}>
          {/* Stats Card */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Statistics
            </Typography>
            
            {isJobSeeker ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Rating value={profileData.rating} readOnly />
                  <Typography variant="body2">
                    {profileData.rating.toFixed(1)} ({profileData.total_reviews} reviews)
                  </Typography>
                </Box>
                
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Work />
                    </ListItemIcon>
                    <ListItemText
                      primary="Jobs Completed"
                      secondary="24"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AttachMoney />
                    </ListItemIcon>
                    <ListItemText
                      primary="Total Earned"
                      secondary="$3,450"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Schedule />
                    </ListItemIcon>
                    <ListItemText
                      primary="Response Time"
                      secondary="< 1 hour"
                    />
                  </ListItem>
                </List>
              </>
            ) : (
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Work />
                  </ListItemIcon>
                  <ListItemText
                    primary="Jobs Posted"
                    secondary="15"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle />
                  </ListItemIcon>
                  <ListItemText
                    primary="Jobs Completed"
                    secondary="12"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AttachMoney />
                  </ListItemIcon>
                  <ListItemText
                    primary="Total Spent"
                    secondary="$2,890"
                  />
                </ListItem>
              </List>
            )}
          </Paper>

          {/* Contact Info */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Contact Information
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <Email />
                </ListItemIcon>
                <ListItemText
                  primary="Email"
                  secondary={profileData.email}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Phone />
                </ListItemIcon>
                <ListItemText
                  primary="Phone"
                  secondary={editMode ? (
                    <TextField
                      size="small"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      fullWidth
                    />
                  ) : profileData.phone || 'Not provided'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LocationOn />
                </ListItemIcon>
                <ListItemText
                  primary="Location"
                  secondary={editMode ? (
                    <TextField
                      size="small"
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      fullWidth
                    />
                  ) : profileData.location || 'Not provided'}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Main Content */}
                <Grid size={{xs:12,md:8}}>
          <Paper sx={{ p: 3 }}>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
              <Tab label="About" />
              {isJobSeeker && <Tab label="Skills & Portfolio" />}
              {isJobSeeker && <Tab label="Availability" />}
              <Tab label="Reviews" />
            </Tabs>

            {/* About Tab */}
            <TabPanel value={tabValue} index={0}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Bio
                </Typography>
                {editMode ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    sx={{ mb: 3 }}
                  />
                ) : (
                  <Typography variant="body1" paragraph>
                    {profileData.bio || 'No bio provided yet.'}
                  </Typography>
                )}

                {isJobSeeker && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Hourly Rate
                    </Typography>
                    {editMode ? (
                      <TextField
                        type="number"
                        value={profileData.hourly_rate}
                        onChange={(e) => setProfileData({ ...profileData, hourly_rate: e.target.value })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        sx={{ mb: 3, width: 200 }}
                      />
                    ) : (
                      <Typography variant="h5" color="primary.main" paragraph>
                        ${profileData.hourly_rate || '0'}/hour
                      </Typography>
                    )}
                  </>
                )}

                {!isJobSeeker && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Company Information
                    </Typography>
                    {editMode ? (
                      <>
                        <TextField
                          fullWidth
                          label="Company Name"
                          value={profileData.company_name}
                          onChange={(e) => setProfileData({ ...profileData, company_name: e.target.value })}
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Company Description"
                          value={profileData.company_description}
                          onChange={(e) => setProfileData({ ...profileData, company_description: e.target.value })}
                        />
                      </>
                    ) : (
                      <>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {profileData.company_name || 'No company name'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {profileData.company_description || 'No company description'}
                        </Typography>
                      </>
                    )}
                  </>
                )}
              </Box>
            </TabPanel>

            {/* Skills & Portfolio Tab */}
            {isJobSeeker && (
              <TabPanel value={tabValue} index={1}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">
                      Skills
                    </Typography>
                    {editMode && (
                      <Button
                        startIcon={<Add />}
                        onClick={() => setSkillsDialogOpen(true)}
                      >
                        Manage Skills
                      </Button>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 4 }}>
                    {selectedSkills.map((skill) => (
                      <Chip
                        key={skill.id || skill}
                        icon={SkillIcon[skill.name?.toLowerCase()] || <Work />}
                        label={skill.name || skill}
                        color="primary"
                        variant={editMode ? 'outlined' : 'filled'}
                        onDelete={editMode ? () => {
                          setSelectedSkills(selectedSkills.filter(s => s.id !== skill.id));
                        } : undefined}
                      />
                    ))}
                    {selectedSkills.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No skills added yet
                      </Typography>
                    )}
                  </Box>

                  <Typography variant="h6" gutterBottom>
                    Portfolio
                  </Typography>
                  {editMode && (
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      sx={{ mb: 2 }}
                    >
                      Add Portfolio Item
                    </Button>
                  )}
                  
                  <Grid container spacing={2}>
                    {portfolio.length > 0 ? (
                      portfolio.map((item) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                          <PortfolioItem
                            item={item}
                            onDelete={(id) => setPortfolio(portfolio.filter(p => p.id !== id))}
                            editMode={editMode}
                          />
                        </Grid>
                      ))
                    ) : (
                      <Grid size={{xs:12}}>
                        <Alert severity="info">
                          No portfolio items yet. Add photos of your work to showcase your skills!
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </TabPanel>
            )}

            {/* Availability Tab */}
            {isJobSeeker && (
              <TabPanel value={tabValue} index={2}>
                <AvailabilitySchedule
                  availability={availability}
                  onChange={handleAvailabilityChange}
                  editMode={editMode}
                />
              </TabPanel>
            )}

            {/* Reviews Tab */}
            <TabPanel value={tabValue} index={isJobSeeker ? 3 : 1}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Reviews ({reviews.length})
                </Typography>
                
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))
                ) : (
                  <Alert severity="info">
                    No reviews yet. Complete jobs to get reviews from {isJobSeeker ? 'employers' : 'workers'}.
                  </Alert>
                )}
              </Box>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      {/* Skills Dialog */}
      <Dialog open={skillsDialogOpen} onClose={() => setSkillsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Skills</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Select the skills that best describe your expertise
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {allSkills.map((skill) => (
              <Chip
                key={skill.id}
                label={skill.name}
                onClick={() => {
                  const isSelected = selectedSkills.some(s => s.id === skill.id);
                  if (isSelected) {
                    setSelectedSkills(selectedSkills.filter(s => s.id !== skill.id));
                  } else {
                    setSelectedSkills([...selectedSkills, skill]);
                  }
                }}
                color={selectedSkills.some(s => s.id === skill.id) ? 'primary' : 'default'}
                variant={selectedSkills.some(s => s.id === skill.id) ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSkillsDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSkillsSave}>
            Save Skills
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;