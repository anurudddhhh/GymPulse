import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import {
  Search as SearchIcon,
  ChevronDown,
  ChevronRight,
  Dumbbell,
  Plus,
  Trash2,
  X,
  Target,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';

const CATEGORIES = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Cardio', 'Full Body'
];

export default function Exercises() {
  const [exercises, setExercises] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Custom Exercise Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newExForm, setNewExForm] = useState({
    name: '',
    category: CATEGORIES[0],
    description: '',
    primaryMuscles: '',
    secondaryMuscles: '',
    formCues: ''
  });

  // Accordion State
  const [expandedExId, setExpandedExId] = useState(null);

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const res = await api.get('/api/exercises');
      setExercises(res.data);
    } catch (err) {
      console.error('Failed to fetch exercises', err);
      toast.error('Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = async (e) => {
    e.preventDefault();
    if (!newExForm.name.trim()) return;

    setIsSubmitting(true);
    const toastId = toast.loading('Saving custom exercise...');

    try {
      const payload = {
        name: newExForm.name.trim(),
        category: newExForm.category,
        description: newExForm.description.trim(),
        primaryMuscles: newExForm.primaryMuscles.split(',').map(m => m.trim()).filter(Boolean),
        secondaryMuscles: newExForm.secondaryMuscles.split(',').map(m => m.trim()).filter(Boolean),
        formCues: newExForm.formCues.split('\n').map(c => mTrim(c)).filter(Boolean)
      };

      const res = await api.post('/api/exercises', payload);

      setExercises(prev => [...prev, res.data]);
      setShowAddModal(false);
      setNewExForm({
        name: '',
        category: CATEGORIES[0],
        description: '',
        primaryMuscles: '',
        secondaryMuscles: '',
        formCues: ''
      });
      toast.success('Exercise added to library!', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add exercise', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const mTrim = (str) => str.replace(/^[-*\d.]+\s*/, '').trim();

  const confirmDeleteExercise = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const toastId = toast.loading('Deleting custom exercise...');

    try {
      await api.delete(`/api/exercises/${deleteTarget.id}`);
      setExercises(prev => prev.filter(ex => ex._id !== deleteTarget.id));
      if (expandedExId === deleteTarget.id) setExpandedExId(null);
      toast.success('Exercise deleted from library', { id: toastId });
      setDeleteTarget(null);
    } catch (err) {
      toast.error('Failed to delete exercise', { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedExId(expandedExId === id ? null : id);
  };

  // Filter exercises by Name, Category, or Muscle Targets
  const filtered = exercises.filter(ex => {
    const query = searchQuery.toLowerCase();
    const matchesName = ex.name.toLowerCase().includes(query);
    const matchesCategory = ex.category.toLowerCase().includes(query);
    const matchesPrimary = ex.primaryMuscles?.some(m => m.toLowerCase().includes(query));
    const matchesSecondary = ex.secondaryMuscles?.some(m => m.toLowerCase().includes(query));
    
    return matchesName || matchesCategory || matchesPrimary || matchesSecondary;
  });

  const grouped = filtered.reduce((acc, ex) => {
    if (!acc[ex.category]) acc[ex.category] = [];
    acc[ex.category].push(ex);
    return acc;
  }, {});

  const sortedCategories = Object.keys(grouped).sort();

  return (
    <div className="min-h-screen bg-bg-base text-text-main p-4 sm:p-6 font-sans pb-28 relative">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="pt-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Exercises</h1>
            <p className="text-text-muted font-medium mt-1 text-sm">Form guides and anatomical breakdown</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-11 h-11 bg-brand hover:bg-brand-hover text-bg-base rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(196,165,116,0.2)] active:scale-95 transition-all"
            title="Add Custom Exercise"
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <SearchIcon
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim"
            strokeWidth={2}
          />
          <input
            type="text"
            placeholder="Search exercises, categories, or muscle groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-surface rounded-2xl pl-11 pr-5 py-3.5 text-sm font-medium placeholder-text-dim focus:outline-none focus:ring-1 focus:ring-brand/40 transition-all border border-border-subtle text-text-main"
          />
        </div>

        {/* Exercise List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : sortedCategories.length === 0 ? (
          <div className="text-center py-16 bg-bg-surface rounded-3xl border border-border-subtle">
            <Dumbbell size={32} className="text-text-dim mx-auto mb-3" strokeWidth={1.2} />
            <p className="text-text-muted font-bold text-sm">No exercises found</p>
            <p className="text-text-dim text-xs mt-1">Try a different search term or add a custom exercise.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedCategories.map(category => (
              <div key={category}>
                <h2 className="text-[10px] font-bold text-text-dim tracking-wider uppercase mb-2.5 px-1">
                  {category} ({grouped[category].length})
                </h2>
                <div className="bg-bg-surface rounded-2xl border border-border-subtle overflow-hidden divide-y divide-border-subtle/80 shadow-md">
                  {grouped[category]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(ex => {
                      const isExpanded = expandedExId === ex._id;

                      return (
                        <div key={ex._id} className="transition-all duration-200">
                          {/* Header Row */}
                          <div
                            onClick={() => toggleExpand(ex._id)}
                            className={`flex items-center justify-between px-4 py-3.5 hover:bg-bg-elevated/50 transition-colors cursor-pointer ${
                              isExpanded ? 'bg-bg-elevated/40' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  ex.isCustom ? 'bg-brand/10 border border-brand/20' : 'bg-bg-elevated border border-border-subtle'
                                }`}
                              >
                                <Dumbbell
                                  size={15}
                                  className={ex.isCustom ? 'text-brand' : 'text-text-muted'}
                                  strokeWidth={2}
                                />
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-sm text-text-main block truncate">
                                  {ex.name}
                                </span>
                                {ex.isCustom ? (
                                  <span className="text-[9px] font-bold text-brand uppercase tracking-widest">
                                    Custom Exercise
                                  </span>
                                ) : ex.primaryMuscles && ex.primaryMuscles.length > 0 ? (
                                  <span className="text-[10px] text-text-dim font-medium block truncate">
                                    Target: {ex.primaryMuscles.join(', ')}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-text-dim shrink-0">
                              {ex.isCustom && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTarget({ id: ex._id, name: ex.name });
                                  }}
                                  className="p-1.5 hover:text-accent-rose hover:bg-accent-rose/10 rounded-lg transition-colors"
                                  title="Delete Custom Exercise"
                                >
                                  <Trash2 size={15} strokeWidth={2} />
                                </button>
                              )}
                              {isExpanded ? (
                                <ChevronDown size={16} className="text-brand" strokeWidth={2} />
                              ) : (
                                <ChevronRight size={16} strokeWidth={2} />
                              )}
                            </div>
                          </div>

                          {/* Expanded Form & Anatomy Guide Card */}
                          {isExpanded && (
                            <div className="p-5 bg-bg-elevated/30 border-t border-border-subtle space-y-4 animate-in fade-in duration-200">
                              
                              {/* Description */}
                              {ex.description ? (
                                <p className="text-xs text-text-muted leading-relaxed font-medium">
                                  {ex.description}
                                </p>
                              ) : (
                                <p className="text-xs text-text-dim italic">
                                  No description recorded for this exercise.
                                </p>
                              )}

                              {/* Target Muscle Badges */}
                              {((ex.primaryMuscles && ex.primaryMuscles.length > 0) || (ex.secondaryMuscles && ex.secondaryMuscles.length > 0)) && (
                                <div className="space-y-2 pt-1 border-t border-border-subtle/60">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-dim uppercase tracking-wider">
                                    <Target size={12} className="text-brand" /> Targeted Musculature
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {ex.primaryMuscles?.map((muscle, idx) => (
                                      <span key={`p-${idx}`} className="text-[10px] font-bold text-brand bg-brand/10 border border-brand/20 px-2.5 py-0.5 rounded-md">
                                        Primary: {muscle}
                                      </span>
                                    ))}
                                    {ex.secondaryMuscles?.map((muscle, idx) => (
                                      <span key={`s-${idx}`} className="text-[10px] font-bold text-text-muted bg-bg-surface border border-border-subtle px-2.5 py-0.5 rounded-md">
                                        Secondary: {muscle}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Step-by-Step Form Execution Cues */}
                              {ex.formCues && ex.formCues.length > 0 && (
                                <div className="space-y-2 pt-2 border-t border-border-subtle/60">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand uppercase tracking-wider">
                                    <CheckCircle2 size={12} /> Execution Cues & Technique
                                  </div>
                                  <ul className="space-y-1.5 pl-1">
                                    {ex.formCues.map((cue, idx) => (
                                      <li key={idx} className="text-xs text-text-muted flex items-start gap-2 leading-snug">
                                        <span className="text-brand font-mono font-bold text-[10px] mt-0.5 bg-bg-surface px-1.5 py-0.5 rounded border border-border-subtle shrink-0">
                                          {idx + 1}
                                        </span>
                                        <span>{cue}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Custom Exercise Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-bg-surface border border-border-subtle w-full max-w-md rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-text-dim hover:text-text-main bg-bg-elevated p-1.5 rounded-xl transition-colors"
            >
              <X size={15} strokeWidth={2.5} />
            </button>

            <h2 className="text-xl font-extrabold text-text-main mb-1">Custom Exercise Guide</h2>
            <p className="text-xs text-text-muted mb-6">Add a movement and its execution guide to your database.</p>

            <form onSubmit={handleAddExercise} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1">
                  Exercise Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Incline Cable Fly"
                  value={newExForm.name}
                  onChange={(e) => setNewExForm({ ...newExForm, name: e.target.value })}
                  className="w-full bg-bg-elevated rounded-xl px-4 py-3 text-xs font-bold text-text-main border border-border-subtle focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1">
                  Muscle Category
                </label>
                <select
                  value={newExForm.category}
                  onChange={(e) => setNewExForm({ ...newExForm, category: e.target.value })}
                  className="w-full bg-bg-elevated rounded-xl px-4 py-3 text-xs font-bold text-text-main border border-border-subtle focus:outline-none focus:border-brand appearance-none"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1">
                  Brief Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Short summary of the exercise movement and mechanics..."
                  value={newExForm.description}
                  onChange={(e) => setNewExForm({ ...newExForm, description: e.target.value })}
                  className="w-full bg-bg-elevated rounded-xl px-4 py-2.5 text-xs font-medium text-text-main border border-border-subtle focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand uppercase tracking-wider mb-1.5 ml-1">
                  Primary Muscles (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Upper Chest, Anterior Deltoids"
                  value={newExForm.primaryMuscles}
                  onChange={(e) => setNewExForm({ ...newExForm, primaryMuscles: e.target.value })}
                  className="w-full bg-bg-elevated rounded-xl px-4 py-2.5 text-xs font-bold text-text-main border border-border-subtle focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1">
                  Form Cues (one step per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="Set bench to 30 degrees&#10;Keep elbows softly bent&#10;Squeeze upper chest at peak"
                  value={newExForm.formCues}
                  onChange={(e) => setNewExForm({ ...newExForm, formCues: e.target.value })}
                  className="w-full bg-bg-elevated rounded-xl px-4 py-2.5 text-xs font-medium text-text-main border border-border-subtle focus:outline-none focus:border-brand"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-xs text-text-muted bg-bg-elevated border border-border-subtle hover:text-text-main"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-brand hover:bg-brand-hover text-bg-base py-3 rounded-xl font-bold text-xs shadow-[0_0_15px_rgba(196,165,116,0.15)] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save to Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteExercise}
        title="Delete Custom Exercise?"
        message={
          deleteTarget
            ? `"${deleteTarget.name}" will be permanently removed from your exercise library.`
            : ''
        }
        confirmLabel="Delete"
        confirmColor="rose"
        isLoading={isDeleting}
      />
    </div>
  );
}