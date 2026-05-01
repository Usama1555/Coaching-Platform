import { Link, NavLink } from 'react-router-dom';
import { AI_ASSISTANT_ENABLED } from '../config/features';
import { useAuth } from '../hooks/useAuth';
import { getDashboardRoute } from '../utils/getDashboardRoute';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const canAccessCoachApp =
    user?.role === 'coach' && (user?.isOwner || user?.coachApprovalStatus === 'approved');

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to={isAuthenticated ? getDashboardRoute(user) : '/'} className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-coral to-gold text-lg font-semibold text-white">
            CP
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-tight text-white">Coaching Platform</p>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Science-Based Coaching SaaS</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated ? (
            <>
              <NavLink
                to={getDashboardRoute(user)}
                className="rounded-full px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              >
                Dashboard
              </NavLink>
              {canAccessCoachApp ? (
                <NavLink
                  to="/coach/clients"
                  className="rounded-full px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                >
                  Clients
                </NavLink>
              ) : null}
              {user.isOwner ? (
                <NavLink
                  to="/owner"
                  className="rounded-full px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                >
                  Owner
                </NavLink>
              ) : null}
              {user.isOwner ? (
                <div className="hidden rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-emerald-100 lg:block">
                  Owner Account
                </div>
              ) : null}
              {user.role === 'client' ? (
                <>
                  <NavLink
                    to="/client/workout/today"
                    className="rounded-full px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                  >
                    Workout
                  </NavLink>
                  <NavLink
                    to="/client/progress"
                    className="rounded-full px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                  >
                    Progress
                  </NavLink>
                  <NavLink
                    to="/client/check-in"
                    className="rounded-full px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                  >
                    Check-In
                  </NavLink>
                  {AI_ASSISTANT_ENABLED ? (
                    <NavLink
                      to="/client/ai"
                      className="rounded-full px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                    >
                      AI Coach
                    </NavLink>
                  ) : null}
                </>
              ) : null}
              <NavLink
                to="/profile"
                className="rounded-full px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              >
                Profile
              </NavLink>
              <button type="button" onClick={logout} className="secondary-button !rounded-full !px-4 !py-2 text-sm">
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="rounded-full px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">
                Log in
              </NavLink>
              <Link to="/register" className="primary-button !rounded-full !px-4 !py-2 text-sm">
                Request access
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
