import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthSplitLayout from '../../components/AuthSplitLayout';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardRoute } from '../../utils/getDashboardRoute';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardRoute(user)} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await login(formData);
      const fallbackRoute = getDashboardRoute(response.user);
      const nextRoute = location.state?.from?.pathname || fallbackRoute;
      navigate(nextRoute, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to log in right now.');
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
      eyebrow="Coach & Client Login"
      title="Walk back into the plan with one clean login."
      subtitle="Coaches can request access publicly, while clients log in with the accounts created or invited by their coach."
      aside={[
        { label: 'Coach Access', value: 'Reviewed before approval' },
        { label: 'Client Accounts', value: 'Assigned per coach' },
        { label: 'Progress', value: 'See trends clearly' },
      ]}
    >
      <div className="mx-auto w-full max-w-md">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Welcome back</p>
        <h2 className="mt-3 font-display text-3xl font-bold text-white">Log in to your dashboard</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Sign in with the account you created through the coaching platform.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
              placeholder="coach@example.com"
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
              placeholder="Enter your password"
              required
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
          ) : null}

          <button type="submit" disabled={submitting} className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-70">
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-300">
          Need a coach account?{' '}
          <Link to="/register" className="font-semibold text-coral transition hover:text-[#ff8979]">
            Request access here
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
