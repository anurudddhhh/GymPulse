import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { UserCircle, ClipboardList, Dumbbell, Search, Flame } from 'lucide-react';

const navItems = [
  { to: '/app/profile', label: 'Profile', icon: UserCircle },
  { to: '/app/history', label: 'History', icon: ClipboardList },
  { to: '/app/workout', label: 'Workout', icon: Dumbbell },
  { to: '/app/exercises', label: 'Exercises', icon: Search },
  { to: '/app/calories', label: 'Calories', icon: Flame },
];

export default function AppLayout() {
  const location = useLocation();

  // Hide bottom nav during active workout sessions for full-screen focus
  const hideNav = location.pathname.startsWith('/app/workout/active');

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Main content area with bottom padding to clear the fixed nav */}
      <main className={hideNav ? '' : 'pb-24'}>
        <Outlet />
      </main>

      {/* Fixed Bottom Navigation Bar */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'text-blue-500'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`relative flex items-center justify-center rounded-xl transition-all duration-200 ${
                        label === 'Workout'
                          ? isActive
                            ? 'bg-blue-500/15 p-2.5 -mt-3 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                            : 'bg-zinc-800/60 p-2.5 -mt-3'
                          : 'p-1'
                      }`}
                    >
                      <Icon
                        size={label === 'Workout' ? 24 : 20}
                        strokeWidth={isActive ? 2.5 : 1.8}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-bold tracking-wide ${
                        label === 'Workout' ? 'mt-0.5' : ''
                      }`}
                    >
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Safe area spacer for notched devices */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
      )}
    </div>
  );
}
