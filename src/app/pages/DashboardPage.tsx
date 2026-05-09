import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  LogOut, CheckCircle2, Zap, ChevronRight,
  MapPin, CheckSquare, DollarSign, Timer, Shield, Camera, Clock,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import CheckInModal from '../components/CheckInModal';
import type { CheckInResult } from '../components/CheckInModal';
import CheckOutModal from '../components/CheckOutModal';
import type { CheckOutResult } from '../components/CheckOutModal';
import { OFFICE_CONFIG } from '../config/officeConfig';
import { attendanceService } from '../../services/attendanceService';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../lib/api';

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
  const [initialLoading, setInitialLoading] = useState(true);

  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);

  const [checkedIn, setCheckedIn] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const [checkInData, setCheckInData] = useState<CheckInResult | null>(null);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutResult, setCheckOutResult] = useState<CheckOutResult | null>(null);
  const [apiLoading, setApiLoading] = useState<'in' | 'out' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    attendanceService.today()
      .then(res => {
        const record = res.data;
        if (record?.clock_in_at) {
          setCheckedIn(true);
          setCheckInTime(parseISO(record.clock_in_at));
        }
        if (record?.clock_out_at) {
          setCheckedOut(true);
          const coTime = parseISO(record.clock_out_at);
          const ciTime = parseISO(record.clock_in_at!);
          const totalMs = coTime.getTime() - ciTime.getTime();
          const totalHours = totalMs / 3600000;
          setCheckOutResult({
            checkOutTime: coTime,
            totalMs,
            totalHours,
            isOvertime: totalHours > 8,
            overtimeHours: Math.max(0, totalHours - 8),
            status: 'on_time',
          });
        }
      })
      .catch(() => {/* fail silently — backend may not have record yet */})
      .finally(() => setInitialLoading(false));
  }, []);

  const handleCheckInSuccess = async (result: CheckInResult) => {
    setShowCheckInModal(false);
    setApiLoading('in');
    setError('');
    try {
      await attendanceService.checkIn();
      setCheckedIn(true);
      setCheckInTime(new Date());
      setCheckInData(result);
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
      await attendanceService.checkOut();
      setCheckedOut(true);
      setCheckOutResult(result);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Check-out failed. Please try again.');
    } finally {
      setApiLoading(null);
    }
  };

  const liveDuration = checkedIn && !checkedOut && checkInTime
    ? msToHm(now.getTime() - checkInTime.getTime())
    : null;

  const attendanceStatus = () => {
    if (!checkInTime) return { label: 'Not Checked In', color: 'text-slate-500', bg: 'bg-slate-100' };
    const [wh, wm] = OFFICE_CONFIG.workStartTime.split(':').map(Number);
    const late = (checkInTime.getHours() * 60 + checkInTime.getMinutes()) - (wh * 60 + wm);
    if (late <= 0) return { label: 'On Time', color: 'text-emerald-700', bg: 'bg-emerald-100' };
    if (late <= 60) return { label: `Late ${late}m`, color: 'text-amber-700', bg: 'bg-amber-100' };
    return { label: 'Very Late', color: 'text-red-700', bg: 'bg-red-100' };
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
    <>
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
            <span
              className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full ${status.bg} ${status.color}`}
              style={{ fontSize: '12px', fontWeight: 600 }}
            >
              {initialLoading ? 'Loading...' : status.label}
            </span>
          </div>
        </div>

        {/* Main attendance card */}
        <div className="px-4 -mt-5 mb-4">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-5">

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
              { label: 'Present', value: '18', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Late', value: '2', color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Absent', value: '1', color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'OT hrs', value: '12', color: 'text-blue-600', bg: 'bg-blue-50' },
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
            {[
              { date: 'Thu, May 7', in: '08:02', out: '17:15', dur: '9h 13m', status: 'On Time', sColor: 'text-emerald-600', sBg: 'bg-emerald-50' },
              { date: 'Wed, May 6', in: '09:15', out: '17:30', dur: '8h 15m', status: 'Late', sColor: 'text-amber-600', sBg: 'bg-amber-50' },
              { date: 'Tue, May 5', in: '07:55', out: '17:00', dur: '9h 5m', status: 'On Time', sColor: 'text-emerald-600', sBg: 'bg-emerald-50' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-slate-700 font-bold" style={{ fontSize: '13px' }}>{item.date.split(' ')[2]}</span>
                  <span className="text-slate-400" style={{ fontSize: '10px' }}>{item.date.split(',')[0]}</span>
                </div>
                <div className="flex-1">
                  <p className="text-slate-700 font-semibold" style={{ fontSize: '13px' }}>
                    {item.in} → {item.out}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock size={10} className="text-slate-300" />
                    <span className="text-slate-400" style={{ fontSize: '11px' }}>{item.dur}</span>
                    <Camera size={10} className="text-blue-300 ml-1" />
                    <span className="text-blue-400" style={{ fontSize: '10px' }}>Selfie</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full ${item.sBg} ${item.sColor} font-medium`} style={{ fontSize: '11px' }}>
                  {item.status}
                </span>
              </div>
            ))}
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
