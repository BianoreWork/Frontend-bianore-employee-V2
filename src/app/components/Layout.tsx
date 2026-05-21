import { Outlet, NavLink, useNavigate, useLocation } from 'react-router';
import {
  Home, Calendar, FileText,
  Sun, Sunrise, Sunset, Moon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const bottomNav = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/dashboard/schedule', label: 'Schedule', icon: Calendar },
  { to: '/dashboard/requests', label: 'Requests', icon: FileText },
];

const pageTitles: Record<string, string> = {
  '/dashboard/schedule': 'Work Schedule',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/profile': 'My Profile',
  '/dashboard/documents': 'Documents',
  '/dashboard/requests': 'Requests',
  '/dashboard/requests/history': 'Request History',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { text: 'Good Morning', Icon: Sunrise, iconColor: 'text-amber-400' };
  if (h < 17) return { text: 'Good Afternoon', Icon: Sun, iconColor: 'text-amber-500' };
  if (h < 21) return { text: 'Good Evening', Icon: Sunset, iconColor: 'text-orange-400' };
  return { text: 'Good Night', Icon: Moon, iconColor: 'text-indigo-400' };
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const employee = user?.employee;
  const fullName = employee?.full_name ?? '';
  const initials = (fullName || user?.email || 'U')
    .split(' ').filter(Boolean).slice(0, 2)
    .map((w: string) => w[0]).join('').toUpperCase();
  const subtitle = [fullName, employee?.department?.name].filter(Boolean).join(' · ');

  const greeting = getGreeting();
  const isDashboard = location.pathname === '/dashboard';

  let pageTitle = pageTitles[location.pathname] ?? 'Bianore';
  if (location.pathname.startsWith('/dashboard/requests/form/')) pageTitle = 'New Request';
  else if (/^\/dashboard\/requests\/\d+$/.test(location.pathname)) pageTitle = 'Request Detail';

  return (
    <div className="flex flex-col bg-slate-50 overflow-hidden" style={{ height: '100dvh', maxWidth: '430px', margin: '0 auto', position: 'relative' }}>
      {/* Top Header */}
      <header className="bg-white border-b border-slate-100 px-4 flex items-center justify-between flex-shrink-0" style={{ height: '56px' }}>
        <div>
          <p className="text-slate-800 font-bold flex items-center gap-1.5" style={{ fontSize: '15px' }}>
            {isDashboard && <greeting.Icon size={15} className={greeting.iconColor} />}
            {isDashboard ? greeting.text : pageTitle}
          </p>
          {isDashboard && (
            <p className="text-slate-400" style={{ fontSize: '11px' }}>
              {subtitle || user?.email || 'Welcome back'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard/profile')}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center"
          >
            <span className="text-white font-semibold" style={{ fontSize: '13px' }}>{initials}</span>
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-slate-100 flex-shrink-0 safe-area-pb" style={{ height: '64px' }}>
        <div className="flex items-center justify-around h-full px-2">
          {bottomNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  isActive ? 'text-blue-600' : 'text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-blue-50' : ''}`}>
                    <item.icon size={19} />
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
