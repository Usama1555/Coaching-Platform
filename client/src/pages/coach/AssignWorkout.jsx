import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DateInput from '../../components/DateInput';
import { getCoachClientDetail } from '../../api/coaches';
import { createWorkoutPlan } from '../../api/workouts';

function createExercise() {
  return {
    name: '',
    muscleGroup: '',
    targetSets: 2,
    targetRepsMin: 5,
    targetRepsMax: 8,
    targetWeight: 0,
    notes: '',
  };
}

function createDay(dayNumber, label = `Day ${dayNumber}`, isRest = true) {
  return {
    dayNumber,
    label,
    isRest,
    exercises: [],
    cardio: {
      type: '',
      durationMins: 0,
      speed: 0,
      incline: 0,
    },
  };
}

function buildTemplate(splitType) {
  const templates = {
    ULRULRR: [
      createDay(1, 'Upper A', false),
      createDay(2, 'Lower A', false),
      createDay(3, 'Recovery', true),
      createDay(4, 'Upper B', false),
      createDay(5, 'Lower B', false),
      createDay(6, 'Recovery', true),
      createDay(7, 'Recovery', true),
    ],
    PPlRUL: [
      createDay(1, 'Push', false),
      createDay(2, 'Pull', false),
      createDay(3, 'Legs', false),
      createDay(4, 'Recovery', true),
      createDay(5, 'Upper', false),
      createDay(6, 'Lower', false),
      createDay(7, 'Recovery', true),
    ],
  };

  return templates[splitType] || Array.from({ length: 7 }, (_, index) => createDay(index + 1));
}

function formatDateForInput(value) {
  const date = value ? new Date(value) : new Date();
  return date.toISOString().slice(0, 10);
}

function normalizeNumber(value) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function AssignWorkout() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const [client, setClient] = useState(null);
  const [loadingClient, setLoadingClient] = useState(true);
  const [error, setError] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    splitType: 'ULRULRR',
    weekStartDate: formatDateForInput(),
    days: buildTemplate('ULRULRR'),
  });

  useEffect(() => {
    let mounted = true;

    async function loadClient() {
      try {
        const data = await getCoachClientDetail(clientId);

        if (mounted) {
          setClient(data.client);
          setForm((current) => ({
            ...current,
            name: current.name || `${data.client.user?.name || 'Client'} - Week Plan`,
          }));
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
  }, [clientId]);

  function updateTopLevel(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSplitTypeChange(event) {
    const { value } = event.target;
    setForm((current) => ({
      ...current,
      splitType: value,
      days: buildTemplate(value),
    }));
  }

  function updateDay(dayIndex, field, value) {
    setForm((current) => ({
      ...current,
      days: current.days.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              [field]: value,
            }
          : day
      ),
    }));
  }

  function updateCardio(dayIndex, field, value) {
    setForm((current) => ({
      ...current,
      days: current.days.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              cardio: {
                ...day.cardio,
                [field]: value,
              },
            }
          : day
      ),
    }));
  }

  function addExercise(dayIndex) {
    setForm((current) => ({
      ...current,
      days: current.days.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              isRest: false,
              exercises: [...day.exercises, createExercise()],
            }
          : day
      ),
    }));
  }

  function removeExercise(dayIndex, exerciseIndex) {
    setForm((current) => ({
      ...current,
      days: current.days.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              exercises: day.exercises.filter((_, idx) => idx !== exerciseIndex),
            }
          : day
      ),
    }));
  }

  function updateExercise(dayIndex, exerciseIndex, field, value) {
    setForm((current) => ({
      ...current,
      days: current.days.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              exercises: day.exercises.map((exercise, idx) =>
                idx === exerciseIndex
                  ? {
                      ...exercise,
                      [field]: value,
                    }
                  : exercise
              ),
            }
          : day
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
        splitType: form.splitType,
        weekStartDate: form.weekStartDate,
        isActive: true,
        days: form.days.map((day) => ({
          dayNumber: day.dayNumber,
          label: day.label,
          isRest: day.isRest,
          exercises: day.isRest
            ? []
            : day.exercises
                .filter((exercise) => exercise.name.trim())
                .map((exercise) => ({
                  ...exercise,
                  targetSets: normalizeNumber(exercise.targetSets),
                  targetRepsMin: normalizeNumber(exercise.targetRepsMin),
                  targetRepsMax: normalizeNumber(exercise.targetRepsMax),
                  targetWeight: normalizeNumber(exercise.targetWeight),
                })),
          cardio: {
            type: day.cardio.type,
            durationMins: normalizeNumber(day.cardio.durationMins),
            speed: normalizeNumber(day.cardio.speed),
            incline: normalizeNumber(day.cardio.incline),
          },
        })),
      };

      await createWorkoutPlan(payload);
      navigate(`/coach/clients/${clientId}`, { replace: true });
    } catch (requestError) {
      setSubmitStatus(
        requestError.response?.data?.message || 'Unable to create workout plan right now.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-hero p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.35em] text-tide">Assign Workout</p>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {loadingClient ? 'Loading client...' : `Plan build for ${client?.user?.name || 'client'}`}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-200">
              Build a weekly structure, add exercise targets, and activate the plan in one save. The newest active plan will replace the previous active plan automatically.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/coach/clients" className="secondary-button w-full sm:w-auto">
              Client roster
            </Link>
            <Link to={`/coach/clients/${clientId}`} className="secondary-button w-full sm:w-auto">
              Client detail
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
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="glass-panel p-6 sm:p-8">
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-200">
                  Plan name
                </label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={updateTopLevel}
                  className="input-shell"
                  placeholder="Week 3 - Upper/Lower"
                  required
                />
              </div>

              <div>
                <label htmlFor="splitType" className="mb-2 block text-sm font-medium text-slate-200">
                  Split type
                </label>
                <select
                  id="splitType"
                  name="splitType"
                  value={form.splitType}
                  onChange={handleSplitTypeChange}
                  className="input-shell"
                >
                  <option value="ULRULRR">ULRULRR</option>
                  <option value="PPlRUL">PPlRUL</option>
                  <option value="custom">Custom</option>
                </select>
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
          </section>

          <section className="space-y-6">
            {form.days.map((day, dayIndex) => (
              <article key={day.dayNumber} className="glass-panel p-6 sm:p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Day {day.dayNumber}</p>
                    <input
                      value={day.label}
                      onChange={(event) => updateDay(dayIndex, 'label', event.target.value)}
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 font-display text-2xl font-semibold text-white outline-none focus:border-coral"
                    />
                  </div>

                  <label className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={day.isRest}
                      onChange={(event) => updateDay(dayIndex, 'isRest', event.target.checked)}
                    />
                    Rest day
                  </label>
                </div>

                {!day.isRest ? (
                  <>
                    <div className="mt-6 space-y-4">
                      {day.exercises.length ? (
                        day.exercises.map((exercise, exerciseIndex) => (
                          <div key={`${day.dayNumber}-${exerciseIndex}`} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <p className="font-display text-lg font-semibold text-white">
                                Exercise {exerciseIndex + 1}
                              </p>
                              <button
                                type="button"
                                onClick={() => removeExercise(dayIndex, exerciseIndex)}
                                className="text-sm text-coral transition hover:text-[#ff8979]"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                              <div>
                                <label
                                  htmlFor={`exercise-name-${day.dayNumber}-${exerciseIndex}`}
                                  className="mb-2 block text-sm font-medium text-slate-200"
                                >
                                  Exercise name
                                </label>
                                <input
                                  id={`exercise-name-${day.dayNumber}-${exerciseIndex}`}
                                  value={exercise.name}
                                  onChange={(event) =>
                                    updateExercise(dayIndex, exerciseIndex, 'name', event.target.value)
                                  }
                                  className="input-shell"
                                  placeholder="Incline dumbbell press"
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor={`exercise-muscle-${day.dayNumber}-${exerciseIndex}`}
                                  className="mb-2 block text-sm font-medium text-slate-200"
                                >
                                  Muscle group
                                </label>
                                <input
                                  id={`exercise-muscle-${day.dayNumber}-${exerciseIndex}`}
                                  value={exercise.muscleGroup}
                                  onChange={(event) =>
                                    updateExercise(dayIndex, exerciseIndex, 'muscleGroup', event.target.value)
                                  }
                                  className="input-shell"
                                  placeholder="Chest"
                                />
                              </div>
                            </div>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                              <div>
                                <label
                                  htmlFor={`exercise-sets-${day.dayNumber}-${exerciseIndex}`}
                                  className="mb-2 block text-sm font-medium text-slate-200"
                                >
                                  Target sets
                                </label>
                                <input
                                  id={`exercise-sets-${day.dayNumber}-${exerciseIndex}`}
                                  type="number"
                                  min="1"
                                  value={exercise.targetSets}
                                  onChange={(event) =>
                                    updateExercise(dayIndex, exerciseIndex, 'targetSets', event.target.value)
                                  }
                                  className="input-shell"
                                  placeholder="2"
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor={`exercise-reps-min-${day.dayNumber}-${exerciseIndex}`}
                                  className="mb-2 block text-sm font-medium text-slate-200"
                                >
                                  Min reps
                                </label>
                                <input
                                  id={`exercise-reps-min-${day.dayNumber}-${exerciseIndex}`}
                                  type="number"
                                  min="1"
                                  value={exercise.targetRepsMin}
                                  onChange={(event) =>
                                    updateExercise(dayIndex, exerciseIndex, 'targetRepsMin', event.target.value)
                                  }
                                  className="input-shell"
                                  placeholder="5"
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor={`exercise-reps-max-${day.dayNumber}-${exerciseIndex}`}
                                  className="mb-2 block text-sm font-medium text-slate-200"
                                >
                                  Max reps
                                </label>
                                <input
                                  id={`exercise-reps-max-${day.dayNumber}-${exerciseIndex}`}
                                  type="number"
                                  min="1"
                                  value={exercise.targetRepsMax}
                                  onChange={(event) =>
                                    updateExercise(dayIndex, exerciseIndex, 'targetRepsMax', event.target.value)
                                  }
                                  className="input-shell"
                                  placeholder="8"
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor={`exercise-weight-${day.dayNumber}-${exerciseIndex}`}
                                  className="mb-2 block text-sm font-medium text-slate-200"
                                >
                                  Starting weight (kg)
                                </label>
                                <input
                                  id={`exercise-weight-${day.dayNumber}-${exerciseIndex}`}
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={exercise.targetWeight}
                                  onChange={(event) =>
                                    updateExercise(dayIndex, exerciseIndex, 'targetWeight', event.target.value)
                                  }
                                  className="input-shell"
                                  placeholder="0"
                                />
                              </div>
                            </div>

                            <textarea
                              rows="2"
                              value={exercise.notes}
                              onChange={(event) =>
                                updateExercise(dayIndex, exerciseIndex, 'notes', event.target.value)
                              }
                              className="input-shell mt-4"
                              placeholder="Execution notes, tempo, setup reminders..."
                            />
                          </div>
                        ))
                      ) : (
                        <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-300">
                          No exercises added yet for this day.
                        </div>
                      )}
                    </div>

                    <button type="button" onClick={() => addExercise(dayIndex)} className="secondary-button mt-5">
                      Add exercise
                    </button>

                    <div className="mt-6">
                      <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Cardio Protocol</p>
                      <div className="mt-4 grid gap-4 lg:grid-cols-4">
                        <div>
                          <label
                            htmlFor={`cardio-type-${day.dayNumber}`}
                            className="mb-2 block text-sm font-medium text-slate-200"
                          >
                            Cardio type
                          </label>
                          <input
                            id={`cardio-type-${day.dayNumber}`}
                            value={day.cardio.type}
                            onChange={(event) => updateCardio(dayIndex, 'type', event.target.value)}
                            className="input-shell"
                            placeholder="Incline treadmill"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`cardio-duration-${day.dayNumber}`}
                            className="mb-2 block text-sm font-medium text-slate-200"
                          >
                            Duration (mins)
                          </label>
                          <input
                            id={`cardio-duration-${day.dayNumber}`}
                            type="number"
                            min="0"
                            value={day.cardio.durationMins}
                            onChange={(event) => updateCardio(dayIndex, 'durationMins', event.target.value)}
                            className="input-shell"
                            placeholder="20"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`cardio-speed-${day.dayNumber}`}
                            className="mb-2 block text-sm font-medium text-slate-200"
                          >
                            Speed
                          </label>
                          <input
                            id={`cardio-speed-${day.dayNumber}`}
                            type="number"
                            min="0"
                            step="0.1"
                            value={day.cardio.speed}
                            onChange={(event) => updateCardio(dayIndex, 'speed', event.target.value)}
                            className="input-shell"
                            placeholder="3.5"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`cardio-incline-${day.dayNumber}`}
                            className="mb-2 block text-sm font-medium text-slate-200"
                          >
                            Incline
                          </label>
                          <input
                            id={`cardio-incline-${day.dayNumber}`}
                            type="number"
                            min="0"
                            step="0.1"
                            value={day.cardio.incline}
                            onChange={(event) => updateCardio(dayIndex, 'incline', event.target.value)}
                            className="input-shell"
                            placeholder="12"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mt-6 rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-slate-300">
                    This day will save as a rest or recovery day.
                  </div>
                )}
              </article>
            ))}
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
              className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              {submitting ? 'Saving plan...' : 'Save and activate workout plan'}
            </button>
            <Link to={`/coach/clients/${clientId}`} className="secondary-button w-full sm:w-auto">
              Cancel
            </Link>
          </div>
        </form>
      ) : null}
    </div>
  );
}
