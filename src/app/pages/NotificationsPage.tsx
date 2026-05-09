import { useState } from 'react';
import { Bell, Clock, AlertCircle, DollarSign, CheckSquare, Info, CheckCheck } from 'lucide-react';

type NotifCategory = 'all' | 'attendance' | 'late' | 'update' | 'payroll' | 'task';

interface Notification {
  id: number;
  category: Exclude<NotifCategory, 'all'>;
  title: string;
  message: string;
  time: string;
  read: boolean;
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

const initialNotifications: Notification[] = [
  { id: 1, category: 'attendance', title: 'Check-in Reminder', message: 'You have not checked in today. Work starts at 08:00 AM.', time: '08:05 AM', read: false },
  { id: 2, category: 'late', title: 'Late Arrival Recorded', message: 'Check-in at 09:15 AM on May 6 was late. Deduction applied.', time: 'Yesterday', read: false },
  { id: 3, category: 'payroll', title: 'Payslip Ready – April 2026', message: 'Net salary: Rp 9,420,000. Please review and confirm.', time: 'May 1', read: false },
  { id: 4, category: 'task', title: 'New Task Assigned', message: '"Prepare Q2 Sales Report" — due today at 10:00 AM.', time: 'May 8', read: true },
  { id: 5, category: 'update', title: 'System Maintenance Notice', message: 'Scheduled maintenance on May 10, 01:00 – 03:00 AM.', time: 'May 7', read: true },
  { id: 6, category: 'attendance', title: 'Check-out Reminder', message: "It's 05:15 PM. Don't forget to check out!", time: 'May 7', read: true },
  { id: 7, category: 'late', title: 'Late Warning', message: '3 late arrivals this month. Please improve your attendance.', time: 'May 5', read: true },
  { id: 8, category: 'payroll', title: 'Payroll Processing', message: 'May 2026 payroll is being processed. Payment: May 25.', time: 'May 4', read: true },
  { id: 9, category: 'task', title: 'Task Overdue Alert', message: '"Client Follow-up Call" is overdue. Please update status.', time: 'May 8', read: false },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [filter, setFilter] = useState<NotifCategory>('all');

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.category === filter);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: number) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  return (
    <div className="pb-4">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-4 mb-3">
        <p className="text-slate-500" style={{ fontSize: '13px' }}>
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
        </p>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-blue-600 font-medium" style={{ fontSize: '13px' }}>
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {/* Filter chips */}
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

      {/* Notification list */}
      <div className="px-4 space-y-2">
        {filtered.length === 0 ? (
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
                onClick={() => markRead(notif.id)}
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
