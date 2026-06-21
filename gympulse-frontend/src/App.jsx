import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // 1. Added this import
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LogWorkout from './pages/LogWorkout';
import Analytics from './pages/Analytics';

// Protects routes from users who aren't logged in
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      {/* 2. Added Global Toaster configured for your dark theme */}
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#18181b', // Zinc-900 matching your dashboard cards
            color: '#fff',
            border: '1px solid #27272a', // Zinc-800 border
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '14px font-sans',
          },
          success: {
            iconTheme: { primary: '#3b82f6', secondary: '#fff' }, // Blue accent
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' }, // Red accent
          },
        }} 
      />
      
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/log-workout" element={<ProtectedRoute><LogWorkout /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;