import { createBrowserRouter, Navigate } from 'react-router';
import LoginPage from './pages/LoginPage';
import OTPPage from './pages/OTPPage';
import AuthenticatorPage from './pages/AuthenticatorPage';
import DeviceBindingPage from './pages/DeviceBindingPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import SchedulePage from './pages/SchedulePage';
import TasksPage from './pages/TasksPage';
import FieldVisitPage from './pages/FieldVisitPage';
import PayrollPage from './pages/PayrollPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import RequestsPage from './pages/RequestsPage';
import RequestFormPage from './pages/RequestFormPage';
import RequestDetailPage from './pages/RequestDetailPage';
import RequestHistoryPage from './pages/RequestHistoryPage';
import ProtectedRoute from './components/ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', Component: LoginPage },
  { path: '/auth/otp', Component: OTPPage },
  { path: '/auth/authenticator', Component: AuthenticatorPage },
  { path: '/auth/device-binding', Component: DeviceBindingPage },
  { path: '/auth/role-select', Component: RoleSelectionPage },
  {
    path: '/dashboard',
    Component: ProtectedRoute,
    children: [
      {
        Component: Layout,
        children: [
          { index: true, Component: DashboardPage },
          { path: 'schedule', Component: SchedulePage },
          { path: 'tasks', Component: TasksPage },
          { path: 'field-visit', Component: FieldVisitPage },
          { path: 'payroll', Component: PayrollPage },
          { path: 'notifications', Component: NotificationsPage },
          { path: 'profile', Component: ProfilePage },
          { path: 'requests', Component: RequestsPage },
          { path: 'requests/history', Component: RequestHistoryPage },
          { path: 'requests/form/:type', Component: RequestFormPage },
          { path: 'requests/:id', Component: RequestDetailPage },
        ],
      },
    ],
  },
]);
