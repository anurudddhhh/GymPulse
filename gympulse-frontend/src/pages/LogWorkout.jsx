import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function LogWorkout() {
  const navigate = useNavigate();
  const [workoutName, setWorkoutName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // NEW: Timer State (in seconds)
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  const [exercises, setExercises] = useState([
    { exerciseName: '', sets: [{ weight: '', reps: '' }] }
  ]);

  // NEW: Live Stopwatch Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    
    // Cleanup the interval when the user leaves the page
    return () => clearInterval(timer);
  }, []);

  // NEW: Format seconds into MM:SS for the UI
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const addExercise = () => setExercises([...exercises, { exerciseName: '', sets: [{ weight: '', reps: '' }] }]);
  
  const addSet = (exerciseIndex) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].sets.push({ weight: '', reps: '' });
    setExercises(updatedExercises);
  };

  const removeSet = (exerciseIndex, setIndex) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].sets = updatedExercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
    setExercises(updatedExercises);
  };

  const handleExerciseChange = (text, exerciseIndex) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].exerciseName = text;
    setExercises(updatedExercises);
  };

  const handleSetChange = (value, field, exerciseIndex, setIndex) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].sets[setIndex][field] = value;
    setExercises(updatedExercises);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Start loading toast
    const toastId = toast.loading('Saving workout...');
    
    try {
      const token = localStorage.getItem('token');
      
      const durationInMinutes = Math.max(1, Math.round(timeElapsed / 60));

      await axios.post('http://localhost:5000/api/workouts', 
        { workoutName, duration: durationInMinutes, date, exercises },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update toast to success
      toast.success('Workout logged!', { id: toastId });
      navigate('/dashboard');
    } catch (err) {
      // Update toast to error and remove the ugly alert()
      toast.error('Failed to save workout', { id: toastId });
      console.error(err);
    }
  };

  const inputClass = "w-full bg-[#18181b] rounded-2xl px-5 py-4 font-medium placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-zinc-800 text-white";

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 sm:p-6 pb-12 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight">Log Workout</h1>
          <button onClick={() => navigate('/dashboard')} className="text-blue-500 font-semibold hover:text-blue-400 transition-colors">
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Workout Name" 
              required value={workoutName} 
              onChange={(e) => setWorkoutName(e.target.value)} 
              className={`${inputClass} text-xl font-bold`} 
            />
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="date" 
                required value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className={`${inputClass} text-zinc-300 [color-scheme:dark]`} 
              />
              {/* REPLACED: Manual input is gone. Live Digital Clock is here. */}
              <div className="bg-[#18181b] rounded-2xl border border-zinc-800 flex items-center justify-center shadow-inner">
                <span className="text-blue-500 font-mono text-2xl font-extrabold tracking-widest flex items-center gap-2">
                  <span className="text-zinc-600 text-lg">⏱</span>
                  {formatTime(timeElapsed)}
                </span>
              </div>
            </div>
          </div>

          {exercises.map((exercise, exIndex) => (
            <div key={exIndex} className="bg-[#18181b] rounded-3xl p-5 border border-zinc-800/80 shadow-lg">
              <input 
                type="text" 
                placeholder="Exercise Name" 
                required 
                value={exercise.exerciseName} 
                onChange={(e) => handleExerciseChange(e.target.value, exIndex)} 
                className="w-full bg-transparent text-blue-400 text-lg font-bold placeholder-blue-900/50 focus:outline-none mb-6 border-b border-zinc-800 pb-2" 
              />
              
              <div className="flex gap-3 px-2 mb-2 text-xs font-bold text-zinc-500 tracking-wider">
                <div className="w-10 text-center">SET</div>
                <div className="w-4"></div>
                <div className="flex-1 text-center">KG</div>
                <div className="flex-1 text-center">REPS</div>
                <div className="w-8"></div> 
              </div>

              <div className="space-y-2 mb-5">
                {exercise.sets.map((set, setIndex) => (
                  <div key={setIndex} className="flex gap-3 items-center px-2 py-1 hover:bg-zinc-800/40 rounded-xl transition-colors">
                    <div className="w-10 text-center font-bold text-blue-500 bg-blue-500/10 rounded-lg py-2">
                      {setIndex + 1}
                    </div>
                    <div className="w-4 text-center text-zinc-600 text-sm font-medium">-</div>
                    
                    <input type="number" required value={set.weight} onChange={(e) => handleSetChange(e.target.value, 'weight', exIndex, setIndex)} className="flex-1 min-w-0 bg-[#27272a] text-center font-bold text-lg rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                    <input type="number" required value={set.reps} onChange={(e) => handleSetChange(e.target.value, 'reps', exIndex, setIndex)} className="flex-1 min-w-0 bg-[#27272a] text-center font-bold text-lg rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                    
                    <button 
                      type="button" 
                      onClick={() => removeSet(exIndex, setIndex)} 
                      className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors font-bold"
                      title="Delete Set"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              
              <button type="button" onClick={() => addSet(exIndex)} className="w-full py-3 rounded-xl text-sm font-bold text-zinc-400 bg-zinc-800/50 hover:bg-zinc-800 hover:text-white transition-all">
                + Add Set
              </button>
            </div>
          ))}

          <button type="button" onClick={addExercise} className="w-full py-5 rounded-3xl text-blue-500 font-bold bg-blue-500/10 hover:bg-blue-500/20 transition-all border border-blue-500/20">
            + Add Another Exercise
          </button>

          <div className="pt-4">
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-extrabold text-lg shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:bg-blue-500 active:scale-[0.98] transition-all">
              Finish Workout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}