import { useState } from 'react';
import { Link } from 'react-router-dom';
import { changePassword, updateCurrentUser } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardRoute } from '../../utils/getDashboardRoute';

const initialPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    const trimmedName = name.trim();

    if (!trimmedName) {
      setProfileError('Name is required.');
      return;
    }

    setSavingProfile(true);

    try {
      const response = await updateCurrentUser({ name: trimmedName });
      setUser(response.user);
      setName(response.user.name);
      setProfileSuccess(response.message);
    } catch (requestError) {
      setProfileError(requestError.response?.data?.message || 'Unable to update your profile right now.');
    } finally {
      setSavingProfile(false);
    }
  }

  function handlePasswordChange(event) {
    const { name: fieldName, value } = event.target;
    setPasswordForm((current) => ({
      ...current,
      [fieldName]: value,
    }));
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password must match.');
      return;
    }

    setSavingPassword(true);

    try {
      const response = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess(response.message);
      setPasswordForm(initialPasswordForm);
    } catch (requestError) {
      setPasswordError(requestError.response?.data?.message || 'Unable to change your password right now.');
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-hero p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.35em] text-tide">Profile</p>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Manage your account
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-200">
              Update your display name and password here. This page works for both coaches and clients.
            </p>
          </div>
          <Link to={getDashboardRoute(user)} className="secondary-button self-start">
            Back to dashboard
          </Link>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="glass-panel p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Account Snapshot</p>
          <div className="mt-5 space-y-4 text-sm leading-6 text-slate-200">
            {user.isOwner ? (
              <div className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-emerald-100">
                Owner account
              </div>
            ) : null}
            <p>
              <span className="text-slate-400">Role:</span> {user.role}
            </p>
            <p>
              <span className="text-slate-400">Email:</span> {user.email}
            </p>
            <p>
              <span className="text-slate-400">Current name:</span> {user.name}
            </p>
          </div>
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-300">
            Email stays fixed here. Name and password can be updated safely from this page whenever needed.
          </div>
          {user.role === 'coach' ? (
            <Link to="/coach/templates/workouts" className="secondary-button mt-4 w-full sm:w-auto">
              Workout templates
            </Link>
          ) : null}
        </article>

        <article className="glass-panel p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Update Name</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-white">Change display name</h2>

          <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-200">
                Name
              </label>
              <input
                id="name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="input-shell"
                placeholder="Your full name"
                required
              />
            </div>

            {profileError ? (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {profileError}
              </div>
            ) : null}

            {profileSuccess ? (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {profileSuccess}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={savingProfile}
              className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              {savingProfile ? 'Saving...' : 'Save name'}
            </button>
          </form>
        </article>
      </section>

      <section className="glass-panel p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Security</p>
        <h2 className="mt-3 font-display text-2xl font-bold text-white">Change password</h2>

        <form onSubmit={handlePasswordSubmit} className="mt-6 grid gap-4 lg:grid-cols-3">
          <div>
            <label htmlFor="currentPassword" className="mb-2 block text-sm font-medium text-slate-200">
              Current password
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              className="input-shell"
              placeholder="Enter current password"
              required
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-slate-200">
              New password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              className="input-shell"
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-200">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              className="input-shell"
              placeholder="Re-enter new password"
              required
            />
          </div>

          <div className="lg:col-span-3">
            {passwordError ? (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {passwordError}
              </div>
            ) : null}

            {passwordSuccess ? (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {passwordSuccess}
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-3">
            <button
              type="submit"
              disabled={savingPassword}
              className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              {savingPassword ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
