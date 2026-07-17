import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Clock, X, Plus, Save, Star, Trash2, Play, Dumbbell
} from 'lucide-react';

export default function Workout() {
  const navigate = useNavigate();
  const [workoutName, setWorkoutName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  const [exercises, setExercises] = useState([
    { exerciseName: '', sets: [{ weight: '', reps: '' }] }
  ]);

  // State for Database Data
  const [dbExercises, setDbExercises] = useState([]);
  const [dbTemplates, setDbTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Fetch Exercises and Templates on Mount
  useEffect(() => {
    const fetchLibraryData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [exerciseRes, templateRes] = await Promise.all([
          axios.get('http://localhost:5000/api/exercises', config),
          axios.get('http://localhost:5000/api/templates', config)
        ]);

        // Group exercises by category for a cleaner dropdown
        const grouped = exerciseRes.data.reduce((acc, curr) => {
          if (!acc[curr.category]) acc[curr.category] = [];
          acc[curr.category].push(curr);
          return acc;
        }, {});

        setDbExercises(grouped);
        setDbTemplates(templateRes.data);
      } catch (err) {
        toast.error('Failed to load exercise library');
        console.error(err);
      }
    };

    fetchLibraryData();
  }, []);

  // Live Stopwatch Logic -- only runs when workout is active
  useEffect(() => {
    if (!isWorkoutActive) return;
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isWorkoutActive]);

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const startWorkout = async (templateId) => {
    if (templateId) {
      const selectedTemplate = dbTemplates.find(t => t._id === templateId);
      if (!selectedTemplate) return;

      setWorkoutName(selectedTemplate.templateName);
      
      let lastWorkoutExercises = null;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/workouts/last/${encodeURIComponent(selectedTemplate.templateName)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        lastWorkoutExercises = res.data.exercises;
      } catch (err) {
        // It's totally fine if they haven't done this workout before
      }

      const mappedExercises = selectedTemplate.exercises.map(ex => {
        const prevEx = lastWorkoutExercises?.find(le => 
          le.exerciseName.toLowerCase() === ex.exerciseName.toLowerCase()
        );

        const generatedSets = Array.from({ length: ex.defaultSets }).map((_, i) => {
          let weight = '';
          let reps = '';
          
          if (prevEx && prevEx.sets[i]) {
            weight = prevEx.sets[i].weight;
            reps = prevEx.sets[i].reps;
          }
          
          return { weight, reps };
        });
        
        return { exerciseName: ex.exerciseName, sets: generatedSets };
      });
      
      setExercises(mappedExercises);
      toast.success(`${selectedTemplate.templateName} loaded${lastWorkoutExercises ? ' with previous weights!' : '!'}`);
    } else {
      setWorkoutName('');
      setExercises([{ exerciseName: '', sets: [{ weight: '', reps: '' }] }]);
    }

    setTimeElapsed(0);
    setIsWorkoutActive(true);
  };

  const handleDeleteTemplate = async (templateId) => {
    const toastId = toast.loading('Deleting template...');

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDbTemplates(dbTemplates.filter(t => t._id !== templateId));
      toast.success('Template deleted!', { id: toastId });
    } catch (err) {
      toast.error('Failed to delete template', { id: toastId });
      console.error(err);
    }
  };

  const addExercise = () => setExercises([...exercises, { exerciseName: '', sets: [{ weight: '', reps: '' }] }]);
  const removeExercise = (exerciseIndex) => {
    const updatedExercises = exercises.filter((_, i) => i !== exerciseIndex);
    setExercises(updatedExercises);
  };

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

  const handleExerciseChange = (value, exerciseIndex) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].exerciseName = value;
    setExercises(updatedExercises);
  };

  const handleSetChange = (value, field, exerciseIndex, setIndex) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].sets[setIndex][field] = value;
    setExercises(updatedExercises);
  };

  // Save current setup as a Custom Template
  const handleSaveAsTemplate = async () => {
    if (!workoutName.trim()) {
      toast.error('Please enter a Workout Name first to save it as a template.');
      return;
    }

    const validExercises = exercises.filter(ex => ex.exerciseName);
    if (validExercises.length === 0) {
      toast.error('Add at least one exercise to save a template.');
      return;
    }

    const toastId = toast.loading('Saving custom template...');

    try {
      const token = localStorage.getItem('token');

      // Format the current live exercises into blueprint rules
      const templateExercises = validExercises.map(ex => ({
        exerciseName: ex.exerciseName,
        defaultSets: ex.sets.length || 3,
        // Grab the reps from the first set as a baseline, default to 10 if blank
        defaultReps: ex.sets.length > 0 ? Number(ex.sets[0].reps) || 10 : 10
      }));

      const res = await axios.post('http://localhost:5000/api/templates',
        { templateName: workoutName, exercises: templateExercises },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Instantly add the new custom template to the list
      setDbTemplates([...dbTemplates, res.data]);

      toast.success(`Template "${workoutName}" saved successfully!`, { id: toastId });
    } catch (err) {
      toast.error('Failed to save template', { id: toastId });
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Strict sanitization: Prevent Mongoose crashes
    const cleanedExercises = exercises
      .map(ex => {
        // Only keep sets where BOTH weight and reps have values
        const validSets = ex.sets
          .filter(set => set.weight !== '' && set.reps !== '')
          .map(set => ({
            weight: Number(set.weight),
            reps: Number(set.reps)
          }));

        return { ...ex, sets: validSets };
      })
      // Keep only exercises that have a name AND at least one completely valid set
      .filter(ex => ex.exerciseName !== '' && ex.sets.length > 0);

    if (cleanedExercises.length === 0) {
      toast.error('You need to log at least one complete set to finish the workout!');
      return;
    }

    const toastId = toast.loading('Saving workout...');

    try {
      const token = localStorage.getItem('token');
      const durationInMinutes = Math.max(1, Math.round(timeElapsed / 60));

      await axios.post('http://localhost:5000/api/workouts',
        { workoutName, duration: durationInMinutes, date, exercises: cleanedExercises },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Workout logged!', { id: toastId });
      setIsWorkoutActive(false);
    } catch (err) {
      toast.error('Failed to save workout', { id: toastId });
      console.error(err);
    }
  };

  const handleCancelWorkout = () => {
    setIsWorkoutActive(false);
    setTimeElapsed(0);
    setWorkoutName('');
    setExercises([{ exerciseName: '', sets: [{ weight: '', reps: '' }] }]);
  };

  const inputClass = "w-full bg-[#18181b] rounded-2xl px-5 py-4 font-medium placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-zinc-800 text-white";

  // ---- Template Hub View (no active workout) ----
  if (!isWorkoutActive) {
    const systemTemplates = dbTemplates.filter(t => t.isSystemTemplate);
    const customTemplates = dbTemplates.filter(t => !t.isSystemTemplate);

    return (
      <div className="min-h-screen bg-[#09090b] text-white p-4 sm:p-6 font-sans">
        <div className="max-w-2xl mx-auto">
          <div className="pt-4 mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight">Workout</h1>
            <p className="text-zinc-500 font-medium mt-1">Start a session or pick a blueprint</p>
          </div>

          {/* Start Empty Workout */}
          <button
            onClick={() => startWorkout(null)}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-extrabold text-lg shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:bg-blue-500 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mb-8"
          >
            <Play size={20} strokeWidth={2.5} />
            Start Empty Workout
          </button>

          {/* System Templates */}
          {systemTemplates.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs font-bold text-zinc-500 tracking-wider uppercase mb-3 px-1">System Templates</h2>
              <div className="space-y-2">
                {systemTemplates.map(t => (
                  <button
                    key={t._id}
                    onClick={() => startWorkout(t._id)}
                    className="w-full bg-[#18181b] border border-zinc-800/80 rounded-2xl px-5 py-4 flex items-center justify-between hover:border-zinc-700 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Star size={14} className="text-amber-500" strokeWidth={2.2} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm text-zinc-200">{t.templateName}</p>
                        <p className="text-xs text-zinc-600 mt-0.5">{t.exercises.length} exercises</p>
                      </div>
                    </div>
                    <Play size={16} className="text-zinc-600 group-hover:text-blue-500 transition-colors" strokeWidth={2} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Templates */}
          {customTemplates.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs font-bold text-zinc-500 tracking-wider uppercase mb-3 px-1">Your Blueprints</h2>
              <div className="space-y-2">
                {customTemplates.map(t => (
                  <div
                    key={t._id}
                    className="bg-[#18181b] border border-zinc-800/80 rounded-2xl px-5 py-4 flex items-center justify-between hover:border-zinc-700 transition-all"
                  >
                    <button
                      onClick={() => startWorkout(t._id)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Dumbbell size={14} className="text-blue-500" strokeWidth={2.2} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-zinc-200">{t.templateName}</p>
                        <p className="text-xs text-zinc-600 mt-0.5">{t.exercises.length} exercises</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(t._id)}
                      className="text-zinc-600 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                      title="Delete Template"
                    >
                      <Trash2 size={14} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dbTemplates.length === 0 && (
            <div className="text-center py-12 bg-[#18181b] rounded-3xl border border-zinc-800">
              <Dumbbell size={32} className="text-zinc-700 mx-auto mb-3" strokeWidth={1.2} />
              <p className="text-zinc-500 font-medium text-sm">No templates yet. Start a workout and save it as a blueprint.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- Active Workout View ----
  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 sm:p-6 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight">Log Workout</h1>
          <button onClick={handleCancelWorkout} className="text-red-500 font-semibold hover:text-red-400 transition-colors flex items-center gap-1.5">
            <X size={16} strokeWidth={2.5} />
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
              <div className="bg-[#18181b] rounded-2xl border border-zinc-800 flex items-center justify-center shadow-inner">
                <span className="text-blue-500 font-mono text-2xl font-extrabold tracking-widest flex items-center gap-2">
                  <Clock size={18} className="text-zinc-600" strokeWidth={2} />
                  {formatTime(timeElapsed)}
                </span>
              </div>
            </div>
          </div>

          {exercises.map((exercise, exIndex) => (
            <div key={exIndex} className="bg-[#18181b] rounded-3xl p-5 border border-zinc-800/80 shadow-lg relative">

              {/* Remove Exercise Button */}
              {exercises.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeExercise(exIndex)}
                  className="absolute top-5 right-5 text-xs font-bold text-zinc-500 hover:text-red-500 bg-zinc-800/50 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors z-10 flex items-center gap-1.5"
                >
                  <X size={12} strokeWidth={2.5} />
                  Remove
                </button>
              )}

              {/* Exercise Dropdown */}
              <select
                value={exercise.exerciseName}
                onChange={(e) => handleExerciseChange(e.target.value, exIndex)}
                className="w-full bg-transparent text-blue-400 text-lg font-bold focus:outline-none mb-6 border-b border-zinc-800 pb-2 appearance-none pr-32"
              >
                <option value="" disabled>Choose an exercise...</option>
                {Object.keys(dbExercises).map(category => (
                  <optgroup key={category} label={`--- ${category.toUpperCase()} ---`} className="bg-[#27272a] text-zinc-400 font-bold">
                    {dbExercises[category].map(ex => (
                      <option key={ex._id} value={ex.name} className="text-white bg-[#18181b]">
                        {ex.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

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

                    <input type="number" value={set.weight} onChange={(e) => handleSetChange(e.target.value, 'weight', exIndex, setIndex)} className="flex-1 min-w-0 bg-[#27272a] text-center font-bold text-lg rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                    <input type="number" value={set.reps} onChange={(e) => handleSetChange(e.target.value, 'reps', exIndex, setIndex)} className="flex-1 min-w-0 bg-[#27272a] text-center font-bold text-lg rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />

                    <button
                      type="button"
                      onClick={() => removeSet(exIndex, setIndex)}
                      className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Set"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" onClick={() => addSet(exIndex)} className="w-full py-3 rounded-xl text-sm font-bold text-zinc-400 bg-zinc-800/50 hover:bg-zinc-800 hover:text-white transition-all flex items-center justify-center gap-2">
                <Plus size={14} strokeWidth={2.5} />
                Add Set
              </button>
            </div>
          ))}

          <button type="button" onClick={addExercise} className="w-full py-5 rounded-3xl text-blue-500 font-bold bg-blue-500/10 hover:bg-blue-500/20 transition-all border border-blue-500/20 flex items-center justify-center gap-2">
            <Plus size={18} strokeWidth={2.5} />
            Add Another Exercise
          </button>

          <div className="pt-4 space-y-3">
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-extrabold text-lg shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:bg-blue-500 active:scale-[0.98] transition-all">
              Finish and Log Workout
            </button>

            {/* Custom Template Button */}
            <button
              type="button"
              onClick={handleSaveAsTemplate}
              className="w-full bg-zinc-800 text-zinc-300 py-3 rounded-2xl font-bold text-md hover:bg-zinc-700 hover:text-white transition-all border border-zinc-700 flex items-center justify-center gap-2"
            >
              <Save size={16} strokeWidth={2} />
              Save Current Setup as Custom Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
