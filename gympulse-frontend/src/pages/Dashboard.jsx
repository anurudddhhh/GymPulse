import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
  const [workouts, setWorkouts] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkouts();
    fetchActivity();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/workouts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWorkouts(res.data);
    } catch (err) {
      if (err.response?.status === 401) handleLogout(); 
    }
  };

  const fetchActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/workouts/activity', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // We don't need to pad 365 days anymore, just store the raw active dates
      setActivityData(res.data);
    } catch (err) {
      console.error("Failed to fetch activity data", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this workout?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/workouts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWorkouts(workouts.filter(workout => workout._id !== id));
      fetchActivity(); // Refresh fire dates
    } catch (err) {
      alert('Failed to delete workout');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // --- Custom Monthly Calendar Logic ---
  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get total days in the month and what day of the week it starts on
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // 1. Render Weekday Headers
    weekDays.forEach(day => {
      days.push(
        <div key={`header-${day}`} className="text-center text-xs font-bold text-zinc-500 py-2">
          {day}
        </div>
      );
    });

    // 2. Render empty slots for the start of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 sm:h-14"></div>);
    }

    // 3. Render the actual days
    for (let i = 1; i <= daysInMonth; i++) {
      // Format date to match backend: YYYY-MM-DD safely
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      
      // Check if this day exists in our activity data array
      const isTrained = activityData.some(d => d.date === dateString && d.count > 0);
      const isToday = new Date().toISOString().split('T')[0] === dateString;

      days.push(
        <div 
          key={`day-${i}`} 
          className={`h-12 sm:h-14 flex flex-col items-center justify-center rounded-xl border transition-all duration-300
            ${isTrained 
              ? 'bg-orange-950/40 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.25)]' 
              : isToday 
                ? 'bg-zinc-800/80 border-zinc-500' 
                : 'bg-zinc-900/30 border-zinc-800/50'
            }
          `}
        >
          {isTrained ? (
            <span className="text-xl sm:text-2xl animate-pulse filter drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]">
              🔥
            </span>
          ) : (
            <span className={`text-sm font-bold ${isToday ? 'text-white' : 'text-zinc-600'}`}>
              {i}
            </span>
          )}
        </div>
      );
    }
    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 sm:p-6 font-sans pb-24">
      <div className="max-w-2xl mx-auto">
        
        <div className="flex justify-between items-center mb-8 pt-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">GymPulse</h1>
            <p className="text-zinc-500 font-medium mt-1">Your training history</p>
          </div>
          <button onClick={handleLogout} className="text-sm font-bold text-zinc-500 bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 hover:text-red-400 hover:border-red-900/50 transition-all">
            Log Out
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link to="/log-workout" className="text-center bg-blue-600 text-white py-4 rounded-2xl font-extrabold text-lg shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:bg-blue-500 active:scale-[0.98] transition-all">
            Start Workout
          </Link>
          <Link to="/analytics" className="text-center bg-zinc-900 text-zinc-300 border border-zinc-800 py-4 rounded-2xl font-extrabold text-lg hover:bg-zinc-800 active:scale-[0.98] transition-all">
            View Charts
          </Link>
        </div>

        {/* CUSTOM MONTHLY FIRE CALENDAR */}
        <div className="bg-[#18181b] rounded-3xl p-5 sm:p-6 border border-zinc-800/80 shadow-lg mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-zinc-400 tracking-wide uppercase">Monthly Streak</h2>
            <div className="flex items-center gap-4 bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800">
              <button onClick={() => changeMonth(-1)} className="text-zinc-500 hover:text-white font-bold">&lt;</button>
              <span className="font-bold text-sm w-24 text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <button onClick={() => changeMonth(1)} className="text-zinc-500 hover:text-white font-bold">&gt;</button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {renderCalendar()}
          </div>
        </div>

        <h2 className="text-lg font-bold text-zinc-400 mb-4 tracking-wide uppercase">Recent Sessions</h2>
        
        {workouts.length === 0 ? (
          <div className="text-center py-16 bg-[#18181b] rounded-3xl border border-zinc-800">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏋️</span>
            </div>
            <p className="text-zinc-400 font-medium">No workouts logged yet.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {workouts.map(workout => (
              <div key={workout._id} className="bg-[#18181b] rounded-3xl border border-zinc-800/80 overflow-hidden shadow-lg transition-all hover:border-zinc-700">
                <div className="p-5 pb-3">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-xl font-extrabold">{workout.workoutName}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-md">
                        {new Date(workout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                      </span>
                      <button onClick={() => handleDelete(workout._id)} className="text-zinc-600 hover:text-red-500 transition-colors" title="Delete Workout">
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm font-medium text-zinc-500">
                    <span className="flex items-center gap-1">⏱ {workout.duration}m</span>
                    <span className="flex items-center gap-1">📊 {workout.exercises.length} exercises</span>
                  </div>
                </div>
                
                <div className="p-5 pt-2 space-y-5">
                  {workout.exercises.map((ex, i) => (
                    <div key={i}>
                      <p className="font-bold text-blue-400 mb-2 text-md">{ex.exerciseName}</p>
                      <div className="space-y-1">
                        <div className="grid grid-cols-3 gap-2 px-2 text-[10px] font-extrabold text-zinc-600 tracking-wider">
                          <div>SET</div>
                          <div className="text-center">KG</div>
                          <div className="text-center">REPS</div>
                        </div>
                        {ex.sets.map((set, setIdx) => (
                          <div key={setIdx} className="grid grid-cols-3 gap-2 px-2 py-1.5 items-center bg-zinc-900/50 rounded-lg">
                            <div className="text-zinc-400 font-bold text-sm">{setIdx + 1}</div>
                            <div className="text-center font-bold text-zinc-200">{set.weight}</div>
                            <div className="text-center font-bold text-zinc-200">{set.reps}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}