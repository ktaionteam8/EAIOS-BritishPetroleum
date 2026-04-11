import React from 'react';
import { Navigate } from 'react-router-dom';
import { LoginPage } from '../components/LoginPage';
import { useAuth } from '../context/AuthContext';

const LoginRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Already logged in — redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage />;
};

export default LoginRoute;
