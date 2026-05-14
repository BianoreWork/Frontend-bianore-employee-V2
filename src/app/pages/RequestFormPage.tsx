import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ChevronLeft, Paperclip, AlertCircle, Info, CheckCircle2,
  X, CalendarDays, Clock, Upload, FileText, ImageIcon,
} from 'lucide-react';
import type { RequestType } from '../data/requestsStore';
import { requestsService } from '../../services/requestsService';
import { attendanceService } from '../../services/attendanceService';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../lib/api';

// ── Value maps (display label → backend enum value) ──────────────────────────

const PERM_TYPE_TO_API: Record<string, string> = {
  'Personal Permission': 'personal_permission',
  'Family Matter':       'family_matter',
  'Urgent Matter':       'urgent_matter',
  'Other':               'other',
};

const CORR_TYPE_TO_API: Record<string, string> = {
  'Forgot Check-in':            'forgot_check_in',
  'Forgot Check-out':           'forgot_check_out',
  'Incorrect Check-in Time':    'incorrect_check_in_time',
  'Incorrect Check-out Time':   'incorrect_check_out_time',
  'Wrong Attendance Status':    'wrong_attendance_status',
  'Location Issue':             'location_issue',
  'Other':                      'other',
};

const OT_TYPE_TO_API: Record<string, string> = {
  'Before Shift':       'before_shift',
  'After Shift':        'after_shift',
  'Rest Day / Holiday': 'rest_day',
};

// ── Sub-components ────────────────────────────────────────────────────────────

interface FormErrors { [key: string]: string }

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-600 font-semibold mb-1.5" style={{ fontSize: '12px' }}>{children}</p>;
}

function FieldWrap({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      {children}
      {error && (
        <div className="flex items-center gap-1 mt-1">
          <AlertCircle size={11} className="text-red-500" />
          <span className="text-red-500" style={{ fontSize: '11px' }}>{error}</span>
        </div>
      )}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', readOnly = false }: {
  value: string; onChange?: (v: string) => void; placeholder?: string;
  type?: string; readOnly?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`w-full border rounded-2xl px-4 py-3 text-slate-700 outline-none transition-colors ${
        readOnly
          ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
          : 'bg-white border-slate-200 focus:border-blue-400'
      }`}
      style={{ fontSize: '14px' }}
    />
  );
}

function Textarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 outline-none focus:border-blue-400 resize-none transition-colors"
      style={{ fontSize: '14px' }}
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full border border-slate-200 bg-white rounded-2xl px-4 py-3 text-slate-700 outline-none focus:border-blue-400 appearance-none"
      style={{ fontSize: '14px' }}
    >
      <option value="">Select…</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function ToggleGroup({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex gap-2">
      {options.map(o => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`flex-1 py-2.5 rounded-2xl border font-semibold transition-all ${
            value === o ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600'
          }`}
          style={{ fontSize: '13px' }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function ImpactBanner({ text }: { text: string }) {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex gap-2 items-start mb-5">
      <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
      <p className="text-blue-700" style={{ fontSize: '12px' }}>{text}</p>
    </div>
  );
}

function AttachmentField({ fileName, file, onChange }: {
  fileName: string;
  file: File | null;
  onChange: (name: string, f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { alert('File size must be under 5 MB.'); return; }
    onChange(f.name, f);
    if (f.type.startsWith('image/')) {
      setFileType('image');
      const url = URL.createObjectURL(f);
      setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
    } else {
      setFileType('pdf');
      setPreviewUrl(null);
    }
  };

  const handleRemove = () => {
    onChange('', null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileType(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {!fileName ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center gap-3 border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl px-4 py-4 transition-colors active:bg-slate-100"
        >
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
            <Paperclip size={15} className="text-slate-400" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-slate-500 font-medium" style={{ fontSize: '13px' }}>Tap to attach file</p>
            <p className="text-slate-400" style={{ fontSize: '11px' }}>PDF, JPG, or PNG · Max 5 MB</p>
          </div>
          <Upload size={15} className="text-slate-300" />
        </button>
      ) : (
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          {fileType === 'image' && previewUrl && (
            <div className="relative bg-slate-100" style={{ height: 160 }}>
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <span className="absolute bottom-2 left-3 text-white font-semibold" style={{ fontSize: '11px' }}>Preview</span>
            </div>
          )}
          <div className={`flex items-center gap-3 px-4 py-3 ${fileType === 'image' ? 'bg-white border-t border-slate-100' : 'bg-blue-50'}`}>
            {fileType === 'pdf' ? (
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-red-600" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <ImageIcon size={18} className="text-blue-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-slate-700 font-semibold truncate" style={{ fontSize: '13px' }}>{fileName}</p>
              <p className="text-slate-400" style={{ fontSize: '11px' }}>{fileType === 'pdf' ? 'PDF Document' : 'Image File'} · Ready to submit</p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 active:bg-slate-200"
            >
              <X size={14} className="text-slate-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReadOnlyCard({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
      {rows.map(r => (
        <div key={r.label} className="flex justify-between">
          <span className="text-slate-400" style={{ fontSize: '12px' }}>{r.label}</span>
          <span className="text-slate-700 font-semibold" style={{ fontSize: '12px' }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function SuccessScreen({ type, isDraft, reqId, approver, reqCode, onView, onBack }: {
  type: RequestType; isDraft: boolean; reqId: number; approver: string; reqCode: string;
  onView: () => void; onBack: () => void;
}) {
  const labels: Record<RequestType, string> = {
    leave: 'Leave Request', permission: 'Permission Request',
    sick_leave: 'Sick Leave Request', attendance_correction: 'Attendance Correction',
    overtime: 'Overtime Request',
  };
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mb-5 relative">
        <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
        <CheckCircle2 size={44} className="text-emerald-500" />
      </div>
      <p className="text-slate-800 font-bold mb-2" style={{ fontSize: '22px' }}>
        {isDraft ? 'Saved as Draft' : 'Request Submitted!'}
      </p>
      <p className="text-slate-400 mb-6" style={{ fontSize: '13px' }}>
        {isDraft
          ? 'Your request has been saved. You can edit and submit it later.'
          : 'Your request has been submitted and is waiting for approval.'
        }
      </p>
      <div className="w-full bg-slate-50 rounded-2xl p-4 mb-6 space-y-2 text-left">
        {[
          { label: 'Request Type', value: labels[type] },
          { label: 'Request ID',   value: reqCode },
          { label: 'Submitted',    value: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
          { label: 'Approver',     value: approver },
          { label: 'Status',       value: isDraft ? 'Draft' : 'Pending' },
        ].map(r => (
          <div key={r.label} className="flex justify-between">
            <span className="text-slate-400" style={{ fontSize: '12px' }}>{r.label}</span>
            <span className="text-slate-700 font-semibold" style={{ fontSize: '12px' }}>{r.value}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 w-full">
        <button onClick={onBack} className="flex-1 border-2 border-slate-200 rounded-2xl text-slate-700 font-semibold" style={{ height: 52, fontSize: '14px' }}>
          Back
        </button>
        <button onClick={onView} className="flex-1 bg-blue-600 text-white rounded-2xl font-semibold" style={{ height: 52, fontSize: '14px' }}>
          View Request
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RequestFormPage() {
  const { type } = useParams<{ type: RequestType }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [submitted, setSubmitted] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [savedId, setSavedId] = useState(0);
  const [savedCode, setSavedCode] = useState('');
  const [savedApprover, setSavedApprover] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const [reason, setReason] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  // Leave fields
  const [leaveType, setLeaveType] = useState('');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveDayType, setLeaveDayType] = useState('Full Day');
  const [leaveHalfPart, setLeaveHalfPart] = useState('First Half');

  // Permission fields
  const [permDate, setPermDate] = useState('');
  const [permType, setPermType] = useState('');
  const [permDayType, setPermDayType] = useState('Full Day');
  const [permHalfPart, setPermHalfPart] = useState('First Half');

  // Sick leave fields
  const [sickStart, setSickStart] = useState('');
  const [sickEnd, setSickEnd] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [clinicName, setClinicName] = useState('');

  // Attendance correction fields
  const [corrDate, setCorrDate] = useState('');
  const [corrType, setCorrType] = useState('');
  const [reqCheckIn, setReqCheckIn] = useState('');
  const [reqCheckOut, setReqCheckOut] = useState('');
  const [corrScheduleId, setCorrScheduleId] = useState<number | null>(null);
  const [corrScheduleLoading, setCorrScheduleLoading] = useState(false);
  const [corrScheduleError, setCorrScheduleError] = useState('');
  const [corrAttendance, setCorrAttendance] = useState<{
    clockIn: string | null;
    clockOut: string | null;
    status: string | null;
  } | null>(null);

  // Overtime fields
  const [otDate, setOtDate] = useState('');
  const [otType, setOtType] = useState('');
  const [otStart, setOtStart] = useState('');
  const [otEnd, setOtEnd] = useState('');
  const [otProject, setOtProject] = useState('');
  const [otScheduleId, setOtScheduleId] = useState<number | null>(null);
  const [otScheduleLoading, setOtScheduleLoading] = useState(false);
  const [otScheduleError, setOtScheduleError] = useState('');
  const [otShift, setOtShift] = useState<{
    name: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  if (!type) return null;

  const approverDisplay = user?.employee?.approver?.email ?? 'Auto-assigned by HR';
  const branchDisplay   = user?.employee?.branch?.name  ?? 'Auto-assigned';

  // ── Fetch attendance detail for a given date ────────────────────────────────

  const fetchCorrectionDetail = async (date: string) => {
    setCorrScheduleId(null);
    setCorrScheduleError('');
    setCorrAttendance(null);
    if (!date) return;
    setCorrScheduleLoading(true);
    try {
      const detail = await attendanceService.detail(date);
      const d = detail.data;
      const sid = d?.schedule_id ?? d?.schedule?.id ?? null;
      if (sid) {
        setCorrScheduleId(Number(sid));
      } else {
        setCorrScheduleError('No schedule found for this date. Please ask HR to add a schedule.');
      }
      if (d) {
        setCorrAttendance({
          clockIn:  d.clock_in_at  ?? null,
          clockOut: d.clock_out_at ?? null,
          status:   d.is_overridden ? (d.override_status ?? null) : (d.system_status ?? null),
        });
      }
    } catch {
      setCorrScheduleError('Could not load attendance data. Please try again.');
    } finally {
      setCorrScheduleLoading(false);
    }
  };

  const fetchOvertimeDetail = async (date: string) => {
    setOtScheduleId(null);
    setOtScheduleError('');
    setOtShift(null);
    if (!date) return;
    setOtScheduleLoading(true);
    try {
      const detail = await attendanceService.detail(date);
      const d = detail.data;
      const sid = d?.schedule_id ?? d?.schedule?.id ?? null;
      if (sid) {
        setOtScheduleId(Number(sid));
      } else {
        setOtScheduleError('No schedule found for this date. Ask HR to add a schedule for this day.');
      }
      const sched = d?.schedule;
      if (sched) {
        const shift = sched.shift;
        setOtShift({
          name:      (sched.shift_name ?? shift?.name ?? 'Scheduled Shift') as string,
          startTime: (sched.start_time ?? shift?.start_time ?? '') as string,
          endTime:   (sched.end_time   ?? shift?.end_time   ?? '') as string,
        });
      }
    } catch {
      setOtScheduleError('Could not load schedule info. Please try again.');
    } finally {
      setOtScheduleLoading(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const fmtTime = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!reason.trim()) errs.reason = 'Reason is required';
    if (type === 'leave') {
      if (!leaveStart) errs.leaveStart = 'Start date is required';
      if (!leaveEnd)   errs.leaveEnd   = 'End date is required';
      if (leaveStart && leaveEnd && leaveEnd < leaveStart) errs.leaveEnd = 'Invalid date range';
    }
    if (type === 'permission' && !permDate)  errs.permDate  = 'Permission date is required';
    if (type === 'sick_leave' && !sickStart) errs.sickStart = 'Sick leave date is required';
    if (type === 'attendance_correction') {
      if (!corrDate) errs.corrDate = 'Attendance date is required';
      if (!corrType) errs.corrType = 'Correction type is required';
    }
    if (type === 'overtime') {
      if (!otDate)  errs.otDate  = 'Overtime date is required';
      if (!otStart) errs.otStart = 'Start time is required';
      if (!otEnd)   errs.otEnd   = 'End time is required';
      if (otStart && otEnd && otEnd <= otStart) errs.otEnd = 'End time must be after start time';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const calcOtDuration = () => {
    if (!otStart || !otEnd) return '—';
    const [sh, sm] = otStart.split(':').map(Number);
    const [eh, em] = otEnd.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff <= 0) return '—';
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  const calcLeaveDays = () => {
    if (!leaveStart || !leaveEnd) return 0;
    const diff = (new Date(leaveEnd).getTime() - new Date(leaveStart).getTime()) / 86400000 + 1;
    if (diff <= 0) return 0;
    return leaveDayType === 'Half Day' ? 0.5 : diff;
  };

  const getApiRequestType = (): string => {
    if (type === 'leave') {
      return leaveType === 'Special Leave' ? 'special_leave' : 'annual_leave';
    }
    return type;
  };

  const getTitle = (): string => {
    const map: Record<string, string> = {
      leave:                  `${leaveType || 'Annual Leave'} Request`,
      permission:             `Permission${permType ? ' - ' + permType : ''}`,
      sick_leave:             'Sick Leave Request',
      attendance_correction:  `Attendance Correction${corrType ? ' - ' + corrType : ''}`,
      overtime:               `Overtime Request${otType ? ' - ' + otType : ''}`,
    };
    return map[type] || 'Request';
  };

  const getDayDuration = (): string | null => {
    if (type === 'leave') {
      if (leaveDayType === 'Half Day') return leaveHalfPart === 'First Half' ? 'first_half' : 'second_half';
      return 'full_day';
    }
    if (type === 'permission') {
      if (permDayType === 'Half Day') return permHalfPart === 'First Half' ? 'first_half' : 'second_half';
      return 'full_day';
    }
    return null;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async (draft: boolean) => {
    if (!draft && !validate()) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const fd = new FormData();
      fd.append('request_type', getApiRequestType());
      fd.append('title', getTitle());
      if (reason) fd.append('reason', reason);

      if (type === 'leave') {
        fd.append('start_date', leaveStart);
        fd.append('end_date', leaveEnd);
        const dur = getDayDuration();
        if (dur) fd.append('day_duration', dur);

      } else if (type === 'permission') {
        fd.append('start_date', permDate);
        fd.append('end_date', permDate);
        const dur = getDayDuration();
        if (dur) fd.append('day_duration', dur);
        if (permType) fd.append('permission_type', PERM_TYPE_TO_API[permType] ?? permType);

      } else if (type === 'sick_leave') {
        fd.append('start_date', sickStart);
        fd.append('end_date', sickEnd || sickStart);
        if (doctorName) fd.append('doctor_name', doctorName);
        if (clinicName) fd.append('clinic_name', clinicName);

      } else if (type === 'attendance_correction') {
        fd.append('attendance_date', corrDate);
        if (corrType) fd.append('correction_type', CORR_TYPE_TO_API[corrType] ?? corrType);
        if (corrScheduleId) fd.append('schedule_id', String(corrScheduleId));
        if (reqCheckIn)  fd.append('requested_check_in',  reqCheckIn);
        if (reqCheckOut) fd.append('requested_check_out', reqCheckOut);

      } else if (type === 'overtime') {
        fd.append('overtime_date',  otDate);
        if (otType)  fd.append('overtime_type',  OT_TYPE_TO_API[otType] ?? otType);
        fd.append('overtime_start', otStart);
        fd.append('overtime_end',   otEnd);
        if (otProject)    fd.append('project_task', otProject);
        if (otScheduleId) fd.append('schedule_id', String(otScheduleId));
      }

      if (attachmentFile) fd.append('files[]', attachmentFile);

      const result = await requestsService.createRequest(fd);
      const created = result.data;

      if (!draft) {
        await requestsService.submitRequest(created.id);
      }

      setSavedId(created.id);
      setSavedCode(created.request_code);
      setSavedApprover(created.approver?.email ?? approverDisplay);
      setIsDraft(draft);
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError) setSubmitError(err.message);
      else setSubmitError('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ───────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="flex flex-col" style={{ minHeight: 'calc(100dvh - 120px)' }}>
        <SuccessScreen
          type={type as RequestType}
          isDraft={isDraft}
          reqId={savedId}
          reqCode={savedCode}
          approver={savedApprover}
          onView={() => navigate(`/dashboard/requests/${savedId}`)}
          onBack={() => navigate('/dashboard/requests')}
        />
      </div>
    );
  }

  const titleMap: Record<string, string> = {
    leave: 'Leave Request', permission: 'Permission Request',
    sick_leave: 'Sick Leave Request', attendance_correction: 'Attendance Correction',
    overtime: 'Overtime Request',
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="pb-8">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 bg-white">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <ChevronLeft size={18} className="text-slate-600" />
        </button>
        <p className="text-slate-800 font-bold" style={{ fontSize: '16px' }}>{titleMap[type]}</p>
      </div>

      <div className="px-4 pt-4">

        {/* LEAVE */}
        {type === 'leave' && (
          <>
            <FieldWrap error={errors.leaveType}>
              <Label>Leave Type *</Label>
              <Select value={leaveType} onChange={setLeaveType} options={['Annual Leave', 'Special Leave']} />
            </FieldWrap>
            <FieldWrap error={errors.leaveStart}>
              <Label>Start Date *</Label>
              <Input type="date" value={leaveStart} onChange={setLeaveStart} />
            </FieldWrap>
            <FieldWrap error={errors.leaveEnd}>
              <Label>End Date *</Label>
              <Input type="date" value={leaveEnd} onChange={setLeaveEnd} />
            </FieldWrap>
            <FieldWrap>
              <Label>Duration</Label>
              <ToggleGroup value={leaveDayType} onChange={setLeaveDayType} options={['Full Day', 'Half Day']} />
            </FieldWrap>
            {leaveDayType === 'Half Day' && (
              <FieldWrap>
                <Label>Half Day Period</Label>
                <ToggleGroup value={leaveHalfPart} onChange={setLeaveHalfPart} options={['First Half', 'Second Half']} />
              </FieldWrap>
            )}
            {leaveStart && leaveEnd && calcLeaveDays() > 0 && (
              <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-3 mb-4">
                <CalendarDays size={14} className="text-blue-500" />
                <span className="text-slate-700 font-semibold" style={{ fontSize: '13px' }}>
                  Total: {calcLeaveDays()} {calcLeaveDays() === 1 ? 'day' : 'days'}
                </span>
              </div>
            )}
            <ImpactBanner text="Your attendance will be marked as On Leave after this request is approved." />
          </>
        )}

        {/* PERMISSION */}
        {type === 'permission' && (
          <>
            <FieldWrap error={errors.permDate}>
              <Label>Permission Date *</Label>
              <Input type="date" value={permDate} onChange={setPermDate} />
            </FieldWrap>
            <FieldWrap>
              <Label>Permission Type</Label>
              <Select value={permType} onChange={setPermType} options={['Personal Permission', 'Family Matter', 'Urgent Matter', 'Other']} />
            </FieldWrap>
            <FieldWrap>
              <Label>Duration</Label>
              <ToggleGroup value={permDayType} onChange={setPermDayType} options={['Full Day', 'Half Day']} />
            </FieldWrap>
            {permDayType === 'Half Day' && (
              <FieldWrap>
                <Label>Half Day Period</Label>
                <ToggleGroup value={permHalfPart} onChange={setPermHalfPart} options={['First Half', 'Second Half']} />
              </FieldWrap>
            )}
            <ImpactBanner text="Your attendance will be marked as Permission after this request is approved." />
          </>
        )}

        {/* SICK LEAVE */}
        {type === 'sick_leave' && (
          <>
            <FieldWrap error={errors.sickStart}>
              <Label>Sick Leave Date *</Label>
              <Input type="date" value={sickStart} onChange={setSickStart} />
            </FieldWrap>
            <FieldWrap>
              <Label>End Date (if more than one day)</Label>
              <Input type="date" value={sickEnd} onChange={setSickEnd} />
            </FieldWrap>
            {sickStart && (
              <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-3 mb-4">
                <Clock size={14} className="text-blue-500" />
                <span className="text-slate-700 font-semibold" style={{ fontSize: '13px' }}>
                  Duration: {sickEnd && sickEnd > sickStart
                    ? `${Math.round((new Date(sickEnd).getTime() - new Date(sickStart).getTime()) / 86400000 + 1)} days`
                    : '1 day'}
                </span>
              </div>
            )}
            <FieldWrap>
              <Label>Doctor Name</Label>
              <Input value={doctorName} onChange={setDoctorName} placeholder="e.g. Dr. Ahmad Pratama" />
            </FieldWrap>
            <FieldWrap>
              <Label>Clinic / Hospital</Label>
              <Input value={clinicName} onChange={setClinicName} placeholder="e.g. Klinik Sehat Bersama" />
            </FieldWrap>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex gap-2 items-start mb-4">
              <Info size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-amber-700" style={{ fontSize: '12px' }}>Medical certificate may be required based on company policy.</p>
            </div>
            <FieldWrap>
              <Label>Medical Certificate (if available)</Label>
              <AttachmentField
                fileName={attachmentName}
                file={attachmentFile}
                onChange={(name, f) => { setAttachmentName(name); setAttachmentFile(f); }}
              />
            </FieldWrap>
            <ImpactBanner text="Your attendance will be marked as Sick Leave after this request is approved." />
          </>
        )}

        {/* ATTENDANCE CORRECTION */}
        {type === 'attendance_correction' && (
          <>
            <FieldWrap error={errors.corrDate}>
              <Label>Attendance Date *</Label>
              <Input
                type="date"
                value={corrDate}
                onChange={v => { setCorrDate(v); fetchCorrectionDetail(v); }}
              />
            </FieldWrap>

            {corrScheduleLoading && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-slate-50 rounded-2xl">
                <svg className="animate-spin w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                <span className="text-slate-500" style={{ fontSize: '12px' }}>Loading attendance record…</span>
              </div>
            )}
            {corrScheduleError && !corrScheduleLoading && (
              <div className="flex items-start gap-2 mb-4 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-2xl">
                <AlertCircle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-amber-700" style={{ fontSize: '12px' }}>{corrScheduleError}</p>
              </div>
            )}

            {corrDate && !corrScheduleLoading && (
              <FieldWrap>
                <Label>Current Attendance Record</Label>
                <ReadOnlyCard rows={[
                  { label: 'Check In',  value: fmtTime(corrAttendance?.clockIn ?? null) },
                  { label: 'Check Out', value: fmtTime(corrAttendance?.clockOut ?? null) },
                  { label: 'Status',    value: corrAttendance?.status ?? '—' },
                ]} />
              </FieldWrap>
            )}

            <FieldWrap error={errors.corrType}>
              <Label>Correction Type *</Label>
              <Select
                value={corrType}
                onChange={setCorrType}
                options={['Forgot Check-in', 'Forgot Check-out', 'Incorrect Check-in Time', 'Incorrect Check-out Time', 'Wrong Attendance Status', 'Location Issue', 'Other']}
              />
            </FieldWrap>

            {(corrType === 'Forgot Check-in' || corrType === 'Incorrect Check-in Time') && (
              <FieldWrap>
                <Label>Requested Check-in Time</Label>
                <Input type="time" value={reqCheckIn} onChange={setReqCheckIn} />
              </FieldWrap>
            )}
            {(corrType === 'Forgot Check-out' || corrType === 'Incorrect Check-out Time') && (
              <FieldWrap>
                <Label>Requested Check-out Time</Label>
                <Input type="time" value={reqCheckOut} onChange={setReqCheckOut} />
              </FieldWrap>
            )}

            <ImpactBanner text="Your attendance record will be updated after this request is approved." />
          </>
        )}

        {/* OVERTIME */}
        {type === 'overtime' && (
          <>
            <FieldWrap error={errors.otDate}>
              <Label>Overtime Date *</Label>
              <Input
                type="date"
                value={otDate}
                onChange={v => { setOtDate(v); fetchOvertimeDetail(v); }}
              />
            </FieldWrap>

            {otScheduleLoading && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-slate-50 rounded-2xl">
                <svg className="animate-spin w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                <span className="text-slate-500" style={{ fontSize: '12px' }}>Loading schedule…</span>
              </div>
            )}
            {otScheduleError && !otScheduleLoading && (
              <div className="flex items-start gap-2 mb-4 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-2xl">
                <AlertCircle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-amber-700" style={{ fontSize: '12px' }}>{otScheduleError}</p>
              </div>
            )}

            <FieldWrap>
              <Label>Overtime Type</Label>
              <Select value={otType} onChange={setOtType} options={['Before Shift', 'After Shift', 'Rest Day / Holiday']} />
            </FieldWrap>

            {otDate && !otScheduleLoading && (
              <FieldWrap>
                <Label>Scheduled Shift</Label>
                <ReadOnlyCard rows={[
                  { label: 'Shift',      value: otShift?.name ?? '—' },
                  { label: 'Start Time', value: otShift?.startTime ? otShift.startTime.slice(0, 5) : '—' },
                  { label: 'End Time',   value: otShift?.endTime   ? otShift.endTime.slice(0, 5)   : '—' },
                ]} />
              </FieldWrap>
            )}

            <FieldWrap error={errors.otStart}>
              <Label>Overtime Start Time *</Label>
              <Input type="time" value={otStart} onChange={setOtStart} />
            </FieldWrap>
            <FieldWrap error={errors.otEnd}>
              <Label>Overtime End Time *</Label>
              <Input type="time" value={otEnd} onChange={setOtEnd} />
            </FieldWrap>
            {otStart && otEnd && calcOtDuration() !== '—' && (
              <div className="flex items-center gap-2 bg-amber-50 rounded-2xl px-4 py-3 mb-4">
                <Clock size={14} className="text-amber-500" />
                <span className="text-slate-700 font-semibold" style={{ fontSize: '13px' }}>
                  Total overtime: {calcOtDuration()}
                </span>
              </div>
            )}
            <FieldWrap>
              <Label>Project / Task (optional)</Label>
              <Input value={otProject} onChange={setOtProject} placeholder="e.g. Q2 Sales Report" />
            </FieldWrap>
            <ImpactBanner text="Approved overtime will appear in your attendance record and reports." />
          </>
        )}

        {/* Shared fields */}
        <FieldWrap error={errors.reason}>
          <Label>Reason *</Label>
          <Textarea value={reason} onChange={setReason} placeholder="Explain the reason for this request…" />
        </FieldWrap>

        {type !== 'sick_leave' && (
          <FieldWrap>
            <Label>Attachment (optional)</Label>
            <AttachmentField
              fileName={attachmentName}
              file={attachmentFile}
              onChange={(name, f) => { setAttachmentName(name); setAttachmentFile(f); }}
            />
          </FieldWrap>
        )}

        <FieldWrap>
          <Label>Approver</Label>
          <Input value={approverDisplay} readOnly />
        </FieldWrap>

        <FieldWrap>
          <Label>Branch / Work Location</Label>
          <Input value={branchDisplay} readOnly />
        </FieldWrap>

        {submitError && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-4">
            <p className="text-red-600" style={{ fontSize: '13px' }}>{submitError}</p>
          </div>
        )}

        <div className="flex gap-3 mt-2">
          <button
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="flex-1 border-2 border-slate-200 rounded-2xl text-slate-700 font-semibold active:scale-95 transition-transform disabled:opacity-50"
            style={{ height: 52, fontSize: '14px' }}
          >
            {submitting ? '…' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="flex-1 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition-transform disabled:opacity-50"
            style={{ height: 52, fontSize: '14px' }}
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
