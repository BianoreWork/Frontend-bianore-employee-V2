import { Outlet, NavLink, useNavigate, useLocation } from 'react-router';
import { Home, Calendar, CheckSquare, DollarSign, User, Bell, MapPin, ChevronRight, X, FileText } from 'lucide-react';
import { useState } from 'react';

const bottomNav = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/dashboard/schedule', label: 'Schedule', icon: Calendar },
  { to: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/dashboard/requests', label: 'Requests', icon: FileText },
  { to: '/dashboard/payroll', label: 'Payroll', icon: DollarSign },
];

const pageTitles: Record<string, string> = {
  '/dashboard': 'Good Morning 👋',
  '/dashboard/schedule': 'Work Schedule',
  '/dashboard/tasks': 'My Tasks',
  '/dashboard/tasks/field-visit': 'Field Visit',
  '/dashboard/field-visit': 'Field Visit',
  '/dashboard/payroll': 'Payslip',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/profile': 'My Profile',
  '/dashboard/requests': 'Requests',
  '/dashboard/requests/history': 'Request History',
};

const moreItems = [
  { to: '/dashboard/field-visit', label: 'Field Visit', icon: MapPin, desc: 'Record customer visits' },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell, desc: 'Alerts & updates' },
  { to: '/dashboard/profile', label: 'Profile', icon: User, desc: 'Account & settings' },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  let pageTitle = pageTitles[location.pathname] || 'Bianore';
  if (location.pathname.startsWith('/dashboard/requests/form/')) pageTitle = 'New Request';
  else if (/^\/dashboard\/requests\/REQ-/.test(location.pathname)) pageTitle = 'Request Detail';
  const notifCount = 3;

  return (
    <div className="flex flex-col bg-slate-50 overflow-hidden" style={{ height: '100dvh', maxWidth: '430px', margin: '0 auto', position: 'relative' }}>
      {/* Top Header */}
      <header className="bg-white border-b border-slate-100 px-4 flex items-center justify-between flex-shrink-0" style={{ height: '56px' }}>
        <div>
          <p className="text-slate-800 font-bold" style={{ fontSize: '15px' }}>{pageTitle}</p>
          {location.pathname === '/dashboard' && (
            <p className="text-slate-400" style={{ fontSize: '11px' }}>Ahmad Jaya · Sales Dept</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard/notifications')}
            className="relative w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center"
          >
            <Bell size={17} className="text-slate-600" />
            {notifCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            )}
          </button>
          <button
            onClick={() => navigate('/dashboard/profile')}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center"
          >
            <span className="text-white font-semibold" style={{ fontSize: '13px' }}>AJ</span>
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

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
              ['/dashboard/field-visit', '/dashboard/notifications', '/dashboard/profile'].includes(location.pathname)
                ? 'text-blue-600'
                : 'text-slate-400'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              ['/dashboard/field-visit', '/dashboard/notifications', '/dashboard/profile'].includes(location.pathname) ? 'bg-blue-50' : ''
            }`}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
              </svg>
            </div>
            <span style={{ fontSize: '10px', fontWeight: ['/dashboard/field-visit', '/dashboard/notifications', '/dashboard/profile'].includes(location.pathname) ? 600 : 400 }}>More</span>
          </button>
        </div>
      </nav>

      {/* More Drawer */}
      {moreOpen && (
        <>
          <div className="absolute inset-0 bg-black/40 z-40" onClick={() => setMoreOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-800 font-semibold" style={{ fontSize: '15px' }}>More</p>
              <button onClick={() => setMoreOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <div className="space-y-2">
              {moreItems.map(item => (
                <button
                  key={item.to}
                  onClick={() => { navigate(item.to); setMoreOpen(false); }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <item.icon size={20} className="text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-slate-800 font-semibold" style={{ fontSize: '14px' }}>{item.label}</p>
                    <p className="text-slate-400" style={{ fontSize: '12px' }}>{item.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
