import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { 
  Sparkles, ChevronRight, ChevronLeft, Check, 
  Target, Dumbbell, Flame, Scale, ArrowRight
} from 'lucide-react';

const FITNESS_GOALS = [
  { id: 'Muscle Gain', title: 'Muscle Gain', desc: 'Build lean muscle & increase size', icon: Dumbbell },
  { id: 'Fat Loss', title: 'Fat Loss', desc: 'Burn body fat & improve definition', icon: Flame },
  { id: 'Strength', title: 'Strength', desc: 'Maximize raw lifting power & PRs', icon: Target },
  { id: 'General Fitness', title: 'General Fitness', desc: 'Maintain health, mobility & stamina', icon: Sparkles },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    age: '',
    gender: 'Male',
    unitPreference: 'kg',
    weight: '',
    height: '',
    fitnessGoal: 'Muscle Gain',
    targetCalories: 2500,
    targetProtein: 160,
    targetCarbs: 260,
    targetFats: 70,
  });

  // Calculate recommended nutrition targets using Mifflin-St Jeor formula
  const calculateRecommendations = (data) => {
    const age = Number(data.age) || 25;
    let weightKg = Number(data.weight) || 75;
    if (data.unitPreference === 'lbs') {
      weightKg = Math.round(weightKg * 0.453592);
    }
    const heightCm = Number(data.height) || 175;

    // BMR estimation
    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    bmr += (data.gender === 'Female' ? -161 : 5);

    // TDEE (Moderate activity multiplier ~1.4)
    let tdee = Math.round(bmr * 1.4);

    let calories = tdee;
    let protein = Math.round(weightKg * 2.0); // 2g per kg

    if (data.fitnessGoal === 'Muscle Gain') {
      calories = Math.round(tdee + 350); // Surplus
      protein = Math.round(weightKg * 2.2);
    } else if (data.fitnessGoal === 'Fat Loss') {
      calories = Math.max(1400, Math.round(tdee - 450)); // Deficit
      protein = Math.round(weightKg * 2.3); // High protein to preserve muscle
    } else if (data.fitnessGoal === 'Strength') {
      calories = Math.round(tdee + 200);
      protein = Math.round(weightKg * 2.0);
    }

    const fats = Math.round((calories * 0.25) / 9);
    const carbs = Math.max(50, Math.round((calories - (protein * 4) - (fats * 9)) / 4));

    return {
      targetCalories: Math.max(1200, calories),
      targetProtein: Math.max(50, protein),
      targetCarbs: Math.max(50, carbs),
      targetFats: Math.max(30, fats)
    };
  };

  const handleGoalSelect = (goalId) => {
    const updated = { ...formData, fitnessGoal: goalId };
    const recs = calculateRecommendations(updated);
    setFormData({ ...updated, ...recs });
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.age || !formData.weight || !formData.height) {
        toast.error('Please enter your age, weight, and height');
        return;
      }
      const recs = calculateRecommendations(formData);
      setFormData(prev => ({ ...prev, ...recs }));
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading('Configuring your profile...');

    try {
      const weightInKg = formData.unitPreference === 'lbs' 
        ? Math.round(Number(formData.weight) * 0.453592) 
        : Number(formData.weight);

      await api.put('/api/users/me', {
        age: Number(formData.age),
        gender: formData.gender,
        unitPreference: formData.unitPreference,
        weight: weightInKg,
        height: Number(formData.height),
        fitnessGoal: formData.fitnessGoal,
        targetCalories: Number(formData.targetCalories),
        targetProtein: Number(formData.targetProtein),
        targetCarbs: Number(formData.targetCarbs),
        targetFats: Number(formData.targetFats),
      });

      toast.success('Welcome to GymPulse!', { id: toastId });
      navigate('/app/workout', { replace: true });
    } catch (err) {
      console.error(err);
      toast.error('Failed to complete setup. Please try again.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-main flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-lg bg-bg-surface border border-border-subtle rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        
        {/* Step Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[11px] font-bold text-brand uppercase tracking-widest">
              Step {step} of 3
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight mt-0.5">
              {step === 1 && "Personal Profile"}
              {step === 2 && "Primary Fitness Goal"}
              {step === 3 && "Your Daily Blueprint"}
            </h1>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step 
                    ? 'w-8 bg-brand' 
                    : s < step 
                      ? 'w-4 bg-accent-emerald' 
                      : 'w-4 bg-bg-subtle'
                }`} 
              />
            ))}
          </div>
        </div>

        {/* STEP 1: Biometrics */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-4">
            <p className="text-xs text-text-muted mb-2">
              Provide your details so GymPulse can calibrate accurate training and nutrition targets.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1">
                  Age
                </label>
                <input
                  type="number"
                  min="12"
                  max="100"
                  required
                  placeholder="e.g. 23"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full bg-bg-elevated rounded-xl px-4 py-3 text-sm font-bold text-text-main border border-border-subtle focus:outline-none focus:border-brand transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-bg-elevated rounded-xl px-4 py-3 text-sm font-bold text-text-main border border-border-subtle focus:outline-none focus:border-brand transition-all appearance-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Units Toggle */}
            <div className="bg-bg-elevated p-3 rounded-2xl border border-border-subtle flex items-center justify-between">
              <span className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                <Scale size={14} className="text-brand" /> Weight Unit Preference
              </span>
              <div className="flex bg-bg-surface rounded-xl border border-border-subtle overflow-hidden">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, unitPreference: 'kg' })}
                  className={`px-3 py-1.5 text-xs font-bold transition-all ${
                    formData.unitPreference === 'kg' ? 'bg-brand text-white' : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  KG
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, unitPreference: 'lbs' })}
                  className={`px-3 py-1.5 text-xs font-bold transition-all ${
                    formData.unitPreference === 'lbs' ? 'bg-brand text-white' : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  LBS
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1">
                  Weight ({formData.unitPreference.toUpperCase()})
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="30"
                  max="350"
                  required
                  placeholder={formData.unitPreference === 'kg' ? 'e.g. 75' : 'e.g. 165'}
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full bg-bg-elevated rounded-xl px-4 py-3 text-sm font-bold text-text-main border border-border-subtle focus:outline-none focus:border-brand transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1">
                  Height (CM)
                </label>
                <input
                  type="number"
                  min="100"
                  max="250"
                  required
                  placeholder="e.g. 178"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="w-full bg-bg-elevated rounded-xl px-4 py-3 text-sm font-bold text-text-main border border-border-subtle focus:outline-none focus:border-brand transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-brand hover:bg-brand-hover text-white py-3.5 rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all flex items-center justify-center gap-2 mt-6"
            >
              Continue <ChevronRight size={16} />
            </button>
          </form>
        )}

        {/* STEP 2: Fitness Goals */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-text-muted mb-2">
              Select your primary training focus. This dynamically calibrates your daily macro breakdown.
            </p>

            <div className="space-y-2.5">
              {FITNESS_GOALS.map(({ id, title, desc, icon: Icon }) => {
                const isSelected = formData.fitnessGoal === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleGoalSelect(id)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all ${
                      isSelected 
                        ? 'bg-brand/10 border-brand shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                        : 'bg-bg-elevated border-border-subtle hover:border-text-dim'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-brand text-white' : 'bg-bg-subtle text-text-muted'}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-text-main">{title}</p>
                      <p className="text-xs text-text-muted mt-0.5">{desc}</p>
                    </div>
                    {isSelected && <Check size={18} className="text-brand" />}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-3.5 rounded-xl bg-bg-elevated text-text-muted hover:text-text-main border border-border-subtle transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 bg-brand hover:bg-brand-hover text-white py-3.5 rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all flex items-center justify-center gap-2"
              >
                Review Macro Targets <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Macro Targets Review & Confirmation */}
        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4">
            <div className="bg-bg-elevated border border-border-subtle p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-brand" />
                <span className="text-xs font-bold text-brand uppercase tracking-wider">
                  AI Calibrated Target
                </span>
              </div>
              <p className="text-xs text-text-muted">
                Calculated for <span className="text-text-main font-bold">{formData.fitnessGoal}</span>. You can adjust any values below.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 ml-1">
                Daily Calories (kcal)
              </label>
              <input
                type="number"
                required
                value={formData.targetCalories}
                onChange={(e) => setFormData({ ...formData, targetCalories: Number(e.target.value) })}
                className="w-full bg-bg-elevated rounded-xl px-4 py-3 text-sm font-black text-text-main border border-border-subtle focus:outline-none focus:border-brand transition-all"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-brand uppercase tracking-wider mb-1.5 ml-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  required
                  value={formData.targetProtein}
                  onChange={(e) => setFormData({ ...formData, targetProtein: Number(e.target.value) })}
                  className="w-full bg-bg-elevated rounded-xl px-3 py-3 text-sm font-bold text-text-main text-center border border-border-subtle focus:outline-none focus:border-brand transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-accent-emerald uppercase tracking-wider mb-1.5 ml-1">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  required
                  value={formData.targetCarbs}
                  onChange={(e) => setFormData({ ...formData, targetCarbs: Number(e.target.value) })}
                  className="w-full bg-bg-elevated rounded-xl px-3 py-3 text-sm font-bold text-text-main text-center border border-border-subtle focus:outline-none focus:border-accent-emerald transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-accent-amber uppercase tracking-wider mb-1.5 ml-1">
                  Fats (g)
                </label>
                <input
                  type="number"
                  required
                  value={formData.targetFats}
                  onChange={(e) => setFormData({ ...formData, targetFats: Number(e.target.value) })}
                  className="w-full bg-bg-elevated rounded-xl px-3 py-3 text-sm font-bold text-text-main text-center border border-border-subtle focus:outline-none focus:border-accent-amber transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-3.5 rounded-xl bg-bg-elevated text-text-muted hover:text-text-main border border-border-subtle transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-brand hover:bg-brand-hover text-white py-3.5 rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Finalizing Setup...' : <>Complete & Start Training <ArrowRight size={16} /></>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}