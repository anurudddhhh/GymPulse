import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import {
  Trophy, Dumbbell, Trash2, Clock, Activity, BarChart3
} from 'lucide-react';

export default function History() {
  const [workouts, setWorkouts] = useState([]);
  const [prs, setPrs] = useState([]);

  useEffect(() => {
    fetchWorkouts();
    fetchPRs();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const res = await api.get('/api/workouts');
      setWorkouts(res.data);
    } catch (err) {
      console.error('Failed to fetch workouts', err);
    }
  };

  const fetchPRs = async () => {
    try {
      const res = await api.get('/api/workouts/prs');
      setPrs(res.data);
    } catch (err) {
      console.error('Failed to fetch PRs', err);
    }
  };

  // Inline Client-Side Helper to calculate Est. 1RM for every individual set log
  const calculate1RM = (weight, reps) => {
    const w = Number(weight);
    const r = Number(reps);
    if (!w || !r) return 0;
    return r === 1 ? w : Math.round(w * (1 + r / 30));
  };

  const handleDelete = async (id) => {
    const toastId = toast.loading('Deleting workout...');

    try {
      await api.delete(`/api/workouts/${id}`);

      setWorkouts(workouts.filter(workout => workout._id !== id));
      fetchPRs();

      toast.success('Workout deleted successfully!', { id: toastId });
    } catch (err) {
      toast.error('Failed to delete workout', { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 sm:p-6 font-sans">
      <div className="max-w-2xl mx-auto">

        <div className="flex justify-between items-center mb-8 pt-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">History</h1>
            <p className="text-zinc-500 font-medium mt-1">Your training sessions</p>
          </div>
          <Link
            to="/app/analytics"
            className="text-sm font-bold text-zinc-500 bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 hover:text-blue-400 hover:border-blue-900/50 transition-all flex items-center gap-2"
          >
            <BarChart3 size={14} strokeWidth={2.2} />
            Charts
          </Link>
        </div>

        {/* All-Time Personal Records */}
        {prs.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-bold text-zinc-400 mb-4 tracking-wide uppercase">Personal Records</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {prs.map((pr, idx) => (
                <div key={idx} className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg transition-all hover:border-zinc-700">
                  <Trophy size={22} className="text-amber-500 mb-1" strokeWidth={2} />
                  <span className="text-xl font-extrabold text-white text-center">
                    {pr.weight} <span className="text-xs text-zinc-500 font-bold">KG</span>
                  </span>
                  <span className="text-xs font-bold text-zinc-500 tracking-wider text-center mb-2">
                    FOR {pr.reps} {pr.reps === 1 ? 'REP' : 'REPS'}
                  </span>
                  <span className="text-xs font-black text-blue-500 uppercase tracking-widest text-center truncate w-full border-t border-zinc-800/80 pt-2">
                    {pr.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-lg font-bold text-zinc-400 mb-4 tracking-wide uppercase">Recent Sessions</h2>

        {workouts.length === 0 ? (
          <div className="text-center py-16 bg-[#18181b] rounded-3xl border border-zinc-800">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Dumbbell size={28} className="text-zinc-600" strokeWidth={1.5} />
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
                      <button onClick={() => handleDelete(workout._id)} className="text-zinc-600 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-500/10" title="Delete Workout">
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm font-medium text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} strokeWidth={2.2} />
                      {workout.duration}m
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Activity size={13} strokeWidth={2.2} />
                      {workout.exercises.length} exercises
                    </span>
                  </div>
                </div>

                <div className="p-5 pt-2 space-y-5">
                  {workout.exercises.map((ex, i) => (
                    <div key={i}>
                      <p className="font-bold text-blue-400 mb-2 text-md">{ex.exerciseName}</p>
                      <div className="space-y-1">
                        <div className="grid grid-cols-4 gap-2 px-2 text-[10px] font-extrabold text-zinc-600 tracking-wider">
                          <div>SET</div>
                          <div className="text-center">KG</div>
                          <div className="text-center">REPS</div>
                          <div className="text-right">EST 1RM</div>
                        </div>
                        {ex.sets.map((set, setIdx) => (
                          <div key={setIdx} className="grid grid-cols-4 gap-2 px-2 py-1.5 items-center bg-zinc-900/50 rounded-lg">
                            <div className="text-zinc-400 font-bold text-sm">{setIdx + 1}</div>
                            <div className="text-center font-bold text-zinc-200">{set.weight}</div>
                            <div className="text-center font-bold text-zinc-200">{set.reps}</div>
                            <div className="text-right font-mono text-xs font-extrabold text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">
                              {calculate1RM(set.weight, set.reps)} kg
                            </div>
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
