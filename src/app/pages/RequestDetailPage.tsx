import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ChevronLeft, CheckCircle2, Clock, Edit2, XCircle,
  CalendarDays, User, Building2, Paperclip, AlertTriangle,
} from 'lucide-react';
import { REQUEST_TYPE_META, STATUS_META } from '../data/requestsStore';
import type { RequestType, RequestStatus } from '../data/requestsStore';
import { requestsService, type MappedRequest } from '../../services/requestsService';
import { ApiError } from '../../lib/api';

// ── Label formatters ──────────────────────────────────────────────────────────

function fmtDayDuration(d: string | null) {
  if (!d) return null;
  if (d === 'full_day')    return 'Full Day';
  if (d === 'first_half')  return 'Half Day (Morning)';
  if (d === 'second_half') return 'Half Day (Afternoon)';
  return d;
}

function fmtPermissionType(v: string | null) {
  if (!v) return null;
  const map: Record<string, string> = {
    personal_permission: 'Personal Permission',
    family_matter:       'Family Matter',
    urgent_matter:       'Urgent Matter',
    other:               'Other',
  };
  return map[v] ?? v;
}

function fmtCorrectionType(v: string | null) {
  if (!v) return null;
  const map: Record<string, string> = {
    forgot_check_in:            'Forgot Check-in',
    forgot_check_out:           'Forgot Check-out',
    incorrect_check_in_time:    'Incorrect Check-in Time',
    incorrect_check_out_time:   'Incorrect Check-out Time',
    wrong_attendance_status:    'Wrong Attendance Status',
    location_issue:             'Location Issue',
    other:                      'Other',
  };
  return map[v] ?? v;
}

function fmtOvertimeType(v: string | null) {
  if (!v) return null;
  const map: Record<string, string> = {
    before_shift: 'Before Shift',
    after_shift:  'After Shift',
    rest_day:     'Rest Day / Holiday',
  };
  return map[v] ?? v;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtTimestamp(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function fmtOtMinutes(m: number | null) {
  if (m === null || m === undefined) return null;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RequestDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [req, setReq] = useState<MappedRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError('');
    requestsService.getRequest(Number(id))
      .then(data => setReq(data))
      .catch(err => {
        if (err instanceof ApiError) setError(err.message);
        else setError('Failed to load request.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleCancel = async () => {
    if (!req) return;
    setCancelling(true);
    setCancelError('');
    try {
      await requestsService.cancelRequest(req.id);
      setShowCancel(false);
      load();
    } catch (err) {
      if (err instanceof ApiError) setCancelError(err.message);
      else setCancelError('Failed to cancel request. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <svg className="animate-spin w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      </div>
    );
  }

  if (error || !req) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <p className="text-red-500 mb-3" style={{ fontSize: '13px' }}>{error || 'Request not found.'}</p>
        <button onClick={load} className="text-blue-600 font-semibold" style={{ fontSize: '13px' }}>Try Again</button>
      </div>
    );
  }

  const tm       = REQUEST_TYPE_META[req.type as RequestType];
  const sm       = STATUS_META[req.status as RequestStatus];
  const canEdit   = req.isEditable;
  const canCancel = !req.isFinal;

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100dvh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 bg-white flex-shrink-0">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <ChevronLeft size={18} className="text-slate-600" />
        </button>
        <p className="text-slate-800 font-bold flex-1" style={{ fontSize: '16px' }}>Request Detail</p>
        <span className={`px-3 py-1 rounded-full font-semibold ${sm.bg} ${sm.color}`} style={{ fontSize: '11px' }}>
          {sm.label}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">

        {/* Type hero */}
        <div className="mx-4 mt-4 mb-3 bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl ${tm.bg} flex items-center justify-center flex-shrink-0`}>
              <tm.Icon size={24} className={tm.color} />
            </div>
            <div>
              <p className={`font-bold ${tm.color}`} style={{ fontSize: '16px' }}>{tm.label}</p>
              <p className="text-slate-400 font-medium" style={{ fontSize: '12px' }}>{req.requestCode}</p>
            </div>
          </div>
        </div>

        {/* Request Info */}
        <Section title="Request Info">
          {req.startDate && (
            <InfoRow icon={<CalendarDays size={14} className="text-slate-400" />} label="Date">
              {fmtDate(req.startDate)}
              {req.endDate && req.endDate !== req.startDate && ` → ${fmtDate(req.endDate)}`}
            </InfoRow>
          )}
          {req.submittedAt && (
            <InfoRow icon={<CalendarDays size={14} className="text-slate-400" />} label="Submitted">
              {fmtDate(req.submittedAt)}
            </InfoRow>
          )}
          <InfoRow icon={<User size={14} className="text-slate-400" />} label="Approver">
            {req.approver}
          </InfoRow>
          <InfoRow icon={<Building2 size={14} className="text-slate-400" />} label="Branch">
            {req.branch}
          </InfoRow>
        </Section>

        {/* Type-specific details */}
        <Section title={
          req.type === 'leave'                ? 'Leave Details'
          : req.type === 'permission'         ? 'Permission Details'
          : req.type === 'sick_leave'         ? 'Sick Leave Details'
          : req.type === 'overtime'           ? 'Overtime Details'
          : 'Correction Details'
        }>
          {/* Leave / Permission — duration */}
          {fmtDayDuration(req.dayDuration) && (
            <InfoRow label="Duration">{fmtDayDuration(req.dayDuration)}</InfoRow>
          )}
          {req.totalDays !== null && req.totalDays !== undefined && req.totalDays > 0 && (
            <InfoRow label="Total Days">
              {req.totalDays} day{req.totalDays !== 1 ? 's' : ''}
            </InfoRow>
          )}

          {/* Permission type */}
          {fmtPermissionType(req.permissionType) && (
            <InfoRow label="Permission Type">{fmtPermissionType(req.permissionType)}</InfoRow>
          )}

          {/* Sick leave — doctor / clinic */}
          {req.doctorName && (
            <InfoRow label="Doctor">{req.doctorName}</InfoRow>
          )}
          {req.clinicName && (
            <InfoRow label="Clinic / Hospital">{req.clinicName}</InfoRow>
          )}

          {/* Attendance correction */}
          {req.type === 'attendance_correction' && (
            <>
              {req.attendanceDate && (
                <InfoRow label="Attendance Date">{fmtDate(req.attendanceDate)}</InfoRow>
              )}
              {fmtCorrectionType(req.correctionType) && (
                <InfoRow label="Correction Type">{fmtCorrectionType(req.correctionType)}</InfoRow>
              )}
              {(req.currentCheckIn || req.currentCheckOut || req.currentStatus) && (
                <>
                  <InfoRow label="Was Check-in">{fmtTimestamp(req.currentCheckIn)}</InfoRow>
                  <InfoRow label="Was Check-out">{fmtTimestamp(req.currentCheckOut)}</InfoRow>
                  {req.currentStatus && (
                    <InfoRow label="Was Status">{req.currentStatus}</InfoRow>
                  )}
                </>
              )}
              {req.requestedCheckIn && (
                <InfoRow label="Req. Check-in">{req.requestedCheckIn}</InfoRow>
              )}
              {req.requestedCheckOut && (
                <InfoRow label="Req. Check-out">{req.requestedCheckOut}</InfoRow>
              )}
            </>
          )}

          {/* Overtime */}
          {req.type === 'overtime' && (
            <>
              {req.overtimeDate && (
                <InfoRow label="Overtime Date">{fmtDate(req.overtimeDate)}</InfoRow>
              )}
              {fmtOvertimeType(req.overtimeType) && (
                <InfoRow label="Overtime Type">{fmtOvertimeType(req.overtimeType)}</InfoRow>
              )}
              {req.overtimeStart && req.overtimeEnd && (
                <InfoRow label="Time">{req.overtimeStart} – {req.overtimeEnd}</InfoRow>
              )}
              {fmtOtMinutes(req.totalOvertimeMinutes) && (
                <InfoRow label="Total Duration">{fmtOtMinutes(req.totalOvertimeMinutes)}</InfoRow>
              )}
              {req.projectTask && (
                <InfoRow label="Project / Task">{req.projectTask}</InfoRow>
              )}
            </>
          )}
        </Section>

        {/* Reason */}
        {req.reason && (
          <Section title="Reason">
            <p className="text-slate-700 leading-relaxed" style={{ fontSize: '13px' }}>{req.reason}</p>
          </Section>
        )}

        {/* Attachments */}
        {req.attachments.length > 0 && (
          <Section title="Attachments">
            <div className="space-y-2">
              {req.attachments.map(att => (
                <a
                  key={att.id}
                  href={att.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Paperclip size={15} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-slate-700 font-medium truncate block" style={{ fontSize: '13px' }}>{att.file_name}</span>
                    {att.document_type === 'medical_certificate' && (
                      <span className="text-blue-500" style={{ fontSize: '10px' }}>Medical Certificate</span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </Section>
        )}

        {/* Admin note */}
        {req.adminNote && (
          <div className="mx-4 mb-4">
            <div className={`rounded-2xl p-4 border ${
              req.status === 'needs_revision' ? 'bg-orange-50 border-orange-100' : 'bg-red-50 border-red-100'
            }`}>
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className={`mt-0.5 flex-shrink-0 ${req.status === 'needs_revision' ? 'text-orange-500' : 'text-red-500'}`} />
                <div>
                  <p className={`font-semibold mb-1 ${req.status === 'needs_revision' ? 'text-orange-700' : 'text-red-700'}`} style={{ fontSize: '12px' }}>
                    {req.status === 'needs_revision' ? 'Revision Required' : 'Rejection Reason'}
                  </p>
                  <p className={`leading-relaxed ${req.status === 'needs_revision' ? 'text-orange-600' : 'text-red-600'}`} style={{ fontSize: '12px' }}>
                    {req.adminNote}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Impact banner */}
        <div className="mx-4 mb-4 bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-blue-700 font-semibold mb-1" style={{ fontSize: '12px' }}>Attendance Impact</p>
          <p className="text-blue-600" style={{ fontSize: '12px' }}>
            {req.type === 'leave'                && 'This request will mark you as On Leave for the selected date(s).'}
            {req.type === 'permission'           && 'This request will adjust your attendance record for the selected date.'}
            {req.type === 'sick_leave'           && 'This request will mark you as Sick Leave for the selected date.'}
            {req.type === 'attendance_correction'&& 'Attendance records will be updated upon approval.'}
            {req.type === 'overtime'             && 'Overtime hours will be recorded and included in payroll upon approval.'}
          </p>
        </div>

        {/* Timeline */}
        {req.timeline.length > 0 && (
          <Section title="Timeline">
            <div className="space-y-0">
              {req.timeline.map((event, i) => {
                const isLast = i === req.timeline.length - 1;
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${event.done ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                        {event.done
                          ? <CheckCircle2 size={14} className="text-emerald-600" />
                          : <Clock size={14} className="text-slate-400" />
                        }
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 flex-1 my-1 ${event.done ? 'bg-emerald-200' : 'bg-slate-200'}`} style={{ minHeight: 20 }} />
                      )}
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <p className={`font-medium leading-snug ${event.done ? 'text-slate-800' : 'text-slate-400'}`} style={{ fontSize: '13px' }}>
                        {event.label}
                      </p>
                      {event.time && (
                        <p className="text-slate-400 mt-0.5" style={{ fontSize: '11px' }}>{fmtDateTime(event.time)}</p>
                      )}
                      {event.note && (
                        <p className="text-slate-500 mt-0.5 italic" style={{ fontSize: '11px' }}>{event.note}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Action buttons */}
        {(canEdit || canCancel) && (
          <div className="mx-4 mt-2 flex gap-3">
            {canEdit && (
              <button
                onClick={() => navigate(`/dashboard/requests/form/${req.type}`, { state: { editId: req.id } })}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-blue-600 rounded-2xl text-blue-600 font-semibold"
                style={{ height: 48, fontSize: '14px' }}
              >
                <Edit2 size={15} />
                Edit Request
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => setShowCancel(true)}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-red-200 rounded-2xl text-red-500 font-semibold"
                style={{ height: 48, fontSize: '14px' }}
              >
                <XCircle size={15} />
                Cancel Request
              </button>
            )}
          </div>
        )}
      </div>

      {/* Cancel confirmation sheet */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ maxWidth: 430, margin: '0 auto' }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { if (!cancelling) setShowCancel(false); }} />
          <div className="relative bg-white rounded-t-3xl p-5 pb-8">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <p className="text-slate-800 font-bold mb-2" style={{ fontSize: '17px' }}>Cancel Request?</p>
            <p className="text-slate-500 mb-4 leading-relaxed" style={{ fontSize: '13px' }}>
              This request will be permanently cancelled and cannot be undone. Are you sure you want to continue?
            </p>
            {cancelError && (
              <p className="text-red-500 mb-4" style={{ fontSize: '12px' }}>{cancelError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancel(false)}
                disabled={cancelling}
                className="flex-1 border-2 border-slate-200 rounded-2xl text-slate-600 font-semibold disabled:opacity-50"
                style={{ height: 48, fontSize: '14px' }}
              >
                Keep Request
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 bg-red-500 text-white rounded-2xl font-bold disabled:opacity-50"
                style={{ height: 48, fontSize: '14px' }}
              >
                {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared UI pieces ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-4 mb-4 bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
      <p className="text-slate-400 font-semibold mb-3" style={{ fontSize: '11px' }}>{title.toUpperCase()}</p>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, children }: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-slate-50 last:border-0">
      {icon && <span className="mt-0.5 flex-shrink-0">{icon}</span>}
      <span className="text-slate-400 flex-shrink-0" style={{ fontSize: '12px', minWidth: 110 }}>{label}</span>
      <span className="text-slate-700 font-medium text-right flex-1" style={{ fontSize: '12px' }}>{children}</span>
    </div>
  );
}
