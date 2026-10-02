import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { UserCircle, ClipboardList, Dumbbell, Search, Flame } from 'lucide-react';

const navItems = [
  { to: '/app/profile', label: 'Profile', icon: UserCircle },
  { to: '/app/history', label: 'History', icon: ClipboardList },
  { to: '/app/workout', label: 'Workout', icon: Dumbbell },
  { to: '/app/exercises', label: 'Exercises', icon: Search },
  { to: '/app/calories', label: 'Calories', icon: Flame },
];

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

const pageTransition = {
  duration: 0.2,
  ease: 'easeOut',
};

export default function AppLayout() {
  const location = useLocation();
  const [forceHideNav, setForceHideNav] = useState(false);

  const isExplicitHide = location.pathname.startsWith('/app/workout/active');
  const shouldHideNav = forceHideNav || isExplicitHide;

  return (
    <div className="min-h-screen bg-bg-base text-text-main transition-colors duration-300">
      <main className={shouldHideNav ? '' : 'pb-24'}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <Outlet context={{ setHideNav: setForceHideNav }} />
          </motion.div>
        </AnimatePresence>
      </main>

      {!shouldHideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-bg-surface/90 backdrop-blur-xl transition-all duration-300">
          <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2.5">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1.5 px-3 py-1 rounded-xl transition-all duration-200 ${
                    isActive ? 'text-brand' : 'text-text-muted hover:text-text-main'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`relative flex items-center justify-center rounded-xl transition-all duration-300 ${
                        label === 'Workout'
                          ? isActive
                            ? 'bg-brand/10 p-2.5 -mt-4 shadow-[0_0_15px_rgba(196,165,116,0.15)] border border-brand/20'
                            : 'bg-bg-subtle p-2.5 -mt-4 border border-border-subtle'
                          : isActive
                            ? 'bg-bg-subtle p-1.5 rounded-lg'
                            : 'p-1.5'
                      }`}
                    >
                      <Icon
                        size={label === 'Workout' ? 22 : 18}
                        strokeWidth={isActive ? 2.5 : 1.8}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-bold tracking-wider transition-all duration-200 ${
                        label === 'Workout' ? 'mt-0.5' : ''
                      } ${isActive ? 'opacity-100' : 'opacity-80 text-text-muted'}`}
                    >
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
      )}
    </div>
  );
}