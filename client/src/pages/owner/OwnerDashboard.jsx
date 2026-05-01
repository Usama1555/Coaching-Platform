import { useEffect, useState } from 'react';
import { getOwnerCoaches, updateOwnerCoachApproval } from '../../api/owner';

function formatDate(value) {
  if (!value) {
    return 'Not set';
  }

  return new Date(value).toLocaleString();
}

function badgeClasses(status) {
  if (status === 'approved') {
    return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100';
  }

  if (status === 'rejected') {
    return 'border-red-400/30 bg-red-500/10 text-red-100';
  }

  return 'border-amber-400/30 bg-amber-500/10 text-amber-100';
}

export default function OwnerDashboard() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingCoachId, setUpdatingCoachId] = useState('');

  async function loadCoaches() {
    try {
      const response = await getOwnerCoaches();
      setPayload(response);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load the owner dashboard right now.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCoaches();
  }, []);

  async function handleApprovalUpdate(coachId, approvalStatus) {
    setUpdatingCoachId(coachId);

    try {
      const response = await updateOwnerCoachApproval(coachId, { approvalStatus });
      setPayload((current) => ({
        ...current,
        summary: current.summary
          ? {
              ...current.summary,
            }
          : current.summary,
        coaches: current.coaches.map((coach) =>
          coach.id === coachId ? response.coach : coach
        ),
      }));
      await loadCoaches();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update that coach right now.');
    } finally {
      setUpdatingCoachId('');
    }
  }

  const summary = payload?.summary;
  const coaches = payload?.coaches || [];

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-hero p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.35em] text-tide">Owner Dashboard</p>
        <div className="mt-4 max-w-3xl">
          <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Review coach signups and roster ownership.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-200">
            Every coach shown here is counted against their own assigned clients only, based on the client-to-coach relationship saved in the database.
          </p>
        </div>
      </section>

      {error ? (
        <section className="rounded-3xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          {error}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ['Total coaches', loading ? '...' : String(summary?.totalCoaches || 0)],
          ['Pending', loading ? '...' : String(summary?.pending || 0)],
          ['Approved', loading ? '...' : String(summary?.approved || 0)],
          ['Rejected', loading ? '...' : String(summary?.rejected || 0)],
          ['Total assigned clients', loading ? '...' : String(summary?.totalClients || 0)],
        ].map(([label, value]) => (
          <article key={label} className="glass-panel p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">{label}</p>
            <p className="mt-4 font-display text-3xl font-bold text-white">{value}</p>
          </article>
        ))}
      </section>

      <section className="glass-panel p-6 sm:p-8">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Coach Accounts</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-white">Approval queue and client ownership</h2>
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
              Loading coaches...
            </div>
          ) : coaches.length ? (
            coaches.map((coach) => (
              <article key={coach.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <p className="font-display text-2xl font-semibold text-white">
                        {coach.user?.name || 'Coach'}
                      </p>
                      <div className={`inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${badgeClasses(coach.approvalStatus)}`}>
                        {coach.approvalStatus}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{coach.user?.email}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm text-slate-200">
                        Assigned clients: {coach.totalClients}
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm text-slate-200">
                        Created: {formatDate(coach.createdAt)}
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm text-slate-200">
                        Approved at: {formatDate(coach.approvedAt)}
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm text-slate-200">
                        Approved by: {coach.approvedByEmail || 'Not set'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => handleApprovalUpdate(coach.id, 'approved')}
                      disabled={updatingCoachId === coach.id}
                      className="primary-button disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {updatingCoachId === coach.id ? 'Saving...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprovalUpdate(coach.id, 'pending')}
                      disabled={updatingCoachId === coach.id}
                      className="secondary-button disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Mark pending
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprovalUpdate(coach.id, 'rejected')}
                      disabled={updatingCoachId === coach.id}
                      className="secondary-button !border-red-400/30 !bg-red-500/10 !text-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-300">
              No coach accounts are available yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
