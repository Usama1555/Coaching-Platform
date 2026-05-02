import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DailyTrainingReview, { getDateValue } from '../../components/DailyTrainingReview';
import { getClientMetrics } from '../../api/metrics';
import { getClientNutritionHistory } from '../../api/nutrition';
import { getClientSessions } from '../../api/sessions';
import { useAuth } from '../../hooks/useAuth';

function pickDefaultDate(sessions, nutritionLogs, metrics) {
  const timestamps = [...sessions, ...nutritionLogs, ...metrics]
    .map((item) => new Date(item.date).getTime())
    .filter((value) => !Number.isNaN(value));

  if (!timestamps.length) {
    return '';
  }

  return getDateValue(new Date(Math.max(...timestamps)));
}

export default function DailyReview() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [nutritionLogs, setNutritionLogs] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadReview() {
      if (!user?.clientProfileId) {
        if (mounted) {
          setError('Client profile is not linked to this login yet.');
          setLoading(false);
        }
        return;
      }

      try {
        const [sessionResponse, nutritionResponse, metricsResponse] = await Promise.all([
          getClientSessions(user.clientProfileId),
          getClientNutritionHistory(user.clientProfileId),
          getClientMetrics(user.clientProfileId),
        ]);

        if (mounted) {
          const nextSessions = sessionResponse.sessions || [];
          const nextLogs = nutritionResponse.logs || [];
          const nextMetrics = metricsResponse.metrics || [];
          setSessions(nextSessions);
          setNutritionLogs(nextLogs);
          setMetrics(nextMetrics);
          setSelectedDate(pickDefaultDate(nextSessions, nextLogs, nextMetrics));
        }
      } catch (requestError) {
        if (mounted) {
          setError(requestError.response?.data?.message || 'Unable to load daily review data right now.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadReview();

    return () => {
      mounted = false;
    };
  }, [user?.clientProfileId]);

  const historyCount = useMemo(
    () => sessions.length + nutritionLogs.length + metrics.length,
    [metrics.length, nutritionLogs.length, sessions.length]
  );

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-hero p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.35em] text-tide">Daily Review</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Review any logged day in one place.
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-200">
              Choose a date and compare the workout you completed with the nutrition you logged on that same day.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
              {loading ? 'Loading history...' : `${historyCount} total entries`}
            </div>
            <Link to="/client/progress" className="secondary-button self-start">
              Back to progress
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
        <section className="glass-panel p-6 text-sm text-slate-200">Loading daily review...</section>
      ) : (
        <DailyTrainingReview
          sessions={sessions}
          nutritionLogs={nutritionLogs}
          metrics={metrics}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          title="Workout and nutrition by date"
          description="Use this page when you want the exact workout, nutrition, and check-in details from a single day instead of scanning through long history lists."
        />
      )}
    </div>
  );
}
