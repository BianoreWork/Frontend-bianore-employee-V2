import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  LogOut, CheckCircle2, Zap, ChevronRight,
  MapPin, Timer, Shield, Camera, Clock, FileText, Send,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import CheckInModal from '../components/CheckInModal';
import type { CheckInResult } from '../components/CheckInModal';
import CheckOutModal from '../components/CheckOutModal';
import type { CheckOutResult } from '../components/CheckOutModal';
import { OFFICE_CONFIG } from '../config/officeConfig';
import { attendanceService } from '../../services/attendanceService';
import { documentsService } from '../../services/documentsService';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../lib/api';
import { getOrCreateDeviceUid } from '../utils/deviceUid';
import type { AttendanceRecapData, AttendanceHistoryItem, AttendanceRecord } from '../../types/api';

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

function msToHm(ms: number) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return { h, m, label: h > 0 ? `${h}h ${m}m` : `${m}m` };
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

  const [recap, setRecap] = useState<AttendanceRecapData | null>(() => readCache('dashboard:recap'));
  const [recapLoading, setRecapLoading] = useState(() => !readCache<AttendanceRecapData>('dashboard:recap'));
  const [recentHistory, setRecentHistory] = useState<AttendanceHistoryItem[]>(() => readCache('dashboard:history') ?? []);
  const [historyLoading, setHistoryLoading] = useState(() => !readCache<AttendanceHistoryItem[]>('dashboard:history'));
  const [missingDocuments, setMissingDocuments] = useState<string[]>(() => readCache('dashboard:missing-documents') ?? []);
  const [documentsLoading, setDocumentsLoading] = useState(() => !readCache<string[]>('dashboard:missing-documents'));

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

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

    attendanceService.today()
      .then(res => {
        writeCache('dashboard:today', res.data);
        applyTodayRecord(res.data);
      })
      .catch(() => {/* fail silently — backend may not have record yet */})
      .finally(() => setInitialLoading(false));
  }, []);

  const handleCheckInSuccess = async (result: CheckInResult) => {
    setShowCheckInModal(false);
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
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Check-in failed. Please try again.');
    } finally {
      setApiLoading(null);
    }
  };

  const handleCheckOutConfirm = async (result: CheckOutResult) => {
    setShowCheckOutModal(false);
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
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Check-out failed. Please try again.');
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

  useEffect(() => {
    const requiredDocuments = [
      { key: 'ktp', label: 'ID Card / KTP', aliases: ['ktp', 'id card'] },
      { key: 'npwp', label: 'Tax Number / NPWP', aliases: ['npwp', 'tax number'] },
      { key: 'bank', label: 'Bank Account', aliases: ['bank account', 'bank'] },
    ];

    documentsService.myDocuments()
      .then(documents => {
        const uploadedText = documents
          .map(doc => `${doc.document_type} ${doc.document_name}`.toLowerCase())
          .join(' | ');
        const missing = requiredDocuments
          .filter(doc => !doc.aliases.some(alias => uploadedText.includes(alias)))
          .map(doc => doc.label);
        writeCache('dashboard:missing-documents', missing);
        setMissingDocuments(missing);
      })
      .catch(() => {
        const fallback = requiredDocuments.map(doc => doc.label);
        writeCache('dashboard:missing-documents', fallback);
        setMissingDocuments(fallback);
      })
      .finally(() => setDocumentsLoading(false));
  }, []);

  const formatHistoryTime = (t: string | null) => {
    if (!t) return '—';
    if (t.includes('T') || t.includes(' ')) {
      return new Date(t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return t.substring(0, 5);
  };

  const formatWorkDuration = (minutes: number | null) => {
    if (minutes === null || minutes === undefined) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
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
    const [wh, wm] = OFFICE_CONFIG.workStartTime.split(':').map(Number);
    const late = (checkInTime.getHours() * 60 + checkInTime.getMinutes()) - (wh * 60 + wm);
    if (late <= 0) return { label: 'On Time', color: 'text-emerald-700', bg: 'bg-emerald-100' };
    if (late <= 60) return { label: `Late ${late}m`, color: 'text-amber-700', bg: 'bg-amber-100' };
    return { label: 'Very Late', color: 'text-red-700', bg: 'bg-red-100' };
  };
  const status = attendanceStatus();

  const employeeName = user?.employee?.full_name ?? user?.email ?? 'Employee';

  const quickLinks = [
    { label: 'Documents', icon: FileText, to: '/dashboard/documents', color: 'text-blue-600', bg: 'bg-blue-50' },
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
                  {apiLoading === 'in' ? 'Recording check-in…' : 'Recording check-out…'}
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
                      {format(checkInTime, 'HH:mm')} → {format(checkOutResult.checkOutTime, 'HH:mm')} · {OFFICE_CONFIG.name}
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
                    { label: 'Check In', value: checkInTime ? format(checkInTime, 'HH:mm') : '—', color: 'text-blue-600' },
                    { label: 'Check Out', value: '—', color: 'text-slate-300' },
                    { label: 'Duration', value: liveDuration?.label ?? '—', color: 'text-emerald-600' },
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
                        {Math.round(checkInData.distance)}m · {OFFICE_CONFIG.name}
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
                    { label: 'Check In', value: '—', color: 'text-slate-300' },
                    { label: 'Check Out', value: '—', color: 'text-slate-300' },
                    { label: 'Duration', value: '—', color: 'text-slate-300' },
                  ].map(col => (
                    <div key={col.label} className="text-center">
                      <p className={`font-bold ${col.color}`} style={{ fontSize: '17px' }}>{col.value}</p>
                      <p className="text-slate-400" style={{ fontSize: '11px' }}>{col.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 bg-blue-50 rounded-2xl px-3 py-2.5 mb-4">
                  <MapPin size={13} className="text-blue-500 flex-shrink-0" />
                  <p className="text-blue-700" style={{ fontSize: '12px' }}>
                    Check-in requires GPS within <span className="font-bold">{OFFICE_CONFIG.radiusMeters}m</span> of {OFFICE_CONFIG.name} + selfie
                  </p>
                </div>

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

        {!documentsLoading && missingDocuments.length > 0 && (
          <div className="px-4 mb-4">
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-amber-900 font-semibold" style={{ fontSize: '14px' }}>
                      Complete Your Documents
                    </p>
                    <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-bold" style={{ fontSize: '10px' }}>
                      {missingDocuments.length}
                    </span>
                  </div>
                  <p className="text-amber-700 mt-1" style={{ fontSize: '12px' }}>
                    {missingDocuments.join(', ')} still need to be completed.
                  </p>
                  <p className="text-amber-600 mt-1" style={{ fontSize: '11px' }}>
                    Required for HR records and payroll processing.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/dashboard/documents')}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-white border border-amber-300 text-amber-800 font-semibold"
                style={{ fontSize: '13px' }}
              >
                Complete Documents
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="px-4 mb-4">
          <div className="grid grid-cols-3 gap-3">
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
              { label: 'Present', value: recapLoading ? '…' : String(recap?.present ?? '—'), color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Late', value: recapLoading ? '…' : String(recap?.late ?? '—'), color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Absent', value: recapLoading ? '…' : String(recap?.absent ?? '—'), color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Overtime', value: recapLoading ? '…' : String(recap?.overtime ?? '—'), color: 'text-blue-600', bg: 'bg-blue-50' },
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
              const dayNum = dateObj ? String(dateObj.getDate()) : '—';
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
                      {formatHistoryTime(item.check_in)} → {formatHistoryTime(item.check_out)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock size={10} className="text-slate-300" />
                      <span className="text-slate-400" style={{ fontSize: '11px' }}>{formatWorkDuration(item.work_duration)}</span>
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
              {OFFICE_CONFIG.name} · Radius: <strong className="text-slate-600">{OFFICE_CONFIG.radiusMeters}m</strong> · Work: {OFFICE_CONFIG.workStartTime}–{OFFICE_CONFIG.workEndTime}
            </p>
          </div>
        </div>
      </div>

      {/* Check-In Modal */}
      {showCheckInModal && (
        <CheckInModal
          onClose={() => setShowCheckInModal(false)}
          onSuccess={handleCheckInSuccess}
        />
      )}

      {/* Check-Out Modal */}
      {showCheckOutModal && checkInTime && (
        <CheckOutModal
          checkInTime={checkInTime}
          onClose={() => setShowCheckOutModal(false)}
          onConfirm={handleCheckOutConfirm}
        />
      )}
    </>
  );
}
