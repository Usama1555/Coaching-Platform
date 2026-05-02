import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DailyTrainingReview, { getDateValue } from '../../components/DailyTrainingReview';
import { getCoachClientDetail } from '../../api/coaches';
import { getClientMetrics } from '../../api/metrics';
import { addSessionComment, getClientSessions } from '../../api/sessions';
import { getClientNutritionHistory } from '../../api/nutrition';

function pickDefaultDate(sessions, nutritionLogs, metrics) {
  const timestamps = [...sessions, ...nutritionLogs, ...metrics]
    .map((item) => new Date(item.date).getTime())
    .filter((value) => !Number.isNaN(value));

  if (!timestamps.length) {
    return '';
  }

  return getDateValue(new Date(Math.max(...timestamps)));
}

export default function ClientDailyReview() {
  const { clientId } = useParams();
  const [client, setClient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [nutritionLogs, setNutritionLogs] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentError, setCommentError] = useState('');
  const [savingCommentId, setSavingCommentId] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadReview() {
      try {
        const [detailResponse, sessionsResponse, nutritionResponse, metricsResponse] = await Promise.all([
          getCoachClientDetail(clientId),
          getClientSessions(clientId),
          getClientNutritionHistory(clientId),
          getClientMetrics(clientId),
        ]);

        if (mounted) {
          const nextSessions = sessionsResponse.sessions || [];
          const nextLogs = nutritionResponse.logs || [];
          const nextMetrics = metricsResponse.metrics || [];
          setClient(detailResponse.client || null);
          setSessions(nextSessions);
          setNutritionLogs(nextLogs);
          setMetrics(nextMetrics);
          setSelectedDate(pickDefaultDate(nextSessions, nextLogs, nextMetrics));
        }
      } catch (requestError) {
        if (mounted) {
          setError(requestError.response?.data?.message || 'Unable to load this client review page.');
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
  }, [clientId]);

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

  const historyCount = useMemo(
    () => sessions.length + nutritionLogs.length + metrics.length,
    [metrics.length, nutritionLogs.length, sessions.length]
  );

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-hero p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.35em] text-tide">Client Day Review</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {loading ? 'Loading client...' : `Review ${client?.user?.name || 'client'} by date.`}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-200">
              Choose a date to inspect both the logged workout and the nutrition intake from that same day without cluttering the main client profile.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
              {loading ? 'Loading history...' : `${historyCount} total entries`}
            </div>
            <Link to={`/coach/clients/${clientId}`} className="secondary-button self-start">
              Back to client detail
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
        <section className="glass-panel p-6 text-sm text-slate-200">Loading client daily review...</section>
      ) : (
        <DailyTrainingReview
          sessions={sessions}
          nutritionLogs={nutritionLogs}
          metrics={metrics}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          title="Workout and nutrition by date"
          description="This is the coach-facing day review page. Pick any date to inspect the training log, nutrition intake, check-in data, and leave feedback if needed."
          commentError={commentError}
          onSaveComment={handleSaveComment}
          savingCommentId={savingCommentId}
        />
      )}
    </div>
  );
}
