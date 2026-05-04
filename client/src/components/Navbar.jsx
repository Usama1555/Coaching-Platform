import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AI_ASSISTANT_ENABLED } from '../config/features';
import { useAuth } from '../hooks/useAuth';
import { getDashboardRoute } from '../utils/getDashboardRoute';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const canAccessCoachApp =
    user?.role === 'coach' && (user?.isOwner || user?.coachApprovalStatus === 'approved');
  const dashboardRoute = isAuthenticated && user ? getDashboardRoute(user) : '/';

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navigationLinks = useMemo(() => {
    if (!isAuthenticated || !user) {
      return [{ to: '/login', label: 'Log in', end: true }];
    }

    const links = [{ to: dashboardRoute, label: 'Dashboard', end: true }];

    if (canAccessCoachApp) {
      links.push({ to: '/coach/clients', label: 'Clients' });
    }

    if (user.isOwner) {
      links.push({ to: '/owner', label: 'Owner' });
    }

    if (user.role === 'client') {
      links.push(
        { to: '/client/workout/today', label: 'Workout' },
        { to: '/client/mealplan', label: 'Meal Plan' },
        { to: '/client/progress', label: 'Progress' },
        { to: '/client/check-in', label: 'Check-In' }
      );

      if (AI_ASSISTANT_ENABLED) {
        links.push({ to: '/client/ai', label: 'AI Coach' });
      }
    }

    links.push({ to: '/profile', label: 'Profile' });

    return links;
  }, [AI_ASSISTANT_ENABLED, canAccessCoachApp, dashboardRoute, isAuthenticated, user]);

  function getDesktopLinkClass({ isActive }) {
    return `rounded-full px-4 py-2 text-sm transition ${
      isActive ? 'bg-white/10 text-white' : 'text-slate-200 hover:bg-white/10'
    }`;
  }

  function getMobileLinkClass({ isActive }) {
    return `w-full rounded-2xl px-4 py-3 text-left text-base transition ${
      isActive ? 'bg-white/10 text-white' : 'bg-white/5 text-slate-200 hover:bg-white/10'
    }`;
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to={dashboardRoute} className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-coral to-gold text-lg font-semibold text-white">
            CP
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold tracking-tight text-white">Coaching Platform</p>
            <p className="hidden text-xs uppercase tracking-[0.25em] text-slate-400 sm:block">
              Science-Based Coaching SaaS
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex lg:gap-3">
          {isAuthenticated ? (
            <>
              {navigationLinks.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end} className={getDesktopLinkClass}>
                  {link.label}
                </NavLink>
              ))}
              {user.isOwner ? (
                <div className="hidden rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-emerald-100 xl:block">
                  Owner Account
                </div>
              ) : null}
              <button type="button" onClick={logout} className="secondary-button !rounded-full !px-4 !py-2 text-sm">
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={getDesktopLinkClass}>
                Log in
              </NavLink>
              <Link to="/register" className="primary-button !rounded-full !px-4 !py-2 text-sm">
                Request access
              </Link>
            </>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          className="secondary-button !rounded-full !px-4 !py-2 text-sm lg:hidden"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav"
        >
          {isMenuOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {isMenuOpen ? (
        <div id="mobile-nav" className="border-t border-white/10 lg:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-2">
              {navigationLinks.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end} className={getMobileLinkClass}>
                  {link.label}
                </NavLink>
              ))}

              {user?.isOwner ? (
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-xs uppercase tracking-[0.22em] text-emerald-100">
                  Owner Account
                </div>
              ) : null}

              {isAuthenticated ? (
                <button type="button" onClick={logout} className="secondary-button w-full">
                  Log out
                </button>
              ) : (
                <Link to="/register" className="primary-button w-full">
                  Request access
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
