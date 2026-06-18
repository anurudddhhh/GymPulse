import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';

// 1. Frontend Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  // If there is no token, kick them back to the login page
  return token ? children : <Navigate to="/login" />;
};

// 2. Updated Dashboard with Logout Button
const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token'); // Delete the JWT token
    navigate('/login'); // Send back to login screen
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl text-accent font-bold mb-6">Dashboard (Coming Soon)</h1>
      <button 
        onClick={handleLogout} 
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-bold transition"
      >
        Log Out
      </button>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        
        {/* We wrap the Dashboard in our new ProtectedRoute logic */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;