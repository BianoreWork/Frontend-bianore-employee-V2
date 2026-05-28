import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router';
import {
  Home, Calendar, FileText, MapPin, CheckSquare,
  Sun, Sunrise, Sunset, Moon, Bell,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  NOTIFICATION_RECEIVED_EVENT,
  NOTIFICATIONS_UNREAD_COUNT_CHANGED_EVENT,
} from '../../lib/notificationEvents';
import { notificationsService } from '../../services/notificationsService';
import {
  subscribeToNotifications,
  unsubscribeFromNotifications,
} from '../../services/notificationsRealtimeService';
import type { ApiNotification } from '../../types/api';

const bottomNav = [
  { to: '/dashboard',            label: 'Home',     icon: Home         },
  { to: '/dashboard/tasks',      label: 'Tugas',    icon: CheckSquare  },
  { to: '/dashboard/schedule',   label: 'Jadwal',   icon: Calendar     },
  { to: '/dashboard/requests',   label: 'Request',  icon: FileText     },
  { to: '/dashboard/field-visit',label: 'Lapangan', icon: MapPin       },
];

const pageTitles: Record<string, string> = {
  '/dashboard/schedule':    'Jadwal Kerja',
  '/dashboard/tasks':       'Tugas Harian',
  '/dashboard/field-visit': 'Field Activity',
  '/dashboard/payroll':     'Gaji & Payslip',
  '/dashboard/notifications':'Notifikasi',
  '/dashboard/profile':     'Profil Saya',
  '/dashboard/documents':   'Dokumen',
  '/dashboard/requests':    'Pengajuan',
  '/dashboard/requests/history': 'Riwayat Pengajuan',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { text: 'Selamat Pagi', Icon: Sunrise, iconColor: 'text-amber-400' };
  if (h < 17) return { text: 'Selamat Siang', Icon: Sun, iconColor: 'text-amber-500' };
  if (h < 21) return { text: 'Selamat Sore', Icon: Sunset, iconColor: 'text-orange-400' };
  return { text: 'Selamat Malam', Icon: Moon, iconColor: 'text-indigo-400' };
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const employee = user?.employee;
  const fullName = employee?.full_name ?? '';
  const initials = (fullName || user?.email || 'U')
    .split(' ').filter(Boolean).slice(0, 2)
    .map((w: string) => w[0]).join('').toUpperCase();
  const subtitle = [fullName, employee?.department?.name].filter(Boolean).join(' · ');

  const greeting = getGreeting();
  const isDashboard = location.pathname === '/dashboard';

  let pageTitle = pageTitles[location.pathname] ?? 'Bianore';
  if (location.pathname.startsWith('/dashboard/requests/form/')) pageTitle = 'Buat Pengajuan';
  else if (/^\/dashboard\/requests\/\d+$/.test(location.pathname)) pageTitle = 'Detail Pengajuan';

  useEffect(() => {
    if (!user?.id) {
      setUnreadNotifications(0);
      return;
    }

    let active = true;
    notificationsService
      .getNotifications({ perPage: 1 })
      .then(res => {
        if (active) setUnreadNotifications(res.meta.unread_count);
      })
      .catch(() => {
        if (active) setUnreadNotifications(0);
      });

    const channel = subscribeToNotifications(user.id);
    const handleNotification = (event: Event) => {
      const notification = (event as CustomEvent<ApiNotification>).detail;
      if (!notification.read_at) setUnreadNotifications(count => count + 1);
    };
    const handleUnreadCountChanged = (event: Event) => {
      setUnreadNotifications((event as CustomEvent<number>).detail);
    };

    window.addEventListener(NOTIFICATION_RECEIVED_EVENT, handleNotification);
    window.addEventListener(NOTIFICATIONS_UNREAD_COUNT_CHANGED_EVENT, handleUnreadCountChanged);

    return () => {
      active = false;
      window.removeEventListener(NOTIFICATION_RECEIVED_EVENT, handleNotification);
      window.removeEventListener(NOTIFICATIONS_UNREAD_COUNT_CHANGED_EVENT, handleUnreadCountChanged);
      unsubscribeFromNotifications(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (location.pathname !== '/dashboard/notifications') return;
    notificationsService
      .getNotifications({ perPage: 1 })
      .then(res => setUnreadNotifications(res.meta.unread_count))
      .catch(() => {});
  }, [location.pathname]);

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
              {subtitle || user?.email || 'Selamat datang kembali'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard/notifications')}
            className="relative w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600"
            aria-label="Notifikasi"
          >
            <Bell size={18} />
            {unreadNotifications > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white flex items-center justify-center border border-white"
                style={{ fontSize: '10px', lineHeight: '16px' }}
              >
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>
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

      {/* Bottom Navigation — 5 items */}
      <nav className="bg-white border-t border-slate-100 flex-shrink-0" style={{ height: '60px', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around h-full">
          {bottomNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
                  isActive ? 'text-blue-600' : 'text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-blue-50' : ''}`}>
                    <item.icon size={17} />
                  </div>
                  <span style={{ fontSize: '9px', fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
