import { useState, useEffect, useRef } from 'react';
import {
  X, LogOut, CheckCircle2, Clock, Timer,
  Zap, TrendingUp, Calendar, MapPin,
} from 'lucide-react';
import { format } from 'date-fns';
import { OFFICE_CONFIG } from '../config/officeConfig';

export interface CheckOutResult {
  checkOutTime: Date;
  totalMs: number;
  totalHours: number;
  isOvertime: boolean;
  overtimeHours: number;
  status: 'on_time' | 'late' | 'early';
}

interface Props {
  checkInTime: Date;
  onClose: () => void;
  onConfirm: (result: CheckOutResult) => void;
}

function msToHm(ms: number) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return { h, m, label: `${h}h ${m}m` };
}

const WORK_HOURS = 8;

export default function CheckOutModal({ checkInTime, onClose, onConfirm }: Props) {
  const [step, setStep] = useState<'confirm' | 'success'>('confirm');
  const [now, setNow] = useState(new Date());
  const [result, setResult] = useState<CheckOutResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const elapsed = now.getTime() - checkInTime.getTime();
  const { h, m, label: durationLabel } = msToHm(elapsed);
  const totalHours = elapsed / 3600000;
  const isOvertime = totalHours > WORK_HOURS;
  const overtimeHours = Math.max(0, totalHours - WORK_HOURS);

  const [wh, wm] = OFFICE_CONFIG.workStartTime.split(':').map(Number);
  const lateMinutes = (checkInTime.getHours() * 60 + checkInTime.getMinutes()) - (wh * 60 + wm);
  const attendanceStatus = lateMinutes <= 0 ? 'on_time' : lateMinutes <= 60 ? 'late' : 'very_late';

  const statusConfig = {
    on_time: { label: 'On Time', color: 'text-emerald-700', bg: 'bg-emerald-100', dot: 'bg-emerald-500' },
    late: { label: `Late ${lateMinutes}m`, color: 'text-amber-700', bg: 'bg-amber-100', dot: 'bg-amber-500' },
    very_late: { label: 'Very Late', color: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-500' },
  }[attendanceStatus];

  const handleConfirm = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const checkOutTime = new Date();
    const totalMs = checkOutTime.getTime() - checkInTime.getTime();
    const finalHours = totalMs / 3600000;
    const res: CheckOutResult = {
      checkOutTime,
      totalMs,
      totalHours: finalHours,
      isOvertime: finalHours > WORK_HOURS,
      overtimeHours: Math.max(0, finalHours - WORK_HOURS),
      status: lateMinutes <= 0 ? 'on_time' : lateMinutes <= 60 ? 'late' : 'early',
    };
    setResult(res);
    onConfirm(res);
    setStep('success');
  };

  const progressPct = Math.min(1, totalHours / WORK_HOURS);
  const R = 54;
  const circumference = 2 * Math.PI * R;
  const dash = progressPct * circumference;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ maxWidth: 430, margin: '0 auto' }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={step === 'confirm' ? onClose : undefined} />

      <div className="relative bg-white rounded-t-3xl flex flex-col overflow-hidden" style={{ maxHeight: '92dvh' }}>
        <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {step === 'confirm' && (
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center z-10">
            <X size={16} className="text-slate-500" />
          </button>
        )}

        {/* CONFIRM */}
        {step === 'confirm' && (
          <div className="flex-1 flex flex-col px-5 pb-8 overflow-y-auto">
            <div className="flex items-center gap-3 py-5 mb-1">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <LogOut size={22} className="text-red-500" />
              </div>
              <div>
                <p className="text-slate-800 font-bold" style={{ fontSize: '20px' }}>Check Out</p>
                <p className="text-slate-400" style={{ fontSize: '13px' }}>Review your session before leaving</p>
              </div>
            </div>

            <div className="flex items-center justify-center py-4 mb-2">
              <div className="relative flex items-center justify-center">
                <svg width={132} height={132} className="-rotate-90">
                  <circle cx={66} cy={66} r={R} fill="none" stroke="#f1f5f9" strokeWidth={10} />
                  <circle
                    cx={66} cy={66} r={R}
                    fill="none"
                    stroke={isOvertime ? '#f59e0b' : '#3b82f6'}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circumference}`}
                    style={{ transition: 'stroke-dasharray 1s linear' }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <p className="text-slate-800 font-bold tabular-nums" style={{ fontSize: '22px' }}>{h}h {m}m</p>
                  <p className="text-slate-400" style={{ fontSize: '11px' }}>worked today</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-4 mb-4 space-y-3">
              {[
                {
                  icon: Clock,
                  label: 'Check In',
                  value: format(checkInTime, 'HH:mm'),
                  sub: format(checkInTime, 'EEEE, MMM d'),
                  color: 'text-blue-600',
                  iconBg: 'bg-blue-50',
                },
                {
                  icon: LogOut,
                  label: 'Check Out (now)',
                  value: format(now, 'HH:mm'),
                  sub: 'Live',
                  color: 'text-red-500',
                  iconBg: 'bg-red-50',
                },
                {
                  icon: Timer,
                  label: 'Total Duration',
                  value: durationLabel,
                  sub: `${WORK_HOURS}h expected`,
                  color: 'text-slate-700',
                  iconBg: 'bg-slate-100',
                },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${row.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <row.icon size={16} className={row.color} />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-500" style={{ fontSize: '11px' }}>{row.label}</p>
                    <p className={`font-bold tabular-nums ${row.color}`} style={{ fontSize: '16px' }}>{row.value}</p>
                  </div>
                  <span className="text-slate-400" style={{ fontSize: '11px' }}>{row.sub}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-5">
              <div className={`flex-1 flex items-center gap-2 rounded-2xl px-3 py-2.5 ${statusConfig.bg}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusConfig.dot}`} />
                <div>
                  <p className="text-slate-400" style={{ fontSize: '10px' }}>Status</p>
                  <p className={`font-bold ${statusConfig.color}`} style={{ fontSize: '13px' }}>{statusConfig.label}</p>
                </div>
              </div>
              {isOvertime ? (
                <div className="flex-1 flex items-center gap-2 rounded-2xl px-3 py-2.5 bg-amber-50">
                  <Zap size={14} className="text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-slate-400" style={{ fontSize: '10px' }}>Overtime</p>
                    <p className="font-bold text-amber-700" style={{ fontSize: '13px' }}>+{overtimeHours.toFixed(1)}h</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-2 rounded-2xl px-3 py-2.5 bg-slate-50">
                  <TrendingUp size={14} className="text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-slate-400" style={{ fontSize: '10px' }}>Remaining</p>
                    <p className="font-bold text-slate-600" style={{ fontSize: '13px' }}>
                      {msToHm(Math.max(0, WORK_HOURS * 3600000 - elapsed)).label}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {totalHours < WORK_HOURS && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-5 flex items-start gap-2">
                <Clock size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-amber-700" style={{ fontSize: '12px' }}>
                  You're checking out {msToHm(Math.max(0, WORK_HOURS * 3600000 - elapsed)).label} before the expected end of shift.
                  This may be counted as early departure.
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-auto">
              <button
                onClick={onClose}
                className="flex-1 border-2 border-slate-200 rounded-2xl text-slate-700 font-semibold active:scale-95 transition-transform"
                style={{ height: '56px', fontSize: '15px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-red-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-100 active:scale-95 transition-transform"
                style={{ height: '56px', fontSize: '15px' }}
              >
                <LogOut size={18} /> Check Out
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {step === 'success' && result && (
          <div className="flex-1 flex flex-col px-5 pb-8 overflow-y-auto">
            <div className="flex flex-col items-center py-6">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-4 relative">
                <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <p className="text-slate-800 font-bold mb-1" style={{ fontSize: '22px' }}>See You Tomorrow!</p>
              <p className="text-slate-400" style={{ fontSize: '13px' }}>Your attendance has been recorded</p>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-5 mb-4 text-center">
              <p className="text-blue-200 mb-1" style={{ fontSize: '12px' }}>TOTAL HOURS WORKED TODAY</p>
              <p className="text-white font-bold tabular-nums" style={{ fontSize: '44px', letterSpacing: '-0.03em' }}>
                {msToHm(result.totalMs).h}
                <span style={{ fontSize: '24px' }}>h </span>
                {msToHm(result.totalMs).m}
                <span style={{ fontSize: '24px' }}>m</span>
              </p>
              {result.isOvertime && (
                <div className="inline-flex items-center gap-1.5 mt-2 bg-amber-400/20 rounded-full px-3 py-1">
                  <Zap size={12} className="text-amber-300" />
                  <span className="text-amber-200 font-semibold" style={{ fontSize: '12px' }}>
                    Overtime: +{result.overtimeHours.toFixed(1)}h
                  </span>
                </div>
              )}
            </div>

            <div className="bg-slate-50 rounded-3xl p-4 mb-4">
              <p className="text-slate-500 font-semibold mb-3" style={{ fontSize: '11px' }}>TODAY'S BREAKDOWN</p>
              <div className="space-y-3">
                {[
                  {
                    icon: Clock, label: 'Check In', iconBg: 'bg-blue-50', iconColor: 'text-blue-600',
                    value: format(checkInTime, 'HH:mm'),
                    sub: format(checkInTime, 'EEEE, MMMM d'),
                  },
                  {
                    icon: LogOut, label: 'Check Out', iconBg: 'bg-red-50', iconColor: 'text-red-500',
                    value: format(result.checkOutTime, 'HH:mm'),
                    sub: format(result.checkOutTime, 'EEEE, MMMM d'),
                  },
                  {
                    icon: Timer, label: 'Duration', iconBg: 'bg-slate-100', iconColor: 'text-slate-600',
                    value: msToHm(result.totalMs).label,
                    sub: `of ${WORK_HOURS}h expected`,
                  },
                  {
                    icon: Calendar, label: 'Date', iconBg: 'bg-purple-50', iconColor: 'text-purple-600',
                    value: format(checkInTime, 'MMM d, yyyy'),
                    sub: format(checkInTime, 'EEEE'),
                  },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${row.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <row.icon size={16} className={row.iconColor} />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-400" style={{ fontSize: '11px' }}>{row.label}</p>
                      <p className="text-slate-800 font-bold" style={{ fontSize: '14px' }}>{row.value}</p>
                    </div>
                    <span className="text-slate-400" style={{ fontSize: '11px' }}>{row.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              <div className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 ${statusConfig.bg}`}>
                <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                <span className={`font-semibold ${statusConfig.color}`} style={{ fontSize: '13px' }}>
                  {statusConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5 bg-emerald-50">
                <MapPin size={14} className="text-emerald-600" />
                <span className="text-emerald-700 font-semibold" style={{ fontSize: '13px' }}>{OFFICE_CONFIG.name}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-slate-900 text-white font-bold rounded-3xl active:scale-95 transition-transform"
              style={{ height: '56px', fontSize: '15px' }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
