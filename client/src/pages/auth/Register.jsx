import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthSplitLayout from '../../components/AuthSplitLayout';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardRoute } from '../../utils/getDashboardRoute';

const initialFormData = {
  name: '',
  email: '',
  password: '',
};

export default function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardRoute(user)} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const response = await register({
        ...formData,
        role: 'coach',
      });
      setSuccess(response.message);
      navigate(getDashboardRoute(response.user), { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create your account right now.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  return (
    <AuthSplitLayout
      eyebrow="Coach Access Request"
      title="Apply for coach access to the platform."
      subtitle="Public signup is for coaches only. New coach accounts are held for owner approval before they can use the coach workspace."
      aside={[
        { label: 'Coach Review', value: 'Owner-approved access' },
        { label: 'Client Ownership', value: 'Clients stay linked correctly' },
        { label: 'Progress', value: 'Built for weekly review' },
      ]}
    >
      <div className="mx-auto w-full max-w-md">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Coach signup</p>
        <h2 className="mt-3 font-display text-3xl font-bold text-white">Request coach access</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Fill this out to create a coach account request. Once approved, you can access the coach dashboard and invite clients yourself.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-200">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="input-shell"
              placeholder="Usama Alvi"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="input-shell"
              placeholder="name@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="input-shell"
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{success}</div>
          ) : null}

          <button type="submit" disabled={submitting} className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-70">
            {submitting ? 'Sending request...' : 'Request coach access'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-300">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-coral transition hover:text-[#ff8979]">
            Log in
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
