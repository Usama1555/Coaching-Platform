import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ExerciseLogger from '../../components/ExerciseLogger';
import OverloadAlert from '../../components/OverloadAlert';
import { createSessionLog } from '../../api/sessions';
import { getActiveWorkoutPlan } from '../../api/workouts';
import { useAuth } from '../../hooks/useAuth';
import { getPlanDayForDate } from '../../utils/planDay';
import { checkOverload } from '../../utils/overloadChecker';

export default function LogSession() {
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

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
            setError(requestError.response?.data?.message || 'Unable to load the current workout plan.');
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

  async function handleSubmit(payload) {
    if (!plan || !todayDay) {
      setSubmitError('No active workout day is available for logging.');
      return;
    }

    setSubmitError('');
    setSuccessMessage('');
    setAlerts([]);
    setSubmitting(true);

    try {
      const response = await createSessionLog({
        workoutPlanId: plan._id,
        dayNumber: todayDay.dayNumber,
        dayLabel: todayDay.label,
        ...payload,
      });

      const overloadAlerts = response.alerts?.length ? response.alerts : checkOverload(payload.sets);
      setAlerts(overloadAlerts);
      setSuccessMessage('Session logged successfully. Nice work.');
    } catch (requestError) {
      setSubmitError(requestError.response?.data?.message || 'Unable to log your session right now.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-hero p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.35em] text-tide">Log Session</p>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {loading ? 'Loading session...' : todayDay?.label || 'No workout to log'}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-200">
              Record reps, load, and failure set by set. The system will flag any exercises ready for progressive overload.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/client/workout/today" className="secondary-button">
              View workout
            </Link>
            <Link to="/client" className="secondary-button">
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-3xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          {error}
        </section>
      ) : null}

      {submitError ? (
        <section className="rounded-3xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          {submitError}
        </section>
      ) : null}

      {successMessage ? (
        <section className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
          {successMessage}
        </section>
      ) : null}

      <OverloadAlert alerts={alerts} />

      {loading ? (
        <section className="glass-panel p-6 text-sm text-slate-200">Loading logging form...</section>
      ) : !plan || !todayDay ? (
        <section className="glass-panel p-6 text-sm leading-6 text-slate-200">
          No active workout plan is available to log yet.
        </section>
      ) : todayDay.isRest ? (
        <section className="glass-panel p-6 text-sm leading-6 text-slate-200">
          This is a rest day in the current plan, so there is no lifting session to log right now.
        </section>
      ) : (
        <ExerciseLogger exercises={todayDay.exercises} onSubmit={handleSubmit} submitting={submitting} />
      )}
    </div>
  );
}

