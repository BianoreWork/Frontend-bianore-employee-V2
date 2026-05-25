import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  LogOut, CheckCircle2, Zap, ChevronRight,
  MapPin, Timer, Shield, Camera, Clock, Send,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import CheckInModal from '../components/CheckInModal';
import type { CheckInResult } from '../components/CheckInModal';
import CheckOutModal from '../components/CheckOutModal';
import type { CheckOutResult } from '../components/CheckOutModal';
import { OFFICE_CONFIG, type OfficeConfig } from '../config/officeConfig';
import { attendanceService } from '../../services/attendanceService';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../lib/api';
import { getOrCreateDeviceUid } from '../utils/deviceUid';
import { getDistanceMeters } from '../utils/geo';
import type { AttendanceBranch, AttendanceHomeSchedule, AttendanceRecapData, AttendanceHistoryItem, AttendanceRecord } from '../../types/api';

const CACHE_TTL_MS = 60_000;

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { value: T; savedAt: number };
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;
    return parsed.value;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify({ value, savedAt: Date.now() }));
  } catch {
    /* storage can be unavailable in private mode */
  }
}

function numberFrom(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function officeFromBranch(branch?: AttendanceBranch | null, current: OfficeConfig = OFFICE_CONFIG): OfficeConfig {
  const lat = numberFrom(branch?.latitude);
  const lng = numberFrom(branch?.longitude);
  const radius = numberFrom(branch?.radius_meters);

  return {
    ...current,
    name: branch?.name || current.name,
    address: branch?.address ?? current.address,
    lat: lat ?? current.lat,
    lng: lng ?? current.lng,
    radiusMeters: radius ?? current.radiusMeters,
  };
}

function recordFromHome(data: Record<string, unknown>): AttendanceRecord | null {
  const existing = (data.today_attendance ?? data.attendance ?? data.record ?? null) as AttendanceRecord | null;
  if (existing?.clock_in_at) return existing;

  const checkin = data.checkin as { time?: string | null } | null | undefined;
  if (!checkin?.time) return existing;

  const checkout = data.checkout as { time?: string | null } | null | undefined;
  const schedule = data.today_schedule as AttendanceHomeSchedule | null | undefined;
  const attendanceDate =
    typeof data.attendance_work_date === 'string'
      ? data.attendance_work_date
      : new Date().toISOString().slice(0, 10);
  const clockInAt = checkin.time.includes('T') ? checkin.time : `${attendanceDate}T${checkin.time}`;
  const clockOutAt = checkout?.time
    ? (checkout.time.includes('T') ? checkout.time : `${attendanceDate}T${checkout.time}`)
    : null;

  return {
    id: 0,
    attendance_date: attendanceDate,
    employee: { id: 0, name: '', employee_code: '' },
    clock_in_at: clockInAt,
    clock_out_at: clockOutAt,
    status: (typeof data.today_status === 'string' && data.today_status) || 'present',
    system_status: 'present',
    status_label: clockOutAt ? 'Checked Out' : 'Checked In',
    late_minutes: 0,
    overtime_minutes: 0,
    work_duration: null,
    shift: schedule?.start_time && schedule?.end_time
      ? { name: schedule.shift_name || 'Shift', start_time: schedule.start_time, end_time: schedule.end_time }
      : null,
    branch: schedule?.branch ?? null,
    assigned_branch: schedule?.assigned_branch ?? null,
  };
}

function msToHm(ms: number) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return { h, m, label: h > 0 ? `${h}h ${m}m` : `${m}m` };
}

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());
  const [initialLoading, setInitialLoading] = useState(() => !readCache<AttendanceRecord | null>('dashboard:today'));

  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);

  const [checkedIn, setCheckedIn] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const [checkInData, setCheckInData] = useState<CheckInResult | null>(null);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutResult, setCheckOutResult] = useState<CheckOutResult | null>(null);
  const [serverStatusLabel, setServerStatusLabel] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState<'in' | 'out' | null>(null);
  const [error, setError] = useState('');
  const [officeConfig, setOfficeConfig] = useState<OfficeConfig>(OFFICE_CONFIG);
  const [liveDistance, setLiveDistance] = useState<number | null>(null);
  const [liveGpsAccuracy, setLiveGpsAccuracy] = useState<number | null>(null);
  const [liveGpsError, setLiveGpsError] = useState<string | null>(null);
  const [liveGpsLoading, setLiveGpsLoading] = useState(true);

  const [recap, setRecap] = useState<AttendanceRecapData | null>(() => readCache('dashboard:recap'));
  const [recapLoading, setRecapLoading] = useState(() => !readCache<AttendanceRecapData>('dashboard:recap'));
  const [recentHistory, setRecentHistory] = useState<AttendanceHistoryItem[]>(() => readCache('dashboard:history') ?? []);
  const [historyLoading, setHistoryLoading] = useState(() => !readCache<AttendanceHistoryItem[]>('dashboard:history'));

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLiveGpsError('GPS not supported by this browser.');
      setLiveGpsLoading(false);
      return;
    }

    setLiveGpsLoading(true);
    setLiveGpsError(null);
    const watchId = navigator.geolocation.watchPosition(
      pos => {
        const distance = getDistanceMeters(
          pos.coords.latitude,
          pos.coords.longitude,
          officeConfig.lat,
          officeConfig.lng,
        );
        setLiveDistance(distance);
        setLiveGpsAccuracy(Math.round(pos.coords.accuracy));
        setLiveGpsLoading(false);
      },
      err => {
        setLiveGpsError(err.message);
        setLiveGpsLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [officeConfig.lat, officeConfig.lng]);

  const applyTodayRecord = (record: AttendanceRecord | null) => {
    if (record?.clock_in_at) {
      setCheckedIn(true);
      setCheckInTime(parseISO(record.clock_in_at));
      if (record.status_label) setServerStatusLabel(record.status_label);
    } else {
      setCheckedIn(false);
      setCheckInTime(null);
      setServerStatusLabel(null);
    }

    if (record?.clock_out_at && record.clock_in_at) {
      setCheckedOut(true);
      const coTime = parseISO(record.clock_out_at);
      const ciTime = parseISO(record.clock_in_at);
      const totalMs = coTime.getTime() - ciTime.getTime();
      const totalHours = totalMs / 3600000;
      setCheckOutResult({
        checkOutTime: coTime,
        totalMs,
        totalHours,
        isOvertime: totalHours > 8,
        overtimeHours: Math.max(0, totalHours - 8),
        status: 'on_time',
        timestamp: coTime.toISOString(),
      });
    } else {
      setCheckedOut(false);
      setCheckOutResult(null);
    }
  };

  useEffect(() => {
    const cachedToday = readCache<AttendanceRecord | null>('dashboard:today');
    if (cachedToday !== null) {
      applyTodayRecord(cachedToday);
    }

    attendanceService.home()
      .then(res => {
        const data = res.data as Record<string, unknown>;
        const schedule = data.today_schedule as {
          branch?: AttendanceBranch | null;
          assigned_branch?: AttendanceBranch | null;
          start_time?: string | null;
          end_time?: string | null;
        } | null | undefined;
        const branch = schedule?.assigned_branch ?? schedule?.branch ?? null;

        setOfficeConfig(prev => ({
          ...officeFromBranch(branch, prev),
          workStartTime: schedule?.start_time?.slice(0, 5) || prev.workStartTime,
          workEndTime: schedule?.end_time?.slice(0, 5) || prev.workEndTime,
        }));

        const record = recordFromHome(data);
        writeCache('dashboard:today', record);
        applyTodayRecord(record);
      })
      .catch(() => {
        attendanceService.today()
          .then(res => {
            writeCache('dashboard:today', res.data);
            applyTodayRecord(res.data);
            setOfficeConfig(prev => officeFromBranch(res.data?.assigned_branch ?? res.data?.branch ?? null, prev));
          })
          .catch(() => {});
      })
      .finally(() => setInitialLoading(false));
  }, []);

  const handleCheckInSuccess = async (result: CheckInResult) => {
    setApiLoading('in');
    setError('');
    try {
      const res = await attendanceService.checkIn({
        latitude: result.coords.lat,
        longitude: result.coords.lng,
        client_captured_at: result.timestamp,
        device_uid: getOrCreateDeviceUid(),
        platform: 'web',
        photo: result.photo,
      });
      setCheckedIn(true);
      setCheckInTime(res.data.clock_in_at ? parseISO(res.data.clock_in_at) : new Date());
      setCheckInData(result);
      if (res.data.status_label) setServerStatusLabel(res.data.status_label);
      writeCache('dashboard:today', res.data);
      attendanceService.home()
        .then(homeRes => {
          const record = recordFromHome(homeRes.data as Record<string, unknown>);
          writeCache('dashboard:today', record);
          applyTodayRecord(record);
        })
        .catch(() => {});
      attendanceService.history(1, 3)
        .then(historyRes => {
          writeCache('dashboard:history', historyRes.data);
          setRecentHistory(historyRes.data);
        })
        .catch(() => {});
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.status === 409 || err.message.toLowerCase().includes('sudah melakukan check-in')) {
          attendanceService.home()
            .then(res => {
              const record = recordFromHome(res.data as Record<string, unknown>);
              writeCache('dashboard:today', record);
              applyTodayRecord(record);
            })
            .catch(() => {});
        }
        throw err;
      } else {
        const fallback = new Error('Check-in failed. Please try again.');
        setError(fallback.message);
        throw fallback;
      }
    } finally {
      setApiLoading(null);
    }
  };

  const handleCheckOutConfirm = async (result: CheckOutResult) => {
    setApiLoading('out');
    setError('');
    try {
      const res = await attendanceService.checkOut({
        ...(result.coords ? { latitude: result.coords.lat, longitude: result.coords.lng } : {}),
        client_captured_at: result.timestamp,
        device_uid: getOrCreateDeviceUid(),
        platform: 'web',
      });
      setCheckedOut(true);
      setCheckOutResult(result);
      writeCache('dashboard:today', res.data);
      applyTodayRecord(res.data);
      attendanceService.history(1, 3)
        .then(historyRes => {
          writeCache('dashboard:history', historyRes.data);
          setRecentHistory(historyRes.data);
        })
        .catch(() => {});
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        throw err;
      }
      const fallback = new Error('Check-out failed. Please try again.');
      setError(fallback.message);
      throw fallback;
    } finally {
      setApiLoading(null);
    }
  };

  useEffect(() => {
    attendanceService.recap()
      .then(res => {
        writeCache('dashboard:recap', res.data);
        setRecap(res.data);
      })
      .catch(() => {})
      .finally(() => setRecapLoading(false));
  }, []);

  useEffect(() => {
    attendanceService.history(1, 3)
      .then(res => {
        writeCache('dashboard:history', res.data);
        setRecentHistory(res.data);
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);


  const formatHistoryTime = (t: string | null) => {
    if (!t) return '-';
    if (t.includes('T') || t.includes(' ')) {
      return new Date(t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return t.substring(0, 5);
  };

  const formatWorkDuration = (minutes: number | null) => {
    if (minutes === null || minutes === undefined) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatHistoryLine = (item: AttendanceHistoryItem) => {
    const checkIn = formatHistoryTime(item.check_in);
    if (!item.check_out) return checkIn === '-' ? 'Not checked in' : `Check-in ${checkIn}`;
    return `${checkIn} - ${formatHistoryTime(item.check_out)}`;
  };

  const formatHistoryDuration = (item: AttendanceHistoryItem) => {
    if (item.check_in && !item.check_out) return 'Ongoing';
    return formatWorkDuration(item.work_duration);
  };

  const historyStatusStyle = (status: string, label: string) => {
    const s = (status + label).toLowerCase();
    if (s.includes('late')) return { color: 'text-amber-600', bg: 'bg-amber-50' };
    if (s.includes('absent')) return { color: 'text-red-600', bg: 'bg-red-50' };
    if (s.includes('present') || s.includes('time')) return { color: 'text-emerald-600', bg: 'bg-emerald-50' };
    return { color: 'text-slate-600', bg: 'bg-slate-50' };
  };

  const liveDuration = checkedIn && !checkedOut && checkInTime
    ? msToHm(now.getTime() - checkInTime.getTime())
    : null;

  const attendanceStatus = () => {
    if (!checkInTime) return { label: 'Not Checked In', color: 'text-slate-500', bg: 'bg-slate-100' };
    if (serverStatusLabel) {
      const sl = serverStatusLabel.toLowerCase();
      if (sl.includes('late') || sl.includes('terlambat')) {
        const isVeryLate = sl.includes('very') || sl.includes('sangat');
        return isVeryLate
          ? { label: serverStatusLabel, color: 'text-red-700', bg: 'bg-red-100' }
          : { label: serverStatusLabel, color: 'text-amber-700', bg: 'bg-amber-100' };
      }
      return { label: serverStatusLabel, color: 'text-emerald-700', bg: 'bg-emerald-100' };
    }
    const [wh, wm] = officeConfig.workStartTime.split(':').map(Number);
    const late = (checkInTime.getHours() * 60 + checkInTime.getMinutes()) - (wh * 60 + wm);
    if (late <= 0) return { label: 'On Time', color: 'text-emerald-700', bg: 'bg-emerald-100' };
    if (late <= 60) return { label: `Late ${late}m`, color: 'text-amber-700', bg: 'bg-amber-100' };
    return { label: 'Very Late', color: 'text-red-700', bg: 'bg-red-100' };
  };
  const status = attendanceStatus();
  const isOutsideRadius = liveDistance !== null && liveDistance > officeConfig.radiusMeters;

  const employeeName = user?.employee?.full_name ?? user?.email ?? 'Employee';

  const quickLinks = [
    { label: 'Schedule', icon: Timer, to: '/dashboard/schedule', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Requests', icon: Send, to: '/dashboard/requests', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <>
      <div className="pb-4">
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-5 pt-4 pb-10 relative">
          <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-white/5 translate-x-1/3" />
          <div className="relative">
            <p className="text-blue-200" style={{ fontSize: '12px' }}>{format(now, 'EEEE, MMMM d, yyyy')}</p>
            <p className="text-white font-bold tabular-nums mt-0.5" style={{ fontSize: '36px' }}>
              {format(now, 'HH:mm:ss')}
            </p>
            <p className="text-blue-200 mt-0.5" style={{ fontSize: '12px' }}>{employeeName}</p>
            <span
              className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full ${status.bg} ${status.color}`}
              style={{ fontSize: '12px', fontWeight: 600 }}
            >
              {initialLoading ? 'Loading...' : status.label}
            </span>
          </div>
        </div>

        {/* Main attendance card */}
        <div className="px-4 -mt-5 mb-4 relative z-10">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-white p-5">

            {error && (
              <div className="mb-4 px-3 py-2 bg-red-50 rounded-2xl">
                <p className="text-red-600" style={{ fontSize: '12px' }}>{error}</p>
              </div>
            )}

            {apiLoading && (
              <div className="mb-4 flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                <span className="text-slate-500" style={{ fontSize: '13px' }}>
                  {apiLoading === 'in' ? 'Recording check-in...' : 'Recording check-out...'}
                </span>
              </div>
            )}

            {/* POST CHECK-OUT SUMMARY */}
            {checkedOut && checkOutResult && checkInTime && (
              <>
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 mb-4 text-center">
                  <p className="text-blue-200 mb-1" style={{ fontSize: '11px' }}>TOTAL HOURS WORKED</p>
                  <p className="text-white font-bold tabular-nums" style={{ fontSize: '40px', letterSpacing: '-0.03em' }}>
                    {msToHm(checkOutResult.totalMs).h}
                    <span style={{ fontSize: '22px' }}>h </span>
                    {msToHm(checkOutResult.totalMs).m}
                    <span style={{ fontSize: '22px' }}>m</span>
                  </p>
                  {checkOutResult.isOvertime && (
                    <div className="inline-flex items-center gap-1 mt-1 bg-amber-400/20 rounded-full px-3 py-0.5">
                      <Zap size={11} className="text-amber-300" />
                      <span className="text-amber-200 font-semibold" style={{ fontSize: '11px' }}>
                        Overtime +{checkOutResult.overtimeHours.toFixed(1)}h
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Check In', value: format(checkInTime, 'HH:mm'), color: 'text-blue-600' },
                    { label: 'Check Out', value: format(checkOutResult.checkOutTime, 'HH:mm'), color: 'text-red-500' },
                    { label: 'Duration', value: msToHm(checkOutResult.totalMs).label, color: 'text-emerald-600' },
                  ].map(col => (
                    <div key={col.label} className="text-center">
                      <p className={`font-bold tabular-nums ${col.color}`} style={{ fontSize: '17px' }}>{col.value}</p>
                      <p className="text-slate-400" style={{ fontSize: '11px' }}>{col.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3 mb-4">
                  {checkInData?.photo && (
                    <img
                      src={checkInData.photo}
                      alt="selfie"
                      className="w-11 h-11 rounded-xl object-cover border-2 border-white shadow flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      <span className="text-slate-700 font-semibold" style={{ fontSize: '12px' }}>Session Complete</span>
                    </div>
                    <p className="text-slate-400" style={{ fontSize: '11px' }}>
                      {format(checkInTime, 'HH:mm')} to {format(checkOutResult.checkOutTime, 'HH:mm')} - {officeConfig.name}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${
                      checkOutResult.status === 'on_time' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                    style={{ fontSize: '11px' }}
                  >
                    {checkOutResult.status === 'on_time' ? 'On Time' : 'Late'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col items-center justify-center gap-1 bg-emerald-50 border-2 border-emerald-200 rounded-2xl" style={{ height: 72 }}>
                    <CheckCircle2 size={20} className="text-emerald-500" />
                    <span className="text-emerald-600 font-semibold" style={{ fontSize: '12px' }}>Checked In</span>
                    <span className="text-emerald-400" style={{ fontSize: '10px' }}>{format(checkInTime, 'HH:mm')}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1 bg-slate-50 border-2 border-slate-200 rounded-2xl" style={{ height: 72 }}>
                    <LogOut size={20} className="text-slate-400" />
                    <span className="text-slate-400 font-semibold" style={{ fontSize: '12px' }}>Checked Out</span>
                    <span className="text-slate-300" style={{ fontSize: '10px' }}>{format(checkOutResult.checkOutTime, 'HH:mm')}</span>
                  </div>
                </div>
              </>
            )}

            {/* ACTIVE SESSION */}
            {checkedIn && !checkedOut && (
              <>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Check In', value: checkInTime ? format(checkInTime, 'HH:mm') : '-', color: 'text-blue-600' },
                    { label: 'Check Out', value: '-', color: 'text-slate-300' },
                    { label: 'Duration', value: liveDuration?.label ?? '-', color: 'text-emerald-600' },
                  ].map(col => (
                    <div key={col.label} className="text-center">
                      <p className={`font-bold tabular-nums ${col.color}`} style={{ fontSize: '17px' }}>{col.value}</p>
                      <p className="text-slate-400" style={{ fontSize: '11px' }}>{col.label}</p>
                    </div>
                  ))}
                </div>

                {liveDuration && liveDuration.h >= 8 && (
                  <div className="flex items-center gap-2 bg-amber-50 rounded-2xl px-3 py-2 mb-3">
                    <Zap size={13} className="text-amber-500" />
                    <p className="text-amber-700 font-medium" style={{ fontSize: '12px' }}>
                      Overtime: +{msToHm(Math.max(0, (now.getTime() - checkInTime!.getTime()) - 8 * 3600000)).label}
                    </p>
                  </div>
                )}

                {checkInData && (
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-3 mb-4">
                    <img
                      src={checkInData.photo}
                      alt="selfie"
                      className="w-11 h-11 rounded-xl object-cover border-2 border-emerald-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Shield size={12} className="text-emerald-600" />
                        <span className="text-emerald-700 font-semibold" style={{ fontSize: '12px' }}>Selfie Verified</span>
                      </div>
                      <p className="text-emerald-600 truncate" style={{ fontSize: '11px' }}>
                        {Math.round(checkInData.distance)}m - {officeConfig.name}
                      </p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold flex-shrink-0" style={{ fontSize: '10px' }}>IN</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="flex flex-col items-center justify-center gap-1 bg-emerald-50 border-2 border-emerald-200 rounded-2xl"
                    style={{ height: 80 }}
                  >
                    <CheckCircle2 size={22} className="text-emerald-600" />
                    <span className="text-emerald-600 font-semibold" style={{ fontSize: '13px' }}>Checked In</span>
                    <span className="text-emerald-400" style={{ fontSize: '10px' }}>
                      {checkInTime ? format(checkInTime, 'HH:mm') : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowCheckOutModal(true)}
                    disabled={!!apiLoading}
                    className="flex flex-col items-center justify-center gap-1.5 bg-red-500 shadow-lg shadow-red-100 rounded-2xl active:scale-95 transition-transform disabled:opacity-50"
                    style={{ height: 80 }}
                  >
                    <LogOut size={22} className="text-white" />
                    <span className="text-white font-semibold" style={{ fontSize: '13px' }}>Check Out</span>
                    <span className="text-red-200" style={{ fontSize: '10px' }}>Tap to confirm</span>
                  </button>
                </div>
              </>
            )}

            {/* NOT YET CHECKED IN */}
            {!checkedIn && !initialLoading && (
              <>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Check In', value: '-', color: 'text-slate-300' },
                    { label: 'Check Out', value: '-', color: 'text-slate-300' },
                    { label: 'Duration', value: '-', color: 'text-slate-300' },
                  ].map(col => (
                    <div key={col.label} className="text-center">
                      <p className={`font-bold ${col.color}`} style={{ fontSize: '17px' }}>{col.value}</p>
                      <p className="text-slate-400" style={{ fontSize: '11px' }}>{col.label}</p>
                    </div>
                  ))}
                </div>

                <div className={`flex items-start gap-2 rounded-2xl px-3 py-2.5 mb-4 border ${
                  isOutsideRadius ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'
                }`}>
                  <MapPin size={13} className={`flex-shrink-0 mt-0.5 ${isOutsideRadius ? 'text-red-500' : 'text-blue-500'}`} />
                  <div>
                    <p className={`font-semibold ${isOutsideRadius ? 'text-red-700' : 'text-blue-700'}`} style={{ fontSize: '12px' }}>
                    {liveGpsLoading
                      ? `Detecting your GPS distance to ${officeConfig.name}...`
                      : liveDistance !== null
                        ? (
                          <>
                            {isOutsideRadius ? 'Outside allowed radius' : 'Inside allowed radius'}: <span className="font-bold">{formatDistance(liveDistance)}</span> from {officeConfig.name}
                          </>
                        )
                        : `GPS unavailable. Allow location access to check distance to ${officeConfig.name}.`}
                    </p>
                    {liveDistance !== null && (
                      <p className={isOutsideRadius ? 'text-red-500' : 'text-blue-500'} style={{ fontSize: '11px' }}>
                        Limit {officeConfig.radiusMeters}m + selfie - GPS accuracy {liveGpsAccuracy !== null ? `+/-${liveGpsAccuracy}m` : 'checking'} - realtime
                      </p>
                    )}
                  </div>
                </div>
                {liveGpsError && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl px-3 py-2 mb-4">
                    <p className="text-amber-700" style={{ fontSize: '12px' }}>{liveGpsError}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowCheckInModal(true)}
                    disabled={!!apiLoading}
                    className="flex flex-col items-center justify-center gap-1.5 bg-blue-600 shadow-lg shadow-blue-200 rounded-2xl active:scale-95 transition-transform disabled:opacity-50"
                    style={{ height: 80 }}
                  >
                    <Camera size={22} className="text-white" />
                    <span className="text-white font-semibold" style={{ fontSize: '13px' }}>Check In</span>
                    <span className="text-blue-200" style={{ fontSize: '10px' }}>GPS + Selfie</span>
                  </button>
                  <div
                    className="flex flex-col items-center justify-center gap-1.5 bg-slate-100 rounded-2xl"
                    style={{ height: 80 }}
                  >
                    <LogOut size={22} className="text-slate-300" />
                    <span className="text-slate-300 font-semibold" style={{ fontSize: '13px' }}>Check Out</span>
                  </div>
                </div>
              </>
            )}

            {initialLoading && (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              </div>
            )}
          </div>
        </div>


        {/* Quick links */}
        <div className="px-4 mb-4">
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map(item => (
              <button
                key={item.label}
                onClick={() => navigate(item.to)}
                className="flex flex-col items-center gap-2"
              >
                <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center`}>
                  <item.icon size={22} className={item.color} />
                </div>
                <span className="text-slate-600" style={{ fontSize: '11px', fontWeight: 500, textAlign: 'center' }}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* This Month stats */}
        <div className="px-4 mb-4">
          <p className="text-slate-800 font-semibold mb-3" style={{ fontSize: '14px' }}>This Month</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Present', value: recapLoading ? '...' : String(recap?.present ?? '-'), color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Late', value: recapLoading ? '...' : String(recap?.late ?? '-'), color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Absent', value: recapLoading ? '...' : String(recap?.absent ?? '-'), color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Overtime', value: recapLoading ? '...' : String(recap?.overtime ?? '-'), color: 'text-blue-600', bg: 'bg-blue-50' },
            ].map(item => (
              <div key={item.label} className={`${item.bg} rounded-2xl p-3 text-center`}>
                <p className={`font-bold ${item.color}`} style={{ fontSize: '20px' }}>{item.value}</p>
                <p className="text-slate-400" style={{ fontSize: '10px' }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent attendance */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-800 font-semibold" style={{ fontSize: '14px' }}>Recent Attendance</p>
            <button onClick={() => navigate('/dashboard/schedule')} className="flex items-center gap-1 text-blue-600" style={{ fontSize: '12px' }}>
              See all <ChevronRight size={13} />
            </button>
          </div>
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-100">
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              </div>
            ) : recentHistory.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-slate-400" style={{ fontSize: '13px' }}>No attendance records yet</p>
              </div>
            ) : recentHistory.map((item, i) => {
              const dateObj = item.attendance_date ? new Date(item.attendance_date) : null;
              const dayNum = dateObj ? String(dateObj.getDate()) : '-';
              const dayName = dateObj ? dateObj.toLocaleDateString('en-US', { weekday: 'short' }) : '';
              const ss = historyStatusStyle(item.status, item.status_label);
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-slate-700 font-bold" style={{ fontSize: '13px' }}>{dayNum}</span>
                    <span className="text-slate-400" style={{ fontSize: '10px' }}>{dayName}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-700 font-semibold" style={{ fontSize: '13px' }}>
                      {formatHistoryLine(item)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock size={10} className="text-slate-300" />
                      <span className="text-slate-400" style={{ fontSize: '11px' }}>{formatHistoryDuration(item)}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full ${ss.bg} ${ss.color} font-medium`} style={{ fontSize: '11px' }}>
                    {item.status_label || item.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Geofence policy */}
        <div className="px-4 mt-4">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 flex items-center gap-3">
            <Shield size={15} className="text-slate-400 flex-shrink-0" />
            <p className="text-slate-400" style={{ fontSize: '11px' }}>
              {officeConfig.name} - Radius: <strong className="text-slate-600">{officeConfig.radiusMeters}m</strong> - Work: {officeConfig.workStartTime}-{officeConfig.workEndTime}
            </p>
          </div>
        </div>
      </div>

      {/* Check-In Modal */}
      {showCheckInModal && (
        <CheckInModal
          officeConfig={officeConfig}
          onClose={() => setShowCheckInModal(false)}
          onSuccess={handleCheckInSuccess}
        />
      )}

      {/* Check-Out Modal */}
      {showCheckOutModal && checkInTime && (
        <CheckOutModal
          officeConfig={officeConfig}
          checkInTime={checkInTime}
          onClose={() => setShowCheckOutModal(false)}
          onConfirm={handleCheckOutConfirm}
        />
      )}
    </>
  );
}
