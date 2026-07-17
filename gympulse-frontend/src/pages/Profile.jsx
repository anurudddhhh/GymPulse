import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  UserCircle, Camera, Settings, LogOut, Flame, Mail,
  Target, Calendar, ChevronLeft, ChevronRight, Ruler
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activityData, setActivityData] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchProfile();
    fetchActivity();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/workouts/activity', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivityData(res.data);
    } catch (err) {
      console.error('Failed to fetch activity data', err);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Uploading avatar...');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await axios.post('http://localhost:5000/api/users/me/avatar', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setUser(prev => ({ ...prev, profilePicture: res.data.profilePicture }));
      toast.success('Avatar updated!', { id: toastId });
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to upload avatar';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUnitChange = async (unit) => {
    if (user?.unitPreference === unit) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('http://localhost:5000/api/users/me',
        { unitPreference: unit },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(res.data);
      toast.success(`Units switched to ${unit.toUpperCase()}`);
    } catch (err) {
      toast.error('Failed to update preference');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

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
        <div key={`header-${day}`} className="text-center text-xs font-bold text-zinc-500 py-2">
          {day}
        </div>
      );
    });

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 sm:h-14"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isTrained = activityData.some(d => d.date === dateString && d.count > 0);
      const isToday = new Date().toISOString().split('T')[0] === dateString;

      days.push(
        <div
          key={`day-${i}`}
          className={`h-12 sm:h-14 flex flex-col items-center justify-center rounded-xl border transition-all duration-300 ${
            isTrained
              ? 'bg-orange-950/40 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.25)]'
              : isToday
                ? 'bg-zinc-800/80 border-zinc-500'
                : 'bg-zinc-900/30 border-zinc-800/50'
          }`}
        >
          {isTrained ? (
            <Flame
              size={20}
              className="text-orange-500 animate-pulse filter drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]"
              strokeWidth={2.5}
            />
          ) : (
            <span className={`text-sm font-bold ${isToday ? 'text-white' : 'text-zinc-600'}`}>
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
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
        <p className="text-zinc-500 font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 sm:p-6 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="pt-4 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Profile</h1>
          <p className="text-zinc-500 font-medium mt-1">Your account and preferences</p>
        </div>

        {/* Avatar + Name Section */}
        <div className="bg-[#18181b] rounded-3xl border border-zinc-800/80 p-8 flex flex-col items-center gap-4 mb-6">
          {/* Avatar with upload overlay */}
          <div className="relative group">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-zinc-700 hover:border-blue-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#18181b]"
            >
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                  <UserCircle size={56} className="text-zinc-600" strokeWidth={1} />
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={24} className="text-white" strokeWidth={1.8} />
              </div>
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />

            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-extrabold tracking-tight">{user?.name || 'User'}</h2>
            <p className="text-sm text-zinc-500 font-medium mt-1 flex items-center justify-center gap-1.5">
              <Mail size={13} strokeWidth={2} />
              {user?.email}
            </p>
          </div>

          {/* Quick info pills */}
          {(user?.fitnessGoal || user?.age) && (
            <div className="flex flex-wrap gap-2 justify-center mt-1">
              {user.fitnessGoal && (
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                  {user.fitnessGoal}
                </span>
              )}
              {user.age && (
                <span className="text-xs font-bold text-zinc-400 bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700">
                  {user.age} years old
                </span>
              )}
              {user.createdAt && (
                <span className="text-xs font-bold text-zinc-500 bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-800 flex items-center gap-1">
                  <Calendar size={11} strokeWidth={2} />
                  Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Streak Calendar */}
        <div className="bg-[#18181b] rounded-3xl p-5 sm:p-6 border border-zinc-800/80 shadow-lg mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-zinc-400 tracking-wide uppercase">Streak Calendar</h2>
            <div className="flex items-center gap-4 bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800">
              <button onClick={() => changeMonth(-1)} className="text-zinc-500 hover:text-white transition-colors">
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>
              <span className="font-bold text-sm w-24 text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <button onClick={() => changeMonth(1)} className="text-zinc-500 hover:text-white transition-colors">
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {renderCalendar()}
          </div>
        </div>

        {/* Settings Hub */}
        <div className="bg-[#18181b] rounded-3xl border border-zinc-800/80 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-zinc-800/60">
            <h2 className="text-sm font-bold text-zinc-400 tracking-wide uppercase flex items-center gap-2">
              <Settings size={14} strokeWidth={2.2} />
              Settings
            </h2>
          </div>

          {/* Unit Preference */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-800/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Ruler size={16} className="text-blue-500" strokeWidth={2} />
              </div>
              <div>
                <p className="font-bold text-sm text-zinc-200">Weight Unit</p>
                <p className="text-xs text-zinc-600 mt-0.5">Used across all displays</p>
              </div>
            </div>

            <div className="flex bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <button
                onClick={() => handleUnitChange('kg')}
                className={`px-4 py-2 text-xs font-extrabold tracking-wide transition-all ${
                  user?.unitPreference === 'kg'
                    ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                KG
              </button>
              <button
                onClick={() => handleUnitChange('lbs')}
                className={`px-4 py-2 text-xs font-extrabold tracking-wide transition-all ${
                  user?.unitPreference === 'lbs'
                    ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                LBS
              </button>
            </div>
          </div>

          {/* User Stats */}
          {(user?.weight || user?.height) && (
            <div className="px-5 py-4 flex items-center gap-6 border-b border-zinc-800/40">
              {user.weight && (
                <div>
                  <p className="text-xs font-bold text-zinc-600 tracking-wider uppercase">Weight</p>
                  <p className="text-lg font-extrabold text-zinc-200">
                    {user.unitPreference === 'lbs'
                      ? `${Math.round(user.weight * 2.205)} lbs`
                      : `${user.weight} kg`
                    }
                  </p>
                </div>
              )}
              {user.height && (
                <div>
                  <p className="text-xs font-bold text-zinc-600 tracking-wider uppercase">Height</p>
                  <p className="text-lg font-extrabold text-zinc-200">{user.height} cm</p>
                </div>
              )}
              {user.gender && (
                <div>
                  <p className="text-xs font-bold text-zinc-600 tracking-wider uppercase">Gender</p>
                  <p className="text-lg font-extrabold text-zinc-200">{user.gender}</p>
                </div>
              )}
            </div>
          )}

          {/* Fitness Goal */}
          {user?.fitnessGoal && (
            <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-800/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Target size={16} className="text-emerald-500" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-bold text-sm text-zinc-200">Fitness Goal</p>
                  <p className="text-xs text-zinc-600 mt-0.5">Your current training focus</p>
                </div>
              </div>
              <span className="text-sm font-bold text-zinc-300">{user.fitnessGoal}</span>
            </div>
          )}

          {/* Log Out */}
          <button
            onClick={handleLogout}
            className="w-full px-5 py-4 flex items-center gap-3 hover:bg-red-500/5 transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
              <LogOut size={16} className="text-red-500" strokeWidth={2} />
            </div>
            <p className="font-bold text-sm text-red-500">Log Out</p>
          </button>
        </div>
      </div>
    </div>
  );
}
