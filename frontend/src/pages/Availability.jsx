import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Switch,
  FormControlLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Card,
  CardContent,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  CalendarMonth,
  AccessTime,
  Save,
  ContentCopy,
  Today,
  DateRange,
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parse } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const DaySchedule = ({ day, schedule, onEdit, onDelete, onToggle }) => {
  const theme = useTheme();
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={schedule?.is_available || false}
                  onChange={(e) => onToggle(day, e.target.checked)}
                />
              }
              label={
                <Typography variant="subtitle1" fontWeight="medium">
                  {dayNames[day]}
                </Typography>
              }
            />
          </Box>
          
          {schedule && schedule.is_available && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                icon={<AccessTime />}
                label={`${schedule.start_time} - ${schedule.end_time}`}
                color="primary"
                variant="outlined"
              />
              <IconButton size="small" onClick={() => onEdit(day, schedule)}>
                <Edit />
              </IconButton>
              <IconButton size="small" color="error" onClick={() => onDelete(day)}>
                <Delete />
              </IconButton>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const Availability = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [viewMode, setViewMode] = useState('week');
  const [autoAcceptJobs, setAutoAcceptJobs] = useState(false);
  const [maxJobsPerDay, setMaxJobsPerDay] = useState(3);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const response = await api.get('/availability/');
      const availabilityData = {};
      response.data.forEach(item => {
        availabilityData[item.day_of_week] = item;
      });
      setAvailability(availabilityData);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = async (day, isAvailable) => {
    if (isAvailable && !availability[day]) {
      // Open edit dialog to set times
      setSelectedDay(day);
      setStartTime(parse('09:00', 'HH:mm', new Date()));
      setEndTime(parse('17:00', 'HH:mm', new Date()));
      setEditDialogOpen(true);
    } else {
      // Toggle availability
      try {
        if (availability[day]) {
          await api.patch(`/availability/${availability[day].id}/`, {
            is_available: isAvailable,
          });
        }
        fetchAvailability();
      } catch (error) {
        console.error('Error updating availability:', error);
      }
    }
  };

  const handleEditSchedule = (day, schedule) => {
    setSelectedDay(day);
    setStartTime(parse(schedule.start_time, 'HH:mm:ss', new Date()));
    setEndTime(parse(schedule.end_time, 'HH:mm:ss', new Date()));
    setEditDialogOpen(true);
  };

  const handleSaveSchedule = async () => {
    try {
      const data = {
        day_of_week: selectedDay,
        start_time: format(startTime, 'HH:mm:ss'),
        end_time: format(endTime, 'HH:mm:ss'),
        is_available: true,
      };

      if (availability[selectedDay]) {
        await api.patch(`/availability/${availability[selectedDay].id}/`, data);
      } else {
        await api.post('/availability/', data);
      }

      setEditDialogOpen(false);
      fetchAvailability();
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  const handleDeleteSchedule = async (day) => {
    try {
      if (availability[day]) {
        await api.delete(`/availability/${availability[day].id}/`);
        fetchAvailability();
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const handleCopyToAll = () => {
    // Find a day with schedule to copy
    const dayWithSchedule = Object.values(availability).find(a => a?.is_available);
    if (dayWithSchedule) {
      // Apply to all days
      for (let day = 0; day < 7; day++) {
        if (!availability[day]) {
          api.post('/availability/', {
            day_of_week: day,
            start_time: dayWithSchedule.start_time,
            end_time: dayWithSchedule.end_time,
            is_available: true,
          });
        }
      }
      setTimeout(fetchAvailability, 1000);
    }
  };

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Availability Calendar
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Set your weekly availability to receive relevant job notifications
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              Quick Settings
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoAcceptJobs}
                    onChange={(e) => setAutoAcceptJobs(e.target.checked)}
                  />
                }
                label="Auto-accept matching jobs"
              />
              <TextField
                type="number"
                label="Max jobs per day"
                value={maxJobsPerDay}
                onChange={(e) => setMaxJobsPerDay(e.target.value)}
                InputProps={{ inputProps: { min: 1, max: 10 } }}
                size="small"
              />
              <Button
                variant="outlined"
                startIcon={<ContentCopy />}
                onClick={handleCopyToAll}
                size="small"
              >
                Copy schedule to all days
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                Weekly Schedule
              </Typography>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, v) => v && setViewMode(v)}
                size="small"
              >
                <ToggleButton value="week">
                  <DateRange />
                </ToggleButton>
                <ToggleButton value="month">
                  <CalendarMonth />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Weekly Schedule */}
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <DaySchedule
                key={day}
                day={day}
                schedule={availability[day]}
                onEdit={handleEditSchedule}
                onDelete={handleDeleteSchedule}
                onToggle={handleToggleDay}
              />
            ))}
          </Paper>
        </Grid>
      </Grid>

      {/* Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <CalendarMonth sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" fontWeight="bold">
              {Object.values(availability).filter(a => a?.is_available).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Days Available per Week
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <AccessTime sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" fontWeight="bold">
              {Object.values(availability).reduce((total, a) => {
                if (a?.is_available && a.start_time && a.end_time) {
                  const start = parse(a.start_time, 'HH:mm:ss', new Date());
                  const end = parse(a.end_time, 'HH:mm:ss', new Date());
                  return total + (end - start) / (1000 * 60 * 60);
                }
                return total;
              }, 0).toFixed(0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Hours per Week
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Today sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
            <Typography variant="h4" fontWeight="bold">
              {maxJobsPerDay * Object.values(availability).filter(a => a?.is_available).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Max Jobs per Week
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Schedule Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedDay !== null && `Set Schedule for ${dayNames[selectedDay]}`}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <TimePicker
                label="Start Time"
                value={startTime}
                onChange={setStartTime}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
              <TimePicker
                label="End Time"
                value={endTime}
                onChange={setEndTime}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveSchedule} startIcon={<Save />}>
            Save Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Availability;