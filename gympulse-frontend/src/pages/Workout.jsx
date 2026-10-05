import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import {
  Clock, X, Plus, Save, Star, Trash2, Play, Dumbbell,
  Check, Timer, SkipForward, ArrowLeftRight, Search, ChevronRight
} from 'lucide-react';

const DEFAULT_REST_SECONDS = 90;
const DRAFT_STORAGE_KEY = 'gympulse_active_workout_draft';
const CACHE_TEMPLATES_KEY = 'gympulse_cached_templates';
const CACHE_EXERCISES_KEY = 'gympulse_cached_exercises';
const CATEGORIES = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'];

export default function Workout() {
  const { setHideNav } = useOutletContext() || {};

  const [workoutName, setWorkoutName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  // Timestamps for background sleep tracking
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [restEndTime, setRestEndTime] = useState(null);

  // Each set: { weight, reps, completed }
  const [exercises, setExercises] = useState([
    { exerciseName: '', sets: [{ weight: '', reps: '', completed: false }] }
  ]);

  // STALE-WHILE-REVALIDATE: Initialize state directly from local cache (0ms instant render)
  const [dbTemplates, setDbTemplates] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_TEMPLATES_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [rawExercisesList, setRawExercisesList] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_EXERCISES_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [dbExercises, setDbExercises] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_EXERCISES_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.reduce((acc, curr) => {
          if (!acc[curr.category]) acc[curr.category] = [];
          acc[curr.category].push(curr);
          return acc;
        }, {});
      }
      return {};
    } catch {
      return {};
    }
  });

  const [isTemplatesLoading, setIsTemplatesLoading] = useState(() => dbTemplates.length === 0);

  // Rest timer
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restDuration, setRestDuration] = useState(DEFAULT_REST_SECONDS);

  // Delete template confirm
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Searchable Exercise Picker Modal State
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTargetIndex, setPickerTargetIndex] = useState(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCategory, setPickerCategory] = useState('All');

  // 1. AUTO-RESTORE DRAFT ON MOUNT
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft && draft.isWorkoutActive) {
          setWorkoutName(draft.workoutName || '');
          setDate(draft.date || new Date().toISOString().split('T')[0]);
          setExercises(draft.exercises || []);
          setIsWorkoutActive(true);

          const savedStartTime = draft.workoutStartTime || (Date.now() - (draft.timeElapsed || 0) * 1000);
          setWorkoutStartTime(savedStartTime);
          setTimeElapsed(Math.floor((Date.now() - savedStartTime) / 1000));

          if (draft.restEndTime && draft.restEndTime > Date.now()) {
            setRestEndTime(draft.restEndTime);
            setRestSecondsLeft(Math.ceil((draft.restEndTime - Date.now()) / 1000));
            setIsResting(true);
          }

          toast.success('Active workout session restored!');
        }
      }
    } catch (err) {
      console.error('Failed to restore draft workout', err);
    }
  }, []);

  // 2. AUTO-SAVE DRAFT TO LOCALSTORAGE
  useEffect(() => {
    if (isWorkoutActive) {
      const draftPayload = {
        workoutName,
        date,
        timeElapsed,
        workoutStartTime,
        restEndTime,
        exercises,
        isWorkoutActive: true
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
    }
  }, [workoutName, date, timeElapsed, workoutStartTime, restEndTime, exercises, isWorkoutActive]);

  // 3. BROWSER UNLOAD WARNING
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isWorkoutActive) {
        e.preventDefault();
        e.returnValue = '';
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

  // 4. DECOUPLED BACKGROUND DATA REVALIDATION
  useEffect(() => {
    // Fetch Templates independently for fast rendering
    api.get('/api/templates')
      .then((res) => {
        const templatesData = res.data || [];
        setDbTemplates(templatesData);
        localStorage.setItem(CACHE_TEMPLATES_KEY, JSON.stringify(templatesData));
      })
      .catch((err) => {
        console.error('Failed to refresh templates', err);
      })
      .finally(() => {
        setIsTemplatesLoading(false);
      });

    // Fetch Exercise Library independently without blocking templates
    api.get('/api/exercises')
      .then((res) => {
        const exerciseData = res.data || [];
        setRawExercisesList(exerciseData);

        const grouped = exerciseData.reduce((acc, curr) => {
          if (!acc[curr.category]) acc[curr.category] = [];
          acc[curr.category].push(curr);
          return acc;
        }, {});
        setDbExercises(grouped);

        localStorage.setItem(CACHE_EXERCISES_KEY, JSON.stringify(exerciseData));
      })
      .catch((err) => {
        console.error('Failed to refresh exercise library', err);
      });
  }, []);

  // 5. TIMESTAMP STOPWATCH (Survives device sleep/lock)
  useEffect(() => {
    if (!isWorkoutActive || !workoutStartTime) return;

    const updateTimer = () => {
      const seconds = Math.floor((Date.now() - workoutStartTime) / 1000);
      setTimeElapsed(Math.max(0, seconds));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isWorkoutActive, workoutStartTime]);

  // 6. TIMESTAMP REST COUNTDOWN (Survives device sleep/lock)
  useEffect(() => {
    if (!isResting || !restEndTime) return;

    const updateRestTimer = () => {
      const remaining = Math.ceil((restEndTime - Date.now()) / 1000);
      if (remaining <= 0) {
        setRestSecondsLeft(0);
        setIsResting(false);
        setRestEndTime(null);
      } else {
        setRestSecondsLeft(remaining);
      }
    };

    updateRestTimer();
    const interval = setInterval(updateRestTimer, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateRestTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isResting, restEndTime]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startRest = useCallback(() => {
    const targetEnd = Date.now() + restDuration * 1000;
    setRestEndTime(targetEnd);
    setRestSecondsLeft(restDuration);
    setIsResting(true);
  }, [restDuration]);

  const skipRest = () => {
    setIsResting(false);
    setRestSecondsLeft(0);
    setRestEndTime(null);
  };

  const addRestTime = (secs) => {
    const newEndTime = (restEndTime || Date.now()) + secs * 1000;
    setRestEndTime(newEndTime);
    setRestSecondsLeft(Math.ceil((newEndTime - Date.now()) / 1000));
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  // Search Picker Modal Controls
  const openExercisePicker = (exerciseIndex) => {
    setPickerTargetIndex(exerciseIndex);
    setPickerSearch('');
    setPickerCategory('All');
    setIsPickerOpen(true);
  };

  const handleSelectExerciseFromPicker = (selectedName) => {
    if (pickerTargetIndex !== null) {
      const updated = [...exercises];
      updated[pickerTargetIndex].exerciseName = selectedName;
      setExercises(updated);
    }
    setIsPickerOpen(false);
    setPickerTargetIndex(null);
  };

  // --- Start workout ---
  const startWorkout = async (templateId) => {
    const now = Date.now();
    setWorkoutStartTime(now);

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
    setRestEndTime(null);
    setIsWorkoutActive(true);
  };

  // --- Template delete ---
  const confirmDeleteTemplate = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/templates/${deleteTargetId}`);
      const updatedTemplates = dbTemplates.filter((t) => t._id !== deleteTargetId);
      setDbTemplates(updatedTemplates);
      localStorage.setItem(CACHE_TEMPLATES_KEY, JSON.stringify(updatedTemplates));
      toast.success('Template deleted');
      setDeleteTargetId(null);
    } catch {
      toast.error('Failed to delete template');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Exercise / set helpers ---
  const addExercise = () => {
    const newIndex = exercises.length;
    setExercises([
      ...exercises,
      { exerciseName: '', sets: [{ weight: '', reps: '', completed: false }] },
    ]);
    openExercisePicker(newIndex);
  };

  const removeExercise = (exerciseIndex) => {
    setExercises(exercises.filter((_, i) => i !== exerciseIndex));
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

      const updatedTemplates = [...dbTemplates, res.data];
      setDbTemplates(updatedTemplates);
      localStorage.setItem(CACHE_TEMPLATES_KEY, JSON.stringify(updatedTemplates));
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
      
      clearDraft();
      toast.success('Workout logged!', { id: toastId });
      setIsWorkoutActive(false);
      setIsResting(false);
      setWorkoutStartTime(null);
      setRestEndTime(null);
    } catch {
      toast.error('Failed to save workout', { id: toastId });
    }
  };

  const handleCancelWorkout = () => {
    clearDraft();
    setIsWorkoutActive(false);
    setTimeElapsed(0);
    setIsResting(false);
    setRestSecondsLeft(0);
    setWorkoutStartTime(null);
    setRestEndTime(null);
    setWorkoutName('');
    setExercises([{ exerciseName: '', sets: [{ weight: '', reps: '', completed: false }] }]);
  };

  // Filter exercises for search modal
  const filteredExercises = rawExercisesList.filter((ex) => {
    const query = pickerSearch.toLowerCase();
    const matchesSearch =
      ex.name.toLowerCase().includes(query) ||
      (ex.category && ex.category.toLowerCase().includes(query)) ||
      (ex.targetMuscles && ex.targetMuscles.some((m) => m.toLowerCase().includes(query)));
    const matchesCategory =
      pickerCategory === 'All' ||
      (ex.category && ex.category.toLowerCase() === pickerCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

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

          {/* SKELETON PULSE LOADING STATE (Displays only on fresh cache load) */}
          {isTemplatesLoading && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="h-3 w-28 bg-bg-surface rounded animate-pulse" />
                <div className="h-16 w-full bg-bg-surface border border-border-subtle rounded-2xl animate-pulse" />
                <div className="h-16 w-full bg-bg-surface border border-border-subtle rounded-2xl animate-pulse" />
              </div>
            </div>
          )}

          {!isTemplatesLoading && systemTemplates.length > 0 && (
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

          {!isTemplatesLoading && customTemplates.length > 0 && (
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

          {!isTemplatesLoading && dbTemplates.length === 0 && (
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

              {/* Exercise name + Search Picker Button */}
              <div className="mb-5 pr-16">
                {!exercise.exerciseName ? (
                  <button
                    type="button"
                    onClick={() => openExercisePicker(exIndex)}
                    className="w-full text-left border-b border-border-subtle pb-2 flex items-center justify-between group"
                  >
                    <span className="text-text-dim group-hover:text-brand font-bold text-lg">
                      Choose an exercise...
                    </span>
                    <Search size={18} className="text-text-dim group-hover:text-brand" />
                  </button>
                ) : (
                  <div className="flex items-center gap-3 border-b border-border-subtle pb-2">
                    <p className="text-brand text-lg font-bold flex-1 truncate">
                      {exercise.exerciseName}
                    </p>
                    <button
                      type="button"
                      onClick={() => openExercisePicker(exIndex)}
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

      {/* SEARCHABLE EXERCISE PICKER MODAL */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-subtle rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border-subtle flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-text-main">Select Exercise</h3>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="text-text-dim hover:text-text-main p-1 rounded-xl hover:bg-bg-elevated transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-border-subtle space-y-3 bg-bg-base/50">
              <div className="relative">
                <Search size={16} className="text-text-dim absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name or muscle (e.g. Bench, Chest)..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full bg-bg-elevated border border-border-subtle text-text-main text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-brand/40 font-medium placeholder:text-text-dim"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPickerCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      pickerCategory === cat
                        ? 'bg-brand text-bg-base'
                        : 'bg-bg-elevated text-text-muted hover:text-text-main'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 overflow-y-auto space-y-1 flex-1">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-10 text-text-dim text-sm font-medium">
                  No exercises match your search query.
                </div>
              ) : (
                filteredExercises.map((ex) => (
                  <button
                    key={ex._id || ex.name}
                    type="button"
                    onClick={() => handleSelectExerciseFromPicker(ex.name)}
                    className="w-full text-left p-3 rounded-2xl hover:bg-bg-elevated transition-all flex items-center justify-between group border border-transparent hover:border-border-subtle"
                  >
                    <div>
                      <p className="font-bold text-sm text-text-main group-hover:text-brand transition-colors">
                        {ex.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-semibold text-text-dim capitalize">
                          {ex.category}
                        </span>
                        {ex.targetMuscles && ex.targetMuscles.length > 0 && (
                          <>
                            <span className="text-[10px] text-text-dim">•</span>
                            <span className="text-[11px] font-medium text-brand/80">
                              {ex.targetMuscles.join(', ')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-text-dim group-hover:text-brand transition-colors" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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