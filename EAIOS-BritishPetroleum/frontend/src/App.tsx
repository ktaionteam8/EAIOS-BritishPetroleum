import React, { Suspense, lazy, Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('App crash:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', color: '#fff', background: '#0a0f1e', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1 style={{ color: '#ef4444' }}>Runtime Error</h1>
          <pre style={{ color: '#fca5a5', whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
          <pre style={{ color: '#6b7280', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const DashboardRoute = lazy(() => import('./pages/dashboard'));
const RefinerAIRoute = lazy(() => import('./pages/apps/RefinerAI'));
const ArtemisRoute   = lazy(() => import('./pages/apps/Artemis'));

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
    <ErrorBoundary>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/dashboard"       element={<DashboardRoute />} />
            <Route path="/apps/refiner-ai" element={<RefinerAIRoute />} />
            <Route path="/apps/artemis"    element={<ArtemisRoute />} />
            <Route path="/"                element={<Navigate to="/dashboard" replace />} />
            <Route path="*"                element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
