import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  // 1. New state variable to track password visibility
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-card p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-800">
        <h2 className="text-3xl font-bold mb-6 text-center text-primary">GymPulse Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            name="email" 
            placeholder="Email" 
            onChange={handleChange} 
            required 
            className="w-full p-3 bg-dark rounded border border-gray-700 focus:border-primary outline-none" 
          />
          
          {/* 2. Password wrapper with the toggle button */}
          <div className="relative">
            <input 
              // 3. Toggles between text and password type
              type={showPassword ? "text" : "password"} 
              name="password" 
              placeholder="Password" 
              onChange={handleChange} 
              required 
              className="w-full p-3 bg-dark rounded border border-gray-700 focus:border-primary outline-none pr-16" 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-white text-sm font-bold transition-colors"
            >
              {showPassword ? "HIDE" : "SHOW"}
            </button>
          </div>

          <button type="submit" className="w-full bg-primary text-white p-3 rounded font-bold hover:bg-blue-600 transition">Log In</button>
        </form>
        <p className="mt-4 text-center text-gray-400 text-sm">
          Don't have an account? <Link to="/" className="text-primary hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}