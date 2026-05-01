import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getActiveWorkoutPlan } from '../../api/workouts';
import { useAuth } from '../../hooks/useAuth';
import { getPlanDayForDate } from '../../utils/planDay';

export default function TodayWorkout() {
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadPlan() {
      if (!user?.clientProfileId) {
        if (mounted) {
          setError('Client profile is not linked to this login yet.');
          setLoading(false);
        }
        return;
      }

      try {
        const data = await getActiveWorkoutPlan(user.clientProfileId);

        if (mounted) {
          setPlan(data.plan);
        }
      } catch (requestError) {
        if (mounted) {
          if (requestError.response?.status === 404) {
            setPlan(null);
          } else {
            setError(requestError.response?.data?.message || 'Unable to load today’s workout.');
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPlan();

    return () => {
      mounted = false;
    };
  }, [user?.clientProfileId]);

  const todayDay = getPlanDayForDate(plan);

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-hero p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.35em] text-tide">Today Workout</p>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {loading ? 'Loading plan...' : todayDay?.label || 'No workout assigned'}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-200">
              Review the assigned exercises, target ranges, and cardio before you start logging the session.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/client" className="secondary-button">
              Back to dashboard
            </Link>
            {todayDay && !todayDay.isRest ? (
              <Link to="/client/workout/log" className="primary-button">
                Start logging
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-3xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          {error}
        </section>
      ) : null}

      {loading ? (
        <section className="glass-panel p-6 text-sm text-slate-200">Loading active plan...</section>
      ) : !plan ? (
        <section className="glass-panel p-6 text-sm leading-6 text-slate-200">
          No active workout plan is assigned yet. Ask your coach to create one from the coach dashboard.
        </section>
      ) : todayDay ? (
        <>
          <section className="glass-panel p-6 sm:p-8">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Plan context</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-300">Plan</p>
                <p className="mt-2 font-display text-2xl font-bold text-white">{plan.name}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-300">Split</p>
                <p className="mt-2 font-display text-2xl font-bold text-white">{plan.splitType || 'custom'}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-300">Day</p>
                <p className="mt-2 font-display text-2xl font-bold text-white">{todayDay.label}</p>
              </div>
            </div>
          </section>

          {todayDay.isRest ? (
            <section className="glass-panel p-6 sm:p-8 text-sm leading-6 text-slate-200">
              This is marked as a rest or recovery day. If you want, you can still review the plan and cardio guidance before the next lifting session.
            </section>
          ) : (
            <>
              <section className="space-y-4">
                {todayDay.exercises.map((exercise) => (
                  <article key={exercise.name} className="glass-panel p-6 sm:p-8">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-display text-2xl font-bold text-white">{exercise.name}</p>
                        <p className="mt-2 text-sm text-slate-300">{exercise.muscleGroup || 'Muscle group not set'}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
                        {exercise.targetSets} sets of {exercise.targetRepsMin}-{exercise.targetRepsMax} reps at {exercise.targetWeight} kg
                      </div>
                    </div>
                    {exercise.notes ? (
                      <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                        {exercise.notes}
                      </p>
                    ) : null}
                  </article>
                ))}
              </section>

              <section className="glass-panel p-6 sm:p-8">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Cardio</p>
                <p className="mt-4 text-sm leading-6 text-slate-200">
                  {todayDay.cardio?.type
                    ? `${todayDay.cardio.type} for ${todayDay.cardio.durationMins} mins at speed ${todayDay.cardio.speed} and incline ${todayDay.cardio.incline}.`
                    : 'No cardio protocol is attached to this workout day.'}
                </p>
              </section>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

