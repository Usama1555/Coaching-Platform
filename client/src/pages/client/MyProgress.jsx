import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProgressChart from '../../components/ProgressChart';
import { getClientMetrics } from '../../api/metrics';
import { getClientNutritionHistory } from '../../api/nutrition';
import { getClientSessions } from '../../api/sessions';
import { useAuth } from '../../hooks/useAuth';

function formatShortDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function sortByDateAscending(items) {
  return [...items].sort((a, b) => new Date(a.date) - new Date(b.date));
}

function buildTrainingOverview(sessions) {
  return sortByDateAscending(sessions).map((session) => {
    const totalVolume = session.sets.reduce(
      (sum, set) => sum + (Number(set.repsCompleted) || 0) * (Number(set.weightUsed) || 0),
      0
    );

    return {
      label: formatShortDate(session.date),
      totalVolume,
      totalSets: session.sets.length,
      overloadCount: session.sets.filter((set) => set.overloadAlert).length,
    };
  });
}

function buildExerciseOptions(sessions) {
  return Array.from(
    new Set(
      sessions.flatMap((session) =>
        session.sets.map((set) => set.exerciseName).filter(Boolean)
      )
    )
  );
}

function buildExerciseTrend(sessions, exerciseName) {
  if (!exerciseName) {
    return [];
  }

  return sortByDateAscending(sessions)
    .map((session) => {
      const matchingSets = session.sets.filter((set) => set.exerciseName === exerciseName);

      if (!matchingSets.length) {
        return null;
      }

      return {
        label: formatShortDate(session.date),
        bestWeight: Math.max(...matchingSets.map((set) => Number(set.weightUsed) || 0)),
        bestReps: Math.max(...matchingSets.map((set) => Number(set.repsCompleted) || 0)),
      };
    })
    .filter(Boolean);
}

function buildBodyMetricTrend(metrics) {
  return sortByDateAscending(metrics)
    .map((metric) => ({
      label: formatShortDate(metric.date),
      weight: metric.weight,
      bodyFatPercent: metric.bodyFatPercent,
    }))
    .filter((entry) => entry.weight !== null || entry.bodyFatPercent !== null);
}

function buildNutritionTrend(logs) {
  return sortByDateAscending(logs).map((log) => ({
    label: formatShortDate(log.date),
    totalCalories: log.totalCalories,
    totalProtein: log.totalProtein,
  }));
}

export default function MyProgress() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [nutritionLogs, setNutritionLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedExercise, setSelectedExercise] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadProgress() {
      if (!user?.clientProfileId) {
        if (mounted) {
          setError('Client profile is not linked to this login yet.');
          setLoading(false);
        }
        return;
      }

      try {
        const [sessionResponse, metricResponse, nutritionResponse] = await Promise.all([
          getClientSessions(user.clientProfileId),
          getClientMetrics(user.clientProfileId),
          getClientNutritionHistory(user.clientProfileId),
        ]);

        if (mounted) {
          setSessions(sessionResponse.sessions || []);
          setMetrics(metricResponse.metrics || []);
          setNutritionLogs(nutritionResponse.logs || []);
        }
      } catch (requestError) {
        if (mounted) {
          setError(requestError.response?.data?.message || 'Unable to load progress data right now.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProgress();

    return () => {
      mounted = false;
    };
  }, [user?.clientProfileId]);

  const exerciseOptions = buildExerciseOptions(sessions);
  const trainingOverview = buildTrainingOverview(sessions);
  const exerciseTrend = buildExerciseTrend(sessions, selectedExercise);
  const bodyMetricTrend = buildBodyMetricTrend(metrics);
  const nutritionTrend = buildNutritionTrend(nutritionLogs);

  useEffect(() => {
    if (!selectedExercise && exerciseOptions.length) {
      setSelectedExercise(exerciseOptions[0]);
    }
  }, [exerciseOptions, selectedExercise]);

  const totalOverloadAlerts = sessions.reduce(
    (count, session) => count + session.sets.filter((set) => set.overloadAlert).length,
    0
  );
  const totalLoggedSets = sessions.reduce((count, session) => count + session.sets.length, 0);
  const latestSession = sessions[0];
  const latestMetric = metrics[0];
  const latestNutrition = nutritionLogs[0];

  const summaryCards = [
    {
      label: 'Sessions Logged',
      value: loading ? '...' : String(sessions.length),
      detail: 'Completed workouts captured in the platform.',
    },
    {
      label: 'Logged Sets',
      value: loading ? '...' : String(totalLoggedSets),
      detail: 'Every tracked lifting set across all sessions.',
    },
    {
      label: 'Overload Alerts',
      value: loading ? '...' : String(totalOverloadAlerts),
      detail: 'Sets that hit the progression threshold.',
    },
    {
      label: 'Latest Weight',
      value: loading ? '...' : latestMetric?.weight ? `${latestMetric.weight} kg` : 'None yet',
      detail: latestMetric
        ? `Logged ${new Date(latestMetric.date).toLocaleDateString()}`
        : 'Save a body metric to start weight tracking.',
    },
    {
      label: 'Calories Logged',
      value: loading ? '...' : latestNutrition ? String(latestNutrition.totalCalories) : 'None yet',
      detail: latestNutrition
        ? `Nutrition entry from ${new Date(latestNutrition.date).toLocaleDateString()}`
        : 'Save a nutrition log to start compliance tracking.',
    },
    {
      label: 'Latest Session',
      value: loading ? '...' : latestSession ? latestSession.dayLabel : 'None yet',
      detail: latestSession
        ? new Date(latestSession.date).toLocaleDateString()
        : 'Log your first session to start the trendline.',
    },
  ];

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-hero p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.35em] text-tide">My Progress</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Your training and recovery trends in one place.
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-200">
              This page now combines training performance, nutrition logs, and body-metric check-ins so you and your coach can track the full picture instead of isolated workouts.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/client/review/day" className="secondary-button">
              Review a date
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-3xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          {error}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map((card) => (
          <article key={card.label} className="glass-panel p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">{card.label}</p>
            <p className="mt-4 font-display text-2xl font-bold text-white">{card.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ProgressChart
          title="Session Volume Trend"
          description="Total training volume per logged session, using reps multiplied by weight."
          data={trainingOverview}
          lines={[{ key: 'totalVolume', label: 'Volume', color: '#ff6b57' }]}
          emptyMessage="Log a session to start your volume trend."
        />

        <ProgressChart
          title="Consistency And Overload"
          description="Track sets logged and overload flags per session."
          data={trainingOverview}
          lines={[
            { key: 'totalSets', label: 'Sets Logged', color: '#34d399' },
            { key: 'overloadCount', label: 'Overload Alerts', color: '#f2c14e' },
          ]}
          emptyMessage="This chart fills in once session history exists."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ProgressChart
          title="Bodyweight Trend"
          description="Scale weight and body-fat estimate across check-ins."
          data={bodyMetricTrend}
          lines={[
            { key: 'weight', label: 'Weight (kg)', color: '#34d399' },
            { key: 'bodyFatPercent', label: 'Body Fat %', color: '#f97316' },
          ]}
          emptyMessage="Save a body metric check-in to start this chart."
        />

        <ProgressChart
          title="Nutrition Compliance"
          description="Daily calorie and protein totals from nutrition logs."
          data={nutritionTrend}
          lines={[
            { key: 'totalCalories', label: 'Calories', color: '#60a5fa' },
            { key: 'totalProtein', label: 'Protein (g)', color: '#f2c14e' },
          ]}
          emptyMessage="Save a nutrition log to start this chart."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <article className="glass-panel p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Exercise Focus</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-white">Strength trend by lift</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Pick any logged exercise to compare best working weight and best reps over time.
          </p>

          <div className="mt-6">
            <label htmlFor="exercise" className="mb-2 block text-sm font-medium text-slate-200">
              Exercise
            </label>
            <select
              id="exercise"
              value={selectedExercise}
              onChange={(event) => setSelectedExercise(event.target.value)}
              className="input-shell"
              disabled={!exerciseOptions.length}
            >
              {exerciseOptions.length ? (
                exerciseOptions.map((exercise) => (
                  <option key={exercise} value={exercise}>
                    {exercise}
                  </option>
                ))
              ) : (
                <option value="">No exercises logged yet</option>
              )}
            </select>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-200">
            Pair this exercise trend with the new check-in flow so you can compare strength progress against bodyweight and nutrition adherence in the same week.
          </div>
        </article>

        <ProgressChart
          title={selectedExercise ? `${selectedExercise} Performance` : 'Exercise Performance'}
          description="Best weight and best reps recorded for the selected exercise on each session date."
          data={exerciseTrend}
          lines={[
            { key: 'bestWeight', label: 'Best Weight (kg)', color: '#60a5fa' },
            { key: 'bestReps', label: 'Best Reps', color: '#c084fc' },
          ]}
          emptyMessage="Log this exercise across sessions to reveal a trend."
          height={320}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="glass-panel p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Latest Check-In</p>
          <div className="mt-5 space-y-4 text-sm leading-6 text-slate-200">
            <p>
              <span className="text-slate-400">Weight:</span> {latestMetric?.weight ? `${latestMetric.weight} kg` : 'Not logged'}
            </p>
            <p>
              <span className="text-slate-400">Body fat %:</span> {latestMetric?.bodyFatPercent ?? 'Not logged'}
            </p>
            <p>
              <span className="text-slate-400">Energy:</span> {latestMetric?.energyLevel ?? 'Not logged'}
            </p>
            <p>
              <span className="text-slate-400">Sleep:</span> {latestMetric?.sleepHours ? `${latestMetric.sleepHours} hours` : 'Not logged'}
            </p>
            <p>
              <span className="text-slate-400">Notes:</span> {latestMetric?.notes || 'No notes saved'}
            </p>
          </div>
        </article>

        <article className="glass-panel p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Latest Nutrition Entry</p>
          <div className="mt-5 space-y-4 text-sm leading-6 text-slate-200">
            <p>
              <span className="text-slate-400">Calories:</span> {latestNutrition?.totalCalories ?? 'Not logged'}
            </p>
            <p>
              <span className="text-slate-400">Protein:</span> {latestNutrition?.totalProtein ? `${latestNutrition.totalProtein} g` : 'Not logged'}
            </p>
            <p>
              <span className="text-slate-400">Water:</span> {latestNutrition?.waterLitres ? `${latestNutrition.waterLitres} L` : 'Not logged'}
            </p>
            <p>
              <span className="text-slate-400">Notes:</span> {latestNutrition?.notes || 'No notes saved'}
            </p>
          </div>
        </article>
      </section>

      <section className="glass-panel p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Recent Sessions</p>
            <h2 className="mt-3 font-display text-2xl font-bold text-white">What your last workouts looked like</h2>
          </div>
          <Link to="/client/review/day" className="secondary-button">
            Open full day review
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
              Loading session history...
            </div>
          ) : sessions.length ? (
            sessions.slice(0, 6).map((session) => {
              const overloadCount = session.sets.filter((set) => set.overloadAlert).length;
              const totalVolume = session.sets.reduce(
                (sum, set) => sum + (Number(set.repsCompleted) || 0) * (Number(set.weightUsed) || 0),
                0
              );

              return (
                <div key={session._id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-display text-xl font-semibold text-white">{session.dayLabel}</p>
                      <p className="mt-2 text-sm text-slate-300">
                        {new Date(session.date).toLocaleDateString()} | {session.sets.length} sets | {totalVolume} volume
                      </p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-slate-950/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                      {overloadCount} overload
                    </div>
                  </div>
                  {session.coachComment ? (
                    <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
                      Coach feedback: {session.coachComment}
                    </p>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-300">
              No session history yet. Log your first workout and this page will start filling out immediately.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
