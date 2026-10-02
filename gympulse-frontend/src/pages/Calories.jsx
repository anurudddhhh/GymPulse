import { useState, useEffect, useRef, useMemo } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Cell
} from 'recharts';
import {
  ChevronLeft, ChevronRight, UploadCloud, X, Trash2,
  Flame, Beef, Wheat, Droplet, Info, Sparkles, Check, Settings, BarChart3
} from 'lucide-react';

export default function Calories() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [nutritionData, setNutritionData] = useState({ meals: [] });
  const [userTargets, setUserTargets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weekData, setWeekData] = useState([]);
  const [weekLoading, setWeekLoading] = useState(false);

  // Setup / Edit Macro Goals Modal
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState({ calories: 2500, protein: 150, carbs: 250, fats: 80 });

  // AI Scanner
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Verification Modal
  const [showVerification, setShowVerification] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [isLogging, setIsLogging] = useState(false);

  // Delete Meal
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTargets();
  }, []);

  useEffect(() => {
    fetchNutritionData(currentDate);
    fetchWeekSummary(currentDate);
  }, [currentDate]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const toDateStr = (dateObj) => dateObj.toISOString().split('T')[0];

  const fetchTargets = async () => {
    try {
      const res = await api.get('/api/users/me');
      if (!res.data.targetCalories) {
        setShowSetup(true);
      } else {
        const targets = {
          calories: res.data.targetCalories,
          protein: res.data.targetProtein,
          carbs: res.data.targetCarbs,
          fats: res.data.targetFats,
        };
        setUserTargets(targets);
        setSetupData(targets);
      }
    } catch (err) {
      console.error('Failed to fetch user targets', err);
    }
  };

  const handleSaveSetup = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Saving macro targets...');
    try {
      await api.put('/api/users/me', {
        targetCalories: Number(setupData.calories),
        targetProtein: Number(setupData.protein),
        targetCarbs: Number(setupData.carbs),
        targetFats: Number(setupData.fats),
      });
      setUserTargets({
        calories: Number(setupData.calories),
        protein: Number(setupData.protein),
        carbs: Number(setupData.carbs),
        fats: Number(setupData.fats),
      });
      setShowSetup(false);
      toast.success('Macro goals updated!', { id: toastId });
    } catch (err) {
      toast.error('Failed to save goals', { id: toastId });
    }
  };

  const fetchNutritionData = async (dateObj) => {
    setLoading(true);
    const dateStr = toDateStr(dateObj);
    try {
      const res = await api.get(`/api/nutrition/${dateStr}`);
      setNutritionData(res.data);
    } catch (err) {
      console.error('Failed to fetch nutrition data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeekSummary = async (dateObj) => {
    setWeekLoading(true);
    const dateStr = toDateStr(dateObj);
    try {
      const res = await api.get(`/api/nutrition/week/${dateStr}`);
      setWeekData(res.data || []);
    } catch (err) {
      console.error('Failed to fetch weekly summary', err);
      setWeekData([]);
    } finally {
      setWeekLoading(false);
    }
  };

  const changeDate = (offsetDays) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + offsetDays);
    setCurrentDate(newDate);
  };

  const jumpToDate = (dateStr) => {
    // Parse as local noon to avoid timezone day-shift issues
    const [y, m, d] = dateStr.split('-').map(Number);
    setCurrentDate(new Date(y, m - 1, d, 12, 0, 0));
  };

  const formatDateLabel = (dateObj) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dStr = dateObj.toDateString();
    if (dStr === today.toDateString()) return 'Today';
    if (dStr === tomorrow.toDateString()) return 'Tomorrow';
    if (dStr === yesterday.toDateString()) return 'Yesterday';

    return dateObj.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setDescription('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return toast.error('Please select a meal image first');

    setIsAnalyzing(true);
    const toastId = toast.loading('AI is scanning your meal...');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      if (description) formData.append('description', description);

      const res = await api.post('/api/nutrition/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setVerificationData({
        ...res.data.estimatedMacros,
        imageUrl: res.data.imageUrl,
      });
      setShowVerification(true);
      toast.success('Analysis complete!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to analyze meal', { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmLog = async (e) => {
    e.preventDefault();
    setIsLogging(true);
    const toastId = toast.loading('Logging meal entry...');
    const dateStr = toDateStr(currentDate);

    try {
      const res = await api.post('/api/nutrition', {
        date: dateStr,
        ...verificationData,
      });

      setNutritionData(res.data);
      setShowVerification(false);
      clearSelection();
      toast.success('Meal logged successfully!', { id: toastId });
      fetchWeekSummary(currentDate);
    } catch (err) {
      toast.error('Failed to log meal', { id: toastId });
    } finally {
      setIsLogging(false);
    }
  };

  const confirmDeleteMeal = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    const toastId = toast.loading('Deleting meal...');
    const dateStr = toDateStr(currentDate);

    try {
      const res = await api.delete(`/api/nutrition/${dateStr}/${deleteTargetId}`);
      setNutritionData(res.data.log);
      toast.success('Meal deleted', { id: toastId });
      setDeleteTargetId(null);
      fetchWeekSummary(currentDate);
    } catch (err) {
      toast.error('Failed to delete meal', { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  // Day totals
  const meals = nutritionData.meals || [];
  const totals = meals.reduce(
    (acc, meal) => {
      acc.calories += meal.calories || 0;
      acc.protein += meal.protein || 0;
      acc.carbs += meal.carbs || 0;
      acc.fats += meal.fats || 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const getPercentage = (consumed, target) => {
    if (!target) return 0;
    return Math.min(100, Math.round((consumed / target) * 100));
  };

  // Weekly averages
  const weekStats = useMemo(() => {
    if (!weekData.length) return { avgCalories: 0, avgProtein: 0, daysLogged: 0 };
    const daysLogged = weekData.filter((d) => d.calories > 0).length;
    const sumCal = weekData.reduce((s, d) => s + (d.calories || 0), 0);
    const sumPro = weekData.reduce((s, d) => s + (d.protein || 0), 0);
    return {
      avgCalories: daysLogged ? Math.round(sumCal / daysLogged) : 0,
      avgProtein: daysLogged ? Math.round(sumPro / daysLogged) : 0,
      daysLogged,
    };
  }, [weekData]);

  const selectedDateStr = toDateStr(currentDate);
  const calorieTarget = userTargets?.calories || 2000;

  if (!userTargets && !showSetup && loading) {
    return (
      <div className="min-h-screen bg-bg-base text-text-main flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-main p-4 sm:p-6 font-sans pb-28 relative">
      <div className="max-w-2xl mx-auto">
        {/* Header & Date Navigator */}
        <div className="flex justify-between items-center mb-6 pt-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Nutrition</h1>
            <p className="text-text-muted font-medium mt-1 text-sm">Macro tracking and AI meal scanner</p>
          </div>
          <div className="flex items-center gap-3 bg-bg-surface px-3 py-2 rounded-xl border border-border-subtle shadow-sm">
            <button onClick={() => changeDate(-1)} className="text-text-muted hover:text-text-main transition-colors">
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <span className="font-bold text-xs w-24 text-center text-brand">
              {formatDateLabel(currentDate)}
            </span>
            <button onClick={() => changeDate(1)} className="text-text-muted hover:text-text-main transition-colors">
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Macro Dashboard */}
        {userTargets && (
          <div className="bg-bg-surface rounded-3xl p-6 border border-border-subtle shadow-md mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-bold text-text-dim tracking-wider uppercase mb-0.5">
                  Calories Consumed
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-text-main">{totals.calories}</span>
                  <span className="text-xs font-bold text-text-muted">/ {userTargets.calories} kcal</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSetupData(userTargets);
                    setShowSetup(true);
                  }}
                  className="px-3 py-1.5 bg-bg-elevated hover:bg-bg-subtle text-text-muted hover:text-text-main border border-border-subtle rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Settings size={13} /> Edit Goals
                </button>
                <Flame
                  size={28}
                  className={totals.calories > userTargets.calories ? 'text-accent-rose' : 'text-brand'}
                  strokeWidth={2}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-brand flex items-center gap-1">
                    <Beef size={13} /> Protein
                  </span>
                  <span className="text-text-main">
                    {totals.protein}g <span className="text-text-dim">/ {userTargets.protein}g</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-bg-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand transition-all duration-500 rounded-full"
                    style={{ width: `${getPercentage(totals.protein, userTargets.protein)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-accent-emerald flex items-center gap-1">
                    <Wheat size={13} /> Carbs
                  </span>
                  <span className="text-text-main">
                    {totals.carbs}g <span className="text-text-dim">/ {userTargets.carbs}g</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-bg-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-emerald transition-all duration-500 rounded-full"
                    style={{ width: `${getPercentage(totals.carbs, userTargets.carbs)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-accent-amber flex items-center gap-1">
                    <Droplet size={13} /> Fats
                  </span>
                  <span className="text-text-main">
                    {totals.fats}g <span className="text-text-dim">/ {userTargets.fats}g</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-bg-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-amber transition-all duration-500 rounded-full"
                    style={{ width: `${getPercentage(totals.fats, userTargets.fats)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WEEKLY SUMMARY CHART (Task #12) */}
        <div className="bg-bg-surface rounded-3xl p-5 border border-border-subtle shadow-md mb-6">
          <div className="flex items-start justify-between mb-4 gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-text-main flex items-center gap-2">
                <BarChart3 size={16} className="text-brand" />
                7-Day Summary
              </h2>
              <p className="text-[10px] text-text-dim mt-0.5">
                Tap a bar to open that day · dashed line = daily target
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Week avg</p>
              <p className="text-sm font-black text-brand">
                {weekStats.avgCalories} <span className="text-[10px] text-text-muted font-bold">kcal</span>
              </p>
              <p className="text-[10px] text-text-muted font-medium">
                {weekStats.avgProtein}g P · {weekStats.daysLogged}/7 days
              </p>
            </div>
          </div>

          {weekLoading ? (
            <div className="h-44 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="w-full h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2C" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="#6B6B69"
                    fontSize={11}
                    fontWeight="bold"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#6B6B69"
                    fontSize={10}
                    fontWeight="bold"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(196,165,116,0.06)' }}
                    contentStyle={{
                      backgroundColor: '#171718',
                      borderRadius: '12px',
                      borderColor: '#2A2A2C',
                      color: '#F2F0ED',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                    labelStyle={{ color: '#9C9A96', marginBottom: 4 }}
                    formatter={(value, name) => {
                      if (name === 'calories') return [`${value} kcal`, 'Calories'];
                      return [value, name];
                    }}
                    labelFormatter={(_, payload) => {
                      const row = payload?.[0]?.payload;
                      return row ? `${row.day} · ${row.date}` : '';
                    }}
                  />
                  <ReferenceLine
                    y={calorieTarget}
                    stroke="#C4A574"
                    strokeDasharray="4 4"
                    strokeOpacity={0.7}
                  />
                  <Bar
                    dataKey="calories"
                    radius={[8, 8, 4, 4]}
                    maxBarSize={36}
                    onClick={(data) => {
                      if (data?.date) jumpToDate(data.date);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {weekData.map((entry) => (
                      <Cell
                        key={entry.date}
                        fill={entry.date === selectedDateStr ? '#C4A574' : '#2A2A2C'}
                        stroke={entry.date === selectedDateStr ? '#C4A574' : 'transparent'}
                        strokeWidth={1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* AI Scanner Zone */}
        <div className="bg-bg-surface rounded-3xl p-6 border border-border-subtle shadow-md mb-8 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles size={18} className="text-brand" />
            <h2 className="text-lg font-extrabold tracking-tight text-text-main">AI Meal Scanner</h2>
            <div className="group relative ml-auto">
              <Info size={16} className="text-text-dim cursor-pointer hover:text-text-muted transition-colors" />
              <div className="absolute right-0 top-6 w-52 bg-bg-elevated border border-border-subtle text-xs text-text-muted p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none shadow-xl">
                Supports JPEG, PNG, WEBP & HEIC. Include portion descriptions for best accuracy.
              </div>
            </div>
          </div>

          {!previewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border-subtle hover:border-brand/40 bg-bg-elevated/40 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors mb-4 group"
            >
              <UploadCloud size={30} className="text-text-dim group-hover:text-brand mb-2.5 transition-colors" />
              <p className="text-xs font-bold text-text-main">Tap to upload meal photo</p>
              <p className="text-[10px] text-text-dim mt-1 font-medium">JPEG, PNG, WEBP, HEIC</p>
            </div>
          ) : (
            <div className="relative mb-4">
              <img
                src={previewUrl}
                alt="Meal Preview"
                className="w-full h-48 object-cover rounded-2xl border border-border-subtle"
              />
              <button
                onClick={clearSelection}
                className="absolute top-3 right-3 bg-black/70 backdrop-blur-md p-2 rounded-xl text-text-muted hover:text-text-main transition-colors"
              >
                <X size={15} strokeWidth={2.5} />
              </button>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,image/*"
            className="hidden"
          />

          <input
            type="text"
            placeholder="Describe portion (e.g. '1 large bowl of rice with 200g grilled chicken')"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-bg-elevated rounded-xl px-4 py-3 text-xs font-medium placeholder-text-dim focus:outline-none focus:border-brand transition-all border border-border-subtle text-text-main mb-4"
          />

          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || isAnalyzing}
            className="w-full bg-brand hover:bg-brand-hover text-bg-base py-3.5 rounded-xl font-bold text-xs shadow-[0_0_15px_rgba(196,165,116,0.15)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />
                Scanning Meal...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Sparkles size={15} /> Analyze Meal
              </span>
            )}
          </button>
        </div>

        {/* Today's Logs */}
        <div>
          <h2 className="text-[10px] font-bold tracking-wider text-text-dim mb-3 px-1 uppercase">
            {formatDateLabel(currentDate)}&apos;s Logs ({meals.length})
          </h2>
          {loading ? (
            <div className="text-center py-10 text-text-dim font-bold text-xs animate-pulse">Loading meals...</div>
          ) : meals.length === 0 ? (
            <div className="bg-bg-surface rounded-2xl p-8 border border-border-subtle text-center">
              <p className="text-xs text-text-muted font-medium">No meals logged for this date.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {meals.map((meal) => (
                <div
                  key={meal._id}
                  className="bg-bg-surface rounded-2xl p-4 border border-border-subtle flex gap-4 items-center group transition-colors hover:border-brand/20"
                >
                  {meal.imageUrl ? (
                    <img
                      src={meal.imageUrl}
                      alt={meal.name}
                      className="w-14 h-14 rounded-xl object-cover border border-border-subtle"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-bg-elevated flex items-center justify-center border border-border-subtle">
                      <Flame size={18} className="text-text-dim" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-text-main truncate mb-1">{meal.name}</p>
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                      <span className="bg-bg-elevated px-2 py-0.5 rounded-md text-brand border border-border-subtle">
                        {meal.protein}g P
                      </span>
                      <span className="bg-bg-elevated px-2 py-0.5 rounded-md text-accent-emerald border border-border-subtle">
                        {meal.carbs}g C
                      </span>
                      <span className="bg-bg-elevated px-2 py-0.5 rounded-md text-accent-amber border border-border-subtle">
                        {meal.fats}g F
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-sm font-black text-text-main">
                      {meal.calories} <span className="text-[9px] text-text-dim">KCAL</span>
                    </span>
                    <button
                      onClick={() => setDeleteTargetId(meal._id)}
                      className="text-text-dim hover:text-accent-rose p-1 rounded-md hover:bg-accent-rose/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete Meal"
                    >
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Setup / Edit Goals Modal */}
      {showSetup && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-bg-surface border border-border-subtle w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {userTargets && (
              <button
                onClick={() => setShowSetup(false)}
                className="absolute top-4 right-4 text-text-dim hover:text-text-main bg-bg-elevated p-1.5 rounded-xl transition-colors"
              >
                <X size={15} strokeWidth={2.5} />
              </button>
            )}

            <h2 className="text-lg font-extrabold text-text-main mb-1">Set Daily Targets</h2>
            <p className="text-xs text-text-muted mb-6">Customize your baseline calories and macros.</p>

            <form onSubmit={handleSaveSetup} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1">
                  Daily Calories (kcal)
                </label>
                <input
                  type="number"
                  required
                  value={setupData.calories}
                  onChange={(e) => setSetupData({ ...setupData, calories: e.target.value })}
                  className="w-full bg-bg-elevated rounded-xl px-4 py-3 text-xs font-bold text-text-main border border-border-subtle focus:outline-none focus:border-brand"
                />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-brand uppercase tracking-wider mb-1.5 ml-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    required
                    value={setupData.protein}
                    onChange={(e) => setSetupData({ ...setupData, protein: e.target.value })}
                    className="w-full bg-bg-elevated rounded-xl px-3 py-2.5 text-xs font-bold text-text-main text-center border border-border-subtle focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-accent-emerald uppercase tracking-wider mb-1.5 ml-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    required
                    value={setupData.carbs}
                    onChange={(e) => setSetupData({ ...setupData, carbs: e.target.value })}
                    className="w-full bg-bg-elevated rounded-xl px-3 py-2.5 text-xs font-bold text-text-main text-center border border-border-subtle focus:outline-none focus:border-accent-emerald"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-accent-amber uppercase tracking-wider mb-1.5 ml-1">
                    Fats (g)
                  </label>
                  <input
                    type="number"
                    required
                    value={setupData.fats}
                    onChange={(e) => setSetupData({ ...setupData, fats: e.target.value })}
                    className="w-full bg-bg-elevated rounded-xl px-3 py-2.5 text-xs font-bold text-text-main text-center border border-border-subtle focus:outline-none focus:border-accent-amber"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-brand hover:bg-brand-hover text-bg-base py-3.5 rounded-xl font-bold text-xs shadow-[0_0_15px_rgba(196,165,116,0.15)] transition-all mt-4"
              >
                Save Targets
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI Verification Modal */}
      {showVerification && verificationData && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-bg-surface border border-border-subtle w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowVerification(false)}
              className="absolute top-4 right-4 text-text-dim hover:text-text-main bg-bg-elevated p-1.5 rounded-xl transition-colors"
            >
              <X size={15} strokeWidth={2.5} />
            </button>

            <h2 className="text-lg font-extrabold text-text-main mb-1">Verify AI Scan</h2>
            <p className="text-xs text-text-muted mb-6">Review or edit extracted macronutrients.</p>

            <form onSubmit={handleConfirmLog} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1">
                  Meal Summary
                </label>
                <input
                  type="text"
                  required
                  value={verificationData.name || ''}
                  onChange={(e) => setVerificationData({ ...verificationData, name: e.target.value })}
                  className="w-full bg-bg-elevated rounded-xl px-4 py-3 text-xs font-bold text-text-main border border-border-subtle focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1">
                  Calories (kcal)
                </label>
                <input
                  type="number"
                  required
                  value={verificationData.calories || 0}
                  onChange={(e) =>
                    setVerificationData({ ...verificationData, calories: Number(e.target.value) })
                  }
                  className="w-full bg-bg-elevated rounded-xl px-4 py-3 text-xs font-bold text-text-main border border-border-subtle focus:outline-none focus:border-brand"
                />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-brand uppercase tracking-wider mb-1.5 ml-1">
                    Protein
                  </label>
                  <input
                    type="number"
                    required
                    value={verificationData.protein || 0}
                    onChange={(e) =>
                      setVerificationData({ ...verificationData, protein: Number(e.target.value) })
                    }
                    className="w-full bg-bg-elevated rounded-xl px-3 py-2.5 text-xs font-bold text-text-main text-center border border-border-subtle focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-accent-emerald uppercase tracking-wider mb-1.5 ml-1">
                    Carbs
                  </label>
                  <input
                    type="number"
                    required
                    value={verificationData.carbs || 0}
                    onChange={(e) =>
                      setVerificationData({ ...verificationData, carbs: Number(e.target.value) })
                    }
                    className="w-full bg-bg-elevated rounded-xl px-3 py-2.5 text-xs font-bold text-text-main text-center border border-border-subtle focus:outline-none focus:border-accent-emerald"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-accent-amber uppercase tracking-wider mb-1.5 ml-1">
                    Fats
                  </label>
                  <input
                    type="number"
                    required
                    value={verificationData.fats || 0}
                    onChange={(e) =>
                      setVerificationData({ ...verificationData, fats: Number(e.target.value) })
                    }
                    className="w-full bg-bg-elevated rounded-xl px-3 py-2.5 text-xs font-bold text-text-main text-center border border-border-subtle focus:outline-none focus:border-accent-amber"
                  />
                </div>
              </div>
              <button
                disabled={isLogging}
                type="submit"
                className="w-full bg-brand hover:bg-brand-hover text-bg-base py-3.5 rounded-xl font-bold text-xs shadow-[0_0_15px_rgba(196,165,116,0.15)] transition-all mt-4 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isLogging ? 'Saving Meal...' : (
                  <>
                    <Check size={16} /> Confirm & Log Meal
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDeleteMeal}
        title="Delete Meal Log?"
        message="This meal entry will be permanently removed from today's nutrition log."
        confirmLabel="Delete"
        confirmColor="rose"
        isLoading={isDeleting}
      />
    </div>
  );
}