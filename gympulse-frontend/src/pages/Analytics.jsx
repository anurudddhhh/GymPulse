import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { 
  BarChart3, ChevronLeft, Dumbbell, Flame, TrendingUp, Sparkles, Target 
} from 'lucide-react';

const METRIC_OPTIONS = [
  { id: 'maxWeight', label: 'Peak Weight (kg)', desc: 'Heaviest load lifted' },
  { id: 'estOneRm', label: 'Estimated 1RM (kg)', desc: 'Calculated 1-rep max (Epley)' },
  { id: 'peakVolume', label: 'Top Set Volume (kg)', desc: 'Weight × Reps for peak set' },
];

export default function Analytics() {
  const [exercisesList, setExercisesList] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [rawHistoryData, setRawHistoryData] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('maxWeight');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUniqueExercises();
  }, []);

  useEffect(() => {
    if (selectedExercise) {
      fetchExerciseHistory(selectedExercise);
    }
  }, [selectedExercise]);

  const fetchUniqueExercises = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/workouts');
      
      const names = new Set();
      res.data.forEach(workout => {
        workout.exercises?.forEach(ex => {
          if (ex.exerciseName) {
            const cleanName = ex.exerciseName.trim().toLowerCase();
            const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
            names.add(formattedName);
          }
        });
      });
      
      const uniqueNames = Array.from(names).sort(); 
      setExercisesList(uniqueNames);
      if (uniqueNames.length > 0) setSelectedExercise(uniqueNames[0]);
    } catch (err) {
      console.error("Failed to fetch exercises list", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExerciseHistory = async (name) => {
    try {
      const res = await api.get(`/api/workouts/history/${encodeURIComponent(name)}`);
      setRawHistoryData(res.data);
    } catch (err) {
      console.error("Failed to fetch chart data", err);
    }
  };

  // Compute metrics for chart display
  const chartData = useMemo(() => {
    return rawHistoryData.map(record => {
      const w = Number(record.maxWeight) || 0;
      const r = Number(record.maxReps) || 0;

      // Epley 1RM formula: w * (1 + r / 30)
      const estOneRm = r === 1 ? w : Math.round(w * (1 + r / 30));
      const peakVolume = Math.round(w * r);

      return {
        date: record.date,
        maxWeight: w,
        estOneRm: estOneRm,
        peakVolume: peakVolume,
        reps: r
      };
    });
  }, [rawHistoryData]);

  // Current metric summary stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return { current: 0, highest: 0, totalSessions: 0 };
    
    const values = chartData.map(d => d[selectedMetric]);
    const current = values[values.length - 1] || 0;
    const highest = Math.max(...values, 0);

    return {
      current,
      highest,
      totalSessions: chartData.length
    };
  }, [chartData, selectedMetric]);

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
        
        {/* Header Navigation */}
        <div className="pt-4 mb-6 flex justify-between items-center">
          <div>
            <Link 
              to="/app/history" 
              className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-hover transition-colors mb-1"
            >
              <ChevronLeft size={14} /> Back to History
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight">Analytics</h1>
            <p className="text-text-muted font-medium mt-0.5 text-sm">Progression curves and load dynamics</p>
          </div>
        </div>

        {exercisesList.length === 0 ? (
          <div className="text-center py-16 bg-bg-surface rounded-3xl border border-border-subtle">
            <Dumbbell size={32} className="text-text-dim mx-auto mb-3" strokeWidth={1.2} />
            <p className="text-text-muted font-bold text-sm">No workout data recorded yet</p>
            <p className="text-text-dim text-xs mt-1">Log workouts containing exercises to plot progress charts.</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Exercise Selector */}
            <div className="bg-bg-surface rounded-2xl p-4 border border-border-subtle shadow-md">
              <label className="text-[10px] font-bold text-text-dim tracking-wider uppercase block mb-1.5 ml-1">
                Select Exercise
              </label>
              <select 
                value={selectedExercise} 
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="w-full bg-bg-elevated rounded-xl px-4 py-3 text-sm font-bold text-text-main border border-border-subtle focus:outline-none focus:border-brand appearance-none transition-all cursor-pointer"
              >
                {exercisesList.map((name, idx) => (
                  <option key={idx} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Metric Toggle Tabs (Item #15) */}
            <div className="grid grid-cols-3 gap-2 bg-bg-surface p-1.5 rounded-2xl border border-border-subtle shadow-sm">
              {METRIC_OPTIONS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMetric(m.id)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold text-center transition-all ${
                    selectedMetric === m.id
                      ? 'bg-brand text-bg-base shadow-md'
                      : 'text-text-muted hover:text-text-main hover:bg-bg-elevated/50'
                  }`}
                >
                  {m.label.split(' ')[0]} {m.label.split(' ')[1]}
                </button>
              ))}
            </div>

            {/* Stats Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-bg-surface border border-border-subtle rounded-2xl p-3.5 shadow-md">
                <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Latest</span>
                <span className="text-lg font-black text-text-main mt-0.5 block">
                  {stats.current} <span className="text-[10px] text-text-muted font-bold">KG</span>
                </span>
              </div>
              <div className="bg-bg-surface border border-border-subtle rounded-2xl p-3.5 shadow-md">
                <span className="text-[10px] font-bold text-brand uppercase tracking-wider block">All-Time Peak</span>
                <span className="text-lg font-black text-brand mt-0.5 block">
                  {stats.highest} <span className="text-[10px] text-text-muted font-bold">KG</span>
                </span>
              </div>
              <div className="bg-bg-surface border border-border-subtle rounded-2xl p-3.5 shadow-md">
                <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Sessions</span>
                <span className="text-lg font-black text-text-main mt-0.5 block">{stats.totalSessions}</span>
              </div>
            </div>

            {/* Recharts Graphical Display */}
            <div className="bg-bg-surface rounded-3xl p-5 border border-border-subtle shadow-md">
              <div className="flex items-center justify-between mb-6 px-1">
                <div>
                  <h3 className="text-xs font-bold text-brand uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={14} /> 
                    {METRIC_OPTIONS.find(m => m.id === selectedMetric)?.label}
                  </h3>
                  <p className="text-[10px] text-text-dim mt-0.5">
                    {METRIC_OPTIONS.find(m => m.id === selectedMetric)?.desc}
                  </p>
                </div>
              </div>
              
              {chartData.length === 0 ? (
                <p className="text-center text-text-dim py-12 text-xs font-medium">
                  Insufficient historical logs to plot trajectory.
                </p>
              ) : (
                <div className="w-full h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2C" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#6B6B69" 
                        fontSize={11} 
                        fontWeight="bold"
                        tickLine={false} 
                        axisLine={false} 
                        dy={10}
                      />
                      <YAxis 
                        stroke="#6B6B69" 
                        fontSize={11} 
                        fontWeight="bold"
                        tickLine={false} 
                        axisLine={false} 
                        dx={-5}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#171718', 
                          borderRadius: '12px', 
                          borderColor: '#2A2A2C', 
                          color: '#F2F0ED',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                        }}
                        itemStyle={{ color: '#C4A574', fontWeight: 'bold', fontSize: '12px' }}
                        labelStyle={{ color: '#9C9A96', fontWeight: 'bold', fontSize: '11px' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey={selectedMetric} 
                        name={METRIC_OPTIONS.find(m => m.id === selectedMetric)?.label.split(' (')[0]}
                        stroke="#C4A574" 
                        strokeWidth={2.5} 
                        activeDot={{ r: 6, stroke: '#0F0F10', strokeWidth: 2, fill: '#C4A574' }} 
                        dot={{ r: 3.5, stroke: '#C4A574', strokeWidth: 2, fill: '#171718' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}