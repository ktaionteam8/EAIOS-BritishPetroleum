import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

const LoginRoute     = lazy(() => import('./pages/login'));
const DashboardRoute = lazy(() => import('./pages/dashboard'));
const RefinerAIRoute = lazy(() => import('./pages/apps/RefinerAI'));
const ArtemisRoute   = lazy(() => import('./pages/apps/Artemis'));

/** Redirects unauthenticated users to /login. */
const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-bp-dark flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <svg className="animate-spin w-10 h-10 text-bp-blue" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-gray-500 text-sm">Loading EAIOS...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/login"           element={<LoginRoute />} />
            <Route path="/dashboard"       element={<PrivateRoute element={<DashboardRoute />} />} />
            <Route path="/apps/refiner-ai" element={<PrivateRoute element={<RefinerAIRoute />} />} />
            <Route path="/apps/artemis"    element={<PrivateRoute element={<ArtemisRoute />} />} />
            <Route path="/"                element={<Navigate to="/dashboard" replace />} />
            <Route path="*"                element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
