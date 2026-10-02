import { useState, useEffect, useRef } from 'react';
import { useClerk } from '@clerk/clerk-react';
import api from '../api';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import {
  UserCircle, Camera, Settings, LogOut, Flame, Mail,
  Calendar, ChevronLeft, ChevronRight, Ruler,
  Edit3, Trophy, X, Check, Upload, Trash2
} from 'lucide-react';

const FITNESS_GOALS = ['Muscle Gain', 'Fat Loss', 'Strength', 'General Fitness'];

export default function Profile() {
  const { signOut } = useClerk();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activityData, setActivityData] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Avatar Actions Modal State (Task #22)
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showRemoveAvatarConfirm, setShowRemoveAvatarConfirm] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);

  // Edit Profile Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    age: '',
    gender: 'Male',
    weight: '',
    height: '',
    fitnessGoal: 'General Fitness',
    unitPreference: 'kg',
    targetCalories: 2000,
    targetProtein: 150,
    targetCarbs: 200,
    targetFats: 65,
  });

  useEffect(() => {
    fetchProfile();
    fetchActivity();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/users/me');
      setUser(res.data);
      populateEditForm(res.data);
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async () => {
    try {
      const res = await api.get('/api/workouts/activity');
      setActivityData(res.data);
    } catch (err) {
      console.error('Failed to fetch activity data', err);
    }
  };

  const populateEditForm = (userData) => {
    if (!userData) return;
    
    let weightVal = userData.weight || '';
    if (userData.unitPreference === 'lbs' && userData.weight) {
      weightVal = Math.round(userData.weight * 2.20462);
    }

    setEditForm({
      name: userData.name || '',
      age: userData.age || '',
      gender: userData.gender || 'Male',
      weight: weightVal,
      height: userData.height || '',
      fitnessGoal: userData.fitnessGoal || 'General Fitness',
      unitPreference: userData.unitPreference || 'kg',
      targetCalories: userData.targetCalories || 2000,
      targetProtein: userData.targetProtein || 150,
      targetCarbs: userData.targetCarbs || 200,
      targetFats: userData.targetFats || 65,
    });
  };

  const handleOpenEditModal = () => {
    populateEditForm(user);
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading('Saving profile settings...');

    try {
      let weightInKg = editForm.weight ? Number(editForm.weight) : undefined;
      if (editForm.unitPreference === 'lbs' && weightInKg) {
        weightInKg = Number((weightInKg * 0.453592).toFixed(1));
      }

      const payload = {
        name: editForm.name,
        age: editForm.age ? Number(editForm.age) : undefined,
        gender: editForm.gender,
        unitPreference: editForm.unitPreference,
        weight: weightInKg,
        height: editForm.height ? Number(editForm.height) : undefined,
        fitnessGoal: editForm.fitnessGoal,
        targetCalories: Number(editForm.targetCalories),
        targetProtein: Number(editForm.targetProtein),
        targetCarbs: Number(editForm.targetCarbs),
        targetFats: Number(editForm.targetFats),
      };

      const res = await api.put('/api/users/me', payload);
      setUser(res.data);
      setShowEditModal(false);
      toast.success('Profile updated successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile settings', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // Avatar Click Handler
  const handleAvatarClick = () => {
    if (user?.profilePicture) {
      setShowAvatarMenu(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploading(true);
    setShowAvatarMenu(false);
    const toastId = toast.loading('Uploading avatar...');

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await api.post('/api/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUser(prev => ({ ...prev, profilePicture: res.data.profilePicture }));
      toast.success('Avatar updated!', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload avatar', { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove Avatar Handler (Task #22)
  const handleRemoveAvatar = async () => {
    setIsRemovingAvatar(true);
    const toastId = toast.loading('Removing avatar...');

    try {
      await api.delete('/api/users/me/avatar');
      setUser(prev => ({ ...prev, profilePicture: '' }));
      setShowRemoveAvatarConfirm(false);
      setShowAvatarMenu(false);
      toast.success('Profile picture removed!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove profile picture', { id: toastId });
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  const handleUnitToggle = async (unit) => {
    if (user?.unitPreference === unit) return;

    try {
      const res = await api.put('/api/users/me', { unitPreference: unit });
      setUser(res.data);
      populateEditForm(res.data);
      toast.success(`Weight units set to ${unit.toUpperCase()}`);
    } catch (err) {
      toast.error('Failed to update unit preference');
    }
  };

  const handleLogout = () => {
    signOut({ redirectUrl: '/sign-in' });
  };

  // --- STREAK CALCULATIONS ---
  const calculateStreaks = () => {
    if (!activityData || activityData.length === 0) return { current: 0, best: 0 };

    const activeDates = new Set(
      activityData
        .filter(d => d.count > 0)
        .map(d => d.date)
    );

    const sortedDates = Array.from(activeDates).sort();
    if (sortedDates.length === 0) return { current: 0, best: 0 };

    let current = 0;
    let best = 0;
    let tempStreak = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak += 1;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      if (tempStreak > best) best = tempStreak;
    }

    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    const hasTrainedTodayOrYesterday = activeDates.has(today) || activeDates.has(yesterday);

    if (hasTrainedTodayOrYesterday) {
      let checkDate = new Date(activeDates.has(today) ? today : yesterday);
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (activeDates.has(dateStr)) {
          current += 1;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return { current, best: Math.max(best, current) };
  };

  const streaks = calculateStreaks();

  // --- BMI CALCULATOR ---
  const calculateBMI = () => {
    if (!user?.weight || !user?.height) return null;
    const heightM = user.height / 100;
    const bmi = (user.weight / (heightM * heightM)).toFixed(1);
    return { value: bmi };
  };

  const bmi = calculateBMI();

  // --- CALENDAR RENDERER ---
  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    weekDays.forEach(day => {
      days.push(
        <div key={`header-${day}`} className="text-center text-[10px] font-bold text-text-dim uppercase tracking-wider py-1.5">
          {day}
        </div>
      );
    });

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 sm:h-12"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isTrained = activityData.some(d => d.date === dateString && d.count > 0);
      const isToday = new Date().toISOString().split('T')[0] === dateString;

      days.push(
        <div
          key={`day-${i}`}
          className={`h-10 sm:h-12 flex flex-col items-center justify-center rounded-xl border transition-all duration-300 ${
            isTrained
              ? 'bg-brand/15 border-brand/40 shadow-[0_0_12px_rgba(196,165,116,0.15)]'
              : isToday
                ? 'bg-bg-subtle border-text-dim'
                : 'bg-bg-elevated/40 border-border-subtle/50'
          }`}
        >
          {isTrained ? (
            <Flame size={18} className="text-brand animate-pulse" strokeWidth={2.5} />
          ) : (
            <span className={`text-xs font-bold ${isToday ? 'text-text-main' : 'text-text-dim'}`}>
              {i}
            </span>
          )}
        </div>
      );
    }
    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base text-text-main flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayWeight = user?.weight
    ? user.unitPreference === 'lbs'
      ? `${Math.round(user.weight * 2.20462)} lbs`
      : `${user.weight} kg`
    : 'Not set';

  return (
    <div className="min-h-screen bg-bg-base text-text-main p-4 sm:p-6 font-sans pb-28">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="pt-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Profile</h1>
            <p className="text-text-muted font-medium mt-1 text-sm">Account metrics and preferences</p>
          </div>
          <button
            onClick={handleOpenEditModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-bg-surface hover:bg-bg-elevated border border-border-subtle rounded-xl text-xs font-bold text-brand transition-all shadow-sm"
          >
            <Edit3 size={14} /> Edit Profile
          </button>
        </div>

        {/* User Card */}
        <div className="bg-bg-surface rounded-3xl border border-border-subtle p-6 sm:p-8 flex flex-col items-center text-center mb-6 relative overflow-hidden shadow-lg">
          <div className="relative group mb-4">
            <button
              onClick={handleAvatarClick}
              disabled={uploading}
              className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-border-subtle hover:border-brand transition-all duration-300 focus:outline-none"
              title={user?.profilePicture ? 'Manage profile picture' : 'Upload profile picture'}
            >
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-bg-elevated flex items-center justify-center">
                  <UserCircle size={56} className="text-text-dim" strokeWidth={1} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={22} className="text-white" />
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-text-main">{user?.name || 'User'}</h2>
          <p className="text-xs text-text-muted font-medium mt-1 flex items-center gap-1.5">
            <Mail size={12} /> {user?.email}
          </p>

          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {user?.fitnessGoal && (
              <span className="text-xs font-bold text-brand bg-brand/10 px-3 py-1 rounded-lg border border-brand/20">
                {user.fitnessGoal}
              </span>
            )}
            {user?.age && (
              <span className="text-xs font-bold text-text-muted bg-bg-elevated px-3 py-1 rounded-lg border border-border-subtle">
                {user.age} yrs old
              </span>
            )}
            {user?.createdAt && (
              <span className="text-xs font-bold text-text-dim bg-bg-elevated px-3 py-1 rounded-lg border border-border-subtle flex items-center gap-1">
                <Calendar size={11} /> Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>

        {/* Streaks Banner */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
            <div className="w-11 h-11 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
              <Flame size={22} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Current Streak</p>
              <p className="text-xl font-black text-text-main">{streaks.current} <span className="text-xs text-text-muted font-bold">DAYS</span></p>
            </div>
          </div>

          <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
            <div className="w-11 h-11 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
              <Trophy size={22} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Longest Streak</p>
              <p className="text-xl font-black text-text-main">{streaks.best} <span className="text-xs text-text-muted font-bold">DAYS</span></p>
            </div>
          </div>
        </div>

        {/* Biometrics & Targets Dashboard */}
        <div className="bg-bg-surface rounded-3xl border border-border-subtle p-5 sm:p-6 mb-6 space-y-4">
          <h2 className="text-xs font-bold text-text-muted tracking-wider uppercase">Biometrics & Goals</h2>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-bg-elevated rounded-2xl p-3.5 border border-border-subtle">
              <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Weight</p>
              <p className="text-base font-extrabold text-text-main mt-0.5">{displayWeight}</p>
            </div>
            <div className="bg-bg-elevated rounded-2xl p-3.5 border border-border-subtle">
              <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Height</p>
              <p className="text-base font-extrabold text-text-main mt-0.5">{user?.height ? `${user.height} cm` : 'Not set'}</p>
            </div>
            <div className="bg-bg-elevated rounded-2xl p-3.5 border border-border-subtle">
              <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider">BMI</p>
              <p className="text-base font-extrabold text-brand mt-0.5">{bmi ? `${bmi.value}` : 'N/A'}</p>
            </div>
          </div>

          <div className="bg-bg-elevated rounded-2xl p-4 border border-border-subtle">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-text-main flex items-center gap-1.5">
                <Flame size={14} className="text-brand" /> Daily Macro Targets
              </span>
              <span className="text-xs font-black text-brand">{user?.targetCalories || 2000} kcal</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
              <div className="bg-bg-surface p-2 rounded-xl border border-border-subtle">
                <span className="text-brand block text-[10px] uppercase">Protein</span>
                <span className="text-text-main">{user?.targetProtein || 150}g</span>
              </div>
              <div className="bg-bg-surface p-2 rounded-xl border border-border-subtle">
                <span className="text-accent-emerald block text-[10px] uppercase">Carbs</span>
                <span className="text-text-main">{user?.targetCarbs || 200}g</span>
              </div>
              <div className="bg-bg-surface p-2 rounded-xl border border-border-subtle">
                <span className="text-accent-amber block text-[10px] uppercase">Fats</span>
                <span className="text-text-main">{user?.targetFats || 65}g</span>
              </div>
            </div>
          </div>
        </div>

        {/* Streak Calendar */}
        <div className="bg-bg-surface rounded-3xl p-5 sm:p-6 border border-border-subtle shadow-md mb-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xs font-bold text-text-muted tracking-wider uppercase">Activity Heatmap</h2>
            <div className="flex items-center gap-3 bg-bg-elevated px-3 py-1.5 rounded-xl border border-border-subtle">
              <button onClick={() => changeMonth(-1)} className="text-text-muted hover:text-text-main">
                <ChevronLeft size={16} />
              </button>
              <span className="font-bold text-xs w-28 text-center text-text-main">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <button onClick={() => changeMonth(1)} className="text-text-muted hover:text-text-main">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {renderCalendar()}
          </div>
        </div>

        {/* Settings Hub */}
        <div className="bg-bg-surface rounded-3xl border border-border-subtle overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-border-subtle">
            <h2 className="text-xs font-bold text-text-muted tracking-wider uppercase flex items-center gap-2">
              <Settings size={14} /> Preferences
            </h2>
          </div>

          <div className="px-5 py-4 flex items-center justify-between border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                <Ruler size={16} />
              </div>
              <div>
                <p className="font-bold text-sm text-text-main">Display Units</p>
                <p className="text-xs text-text-muted">Used for weights across charts & logs</p>
              </div>
            </div>

            <div className="flex bg-bg-elevated rounded-xl border border-border-subtle overflow-hidden">
              <button
                onClick={() => handleUnitToggle('kg')}
                className={`px-3 py-1.5 text-xs font-bold transition-all ${
                  user?.unitPreference === 'kg' ? 'bg-brand text-bg-base' : 'text-text-muted'
                }`}
              >
                KG
              </button>
              <button
                onClick={() => handleUnitToggle('lbs')}
                className={`px-3 py-1.5 text-xs font-bold transition-all ${
                  user?.unitPreference === 'lbs' ? 'bg-brand text-bg-base' : 'text-text-muted'
                }`}
              >
                LBS
              </button>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full px-5 py-4 flex items-center gap-3 hover:bg-accent-rose/10 transition-colors group text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-accent-rose/10 flex items-center justify-center text-accent-rose">
              <LogOut size={16} />
            </div>
            <div>
              <p className="font-bold text-sm text-accent-rose">Log Out</p>
              <p className="text-xs text-text-dim">End session on this device</p>
            </div>
          </button>
        </div>

      </div>

      {/* AVATAR ACTION SHEET MODAL (Task #22 Frontend) */}
      {showAvatarMenu && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-bg-surface border border-border-subtle w-full max-w-xs rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-center">
            <button
              onClick={() => setShowAvatarMenu(false)}
              className="absolute top-4 right-4 text-text-dim hover:text-text-main bg-bg-elevated p-1.5 rounded-xl transition-colors"
            >
              <X size={15} strokeWidth={2.5} />
            </button>

            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand mx-auto mb-3">
              <img src={user?.profilePicture} alt="Current Avatar" className="w-full h-full object-cover" />
            </div>
            
            <h3 className="text-base font-extrabold text-text-main mb-1">Profile Photo</h3>
            <p className="text-xs text-text-muted mb-6">Choose an action for your avatar.</p>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-bg-base font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Upload size={14} /> Upload New Photo
              </button>

              <button
                onClick={() => {
                  setShowRemoveAvatarConfirm(true);
                }}
                className="w-full py-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose hover:bg-accent-rose/20 font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Remove Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REMOVE AVATAR CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={showRemoveAvatarConfirm}
        onClose={() => setShowRemoveAvatarConfirm(false)}
        onConfirm={handleRemoveAvatar}
        title="Remove Profile Picture?"
        message="Your custom avatar will be deleted permanently from Cloudinary."
        confirmLabel="Remove"
        confirmColor="rose"
        isLoading={isRemovingAvatar}
      />

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-bg-surface border border-border-subtle w-full max-w-lg rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-5 right-5 text-text-dim hover:text-text-main bg-bg-elevated p-1.5 rounded-xl transition-colors"
            >
              <X size={16} strokeWidth={2.5} />
            </button>

            <h2 className="text-xl font-extrabold text-text-main mb-1">Edit Profile Settings</h2>
            <p className="text-xs text-text-muted mb-6">Update your biometrics, unit preferences, and macro goals.</p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1">Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-bg-elevated rounded-xl px-4 py-3 text-sm font-bold text-text-main border border-border-subtle focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1">Age</label>
                  <input
                    type="number"
                    value={editForm.age}
                    onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                    className="w-full bg-bg-elevated rounded-xl px-4 py-3 text-sm font-bold text-text-main border border-border-subtle focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full bg-bg-elevated rounded-xl px-4 py-3 text-sm font-bold text-text-main border border-border-subtle focus:outline-none focus:border-brand appearance-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1">
                    Weight ({editForm.unitPreference.toUpperCase()})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={editForm.weight}
                    onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                    className="w-full bg-bg-elevated rounded-xl px-4 py-3 text-sm font-bold text-text-main border border-border-subtle focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1">Height (CM)</label>
                  <input
                    type="number"
                    value={editForm.height}
                    onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                    className="w-full bg-bg-elevated rounded-xl px-4 py-3 text-sm font-bold text-text-main border border-border-subtle focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1">Fitness Goal</label>
                <select
                  value={editForm.fitnessGoal}
                  onChange={(e) => setEditForm({ ...editForm, fitnessGoal: e.target.value })}
                  className="w-full bg-bg-elevated rounded-xl px-4 py-3 text-sm font-bold text-text-main border border-border-subtle focus:outline-none focus:border-brand appearance-none"
                >
                  {FITNESS_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div className="pt-2 border-t border-border-subtle">
                <p className="text-xs font-bold text-brand uppercase tracking-wider mb-3">Daily Macro Goals</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Calories (kcal)</label>
                    <input
                      type="number"
                      required
                      value={editForm.targetCalories}
                      onChange={(e) => setEditForm({ ...editForm, targetCalories: e.target.value })}
                      className="w-full bg-bg-elevated rounded-xl px-4 py-2.5 text-sm font-bold text-text-main border border-border-subtle"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-brand uppercase mb-1">Protein (g)</label>
                      <input
                        type="number"
                        required
                        value={editForm.targetProtein}
                        onChange={(e) => setEditForm({ ...editForm, targetProtein: e.target.value })}
                        className="w-full bg-bg-elevated rounded-xl px-3 py-2 text-sm font-bold text-text-main text-center border border-border-subtle"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-accent-emerald uppercase mb-1">Carbs (g)</label>
                      <input
                        type="number"
                        required
                        value={editForm.targetCarbs}
                        onChange={(e) => setEditForm({ ...editForm, targetCarbs: e.target.value })}
                        className="w-full bg-bg-elevated rounded-xl px-3 py-2 text-sm font-bold text-text-main text-center border border-border-subtle"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-accent-amber uppercase mb-1">Fats (g)</label>
                      <input
                        type="number"
                        required
                        value={editForm.targetFats}
                        onChange={(e) => setEditForm({ ...editForm, targetFats: e.target.value })}
                        className="w-full bg-bg-elevated rounded-xl px-3 py-2 text-sm font-bold text-text-main text-center border border-border-subtle"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-text-muted bg-bg-elevated border border-border-subtle hover:text-text-main"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-brand hover:bg-brand-hover text-bg-base py-3 rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(196,165,116,0.15)] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : <><Check size={16} /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}