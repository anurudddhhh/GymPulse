import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Plus, 
  Check, 
  Trash2, 
  Timer, 
  Save, 
  Search, 
  X, 
  RotateCcw, 
  Dumbbell, 
  Sparkles, 
  ChevronRight, 
  ArrowLeft,
  Flame,
  Layers,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import api from '../utils/api';

const DRAFT_KEY = 'gympulse_active_workout_draft';

const CATEGORIES = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'];

export default function Workout() {
  // Data state
  const [routines, setRoutines] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active workout state
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutTitle, setWorkoutTitle] = useState('Custom Workout');
  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Rest Timer state
  const [restTimerSeconds, setRestTimerSeconds] = useState(90);
  const [restInitialSeconds, setRestInitialSeconds] = useState(90);
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);

  // Modal states
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSwapIndex, setPickerSwapIndex] = useState(null); // null = add new, number = swap target index
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCategory, setPickerCategory] = useState('All');

  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Refs for timers
  const workoutTimerRef = useRef(null);
  const restTimerRef = useRef(null);

  // 1. Fetch initial routines and exercises
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [routinesRes, exercisesRes] = await Promise.all([
          api.get('/routines'),
          api.get('/exercises')
        ]);
        setRoutines(routinesRes.data || []);
        setExercises(exercisesRes.data || []);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. Restore active draft from localStorage if available
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed && parsed.isWorkoutActive) {
          setIsWorkoutActive(true);
          setWorkoutTitle(parsed.workoutTitle || 'Custom Workout');
          setWorkoutExercises(parsed.workoutExercises || []);
          setElapsedSeconds(parsed.elapsedSeconds || 0);
        }
      } catch (err) {
        console.error('Failed to parse active workout draft:', err);
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  }, []);

  // 3. Auto-save draft to localStorage whenever active state changes
  useEffect(() => {
    if (isWorkoutActive) {
      const draftData = {
        isWorkoutActive: true,
        workoutTitle,
        workoutExercises,
        elapsedSeconds
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    } else {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, [isWorkoutActive, workoutTitle, workoutExercises, elapsedSeconds]);

  // 4. Reload protection & Overscroll-behavior adjustment during active workout
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isWorkoutActive) {
        e.preventDefault();
        e.returnValue = 'You have an active workout in progress. Leaving will pause tracking.';
        return e.returnValue;
      }
    };

    if (isWorkoutActive) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.body.style.overscrollBehaviorY = 'none';
    } else {
      document.body.style.overscrollBehaviorY = 'auto';
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.body.style.overscrollBehaviorY = 'auto';
    };
  }, [isWorkoutActive]);

  // 5. Workout elapsed time counter
  useEffect(() => {
    if (isWorkoutActive) {
      workoutTimerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(workoutTimerRef.current);
    }

    return () => clearInterval(workoutTimerRef.current);
  }, [isWorkoutActive]);

  // 6. Rest countdown timer execution
  useEffect(() => {
    if (isRestTimerActive && restTimerSeconds > 0) {
      restTimerRef.current = setInterval(() => {
        setRestTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (restTimerSeconds === 0 && isRestTimerActive) {
      setIsRestTimerActive(false);
      clearInterval(restTimerRef.current);
      // Play system notification chime if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('GymPulse Rest Timer', { body: 'Rest period completed! Time for your next set.' });
      }
    } else {
      clearInterval(restTimerRef.current);
    }

    return () => clearInterval(restTimerRef.current);
  }, [isRestTimerActive, restTimerSeconds]);

  // Format seconds to MM:SS or HH:MM:SS
  const formatTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const pad = (num) => String(num).padStart(2, '0');

    if (hrs > 0) {
      return `${hrs}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Start Quick Workout
  const handleStartEmptyWorkout = () => {
    setWorkoutTitle('Quick Workout');
    setWorkoutExercises([]);
    setElapsedSeconds(0);
    setIsWorkoutActive(true);
  };

  // Start Routine Workout
  const handleStartRoutine = (routine) => {
    setWorkoutTitle(routine.title);
    const formattedExercises = (routine.exercises || []).map((item) => ({
      exerciseId: item.exercise?._id || item.exercise || '',
      name: item.exercise?.name || 'Exercise',
      category: item.exercise?.category || 'General',
      sets: (item.sets || [{ weight: 0, reps: 0 }]).map((set) => ({
        weight: set.weight || 0,
        reps: set.reps || 0,
        completed: false
      }))
    }));

    setWorkoutExercises(formattedExercises);
    setElapsedSeconds(0);
    setIsWorkoutActive(true);
  };

  // Open Exercise Picker Modal (Add or Swap)
  const openExercisePicker = (swapIndex = null) => {
    setPickerSwapIndex(swapIndex);
    setPickerSearch('');
    setPickerCategory('All');
    setIsPickerOpen(true);
  };

  // Select Exercise from Picker
  const handleSelectExerciseFromPicker = (exercise) => {
    if (pickerSwapIndex !== null) {
      // Swap existing exercise
      setWorkoutExercises((prev) => {
        const updated = [...prev];
        updated[pickerSwapIndex] = {
          ...updated[pickerSwapIndex],
          exerciseId: exercise._id,
          name: exercise.name,
          category: exercise.category
        };
        return updated;
      });
    } else {
      // Append new exercise with 3 default sets
      setWorkoutExercises((prev) => [
        ...prev,
        {
          exerciseId: exercise._id,
          name: exercise.name,
          category: exercise.category,
          sets: [
            { weight: 0, reps: 10, completed: false },
            { weight: 0, reps: 10, completed: false },
            { weight: 0, reps: 10, completed: false }
          ]
        }
      ]);
    }

    setIsPickerOpen(false);
    setPickerSwapIndex(null);
  };

  // Add Set to Exercise
  const handleAddSet = (exerciseIndex) => {
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      const target = updated[exerciseIndex];
      const lastSet = target.sets[target.sets.length - 1] || { weight: 0, reps: 10 };
      target.sets.push({
        weight: lastSet.weight,
        reps: lastSet.reps,
        completed: false
      });
      return updated;
    });
  };

  // Delete Set from Exercise
  const handleDeleteSet = (exerciseIndex, setIndex) => {
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIndex].sets.splice(setIndex, 1);
      return updated;
    });
  };

  // Toggle Set Completion
  const handleToggleSetComplete = (exerciseIndex, setIndex) => {
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      const targetSet = updated[exerciseIndex].sets[setIndex];
      targetSet.completed = !targetSet.completed;

      // Trigger Rest Timer automatically when marking set as complete
      if (targetSet.completed) {
        setRestTimerSeconds(restInitialSeconds);
        setIsRestTimerActive(true);
      }

      return updated;
    });
  };

  // Update Set Data (Weight or Reps)
  const handleUpdateSet = (exerciseIndex, setIndex, field, value) => {
    const numericValue = parseFloat(value) || 0;
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIndex].sets[setIndex][field] = numericValue;
      return updated;
    });
  };

  // Remove Exercise
  const handleRemoveExercise = (exerciseIndex) => {
    setWorkoutExercises((prev) => prev.filter((_, idx) => idx !== exerciseIndex));
  };

  // Rest Timer Adjustments
  const adjustRestTimer = (secondsToAdd) => {
    setRestTimerSeconds((prev) => Math.max(0, prev + secondsToAdd));
  };

  const toggleRestTimer = () => {
    setIsRestTimerActive((prev) => !prev);
  };

  const resetRestTimer = () => {
    setIsRestTimerActive(false);
    setRestTimerSeconds(restInitialSeconds);
  };

  // Save Current Active Workout as Custom Template
  const handleSaveAsTemplate = async (e) => {
    e.preventDefault();
    if (!templateName.trim()) return;

    setIsSavingTemplate(true);
    try {
      const payload = {
        title: templateName.trim(),
        description: 'User created workout template',
        exercises: workoutExercises.map((ex) => ({
          exercise: ex.exerciseId,
          sets: ex.sets.map((s) => ({ weight: s.weight, reps: s.reps }))
        }))
      };

      const res = await api.post('/routines', payload);
      setRoutines((prev) => [res.data, ...prev]);
      setIsSaveTemplateOpen(false);
      setTemplateName('');
    } catch (err) {
      console.error('Failed to save template:', err);
      setErrorMessage('Failed to save workout template. Check form inputs.');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Save/Finish Workout Log
  const handleFinishWorkout = async () => {
    if (workoutExercises.length === 0) {
      setErrorMessage('Please add at least one exercise before completing your workout.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Filter exercises and complete sets
      const formattedExercises = workoutExercises
        .map((ex) => ({
          exercise: ex.exerciseId,
          sets: ex.sets
            .filter((s) => s.completed || s.weight > 0 || s.reps > 0)
            .map((s) => ({
              weight: Number(s.weight) || 0,
              reps: Number(s.reps) || 0,
              completed: Boolean(s.completed)
            }))
        }))
        .filter((ex) => ex.sets.length > 0 && ex.exercise);

      if (formattedExercises.length === 0) {
        setErrorMessage('Log at least one set with weight or reps before finishing.');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        title: workoutTitle || 'Logged Workout',
        duration: Math.max(1, Math.round(elapsedSeconds / 60)), // Convert to minutes
        exercises: formattedExercises,
        date: new Date().toISOString()
      };

      await api.post('/workouts', payload);

      // Reset state and clear localStorage draft
      setIsWorkoutActive(false);
      localStorage.removeItem(DRAFT_KEY);
      setWorkoutExercises([]);
      setElapsedSeconds(0);
      setIsRestTimerActive(false);
    } catch (err) {
      console.error('Failed to finish workout:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to save workout session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel / Discard Active Workout
  const handleDiscardWorkout = () => {
    if (window.confirm('Discard current session? Unsaved progress will be lost.')) {
      setIsWorkoutActive(false);
      localStorage.removeItem(DRAFT_KEY);
      setWorkoutExercises([]);
      setElapsedSeconds(0);
      setIsRestTimerActive(false);
    }
  };

  // Filter exercises for picker modal
  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
      ex.targetMuscles?.some((m) => m.toLowerCase().includes(pickerSearch.toLowerCase()));
    const matchesCategory = pickerCategory === 'All' || ex.category.toLowerCase() === pickerCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F10] text-[#E4E4E7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#C4A574] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#A1A1AA] text-sm">Loading Workout Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F10] text-[#E4E4E7] pb-24">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-20 bg-[#0F0F10]/90 backdrop-blur-md border-b border-[#27272A] px-4 py-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#E4E4E7]">
              {isWorkoutActive ? workoutTitle : 'Workout Engine'}
            </h1>
            <p className="text-xs sm:text-sm text-[#A1A1AA]">
              {isWorkoutActive ? 'Session in progress' : 'Select a routine or launch an empty workout'}
            </p>
          </div>

          {isWorkoutActive && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-[#18181A] px-3 py-1.5 rounded-lg border border-[#27272A]">
                <Timer className="w-4 h-4 text-[#C4A574]" />
                <span className="font-mono text-sm font-semibold text-[#C4A574]">
                  {formatTime(elapsedSeconds)}
                </span>
              </div>
              <button
                onClick={handleDiscardWorkout}
                className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 border border-red-900/40 hover:border-red-500/50 bg-red-950/20 rounded-lg transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleFinishWorkout}
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-black bg-[#C4A574] hover:bg-[#D4B886] disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-[#C4A574]/10"
              >
                <Check className="w-4 h-4" />
                Finish
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ERROR / NOTIFICATION BANNER */}
      {errorMessage && (
        <div className="max-w-6xl mx-auto mt-4 px-4">
          <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-3 text-xs sm:text-sm text-red-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage('')} className="text-red-400 hover:text-red-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 mt-6 sm:px-8">
        {!isWorkoutActive ? (
          /* MODE 1: ROUTINE SELECTION HUB */
          <div className="space-y-8">
            {/* Quick Start Card */}
            <div className="bg-gradient-to-r from-[#18181A] to-[#222225] border border-[#27272A] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C4A574]/5 rounded-full blur-3xl pointer-events-none" />
              <div className="space-y-2 z-10">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#C4A574]/10 text-[#C4A574] border border-[#C4A574]/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  Freeform Session
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#E4E4E7]">Start Empty Workout</h2>
                <p className="text-xs sm:text-sm text-[#A1A1AA] max-w-md">
                  Begin a blank session and choose exercises dynamically from the library of 77+ movements.
                </p>
              </div>
              <button
                onClick={handleStartEmptyWorkout}
                className="z-10 w-full sm:w-auto px-6 py-3 bg-[#C4A574] hover:bg-[#D4B886] text-black font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#C4A574]/15"
              >
                <Play className="w-4 h-4 fill-black" />
                Start Empty Session
              </button>
            </div>

            {/* Routines Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#C4A574]" />
                  <h2 className="text-lg font-bold text-[#E4E4E7]">Workout Templates & Routines</h2>
                </div>
                <span className="text-xs text-[#A1A1AA]">{routines.length} Available</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {routines.map((routine) => (
                  <div
                    key={routine._id}
                    className="bg-[#18181A] border border-[#27272A] hover:border-[#C4A574]/40 rounded-xl p-5 flex flex-col justify-between transition-all group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-base text-[#E4E4E7] group-hover:text-[#C4A574] transition-colors">
                          {routine.title}
                        </h3>
                        {routine.isSystem && (
                          <span className="text-[10px] font-medium uppercase tracking-wider bg-[#27272A] text-[#A1A1AA] px-2 py-0.5 rounded">
                            Preset
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#A1A1AA] line-clamp-2">
                        {routine.description || 'Pre-configured workout routine.'}
                      </p>

                      <div className="text-xs text-[#A1A1AA]/80 space-y-1 pt-2 border-t border-[#27272A]">
                        {(routine.exercises || []).slice(0, 4).map((ex, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="truncate max-w-[180px]">
                              {ex.exercise?.name || 'Exercise'}
                            </span>
                            <span className="text-[11px] text-[#A1A1AA] font-mono">
                              {ex.sets?.length || 3} sets
                            </span>
                          </div>
                        ))}
                        {(routine.exercises || []).length > 4 && (
                          <p className="text-[11px] text-[#C4A574]">
                            + {(routine.exercises || []).length - 4} more exercises
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartRoutine(routine)}
                      className="mt-5 w-full py-2.5 bg-[#27272A] hover:bg-[#C4A574] hover:text-black text-[#E4E4E7] text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Start Routine
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* MODE 2: ACTIVE WORKOUT EXECUTION */
          <div className="space-y-6">
            {/* Top Bar Stats & Rest Timer Control */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Elapsed Time Widget */}
              <div className="bg-[#18181A] border border-[#27272A] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#A1A1AA] uppercase tracking-wider font-medium">Elapsed Time</p>
                  <p className="text-2xl font-bold font-mono text-[#E4E4E7] mt-1">{formatTime(elapsedSeconds)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#27272A] flex items-center justify-center">
                  <Timer className="w-5 h-5 text-[#C4A574]" />
                </div>
              </div>

              {/* Active Rest Timer Widget */}
              <div className="md:col-span-2 bg-[#18181A] border border-[#27272A] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRestTimerActive ? 'bg-[#C4A574]/20 text-[#C4A574]' : 'bg-[#27272A] text-[#A1A1AA]'}`}>
                    <Timer className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-[#A1A1AA] uppercase tracking-wider font-medium">Rest Timer</p>
                      {isRestTimerActive && (
                        <span className="w-2 h-2 rounded-full bg-[#C4A574] animate-pulse" />
                      )}
                    </div>
                    <p className="text-2xl font-bold font-mono text-[#C4A574] mt-0.5">
                      {formatTime(restTimerSeconds)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustRestTimer(-15)}
                    className="px-2.5 py-1.5 text-xs bg-[#27272A] hover:bg-[#323236] text-[#E4E4E7] rounded-lg transition-colors font-mono"
                  >
                    -15s
                  </button>
                  <button
                    onClick={() => adjustRestTimer(30)}
                    className="px-2.5 py-1.5 text-xs bg-[#27272A] hover:bg-[#323236] text-[#E4E4E7] rounded-lg transition-colors font-mono"
                  >
                    +30s
                  </button>
                  <button
                    onClick={toggleRestTimer}
                    className="px-3 py-1.5 text-xs bg-[#C4A574] text-black hover:bg-[#D4B886] font-semibold rounded-lg transition-colors"
                  >
                    {isRestTimerActive ? 'Pause' : 'Start Rest'}
                  </button>
                  <button
                    onClick={resetRestTimer}
                    className="p-1.5 text-[#A1A1AA] hover:text-[#E4E4E7] bg-[#27272A] rounded-lg transition-colors"
                    title="Reset timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Exercises List */}
            <div className="space-y-6">
              {workoutExercises.length === 0 ? (
                <div className="bg-[#18181A] border border-dashed border-[#27272A] rounded-2xl p-12 text-center space-y-4">
                  <div className="w-12 h-12 bg-[#27272A] rounded-full flex items-center justify-center mx-auto text-[#C4A574]">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <p className="text-base text-[#E4E4E7] font-semibold">No exercises added yet</p>
                  <p className="text-xs text-[#A1A1AA] max-w-sm mx-auto">
                    Click the button below to search through 77+ exercises and populate your workout session.
                  </p>
                  <button
                    onClick={() => openExercisePicker(null)}
                    className="px-5 py-2.5 bg-[#C4A574] hover:bg-[#D4B886] text-black font-semibold text-xs rounded-xl transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Exercise
                  </button>
                </div>
              ) : (
                workoutExercises.map((ex, exIndex) => (
                  <div key={exIndex} className="bg-[#18181A] border border-[#27272A] rounded-2xl p-5 space-y-4">
                    {/* Exercise Header */}
                    <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 bg-[#27272A] text-[#C4A574] rounded-lg flex items-center justify-center text-xs font-bold font-mono">
                          {exIndex + 1}
                        </span>
                        <div>
                          <h3 className="font-bold text-[#E4E4E7] text-base sm:text-lg">{ex.name}</h3>
                          <span className="text-[11px] text-[#A1A1AA] capitalize">{ex.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openExercisePicker(exIndex)}
                          className="px-2.5 py-1 text-xs text-[#C4A574] hover:bg-[#C4A574]/10 border border-[#C4A574]/20 rounded-lg transition-colors"
                        >
                          Swap
                        </button>
                        <button
                          onClick={() => handleRemoveExercise(exIndex)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors"
                          title="Remove Exercise"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Table / Set Rows */}
                    <div className="space-y-2">
                      {/* Table Header */}
                      <div className="grid grid-cols-12 text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA] px-2">
                        <span className="col-span-2 text-center">Set</span>
                        <span className="col-span-4 text-center">Weight (kg)</span>
                        <span className="col-span-4 text-center">Reps</span>
                        <span className="col-span-2 text-center">Status</span>
                      </div>

                      {/* Set Rows */}
                      {ex.sets.map((set, setIndex) => (
                        <div
                          key={setIndex}
                          className={`grid grid-cols-12 items-center gap-2 p-2 rounded-xl border transition-colors ${
                            set.completed 
                              ? 'bg-[#C4A574]/10 border-[#C4A574]/30' 
                              : 'bg-[#0F0F10] border-[#27272A]'
                          }`}
                        >
                          {/* Set Number & Delete */}
                          <div className="col-span-2 flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleDeleteSet(exIndex, setIndex)}
                              className="text-red-400/60 hover:text-red-400 p-0.5"
                              title="Delete set"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono text-xs font-semibold text-[#E4E4E7]">
                              {setIndex + 1}
                            </span>
                          </div>

                          {/* Weight Input */}
                          <div className="col-span-4">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={set.weight || ''}
                              onChange={(e) => handleUpdateSet(exIndex, setIndex, 'weight', e.target.value)}
                              placeholder="0"
                              className="w-full bg-[#18181A] border border-[#27272A] focus:border-[#C4A574] text-center text-sm text-[#E4E4E7] py-1.5 rounded-lg outline-none font-mono"
                            />
                          </div>

                          {/* Reps Input */}
                          <div className="col-span-4">
                            <input
                              type="number"
                              min="0"
                              value={set.reps || ''}
                              onChange={(e) => handleUpdateSet(exIndex, setIndex, 'reps', e.target.value)}
                              placeholder="0"
                              className="w-full bg-[#18181A] border border-[#27272A] focus:border-[#C4A574] text-center text-sm text-[#E4E4E7] py-1.5 rounded-lg outline-none font-mono"
                            />
                          </div>

                          {/* Complete Toggle */}
                          <div className="col-span-2 flex justify-center">
                            <button
                              onClick={() => handleToggleSetComplete(exIndex, setIndex)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                set.completed
                                  ? 'bg-[#C4A574] text-black font-bold shadow-md shadow-[#C4A574]/20'
                                  : 'bg-[#27272A] text-[#A1A1AA] hover:text-[#E4E4E7]'
                              }`}
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Set Button */}
                    <button
                      onClick={() => handleAddSet(exIndex)}
                      className="w-full py-2 bg-[#27272A]/50 hover:bg-[#27272A] text-[#E4E4E7] text-xs font-medium rounded-xl border border-dashed border-[#27272A] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Set
                    </button>
                  </div>
                ))
              )}

              {/* Action Buttons Footer */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
                <button
                  onClick={() => openExercisePicker(null)}
                  className="w-full sm:flex-1 py-3 bg-[#27272A] hover:bg-[#323236] text-[#E4E4E7] font-semibold text-xs sm:text-sm rounded-xl border border-[#323236] transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 text-[#C4A574]" />
                  Add Exercise
                </button>

                {workoutExercises.length > 0 && (
                  <button
                    onClick={() => setIsSaveTemplateOpen(true)}
                    className="w-full sm:w-auto px-5 py-3 bg-[#18181A] hover:bg-[#27272A] text-[#C4A574] font-semibold text-xs sm:text-sm rounded-xl border border-[#27272A] transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save as Routine Template
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* SEARCHABLE EXERCISE PICKER MODAL */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181A] border border-[#27272A] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#27272A] flex items-center justify-between">
              <h3 className="font-bold text-lg text-[#E4E4E7]">
                {pickerSwapIndex !== null ? 'Swap Exercise' : 'Select Exercise'}
              </h3>
              <button
                onClick={() => setIsPickerOpen(false)}
                className="text-[#A1A1AA] hover:text-[#E4E4E7] p-1 rounded-lg hover:bg-[#27272A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Category Filters */}
            <div className="p-4 border-b border-[#27272A] space-y-3 bg-[#0F0F10]/50">
              <div className="relative">
                <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search exercise by name or muscle (e.g. Bench Press, Chest)..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full bg-[#18181A] border border-[#27272A] focus:border-[#C4A574] text-sm text-[#E4E4E7] pl-10 pr-4 py-2.5 rounded-xl outline-none"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPickerCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      pickerCategory === cat
                        ? 'bg-[#C4A574] text-black font-semibold'
                        : 'bg-[#27272A] text-[#A1A1AA] hover:text-[#E4E4E7]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercise List */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1 divide-y divide-[#27272A]/40">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-10 text-[#A1A1AA] text-sm">
                  No exercises matched your search terms.
                </div>
              ) : (
                filteredExercises.map((ex) => (
                  <div
                    key={ex._id}
                    onClick={() => handleSelectExerciseFromPicker(ex)}
                    className="pt-2.5 pb-2.5 first:pt-0 hover:bg-[#27272A]/40 px-3 rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="font-semibold text-sm text-[#E4E4E7] group-hover:text-[#C4A574] transition-colors">
                        {ex.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-[#A1A1AA] capitalize">{ex.category}</span>
                        {ex.targetMuscles?.length > 0 && (
                          <>
                            <span className="text-[10px] text-[#A1A1AA]">•</span>
                            <span className="text-[11px] text-[#C4A574]/80">
                              {ex.targetMuscles.join(', ')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-[#A1A1AA] group-hover:text-[#C4A574] transition-colors" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SAVE ROUTINE TEMPLATE MODAL */}
      {isSaveTemplateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181A] border border-[#27272A] rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-[#E4E4E7]">Save as Routine Template</h3>
              <button
                onClick={() => setIsSaveTemplateOpen(false)}
                className="text-[#A1A1AA] hover:text-[#E4E4E7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAsTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                  Template Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Upper Body Power A"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full bg-[#0F0F10] border border-[#27272A] focus:border-[#C4A574] text-sm text-[#E4E4E7] px-4 py-2.5 rounded-xl outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveTemplateOpen(false)}
                  className="px-4 py-2 text-xs text-[#A1A1AA] hover:text-[#E4E4E7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTemplate}
                  className="px-5 py-2 text-xs font-semibold text-black bg-[#C4A574] hover:bg-[#D4B886] rounded-xl transition-colors disabled:opacity-50"
                >
                  {isSavingTemplate ? 'Saving...' : 'Save Routine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}