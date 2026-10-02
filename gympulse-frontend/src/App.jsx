import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-react';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { setTokenGetter } from './api';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
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
      {/* Clerk token bridge */}
      <ClerkTokenBridge />

      {/* Global Toaster with Minimalist Slate Styling */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#181a1f',
            color: '#f4f5f7',
            border: '1px solid #272a33',
            borderRadius: '14px',
            fontWeight: 600,
            fontSize: '13px',
            fontFamily: 'system-ui, sans-serif',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
          },
          success: {
            iconTheme: { primary: '#3b82f6', secondary: '#ffffff' },
          },
          error: {
            iconTheme: { primary: '#f43f5e', secondary: '#ffffff' },
          },
        }}
      />

      <Routes>
        {/* Public Auth Routes */}
        <Route path="/sign-in/*" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/sign-up/*" element={<PublicOnly><Register /></PublicOnly>} />

        {/* Onboarding Wizard Routes (standalone & nested support) */}
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <Onboarding />
            </RequireAuth>
          }
        />

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
          <Route path="onboarding" element={<Onboarding />} />
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