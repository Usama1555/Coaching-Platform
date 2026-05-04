import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteWorkoutTemplate, getWorkoutTemplates } from '../../api/workoutTemplates';

function countExercises(days = []) {
  return days.reduce((total, day) => total + (day.exercises?.length || 0), 0);
}

function formatDate(value) {
  if (!value) {
    return 'Not set';
  }

  return new Date(value).toLocaleDateString();
}

export default function WorkoutTemplateLibrary() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingTemplateId, setDeletingTemplateId] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const response = await getWorkoutTemplates();
      setTemplates(response.templates || []);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load workout templates right now.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(template) {
    const confirmed = window.confirm(`Delete ${template.name}?`);

    if (!confirmed) {
      return;
    }

    try {
      setDeletingTemplateId(template._id);
      await deleteWorkoutTemplate(template._id);
      setTemplates((current) => current.filter((item) => item._id !== template._id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete that workout template.');
    } finally {
      setDeletingTemplateId('');
    }
  }

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-hero p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.35em] text-tide">Workout Templates</p>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Save reusable training structures.
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-200">
              Build templates once, keep them on the coach account, and reuse them when assigning future workout plans to clients.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/profile" className="secondary-button w-full sm:w-auto">
              Back to profile
            </Link>
            <Link to="/coach/templates/workouts/new" className="primary-button w-full sm:w-auto">
              Create template
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-3xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          {error}
        </section>
      ) : null}

      <section className="space-y-4">
        {loading ? (
          <div className="glass-panel p-6 text-sm text-slate-200">Loading workout templates...</div>
        ) : templates.length ? (
          templates.map((template) => (
            <article key={template._id} className="glass-panel p-6 sm:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="font-display text-2xl font-bold text-white">{template.name}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-slate-400">
                    <span className="rounded-full border border-white/10 bg-slate-950/35 px-3 py-2">
                      {template.days?.length || 0} days
                    </span>
                    <span className="rounded-full border border-white/10 bg-slate-950/35 px-3 py-2">
                      {countExercises(template.days)} exercises
                    </span>
                    <span className="rounded-full border border-white/10 bg-slate-950/35 px-3 py-2">
                      Updated {formatDate(template.updatedAt || template.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    to={`/coach/templates/workouts/${template._id}/edit`}
                    className="secondary-button w-full sm:w-auto"
                  >
                    Edit template
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(template)}
                    disabled={deletingTemplateId === template._id}
                    className="secondary-button w-full border-red-400/30 !text-red-100 hover:!bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {deletingTemplateId === template._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="glass-panel p-6 text-sm leading-6 text-slate-200">
            No workout templates saved yet. Create one here, then it will appear inside the workout plan `Split type` dropdown.
          </div>
        )}
      </section>
    </div>
  );
}
