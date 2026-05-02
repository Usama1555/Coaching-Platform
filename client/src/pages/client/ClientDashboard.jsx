import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getClientMetrics } from '../../api/metrics';
import { getTodayNutrition } from '../../api/nutrition';
import { getClientSessions } from '../../api/sessions';
import { getActiveWorkoutPlan } from '../../api/workouts';
import { useAuth } from '../../hooks/useAuth';
import { getPlanDayForDate } from '../../utils/planDay';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [latestMetric, setLatestMetric] = useState(null);
  const [todayNutrition, setTodayNutrition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      if (!user?.clientProfileId) {
        if (mounted) {
          setError('Client profile is not linked to this login yet.');
          setLoading(false);
        }
        return;
      }

      try {
        const [planResponse, sessionsResponse, metricResponse, todayNutritionResponse] = await Promise.all([
          getActiveWorkoutPlan(user.clientProfileId).catch((requestError) => {
            if (requestError.response?.status === 404) {
              return { plan: null };
            }

            throw requestError;
          }),
          getClientSessions(user.clientProfileId),
          getClientMetrics(user.clientProfileId),
          getTodayNutrition(user.clientProfileId).catch((requestError) => {
            if (requestError.response?.status === 404) {
              return { log: null };
            }

            throw requestError;
          }),
        ]);

        if (mounted) {
          setPlan(planResponse.plan || null);
          setSessions(sessionsResponse.sessions || []);
          setLatestMetric(metricResponse.metrics?.[0] || null);
          setTodayNutrition(todayNutritionResponse.log || null);
        }
      } catch (requestError) {
        if (mounted) {
          setError(requestError.response?.data?.message || 'Unable to load your dashboard data.');
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
  }, [user?.clientProfileId]);

  const todayDay = getPlanDayForDate(plan);
  const latestComment = sessions.find((session) => session.coachComment)?.coachComment;
  const latestSession = sessions[0];
  const overloadCount = latestSession?.sets?.filter((set) => set.overloadAlert).length || 0;
  const caloriesTodayValue = todayNutrition
    ? `${todayNutrition.totalCalories} kcal`
    : loading
      ? '...'
      : 'Not logged';
  const currentWeightValue = latestMetric?.weight
    ? `${latestMetric.weight} kg`
    : loading
      ? '...'
      : 'Not logged';

  const metrics = [
    {
      label: 'Workout Today',
      value: loading ? '...' : todayDay?.label || 'Not assigned',
      detail: todayDay?.isRest ? 'Recovery day in the current plan.' : 'Today workout pulled from the active plan.',
    },
    {
      label: 'Calories Today',
      value: caloriesTodayValue,
      detail: todayNutrition ? 'Nutrition log saved for today.' : 'No nutrition log saved today yet.',
    },
    {
      label: 'Current Weight',
      value: currentWeightValue,
      detail: latestMetric ? `Latest check-in from ${new Date(latestMetric.date).toLocaleDateString()}` : 'Weekly body metric not logged yet.',
    },
    {
      label: 'Coach Feedback',
      value: loading ? '...' : latestComment ? 'Available' : 'Waiting',
      detail: latestComment || 'Your next coach comment will appear here after a logged session is reviewed.',
    },
  ];

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-hero p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.35em] text-tide">Client Dashboard</p>
        <div className="mt-4 max-w-2xl">
          <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Welcome in, {user.name}.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-200">
            Your client account is now connected to active plans and session logging, so you can move from assigned training into real logged performance.
          </p>
        </div>
      </section>

      {error ? (
        <section className="rounded-3xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          {error}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        {metrics.map((metric) => (
          <article key={metric.label} className="glass-panel p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">{metric.label}</p>
            <p className="mt-4 font-display text-2xl font-bold text-white">{metric.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="glass-panel p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">This Week</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-200">
            {plan ? `Active plan: ${plan.name}` : 'No active plan is assigned yet.'}
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-200">
            {latestSession
              ? `Latest session: ${latestSession.dayLabel} on ${new Date(latestSession.date).toLocaleDateString()}`
              : 'No session has been logged yet.'}
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-200">
            {todayNutrition
              ? `Nutrition logged today: ${todayNutrition.totalCalories} calories and ${todayNutrition.totalProtein}g protein.`
              : overloadCount
                ? `${overloadCount} overload alert${overloadCount > 1 ? 's' : ''} triggered in the latest session.`
                : 'No overload alerts or nutrition logs are waiting right now.'}
          </div>
        </div>
      </section>

      <section>
        <article className="glass-panel p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Today at a glance</p>
          <div className="mt-5 space-y-4 text-sm leading-6 text-slate-200">
            <p>
              <span className="text-slate-400">Plan day:</span> {todayDay?.label || 'Not assigned'}
            </p>
            <p>
              <span className="text-slate-400">Status:</span>{' '}
              {todayDay ? (todayDay.isRest ? 'Rest / recovery day' : 'Training day ready to log') : 'Waiting for coach plan'}
            </p>
            <p>
              <span className="text-slate-400">Coach comment:</span> {latestComment || 'No feedback yet'}
            </p>
            <p>
              <span className="text-slate-400">Weight check-in:</span> {latestMetric?.weight ? `${latestMetric.weight} kg` : 'Not logged'}
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
