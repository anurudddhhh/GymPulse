import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { 
  Search as SearchIcon, ChevronDown, ChevronRight, 
  Dumbbell, Plus, Trash2, X, LineChart 
} from 'lucide-react';

// Categories for the dropdown
const CATEGORIES = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms', 
  'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Cardio', 'Full Body'
];

export default function Exercises() {
  const [exercises, setExercises] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExCategory, setNewExCategory] = useState(CATEGORIES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Accordion / Detail State
  const [expandedExId, setExpandedExId] = useState(null);
  const [exHistory, setExHistory] = useState({});
  const [historyLoading, setHistoryLoading] = useState(false);

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
    if (!newExName.trim()) return;

    setIsSubmitting(true);
    const toastId = toast.loading('Adding exercise...');

    try {
      const res = await api.post('/api/exercises', 
        { name: newExName.trim(), category: newExCategory }
      );
      
      setExercises([...exercises, res.data]);
      setShowAddModal(false);
      setNewExName('');
      toast.success('Exercise added!', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add exercise', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExercise = async (id, e) => {
    e.stopPropagation(); // Prevent accordion toggle

    const toastId = toast.loading('Deleting...');
    try {
      await api.delete(`/api/exercises/${id}`);
      setExercises(exercises.filter(ex => ex._id !== id));
      if (expandedExId === id) setExpandedExId(null);
      toast.success('Deleted', { id: toastId });
    } catch (err) {
      toast.error('Failed to delete', { id: toastId });
    }
  };

  const toggleExpand = async (ex) => {
    if (expandedExId === ex._id) {
      setExpandedExId(null);
      return;
    }

    setExpandedExId(ex._id);

    // If we haven't loaded history for this exercise yet, fetch it
    if (!exHistory[ex._id]) {
      setHistoryLoading(true);
      try {
        const res = await api.get(`/api/workouts/history/${encodeURIComponent(ex.name)}`);
        setExHistory(prev => ({ ...prev, [ex._id]: res.data }));
      } catch (err) {
        toast.error(`Failed to load history for ${ex.name}`);
      } finally {
        setHistoryLoading(false);
      }
    }
  };

  const filtered = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = filtered.reduce((acc, ex) => {
    if (!acc[ex.category]) acc[ex.category] = [];
    acc[ex.category].push(ex);
    return acc;
  }, {});

  const sortedCategories = Object.keys(grouped).sort();

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 sm:p-6 font-sans pb-24 relative">
      <div className="max-w-2xl mx-auto">
        
        {/* Header & Search */}
        <div className="pt-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Exercises</h1>
            <p className="text-zinc-500 font-medium mt-1">Browse and manage database</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="relative mb-6">
          <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" strokeWidth={2} />
          <input
            type="text"
            placeholder="Search exercises or muscle groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#18181b] rounded-2xl pl-11 pr-5 py-4 font-medium placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-zinc-800 text-white"
          />
        </div>

        {/* Loading / Empty States */}
        {loading ? (
          <div className="text-center py-16">
            <p className="text-zinc-500 font-medium animate-pulse">Loading exercises...</p>
          </div>
        ) : sortedCategories.length === 0 ? (
          <div className="text-center py-16 bg-[#18181b] rounded-3xl border border-zinc-800">
            <p className="text-zinc-400 font-medium">No exercises found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedCategories.map(category => (
              <div key={category}>
                <h2 className="text-xs font-bold text-zinc-500 tracking-wider uppercase mb-3 px-1">{category}</h2>
                <div className="bg-[#18181b] rounded-2xl border border-zinc-800/80 overflow-hidden divide-y divide-zinc-800/60">
                  {grouped[category].sort((a, b) => a.name.localeCompare(b.name)).map(ex => {
                    const isExpanded = expandedExId === ex._id;
                    const history = exHistory[ex._id] || [];

                    return (
                      <div key={ex._id} className="transition-all duration-300">
                        {/* Main Row */}
                        <div
                          onClick={() => toggleExpand(ex)}
                          className={`flex items-center justify-between px-4 py-3.5 hover:bg-zinc-800/30 transition-colors cursor-pointer ${isExpanded ? 'bg-zinc-900/40' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ex.isCustom ? 'bg-amber-500/10' : 'bg-blue-500/10'}`}>
                              <Dumbbell size={14} className={ex.isCustom ? 'text-amber-500' : 'text-blue-500'} strokeWidth={2.2} />
                            </div>
                            <div>
                              <span className="font-semibold text-sm text-zinc-200 block">{ex.name}</span>
                              {ex.isCustom && <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Custom</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-zinc-600">
                            {ex.isCustom && (
                              <button 
                                onClick={(e) => handleDeleteExercise(ex._id, e)}
                                className="p-1.5 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                              >
                                <Trash2 size={16} strokeWidth={2} />
                              </button>
                            )}
                            {isExpanded ? <ChevronDown size={16} strokeWidth={2} /> : <ChevronRight size={16} strokeWidth={2} />}
                          </div>
                        </div>

                        {/* Expanded Detail View */}
                        {isExpanded && (
                          <div className="p-4 bg-zinc-950/50 border-t border-zinc-800/60">
                            <div className="flex items-center gap-2 mb-3 text-sm font-bold text-zinc-400 uppercase tracking-wide">
                              <LineChart size={14} className="text-zinc-500" strokeWidth={2} />
                              Progression History
                            </div>
                            
                            {historyLoading && !exHistory[ex._id] ? (
                              <p className="text-xs text-zinc-500 font-medium">Loading history...</p>
                            ) : history.length === 0 ? (
                              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 text-center">
                                <p className="text-sm text-zinc-500 font-medium">No logged data for this exercise yet.</p>
                                <p className="text-xs text-zinc-600 mt-1">Log a workout to see your progress chart.</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-2 px-2 text-[10px] font-extrabold text-zinc-600 tracking-wider">
                                  <div>DATE</div>
                                  <div className="text-right">MAX KG</div>
                                  <div className="text-right">REPS</div>
                                </div>
                                {history.map((record, idx) => (
                                  <div key={idx} className="grid grid-cols-3 gap-2 px-2 py-2 items-center bg-zinc-900 rounded-lg border border-zinc-800">
                                    <div className="text-xs font-bold text-zinc-400">{record.date}</div>
                                    <div className="text-right font-extrabold text-blue-400">{record.maxWeight}</div>
                                    <div className="text-right font-bold text-zinc-300">{record.maxReps}</div>
                                  </div>
                                ))}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#18181b] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-zinc-500 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 p-1.5 rounded-lg transition-colors"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
            
            <h2 className="text-xl font-extrabold mb-1">Custom Exercise</h2>
            <p className="text-xs text-zinc-500 font-medium mb-6">Add a personal exercise to your database.</p>

            <form onSubmit={handleAddExercise} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5 ml-1">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bulgarian Split Squat"
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  className="w-full bg-[#27272a] rounded-xl px-4 py-3 font-medium placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5 ml-1">Category</label>
                <select
                  value={newExCategory}
                  onChange={(e) => setNewExCategory(e.target.value)}
                  className="w-full bg-[#27272a] rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white appearance-none"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-extrabold text-sm shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
              >
                {isSubmitting ? 'Saving...' : 'Save Exercise'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
