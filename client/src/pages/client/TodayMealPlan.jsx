import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getActiveMealPlan } from '../../api/mealplans';
import { useAuth } from '../../hooks/useAuth';

function getTodayName() {
  return new Date().toLocaleDateString(undefined, { weekday: 'long' }).toLowerCase();
}

function formatDate(value) {
  if (!value) {
    return 'Not set';
  }

  return new Date(value).toLocaleDateString();
}

export default function TodayMealPlan() {
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
        const data = await getActiveMealPlan(user.clientProfileId);

        if (mounted) {
          setPlan(data.plan);
        }
      } catch (requestError) {
        if (mounted) {
          if (requestError.response?.status === 404) {
            setPlan(null);
          } else {
            setError(requestError.response?.data?.message || 'Unable to load the active meal plan.');
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

  const todayName = useMemo(() => getTodayName(), []);
  const isCheatMealDay = Boolean(plan?.cheatMealDay) && plan.cheatMealDay === todayName;
  const isResetDay = todayName === 'saturday' && Boolean(plan?.resetDayRules);

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-hero p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.35em] text-tide">Today Meal Plan</p>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {loading ? 'Loading meal plan...' : plan?.name || 'No meal plan assigned'}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-200">
              Review the meals, weights, and macro targets your coach has assigned before you log food for the day.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/client/check-in" className="primary-button">
              Open check-in
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

      {loading ? (
        <section className="glass-panel p-6 text-sm text-slate-200">Loading active meal plan...</section>
      ) : !plan ? (
        <section className="glass-panel p-6 text-sm leading-6 text-slate-200">
          No active meal plan is assigned yet. Ask your coach to create one from your client detail page.
        </section>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-3">
            <article className="glass-panel p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Week start</p>
              <p className="mt-4 font-display text-2xl font-bold text-white">{formatDate(plan.weekStartDate)}</p>
            </article>
            <article className="glass-panel p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Today</p>
              <p className="mt-4 font-display text-2xl font-bold text-white">
                {todayName.charAt(0).toUpperCase() + todayName.slice(1)}
              </p>
            </article>
            <article className="glass-panel p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Meals</p>
              <p className="mt-4 font-display text-2xl font-bold text-white">{plan.meals?.length || 0}</p>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <article className="glass-panel p-6 sm:p-8">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Daily targets</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-300">Calories</p>
                  <p className="mt-2 font-display text-2xl font-bold text-white">{plan.dailyCalorieTarget} kcal</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-300">Protein</p>
                  <p className="mt-2 font-display text-2xl font-bold text-white">{plan.dailyProteinTarget} g</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-300">Carbs</p>
                  <p className="mt-2 font-display text-2xl font-bold text-white">{plan.dailyCarbTarget} g</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-300">Fat</p>
                  <p className="mt-2 font-display text-2xl font-bold text-white">{plan.dailyFatTarget} g</p>
                </div>
              </div>

              {plan.notes ? (
                <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-200">
                  {plan.notes}
                </div>
              ) : null}

              {isCheatMealDay ? (
                <div className="mt-6 rounded-3xl border border-gold/30 bg-gold/10 p-5 text-sm leading-6 text-gold">
                  <p className="font-medium text-white">Cheat meal day</p>
                  <p className="mt-2">{plan.cheatMealRules || 'Stay within the plan and keep protein high.'}</p>
                </div>
              ) : null}

              {isResetDay ? (
                <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/30 p-5 text-sm leading-6 text-slate-200">
                  <p className="font-medium text-white">Reset day guidance</p>
                  <p className="mt-2">{plan.resetDayRules}</p>
                </div>
              ) : null}
            </article>

            <section className="space-y-4">
              {plan.meals?.length ? (
                plan.meals.map((meal, mealIndex) => (
                  <article key={`${meal.name}-${mealIndex}`} className="glass-panel p-6 sm:p-8">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-display text-2xl font-bold text-white">{meal.name}</p>
                        <p className="mt-2 text-sm text-slate-300">
                          {meal.targetTime || 'Time not set'} | {meal.mealCalories || 0} kcal | {meal.mealProtein || 0} g protein
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {meal.foods?.length ? (
                        meal.foods.map((food, foodIndex) => (
                          <div key={`${food.name}-${foodIndex}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <p className="font-medium text-white">{food.name}</p>
                              <p className="text-sm text-slate-300">{food.weightGrams || 0} g</p>
                            </div>
                            <p className="mt-2 text-sm text-slate-300">
                              {food.calories || 0} kcal | {food.protein || 0}p / {food.carbs || 0}c / {food.fat || 0}f
                            </p>
                            {food.notes ? (
                              <p className="mt-3 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
                                {food.notes}
                              </p>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-300">
                          No foods saved for this meal.
                        </div>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <section className="glass-panel p-6 text-sm leading-6 text-slate-200">
                  The active meal plan does not include any meals yet.
                </section>
              )}
            </section>
          </section>
        </>
      )}
    </div>
  );
}
