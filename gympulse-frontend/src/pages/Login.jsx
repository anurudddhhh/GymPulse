import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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

  // Shared styling for all inputs to keep code clean
  const inputClass = "w-full bg-[#27272a] rounded-2xl px-5 py-4 text-lg font-medium placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-transparent focus:border-blue-500";

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#09090b] text-white p-4 font-sans">
      <div className="w-full max-w-md bg-[#18181b] rounded-3xl p-8 border border-zinc-800/80 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight">Welcome Back</h2>
          <p className="text-zinc-500 font-medium mt-2">Log in to GymPulse to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" name="email" placeholder="Email" onChange={handleChange} required className={inputClass} />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              onChange={handleChange}
              required
              className={`${inputClass} pr-20`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-[18px] text-zinc-500 hover:text-white text-sm font-extrabold transition-colors tracking-wide"
            >
              {showPassword ? "HIDE" : "SHOW"}
            </button>
          </div>

          <button type="submit" className="w-full mt-2 bg-blue-600 text-white py-4 rounded-2xl font-extrabold text-lg shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:bg-blue-500 active:scale-[0.98] transition-all">
            Log In
          </button>
        </form>

        <p className="mt-8 text-center text-zinc-500 font-medium">
          Don't have an account? <Link to="/" className="text-blue-500 hover:text-blue-400 transition-colors">Register</Link>
        </p>
      </div>
    </div>
  );
}