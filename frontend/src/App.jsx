import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import AuthPage from './pages/AuthPage';
import JobSeekerDashboard from './pages/JobSeekerDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import JobListing from './pages/JobListing';
import PostJob from './pages/PostJob';
import JobDetails from './pages/JobDetails';
import MyBids from './pages/MyBids';
import EmployerJobs from './pages/EmployerJobs';
import SavedJobs from './pages/SavedJobs';
import Reviews from './pages/Reviews';
import Availability from './pages/Availability';
import Analytics from './pages/Analytics';
// import Profile from './pages/Profile';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<AuthPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />

            {/* Protected Routes with Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Job Seeker Routes */}
              <Route
                path="/jobseeker/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['jobseeker']}>
                    <JobSeekerDashboard />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/jobseeker/bids"
                element={
                  <ProtectedRoute allowedRoles={['jobseeker']}>
                    <MyBids />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/jobseeker/saved"
                element={
                  <ProtectedRoute allowedRoles={['jobseeker']}>
                    <SavedJobs />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/jobseeker/reviews"
                element={
                  <ProtectedRoute allowedRoles={['jobseeker']}>
                    <Reviews />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/jobseeker/availability"
                element={
                  <ProtectedRoute allowedRoles={['jobseeker']}>
                    <Availability />
                  </ProtectedRoute>
                }
              />
              
              {/* Employer Routes */}
              <Route
                path="/employer/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['employer']}>
                    <EmployerDashboard />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/employer/post-job"
                element={
                  <ProtectedRoute allowedRoles={['employer']}>
                    <PostJob />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/employer/jobs"
                element={
                  <ProtectedRoute allowedRoles={['employer']}>
                    <EmployerJobs />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/employer/analytics"
                element={
                  <ProtectedRoute allowedRoles={['employer']}>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              
              {/* Common Routes */}
              <Route
                path="/jobs"
                element={
                  <ProtectedRoute>
                    <JobListing />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/jobs/:id"
                element={
                  <ProtectedRoute>
                    <JobDetails />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/employer/jobs/:id"
                element={
                  <ProtectedRoute allowedRoles={['employer']}>
                    <JobDetails />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;