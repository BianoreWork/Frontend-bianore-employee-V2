import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, LogIn, LogOut, Clock, CheckCircle2, AlertCircle, XCircle, Plane, Briefcase, Bell } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, addMonths, subMonths, parseISO, isWeekend } from 'date-fns';
import { attendanceService } from '../../services/attendanceService';
import { requestsService } from '../../services/requestsService';
import type { AttendanceHistoryItem } from '../../types/api';

type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave' | 'weekend' | 'future' | 'agenda';

interface AgendaItem {
  id: number;
  title: string;
  date: string;   // yyyy-MM-dd
  time?: string;
  type: 'meeting' | 'event' | 'deadline' | 'info';
  desc?: string;
}

interface DayData {
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  duration?: string;
}

const dotColors: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-500',
  late:    'bg-amber-500',
  absent:  'bg-red-500',
  leave:   'bg-purple-500',
  weekend: 'bg-transparent',
  future:  'bg-transparent',
  agenda:  'bg-yellow-400',
};

// Mock agenda items from admin
const AGENDA_ITEMS: AgendaItem[] = [
  { id: 1, title: 'Town Hall Meeting Q2',        date: '2026-05-28', time: '09:00', type: 'meeting',  desc: 'Review kinerja Q2 dan target Q3 bersama seluruh tim.' },
  { id: 2, title: 'Batas Submit Laporan Mei',    date: '2026-05-30', time: '17:00', type: 'deadline', desc: 'Deadline pengumpulan laporan aktivitas bulan Mei.' },
  { id: 3, title: 'Pelatihan SOP Baru',           date: '2026-06-03', time: '10:00', type: 'event',    desc: 'Sesi pelatihan prosedur operasional standar yang diperbarui.' },
  { id: 4, title: 'Libur Nasional - Waisak',     date: '2026-05-12', time: undefined, type: 'info',   desc: 'Hari libur nasional. Kantor tutup.' },
];

const statusLabels: Record<AttendanceStatus, { label: string; color: string; bg: string }> = {
  present: { label: 'Hadir',   color: 'text-emerald-700', bg: 'bg-emerald-100' },
  late:    { label: 'Terlambat',color: 'text-amber-700',  bg: 'bg-amber-100'  },
  absent:  { label: 'Absen',   color: 'text-red-700',     bg: 'bg-red-100'    },
  leave:   { label: 'Cuti',    color: 'text-purple-700',  bg: 'bg-purple-100' },
  weekend: { label: 'Libur',   color: 'text-slate-400',   bg: 'bg-slate-100'  },
  future:  { label: '-',       color: 'text-slate-300',   bg: 'bg-slate-50'   },
  agenda:  { label: 'Agenda',  color: 'text-yellow-700',  bg: 'bg-yellow-100' },
};

const agendaTypeCfg = {
  meeting:  { label: 'Meeting',  color: 'text-blue-600',   bg: 'bg-blue-50'   },
  event:    { label: 'Acara',    color: 'text-indigo-600', bg: 'bg-indigo-50' },
  deadline: { label: 'Deadline', color: 'text-red-600',    bg: 'bg-red-50'    },
  info:     { label: 'Info',     color: 'text-amber-600',  bg: 'bg-amber-50'  },
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

const SCHEDULE_CACHE_KEY = 'schedule:attendance-map';
const SCHEDULE_CACHE_TTL_MS = 5 * 60_000;

function readScheduleCache(): Record<string, DayData> {
  try {
    const raw = localStorage.getItem(SCHEDULE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { value: Record<string, DayData>; savedAt: number };
    if (Date.now() - parsed.savedAt > SCHEDULE_CACHE_TTL_MS) return {};
    return parsed.value;
  } catch {
    return {};
  }
}

function writeScheduleCache(value: Record<string, DayData>) {
  try {
    localStorage.setItem(SCHEDULE_CACHE_KEY, JSON.stringify({ value, savedAt: Date.now() }));
  } catch {
    /* storage can be unavailable in private mode */
  }
}

export default function SchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const cachedMap = readScheduleCache();
  const [attendanceMap, setAttendanceMap] = useState<Record<string, DayData>>(cachedMap);
  const [loading, setLoading] = useState(Object.keys(cachedMap).length === 0);

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
      writeScheduleCache(map);
    }).finally(() => setLoading(false));
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startOffset = getDay(monthStart);
  const today = new Date();

  const agendaDateSet = new Set(AGENDA_ITEMS.map(a => a.date));

  const getDayData = (date: Date): DayData & { status: AttendanceStatus; hasAgenda?: boolean } => {
    const key = format(date, 'yyyy-MM-dd');
    const dow = getDay(date);
    if (dow === 0 || dow === 6) return { status: 'weekend' };
    const hasAgenda = agendaDateSet.has(key);
    if (date > today) return { status: hasAgenda ? 'agenda' : 'future', hasAgenda };
    return { ...(attendanceMap[key] || { status: 'absent' }), hasAgenda };
  };

  const shiftName = 'Shift Tetap 1';
  const shiftStart = '08:00';
  const shiftEnd = '17:00';

  const summary = days.reduce((acc, day) => {
    const d = getDayData(day);
    if (d.status !== 'weekend' && d.status !== 'future') acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const selectedData = selectedDay ? getDayData(selectedDay) : null;

  const upcomingAgenda = AGENDA_ITEMS
    .filter(a => a.date >= format(today, 'yyyy-MM-dd'))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="pb-4">
      {/* Shift card */}
      <div className="px-4 pt-4 mb-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl px-4 py-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Briefcase size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-blue-200" style={{ fontSize: '11px' }}>Jadwal Kerja Kamu</p>
            <p className="text-white font-bold" style={{ fontSize: '14px' }}>{shiftName}</p>
          </div>
          <div className="text-right">
            <p className="text-white font-bold" style={{ fontSize: '16px' }}>{shiftStart} – {shiftEnd}</p>
            <p className="text-blue-200" style={{ fontSize: '10px' }}>Senin – Jumat</p>
          </div>
        </div>
      </div>

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
                  {!isWeekend && !loading && (
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white/60' :
                      data.hasAgenda ? 'bg-yellow-400' :
                      isFuture ? 'bg-transparent' :
                      dotColors[data.status]
                    }`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-4 py-3 border-t border-slate-100 bg-slate-50 overflow-x-auto">
            {[
              { color: 'bg-emerald-500', label: 'Hadir' },
              { color: 'bg-amber-500',   label: 'Terlambat' },
              { color: 'bg-red-500',     label: 'Absen' },
              { color: 'bg-purple-500',  label: 'Cuti' },
              { color: 'bg-yellow-400',  label: 'Agenda' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-slate-500 whitespace-nowrap" style={{ fontSize: '11px' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming agenda */}
      {upcomingAgenda.length > 0 && (
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={14} className="text-yellow-500" />
            <p className="text-slate-800 font-semibold" style={{ fontSize: '14px' }}>Agenda Mendatang</p>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            {upcomingAgenda.map((item, idx) => {
              const cfg = agendaTypeCfg[item.type];
              return (
                <div key={item.id} className={`flex items-start gap-3 px-4 py-3.5 ${idx < upcomingAgenda.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-semibold" style={{ fontSize: '13px' }}>{item.title}</p>
                    {item.desc && <p className="text-slate-400 mt-0.5" style={{ fontSize: '11px' }}>{item.desc}</p>}
                    <p className="text-slate-400 mt-1 flex items-center gap-1" style={{ fontSize: '11px' }}>
                      <ChevronRight size={10} />
                      {format(new Date(item.date), 'd MMM yyyy')}
                      {item.time && ` · ${item.time}`}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${cfg.bg} ${cfg.color}`} style={{ fontSize: '10px' }}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                <p className={`font-medium ${statusLabels[selectedData.status].color} flex items-center gap-2`} style={{ fontSize: '13px' }}>
                  {selectedData.status === 'absent' ? (
                    <>
                      <AlertCircle size={16} className="flex-shrink-0" />
                      <span>No attendance record for this day.</span>
                    </>
                  ) : (
                    <>
                      <Plane size={16} className="flex-shrink-0" />
                      <span>On approved leave.</span>
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
