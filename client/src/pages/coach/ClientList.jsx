import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCoachClients, inviteCoachClient } from '../../api/coaches';
import {
  getClientName,
  getRosterFlags,
  getStatusClasses,
  formatStatusLabel,
  sortClients,
} from './clientRosterUtils';

const initialInviteForm = {
  name: '',
  email: '',
  goal: 'fat_loss',
  currentWeight: '',
  targetWeight: '',
  targetCalories: '',
  targetProtein: '',
  experience: 'beginner',
  injuries: '',
};

function toNullableNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function SummaryCard({ label, value, tone = 'default' }) {
  const toneClasses =
    tone === 'attention'
      ? 'border-amber-400/20 bg-amber-500/10'
      : tone === 'success'
        ? 'border-emerald-400/20 bg-emerald-500/10'
        : 'border-white/10 bg-white/5';

  return (
    <div className={`rounded-2xl border p-4 ${toneClasses}`}>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{label}</p>
      <p className="mt-3 font-display text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default function ClientList() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteForm, setInviteForm] = useState(initialInviteForm);
  const [inviteStatus, setInviteStatus] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [submittingInvite, setSubmittingInvite] = useState(false);

  async function loadClients() {
    try {
      const data = await getCoachClients();
      setClients(data.clients || []);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load your clients right now.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setInviteForm((current) => ({ ...current, [name]: value }));
  }

  async function handleInviteSubmit(event) {
    event.preventDefault();
    setInviteStatus('');
    setTemporaryPassword('');
    setSubmittingInvite(true);

    try {
      const payload = {
        ...inviteForm,
        currentWeight: toNullableNumber(inviteForm.currentWeight),
        targetWeight: toNullableNumber(inviteForm.targetWeight),
        targetCalories: toNullableNumber(inviteForm.targetCalories),
        targetProtein: toNullableNumber(inviteForm.targetProtein),
      };

      const response = await inviteCoachClient(payload);
      setInviteStatus(response.message);
      setTemporaryPassword(response.temporaryPassword || '');
      setInviteForm(initialInviteForm);
      await loadClients();
    } catch (requestError) {
      setInviteStatus(
        requestError.response?.data?.message || 'Unable to invite this client right now.'
      );
    } finally {
      setSubmittingInvite(false);
    }
  }

  const attentionClients = sortClients(
    clients.filter((client) => getRosterFlags(client).needsAttention),
    'attention'
  ).slice(0, 3);
  const attentionCount = clients.filter((client) => getRosterFlags(client).needsAttention).length;
  const noPlanCount = clients.filter((client) => getRosterFlags(client).noPlan).length;
  const onTrackCount = clients.filter((client) => client.status === 'on_track').length;

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-hero p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.35em] text-tide">Coach Clients</p>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Build your roster from one place.
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-200">
              Invite new clients, link existing client accounts, and move straight into plan assignment once they are attached to your coach profile.
            </p>
          </div>
          <Link to="/coach" className="secondary-button self-start">
            Back to dashboard
          </Link>
        </div>
      </section>

      <section className="grid gap-6 xl:items-start xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)]">
        <article className="glass-panel p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Invite Client</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-white">Create or link a client account</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            If the email does not exist yet, the backend creates a client login automatically and returns a temporary password.
          </p>

          <form onSubmit={handleInviteSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-200">
                Full name
              </label>
              <input
                id="name"
                name="name"
                value={inviteForm.name}
                onChange={handleChange}
                className="input-shell"
                placeholder="Client name"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={inviteForm.email}
                onChange={handleChange}
                className="input-shell"
                placeholder="client@example.com"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="goal" className="mb-2 block text-sm font-medium text-slate-200">
                  Goal
                </label>
                <select id="goal" name="goal" value={inviteForm.goal} onChange={handleChange} className="input-shell">
                  <option value="fat_loss">Fat loss</option>
                  <option value="muscle_gain">Muscle gain</option>
                  <option value="recomp">Recomp</option>
                </select>
              </div>

              <div>
                <label htmlFor="experience" className="mb-2 block text-sm font-medium text-slate-200">
                  Experience
                </label>
                <select
                  id="experience"
                  name="experience"
                  value={inviteForm.experience}
                  onChange={handleChange}
                  className="input-shell"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="currentWeight" className="mb-2 block text-sm font-medium text-slate-200">
                  Current weight (kg)
                </label>
                <input
                  id="currentWeight"
                  name="currentWeight"
                  type="number"
                  step="0.1"
                  value={inviteForm.currentWeight}
                  onChange={handleChange}
                  className="input-shell"
                  placeholder="82.5"
                />
              </div>

              <div>
                <label htmlFor="targetWeight" className="mb-2 block text-sm font-medium text-slate-200">
                  Target weight (kg)
                </label>
                <input
                  id="targetWeight"
                  name="targetWeight"
                  type="number"
                  step="0.1"
                  value={inviteForm.targetWeight}
                  onChange={handleChange}
                  className="input-shell"
                  placeholder="76"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="targetCalories" className="mb-2 block text-sm font-medium text-slate-200">
                  Target calories
                </label>
                <input
                  id="targetCalories"
                  name="targetCalories"
                  type="number"
                  value={inviteForm.targetCalories}
                  onChange={handleChange}
                  className="input-shell"
                  placeholder="2200"
                />
              </div>

              <div>
                <label htmlFor="targetProtein" className="mb-2 block text-sm font-medium text-slate-200">
                  Target protein (g)
                </label>
                <input
                  id="targetProtein"
                  name="targetProtein"
                  type="number"
                  value={inviteForm.targetProtein}
                  onChange={handleChange}
                  className="input-shell"
                  placeholder="170"
                />
              </div>
            </div>

            <div>
              <label htmlFor="injuries" className="mb-2 block text-sm font-medium text-slate-200">
                Injuries or limitations
              </label>
              <textarea
                id="injuries"
                name="injuries"
                rows="3"
                value={inviteForm.injuries}
                onChange={handleChange}
                className="input-shell"
                placeholder="Lower back irritation, shoulder history, knee tolerance..."
              />
            </div>

            {inviteStatus ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100">
                <p>{inviteStatus}</p>
                {temporaryPassword ? (
                  <p className="mt-2 text-coral">Temporary password: {temporaryPassword}</p>
                ) : null}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submittingInvite}
              className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submittingInvite ? 'Inviting client...' : 'Invite client'}
            </button>
          </form>
        </article>

        <article className="glass-panel p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Client Overview</p>
              <h2 className="mt-3 font-display text-2xl font-bold text-white">Coach priorities first</h2>
              <p className="mt-2 text-sm text-slate-300">
                Use this page for quick triage, then jump into the full roster when you want the complete client directory.
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
              {loading ? 'Loading...' : `${clients.length} total clients`}
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Total Clients" value={clients.length} />
            <SummaryCard label="Needs Attention" value={attentionCount} tone="attention" />
            <SummaryCard label="No Active Plan" value={noPlanCount} />
            <SummaryCard label="On Track" value={onTrackCount} tone="success" />
          </div>

          {!loading && attentionClients.length ? (
            <div className="mt-6 rounded-[1.75rem] border border-amber-400/20 bg-amber-500/10 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-amber-100">Needs Attention Today</p>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-50">
                    Start here first. These are the clients most likely to need a follow-up before you work through the full roster.
                  </p>
                </div>
                <div className="rounded-full border border-amber-300/30 bg-black/10 px-4 py-2 text-sm text-amber-50">
                  {attentionCount} flagged
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                {attentionClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex h-full flex-col justify-between rounded-[1.75rem] border border-amber-300/20 bg-slate-950/45 p-5"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-display text-2xl font-semibold leading-tight text-white">
                          {getClientName(client)}
                        </p>
                        <div
                          className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${getStatusClasses(client.status)}`}
                        >
                          {formatStatusLabel(client.status)}
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-7 text-slate-200">{client.statusReason}</p>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Link to={`/coach/clients/${client.id}`} className="secondary-button w-full px-4 py-2 sm:w-auto">
                        View details
                      </Link>
                      <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                        {client.activePlan ? client.activePlan.name : 'No active plan'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            !loading ? (
              <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6 text-sm leading-6 text-emerald-50">
                No urgent follow-ups right now. Your roster is looking steady.
              </div>
            ) : null
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-400">
              Open the full roster for search, filters, and account management.
            </div>
            <Link to="/coach/clients/roster" className="primary-button self-start">
              Open full client roster
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
