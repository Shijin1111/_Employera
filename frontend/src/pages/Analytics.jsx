import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  useTheme,
  Chip,
  Avatar,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  People,
  Work,
  Schedule,
  Star,
  Download,
  FilterList,
  Assessment,
  PieChart,
  BarChart,
  ShowChart,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// StatCard component remains the same
const StatCard = ({ title, value, change, icon, color }) => {
  const theme = useTheme();
  const isPositive = change >= 0;
  
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}.light`, width: 48, height: 48 }}>
            {icon}
          </Avatar>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isPositive ? (
            <TrendingUp sx={{ fontSize: 20, color: 'success.main' }} />
          ) : (
            <TrendingDown sx={{ fontSize: 20, color: 'error.main' }} />
          )}
          <Typography
            variant="body2"
            color={isPositive ? 'success.main' : 'error.main'}
          >
            {Math.abs(change)}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            vs last period
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const Analytics = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);
  
  // CHANGED: Updated state to include 'change' percentages
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalJobs: 0,
      totalJobsChange: 0,
      totalSpent: 0,
      totalSpentChange: 0,
      avgJobCost: 0,
      avgJobCostChange: 0,
      totalWorkers: 0,
      totalWorkersChange: 0,
      avgCompletionTime: 0,
      avgCompletionTimeChange: 0,
      avgRating: 0,
      avgRatingChange: 0,
    },
    jobsOverTime: [],
    costsByCategory: [],
    topWorkers: [],
    completionRates: [],
    bidAnalytics: [],
  });

  const isEmployer = user?.account_type === 'employer';

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]); // This will refetch data when the timeRange changes

  // CHANGED: Replaced mockData with an actual API call
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // 1. Make the API call
      const response = await api.get('/analytics/', { // <-- CHANGED: Removed extra '/api'
        params: { range: timeRange }, // Pass the timeRange as a query param
      });
      
      // 2. Set the state with the data from the API
      //    (Assumes API response.data matches the analyticsData structure)
      setAnalyticsData(response.data);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      // You could set an error state here to show a message to the user
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your {isEmployer ? 'hiring' : 'work'} performance and insights
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="week">Last Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
              <MenuItem value="quarter">Last Quarter</MenuItem>
              <MenuItem value="year">Last Year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Download />}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Overview Stats */}
      {/* CHANGED: Corrected Grid syntax (from 'size' prop to 'item' + 'xs/sm/md') */}
      {/* CHANGED: Updated 'change' prop to use dynamic data from state */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Total Jobs"
            value={analyticsData.overview.totalJobs}
            change={analyticsData.overview.totalJobsChange.toFixed(2)}
            icon={<Work />}
            color={theme.palette.primary}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Total Spent"
            value={`$${analyticsData.overview.totalSpent.toFixed(2)}`}
            change={analyticsData.overview.totalSpentChange.toFixed(2)}
            icon={<AttachMoney />}
            color={theme.palette.success}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Avg Cost"
            value={`$${analyticsData.overview.avgJobCost.toFixed(2)}`}
            change={analyticsData.overview.avgJobCostChange.toFixed(2)}
            icon={<Assessment />}
            color={theme.palette.warning}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Workers Hired"
            value={analyticsData.overview.totalWorkers}
            change={analyticsData.overview.totalWorkersChange.toFixed(2)}
            icon={<People />}
            color={theme.palette.info}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Avg Time"
            value={`${analyticsData.overview.avgCompletionTime.toFixed(1)} days`}
            change={analyticsData.overview.avgCompletionTimeChange.toFixed(2)}
            icon={<Schedule />}
            color={theme.palette.secondary}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Avg Rating"
            value={analyticsData.overview.avgRating.toFixed(1)}
            change={analyticsData.overview.avgRatingChange.toFixed(2)}
            icon={<Star />}
            color={theme.palette.warning}
          />
        </Grid>
      </Grid>

     {/* Charts */}
{/* CHANGED: Reverted Grid props to 'size' to match old styling */}
<Grid container spacing={3} sx={{ mb: 4 }}>
  {/* Jobs Over Time */}
  <Grid size={{xs:12,md:8}}> {/* <-- Reverted from item xs={12} md={8} */}
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Jobs & Spending Trend
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={analyticsData.jobsOverTime}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="jobs"
            stroke={theme.palette.primary.main}
            fill={theme.palette.primary.light}
            name="Jobs"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cost"
            stroke={theme.palette.success.main}
            name="Cost ($)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  </Grid>

  {/* Category Distribution */}
  <Grid size={{xs:12,md:4}}> {/* <-- Reverted from item xs={12} md={4} */}
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Jobs by Category
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsPieChart>
          <Pie
            data={analyticsData.costsByCategory}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.name}: ${entry.percentage.toFixed(2)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {analyticsData.costsByCategory.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </RechartsPieChart>
      </ResponsiveContainer>
    </Paper>
  </Grid>

  {/* Bids per Job */}
  <Grid size={{xs:12,md:6}}> {/* <-- Reverted from item xs={12} md={6} */}
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Bids per Job Distribution
      </Typography>
      <ResponsiveContainer width="100%" height={250}>
        <RechartsBarChart data={analyticsData.bidAnalytics}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="range" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill={theme.palette.primary.main} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </Paper>
  </Grid>

  {/* Completion Rates */}
  <Grid size={{xs:12,md:6}}>
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Job Completion Rates
      </Typography>
      <Box sx={{ mt: 3 }}>
        {analyticsData.completionRates.map((item) => (
          <Box key={item.status} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">{item.status}</Typography>
              <Typography variant="body2" fontWeight="medium">
                {item.value.toFixed(2)}%  {/* <--- CHANGE IS HERE */}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={item.value}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: item.color,
                },
              }}
            />
          </Box>
        ))}
      </Box>
    </Paper>
  </Grid>
</Grid>

      {/* Top Workers Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Top Performing Workers
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Worker</TableCell>
                <TableCell align="center">Jobs Completed</TableCell>
                <TableCell align="center">Rating</TableCell>
                <TableCell align="right">Total Paid</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analyticsData.topWorkers.map((worker, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {worker.name.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">{worker.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={worker.jobs} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                      <Typography variant="body2">{worker.rating.toFixed(1)}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      ${worker.earnings.toFixed(2)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Analytics;