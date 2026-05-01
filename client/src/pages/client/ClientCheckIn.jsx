import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getClientMetrics, saveBodyMetric } from '../../api/metrics';
import { getClientNutritionHistory, getTodayNutrition, saveNutritionLog } from '../../api/nutrition';
import { useAuth } from '../../hooks/useAuth';

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

const initialNutritionForm = {
  date: todayInputValue(),
  totalCalories: '',
  totalProtein: '',
  totalCarbs: '',
  totalFat: '',
  waterLitres: '',
  notes: '',
};

const initialMetricForm = {
  date: todayInputValue(),
  weight: '',
  bodyFatPercent: '',
  waistCm: '',
  chestCm: '',
  armCm: '',
  legCm: '',
  energyLevel: '',
  sleepHours: '',
  notes: '',
};

function normalizeNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return 0;
  }

  return Number(value) || 0;
}

function nullableNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  return Number(value) || null;
}

function formatDate(value) {
  if (!value) {
    return 'Not logged';
  }

  return new Date(value).toLocaleDateString();
}

export default function ClientCheckIn() {
  const { user } = useAuth();
  const [nutritionForm, setNutritionForm] = useState(initialNutritionForm);
  const [metricForm, setMetricForm] = useState(initialMetricForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nutritionStatus, setNutritionStatus] = useState('');
  const [metricStatus, setMetricStatus] = useState('');
  const [submittingNutrition, setSubmittingNutrition] = useState(false);
  const [submittingMetric, setSubmittingMetric] = useState(false);
  const [latestMetric, setLatestMetric] = useState(null);
  const [todayNutritionSummary, setTodayNutritionSummary] = useState(null);
  const [nutritionHistoryCount, setNutritionHistoryCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadCheckInData() {
      if (!user?.clientProfileId) {
        if (mounted) {
          setError('Client profile is not linked to this login yet.');
          setLoading(false);
        }
        return;
      }

      try {
        const [todayNutritionResponse, metricsResponse, nutritionHistoryResponse] = await Promise.all([
          getTodayNutrition(user.clientProfileId).catch((requestError) => {
            if (requestError.response?.status === 404) {
              return { log: null };
            }

            throw requestError;
          }),
          getClientMetrics(user.clientProfileId),
          getClientNutritionHistory(user.clientProfileId),
        ]);

        if (!mounted) {
          return;
        }

        const todayNutrition = todayNutritionResponse.log || null;
        const latestSavedMetric = metricsResponse.metrics?.[0] || null;

        setTodayNutritionSummary(todayNutrition);
        setLatestMetric(latestSavedMetric);
        setNutritionHistoryCount(nutritionHistoryResponse.logs?.length || 0);

        if (todayNutrition) {
          setNutritionForm({
            date: todayInputValue(),
            totalCalories: todayNutrition.totalCalories ?? '',
            totalProtein: todayNutrition.totalProtein ?? '',
            totalCarbs: todayNutrition.totalCarbs ?? '',
            totalFat: todayNutrition.totalFat ?? '',
            waterLitres: todayNutrition.waterLitres ?? '',
            notes: todayNutrition.notes || '',
          });
        }

        if (latestSavedMetric && formatDate(latestSavedMetric.date) === formatDate(new Date())) {
          setMetricForm({
            date: todayInputValue(),
            weight: latestSavedMetric.weight ?? '',
            bodyFatPercent: latestSavedMetric.bodyFatPercent ?? '',
            waistCm: latestSavedMetric.waistCm ?? '',
            chestCm: latestSavedMetric.chestCm ?? '',
            armCm: latestSavedMetric.armCm ?? '',
            legCm: latestSavedMetric.legCm ?? '',
            energyLevel: latestSavedMetric.energyLevel ?? '',
            sleepHours: latestSavedMetric.sleepHours ?? '',
            notes: latestSavedMetric.notes || '',
          });
        }
      } catch (requestError) {
        if (mounted) {
          setError(requestError.response?.data?.message || 'Unable to load check-in data.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCheckInData();

    return () => {
      mounted = false;
    };
  }, [user?.clientProfileId]);

  function updateNutrition(event) {
    const { name, value } = event.target;
    setNutritionForm((current) => ({ ...current, [name]: value }));
  }

  function updateMetric(event) {
    const { name, value } = event.target;
    setMetricForm((current) => ({ ...current, [name]: value }));
  }

  async function handleNutritionSubmit(event) {
    event.preventDefault();
    setSubmittingNutrition(true);
    setNutritionStatus('');

    try {
      const response = await saveNutritionLog({
        ...nutritionForm,
        totalCalories: normalizeNumber(nutritionForm.totalCalories),
        totalProtein: normalizeNumber(nutritionForm.totalProtein),
        totalCarbs: normalizeNumber(nutritionForm.totalCarbs),
        totalFat: normalizeNumber(nutritionForm.totalFat),
        waterLitres: normalizeNumber(nutritionForm.waterLitres),
      });

      setNutritionStatus(response.message);
      setTodayNutritionSummary(response.nutritionLog);
      setNutritionHistoryCount((count) => (todayNutritionSummary ? count : count + 1));
    } catch (requestError) {
      setNutritionStatus(requestError.response?.data?.message || 'Unable to save nutrition right now.');
    } finally {
      setSubmittingNutrition(false);
    }
  }

  async function handleMetricSubmit(event) {
    event.preventDefault();
    setSubmittingMetric(true);
    setMetricStatus('');

    try {
      const response = await saveBodyMetric({
        ...metricForm,
        weight: nullableNumber(metricForm.weight),
        bodyFatPercent: nullableNumber(metricForm.bodyFatPercent),
        waistCm: nullableNumber(metricForm.waistCm),
        chestCm: nullableNumber(metricForm.chestCm),
        armCm: nullableNumber(metricForm.armCm),
        legCm: nullableNumber(metricForm.legCm),
        energyLevel: nullableNumber(metricForm.energyLevel),
        sleepHours: nullableNumber(metricForm.sleepHours),
      });

      setMetricStatus(response.message);
      setLatestMetric(response.metric);
    } catch (requestError) {
      setMetricStatus(requestError.response?.data?.message || 'Unable to save check-in right now.');
    } finally {
      setSubmittingMetric(false);
    }
  }

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-hero p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.35em] text-tide">Check-In Center</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Log recovery, nutrition, and body data.
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-200">
              Save daily macros and weekly body metrics here so the dashboard and progress page can reflect more than just your training volume.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/client/progress" className="secondary-button">
              View progress
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

      <section className="grid gap-4 lg:grid-cols-4">
        {[
          {
            label: 'Calories Today',
            value: loading ? '...' : todayNutritionSummary ? String(todayNutritionSummary.totalCalories) : 'Not logged',
            detail: 'Your most recent nutrition entry for today.',
          },
          {
            label: 'Protein Today',
            value: loading ? '...' : todayNutritionSummary ? `${todayNutritionSummary.totalProtein} g` : 'Not logged',
            detail: 'Daily protein intake saved in the platform.',
          },
          {
            label: 'Latest Weight',
            value: loading ? '...' : latestMetric?.weight ? `${latestMetric.weight} kg` : 'Not logged',
            detail: latestMetric ? `Logged ${formatDate(latestMetric.date)}` : 'Your latest body check-in.',
          },
          {
            label: 'Nutrition Entries',
            value: loading ? '...' : String(nutritionHistoryCount),
            detail: 'How many daily nutrition logs are on file.',
          },
        ].map((card) => (
          <article key={card.label} className="glass-panel p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">{card.label}</p>
            <p className="mt-4 font-display text-2xl font-bold text-white">{card.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="glass-panel p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Daily Nutrition</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-white">Save today’s macro totals</h2>
          <form onSubmit={handleNutritionSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Date</label>
                <input type="date" name="date" value={nutritionForm.date} onChange={updateNutrition} className="input-shell" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Water litres</label>
                <input
                  type="number"
                  step="0.1"
                  name="waterLitres"
                  value={nutritionForm.waterLitres}
                  onChange={updateNutrition}
                  className="input-shell"
                  placeholder="3.5"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['totalCalories', 'Calories', '2300'],
                ['totalProtein', 'Protein (g)', '180'],
                ['totalCarbs', 'Carbs (g)', '220'],
                ['totalFat', 'Fat (g)', '65'],
              ].map(([name, label, placeholder]) => (
                <div key={name}>
                  <label className="mb-2 block text-sm font-medium text-slate-200">{label}</label>
                  <input
                    type="number"
                    name={name}
                    value={nutritionForm[name]}
                    onChange={updateNutrition}
                    className="input-shell"
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Notes</label>
              <textarea
                rows="3"
                name="notes"
                value={nutritionForm.notes}
                onChange={updateNutrition}
                className="input-shell"
                placeholder="Hunger, adherence, digestion, meal timing..."
              />
            </div>

            {nutritionStatus ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100">
                {nutritionStatus}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submittingNutrition}
              className="primary-button disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submittingNutrition ? 'Saving nutrition...' : 'Save nutrition log'}
            </button>
          </form>
        </article>

        <article className="glass-panel p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Weekly Metrics</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-white">Save a body check-in</h2>
          <form onSubmit={handleMetricSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Date</label>
                <input type="date" name="date" value={metricForm.date} onChange={updateMetric} className="input-shell" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  value={metricForm.weight}
                  onChange={updateMetric}
                  className="input-shell"
                  placeholder="91.2"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['bodyFatPercent', 'Body fat %', '20'],
                ['waistCm', 'Waist cm', '87'],
                ['chestCm', 'Chest cm', '106'],
                ['armCm', 'Arm cm', '38'],
                ['legCm', 'Leg cm', '59'],
                ['energyLevel', 'Energy 1-10', '7'],
                ['sleepHours', 'Sleep hours', '7.5'],
              ].map(([name, label, placeholder]) => (
                <div key={name}>
                  <label className="mb-2 block text-sm font-medium text-slate-200">{label}</label>
                  <input
                    type="number"
                    step="0.1"
                    name={name}
                    value={metricForm[name]}
                    onChange={updateMetric}
                    className="input-shell"
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Notes</label>
              <textarea
                rows="3"
                name="notes"
                value={metricForm.notes}
                onChange={updateMetric}
                className="input-shell"
                placeholder="Recovery, sleep quality, stress, digestion, photos..."
              />
            </div>

            {metricStatus ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100">
                {metricStatus}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submittingMetric}
              className="primary-button disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submittingMetric ? 'Saving check-in...' : 'Save body metric'}
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}
