import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', age: '', gender: 'Male', weight: '', height: '', fitnessGoal: 'Muscle Gain'
  });
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const toastId = toast.loading('Creating your account...');
    
    try {
      // FIX: Send the entire formData object to the backend
      await axios.post('http://localhost:5000/api/auth/register', formData);
      
      toast.success('Account created successfully! Please log in.', { id: toastId });
      navigate('/login');
    } catch (err) {
      console.log("Registration Error:", err); // Helpful for debugging
      const errorMsg = err.response?.data?.message || 'Registration failed. Try again.';
      toast.error(errorMsg, { id: toastId });
    }
  };


  const inputClass = "w-full bg-[#27272a] rounded-2xl px-5 py-4 text-lg font-medium placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-transparent focus:border-blue-500";

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#09090b] text-white p-4 font-sans pb-12 pt-12">
      <div className="w-full max-w-md bg-[#18181b] rounded-3xl p-8 border border-zinc-800/80 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight">Join GymPulse</h2>
          <p className="text-zinc-500 font-medium mt-2">Start tracking your progress.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="name" placeholder="Full Name" onChange={handleChange} required className={inputClass} />
          <input type="email" name="email" placeholder="Email" onChange={handleChange} required className={inputClass} />
          <input type="password" name="password" placeholder="Password" onChange={handleChange} required className={inputClass} />

          <div className="flex gap-4">
            <input type="number" name="age" placeholder="Age" onChange={handleChange} className={inputClass} />
            <select name="gender" onChange={handleChange} className={`${inputClass} text-zinc-400 appearance-none`}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div className="flex gap-4">
            <input type="number" name="weight" placeholder="Weight (kg)" onChange={handleChange} className={inputClass} />
            <input type="number" name="height" placeholder="Height (cm)" onChange={handleChange} className={inputClass} />
          </div>

          <select name="fitnessGoal" onChange={handleChange} className={`${inputClass} text-zinc-400 appearance-none`}>
            <option value="Muscle Gain">Muscle Gain</option>
            <option value="Fat Loss">Fat Loss</option>
            <option value="Strength">Strength</option>
            <option value="General Fitness">General Fitness</option>
          </select>

          <button type="submit" className="w-full mt-4 bg-blue-600 text-white py-4 rounded-2xl font-extrabold text-lg shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:bg-blue-500 active:scale-[0.98] transition-all">
            Create Account
          </button>
        </form>

        <p className="mt-8 text-center text-zinc-500 font-medium">
          Already have an account? <Link to="/login" className="text-blue-500 hover:text-blue-400 transition-colors">Log in</Link>
        </p>
      </div>
    </div>
  );
}