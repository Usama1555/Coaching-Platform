import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardRoute } from '../../utils/getDashboardRoute';

export default function CoachApprovalStatus() {
  const { user, refreshUser, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  if (user.isOwner || user.coachApprovalStatus === 'approved') {
    return <Navigate to={getDashboardRoute(user)} replace />;
  }

  async function handleRefresh() {
    setChecking(true);
    setError('');

    try {
      await refreshUser();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to refresh your approval status right now.');
    } finally {
      setChecking(false);
    }
  }

  const isRejected = user.coachApprovalStatus === 'rejected';

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-hero p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.35em] text-tide">Coach Account Status</p>
        <div className="mt-4 max-w-3xl">
          <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {isRejected ? 'Your coach access request was declined.' : 'Your coach account is waiting for approval.'}
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-200">
            {isRejected
              ? 'This coach account cannot access the coach workspace right now. You can still review your profile details or contact the platform owner.'
              : 'Your signup was received successfully. The platform owner has been notified and can approve your account before you enter the coach workspace.'}
          </p>
        </div>
      </section>

      {error ? (
        <section className="rounded-3xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          {error}
        </section>
      ) : null}

      <section className="glass-panel p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Current status</p>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-2xl font-bold text-white">{user.name}</p>
            <p className="mt-2 text-sm text-slate-300">{user.email}</p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.22em] text-slate-200">
            {user.coachApprovalStatus}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {!isRejected ? (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={checking}
              className="primary-button disabled:cursor-not-allowed disabled:opacity-70"
            >
              {checking ? 'Checking...' : 'Check approval again'}
            </button>
          ) : null}
          <Link to="/profile" className="secondary-button">
            Open profile
          </Link>
          <button type="button" onClick={logout} className="secondary-button">
            Log out
          </button>
        </div>
      </section>
    </div>
  );
}
