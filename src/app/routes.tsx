import type { ComponentType } from 'react';
import { createBrowserRouter, Navigate, useParams } from 'react-router';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';

const lazyPage = (loader: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await loader()).default,
});

function InvitationTokenRedirect() {
  const { token } = useParams();
  return <Navigate to={`/invitation?token=${encodeURIComponent(token ?? '')}`} replace />;
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', Component: LoginPage },
  { path: '/invitation', lazy: lazyPage(() => import('./pages/InvitationOnboardingPage')) },
  { path: '/employee/invitations/:token', Component: InvitationTokenRedirect },
  { path: '/auth/otp', lazy: lazyPage(() => import('./pages/OTPPage')) },
  { path: '/auth/authenticator', lazy: lazyPage(() => import('./pages/AuthenticatorPage')) },
  { path: '/auth/device-binding', lazy: lazyPage(() => import('./pages/DeviceBindingPage')) },
  { path: '/auth/role-select', lazy: lazyPage(() => import('./pages/RoleSelectionPage')) },
  {
    path: '/dashboard',
    Component: ProtectedRoute,
    children: [
      {
        lazy: lazyPage(() => import('./components/Layout')),
        children: [
          { index: true, lazy: lazyPage(() => import('./pages/DashboardPage')) },
          { path: 'schedule', lazy: lazyPage(() => import('./pages/SchedulePage')) },
          { path: 'tasks', element: <Navigate to="/dashboard" replace /> },
          { path: 'field-visit', element: <Navigate to="/dashboard" replace /> },
          { path: 'payroll', element: <Navigate to="/dashboard" replace /> },
          { path: 'notifications', lazy: lazyPage(() => import('./pages/NotificationsPage')) },
          { path: 'profile', lazy: lazyPage(() => import('./pages/ProfilePage')) },
          { path: 'documents', lazy: lazyPage(() => import('./pages/DocumentsPage')) },
          { path: 'requests', lazy: lazyPage(() => import('./pages/RequestsPage')) },
          { path: 'requests/history', lazy: lazyPage(() => import('./pages/RequestHistoryPage')) },
          { path: 'requests/form/:type', lazy: lazyPage(() => import('./pages/RequestFormPage')) },
          { path: 'requests/:id', lazy: lazyPage(() => import('./pages/RequestDetailPage')) },
        ],
      },
    ],
  },
]);
