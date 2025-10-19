import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  InputAdornment,
  FormControlLabel,
  Switch,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Autocomplete,
  Slider,
  FormHelperText,
  RadioGroup,
  Radio,
  FormLabel,
  IconButton,
  Card,
  CardMedia,
  useTheme,
  Collapse,
} from '@mui/material';
import {
  Save,
  Publish,
  ArrowBack,
  ArrowForward,
  AttachMoney,
  LocationOn,
  Schedule,
  Build,
  Add,
  Delete,
  CloudUpload,
  Info,
  CheckCircle,
  AutoAwesome,
} from '@mui/icons-material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import api from '../services/api';

const steps = [
  'Basic Information',
  'Location & Schedule',
  'Budget & Requirements',
  'Additional Details',
  'Review & Publish',
];

const PostJob = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showInstantHire, setShowInstantHire] = useState(false);
  const [showAutoMatch, setShowAutoMatch] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      category: '',
      skills_required: [],
      location_type: 'onsite',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      start_date: null,
      start_time: null,
      end_date: null,
      estimated_duration: 60,
      is_flexible: false,
      urgency: 'medium',
      budget_min: 50,
      budget_max: 200,
      instant_hire_price: '',
      number_of_workers: 1,
      tools_provided: true,
      tools_required: '',
      physical_requirements: 'moderate',
      auto_match_enabled: false,
      auto_match_min_rating: 4.0,
      auto_match_max_distance: 10,
    },
  });

  const watchCategory = watch('category');
  const watchBudgetMax = watch('budget_max');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (watchCategory) {
      fetchTemplates(watchCategory);
    }
  }, [watchCategory]);

  const fetchInitialData = async () => {
    try {
        const [categoriesRes, skillsRes] = await Promise.all([
            api.get('/categories/'),
            api.get('/skills/'),
        ]);

        // --- FIX FOR CATEGORIES ---
        // Assume API uses 'results' key if paginated, otherwise use the whole data.
        const categoryData = categoriesRes.data.results || categoriesRes.data;
        // Ensure it's an array before setting state
        setCategories(Array.isArray(categoryData) ? categoryData : []);
        
        // --- FIX FOR SKILLS ---
        const skillsData = skillsRes.data.results || skillsRes.data;
        // Ensure it's an array before setting state
        setSkills(Array.isArray(skillsData) ? skillsData : []);
        
    } catch (error) {
        console.error('Error fetching initial data:', error);
        // It's good practice to ensure state is set to an array on error
        setCategories([]);
        setSkills([]);
    }
};
  const fetchTemplates = async (category) => {
    try {
      const response = await api.get('/templates/', {
        params: { category },
      });
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setValue('title', template.name);
    setValue('description', template.description_template);
    setValue('estimated_duration', template.estimated_duration);
    setValue('budget_min', template.suggested_min_price);
    setValue('budget_max', template.suggested_max_price);
    setValue('skills_required', template.required_skills);
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Format the data for API
      const formattedData = {
        ...data,
        skills_required: data.skills_required.map(skill => skill.id),
        start_date: data.start_date ? data.start_date.toISOString().split('T')[0] : null,
        start_time: data.start_time ? data.start_time.toTimeString().split(' ')[0] : null,
        end_date: data.end_date ? data.end_date.toISOString().split('T')[0] : null,
        instant_hire_price: showInstantHire ? data.instant_hire_price : null,
        status: 'open',
      };

      const response = await api.post('/jobs/create/', formattedData);
      
      // Show success message
      navigate(`/employer/jobs/${response.data.id}`, {
        state: { message: 'Job posted successfully!' }
      });
    } catch (error) {
      console.error('Error posting job:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Basic Information
        return (
          <Box>
            {/* Template Selection */}
            {templates.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Quick Start with Templates
                </Typography>
                <Grid container spacing={2}>
                  {templates.slice(0, 3).map((template) => (
                    <Grid item xs={12} md={4} key={template.id}>
                      <Card
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          border: selectedTemplate?.id === template.id ? 2 : 1,
                          borderColor: selectedTemplate?.id === template.id 
                            ? 'primary.main' 
                            : 'divider',
                        }}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <Typography variant="subtitle2" gutterBottom>
                          {template.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ${template.suggested_min_price} - ${template.suggested_max_price}
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: 'Category is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.category}>
                      <InputLabel>Job Category *</InputLabel>
                      <Select {...field} label="Job Category *">
                        {Array.isArray(categories) && categories.map((category) => (
                            <MenuItem key={category.id} value={category.name}>
                                {category.display_name}
                            </MenuItem>
                        ))}
                        </Select>
                      {errors.category && (
                        <FormHelperText>{errors.category.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="title"
                  control={control}
                  rules={{ required: 'Job title is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Job Title *"
                      placeholder="e.g., Garden Cleanup, Moving Help, Event Setup"
                      error={!!errors.title}
                      helperText={errors.title?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  rules={{ 
                    required: 'Description is required',
                    minLength: {
                      value: 50,
                      message: 'Description must be at least 50 characters'
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={6}
                      label="Job Description *"
                      placeholder="Describe the work that needs to be done..."
                      error={!!errors.description}
                      helperText={errors.description?.message || `${field.value?.length || 0} characters`}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="skills_required"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      multiple
                      options={skills || []} // This ensures 'skills' is an array, or defaults to []
                      getOptionLabel={(option) => option.name}
                      onChange={(_, value) => field.onChange(value)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Required Skills"
                          placeholder="Select skills"
                          helperText="Choose skills that match your job requirements"
                        />
                      )}
                     // PostJob.jsx (Lines 335-347) - FIX
renderTags={(value, getTagProps) =>
  value.map((option, index) => {
    // 1. Get ALL props, including key
    const { key, ...tagProps } = getTagProps({ index }); 
    
    return (
      <Chip
        // 2. Pass the extracted 'key' directly
        key={key} 
        
        // 3. Spread the remaining props (without the key)
        {...tagProps} 
        
        variant="outlined"
        label={option.name}
      />
    );
  })
}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="urgency"
                  control={control}
                  render={({ field }) => (
                    <FormControl>
                      <FormLabel>How urgent is this job?</FormLabel>
                      <RadioGroup {...field} row>
                        <FormControlLabel 
                          value="low" 
                          control={<Radio />} 
                          label="Low - Flexible timing" 
                        />
                        <FormControlLabel 
                          value="medium" 
                          control={<Radio />} 
                          label="Medium - Within a week" 
                        />
                        <FormControlLabel 
                          value="high" 
                          control={<Radio />} 
                          label="High - Within 2-3 days" 
                        />
                        <FormControlLabel 
                          value="urgent" 
                          control={<Radio />} 
                          label="Urgent - ASAP" 
                        />
                      </RadioGroup>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1: // Location & Schedule
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Controller
                  name="location_type"
                  control={control}
                  render={({ field }) => (
                    <FormControl>
                      <FormLabel>Work Location</FormLabel>
                      <RadioGroup {...field} row>
                        <FormControlLabel 
                          value="onsite" 
                          control={<Radio />} 
                          label="On-site" 
                        />
                        <FormControlLabel 
                          value="remote" 
                          control={<Radio />} 
                          label="Remote" 
                        />
                      </RadioGroup>
                    </FormControl>
                  )}
                />
              </Grid>

              {watch('location_type') === 'onsite' && (
                <>
                  <Grid item xs={12}>
                    <Controller
                      name="address"
                      control={control}
                      rules={{ required: 'Address is required for on-site jobs' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Street Address *"
                          error={!!errors.address}
                          helperText={errors.address?.message}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LocationOn />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      name="city"
                      control={control}
                      rules={{ required: 'City is required' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="City *"
                          error={!!errors.city}
                          helperText={errors.city?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      name="state"
                      control={control}
                      rules={{ required: 'State is required' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="State *"
                          error={!!errors.state}
                          helperText={errors.state?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      name="zip_code"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="ZIP Code"
                        />
                      )}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Controller
                    name="start_date"
                    control={control}
                    rules={{ required: 'Start date is required' }}
                    render={({ field }) => (
                      <DatePicker
                        {...field}
                        label="Start Date *"
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            error={!!errors.start_date}
                            helperText={errors.start_date?.message}
                          />
                        )}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Controller
                    name="start_time"
                    control={control}
                    render={({ field }) => (
                      <TimePicker
                        {...field}
                        label="Start Time"
                        renderInput={(params) => (
                          <TextField {...params} fullWidth />
                        )}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="estimated_duration"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Estimated Duration (minutes)"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Schedule />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="is_flexible"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Flexible schedule"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2: // Budget & Requirements
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Budget Range
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Set a competitive budget to attract quality workers
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="budget_min"
                  control={control}
                  rules={{ 
                    required: 'Minimum budget is required',
                    min: { value: 10, message: 'Minimum budget must be at least $10' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Minimum Budget *"
                      error={!!errors.budget_min}
                      helperText={errors.budget_min?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="budget_max"
                  control={control}
                  rules={{ 
                    required: 'Maximum budget is required',
                    validate: value => 
                      value > watch('budget_min') || 'Maximum must be greater than minimum'
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Maximum Budget *"
                      error={!!errors.budget_max}
                      helperText={errors.budget_max?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 2, mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showInstantHire}
                        onChange={(e) => setShowInstantHire(e.target.checked)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle2">
                          Enable Instant Hire
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Allow highly-rated workers to accept immediately at a premium price
                        </Typography>
                      </Box>
                    }
                  />
                </Box>

                <Collapse in={showInstantHire}>
                  <Controller
                    name="instant_hire_price"
                    control={control}
                    rules={{
                      validate: value => 
                        !showInstantHire || (value > watchBudgetMax) || 
                        'Instant hire price must be greater than maximum budget'
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        label="Instant Hire Price"
                        error={!!errors.instant_hire_price}
                        helperText={
                          errors.instant_hire_price?.message || 
                          `Suggested: $${Math.round(watchBudgetMax * 1.2)}`
                        }
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">$</InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Collapse>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="number_of_workers"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Number of Workers Needed"
                      InputProps={{
                        inputProps: { min: 1, max: 10 }
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="physical_requirements"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Physical Requirements</InputLabel>
                      <Select {...field} label="Physical Requirements">
                        <MenuItem value="light">Light Work</MenuItem>
                        <MenuItem value="moderate">Moderate Physical Work</MenuItem>
                        <MenuItem value="heavy">Heavy Lifting Required</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="tools_provided"
                  control={control}
                  render={({ field }) => (
                    <FormControl>
                      <FormLabel>Tools & Equipment</FormLabel>
                      <RadioGroup {...field} row>
                        <FormControlLabel 
                          value={true} 
                          control={<Radio />} 
                          label="I will provide all tools" 
                        />
                        <FormControlLabel 
                          value={false} 
                          control={<Radio />} 
                          label="Worker must bring tools" 
                        />
                      </RadioGroup>
                    </FormControl>
                  )}
                />
              </Grid>

              {!watch('tools_provided') && (
                <Grid item xs={12}>
                  <Controller
                    name="tools_required"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        multiline
                        rows={2}
                        label="Tools Required"
                        placeholder="List the tools workers need to bring..."
                      />
                    )}
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        );

      case 3: // Additional Details
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 2, mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showAutoMatch}
                        onChange={(e) => setShowAutoMatch(e.target.checked)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle2">
                          Enable Auto-Match
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Automatically match with qualified workers based on your criteria
                        </Typography>
                      </Box>
                    }
                  />
                </Box>

                <Collapse in={showAutoMatch}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography gutterBottom>
                        Minimum Worker Rating
                      </Typography>
                      <Controller
                        name="auto_match_min_rating"
                        control={control}
                        render={({ field }) => (
                          <Slider
                            {...field}
                            min={3}
                            max={5}
                            step={0.1}
                            marks={[
                              { value: 3, label: '3.0' },
                              { value: 4, label: '4.0' },
                              { value: 5, label: '5.0' },
                            ]}
                            valueLabelDisplay="on"
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography gutterBottom>
                        Maximum Distance (km)
                      </Typography>
                      <Controller
                        name="auto_match_max_distance"
                        control={control}
                        render={({ field }) => (
                          <Slider
                            {...field}
                            min={1}
                            max={50}
                            marks={[
                              { value: 1, label: '1km' },
                              { value: 25, label: '25km' },
                              { value: 50, label: '50km' },
                            ]}
                            valueLabelDisplay="on"
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Collapse>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Add Photos (Optional)
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Upload photos to help workers understand the job better
                </Typography>
                
                <Box
                  sx={{
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1">
                    Click to upload or drag and drop
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    PNG, JPG up to 5MB
                  </Typography>
                </Box>

                {uploadedImages.length > 0 && (
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    {uploadedImages.map((image, index) => (
                      <Grid item xs={6} md={3} key={index}>
                        <Card>
                          <CardMedia
                            component="img"
                            height="100"
                            image={image}
                            alt={`Upload ${index + 1}`}
                          />
                          <IconButton
                            size="small"
                            sx={{ position: 'absolute', top: 0, right: 0 }}
                            onClick={() => {
                              setUploadedImages(uploadedImages.filter((_, i) => i !== index));
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Box>
        );

      case 4: // Review & Publish
        const formData = watch();
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Please review your job posting before publishing
            </Alert>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                {formData.title}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Chip
                  label={categories.find(c => c.name === formData.category)?.display_name}
                  color="primary"
                />
                <Chip
                  label={formData.urgency?.toUpperCase() || 'MEDIUM'}
                  color={
                    formData.urgency === 'urgent' ? 'error' :
                    formData.urgency === 'high' ? 'warning' :
                    formData.urgency === 'medium' ? 'info' : 'success'
                  }
                />
                {showInstantHire && (
                  <Chip
                    icon={<AutoAwesome />}
                    label={`Instant Hire: $${formData.instant_hire_price}`}
                    color="success"
                  />
                )}
              </Box>

              <Typography variant="body1" paragraph>
                {formData.description}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1">
                    {formData.location_type === 'onsite' 
                      ? `${formData.address}, ${formData.city}, ${formData.state}`
                      : 'Remote'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Schedule
                  </Typography>
                  <Typography variant="body1">
                    {formData.start_date && new Date(formData.start_date).toLocaleDateString()}
                    {formData.is_flexible && ' (Flexible)'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Budget Range
                  </Typography>
                  <Typography variant="body1" color="primary.main" fontWeight="bold">
                    ${formData.budget_min} - ${formData.budget_max}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Workers Needed
                  </Typography>
                  <Typography variant="body1">
                    {formData.number_of_workers} worker(s)
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Required Skills
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    {formData.skills_required.map((skill) => (
                      <Chip key={skill.id} label={skill.name} size="small" />
                    ))}
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Save />}
                  onClick={() => console.log('Save as draft')}
                >
                  Save as Draft
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Publish />}
                  onClick={handleSubmit(onSubmit)}
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  {loading ? 'Publishing...' : 'Publish Job'}
                </Button>
              </Box>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Post a New Job
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Find the perfect worker for your task
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel
                    onClick={() => setActiveStep(index)}
                    sx={{ cursor: 'pointer' }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ mt: 3 }}>
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  Tips for a great job post:
                </Typography>
                <Typography variant="caption" component="ul" sx={{ pl: 2 }}>
                  <li>Be specific about the work needed</li>
                  <li>Set a competitive budget</li>
                  <li>Include photos if possible</li>
                  <li>Mention any special requirements</li>
                </Typography>
              </Alert>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 4 }}>
            {renderStepContent()}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBack />}
              >
                Back
              </Button>
              {activeStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                >
                  Next
                </Button>
              ) : null}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PostJob;