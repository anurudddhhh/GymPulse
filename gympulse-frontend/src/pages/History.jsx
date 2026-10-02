import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import {
  Trophy, Dumbbell, Trash2, Clock, Activity, BarChart3,
  ChevronDown, ChevronUp, Calendar, Filter, Flame
} from 'lucide-react';

const DATE_FILTERS = [
  { id: 'all', label: 'All Time' },
  { id: '7', label: '7 Days' },
  { id: '30', label: '30 Days' },
  { id: '90', label: '90 Days' },
];

export default function History() {
  const [workouts, setWorkouts] = useState([]);
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Collapsible state: set of expanded workout IDs
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Filter state
  const [dateFilter, setDateFilter] = useState('all');

  // Delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const fetchHistoryData = async () => {
    setLoading(true);
    try {
      const [workoutRes, prRes] = await Promise.all([
        api.get('/api/workouts'),
        api.get('/api/workouts/prs'),
      ]);
      setWorkouts(workoutRes.data);
      setPrs(prRes.data);

      // Auto-expand the very first (most recent) workout for quick preview
      if (workoutRes.data.length > 0) {
        setExpandedIds(new Set([workoutRes.data[0]._id]));
      }
    } catch (err) {
      console.error('Failed to fetch history data', err);
      toast.error('Failed to load session history');
    } finally {
      setLoading(false);
    }
  };

  // Toggle card expansion
  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Inline Client-Side Helper to calculate Est. 1RM
  const calculate1RM = (weight, reps) => {
    const w = Number(weight);
    const r = Number(reps);
    if (!w || !r) return 0;
    return r === 1 ? w : Math.round(w * (1 + r / 30));
  };

  // Calculate total volume lifted in a workout session
  const calculateTotalVolume = (workout) => {
    if (!workout?.exercises) return 0;
    return workout.exercises.reduce((acc, ex) => {
      const exVolume = ex.sets.reduce((sAcc, set) => {
        return sAcc + (Number(set.weight) || 0) * (Number(set.reps) || 0);
      }, 0);
      return acc + exVolume;
    }, 0);
  };

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    const toastId = toast.loading('Deleting workout session...');

    try {
      await api.delete(`/api/workouts/${deleteTargetId}`);
      setWorkouts((prev) => prev.filter((w) => w._id !== deleteTargetId));
      
      // Refresh PRs in case the deleted workout contained a milestone record
      const prRes = await api.get('/api/workouts/prs');
      setPrs(prRes.data);

      toast.success('Workout deleted successfully!', { id: toastId });
      setDeleteTargetId(null);
    } catch (err) {
      toast.error('Failed to delete workout', { id: toastId });
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter workouts by date range
  const filteredWorkouts = useMemo(() => {
    if (dateFilter === 'all') return workouts;
    
    const days = Number(dateFilter);
    const now = new Date();
    
    return workouts.filter((workout) => {
      const workoutDate = new Date(workout.date);
      const diffDays = (now - workoutDate) / (1000 * 60 * 60 * 24);
      return diffDays <= days;
    });
  }, [workouts, dateFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base text-text-main flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-main p-4 sm:p-6 font-sans pb-28">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pt-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">History</h1>
            <p className="text-text-muted font-medium mt-1 text-sm">Log of completed training sessions</p>
          </div>
          <Link
            to="/app/analytics"
            className="text-xs font-bold text-text-muted bg-bg-surface px-4 py-2.5 rounded-xl border border-border-subtle hover:text-brand hover:border-brand/30 transition-all flex items-center gap-2 shadow-sm"
          >
            <BarChart3 size={15} className="text-brand" />
            Progress Analytics
          </Link>
        </div>

        {/* All-Time Personal Records Milestone Grid */}
        {prs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[10px] font-bold text-text-dim mb-3 tracking-wider uppercase px-1">
              Personal Records
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {prs.map((pr, idx) => (
                <div
                  key={idx}
                  className="bg-bg-surface border border-border-subtle rounded-2xl p-4 flex flex-col items-center justify-center shadow-md transition-all hover:border-brand/30"
                >
                  <Trophy size={20} className="text-brand mb-1.5" strokeWidth={2} />
                  <span className="text-lg font-black text-text-main text-center">
                    {pr.weight} <span className="text-xs text-text-muted font-bold">KG</span>
                  </span>
                  <span className="text-[10px] font-bold text-text-muted tracking-wider text-center mb-2">
                    FOR {pr.reps} {pr.reps === 1 ? 'REP' : 'REPS'}
                  </span>
                  <span className="text-[10px] font-black text-brand uppercase tracking-widest text-center truncate w-full border-t border-border-subtle pt-2">
                    {pr.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Date Filter Tabs (Item #14) */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-[10px] font-bold text-text-dim tracking-wider uppercase">
            Recent Sessions ({filteredWorkouts.length})
          </h2>
          <div className="flex bg-bg-surface p-1 rounded-xl border border-border-subtle gap-1">
            {DATE_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setDateFilter(f.id)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  dateFilter === f.id
                    ? 'bg-brand text-bg-base shadow-sm'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Session List */}
        {filteredWorkouts.length === 0 ? (
          <div className="text-center py-16 bg-bg-surface rounded-3xl border border-border-subtle">
            <div className="w-14 h-14 bg-bg-elevated rounded-2xl flex items-center justify-center mx-auto mb-3 border border-border-subtle">
              <Dumbbell size={24} className="text-text-dim" strokeWidth={1.5} />
            </div>
            <p className="text-text-muted font-bold text-sm">No workout logs found</p>
            <p className="text-text-dim text-xs mt-1">
              {dateFilter !== 'all' ? 'Try changing the date range filter above.' : 'Start an active session to build history.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredWorkouts.map((workout) => {
              const isExpanded = expandedIds.has(workout._id);
              const totalVolume = calculateTotalVolume(workout);

              return (
                <div
                  key={workout._id}
                  className="bg-bg-surface rounded-2xl border border-border-subtle overflow-hidden shadow-md transition-all hover:border-brand/20"
                >
                  {/* Summary Header (Clickable to toggle) */}
                  <div
                    onClick={() => toggleExpand(workout._id)}
                    className="p-5 cursor-pointer flex items-center justify-between hover:bg-bg-elevated/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-extrabold text-text-main truncate">
                          {workout.workoutName}
                        </h3>
                        <span className="text-[10px] font-bold text-text-muted bg-bg-elevated px-2 py-0.5 rounded-md border border-border-subtle shrink-0">
                          {new Date(workout.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            timeZone: 'UTC',
                          })}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-text-dim" />
                          {workout.duration}m
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity size={12} className="text-text-dim" />
                          {workout.exercises.length} exercises
                        </span>
                        {totalVolume > 0 && (
                          <span className="flex items-center gap-1 text-brand font-bold">
                            <Flame size={12} />
                            {totalVolume.toLocaleString()} kg volume
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions: Delete + Expand Chevron */}
                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setDeleteTargetId(workout._id)}
                        className="p-2 text-text-dim hover:text-accent-rose hover:bg-accent-rose/10 rounded-xl transition-colors"
                        title="Delete Session"
                      >
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => toggleExpand(workout._id)}
                        className="p-2 text-text-dim hover:text-text-main bg-bg-elevated rounded-xl border border-border-subtle transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Body Breakdown */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-border-subtle/60 bg-bg-elevated/30 space-y-4">
                      {workout.exercises.map((ex, i) => (
                        <div key={i} className="bg-bg-surface p-3.5 rounded-xl border border-border-subtle/80">
                          <p className="font-bold text-brand mb-2 text-sm">{ex.exerciseName}</p>
                          <div className="space-y-1">
                            <div className="grid grid-cols-4 gap-2 px-2 text-[10px] font-extrabold text-text-dim tracking-wider uppercase mb-1">
                              <div>SET</div>
                              <div className="text-center">KG</div>
                              <div className="text-center">REPS</div>
                              <div className="text-right">EST 1RM</div>
                            </div>
                            {ex.sets.map((set, setIdx) => (
                              <div
                                key={setIdx}
                                className="grid grid-cols-4 gap-2 px-2 py-1.5 items-center bg-bg-elevated rounded-lg text-xs font-bold"
                              >
                                <div className="text-text-muted">{setIdx + 1}</div>
                                <div className="text-center text-text-main">{set.weight}</div>
                                <div className="text-center text-text-main">{set.reps}</div>
                                <div className="text-right font-mono text-[11px] font-extrabold text-brand">
                                  {calculate1RM(set.weight, set.reps)} kg
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal (Item #17) */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Delete Workout Session?"
        message="This workout record will be permanently deleted from your training history."
        confirmLabel="Delete"
        confirmColor="rose"
        isLoading={isDeleting}
      />
    </div>
  );
}