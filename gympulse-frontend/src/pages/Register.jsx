import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', age: '', gender: 'Male', weight: '', height: '', fitnessGoal: 'Muscle Gain'
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', formData);
      localStorage.setItem('token', res.data.token); // Save token to browser
      navigate('/dashboard'); // Send to dashboard
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-card p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-800">
        <h2 className="text-3xl font-bold mb-6 text-center text-primary">Join GymPulse</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="name" placeholder="Full Name" onChange={handleChange} required className="w-full p-3 bg-dark rounded border border-gray-700 focus:border-primary outline-none" />
          <input type="email" name="email" placeholder="Email" onChange={handleChange} required className="w-full p-3 bg-dark rounded border border-gray-700 focus:border-primary outline-none" />
          <input type="password" name="password" placeholder="Password" onChange={handleChange} required className="w-full p-3 bg-dark rounded border border-gray-700 focus:border-primary outline-none" />
          
          <div className="flex gap-4">
            <input type="number" name="age" placeholder="Age" onChange={handleChange} className="w-1/2 p-3 bg-dark rounded border border-gray-700 outline-none" />
            <select name="gender" onChange={handleChange} className="w-1/2 p-3 bg-dark rounded border border-gray-700 outline-none text-gray-400">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div className="flex gap-4">
            <input type="number" name="weight" placeholder="Weight (kg)" onChange={handleChange} className="w-1/2 p-3 bg-dark rounded border border-gray-700 outline-none" />
            <input type="number" name="height" placeholder="Height (cm)" onChange={handleChange} className="w-1/2 p-3 bg-dark rounded border border-gray-700 outline-none" />
          </div>

          <select name="fitnessGoal" onChange={handleChange} className="w-full p-3 bg-dark rounded border border-gray-700 outline-none text-gray-400">
            <option value="Muscle Gain">Muscle Gain</option>
            <option value="Fat Loss">Fat Loss</option>
            <option value="Strength">Strength</option>
            <option value="General Fitness">General Fitness</option>
          </select>

          <button type="submit" className="w-full bg-primary text-white p-3 rounded font-bold hover:bg-blue-600 transition">Register</button>
        </form>
        <p className="mt-4 text-center text-gray-400 text-sm">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}