import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, LogIn, LogOut, Clock, CheckCircle2, AlertCircle, XCircle, Plane } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, addMonths, subMonths, parseISO, isWeekend } from 'date-fns';
import { attendanceService } from '../../services/attendanceService';
import { requestsService } from '../../services/requestsService';
import type { AttendanceHistoryItem } from '../../types/api';

type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave' | 'weekend' | 'future';

interface DayData {
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  duration?: string;
}

const dotColors: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-500',
  late: 'bg-amber-500',
  absent: 'bg-red-500',
  leave: 'bg-purple-500',
  weekend: 'bg-transparent',
  future: 'bg-transparent',
};

const statusLabels: Record<AttendanceStatus, { label: string; color: string; bg: string }> = {
  present: { label: 'Present', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  late: { label: 'Late', color: 'text-amber-700', bg: 'bg-amber-100' },
  absent: { label: 'Absent', color: 'text-red-700', bg: 'bg-red-100' },
  leave: { label: 'Leave', color: 'text-purple-700', bg: 'bg-purple-100' },
  weekend: { label: 'Weekend', color: 'text-slate-400', bg: 'bg-slate-100' },
  future: { label: '-', color: 'text-slate-300', bg: 'bg-slate-50' },
};

function toStatus(item: AttendanceHistoryItem): AttendanceStatus {
  if (item.status === 'leave') return 'leave';
  if (item.status === 'absent') return 'absent';
  if (item.status === 'late' || item.status === 'late_overtime') return 'late';
  return 'present';
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return '—';
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export default function SchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, DayData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      attendanceService.history(1, 180),
      requestsService.getRequests({ status: 'approved', perPage: 200 }),
    ]).then(([histResult, leaveResult]) => {
      const map: Record<string, DayData> = {};

      // 1. Build map from attendance records
      if (histResult.status === 'fulfilled') {
        histResult.value.data.forEach(item => {
          const date = item.attendance_date
            ?? (item.check_in ? format(parseISO(item.check_in), 'yyyy-MM-dd') : '');
          if (!date) return;
          map[date] = {
            status: toStatus(item),
            checkIn: item.check_in ? format(parseISO(item.check_in), 'HH:mm') : undefined,
            checkOut: item.check_out ? format(parseISO(item.check_out), 'HH:mm') : undefined,
            duration: formatDuration(item.work_duration),
          };
        });
      }

      // 2. Overlay approved leave requests — covers days before backend fix ran.
      // Fetch all approved (no type filter) then filter by req.type === 'leave' on frontend
      // because backend stores 'annual_leave'/'special_leave', not 'leave'.
      if (leaveResult.status === 'fulfilled') {
        leaveResult.value.data
          .filter(req => req.type === 'leave')
          .forEach(req => {
            if (!req.startDate || !req.endDate) return;
            const days = eachDayOfInterval({
              start: parseISO(req.startDate),
              end: parseISO(req.endDate),
            });
            days.forEach(d => {
              if (isWeekend(d)) return;
              const key = format(d, 'yyyy-MM-dd');
              if (!map[key] || map[key].status === 'absent') {
                map[key] = { status: 'leave' };
              }
            });
          });
      }

      setAttendanceMap(map);
    }).finally(() => setLoading(false));
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startOffset = getDay(monthStart);
  const today = new Date();

  const getDayData = (date: Date): DayData & { status: AttendanceStatus } => {
    const key = format(date, 'yyyy-MM-dd');
    const dow = getDay(date);
    if (dow === 0 || dow === 6) return { status: 'weekend' };
    if (date > today) return { status: 'future' };
    return attendanceMap[key] || { status: 'absent' };
  };

  const summary = days.reduce((acc, day) => {
    const d = getDayData(day);
    if (d.status !== 'weekend' && d.status !== 'future') acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const selectedData = selectedDay ? getDayData(selectedDay) : null;

  return (
    <div className="pb-4">
      {/* Summary */}
      <div className="px-4 pt-4 grid grid-cols-4 gap-2 mb-4">
        {[
          { key: 'present', label: 'Present', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { key: 'late', label: 'Late', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { key: 'absent', label: 'Absent', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { key: 'leave', label: 'Leave', icon: Plane, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(item => (
          <div key={item.key} className={`${item.bg} rounded-2xl p-3 text-center`}>
            <p className={`font-bold ${item.color}`} style={{ fontSize: '20px' }}>
              {loading ? '—' : (summary[item.key] || 0)}
            </p>
            <p className="text-slate-400" style={{ fontSize: '10px' }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-100">
          {/* Month nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <ChevronLeft size={17} className="text-slate-600" />
            </button>
            <p className="text-slate-800 font-semibold" style={{ fontSize: '14px' }}>{format(currentMonth, 'MMMM yyyy')}</p>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <ChevronRight size={17} className="text-slate-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-3 pt-3">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-center text-slate-400 pb-2" style={{ fontSize: '11px', fontWeight: 600 }}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-0.5 px-3 pb-4">
            {Array.from({ length: startOffset }).map((_, i) => <div key={`e-${i}`} />)}
            {days.map(day => {
              const data = getDayData(day);
              const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
              const isCurrent = isToday(day);
              const isWeekend = data.status === 'weekend';
              const isFuture = data.status === 'future';

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => !isWeekend && !isFuture && setSelectedDay(isSelected ? null : day)}
                  disabled={isWeekend || isFuture}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
                    isSelected ? 'bg-blue-600' : isCurrent ? 'bg-blue-50 ring-1 ring-blue-300' : ''
                  } ${!isWeekend && !isFuture ? 'active:scale-95' : ''}`}
                >
                  <span
                    className={isSelected ? 'text-white' : isWeekend || isFuture ? 'text-slate-300' : 'text-slate-700'}
                    style={{ fontSize: '12px', fontWeight: isSelected || isCurrent ? 700 : 400 }}
                  >
                    {format(day, 'd')}
                  </span>
                  {!isWeekend && !isFuture && !loading && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/60' : dotColors[data.status]}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-4 py-3 border-t border-slate-100 bg-slate-50 overflow-x-auto">
            {[
              { key: 'present', color: 'bg-emerald-500', label: 'Present' },
              { key: 'late', color: 'bg-amber-500', label: 'Late' },
              { key: 'absent', color: 'bg-red-500', label: 'Absent' },
              { key: 'leave', color: 'bg-purple-500', label: 'Leave' },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-slate-500 whitespace-nowrap" style={{ fontSize: '11px' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day detail */}
      {selectedDay && selectedData && (
        <div className="px-4">
          <div className="bg-white rounded-3xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-slate-800 font-semibold" style={{ fontSize: '14px' }}>{format(selectedDay, 'EEEE, MMM d')}</p>
                <p className="text-slate-400" style={{ fontSize: '12px' }}>Attendance detail</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full font-semibold ${statusLabels[selectedData.status].bg} ${statusLabels[selectedData.status].color}`} style={{ fontSize: '12px' }}>
                {statusLabels[selectedData.status].label}
              </span>
            </div>

            {(selectedData.status === 'present' || selectedData.status === 'late') ? (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Check In', value: selectedData.checkIn || '—', icon: LogIn, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Check Out', value: selectedData.checkOut || '—', icon: LogOut, color: 'text-red-500', bg: 'bg-red-50' },
                  { label: 'Duration', value: selectedData.duration || '—', icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map(item => (
                  <div key={item.label} className={`${item.bg} rounded-2xl p-3 text-center`}>
                    <item.icon size={16} className={`${item.color} mx-auto mb-1`} />
                    <p className={`font-bold ${item.color}`} style={{ fontSize: '13px' }}>{item.value}</p>
                    <p className="text-slate-400" style={{ fontSize: '10px' }}>{item.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`rounded-2xl p-3 ${statusLabels[selectedData.status].bg}`}>
                <p className={`font-medium ${statusLabels[selectedData.status].color}`} style={{ fontSize: '13px' }}>
                  {selectedData.status === 'absent' ? '⚠️ No attendance record for this day.' : '✈️ On approved leave.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
