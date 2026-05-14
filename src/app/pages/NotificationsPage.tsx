import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Bell, Clock, AlertCircle, DollarSign, CheckSquare, Info, CheckCheck, RefreshCw } from 'lucide-react';
import { notificationsService } from '../../services/notificationsService';
import { NOTIFICATION_RECEIVED_EVENT } from '../../lib/notificationEvents';
import type { ApiNotification } from '../../types/api';

type NotifCategory = 'all' | 'attendance' | 'late' | 'update' | 'payroll' | 'task';

interface Notification {
  id: number;
  category: Exclude<NotifCategory, 'all'>;
  title: string;
  message: string;
  time: string;
  read: boolean;
  referenceType: string | null;
  referenceId: number | null;
}

const categoryConfig: Record<Exclude<NotifCategory, 'all'>, {
  label: string; icon: typeof Bell; color: string; bg: string;
}> = {
  attendance: { label: 'Attendance', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  late: { label: 'Late Alert', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
  update: { label: 'Update', icon: Info, color: 'text-slate-600', bg: 'bg-slate-100' },
  payroll: { label: 'Payroll', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  task: { label: 'Task', icon: CheckSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
};

function getCategory(type: string): Exclude<NotifCategory, 'all'> {
  if (type.includes('attendance') || type.includes('overtime')) return 'attendance';
  if (type.includes('payroll')) return 'payroll';
  if (type.includes('late')) return 'late';
  if (type.includes('request')) return 'task';
  return 'update';
}

function mapNotification(notification: ApiNotification): Notification {
  return {
    id: notification.id,
    category: getCategory(notification.type),
    title: notification.title,
    message: notification.message,
    time: formatDistanceToNow(parseISO(notification.created_at), { addSuffix: true }),
    read: Boolean(notification.read_at),
    referenceType: notification.reference_type,
    referenceId: notification.reference_id,
  };
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<NotifCategory>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.category === filter);
  const unreadCount = notifications.filter(n => !n.read).length;

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await notificationsService.getNotifications({ perPage: 50 });
      setNotifications(res.data.map(mapNotification));
    } catch {
      setError('Gagal memuat notification.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const handleNotification = (event: Event) => {
      const notification = (event as CustomEvent<ApiNotification>).detail;
      setNotifications(prev => [mapNotification(notification), ...prev]);
    };

    window.addEventListener(NOTIFICATION_RECEIVED_EVENT, handleNotification);

    return () => {
      window.removeEventListener(NOTIFICATION_RECEIVED_EVENT, handleNotification);
    };
  }, []);

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await notificationsService.markAllAsRead();
    } catch {
      loadNotifications();
    }
  };

  const openNotification = async (notif: Notification) => {
    if (!notif.read) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
      try {
        await notificationsService.markAsRead(notif.id);
      } catch {
        loadNotifications();
      }
    }

    if (notif.referenceType === 'time_request' && notif.referenceId) {
      navigate(`/dashboard/requests/${notif.referenceId}`);
    }
  };

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between px-4 pt-4 mb-3">
        <p className="text-slate-500" style={{ fontSize: '13px' }}>
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
        </p>
        {unreadCount > 0 ? (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-blue-600 font-medium" style={{ fontSize: '13px' }}>
            <CheckCheck size={15} /> Mark all read
          </button>
        ) : (
          <button onClick={loadNotifications} className="flex items-center gap-1.5 text-blue-600 font-medium" style={{ fontSize: '13px' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        )}
      </div>

      <div className="px-4 mb-4 flex gap-2 overflow-x-auto pb-1">
        {(['all', 'attendance', 'late', 'payroll', 'task', 'update'] as NotifCategory[]).map(cat => {
          const cfg = cat !== 'all' ? categoryConfig[cat] : null;
          const catUnread = cat === 'all'
            ? unreadCount
            : notifications.filter(n => n.category === cat && !n.read).length;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl whitespace-nowrap flex-shrink-0 transition-all ${
                filter === cat ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
              }`}
              style={{ fontSize: '12px', fontWeight: 500 }}
            >
              {cfg && <cfg.icon size={12} />}
              {cat === 'all' ? 'All' : cfg?.label}
              {catUnread > 0 && (
                <span className={`w-4 h-4 rounded-full flex items-center justify-center ${filter === cat ? 'bg-white/20' : 'bg-red-500 text-white'}`} style={{ fontSize: '10px' }}>
                  {catUnread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-4 space-y-2">
        {error ? (
          <div className="bg-red-50 rounded-3xl p-5 text-center border border-red-100">
            <AlertCircle size={26} className="text-red-500 mx-auto mb-2" />
            <p className="text-red-600" style={{ fontSize: '13px' }}>{error}</p>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
            <RefreshCw size={28} className="text-blue-500 mx-auto mb-2 animate-spin" />
            <p className="text-slate-400" style={{ fontSize: '13px' }}>Loading notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
            <Bell size={32} className="text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400" style={{ fontSize: '13px' }}>No notifications here</p>
          </div>
        ) : (
          filtered.map(notif => {
            const cfg = categoryConfig[notif.category];
            const IconComp = cfg.icon;
            return (
              <div
                key={notif.id}
                onClick={() => openNotification(notif)}
                className={`flex items-start gap-3 p-4 rounded-3xl border cursor-pointer transition-all ${
                  notif.read ? 'bg-white border-slate-100' : 'bg-blue-50/40 border-blue-100'
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <IconComp size={18} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-semibold ${notif.read ? 'text-slate-700' : 'text-slate-900'}`} style={{ fontSize: '13px' }}>
                      {notif.title}
                    </p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-slate-400 whitespace-nowrap" style={{ fontSize: '11px' }}>{notif.time}</span>
                      {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                    </div>
                  </div>
                  <p className="text-slate-500 mt-0.5 leading-relaxed" style={{ fontSize: '12px' }}>{notif.message}</p>
                  <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} font-medium`} style={{ fontSize: '10px' }}>
                    {cfg.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
