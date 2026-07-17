import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  ChevronLeft, ChevronRight, UploadCloud, X, Trash2, 
  Flame, Beef, Wheat, Droplet, Info, Sparkles, Check
} from 'lucide-react';

export default function Calories() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [nutritionData, setNutritionData] = useState({ meals: [] });
  const [userTargets, setUserTargets] = useState(null);
  const [loading, setLoading] = useState(true);

  // Setup Modal State
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState({ calories: 2500, protein: 150, carbs: 250, fats: 80 });

  // AI Scanner State
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Verification Modal State
  const [showVerification, setShowVerification] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [isLogging, setIsLogging] = useState(false);

  useEffect(() => {
    fetchTargets();
  }, []);

  useEffect(() => {
    fetchNutritionData(currentDate);
  }, [currentDate]);

  const fetchTargets = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.data.targetCalories) {
        setShowSetup(true);
      } else {
        setUserTargets({
          calories: res.data.targetCalories,
          protein: res.data.targetProtein,
          carbs: res.data.targetCarbs,
          fats: res.data.targetFats
        });
      }
    } catch (err) {
      console.error('Failed to fetch user targets', err);
    }
  };

  const handleSaveSetup = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/users/me', {
        targetCalories: setupData.calories,
        targetProtein: setupData.protein,
        targetCarbs: setupData.carbs,
        targetFats: setupData.fats
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setUserTargets(setupData);
      setShowSetup(false);
      toast.success('Macro goals saved!');
    } catch (err) {
      toast.error('Failed to save goals');
    }
  };

  const fetchNutritionData = async (dateObj) => {
    setLoading(true);
    const dateStr = dateObj.toISOString().split('T')[0];
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/nutrition/${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNutritionData(res.data);
    } catch (err) {
      console.error('Failed to fetch nutrition data', err);
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (offsetDays) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + offsetDays);
    setCurrentDate(newDate);
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
    
    return dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDescription('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return toast.error('Please select an image first');

    setIsAnalyzing(true);
    const toastId = toast.loading('AI is scanning your meal...');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      if (description) formData.append('description', description);

      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/nutrition/analyze', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setVerificationData({
        ...res.data.estimatedMacros,
        imageUrl: res.data.imageUrl
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
    const toastId = toast.loading('Logging meal...');
    const dateStr = currentDate.toISOString().split('T')[0];

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/nutrition', {
        date: dateStr,
        ...verificationData
      }, { headers: { Authorization: `Bearer ${token}` } });

      setNutritionData(res.data);
      setShowVerification(false);
      clearSelection();
      toast.success('Meal logged!', { id: toastId });
    } catch (err) {
      toast.error('Failed to log meal', { id: toastId });
    } finally {
      setIsLogging(false);
    }
  };

  const handleDeleteFood = async (mealId) => {
    const toastId = toast.loading('Deleting...');
    const dateStr = currentDate.toISOString().split('T')[0];
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`http://localhost:5000/api/nutrition/${dateStr}/${mealId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNutritionData(res.data.log);
      toast.success('Deleted', { id: toastId });
    } catch (err) {
      toast.error('Failed to delete', { id: toastId });
    }
  };

  // Calculations
  const meals = nutritionData.meals || [];
  const totals = meals.reduce((acc, meal) => {
    acc.calories += meal.calories || 0;
    acc.protein += meal.protein || 0;
    acc.carbs += meal.carbs || 0;
    acc.fats += meal.fats || 0;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const getPercentage = (consumed, target) => {
    if (!target) return 0;
    return Math.min(100, Math.round((consumed / target) * 100));
  };

  // If we don't have targets yet, show a blank screen behind the modal
  if (!userTargets && !showSetup) return null;

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 sm:p-6 font-sans pb-24 relative">
      <div className="max-w-2xl mx-auto">
        
        {/* Header & Date Navigator */}
        <div className="flex justify-between items-center mb-6 pt-4">
          <h1 className="text-3xl font-extrabold tracking-tight">Nutrition</h1>
          <div className="flex items-center gap-4 bg-[#18181b] px-4 py-2 rounded-xl border border-zinc-800">
            <button onClick={() => changeDate(-1)} className="text-zinc-500 hover:text-white transition-colors">
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <span className="font-bold text-sm w-24 text-center text-blue-400">
              {formatDateLabel(currentDate)}
            </span>
            <button onClick={() => changeDate(1)} className="text-zinc-500 hover:text-white transition-colors">
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Macro Dashboard */}
        {userTargets && (
          <div className="bg-[#18181b] rounded-3xl p-6 border border-zinc-800/80 shadow-lg mb-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-bold text-zinc-500 tracking-wider uppercase mb-1">Calories Consumed</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black">{totals.calories}</span>
                  <span className="text-sm font-bold text-zinc-500">/ {userTargets.calories} kcal</span>
                </div>
              </div>
              <Flame size={36} className={totals.calories > userTargets.calories ? 'text-red-500' : 'text-orange-500'} strokeWidth={1.5} />
            </div>

            {/* Macro Bars */}
            <div className="space-y-5">
              {/* Protein */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-zinc-400 flex items-center gap-1"><Beef size={12}/> Protein</span>
                  <span className="text-zinc-300">{totals.protein}g <span className="text-zinc-600">/ {userTargets.protein}g</span></span>
                </div>
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500 rounded-full" 
                    style={{ width: `${getPercentage(totals.protein, userTargets.protein)}%` }}
                  />
                </div>
              </div>
              {/* Carbs */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-zinc-400 flex items-center gap-1"><Wheat size={12}/> Carbs</span>
                  <span className="text-zinc-300">{totals.carbs}g <span className="text-zinc-600">/ {userTargets.carbs}g</span></span>
                </div>
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500 rounded-full" 
                    style={{ width: `${getPercentage(totals.carbs, userTargets.carbs)}%` }}
                  />
                </div>
              </div>
              {/* Fats */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-zinc-400 flex items-center gap-1"><Droplet size={12}/> Fats</span>
                  <span className="text-zinc-300">{totals.fats}g <span className="text-zinc-600">/ {userTargets.fats}g</span></span>
                </div>
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-500 rounded-full" 
                    style={{ width: `${getPercentage(totals.fats, userTargets.fats)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Scanner Zone */}
        <div className="bg-[#18181b] rounded-3xl p-6 border border-zinc-800/80 shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          
          <div className="flex items-center gap-2 mb-6">
            <Sparkles size={20} className="text-blue-400" />
            <h2 className="text-xl font-extrabold tracking-tight">AI Meal Scanner</h2>
            <div className="group relative ml-auto">
              <Info size={16} className="text-zinc-500 cursor-pointer" />
              <div className="absolute right-0 top-6 w-48 bg-zinc-800 text-xs p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                For best results, describe the quantity clearly (e.g. "2 cups of rice, 1 tbsp olive oil").
              </div>
            </div>
          </div>

          {!previewUrl ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 hover:border-blue-500/50 bg-zinc-900/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors mb-4 group"
            >
              <UploadCloud size={32} className="text-zinc-500 group-hover:text-blue-400 mb-3 transition-colors" />
              <p className="text-sm font-bold text-zinc-300">Tap to upload meal photo</p>
              <p className="text-xs text-zinc-600 mt-1">JPEG, PNG</p>
            </div>
          ) : (
            <div className="relative mb-4">
              <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded-2xl border border-zinc-800" />
              <button 
                onClick={clearSelection}
                className="absolute top-3 right-3 bg-black/60 backdrop-blur-md p-2 rounded-xl text-zinc-300 hover:text-white transition-colors"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*" 
            className="hidden" 
          />

          <input
            type="text"
            placeholder="Describe quantity (e.g. '1 large bowl, cooked in butter')"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#27272a] rounded-xl px-4 py-3 text-sm font-medium placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white mb-4"
          />

          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || isAnalyzing}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-extrabold text-sm shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 relative overflow-hidden"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Scanning Image...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles size={16} /> Analyze Meal
              </span>
            )}
          </button>
        </div>

        {/* Chronological Feed */}
        <div>
          <h2 className="text-sm font-extrabold tracking-wide text-zinc-400 mb-4 px-1 uppercase">Today's Logs</h2>
          {loading ? (
             <div className="text-center py-10 animate-pulse text-zinc-600 font-bold">Loading...</div>
          ) : meals.length === 0 ? (
            <div className="bg-[#18181b] rounded-3xl p-8 border border-zinc-800 text-center">
              <p className="text-sm text-zinc-500 font-medium">No meals logged today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {meals.map(meal => (
                <div key={meal._id} className="bg-[#18181b] rounded-2xl p-4 border border-zinc-800 flex gap-4 items-center group transition-colors hover:bg-zinc-800/30">
                  {meal.imageUrl ? (
                    <img src={meal.imageUrl} alt={meal.name} className="w-16 h-16 rounded-xl object-cover border border-zinc-700" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700">
                      <Flame size={20} className="text-zinc-500" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-200 truncate mb-1">{meal.name}</p>
                    <div className="flex flex-wrap gap-2 text-[10px] font-extrabold text-zinc-500">
                      <span className="bg-zinc-800 px-2 py-0.5 rounded-md text-blue-400">{meal.protein}g P</span>
                      <span className="bg-zinc-800 px-2 py-0.5 rounded-md text-emerald-400">{meal.carbs}g C</span>
                      <span className="bg-zinc-800 px-2 py-0.5 rounded-md text-amber-400">{meal.fats}g F</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-sm font-black text-white">{meal.calories} <span className="text-[10px] text-zinc-500">KCAL</span></span>
                    <button 
                      onClick={() => handleDeleteFood(meal._id)}
                      className="text-zinc-600 hover:text-red-500 p-1.5 rounded-md hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} strokeWidth={2.5}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Setup Modal */}
      {showSetup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#18181b] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-extrabold mb-1">Set Your Goals</h2>
            <p className="text-xs text-zinc-500 font-medium mb-6">Customize your daily macro targets.</p>

            <form onSubmit={handleSaveSetup} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1.5 ml-1">Daily Calories</label>
                <input type="number" required value={setupData.calories} onChange={(e) => setSetupData({...setupData, calories: Number(e.target.value)})} className="w-full bg-[#27272a] rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-wide mb-1.5 ml-1">Protein (g)</label>
                  <input type="number" required value={setupData.protein} onChange={(e) => setSetupData({...setupData, protein: Number(e.target.value)})} className="w-full bg-[#27272a] rounded-xl px-3 py-3 text-sm font-bold text-white text-center focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wide mb-1.5 ml-1">Carbs (g)</label>
                  <input type="number" required value={setupData.carbs} onChange={(e) => setSetupData({...setupData, carbs: Number(e.target.value)})} className="w-full bg-[#27272a] rounded-xl px-3 py-3 text-sm font-bold text-white text-center focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-wide mb-1.5 ml-1">Fats (g)</label>
                  <input type="number" required value={setupData.fats} onChange={(e) => setSetupData({...setupData, fats: Number(e.target.value)})} className="w-full bg-[#27272a] rounded-xl px-3 py-3 text-sm font-bold text-white text-center focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-extrabold text-sm shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:bg-blue-500 transition-all mt-4">
                Save & Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI Verification Modal */}
      {showVerification && verificationData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#18181b] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowVerification(false)} className="absolute top-5 right-5 text-zinc-500 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 p-1.5 rounded-lg transition-colors">
              <X size={16} strokeWidth={2.5} />
            </button>
            
            <h2 className="text-xl font-extrabold mb-1">Verify Macros</h2>
            <p className="text-xs text-zinc-500 font-medium mb-6">Adjust if the AI missed anything.</p>

            <form onSubmit={handleConfirmLog} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1.5 ml-1">Meal Name</label>
                <input type="text" required value={verificationData.name || ''} onChange={(e) => setVerificationData({...verificationData, name: e.target.value})} className="w-full bg-[#27272a] rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1.5 ml-1">Calories</label>
                <input type="number" required value={verificationData.calories || 0} onChange={(e) => setVerificationData({...verificationData, calories: Number(e.target.value)})} className="w-full bg-[#27272a] rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-wide mb-1.5 ml-1">Protein</label>
                  <input type="number" required value={verificationData.protein || 0} onChange={(e) => setVerificationData({...verificationData, protein: Number(e.target.value)})} className="w-full bg-[#27272a] rounded-xl px-3 py-3 text-sm font-bold text-white text-center focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wide mb-1.5 ml-1">Carbs</label>
                  <input type="number" required value={verificationData.carbs || 0} onChange={(e) => setVerificationData({...verificationData, carbs: Number(e.target.value)})} className="w-full bg-[#27272a] rounded-xl px-3 py-3 text-sm font-bold text-white text-center focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-wide mb-1.5 ml-1">Fats</label>
                  <input type="number" required value={verificationData.fats || 0} onChange={(e) => setVerificationData({...verificationData, fats: Number(e.target.value)})} className="w-full bg-[#27272a] rounded-xl px-3 py-3 text-sm font-bold text-white text-center focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
              </div>
              <button disabled={isLogging} type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-extrabold text-sm shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:bg-blue-500 transition-all mt-4 disabled:opacity-50 flex items-center justify-center gap-2">
                {isLogging ? 'Saving...' : <><Check size={16}/> Confirm & Log</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
