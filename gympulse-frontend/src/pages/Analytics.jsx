import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Analytics() {
  const navigate = useNavigate();
  const [exercisesList, setExercisesList] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchUniqueExercises();
  }, []);

  useEffect(() => {
    if (selectedExercise) {
      fetchExerciseHistory(selectedExercise);
    }
  }, [selectedExercise]);

  const fetchUniqueExercises = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/workouts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const names = new Set();
      res.data.forEach(workout => {
        workout.exercises.forEach(ex => {
          if (ex.exerciseName) {
            // 1. Clean the string: remove trailing spaces and make it all lowercase
            const cleanName = ex.exerciseName.trim().toLowerCase();
            // 2. Capitalize the very first letter for a clean UI
            const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
            names.add(formattedName);
          }
        });
      });
      
      // 3. Convert Set to Array and sort it alphabetically
      const uniqueNames = Array.from(names).sort(); 
      setExercisesList(uniqueNames);
      if (uniqueNames.length > 0) setSelectedExercise(uniqueNames[0]);
    } catch (err) {
      console.error("Failed to fetch exercises list", err);
    }
  };

  const fetchExerciseHistory = async (name) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/workouts/history/${encodeURIComponent(name)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChartData(res.data);
    } catch (err) {
      console.error("Failed to fetch chart data", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 sm:p-6 font-sans pb-24">
      <div className="max-w-2xl mx-auto">
        
        <div className="flex justify-between items-center mb-8 pt-4">
          <div>
            <Link to="/dashboard" className="text-sm font-bold text-blue-500 hover:text-blue-400 transition-colors">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight mt-2">Progress Visualizer</h1>
          </div>
        </div>

        {exercisesList.length === 0 ? (
          <div className="text-center py-16 bg-[#18181b] rounded-3xl border border-zinc-800">
            <p className="text-zinc-400 font-medium">Log workouts with exercises first to map progress curves!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Exercise Selector */}
            <div className="bg-[#18181b] rounded-2xl p-4 border border-zinc-800 flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-500 tracking-wider uppercase px-1">Select Exercise</label>
              <select 
                value={selectedExercise} 
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="w-full bg-[#27272a] rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all"
              >
                {exercisesList.map((name, idx) => (
                  <option key={idx} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Recharts Graphical Rendering */}
            <div className="bg-[#18181b] rounded-3xl p-5 border border-zinc-800 shadow-lg">
              <h3 className="text-sm font-bold text-zinc-400 mb-6 px-2 tracking-wide uppercase">Peak Load (kg) Timeline</h3>
              
              {chartData.length === 0 ? (
                <p className="text-center text-zinc-500 py-12">Insufficient historical sets to calculate trajectory.</p>
              ) : (
                <div className="w-full h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#71717a" 
                        fontSize={12} 
                        fontWeight="bold"
                        tickLine={false} 
                        axisLine={false} 
                        dy={10}
                      />
                      <YAxis 
                        stroke="#71717a" 
                        fontSize={12} 
                        fontWeight="bold"
                        tickLine={false} 
                        axisLine={false} 
                        dx={-5}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', borderColor: '#27272a', color: '#fff' }}
                        itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                        labelStyle={{ color: '#71717a', fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="maxWeight" 
                        name="Peak Weight"
                        stroke="#2563eb" 
                        strokeWidth={3} 
                        activeDot={{ r: 6, stroke: '#09090b', strokeWidth: 2 }} 
                        dot={{ r: 4, stroke: '#2563eb', strokeWidth: 2, fill: '#18181b' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}