import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ChevronLeft, CheckCircle2, Clock, Edit2, XCircle,
  CalendarDays, User, Building2, Paperclip, AlertTriangle,
} from 'lucide-react';
import {
  requestsStore, REQUEST_TYPE_META, STATUS_META,
  type AttendanceRequest,
} from '../data/requestsStore';

export default function RequestDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [req, setReq] = useState<AttendanceRequest | null>(null);
  const [showCancel, setShowCancel] = useState(false);

  useEffect(() => {
    if (id) setReq(requestsStore.getById(id) ?? null);
  }, [id]);

  if (!req) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400" style={{ fontSize: '14px' }}>
        Request not found.
      </div>
    );
  }

  const tm = REQUEST_TYPE_META[req.type];
  const sm = STATUS_META[req.status];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const handleCancel = () => {
    requestsStore.cancel(req.id);
    setReq(requestsStore.getById(req.id) ?? req);
    setShowCancel(false);
  };

  const canEdit   = req.status === 'draft' || req.status === 'needs_revision';
  const canCancel = req.status === 'pending';

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100dvh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 bg-white flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center"
        >
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
            <div className={`w-12 h-12 rounded-2xl ${tm.bg} flex items-center justify-center flex-shrink-0`} style={{ fontSize: '22px' }}>
              {tm.icon}
            </div>
            <div>
              <p className={`font-bold ${tm.color}`} style={{ fontSize: '16px' }}>{tm.label}</p>
              <p className="text-slate-400 font-medium" style={{ fontSize: '12px' }}>{req.id}</p>
            </div>
          </div>
        </div>

        {/* Common info */}
        <Section title="Request Info">
          <InfoRow icon={<CalendarDays size={14} className="text-slate-400" />} label="Request Date">
            {formatDate(req.requestDate)}
            {req.requestEndDate && ` → ${formatDate(req.requestEndDate)}`}
          </InfoRow>
          <InfoRow icon={<CalendarDays size={14} className="text-slate-400" />} label="Submitted">
            {formatDate(req.submittedDate)}
          </InfoRow>
          <InfoRow icon={<User size={14} className="text-slate-400" />} label="Approver">
            {req.approver}
          </InfoRow>
          <InfoRow icon={<Building2 size={14} className="text-slate-400" />} label="Branch">
            {req.branch}
          </InfoRow>
        </Section>

        {/* Type-specific details */}
        {req.type === 'leave' && (
          <Section title="Leave Details">
            {req.leaveType && <InfoRow label="Leave Type">{req.leaveType}</InfoRow>}
            {req.halfDay ? (
              <InfoRow label="Duration">Half Day ({req.halfDayPart})</InfoRow>
            ) : (
              req.totalDays !== undefined && (
                <InfoRow label="Total Days">{req.totalDays} day{req.totalDays !== 1 ? 's' : ''}</InfoRow>
              )
            )}
          </Section>
        )}

        {req.type === 'permission' && (
          <Section title="Permission Details">
            {req.permissionType && <InfoRow label="Permission Type">{req.permissionType}</InfoRow>}
            {req.halfDay && (
              <InfoRow label="Duration">Half Day ({req.halfDayPart})</InfoRow>
            )}
          </Section>
        )}

        {req.type === 'sick_leave' && req.doctorInfo && (
          <Section title="Medical Details">
            <InfoRow label="Doctor / Clinic">{req.doctorInfo}</InfoRow>
          </Section>
        )}

        {req.type === 'attendance_correction' && (
          <Section title="Attendance Correction">
            {req.correctionType && <InfoRow label="Correction Type">{req.correctionType}</InfoRow>}
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div className="bg-red-50 rounded-2xl p-3">
                <p className="text-red-400 font-semibold mb-2" style={{ fontSize: '10px' }}>CURRENT</p>
                <p className="text-slate-600" style={{ fontSize: '11px' }}>Check In: <span className="font-medium text-slate-800">{req.currentCheckIn ?? '—'}</span></p>
                <p className="text-slate-600" style={{ fontSize: '11px' }}>Check Out: <span className="font-medium text-slate-800">{req.currentCheckOut ?? '—'}</span></p>
                <p className="text-slate-600" style={{ fontSize: '11px' }}>Status: <span className="font-medium text-red-600">{req.currentStatus ?? '—'}</span></p>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-3">
                <p className="text-emerald-500 font-semibold mb-2" style={{ fontSize: '10px' }}>REQUESTED</p>
                <p className="text-slate-600" style={{ fontSize: '11px' }}>Check In: <span className="font-medium text-slate-800">{req.requestedCheckIn ?? '—'}</span></p>
                <p className="text-slate-600" style={{ fontSize: '11px' }}>Check Out: <span className="font-medium text-slate-800">{req.requestedCheckOut ?? '—'}</span></p>
                {req.requestedStatus && (
                  <p className="text-slate-600" style={{ fontSize: '11px' }}>Status: <span className="font-medium text-emerald-600">{req.requestedStatus}</span></p>
                )}
              </div>
            </div>
          </Section>
        )}

        {req.type === 'overtime' && (
          <Section title="Overtime Details">
            {req.overtimeType && <InfoRow label="Overtime Type">{req.overtimeType}</InfoRow>}
            {req.overtimeStart && req.overtimeEnd && (
              <InfoRow label="Time">{req.overtimeStart} – {req.overtimeEnd}</InfoRow>
            )}
            {req.overtimeDuration && <InfoRow label="Duration">{req.overtimeDuration}</InfoRow>}
            {req.projectTask && <InfoRow label="Project / Task">{req.projectTask}</InfoRow>}
          </Section>
        )}

        {/* Reason */}
        <Section title="Reason">
          <p className="text-slate-700 leading-relaxed" style={{ fontSize: '13px' }}>{req.reason}</p>
        </Section>

        {/* Attachment */}
        {req.attachmentName && (
          <Section title="Attachment">
            <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Paperclip size={15} className="text-blue-600" />
              </div>
              <span className="text-slate-700 font-medium truncate" style={{ fontSize: '13px' }}>{req.attachmentName}</span>
            </div>
          </Section>
        )}

        {/* Admin note */}
        {req.adminNote && (
          <div className="mx-4 mb-4">
            <div className={`rounded-2xl p-4 border ${
              req.status === 'needs_revision'
                ? 'bg-orange-50 border-orange-100'
                : 'bg-red-50 border-red-100'
            }`}>
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className={req.status === 'needs_revision' ? 'text-orange-500 mt-0.5 flex-shrink-0' : 'text-red-500 mt-0.5 flex-shrink-0'} />
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
            {req.type === 'leave' && 'This request will mark you as On Leave for the selected date(s).'}
            {req.type === 'permission' && 'This request will adjust your attendance record for the selected date.'}
            {req.type === 'sick_leave' && 'This request will mark you as Sick Leave for the selected date.'}
            {req.type === 'attendance_correction' && 'Attendance records will be updated upon approval.'}
            {req.type === 'overtime' && 'Overtime hours will be recorded and included in payroll upon approval.'}
          </p>
        </div>

        {/* Timeline */}
        <Section title="Timeline">
          <div className="space-y-0">
            {req.timeline.map((event, i) => {
              const isLast = i === req.timeline.length - 1;
              return (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      event.done ? 'bg-emerald-100' : 'bg-slate-100'
                    }`}>
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
                      <p className="text-slate-400 mt-0.5" style={{ fontSize: '11px' }}>{event.time}</p>
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancel(false)} />
          <div className="relative bg-white rounded-t-3xl p-5 pb-8">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <p className="text-slate-800 font-bold mb-2" style={{ fontSize: '17px' }}>Cancel Request?</p>
            <p className="text-slate-500 mb-6 leading-relaxed" style={{ fontSize: '13px' }}>
              This request will be permanently cancelled and cannot be undone. Are you sure you want to continue?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancel(false)}
                className="flex-1 border-2 border-slate-200 rounded-2xl text-slate-600 font-semibold"
                style={{ height: 48, fontSize: '14px' }}
              >
                Keep Request
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-red-500 text-white rounded-2xl font-bold"
                style={{ height: 48, fontSize: '14px' }}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
      <span className="text-slate-400 flex-shrink-0" style={{ fontSize: '12px', minWidth: 90 }}>{label}</span>
      <span className="text-slate-700 font-medium text-right flex-1" style={{ fontSize: '12px' }}>{children}</span>
    </div>
  );
}
