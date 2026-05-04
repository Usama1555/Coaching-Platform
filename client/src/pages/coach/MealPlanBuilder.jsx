import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DateInput from '../../components/DateInput';
import { getCoachClientDetail } from '../../api/coaches';
import { createMealPlan, getClientMealPlans, updateMealPlan } from '../../api/mealplans';

function createFood() {
  return {
    name: '',
    weightGrams: 0,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    notes: '',
  };
}

function createMeal(name = 'New meal', targetTime = '') {
  return {
    name,
    targetTime,
    foods: [createFood()],
  };
}

function formatDateForInput(value) {
  const date = value ? new Date(value) : new Date();
  return date.toISOString().slice(0, 10);
}

function normalizeNumber(value) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function buildDefaultMeals() {
  return [
    createMeal('Breakfast', '08:00'),
    createMeal('Lunch', '13:00'),
    createMeal('Dinner', '19:00'),
  ];
}

function buildFormFromPlan(plan) {
  return {
    name: plan.name || '',
    weekStartDate: formatDateForInput(plan.weekStartDate),
    dailyCalorieTarget: plan.dailyCalorieTarget || 0,
    dailyProteinTarget: plan.dailyProteinTarget || 0,
    dailyCarbTarget: plan.dailyCarbTarget || 0,
    dailyFatTarget: plan.dailyFatTarget || 0,
    cheatMealDay: plan.cheatMealDay || '',
    cheatMealRules: plan.cheatMealRules || '',
    resetDayRules: plan.resetDayRules || '',
    notes: plan.notes || '',
    meals:
      plan.meals?.length
        ? plan.meals.map((meal) => ({
            name: meal.name || '',
            targetTime: meal.targetTime || '',
            foods:
              meal.foods?.length
                ? meal.foods.map((food) => ({
                    name: food.name || '',
                    weightGrams: food.weightGrams || 0,
                    calories: food.calories || 0,
                    protein: food.protein || 0,
                    carbs: food.carbs || 0,
                    fat: food.fat || 0,
                    notes: food.notes || '',
                  }))
                : [createFood()],
          }))
        : buildDefaultMeals(),
  };
}

export default function MealPlanBuilder() {
  const navigate = useNavigate();
  const { clientId, planId } = useParams();
  const [client, setClient] = useState(null);
  const [loadingClient, setLoadingClient] = useState(true);
  const [error, setError] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    weekStartDate: formatDateForInput(),
    dailyCalorieTarget: 0,
    dailyProteinTarget: 0,
    dailyCarbTarget: 0,
    dailyFatTarget: 0,
    cheatMealDay: 'friday',
    cheatMealRules: 'Keep protein high and stay within the overall weekly plan.',
    resetDayRules: 'Return to the meal plan structure and prioritise lean protein and hydration.',
    notes: '',
    meals: buildDefaultMeals(),
  });

  useEffect(() => {
    let mounted = true;

    async function loadClient() {
      try {
        const [data, mealPlanResponse] = await Promise.all([
          getCoachClientDetail(clientId),
          planId ? getClientMealPlans(clientId) : Promise.resolve({ plans: [] }),
        ]);

        if (mounted) {
          const existingPlan = planId
            ? (mealPlanResponse.plans || []).find((plan) => plan._id === planId)
            : null;

          setClient(data.client);

          if (existingPlan) {
            setForm(buildFormFromPlan(existingPlan));
          } else {
            setForm((current) => ({
              ...current,
              name: current.name || `${data.client.user?.name || 'Client'} - Meal Plan`,
              dailyCalorieTarget: current.dailyCalorieTarget || data.client.targetCalories || 0,
              dailyProteinTarget: current.dailyProteinTarget || data.client.targetProtein || 0,
            }));
          }

          if (planId && !existingPlan) {
            setError('Meal plan not found for this client.');
          }
        }
      } catch (requestError) {
        if (mounted) {
          setError(requestError.response?.data?.message || 'Unable to load this client.');
        }
      } finally {
        if (mounted) {
          setLoadingClient(false);
        }
      }
    }

    loadClient();

    return () => {
      mounted = false;
    };
  }, [clientId, planId]);

  const totals = useMemo(() => {
    return form.meals.reduce(
      (sum, meal) => {
        meal.foods.forEach((food) => {
          sum.calories += normalizeNumber(food.calories);
          sum.protein += normalizeNumber(food.protein);
          sum.carbs += normalizeNumber(food.carbs);
          sum.fat += normalizeNumber(food.fat);
        });

        return sum;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [form.meals]);

  function updateTopLevel(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateMeal(mealIndex, field, value) {
    setForm((current) => ({
      ...current,
      meals: current.meals.map((meal, index) =>
        index === mealIndex
          ? {
              ...meal,
              [field]: value,
            }
          : meal
      ),
    }));
  }

  function addMeal() {
    setForm((current) => ({
      ...current,
      meals: [...current.meals, createMeal(`Meal ${current.meals.length + 1}`)],
    }));
  }

  function removeMeal(mealIndex) {
    setForm((current) => ({
      ...current,
      meals: current.meals.filter((_, index) => index !== mealIndex),
    }));
  }

  function updateFood(mealIndex, foodIndex, field, value) {
    setForm((current) => ({
      ...current,
      meals: current.meals.map((meal, index) =>
        index === mealIndex
          ? {
              ...meal,
              foods: meal.foods.map((food, idx) =>
                idx === foodIndex
                  ? {
                      ...food,
                      [field]: value,
                    }
                  : food
              ),
            }
          : meal
      ),
    }));
  }

  function addFood(mealIndex) {
    setForm((current) => ({
      ...current,
      meals: current.meals.map((meal, index) =>
        index === mealIndex
          ? {
              ...meal,
              foods: [...meal.foods, createFood()],
            }
          : meal
      ),
    }));
  }

  function removeFood(mealIndex, foodIndex) {
    setForm((current) => ({
      ...current,
      meals: current.meals.map((meal, index) =>
        index === mealIndex
          ? {
              ...meal,
              foods: meal.foods.filter((_, idx) => idx !== foodIndex),
            }
          : meal
      ),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitStatus('');
    setSubmitting(true);

    try {
      const payload = {
        clientId,
        name: form.name,
        weekStartDate: form.weekStartDate,
        dailyCalorieTarget: normalizeNumber(form.dailyCalorieTarget),
        dailyProteinTarget: normalizeNumber(form.dailyProteinTarget),
        dailyCarbTarget: normalizeNumber(form.dailyCarbTarget),
        dailyFatTarget: normalizeNumber(form.dailyFatTarget),
        cheatMealDay: form.cheatMealDay,
        cheatMealRules: form.cheatMealRules,
        resetDayRules: form.resetDayRules,
        notes: form.notes,
        isActive: true,
        meals: form.meals.map((meal) => ({
          name: meal.name,
          targetTime: meal.targetTime,
          foods: meal.foods
            .filter((food) => food.name.trim())
            .map((food) => ({
              ...food,
              weightGrams: normalizeNumber(food.weightGrams),
              calories: normalizeNumber(food.calories),
              protein: normalizeNumber(food.protein),
              carbs: normalizeNumber(food.carbs),
              fat: normalizeNumber(food.fat),
            })),
        })),
      };

      if (planId) {
        await updateMealPlan(planId, payload);
      } else {
        await createMealPlan(payload);
      }

      navigate(`/coach/clients/${clientId}`, { replace: true });
    } catch (requestError) {
      setSubmitStatus(requestError.response?.data?.message || 'Unable to save meal plan right now.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-hero p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.35em] text-tide">Meal Plan Builder</p>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {loadingClient
                ? 'Loading client...'
                : planId
                  ? `Edit meal plan for ${client?.user?.name || 'client'}`
                  : `Meal plan for ${client?.user?.name || 'client'}`}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-200">
              {planId
                ? 'Adjust the active nutrition blueprint, update foods and macros, and keep the latest plan aligned with the client goal.'
                : 'Build a daily nutrition blueprint, keep the targets visible while you work, and activate the newest meal plan in one save.'}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to={`/coach/clients/${clientId}`} className="secondary-button">
              Client detail
            </Link>
            <Link to="/coach/clients/roster" className="secondary-button">
              Client roster
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-3xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          {error}
        </section>
      ) : null}

      {!error ? (
        <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="glass-panel p-6 sm:p-8">
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label htmlFor="meal-plan-name" className="mb-2 block text-sm font-medium text-slate-200">
                    Plan name
                  </label>
                  <input
                    id="meal-plan-name"
                    name="name"
                    value={form.name}
                    onChange={updateTopLevel}
                    className="input-shell"
                    placeholder="Week 5 Cutting Plan"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="weekStartDate" className="mb-2 block text-sm font-medium text-slate-200">
                    Week start date
                  </label>
                  <DateInput
                    id="weekStartDate"
                    name="weekStartDate"
                    value={form.weekStartDate}
                    onChange={updateTopLevel}
                    className="input-shell"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['dailyCalorieTarget', 'Calories', client?.targetCalories || '2000'],
                  ['dailyProteinTarget', 'Protein (g)', client?.targetProtein || '190'],
                  ['dailyCarbTarget', 'Carbs (g)', '200'],
                  ['dailyFatTarget', 'Fat (g)', '65'],
                ].map(([name, label, placeholder]) => (
                  <div key={name}>
                    <label htmlFor={name} className="mb-2 block text-sm font-medium text-slate-200">
                      {label}
                    </label>
                    <input
                      id={name}
                      type="number"
                      min="0"
                      name={name}
                      value={form[name]}
                      onChange={updateTopLevel}
                      className="input-shell"
                      placeholder={String(placeholder)}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-panel p-6 sm:p-8">
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label htmlFor="cheatMealDay" className="mb-2 block text-sm font-medium text-slate-200">
                    Cheat meal day
                  </label>
                  <select
                    id="cheatMealDay"
                    name="cheatMealDay"
                    value={form.cheatMealDay}
                    onChange={updateTopLevel}
                    className="input-shell"
                  >
                    <option value="">None</option>
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                      <option key={day} value={day}>
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div>
                  <label htmlFor="cheatMealRules" className="mb-2 block text-sm font-medium text-slate-200">
                    Cheat meal rules
                  </label>
                  <textarea
                    id="cheatMealRules"
                    rows="3"
                    name="cheatMealRules"
                    value={form.cheatMealRules}
                    onChange={updateTopLevel}
                    className="input-shell"
                    placeholder="2 cheat meals, keep protein high."
                  />
                </div>

                <div>
                  <label htmlFor="resetDayRules" className="mb-2 block text-sm font-medium text-slate-200">
                    Reset day rules
                  </label>
                  <textarea
                    id="resetDayRules"
                    rows="3"
                    name="resetDayRules"
                    value={form.resetDayRules}
                    onChange={updateTopLevel}
                    className="input-shell"
                    placeholder="Return to protein-first meals and hydration."
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="notes" className="mb-2 block text-sm font-medium text-slate-200">
                  Coach notes
                </label>
                <textarea
                  id="notes"
                  rows="3"
                  name="notes"
                  value={form.notes}
                  onChange={updateTopLevel}
                  className="input-shell"
                  placeholder="Meal timing, substitutions, adherence notes..."
                />
              </div>
            </section>

            <section className="space-y-6">
              {form.meals.map((meal, mealIndex) => (
                <article key={`${meal.name}-${mealIndex}`} className="glass-panel p-6 sm:p-8">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_12rem]">
                      <input
                        value={meal.name}
                        onChange={(event) => updateMeal(mealIndex, 'name', event.target.value)}
                        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 font-display text-2xl font-semibold text-white outline-none focus:border-coral"
                        placeholder="Breakfast"
                      />
                      <input
                        type="time"
                        value={meal.targetTime}
                        onChange={(event) => updateMeal(mealIndex, 'targetTime', event.target.value)}
                        className="input-shell"
                      />
                    </div>
                    {form.meals.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeMeal(mealIndex)}
                        className="text-sm text-coral transition hover:text-[#ff8979]"
                      >
                        Remove meal
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-6 space-y-4">
                    {meal.foods.map((food, foodIndex) => (
                      <div key={`${mealIndex}-${foodIndex}`} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-display text-lg font-semibold text-white">Food {foodIndex + 1}</p>
                          {meal.foods.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => removeFood(mealIndex, foodIndex)}
                              className="text-sm text-coral transition hover:text-[#ff8979]"
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-200">Food name</label>
                            <input
                              value={food.name}
                              onChange={(event) => updateFood(mealIndex, foodIndex, 'name', event.target.value)}
                              className="input-shell"
                              placeholder="Chicken breast"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-200">Weight (g)</label>
                            <input
                              type="number"
                              min="0"
                              value={food.weightGrams}
                              onChange={(event) => updateFood(mealIndex, foodIndex, 'weightGrams', event.target.value)}
                              className="input-shell"
                              placeholder="200"
                            />
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          {[
                            ['calories', 'Calories', '320'],
                            ['protein', 'Protein (g)', '45'],
                            ['carbs', 'Carbs (g)', '0'],
                            ['fat', 'Fat (g)', '7'],
                          ].map(([field, label, placeholder]) => (
                            <div key={field}>
                              <label className="mb-2 block text-sm font-medium text-slate-200">{label}</label>
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={food[field]}
                                onChange={(event) => updateFood(mealIndex, foodIndex, field, event.target.value)}
                                className="input-shell"
                                placeholder={placeholder}
                              />
                            </div>
                          ))}
                        </div>

                        <textarea
                          rows="2"
                          value={food.notes}
                          onChange={(event) => updateFood(mealIndex, foodIndex, 'notes', event.target.value)}
                          className="input-shell mt-4"
                          placeholder="Substitutions, prep notes, or reminders..."
                        />
                      </div>
                    ))}
                  </div>

                  <button type="button" onClick={() => addFood(mealIndex)} className="secondary-button mt-5">
                    Add food
                  </button>
                </article>
              ))}

              <button type="button" onClick={addMeal} className="secondary-button">
                Add meal
              </button>
            </section>

            {submitStatus ? (
              <section className="rounded-3xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
                {submitStatus}
              </section>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={submitting}
                className="primary-button disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting
                  ? 'Saving meal plan...'
                  : planId
                    ? 'Save meal plan changes'
                    : 'Save and activate meal plan'}
              </button>
              <Link to={`/coach/clients/${clientId}`} className="secondary-button">
                Cancel
              </Link>
            </div>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <section className="glass-panel p-6 sm:p-8">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Live totals</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-300">Calories</p>
                  <p className="mt-2 font-display text-2xl font-bold text-white">{totals.calories}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-300">Protein</p>
                  <p className="mt-2 font-display text-2xl font-bold text-white">{totals.protein} g</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-300">Carbs</p>
                  <p className="mt-2 font-display text-2xl font-bold text-white">{totals.carbs} g</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-300">Fat</p>
                  <p className="mt-2 font-display text-2xl font-bold text-white">{totals.fat} g</p>
                </div>
              </div>
            </section>

            <section className="glass-panel p-6 sm:p-8">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Target comparison</p>
              <div className="mt-5 space-y-4 text-sm leading-6 text-slate-200">
                <p>
                  <span className="text-slate-400">Client target calories:</span>{' '}
                  {client?.targetCalories ? `${client.targetCalories}` : 'Not set'}
                </p>
                <p>
                  <span className="text-slate-400">Client target protein:</span>{' '}
                  {client?.targetProtein ? `${client.targetProtein} g` : 'Not set'}
                </p>
                <p>
                  <span className="text-slate-400">Plan meals:</span> {form.meals.length}
                </p>
              </div>
            </section>
          </aside>
        </form>
      ) : null}
    </div>
  );
}
