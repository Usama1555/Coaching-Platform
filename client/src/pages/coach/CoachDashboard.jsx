import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCoachClients, getCoachDashboard } from '../../api/coaches';
import { useAuth } from '../../hooks/useAuth';

function formatStatusLabel(value) {
  return value === 'on_track'
    ? 'On Track'
    : value === 'inactive'
      ? 'Inactive'
      : 'Needs Attention';
}

function getStatusClasses(status) {
  if (status === 'on_track') {
    return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100';
  }

  if (status === 'inactive') {
    return 'border-slate-400/20 bg-slate-500/10 text-slate-200';
  }

  return 'border-amber-400/30 bg-amber-500/10 text-amber-100';
}

export default function CoachDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const [dashboardData, clientData] = await Promise.all([
          getCoachDashboard(),
          getCoachClients(),
        ]);

        if (mounted) {
          setDashboard(dashboardData);
          setClients(clientData.clients || []);
        }
      } catch (requestError) {
        if (mounted) {
          setError(
            requestError.response?.data?.message || 'Unable to load coach dashboard data right now.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const statusCounts = clients.reduce(
    (accumulator, client) => {
      if (client.status === 'on_track') {
        accumulator.onTrack += 1;
      } else if (client.status === 'inactive') {
        accumulator.inactive += 1;
      } else {
        accumulator.needsAttention += 1;
      }

      return accumulator;
    },
    {
      onTrack: 0,
      needsAttention: 0,
      inactive: 0,
    }
  );

  const coachStats = [
    {
      label: 'Clients',
      value: loading ? '...' : dashboard?.stats.totalClients ?? '0',
      detail: 'Connected client profiles assigned to this coach.',
    },
    {
      label: 'Active Plans',
      value: loading ? '...' : dashboard?.stats.activePlans ?? '0',
      detail: 'Current live workout plans across your roster.',
    },
    {
      label: 'Sessions Today',
      value: loading ? '...' : dashboard?.stats.sessionsToday ?? '0',
      detail: 'Workout sessions logged since the start of today.',
    },
    {
      label: 'Pending Comments',
      value: loading ? '...' : dashboard?.stats.pendingComments ?? '0',
      detail: 'Sessions waiting on coach feedback.',
    },
    {
      label: 'Unplanned Clients',
      value: loading ? '...' : dashboard?.stats.clientsWithoutActivePlan ?? '0',
      detail: 'Clients who still need an active training plan.',
    },
  ];

  const clientAttentionBoard = [
    {
      label: 'On Track',
      value: loading ? '...' : String(statusCounts.onTrack),
      detail: 'Clients with current training, nutrition, and check-ins.',
      className: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100',
    },
    {
      label: 'Needs Attention',
      value: loading ? '...' : String(statusCounts.needsAttention),
      detail: 'Clients missing a recent workout, nutrition log, plan, or check-in.',
      className: 'border-amber-400/25 bg-amber-500/10 text-amber-100',
    },
    {
      label: 'Inactive',
      value: loading ? '...' : String(statusCounts.inactive),
      detail: 'Clients with no recent platform activity.',
      className: 'border-slate-400/20 bg-slate-500/10 text-slate-200',
    },
  ];

  const attentionClients = [...clients]
    .filter((client) => client.status !== 'on_track')
    .sort((left, right) => {
      const leftTime = left.lastActiveAt ? new Date(left.lastActiveAt).getTime() : 0;
      const rightTime = right.lastActiveAt ? new Date(right.lastActiveAt).getTime() : 0;
      return leftTime - rightTime;
    })
    .slice(0, 4);

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-hero p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.35em] text-tide">Coach Control Center</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {user.name}, your platform is live.
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-200">
              You now have live visibility into client plans, recent sessions, pending feedback, and the deeper nutrition and recovery context inside each client profile.
            </p>
          </div>
          <Link to="/coach/clients" className="secondary-button self-start">
            Manage clients
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {coachStats.map((stat) => (
          <article key={stat.label} className="glass-panel p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">{stat.label}</p>
            <p className="mt-4 font-display text-4xl font-bold text-white">{stat.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{stat.detail}</p>
          </article>
        ))}
      </section>

      {error ? (
        <section className="rounded-3xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          {error}
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="glass-panel p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Client Status Cues</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-white">At-a-glance roster health</h2>
          <div className="mt-6 grid gap-4">
            {clientAttentionBoard.map((item) => (
              <div key={item.label} className={`rounded-3xl border p-5 ${item.className}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm uppercase tracking-[0.25em]">{item.label}</p>
                  <p className="font-display text-3xl font-bold">{item.value}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-current/90">{item.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-panel p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Attention Board</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-white">Who may need you next</h2>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                Loading client attention cues...
              </div>
            ) : attentionClients.length ? (
              attentionClients.map((client) => (
                <div key={client.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-display text-lg font-semibold text-white">{client.user?.name || 'Unnamed client'}</p>
                      <p className="mt-2 text-sm text-slate-300">{client.statusReason}</p>
                    </div>
                    <div className={`inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${getStatusClasses(client.status)}`}>
                      {formatStatusLabel(client.status)}
                    </div>
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-[0.25em] text-slate-400">
                    Last active: {client.lastActiveAt ? new Date(client.lastActiveAt).toLocaleDateString() : 'Not logged'}
                  </p>
                  <Link
                    to={`/coach/clients/${client.id}`}
                    className="mt-4 inline-flex text-sm font-medium text-coral transition hover:text-[#ff8979]"
                  >
                    Open client
                  </Link>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-300">
                Every current client is marked on track right now.
              </div>
            )}
          </div>
        </article>
      </section>

    </div>
  );
}
