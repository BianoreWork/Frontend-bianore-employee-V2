import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ChevronLeft, Paperclip, AlertCircle, Info, CheckCircle2,
  X, CalendarDays, Clock, Upload, FileText, ImageIcon,
} from 'lucide-react';
import { requestsStore, type RequestType, type AttendanceRequest } from '../data/requestsStore';

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

function AttachmentField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be under 5 MB.');
      return;
    }

    onChange(file.name);

    if (file.type.startsWith('image/')) {
      setFileType('image');
      const url = URL.createObjectURL(file);
      setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
    } else {
      setFileType('pdf');
      setPreviewUrl(null);
    }
  };

  const handleRemove = () => {
    onChange('');
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

      {!value ? (
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
              <p className="text-slate-700 font-semibold truncate" style={{ fontSize: '13px' }}>{value}</p>
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

function SuccessScreen({ type, isDraft, reqId, onView, onBack }: {
  type: RequestType; isDraft: boolean; reqId: string;
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
          { label: 'Submitted',    value: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
          { label: 'Approver',     value: 'Budi Santoso (Manager)' },
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

export default function RequestFormPage() {
  const { type } = useParams<{ type: RequestType }>();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [savedId, setSavedId] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const [reason, setReason] = useState('');
  const [approver] = useState('Budi Santoso (Manager)');
  const [branch] = useState('Jakarta HQ');
  const [attachment, setAttachment] = useState('');

  const [leaveType, setLeaveType] = useState('');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveDayType, setLeaveDayType] = useState('Full Day');
  const [leaveHalfPart, setLeaveHalfPart] = useState('First Half');

  const [permDate, setPermDate] = useState('');
  const [permType, setPermType] = useState('');
  const [permDayType, setPermDayType] = useState('Full Day');
  const [permHalfPart, setPermHalfPart] = useState('First Half');

  const [sickStart, setSickStart] = useState('');
  const [sickEnd, setSickEnd] = useState('');
  const [doctorInfo, setDoctorInfo] = useState('');

  const [corrDate, setCorrDate] = useState('');
  const [corrType, setCorrType] = useState('');
  const [reqCheckIn, setReqCheckIn] = useState('');
  const [reqCheckOut, setReqCheckOut] = useState('');
  const [reqStatus, setReqStatus] = useState('');

  const [otDate, setOtDate] = useState('');
  const [otType, setOtType] = useState('');
  const [otStart, setOtStart] = useState('');
  const [otEnd, setOtEnd] = useState('');
  const [otProject, setOtProject] = useState('');

  if (!type) return null;

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

  const handleSubmit = (draft: boolean) => {
    if (!draft && !validate()) return;
    const now = new Date().toISOString().slice(0, 10);
    const base: Omit<AttendanceRequest, 'id'> = {
      type: type as RequestType,
      status: draft ? 'draft' : 'pending',
      submittedDate: now,
      requestDate: leaveStart || permDate || sickStart || corrDate || otDate || now,
      reason,
      approver,
      branch,
      attachmentName: attachment || undefined,
      timeline: draft
        ? [{ time: now + ' ' + new Date().toTimeString().slice(0, 5), label: 'Saved as draft', done: true }]
        : [
            { time: now + ' ' + new Date().toTimeString().slice(0, 5), label: 'Request submitted', done: true },
            { time: '', label: 'Waiting for manager approval', done: false },
            { time: '', label: 'Approved / Rejected', done: false },
          ],
    };

    if (type === 'leave')                  Object.assign(base, { leaveType, requestEndDate: leaveEnd, halfDay: leaveDayType === 'Half Day', halfDayPart: leaveHalfPart, totalDays: calcLeaveDays() });
    if (type === 'permission')             Object.assign(base, { permissionType: permType, halfDay: permDayType === 'Half Day', halfDayPart: permHalfPart });
    if (type === 'sick_leave')             Object.assign(base, { requestEndDate: sickEnd, doctorInfo });
    if (type === 'attendance_correction')  Object.assign(base, { correctionType: corrType, currentCheckIn: '08:00', currentCheckOut: '—', currentStatus: 'Incomplete', requestedCheckIn: reqCheckIn, requestedCheckOut: reqCheckOut, requestedStatus: reqStatus });
    if (type === 'overtime')               Object.assign(base, { overtimeType: otType as any, requestEndDate: otDate, overtimeStart: otStart, overtimeEnd: otEnd, overtimeDuration: calcOtDuration(), projectTask: otProject });

    const req = requestsStore.add(base as any);
    setIsDraft(draft);
    setSavedId(req.id);
    setSubmitted(true);
  };

  const titleMap: Record<string, string> = {
    leave: 'Leave Request', permission: 'Permission Request',
    sick_leave: 'Sick Leave Request', attendance_correction: 'Attendance Correction',
    overtime: 'Overtime Request',
  };

  if (submitted) {
    return (
      <div className="flex flex-col" style={{ minHeight: 'calc(100dvh - 120px)' }}>
        <SuccessScreen
          type={type as RequestType}
          isDraft={isDraft}
          reqId={savedId}
          onView={() => navigate(`/dashboard/requests/${savedId}`)}
          onBack={() => navigate('/dashboard/requests')}
        />
      </div>
    );
  }

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
              <Label>Doctor / Clinic Information</Label>
              <Input value={doctorInfo} onChange={setDoctorInfo} placeholder="e.g. Dr. Agus - Klinik Sehat" />
            </FieldWrap>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex gap-2 items-start mb-4">
              <Info size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-amber-700" style={{ fontSize: '12px' }}>Medical certificate may be required based on company policy.</p>
            </div>
            <FieldWrap>
              <Label>Medical Certificate (if available)</Label>
              <AttachmentField value={attachment} onChange={setAttachment} />
            </FieldWrap>
            <ImpactBanner text="Your attendance will be marked as Sick Leave after this request is approved." />
          </>
        )}

        {/* ATTENDANCE CORRECTION */}
        {type === 'attendance_correction' && (
          <>
            <FieldWrap error={errors.corrDate}>
              <Label>Attendance Date *</Label>
              <Input type="date" value={corrDate} onChange={setCorrDate} />
            </FieldWrap>
            <FieldWrap error={errors.corrType}>
              <Label>Correction Type *</Label>
              <Select
                value={corrType}
                onChange={setCorrType}
                options={['Forgot Check-in', 'Forgot Check-out', 'Incorrect Check-in Time', 'Incorrect Check-out Time', 'Wrong Attendance Status', 'Location Issue', 'Other']}
              />
            </FieldWrap>
            {corrDate && (
              <FieldWrap>
                <Label>Current Attendance Record</Label>
                <ReadOnlyCard rows={[
                  { label: 'Check In',  value: '08:00' },
                  { label: 'Check Out', value: '—' },
                  { label: 'Status',    value: 'Incomplete' },
                  { label: 'Location',  value: 'Jakarta HQ' },
                ]} />
              </FieldWrap>
            )}
            {(corrType.includes('Check-in') || corrType === 'Forgot Check-in') && (
              <FieldWrap>
                <Label>Requested Check-in Time</Label>
                <Input type="time" value={reqCheckIn} onChange={setReqCheckIn} />
              </FieldWrap>
            )}
            {(corrType.includes('Check-out') || corrType === 'Forgot Check-out') && (
              <FieldWrap>
                <Label>Requested Check-out Time</Label>
                <Input type="time" value={reqCheckOut} onChange={setReqCheckOut} />
              </FieldWrap>
            )}
            {corrType === 'Wrong Attendance Status' && (
              <FieldWrap>
                <Label>Requested Status</Label>
                <Select value={reqStatus} onChange={setReqStatus} options={['Present', 'On Leave', 'Permission', 'Sick Leave', 'On Duty']} />
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
              <Input type="date" value={otDate} onChange={setOtDate} />
            </FieldWrap>
            <FieldWrap>
              <Label>Overtime Type</Label>
              <Select value={otType} onChange={setOtType} options={['Before Shift', 'After Shift', 'Rest Day / Holiday']} />
            </FieldWrap>
            <FieldWrap>
              <Label>Scheduled Shift</Label>
              <ReadOnlyCard rows={[
                { label: 'Shift Name', value: 'Morning Shift' },
                { label: 'Start Time', value: '08:00' },
                { label: 'End Time',   value: '17:00' },
              ]} />
            </FieldWrap>
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
            {otStart && otEnd && otStart >= '08:00' && otEnd <= '17:00' && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4">
                <AlertCircle size={13} className="text-amber-600 flex-shrink-0" />
                <p className="text-amber-700" style={{ fontSize: '12px' }}>Warning: Selected time overlaps with scheduled working hours.</p>
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

        <FieldWrap>
          <Label>Attachment (optional)</Label>
          <AttachmentField value={attachment} onChange={setAttachment} />
        </FieldWrap>

        <FieldWrap>
          <Label>Approver</Label>
          <Input value={approver} readOnly />
        </FieldWrap>

        <FieldWrap>
          <Label>Branch / Work Location</Label>
          <Input value={branch} readOnly />
        </FieldWrap>

        <div className="flex gap-3 mt-2">
          <button
            onClick={() => handleSubmit(true)}
            className="flex-1 border-2 border-slate-200 rounded-2xl text-slate-700 font-semibold active:scale-95 transition-transform"
            style={{ height: 52, fontSize: '14px' }}
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSubmit(false)}
            className="flex-1 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition-transform"
            style={{ height: 52, fontSize: '14px' }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
