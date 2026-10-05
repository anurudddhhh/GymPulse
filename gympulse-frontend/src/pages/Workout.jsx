import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import {
  Clock, X, Plus, Save, Star, Trash2, Play, Dumbbell,
  Check, Timer, SkipForward, ArrowLeftRight
} from 'lucide-react';

const DEFAULT_REST_SECONDS = 90;
const DRAFT_STORAGE_KEY = 'gympulse_active_workout_draft';

export default function Workout() {
  const { setHideNav } = useOutletContext() || {};

  const [workoutName, setWorkoutName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  // Each set: { weight, reps, completed }
  const [exercises, setExercises] = useState([
    { exerciseName: '', sets: [{ weight: '', reps: '', completed: false }] }
  ]);

  const [dbExercises, setDbExercises] = useState({});
  const [dbTemplates, setDbTemplates] = useState([]);

  // Rest timer
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restDuration, setRestDuration] = useState(DEFAULT_REST_SECONDS);

  // Delete template confirm
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Exercise swap mode index
  const [swappingIndex, setSwappingIndex] = useState(null);

  // 1. AUTO-RESTORE DRAFT ON MOUNT (If page reloaded during an active session)
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft && draft.isWorkoutActive) {
          setWorkoutName(draft.workoutName || '');
          setDate(draft.date || new Date().toISOString().split('T')[0]);
          setTimeElapsed(draft.timeElapsed || 0);
          setExercises(draft.exercises || []);
          setIsWorkoutActive(true);
          toast.success('Active workout session restored!');
        }
      }
    } catch (err) {
      console.error('Failed to restore draft workout', err);
    }
  }, []);

  // 2. AUTO-SAVE DRAFT TO LOCALSTORAGE WHENEVER STATE CHANGES
  useEffect(() => {
    if (isWorkoutActive) {
      const draftPayload = {
        workoutName,
        date,
        timeElapsed,
        exercises,
        isWorkoutActive: true
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
    }
  }, [workoutName, date, timeElapsed, exercises, isWorkoutActive]);

  // 3. BROWSER UNLOAD WARNING (Warn user if they attempt to refresh or close tab)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isWorkoutActive) {
        e.preventDefault();
        e.returnValue = ''; // Required for browser system dialog to trigger
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isWorkoutActive]);

  // Hide bottom nav while workout is active
  useEffect(() => {
    if (setHideNav) setHideNav(isWorkoutActive);
    return () => { if (setHideNav) setHideNav(false); };
  }, [isWorkoutActive, setHideNav]);

  // Load library
  useEffect(() => {
    const fetchLibraryData = async () => {
      try {
        const [exerciseRes, templateRes] = await Promise.all([
          api.get('/api/exercises'),
          api.get('/api/templates')
        ]);
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

  // Session stopwatch
  useEffect(() => {
    if (!isWorkoutActive) return;
    const timer = setInterval(() => setTimeElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, [isWorkoutActive]);

  // Rest countdown
  useEffect(() => {
    if (!isResting || restSecondsLeft <= 0) {
      if (restSecondsLeft <= 0 && isResting) setIsResting(false);
      return;
    }
    const t = setInterval(() => setRestSecondsLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [isResting, restSecondsLeft]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startRest = useCallback(() => {
    setRestSecondsLeft(restDuration);
    setIsResting(true);
  }, [restDuration]);

  const skipRest = () => {
    setIsResting(false);
    setRestSecondsLeft(0);
  };

  const addRestTime = (secs) => {
    setRestSecondsLeft((p) => p + secs);
  };

  // Clear Draft Helper
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  // --- Start workout ---
  const startWorkout = async (templateId) => {
    if (templateId) {
      const selectedTemplate = dbTemplates.find((t) => t._id === templateId);
      if (!selectedTemplate) return;

      setWorkoutName(selectedTemplate.templateName);

      let lastWorkoutExercises = null;
      try {
        const res = await api.get(
          `/api/workouts/last/${encodeURIComponent(selectedTemplate.templateName)}`
        );
        lastWorkoutExercises = res.data.exercises;
      } catch {
        /* first time is fine */
      }

      const mappedExercises = selectedTemplate.exercises.map((ex) => {
        const prevEx = lastWorkoutExercises?.find(
          (le) => le.exerciseName.toLowerCase() === ex.exerciseName.toLowerCase()
        );
        const generatedSets = Array.from({ length: ex.defaultSets }).map((_, i) => {
          let weight = '';
          let reps = '';
          if (prevEx && prevEx.sets[i]) {
            weight = prevEx.sets[i].weight;
            reps = prevEx.sets[i].reps;
          }
          return { weight, reps, completed: false };
        });
        return { exerciseName: ex.exerciseName, sets: generatedSets };
      });

      setExercises(mappedExercises);
      toast.success(
        `${selectedTemplate.templateName} loaded${lastWorkoutExercises ? ' with previous weights!' : '!'}`
      );
    } else {
      setWorkoutName('');
      setExercises([{ exerciseName: '', sets: [{ weight: '', reps: '', completed: false }] }]);
    }

    setTimeElapsed(0);
    setIsResting(false);
    setRestSecondsLeft(0);
    setSwappingIndex(null);
    setIsWorkoutActive(true);
  };

  // --- Template delete ---
  const confirmDeleteTemplate = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/templates/${deleteTargetId}`);
      setDbTemplates((prev) => prev.filter((t) => t._id !== deleteTargetId));
      toast.success('Template deleted');
      setDeleteTargetId(null);
    } catch {
      toast.error('Failed to delete template');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Exercise / set helpers ---
  const addExercise = () =>
    setExercises([
      ...exercises,
      { exerciseName: '', sets: [{ weight: '', reps: '', completed: false }] },
    ]);

  const removeExercise = (exerciseIndex) => {
    setExercises(exercises.filter((_, i) => i !== exerciseIndex));
    if (swappingIndex === exerciseIndex) setSwappingIndex(null);
  };

  const addSet = (exerciseIndex) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets.push({ weight: '', reps: '', completed: false });
    setExercises(updated);
  };

  const removeSet = (exerciseIndex, setIndex) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter((_, i) => i !== setIndex);
    setExercises(updated);
  };

  const handleExerciseChange = (value, exerciseIndex) => {
    const updated = [...exercises];
    updated[exerciseIndex].exerciseName = value;
    setExercises(updated);
    setSwappingIndex(null);
  };

  const handleSetChange = (value, field, exerciseIndex, setIndex) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex][field] = value;
    setExercises(updated);
  };

  const toggleSetComplete = (exerciseIndex, setIndex) => {
    const updated = [...exercises];
    const set = updated[exerciseIndex].sets[setIndex];
    const willComplete = !set.completed;
    set.completed = willComplete;
    setExercises(updated);
    if (willComplete) startRest();
  };

  // --- Save as template ---
  const handleSaveAsTemplate = async () => {
    if (!workoutName.trim()) {
      toast.error('Enter a workout name first');
      return;
    }
    const validExercises = exercises.filter((ex) => ex.exerciseName);
    if (validExercises.length === 0) {
      toast.error('Add at least one exercise');
      return;
    }

    const toastId = toast.loading('Saving template...');
    try {
      const templateExercises = validExercises.map((ex) => ({
        exerciseName: ex.exerciseName,
        defaultSets: ex.sets.length || 3,
        defaultReps: ex.sets.length > 0 ? Number(ex.sets[0].reps) || 10 : 10,
      }));
      const res = await api.post('/api/templates', {
        templateName: workoutName,
        exercises: templateExercises,
      });
      setDbTemplates([...dbTemplates, res.data]);
      toast.success(`Template "${workoutName}" saved`, { id: toastId });
    } catch {
      toast.error('Failed to save template', { id: toastId });
    }
  };

  // --- Finish workout ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanedExercises = exercises
      .map((ex) => {
        const validSets = ex.sets
          .filter((set) => set.weight !== '' && set.reps !== '')
          .map((set) => ({
            weight: Number(set.weight),
            reps: Number(set.reps),
          }));
        return { exerciseName: ex.exerciseName, sets: validSets };
      })
      .filter((ex) => ex.exerciseName !== '' && ex.sets.length > 0);

    if (cleanedExercises.length === 0) {
      toast.error('Log at least one complete set to finish');
      return;
    }

    const toastId = toast.loading('Saving workout...');
    try {
      const durationInMinutes = Math.max(1, Math.round(timeElapsed / 60));
      await api.post('/api/workouts', {
        workoutName,
        duration: durationInMinutes,
        date,
        exercises: cleanedExercises,
      });
      
      clearDraft(); // Clean up localStorage draft after successful save
      toast.success('Workout logged!', { id: toastId });
      setIsWorkoutActive(false);
      setIsResting(false);
    } catch {
      toast.error('Failed to save workout', { id: toastId });
    }
  };

  const handleCancelWorkout = () => {
    clearDraft(); // Clean up localStorage draft upon explicit cancel
    setIsWorkoutActive(false);
    setTimeElapsed(0);
    setIsResting(false);
    setRestSecondsLeft(0);
    setWorkoutName('');
    setExercises([{ exerciseName: '', sets: [{ weight: '', reps: '', completed: false }] }]);
    setSwappingIndex(null);
  };

  const inputClass =
    'w-full bg-bg-elevated rounded-2xl px-5 py-3.5 font-medium placeholder-text-dim focus:outline-none focus:ring-1 focus:ring-brand/40 transition-all border border-border-subtle text-text-main';

  // ========== TEMPLATE HUB ==========
  if (!isWorkoutActive) {
    const systemTemplates = dbTemplates.filter((t) => t.isSystemTemplate);
    const customTemplates = dbTemplates.filter((t) => !t.isSystemTemplate);

    return (
      <div className="min-h-screen bg-bg-base text-text-main p-4 sm:p-6 font-sans pb-28">
        <div className="max-w-2xl mx-auto">
          <div className="pt-4 mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight">Workout</h1>
            <p className="text-text-muted font-medium mt-1 text-sm">
              Start a session or pick a blueprint
            </p>
          </div>

          <button
            onClick={() => startWorkout(null)}
            className="w-full bg-brand hover:bg-brand-hover text-bg-base py-5 rounded-2xl font-extrabold text-lg shadow-[0_0_20px_rgba(196,165,116,0.15)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mb-8"
          >
            <Play size={20} strokeWidth={2.5} />
            Start Empty Workout
          </button>

          {systemTemplates.length > 0 && (
            <div className="mb-8">
              <h2 className="text-[10px] font-bold text-text-dim tracking-wider uppercase mb-3 px-1">
                System Templates
              </h2>
              <div className="space-y-2">
                {systemTemplates.map((t) => (
                  <button
                    key={t._id}
                    onClick={() => startWorkout(t._id)}
                    className="w-full bg-bg-surface border border-border-subtle rounded-2xl px-5 py-4 flex items-center justify-between hover:border-brand/30 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
                        <Star size={15} className="text-brand" strokeWidth={2.2} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm text-text-main">{t.templateName}</p>
                        <p className="text-xs text-text-dim mt-0.5">
                          {t.exercises.length} exercises
                        </p>
                      </div>
                    </div>
                    <Play
                      size={16}
                      className="text-text-dim group-hover:text-brand transition-colors"
                      strokeWidth={2}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {customTemplates.length > 0 && (
            <div className="mb-8">
              <h2 className="text-[10px] font-bold text-text-dim tracking-wider uppercase mb-3 px-1">
                Your Blueprints
              </h2>
              <div className="space-y-2">
                {customTemplates.map((t) => (
                  <div
                    key={t._id}
                    className="bg-bg-surface border border-border-subtle rounded-2xl px-5 py-4 flex items-center justify-between hover:border-brand/20 transition-all"
                  >
                    <button
                      onClick={() => startWorkout(t._id)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <div className="w-9 h-9 rounded-xl bg-bg-elevated flex items-center justify-center">
                        <Dumbbell size={15} className="text-brand" strokeWidth={2.2} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-text-main">{t.templateName}</p>
                        <p className="text-xs text-text-dim mt-0.5">
                          {t.exercises.length} exercises
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(t._id)}
                      className="text-text-dim hover:text-accent-rose hover:bg-accent-rose/10 p-2 rounded-lg transition-colors"
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
            <div className="text-center py-12 bg-bg-surface rounded-3xl border border-border-subtle">
              <Dumbbell size={32} className="text-text-dim mx-auto mb-3" strokeWidth={1.2} />
              <p className="text-text-muted font-medium text-sm">
                No templates yet. Start a workout and save it as a blueprint.
              </p>
            </div>
          )}
        </div>

        <ConfirmModal
          isOpen={!!deleteTargetId}
          onClose={() => setDeleteTargetId(null)}
          onConfirm={confirmDeleteTemplate}
          title="Delete template?"
          message="This blueprint will be permanently removed. Workouts you already logged stay intact."
          confirmLabel="Delete"
          confirmColor="rose"
          isLoading={isDeleting}
        />
      </div>
    );
  }

  // ========== ACTIVE WORKOUT ==========
  return (
    <div className="min-h-screen bg-bg-base text-text-main p-4 sm:p-6 font-sans pb-36">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight">Active Session</h1>
          <button
            onClick={handleCancelWorkout}
            className="text-accent-rose font-semibold hover:opacity-80 transition-colors flex items-center gap-1.5 text-sm"
          >
            <X size={16} strokeWidth={2.5} />
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Workout Name"
              required
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              className={`${inputClass} text-xl font-bold`}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`${inputClass} text-text-muted [color-scheme:dark]`}
              />
              <div className="bg-bg-surface rounded-2xl border border-border-subtle flex items-center justify-center">
                <span className="text-brand font-mono text-2xl font-extrabold tracking-widest flex items-center gap-2">
                  <Clock size={18} className="text-text-dim" strokeWidth={2} />
                  {formatTime(timeElapsed)}
                </span>
              </div>
            </div>
          </div>

          {/* Rest duration preference */}
          <div className="flex items-center justify-between bg-bg-surface border border-border-subtle rounded-2xl px-4 py-3">
            <span className="text-xs font-bold text-text-muted flex items-center gap-2">
              <Timer size={14} className="text-brand" /> Default rest
            </span>
            <div className="flex items-center gap-2">
              {[60, 90, 120, 180].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRestDuration(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    restDuration === s
                      ? 'bg-brand text-bg-base'
                      : 'bg-bg-elevated text-text-muted hover:text-text-main'
                  }`}
                >
                  {s >= 60 ? `${s / 60}m` : `${s}s`}
                </button>
              ))}
            </div>
          </div>

          {exercises.map((exercise, exIndex) => (
            <div
              key={exIndex}
              className="bg-bg-surface rounded-3xl p-5 border border-border-subtle shadow-lg relative"
            >
              {exercises.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeExercise(exIndex)}
                  className="absolute top-4 right-4 text-[10px] font-bold text-text-dim hover:text-accent-rose bg-bg-elevated hover:bg-accent-rose/10 px-2.5 py-1 rounded-lg transition-colors z-10 flex items-center gap-1"
                >
                  <X size={11} strokeWidth={2.5} />
                  Remove
                </button>
              )}

              {/* Exercise name + swap */}
              <div className="mb-5 pr-16">
                {swappingIndex === exIndex || !exercise.exerciseName ? (
                  <select
                    value={exercise.exerciseName}
                    onChange={(e) => handleExerciseChange(e.target.value, exIndex)}
                    className="w-full bg-transparent text-brand text-lg font-bold focus:outline-none border-b border-border-subtle pb-2 appearance-none"
                    autoFocus={swappingIndex === exIndex}
                  >
                    <option value="" disabled>
                      Choose an exercise...
                    </option>
                    {Object.keys(dbExercises).map((category) => (
                      <optgroup
                        key={category}
                        label={`--- ${category.toUpperCase()} ---`}
                        className="bg-bg-elevated text-text-muted font-bold"
                      >
                        {dbExercises[category].map((ex) => (
                          <option
                            key={ex._id}
                            value={ex.name}
                            className="text-text-main bg-bg-surface"
                          >
                            {ex.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-3 border-b border-border-subtle pb-2">
                    <p className="text-brand text-lg font-bold flex-1 truncate">
                      {exercise.exerciseName}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSwappingIndex(exIndex)}
                      className="text-[10px] font-bold text-text-muted hover:text-brand bg-bg-elevated hover:bg-brand/10 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                      title="Swap exercise — keeps your sets"
                    >
                      <ArrowLeftRight size={12} />
                      Swap
                    </button>
                  </div>
                )}
              </div>

              {/* Column headers */}
              <div className="flex gap-2 px-1 mb-2 text-[10px] font-bold text-text-dim tracking-wider">
                <div className="w-9 text-center">SET</div>
                <div className="w-9 text-center">DONE</div>
                <div className="flex-1 text-center">KG</div>
                <div className="flex-1 text-center">REPS</div>
                <div className="w-8" />
              </div>

              <div className="space-y-2 mb-4">
                {exercise.sets.map((set, setIndex) => (
                  <div
                    key={setIndex}
                    className={`flex gap-2 items-center px-1 py-1.5 rounded-xl transition-all ${
                      set.completed ? 'bg-accent-emerald/5 opacity-60' : 'hover:bg-bg-elevated/60'
                    }`}
                  >
                    <div className="w-9 text-center font-bold text-brand bg-brand/10 rounded-lg py-2 text-sm">
                      {setIndex + 1}
                    </div>

                    {/* Completion check */}
                    <button
                      type="button"
                      onClick={() => toggleSetComplete(exIndex, setIndex)}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all ${
                        set.completed
                          ? 'bg-accent-emerald/20 border-accent-emerald/40 text-accent-emerald'
                          : 'bg-bg-elevated border-border-subtle text-text-dim hover:border-brand/40'
                      }`}
                      title={set.completed ? 'Mark incomplete' : 'Mark complete & start rest'}
                    >
                      <Check size={16} strokeWidth={2.5} />
                    </button>

                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.5"
                      value={set.weight}
                      onChange={(e) =>
                        handleSetChange(e.target.value, 'weight', exIndex, setIndex)
                      }
                      disabled={set.completed}
                      className="flex-1 min-w-0 bg-bg-elevated text-center font-bold text-lg rounded-xl py-2 focus:outline-none focus:ring-1 focus:ring-brand/40 transition-all border border-border-subtle text-text-main disabled:opacity-50"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      value={set.reps}
                      onChange={(e) =>
                        handleSetChange(e.target.value, 'reps', exIndex, setIndex)
                      }
                      disabled={set.completed}
                      className="flex-1 min-w-0 bg-bg-elevated text-center font-bold text-lg rounded-xl py-2 focus:outline-none focus:ring-1 focus:ring-brand/40 transition-all border border-border-subtle text-text-main disabled:opacity-50"
                    />

                    <button
                      type="button"
                      onClick={() => removeSet(exIndex, setIndex)}
                      className="w-8 h-8 flex items-center justify-center text-text-dim hover:text-accent-rose hover:bg-accent-rose/10 rounded-lg transition-colors"
                      title="Delete set"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addSet(exIndex)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-text-muted bg-bg-elevated hover:bg-bg-subtle hover:text-text-main transition-all flex items-center justify-center gap-2 border border-border-subtle"
              >
                <Plus size={14} strokeWidth={2.5} />
                Add Set
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addExercise}
            className="w-full py-4 rounded-2xl text-brand font-bold bg-brand/10 hover:bg-brand/15 transition-all border border-brand/20 flex items-center justify-center gap-2"
          >
            <Plus size={18} strokeWidth={2.5} />
            Add Another Exercise
          </button>

          <div className="pt-2 space-y-3">
            <button
              type="submit"
              className="w-full bg-brand hover:bg-brand-hover text-bg-base py-4 rounded-2xl font-extrabold text-lg shadow-[0_0_20px_rgba(196,165,116,0.2)] active:scale-[0.98] transition-all"
            >
              Finish & Log Workout
            </button>
            <button
              type="button"
              onClick={handleSaveAsTemplate}
              className="w-full bg-bg-surface text-text-muted py-3 rounded-2xl font-bold text-sm hover:bg-bg-elevated hover:text-text-main transition-all border border-border-subtle flex items-center justify-center gap-2"
            >
              <Save size={15} strokeWidth={2} />
              Save as Custom Template
            </button>
          </div>
        </form>
      </div>

      {/* Floating Rest Timer */}
      {isResting && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-2xl mx-auto bg-bg-surface border border-brand/30 rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-brand flex items-center justify-center shrink-0">
              <span className="text-brand font-mono font-black text-sm">
                {formatTime(restSecondsLeft)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-brand uppercase tracking-wider">Rest Timer</p>
              <p className="text-xs text-text-muted truncate">Recover before your next set</p>
            </div>
            <button
              type="button"
              onClick={() => addRestTime(15)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-bg-elevated text-text-muted hover:text-text-main border border-border-subtle"
            >
              +15s
            </button>
            <button
              type="button"
              onClick={skipRest}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-brand text-bg-base flex items-center gap-1"
            >
              <SkipForward size={12} /> Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}