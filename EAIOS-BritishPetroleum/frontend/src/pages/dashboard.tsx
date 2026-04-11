import React from 'react';
import { Navigate } from 'react-router-dom';
import { LandingPage } from '../components/LandingPage';
import { useAuth } from '../context/AuthContext';

const DashboardRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Not logged in — redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <LandingPage />;
};

export default DashboardRoute;
