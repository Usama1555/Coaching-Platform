import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import { AI_ASSISTANT_ENABLED } from './config/features';
import { getDashboardRoute } from './utils/getDashboardRoute';

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Profile = lazy(() => import('./pages/account/Profile'));
const OwnerDashboard = lazy(() => import('./pages/owner/OwnerDashboard'));
const CoachApprovalStatus = lazy(() => import('./pages/coach/CoachApprovalStatus'));
const CoachDashboard = lazy(() => import('./pages/coach/CoachDashboard'));
const ClientList = lazy(() => import('./pages/coach/ClientList'));
const ClientRoster = lazy(() => import('./pages/coach/ClientRoster'));
const ClientDetail = lazy(() => import('./pages/coach/ClientDetail'));
const AssignWorkout = lazy(() => import('./pages/coach/AssignWorkout'));
const ClientDashboard = lazy(() => import('./pages/client/ClientDashboard'));
const TodayWorkout = lazy(() => import('./pages/client/TodayWorkout'));
const LogSession = lazy(() => import('./pages/client/LogSession'));
const MyProgress = lazy(() => import('./pages/client/MyProgress'));
const ClientCheckIn = lazy(() => import('./pages/client/ClientCheckIn'));
const AIAssistant = lazy(() => import('./pages/client/AIAssistant'));

function Landing() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardRoute(user)} replace />;
  }

  return <Navigate to="/login" replace />;
}

function AppLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl">{children}</main>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="glass-panel max-w-lg p-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">404</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-white">That page is not built yet.</h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          The current frontend covers auth and starter dashboards. We can add the next route as soon as you want.
        </p>
      </div>
    </div>
  );
}

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="glass-panel px-6 py-4 text-slate-100">Loading page...</div>
    </div>
  );
}

export default function App() {
  return (
    <AppLayout>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner"
            element={
              <ProtectedRoute requireOwner>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/pending"
            element={
              <ProtectedRoute allowedRole="coach" allowUnapprovedCoach>
                <CoachApprovalStatus />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach"
            element={
              <ProtectedRoute allowedRole="coach">
                <CoachDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/clients"
            element={
              <ProtectedRoute allowedRole="coach">
                <ClientList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/clients/roster"
            element={
              <ProtectedRoute allowedRole="coach">
                <ClientRoster />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/clients/:clientId"
            element={
              <ProtectedRoute allowedRole="coach">
                <ClientDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/clients/:clientId/assign"
            element={
              <ProtectedRoute allowedRole="coach">
                <AssignWorkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client"
            element={
              <ProtectedRoute allowedRole="client">
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/workout/today"
            element={
              <ProtectedRoute allowedRole="client">
                <TodayWorkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/workout/log"
            element={
              <ProtectedRoute allowedRole="client">
                <LogSession />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/progress"
            element={
              <ProtectedRoute allowedRole="client">
                <MyProgress />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/check-in"
            element={
              <ProtectedRoute allowedRole="client">
                <ClientCheckIn />
              </ProtectedRoute>
            }
          />
          {AI_ASSISTANT_ENABLED ? (
            <Route
              path="/client/ai"
              element={
                <ProtectedRoute allowedRole="client">
                  <AIAssistant />
                </ProtectedRoute>
              }
            />
          ) : null}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}
