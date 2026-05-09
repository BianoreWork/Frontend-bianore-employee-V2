import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { LogIn, LogOut, CheckCircle2, Timer, Zap, ChevronRight, MapPin, CheckSquare, DollarSign } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { attendanceService } from '../../services/attendanceService';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../lib/api';
import type { AttendanceRecord } from '../../types/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState<'in' | 'out' | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    attendanceService.today()
      .then(res => setTodayRecord(res.data))
      .catch(() => {/* fail silently */})
      .finally(() => setInitialLoading(false));
  }, []);

  const checkInTime = todayRecord?.clock_in_at ? parseISO(todayRecord.clock_in_at) : null;
  const checkOutTime = todayRecord?.clock_out_at ? parseISO(todayRecord.clock_out_at) : null;
  const checkedIn = !!checkInTime;
  const checkedOut = !!checkOutTime;

  const workDuration = () => {
    if (!checkInTime) return '—';
    if (todayRecord?.work_duration != null) {
      const h = Math.floor(todayRecord.work_duration / 60);
      const m = todayRecord.work_duration % 60;
      return `${h}h ${m}m`;
    }
    const ms = now.getTime() - checkInTime.getTime();
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  };

  const overtimeText = () => {
    if (!todayRecord || todayRecord.overtime_minutes <= 0) return null;
    const h = Math.floor(todayRecord.overtime_minutes / 60);
    const m = todayRecord.overtime_minutes % 60;
    return h > 0 ? `+${h}h ${m}m` : `+${m}m`;
  };

  const attendanceStatus = () => {
    if (!todayRecord) return { label: 'Not Checked In', color: 'text-slate-500', bg: 'bg-slate-100' };
    switch (todayRecord.system_status) {
      case 'late':
      case 'late_overtime': return { label: 'Late ⚠️', color: 'text-amber-700', bg: 'bg-amber-100' };
      case 'absent': return { label: 'Absent', color: 'text-red-700', bg: 'bg-red-100' };
      default: return { label: 'On Time ✓', color: 'text-emerald-700', bg: 'bg-emerald-100' };
    }
  };

  const handleCheckIn = async () => {
    setError('');
    setLoading('in');
    try {
      const res = await attendanceService.checkIn();
      setTodayRecord(res.data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Check-in failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleCheckOut = async () => {
    setError('');
    setLoading('out');
    try {
      const res = await attendanceService.checkOut();
      setTodayRecord(res.data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Check-out failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const status = attendanceStatus();
  const employeeName = user?.employee?.full_name ?? user?.email ?? 'Employee';

  const quickLinks = [
    { label: 'Field Visit', icon: MapPin, to: '/dashboard/field-visit', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'My Tasks', icon: CheckSquare, to: '/dashboard/tasks', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Payslip', icon: DollarSign, to: '/dashboard/payroll', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Schedule', icon: Timer, to: '/dashboard/schedule', color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="pb-4">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-5 pt-4 pb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <p className="text-blue-200" style={{ fontSize: '12px' }}>{format(now, 'EEEE, MMMM d, yyyy')}</p>
          <p className="text-white font-bold tabular-nums mt-0.5" style={{ fontSize: '36px' }}>
            {format(now, 'HH:mm:ss')}
          </p>
          <p className="text-blue-200 mt-0.5" style={{ fontSize: '12px' }}>{employeeName}</p>
          <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full ${status.bg} ${status.color}`} style={{ fontSize: '12px', fontWeight: 600 }}>
            {initialLoading ? 'Loading...' : status.label}
          </span>
        </div>
      </div>

      {/* Main card */}
      <div className="px-4 -mt-5 mb-4">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-5">
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Check In', value: checkInTime ? format(checkInTime, 'HH:mm') : '—', color: 'text-blue-600' },
              { label: 'Check Out', value: checkOutTime ? format(checkOutTime, 'HH:mm') : '—', color: 'text-slate-600' },
              { label: 'Duration', value: workDuration(), color: 'text-emerald-600' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p className={`font-bold ${item.color}`} style={{ fontSize: '16px' }}>{item.value}</p>
                <p className="text-slate-400" style={{ fontSize: '11px' }}>{item.label}</p>
              </div>
            ))}
          </div>

          {overtimeText() && (
            <div className="flex items-center gap-2 bg-amber-50 rounded-2xl px-3 py-2 mb-4">
              <Zap size={14} className="text-amber-500" />
              <p className="text-amber-700 font-medium" style={{ fontSize: '12px' }}>Overtime: {overtimeText()}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 rounded-2xl">
              <p className="text-red-600" style={{ fontSize: '12px' }}>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCheckIn}
              disabled={checkedIn || loading === 'in' || initialLoading}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all ${
                checkedIn
                  ? 'bg-emerald-50 border-2 border-emerald-200'
                  : 'bg-blue-600 shadow-lg shadow-blue-200 active:scale-95'
              }`}
              style={{ height: '80px' }}
            >
              {loading === 'in' ? (
                <svg className="animate-spin w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              ) : (
                <>
                  {checkedIn ? <CheckCircle2 size={22} className="text-emerald-600" /> : <LogIn size={22} className="text-white" />}
                  <span className={checkedIn ? 'text-emerald-600' : 'text-white'} style={{ fontSize: '13px', fontWeight: 600 }}>
                    {checkedIn ? 'Checked In' : 'Check In'}
                  </span>
                </>
              )}
            </button>

            <button
              onClick={handleCheckOut}
              disabled={!checkedIn || checkedOut || loading === 'out'}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all ${
                checkedOut
                  ? 'bg-slate-50 border-2 border-slate-200'
                  : checkedIn
                  ? 'bg-red-500 shadow-lg shadow-red-100 active:scale-95'
                  : 'bg-slate-100'
              }`}
              style={{ height: '80px' }}
            >
              {loading === 'out' ? (
                <svg className="animate-spin w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              ) : (
                <>
                  <LogOut size={22} className={checkedOut ? 'text-slate-400' : checkedIn ? 'text-white' : 'text-slate-300'} />
                  <span
                    className={checkedOut ? 'text-slate-400' : checkedIn ? 'text-white' : 'text-slate-400'}
                    style={{ fontSize: '13px', fontWeight: 600 }}
                  >
                    {checkedOut ? 'Checked Out' : 'Check Out'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-4 gap-3">
          {quickLinks.map(item => (
            <button
              key={item.label}
              onClick={() => navigate(item.to)}
              className="flex flex-col items-center gap-2"
            >
              <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center`}>
                <item.icon size={22} className={item.color} />
              </div>
              <span className="text-slate-600" style={{ fontSize: '11px', fontWeight: 500, textAlign: 'center' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent attendance — will be loaded from schedule page */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-slate-800 font-semibold" style={{ fontSize: '14px' }}>Today</p>
          <button onClick={() => navigate('/dashboard/schedule')} className="flex items-center gap-1 text-blue-600" style={{ fontSize: '12px' }}>
            See history <ChevronRight size={13} />
          </button>
        </div>
        <div className="bg-white rounded-3xl p-4 border border-slate-100">
          {initialLoading ? (
            <div className="flex items-center justify-center py-4">
              <svg className="animate-spin w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            </div>
          ) : todayRecord ? (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Status', value: todayRecord.status_label, color: 'text-blue-600' },
                { label: 'Late', value: `${todayRecord.late_minutes}m`, color: 'text-amber-600' },
                { label: 'Shift', value: todayRecord.shift?.name ?? '—', color: 'text-slate-600' },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <p className={`font-semibold ${item.color}`} style={{ fontSize: '13px' }}>{item.value}</p>
                  <p className="text-slate-400" style={{ fontSize: '11px' }}>{item.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center" style={{ fontSize: '13px' }}>No attendance record for today.</p>
          )}
        </div>
      </div>
    </div>
  );
}
