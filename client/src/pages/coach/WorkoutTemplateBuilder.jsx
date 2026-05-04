import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  createWorkoutTemplate,
  getWorkoutTemplate,
  updateWorkoutTemplate,
} from '../../api/workoutTemplates';
import {
  buildWorkoutStructure,
  cloneWorkoutDays,
  createExercise,
  normalizeNumber,
} from '../../utils/workoutBuilder';

export default function WorkoutTemplateBuilder() {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const [loadingTemplate, setLoadingTemplate] = useState(Boolean(templateId));
  const [error, setError] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedStructureOption, setSelectedStructureOption] = useState('ULRULRR');
  const [form, setForm] = useState({
    name: '',
    days: buildWorkoutStructure('ULRULRR'),
  });

  useEffect(() => {
    let mounted = true;

    async function loadTemplate() {
      if (!templateId) {
        setLoadingTemplate(false);
        return;
      }

      try {
        const response = await getWorkoutTemplate(templateId);

        if (mounted) {
          setForm({
            name: response.template.name || '',
            days: cloneWorkoutDays(response.template.days),
          });
          setSelectedStructureOption('custom');
        }
      } catch (requestError) {
        if (mounted) {
          setError(requestError.response?.data?.message || 'Unable to load this workout template.');
        }
      } finally {
        if (mounted) {
          setLoadingTemplate(false);
        }
      }
    }

    loadTemplate();

    return () => {
      mounted = false;
    };
  }, [templateId]);

  function updateTopLevel(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleStructureChange(event) {
    const { value } = event.target;
    setSelectedStructureOption(value);
    setForm((current) => ({
      ...current,
      days: buildWorkoutStructure(value),
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
        name: form.name,
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

      if (templateId) {
        await updateWorkoutTemplate(templateId, payload);
      } else {
        await createWorkoutTemplate(payload);
      }

      navigate('/coach/templates/workouts', { replace: true });
    } catch (requestError) {
      setSubmitStatus(requestError.response?.data?.message || 'Unable to save workout template right now.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-hero p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.35em] text-tide">Workout Template Builder</p>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {loadingTemplate
                ? 'Loading template...'
                : templateId
                  ? 'Edit workout template'
                  : 'Create workout template'}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-200">
              Save a reusable exercise structure on the coach account, then pull it straight into future client workout plans from the split selector.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/coach/templates/workouts" className="secondary-button w-full sm:w-auto">
              Template library
            </Link>
            <Link to="/profile" className="secondary-button w-full sm:w-auto">
              Profile
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
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-200">
                  Template name
                </label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={updateTopLevel}
                  className="input-shell"
                  placeholder="Upper / Lower Template"
                  required
                />
              </div>

              <div>
                <label htmlFor="structureType" className="mb-2 block text-sm font-medium text-slate-200">
                  Starting structure
                </label>
                <select
                  id="structureType"
                  value={selectedStructureOption}
                  onChange={handleStructureChange}
                  className="input-shell"
                >
                  <option value="ULRULRR">ULRULRR</option>
                  <option value="PPlRUL">PPlRUL</option>
                  <option value="custom">Custom</option>
                </select>
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
                                <label className="mb-2 block text-sm font-medium text-slate-200">
                                  Exercise name
                                </label>
                                <input
                                  value={exercise.name}
                                  onChange={(event) =>
                                    updateExercise(dayIndex, exerciseIndex, 'name', event.target.value)
                                  }
                                  className="input-shell"
                                  placeholder="Incline dumbbell press"
                                />
                              </div>
                              <div>
                                <label className="mb-2 block text-sm font-medium text-slate-200">
                                  Muscle group
                                </label>
                                <input
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
                              {[
                                ['targetSets', 'Target sets', '2'],
                                ['targetRepsMin', 'Min reps', '5'],
                                ['targetRepsMax', 'Max reps', '8'],
                                ['targetWeight', 'Starting weight (kg)', '0'],
                              ].map(([field, label, placeholder]) => (
                                <div key={field}>
                                  <label className="mb-2 block text-sm font-medium text-slate-200">{label}</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step={field === 'targetWeight' ? '0.5' : '1'}
                                    value={exercise[field]}
                                    onChange={(event) =>
                                      updateExercise(dayIndex, exerciseIndex, field, event.target.value)
                                    }
                                    className="input-shell"
                                    placeholder={placeholder}
                                  />
                                </div>
                              ))}
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
                          <label className="mb-2 block text-sm font-medium text-slate-200">Cardio type</label>
                          <input
                            value={day.cardio.type}
                            onChange={(event) => updateCardio(dayIndex, 'type', event.target.value)}
                            className="input-shell"
                            placeholder="Incline treadmill"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-200">Duration (mins)</label>
                          <input
                            type="number"
                            min="0"
                            value={day.cardio.durationMins}
                            onChange={(event) => updateCardio(dayIndex, 'durationMins', event.target.value)}
                            className="input-shell"
                            placeholder="20"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-200">Speed</label>
                          <input
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
                          <label className="mb-2 block text-sm font-medium text-slate-200">Incline</label>
                          <input
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
              {submitting
                ? 'Saving template...'
                : templateId
                  ? 'Save template changes'
                  : 'Save workout template'}
            </button>
            <Link to="/coach/templates/workouts" className="secondary-button w-full sm:w-auto">
              Cancel
            </Link>
          </div>
        </form>
      ) : null}
    </div>
  );
}
