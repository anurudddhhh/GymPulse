import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-react';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { setTokenGetter } from './api';
import Login from './pages/Login';
import Register from './pages/Register';
import AppLayout from './components/AppLayout';
import Profile from './pages/Profile';
import History from './pages/History';
import Workout from './pages/Workout';
import Exercises from './pages/Exercises';
import Calories from './pages/Calories';
import Analytics from './pages/Analytics';

// Initializes the centralized Axios token getter from Clerk's auth hook
function ClerkTokenBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenGetter(() => getToken());
  }, [getToken]);

  return null;
}

// Redirects signed-out users to the sign-in page
function RequireAuth({ children }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><Navigate to="/sign-in" replace /></SignedOut>
    </>
  );
}

// Redirects signed-in users away from auth pages
function PublicOnly({ children }) {
  return (
    <>
      <SignedIn><Navigate to="/app/workout" replace /></SignedIn>
      <SignedOut>{children}</SignedOut>
    </>
  );
}

function App() {
  return (
    <Router>
      {/* Clerk token bridge -- must be inside Router and ClerkProvider */}
      <ClerkTokenBridge />

      {/* Global Toaster configured for the dark theme */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#18181b',
            color: '#fff',
            border: '1px solid #27272a',
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '14px',
            fontFamily: 'system-ui, sans-serif',
          },
          success: {
            iconTheme: { primary: '#3b82f6', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />

      <Routes>
        {/* Public Auth Routes */}
        <Route path="/sign-in/*" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/sign-up/*" element={<PublicOnly><Register /></PublicOnly>} />

        {/* Protected App Shell with 5-Tab Navigation */}
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/app/workout" replace />} />
          <Route path="profile" element={<Profile />} />
          <Route path="history" element={<History />} />
          <Route path="workout" element={<Workout />} />
          <Route path="exercises" element={<Exercises />} />
          <Route path="calories" element={<Calories />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        {/* Root redirects based on auth state */}
        <Route path="/" element={
          <>
            <SignedIn><Navigate to="/app/workout" replace /></SignedIn>
            <SignedOut><Navigate to="/sign-in" replace /></SignedOut>
          </>
        } />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;