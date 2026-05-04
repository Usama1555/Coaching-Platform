import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  deleteCoachClient,
  getCoachClients,
  updateCoachClientPassword,
} from '../../api/coaches';
import {
  formatDate,
  formatStatusLabel,
  formatTextLabel,
  getClientName,
  getRosterFlags,
  getRowClasses,
  getStatusClasses,
  matchesFilter,
  matchesSearch,
  rosterFilters,
  sortClients,
  sortOptions,
} from './clientRosterUtils';

function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm transition ${
        active
          ? 'border-coral/40 bg-coral/15 text-white'
          : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

export default function ClientRoster() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('attention');
  const [managingClientId, setManagingClientId] = useState('');
  const [passwordDrafts, setPasswordDrafts] = useState({});
  const [feedbackByClientId, setFeedbackByClientId] = useState({});
  const [resettingClientId, setResettingClientId] = useState('');
  const [deletingClientId, setDeletingClientId] = useState('');

  async function loadClients() {
    try {
      const data = await getCoachClients();
      setClients(data.clients || []);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load the client roster right now.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  function setClientFeedback(clientId, type, message) {
    setFeedbackByClientId((current) => ({
      ...current,
      [clientId]: { type, message },
    }));
  }

  function toggleManage(clientId) {
    setManagingClientId((current) => (current === clientId ? '' : clientId));
  }

  function handlePasswordDraftChange(clientId, value) {
    setPasswordDrafts((current) => ({
      ...current,
      [clientId]: value,
    }));
  }

  async function handlePasswordReset(event, clientId) {
    event.preventDefault();

    const nextPassword = String(passwordDrafts[clientId] || '').trim();

    if (nextPassword.length < 6) {
      setClientFeedback(clientId, 'error', 'Use at least 6 characters for the new password.');
      return;
    }

    try {
      setResettingClientId(clientId);
      await updateCoachClientPassword(clientId, { password: nextPassword });
      setClientFeedback(clientId, 'success', 'Client password updated successfully.');
      setPasswordDrafts((current) => ({
        ...current,
        [clientId]: '',
      }));
    } catch (requestError) {
      setClientFeedback(
        clientId,
        'error',
        requestError.response?.data?.message || 'Unable to update the client password right now.'
      );
    } finally {
      setResettingClientId('');
    }
  }

  async function handleDeleteClient(clientId) {
    const client = clients.find((item) => item.id === clientId);
    const name = client ? getClientName(client) : 'this client';
    const confirmed = window.confirm(
      `Delete ${name}? This also removes their workouts, logs, nutrition, and check-ins.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingClientId(clientId);
      await deleteCoachClient(clientId);
      setClients((current) => current.filter((item) => item.id !== clientId));
      setManagingClientId((current) => (current === clientId ? '' : current));
    } catch (requestError) {
      setClientFeedback(
        clientId,
        'error',
        requestError.response?.data?.message || 'Unable to delete this client right now.'
      );
    } finally {
      setDeletingClientId('');
    }
  }

  const visibleClients = sortClients(
    clients.filter(
      (client) => matchesSearch(client, searchQuery) && matchesFilter(client, activeFilter)
    ),
    sortBy
  );
  const attentionCount = clients.filter((client) => getRosterFlags(client).needsAttention).length;

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-hero p-8 sm:p-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.35em] text-tide">Client Roster</p>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Full roster, stripped back.
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-200">
              Search the entire client list, open a profile fast, and manage login access without the overview page getting too crowded.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/coach/clients" className="secondary-button self-start">
              Back to overview
            </Link>
            <Link to="/coach" className="secondary-button self-start">
              Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Directory Controls</p>
            <h2 className="mt-3 font-display text-2xl font-bold text-white">Find people quickly</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Keep the visible list lean while still letting you sort and filter by what needs follow-up.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-200">
              {loading ? 'Loading roster...' : `${clients.length} clients`}
            </div>
            <div className="rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-amber-100">
              {attentionCount} need attention
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <label htmlFor="roster-search" className="mb-2 block text-sm font-medium text-slate-200">
              Search clients
            </label>
            <input
              id="roster-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="input-shell"
              placeholder="Search by client name, goal, or status"
            />
          </div>

          <div>
            <label htmlFor="roster-sort" className="mb-2 block text-sm font-medium text-slate-200">
              Sort by
            </label>
            <select
              id="roster-sort"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="input-shell"
            >
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {rosterFilters.map((filter) => (
            <FilterChip
              key={filter.id}
              active={activeFilter === filter.id}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </FilterChip>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        {loading ? (
          <div className="glass-panel p-6 text-sm text-slate-200">Loading full roster...</div>
        ) : visibleClients.length ? (
          visibleClients.map((client) => {
            const flags = getRosterFlags(client);
            const feedback = feedbackByClientId[client.id];
            const isManaging = managingClientId === client.id;
            const rowClasses = getRowClasses(client.status);

            return (
              <article key={client.id} className={`rounded-[1.75rem] border p-5 transition ${rowClasses}`}>
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-2xl font-semibold text-white">
                        {getClientName(client)}
                      </h3>
                      <div
                        className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${getStatusClasses(client.status)}`}
                      >
                        {formatStatusLabel(client.status)}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-slate-400">
                      <span className="rounded-full border border-white/10 bg-slate-950/35 px-3 py-2">
                        Goal: {formatTextLabel(client.goal)}
                      </span>
                      <span className="rounded-full border border-white/10 bg-slate-950/35 px-3 py-2">
                        Last active: {formatDate(client.lastActiveAt)}
                      </span>
                      {flags.noPlan ? (
                        <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-amber-100">
                          No active plan
                        </span>
                      ) : (
                        <span className="rounded-full border border-white/10 bg-slate-950/35 px-3 py-2">
                          Plan: {client.activePlan?.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row xl:items-center">
                    <Link to={`/coach/clients/${client.id}`} className="secondary-button w-full sm:w-auto">
                      View details
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleManage(client.id)}
                      className="secondary-button w-full sm:w-auto"
                    >
                      {isManaging ? 'Close manage' : 'Manage account'}
                    </button>
                  </div>
                </div>

                {isManaging ? (
                  <div className="mt-5 grid gap-4 rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <form onSubmit={(event) => handlePasswordReset(event, client.id)} className="space-y-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Manage Account</p>
                        <h4 className="mt-2 font-display text-xl font-semibold text-white">
                          Update login access
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          Reset the client password here if they lose access to their account.
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor={`password-${client.id}`}
                          className="mb-2 block text-sm font-medium text-slate-200"
                        >
                          New password
                        </label>
                        <input
                          id={`password-${client.id}`}
                          type="password"
                          value={passwordDrafts[client.id] || ''}
                          onChange={(event) => handlePasswordDraftChange(client.id, event.target.value)}
                          className="input-shell"
                          placeholder="At least 6 characters"
                        />
                      </div>

                      {feedback ? (
                        <div
                          className={`rounded-2xl border px-4 py-3 text-sm ${
                            feedback.type === 'success'
                              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
                              : 'border-red-400/30 bg-red-500/10 text-red-100'
                          }`}
                        >
                          {feedback.message}
                        </div>
                      ) : null}

                      <button
                        type="submit"
                        disabled={resettingClientId === client.id}
                        className="primary-button disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {resettingClientId === client.id ? 'Updating password...' : 'Update password'}
                      </button>
                    </form>

                    <div className="rounded-[1.5rem] border border-red-400/20 bg-red-500/10 p-4">
                      <p className="text-sm uppercase tracking-[0.25em] text-red-200">Delete Client</p>
                      <h4 className="mt-2 font-display text-xl font-semibold text-white">
                        Remove this account
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-red-100/90">
                        Use this when a client leaves your coaching roster. This permanently deletes their account and history.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleDeleteClient(client.id)}
                        disabled={deletingClientId === client.id}
                        className="secondary-button mt-4 w-full !border-red-400/30 !bg-red-500/10 !text-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {deletingClientId === client.id ? 'Deleting client...' : 'Delete client'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })
        ) : (
          <div className="glass-panel p-6 text-sm leading-6 text-slate-200">
            No clients match this search right now. Try a different filter or clear the search.
          </div>
        )}
      </section>
    </div>
  );
}
