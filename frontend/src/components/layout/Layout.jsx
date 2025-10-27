import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  useTheme,
  useMediaQuery,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Work,
  Gavel,
  BookmarkBorder,
  AccountCircle,
  Settings,
  Logout,
  Notifications,
  LightMode,
  DarkMode,
  Add,
  History,
  Star,
  Groups,
  Assignment,
  Assessment,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useAppTheme } from '../../theme/ThemeProvider';

const Layout = () => {
  const theme = useTheme();
  const { mode, toggleColorMode } = useAppTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isEmployer = user?.account_type === 'employer';

  const menuItems = isEmployer
    ? [
             { text: 'Dashboard', icon: <Dashboard />, path: '/employer/dashboard' },
      { text: 'Post New Job', icon: <Add />, path: '/employer/post-job' },
      { text: 'My Jobs', icon: <Assignment />, path: '/employer/jobs' },
      { text: 'Workers', icon: <Groups />, path: '/employer/workers' },
      { text: 'History', icon: <History />, path: '/employer/history' },
      { text: 'Analytics', icon: <Assessment />, path: '/employer/analytics' },
      ]
    : [
        { text: 'Dashboard', icon: <Dashboard />, path: '/jobseeker/dashboard' },
        { text: 'Find Jobs', icon: <Work />, path: '/jobs' },
        { text: 'My Bids', icon: <Gavel />, path: '/jobseeker/bids' },
        { text: 'Saved Jobs', icon: <BookmarkBorder />, path: '/jobseeker/saved' },
        { text: 'My Crews', icon: <Groups />, path: '/jobseeker/crews' },
        { text: 'Reviews', icon: <Star />, path: '/jobseeker/reviews' },
      ];

  const drawer = (
    <Box>
      <Toolbar>
        <Typography
          variant="h5"
          sx={{
            fontFamily: "'Black Ops One', cursive",
            fontWeight: 400,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          EmployEra
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) handleDrawerToggle();
              }}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: theme.palette.action.selected,
                  borderRight: `3px solid ${theme.palette.primary.main}`,
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - 240px)` },
          ml: { md: '240px' },
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap component="div">
              {isEmployer ? 'Employer Portal' : 'Job Seeker Portal'}
            </Typography>
          </Box>

          {isEmployer && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/employer/post-job')}
              sx={{ mr: 2 }}
            >
              Post Job
            </Button>
          )}

          <IconButton color="inherit" onClick={toggleColorMode}>
            {mode === 'light' ? <DarkMode /> : <LightMode />}
          </IconButton>

          <IconButton color="inherit">
            <Badge badgeContent={4} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <IconButton onClick={handleProfileMenuOpen} sx={{ ml: 2 }}>
            <Avatar
              alt={user?.first_name}
              src={user?.profile_picture}
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 35,
                height: 35,
              }}
            >
              {user?.first_name?.[0]}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: 240 }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 240,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 240,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - 240px)` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          bgcolor: theme.palette.background.default,
        }}
      >
        <Outlet />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { mt: 1.5 },
        }}
      >
        <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Layout;