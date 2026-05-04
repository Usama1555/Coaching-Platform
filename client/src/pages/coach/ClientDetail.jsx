import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCoachClientDetail } from '../../api/coaches';
import { deleteMealPlan } from '../../api/mealplans';
import { addSessionComment, getClientSessions } from '../../api/sessions';
import CommentBox from '../../components/CommentBox';

function formatDate(value) {
  if (!value) {
    return 'Not set';
  }

  return new Date(value).toLocaleDateString();
}

function metricValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') {
    return 'Not set';
  }

  return `${value}${suffix}`;
}

function deltaValue(actual, target, suffix = '') {
  if (actual === null || actual === undefined || target === null || target === undefined) {
    return 'No target comparison';
  }

  const difference = actual - target;

  if (difference === 0) {
    return `On target${suffix ? ` ${suffix}` : ''}`;
  }

  return `${difference > 0 ? '+' : ''}${difference}${suffix ? ` ${suffix}` : ''} vs target`;
}

export default function ClientDetail() {
  const { clientId } = useParams();
  const [payload, setPayload] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingCommentId, setSavingCommentId] = useState('');
  const [commentError, setCommentError] = useState('');
  const [deletingMealPlanId, setDeletingMealPlanId] = useState('');
  const [mealPlanStatus, setMealPlanStatus] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadClient() {
      try {
        const [detailResponse, sessionsResponse] = await Promise.all([
          getCoachClientDetail(clientId),
          getClientSessions(clientId),
        ]);

        if (mounted) {
          setPayload(detailResponse);
          setSessions(sessionsResponse.sessions || []);
        }
      } catch (requestError) {
        if (mounted) {
          setError(requestError.response?.data?.message || 'Unable to load this client profile.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadClient();

    return () => {
      mounted = false;
    };
  }, [clientId]);

  const client = payload?.client;
  const activeMealPlan = payload?.activeMealPlan || null;
  const recentMealPlans = payload?.recentMealPlans || [];
  const latestMetric = payload?.latestMetric || null;
  const latestNutrition = payload?.latestNutrition || null;

  async function handleSaveComment(sessionId, coachComment) {
    setSavingCommentId(sessionId);
    setCommentError('');

    try {
      const response = await addSessionComment(sessionId, { coachComment });
      setSessions((current) =>
        current.map((session) =>
          session._id === sessionId
            ? {
                ...session,
                coachComment: response.session.coachComment,
                coachCommentAt: response.session.coachCommentAt,
              }
            : session
        )
      );
    } catch (requestError) {
      setCommentError(requestError.response?.data?.message || 'Unable to save that comment.');
    } finally {
      setSavingCommentId('');
    }
  }

  async function handleDeleteMealPlan(planId, planName) {
    const shouldDelete = window.confirm(`Delete ${planName || 'this meal plan'}?`);

    if (!shouldDelete) {
      return;
    }

    setDeletingMealPlanId(planId);
    setMealPlanStatus('');

    try {
      await deleteMealPlan(planId);
      setPayload((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          activeMealPlan:
            current.activeMealPlan && current.activeMealPlan._id === planId
              ? null
              : current.activeMealPlan,
          recentMealPlans: (current.recentMealPlans || []).filter((plan) => plan._id !== planId),
        };
      });
      setMealPlanStatus('Meal plan deleted successfully.');
    } catch (requestError) {
      setMealPlanStatus(requestError.response?.data?.message || 'Unable to delete that meal plan.');
    } finally {
      setDeletingMealPlanId('');
    }
  }

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-hero p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.35em] text-tide">Client Detail</p>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {loading ? 'Loading client...' : client?.user?.name || 'Client profile'}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-200">
              See goals, nutrition targets, injuries, and the latest workout plans before you leave feedback or assign the next training block.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/coach/clients" className="secondary-button">
              Back to clients
            </Link>
            <Link to={`/coach/clients/${clientId}/mealplan/build`} className="secondary-button">
              Build meal plan
            </Link>
            <Link to={`/coach/clients/${clientId}/review`} className="secondary-button">
              Review by date
            </Link>
            <Link to={`/coach/clients/${clientId}/assign`} className="primary-button">
              Assign workout
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-3xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          {error}
        </section>
      ) : null}

      {loading ? (
        <section className="glass-panel p-6 text-sm text-slate-200">Loading client profile...</section>
      ) : client ? (
        <>
          <section className="grid gap-4 lg:grid-cols-4">
            {[
              { label: 'Goal', value: client.goal || 'Not set' },
              { label: 'Current weight', value: metricValue(client.currentWeight, ' kg') },
              { label: 'Target calories', value: metricValue(client.targetCalories) },
              { label: 'Target protein', value: metricValue(client.targetProtein, ' g') },
            ].map((item) => (
              <article key={item.label} className="glass-panel p-6">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">{item.label}</p>
                <p className="mt-4 font-display text-2xl font-bold text-white">{item.value}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <article className="glass-panel p-6 sm:p-8">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Profile Snapshot</p>
              <div className="mt-5 space-y-4 text-sm leading-6 text-slate-200">
                <p>
                  <span className="text-slate-400">Email:</span> {client.user?.email}
                </p>
                <p>
                  <span className="text-slate-400">Experience:</span> {client.experience || 'Not set'}
                </p>
                <p>
                  <span className="text-slate-400">Height:</span> {metricValue(client.height, ' cm')}
                </p>
                <p>
                  <span className="text-slate-400">Maintenance calories:</span>{' '}
                  {metricValue(client.maintenanceCalories)}
                </p>
                <p>
                  <span className="text-slate-400">Joined:</span> {formatDate(client.joinedAt)}
                </p>
                <p>
                  <span className="text-slate-400">Injuries:</span> {client.injuries || 'None recorded'}
                </p>
              </div>
            </article>

            <article className="glass-panel p-6 sm:p-8">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Current Active Workout Plan</p>
              {client.activePlan ? (
                <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="font-display text-2xl font-bold text-white">{client.activePlan.name}</p>
                  <p className="mt-3 text-sm text-slate-300">
                    Split: {client.activePlan.splitType || 'custom'}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    Week starts: {formatDate(client.activePlan.weekStartDate)}
                  </p>
                </div>
              ) : (
                <div className="mt-5 rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-300">
                  This client does not have an active workout plan yet.
                </div>
              )}
            </article>
          </section>

          <section>
            <article className="glass-panel p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Current Active Meal Plan</p>
                  <h2 className="mt-3 font-display text-2xl font-bold text-white">Nutrition blueprint</h2>
                </div>
                <Link to={`/coach/clients/${clientId}/mealplan/build`} className="secondary-button self-start">
                  Build another
                </Link>
              </div>

              {activeMealPlan ? (
                <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-200">
                  <p className="font-display text-2xl font-bold text-white">{activeMealPlan.name}</p>
                  <p className="mt-3 text-slate-300">Week starts: {formatDate(activeMealPlan.weekStartDate)}</p>
                  <p className="mt-2 text-slate-300">
                    {activeMealPlan.dailyCalorieTarget} kcal | {activeMealPlan.dailyProteinTarget} g protein | {activeMealPlan.meals?.length || 0} meals
                  </p>
                  {activeMealPlan.notes ? (
                    <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-slate-200">
                      {activeMealPlan.notes}
                    </p>
                  ) : null}
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Link
                      to={`/coach/clients/${clientId}/mealplan/${activeMealPlan._id}/edit`}
                      className="secondary-button w-full sm:w-auto"
                    >
                      Edit meal plan
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteMealPlan(activeMealPlan._id, activeMealPlan.name)}
                      disabled={deletingMealPlanId === activeMealPlan._id}
                      className="secondary-button w-full border-red-400/30 !text-red-100 hover:!bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                    >
                      {deletingMealPlanId === activeMealPlan._id ? 'Deleting...' : 'Delete meal plan'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-300">
                  This client does not have an active meal plan yet.
                </div>
              )}

              {mealPlanStatus ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100">
                  {mealPlanStatus}
                </div>
              ) : null}
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <article className="glass-panel p-6 sm:p-8">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Latest Check-In</p>
              <h2 className="mt-3 font-display text-2xl font-bold text-white">Recovery and body-metric snapshot</h2>
              {latestMetric ? (
                <div className="mt-5 space-y-4 text-sm leading-6 text-slate-200">
                  <p>
                    <span className="text-slate-400">Logged:</span> {formatDate(latestMetric.date)}
                  </p>
                  <p>
                    <span className="text-slate-400">Weight:</span> {metricValue(latestMetric.weight, ' kg')}
                  </p>
                  <p>
                    <span className="text-slate-400">Body fat:</span> {metricValue(latestMetric.bodyFatPercent, '%')}
                  </p>
                  <p>
                    <span className="text-slate-400">Waist:</span> {metricValue(latestMetric.waistCm, ' cm')}
                  </p>
                  <p>
                    <span className="text-slate-400">Energy:</span> {metricValue(latestMetric.energyLevel, '/10')}
                  </p>
                  <p>
                    <span className="text-slate-400">Sleep:</span> {metricValue(latestMetric.sleepHours, ' hours')}
                  </p>
                  <p>
                    <span className="text-slate-400">Notes:</span> {latestMetric.notes || 'No notes saved'}
                  </p>
                </div>
              ) : (
                <div className="mt-5 rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-300">
                  No body-metric check-in has been logged yet.
                </div>
              )}
            </article>

            <article className="glass-panel p-6 sm:p-8">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Latest Nutrition</p>
              <h2 className="mt-3 font-display text-2xl font-bold text-white">Macro adherence snapshot</h2>
              {latestNutrition ? (
                <div className="mt-5 space-y-4 text-sm leading-6 text-slate-200">
                  <p>
                    <span className="text-slate-400">Logged:</span> {formatDate(latestNutrition.date)}
                  </p>
                  <p>
                    <span className="text-slate-400">Calories:</span> {metricValue(latestNutrition.totalCalories)} (
                    {deltaValue(latestNutrition.totalCalories, client.targetCalories)})
                  </p>
                  <p>
                    <span className="text-slate-400">Protein:</span> {metricValue(latestNutrition.totalProtein, ' g')} (
                    {deltaValue(latestNutrition.totalProtein, client.targetProtein, 'g')})
                  </p>
                  <p>
                    <span className="text-slate-400">Carbs:</span> {metricValue(latestNutrition.totalCarbs, ' g')}
                  </p>
                  <p>
                    <span className="text-slate-400">Fat:</span> {metricValue(latestNutrition.totalFat, ' g')}
                  </p>
                  <p>
                    <span className="text-slate-400">Water:</span> {metricValue(latestNutrition.waterLitres, ' L')}
                  </p>
                  <p>
                    <span className="text-slate-400">Notes:</span> {latestNutrition.notes || 'No notes saved'}
                  </p>
                </div>
              ) : (
                <div className="mt-5 rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-300">
                  No nutrition log has been saved yet.
                </div>
              )}
            </article>
          </section>

          <section className="glass-panel p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Recent Session Logs</p>
                <h2 className="mt-3 font-display text-2xl font-bold text-white">Training performance and coach feedback</h2>
              </div>
              <Link to={`/coach/clients/${clientId}/review`} className="secondary-button self-start">
                Open full day review
              </Link>
            </div>

            {commentError ? (
              <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {commentError}
              </div>
            ) : null}

            <div className="mt-6 space-y-4">
              {sessions.length ? (
                sessions.map((session) => (
                  <div key={session._id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-display text-xl font-semibold text-white">{session.dayLabel}</p>
                        <p className="mt-2 text-sm text-slate-300">
                          Logged on {new Date(session.date).toLocaleDateString()}
                        </p>
                        <p className="mt-2 text-sm text-slate-300">
                          {session.sets.length} logged set{session.sets.length === 1 ? '' : 's'}
                        </p>
                      </div>
                      <div className="rounded-full border border-white/10 bg-slate-950/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                        {session.sets.filter((set) => set.overloadAlert).length} overload
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {session.sets.map((set, index) => (
                        <div key={`${session._id}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-200">
                          <p className="font-medium text-white">
                            {set.exerciseName} - Set {set.setNumber}
                          </p>
                          <p className="mt-2">
                            {set.repsCompleted} reps at {set.weightUsed} kg
                          </p>
                          <p className="mt-1 text-slate-300">
                            {set.hitFailure ? 'Reached failure' : 'Did not mark failure'}
                          </p>
                        </div>
                      ))}
                    </div>

                    <CommentBox
                      sessionId={session._id}
                      existingComment={session.coachComment}
                      onSave={handleSaveComment}
                      saving={savingCommentId === session._id}
                    />
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-300">
                  No session logs yet. Once this client starts logging training, you'll be able to leave feedback here.
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
