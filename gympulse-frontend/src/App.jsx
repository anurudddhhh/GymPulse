import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Register from './pages/Register';
import Login from './pages/Login';
import AppLayout from './components/AppLayout';
import Profile from './pages/Profile';
import History from './pages/History';
import Workout from './pages/Workout';
import Exercises from './pages/Exercises';
import Calories from './pages/Calories';
import Analytics from './pages/Analytics';

// Protects routes from users who aren't logged in
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
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
        {/* Public Routes */}
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Protected App Shell with 5-Tab Navigation */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
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

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/app/workout" replace />} />
      </Routes>
    </Router>
  );
}

export default App;