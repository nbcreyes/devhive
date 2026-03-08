import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import useAuthStore from '@/stores/authStore';
import useSocketStore from '@/stores/socketStore';

// Pages — will be created in Step 20
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import AppLayout from '@/pages/AppLayout';

/**
 * Route guard that redirects unauthenticated users to login.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * Route guard that redirects authenticated users away from auth pages.
 */
function AuthRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return children;
}

function App() {
  const { fetchMe, user, isAuthenticated } = useAuthStore();
  const { connect, disconnect } = useSocketStore();

  // Restore session on app load
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Connect socket when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      connect(user.id);
    } else {
      disconnect();
    }
  }, [isAuthenticated, user, connect, disconnect]);

  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route
            path="/login"
            element={<AuthRoute><LoginPage /></AuthRoute>}
          />
          <Route
            path="/register"
            element={<AuthRoute><RegisterPage /></AuthRoute>}
          />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route
            path="/app/*"
            element={<ProtectedRoute><AppLayout /></ProtectedRoute>}
          />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="bottom-right" />
    </TooltipProvider>
  );
}

export default App;