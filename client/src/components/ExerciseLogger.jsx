import { useEffect, useState } from 'react';

function buildExerciseState(exercises) {
  return exercises.map((exercise) => ({
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    targetSets: exercise.targetSets,
    targetRepsMin: exercise.targetRepsMin,
    targetRepsMax: exercise.targetRepsMax,
    targetWeight: exercise.targetWeight,
    notes: exercise.notes,
    sets: Array.from({ length: exercise.targetSets }, () => ({
      repsCompleted: '',
      weightUsed: exercise.targetWeight ?? 0,
      hitFailure: false,
    })),
  }));
}

export default function ExerciseLogger({ exercises, onSubmit, submitting }) {
  const [exerciseState, setExerciseState] = useState(() => buildExerciseState(exercises));
  const [sessionNotes, setSessionNotes] = useState('');
  const [cardioCompleted, setCardioCompleted] = useState(false);
  const [cardioDurationMins, setCardioDurationMins] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setExerciseState(buildExerciseState(exercises));
    setSessionNotes('');
    setCardioCompleted(false);
    setCardioDurationMins('');
    setError('');
  }, [exercises]);

  function updateSet(exerciseIndex, setIndex, field, value) {
    setExerciseState((current) =>
      current.map((exercise, currentExerciseIndex) =>
        currentExerciseIndex === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((set, currentSetIndex) =>
                currentSetIndex === setIndex
                  ? {
                      ...set,
                      [field]: value,
                    }
                  : set
              ),
            }
          : exercise
      )
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const sets = exerciseState.flatMap((exercise) =>
      exercise.sets
        .filter((set) => set.repsCompleted !== '')
        .map((set, index) => ({
          exerciseName: exercise.name,
          muscleGroup: exercise.muscleGroup,
          setNumber: index + 1,
          repsCompleted: Number(set.repsCompleted) || 0,
          weightUsed: Number(set.weightUsed) || 0,
          hitFailure: Boolean(set.hitFailure),
        }))
    );

    if (!sets.length) {
      setError('Log at least one set before submitting the session.');
      return;
    }

    setError('');

    await onSubmit({
      sets,
      sessionNotes,
      cardioCompleted,
      cardioDurationMins: Number(cardioDurationMins) || 0,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {exerciseState.map((exercise, exerciseIndex) => (
        <article key={exercise.name} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-display text-2xl font-bold text-white">{exercise.name}</p>
              <p className="mt-2 text-sm text-slate-300">{exercise.muscleGroup || 'Muscle group not set'}</p>
            </div>
            <div className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200 lg:w-auto">
              Target: {exercise.targetSets} sets of {exercise.targetRepsMin}-{exercise.targetRepsMax} reps at{' '}
              {exercise.targetWeight} kg
            </div>
          </div>

          {exercise.notes ? (
            <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-300">
              {exercise.notes}
            </p>
          ) : null}

          <div className="mt-5 space-y-4">
            {exercise.sets.map((set, setIndex) => (
              <div key={`${exercise.name}-${setIndex + 1}`} className="rounded-3xl border border-white/10 bg-slate-950/30 p-4">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[120px_1fr_1fr_auto] xl:items-end">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Set {setIndex + 1}</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">Reps completed</label>
                    <input
                      type="number"
                      min="0"
                      value={set.repsCompleted}
                      onChange={(event) => updateSet(exerciseIndex, setIndex, 'repsCompleted', event.target.value)}
                      className="input-shell"
                      placeholder="8"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">Weight used (kg)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={set.weightUsed}
                      onChange={(event) => updateSet(exerciseIndex, setIndex, 'weightUsed', event.target.value)}
                      className="input-shell"
                      placeholder="30"
                    />
                  </div>

                  <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 sm:justify-start">
                    <input
                      type="checkbox"
                      checked={set.hitFailure}
                      onChange={(event) => updateSet(exerciseIndex, setIndex, 'hitFailure', event.target.checked)}
                    />
                    Hit failure
                  </label>
                </div>
              </div>
            ))}
          </div>
        </article>
      ))}

      <section className="glass-panel p-6 sm:p-8">
        <div className="grid gap-4 lg:grid-cols-[auto_200px_1fr] lg:items-end">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={cardioCompleted}
              onChange={(event) => setCardioCompleted(event.target.checked)}
            />
            Cardio completed
          </label>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Cardio duration (mins)</label>
            <input
              type="number"
              min="0"
              value={cardioDurationMins}
              onChange={(event) => setCardioDurationMins(event.target.value)}
              className="input-shell"
              placeholder="20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Session notes</label>
            <textarea
              rows="3"
              value={sessionNotes}
              onChange={(event) => setSessionNotes(event.target.value)}
              className="input-shell"
              placeholder="Energy, performance, recovery notes..."
            />
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="primary-button mt-6 w-full disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          {submitting ? 'Submitting session...' : 'Submit session'}
        </button>
      </section>
    </form>
  );
}
