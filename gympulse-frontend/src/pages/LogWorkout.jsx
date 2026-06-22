import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function LogWorkout() {
  const navigate = useNavigate();
  const [workoutName, setWorkoutName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  const [exercises, setExercises] = useState([
    { exerciseName: '', sets: [{ weight: '', reps: '' }] }
  ]);

  // NEW: State for Database Data
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

  // Live Stopwatch Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };
  const handleApplyTemplate = (e) => {
    const templateId = e.target.value;
    setSelectedTemplateId(templateId); // Keep it selected in the dropdown
    if (!templateId) return;

    const selectedTemplate = dbTemplates.find(t => t._id === templateId);
    if (!selectedTemplate) return;

    setWorkoutName(selectedTemplate.templateName);
    
    const mappedExercises = selectedTemplate.exercises.map(ex => {
      const generatedSets = Array.from({ length: ex.defaultSets }).map(() => ({
        weight: '',
        reps: ''
      }));
      return { exerciseName: ex.exerciseName, sets: generatedSets };
    });

    setExercises(mappedExercises);
    toast.success(`${selectedTemplate.templateName} loaded!`);
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplateId) return;
    const toastId = toast.loading('Deleting template...');

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/templates/${selectedTemplateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDbTemplates(dbTemplates.filter(t => t._id !== selectedTemplateId));
      setSelectedTemplateId(''); // Reset dropdown
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

  // NEW: Save current setup as a Custom Template
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

      // Instantly add the new custom template to the dropdown so you see it right away!
      setDbTemplates([...dbTemplates, res.data]);
      
      toast.success(`Template "${workoutName}" saved successfully!`, { id: toastId });
    } catch (err) {
      toast.error('Failed to save template', { id: toastId });
      console.error(err);
    }
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    
    // STRICT SANITIZATION: Prevent Mongoose crashes
    const cleanedExercises = exercises
      .map(ex => {
        // Only keep sets where BOTH weight and reps have values
        const validSets = ex.sets
          .filter(set => set.weight !== '' && set.reps !== '')
          .map(set => ({
            weight: Number(set.weight), // Force string to Number for MongoDB
            reps: Number(set.reps)      // Force string to Number for MongoDB
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
      navigate('/dashboard');
    } catch (err) {
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

        {/* NEW: Blueprint Loader */}
        {dbTemplates.length > 0 && (
          <div className="mb-6 bg-blue-900/20 border border-blue-500/30 rounded-2xl p-4">
            <label className="text-xs font-bold text-blue-400 tracking-wider uppercase mb-2 block">Quick Start Template</label>
            <div className="flex gap-2">
              <select 
                value={selectedTemplateId}
                onChange={handleApplyTemplate}
                className="w-full bg-[#18181b] rounded-xl px-4 py-3 text-white font-bold border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="" disabled>Select a routine to auto-fill...</option>
                {dbTemplates.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.isSystemTemplate ? '⭐ ' : ''}{t.templateName}
                  </option>
                ))}
              </select>

              {selectedTemplateId && !dbTemplates.find(t => t._id === selectedTemplateId)?.isSystemTemplate && (
                <button 
                  type="button" 
                  onClick={handleDeleteTemplate}
                  className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 rounded-xl font-bold hover:bg-red-500/20 transition-all flex items-center justify-center"
                  title="Delete Custom Template"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

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
                  <span className="text-zinc-600 text-lg">⏱</span>
                  {formatTime(timeElapsed)}
                </span>
              </div>
            </div>
          </div>

          {exercises.map((exercise, exIndex) => (
            <div key={exIndex} className="bg-[#18181b] rounded-3xl p-5 border border-zinc-800/80 shadow-lg relative">
              
              {/* NEW: Remove Exercise Button */}
              {exercises.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeExercise(exIndex)}
                  className="absolute top-5 right-5 text-xs font-bold text-zinc-500 hover:text-red-500 bg-zinc-800/50 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors z-10"
                >
                  ✕ Remove Exercise
                </button>
              )}
              
              {/* REPLACED: Strict Dropdown instead of Text Input */}
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

          <div className="pt-4 space-y-3">
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-extrabold text-lg shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:bg-blue-500 active:scale-[0.98] transition-all">
              Finish & Log Workout
            </button>

            {/* NEW: Custom Template Button */}
            <button 
              type="button" 
              onClick={handleSaveAsTemplate} 
              className="w-full bg-zinc-800 text-zinc-300 py-3 rounded-2xl font-bold text-md hover:bg-zinc-700 hover:text-white transition-all border border-zinc-700"
            >
              💾 Save Current Setup as Custom Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}