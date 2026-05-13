export type RequestType =
  | 'leave'
  | 'permission'
  | 'sick_leave'
  | 'attendance_correction'
  | 'overtime';

export type RequestStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'needs_revision';

export interface TimelineEvent {
  time: string;
  label: string;
  note?: string;
  done: boolean;
}

export interface AttendanceRequest {
  id: string;
  type: RequestType;
  status: RequestStatus;
  submittedDate: string;
  requestDate: string;
  requestEndDate?: string;
  reason: string;
  approver: string;
  branch: string;
  adminNote?: string;
  attachmentName?: string;

  leaveType?: 'Annual Leave' | 'Special Leave';
  halfDay?: boolean;
  halfDayPart?: 'First Half' | 'Second Half';
  totalDays?: number;

  permissionType?: 'Personal Permission' | 'Family Matter' | 'Urgent Matter' | 'Other';

  doctorInfo?: string;

  correctionType?: string;
  currentCheckIn?: string;
  currentCheckOut?: string;
  currentStatus?: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  requestedStatus?: string;

  overtimeType?: 'Before Shift' | 'After Shift' | 'Rest Day / Holiday';
  overtimeStart?: string;
  overtimeEnd?: string;
  overtimeDuration?: string;
  projectTask?: string;

  timeline: TimelineEvent[];
}

const seedData: AttendanceRequest[] = [
  {
    id: 'REQ-001',
    type: 'leave',
    status: 'approved',
    submittedDate: '2026-04-28',
    requestDate: '2026-05-02',
    requestEndDate: '2026-05-03',
    reason: 'Family vacation that was planned in advance.',
    approver: 'Budi Santoso (Manager)',
    branch: 'Jakarta HQ',
    leaveType: 'Annual Leave',
    halfDay: false,
    totalDays: 2,
    timeline: [
      { time: '2026-04-28 09:00', label: 'Request submitted', done: true },
      { time: '2026-04-29 10:30', label: 'Waiting for manager approval', done: true },
      { time: '2026-04-30 14:00', label: 'Approved by Budi Santoso', done: true },
      { time: '2026-05-02 08:00', label: 'Attendance updated to On Leave', done: true },
    ],
  },
  {
    id: 'REQ-002',
    type: 'overtime',
    status: 'pending',
    submittedDate: '2026-05-08',
    requestDate: '2026-05-09',
    reason: 'Need to complete the Q2 sales report before the deadline.',
    approver: 'Budi Santoso (Manager)',
    branch: 'Jakarta HQ',
    overtimeType: 'After Shift',
    overtimeStart: '17:00',
    overtimeEnd: '20:00',
    overtimeDuration: '3h 0m',
    projectTask: 'Q2 Sales Report',
    timeline: [
      { time: '2026-05-08 16:45', label: 'Request submitted', done: true },
      { time: '', label: 'Waiting for manager approval', done: false },
      { time: '', label: 'Approved / Rejected', done: false },
    ],
  },
  {
    id: 'REQ-003',
    type: 'sick_leave',
    status: 'approved',
    submittedDate: '2026-05-05',
    requestDate: '2026-05-05',
    reason: 'Fever and mild headache. Rested at home.',
    approver: 'Budi Santoso (Manager)',
    branch: 'Jakarta HQ',
    doctorInfo: 'Dr. Agus - Klinik Sehat Bersama',
    attachmentName: 'medical_cert_may5.pdf',
    timeline: [
      { time: '2026-05-05 07:30', label: 'Request submitted', done: true },
      { time: '2026-05-05 09:00', label: 'Waiting for manager approval', done: true },
      { time: '2026-05-05 11:30', label: 'Approved by Budi Santoso', done: true },
      { time: '2026-05-05 12:00', label: 'Attendance updated to Sick Leave', done: true },
    ],
  },
  {
    id: 'REQ-004',
    type: 'attendance_correction',
    status: 'needs_revision',
    submittedDate: '2026-05-06',
    requestDate: '2026-05-04',
    reason: 'Forgot to check-out. Left office at 17:10.',
    approver: 'Budi Santoso (Manager)',
    branch: 'Jakarta HQ',
    correctionType: 'Forgot Check-out',
    currentCheckIn: '08:05',
    currentCheckOut: '—',
    currentStatus: 'Incomplete',
    requestedCheckIn: '08:05',
    requestedCheckOut: '17:10',
    adminNote: 'Please attach your exit gate log or office CCTV note for verification.',
    timeline: [
      { time: '2026-05-06 08:20', label: 'Request submitted', done: true },
      { time: '2026-05-06 14:00', label: 'Reviewed by manager', done: true },
      { time: '2026-05-06 14:05', label: 'Needs Revision — Additional document required', done: true },
      { time: '', label: 'Awaiting resubmission', done: false },
    ],
  },
  {
    id: 'REQ-005',
    type: 'permission',
    status: 'rejected',
    submittedDate: '2026-04-15',
    requestDate: '2026-04-17',
    reason: 'Need to take care of personal administrative matter.',
    approver: 'Budi Santoso (Manager)',
    branch: 'Jakarta HQ',
    permissionType: 'Personal Permission',
    halfDay: true,
    halfDayPart: 'First Half',
    adminNote: 'Insufficient notice period. Please submit at least 3 days in advance.',
    timeline: [
      { time: '2026-04-15 17:30', label: 'Request submitted', done: true },
      { time: '2026-04-16 09:00', label: 'Waiting for manager approval', done: true },
      { time: '2026-04-16 11:00', label: 'Rejected by Budi Santoso', done: true },
    ],
  },
];

let store: AttendanceRequest[] = [...seedData];
let idCounter = 6;

export const requestsStore = {
  getAll: () => [...store],
  getById: (id: string) => store.find(r => r.id === id),
  add: (req: Omit<AttendanceRequest, 'id'>) => {
    const id = `REQ-00${idCounter++}`;
    const newReq: AttendanceRequest = { ...req, id };
    store = [newReq, ...store];
    return newReq;
  },
  update: (id: string, updates: Partial<AttendanceRequest>) => {
    store = store.map(r => r.id === id ? { ...r, ...updates } : r);
    return store.find(r => r.id === id)!;
  },
  cancel: (id: string) => {
    store = store.map(r =>
      r.id === id
        ? {
            ...r, status: 'cancelled',
            timeline: [...r.timeline, { time: new Date().toISOString().slice(0, 16).replace('T', ' '), label: 'Request cancelled by employee', done: true }],
          }
        : r
    );
  },
};

export const REQUEST_TYPE_META: Record<RequestType, { label: string; color: string; bg: string; icon: string }> = {
  leave:                 { label: 'Leave',            color: 'text-blue-700',   bg: 'bg-blue-50',   icon: '🌴' },
  permission:            { label: 'Permission',       color: 'text-purple-700', bg: 'bg-purple-50', icon: '🔑' },
  sick_leave:            { label: 'Sick Leave',       color: 'text-red-700',    bg: 'bg-red-50',    icon: '🤒' },
  attendance_correction: { label: 'Attendance Fix',  color: 'text-orange-700', bg: 'bg-orange-50', icon: '✏️' },
  overtime:              { label: 'Overtime',         color: 'text-amber-700',  bg: 'bg-amber-50',  icon: '⏰' },
};

export const STATUS_META: Record<RequestStatus, { label: string; color: string; bg: string }> = {
  draft:          { label: 'Draft',          color: 'text-slate-600',   bg: 'bg-slate-100'  },
  pending:        { label: 'Pending',        color: 'text-amber-700',   bg: 'bg-amber-100'  },
  approved:       { label: 'Approved',       color: 'text-emerald-700', bg: 'bg-emerald-100'},
  rejected:       { label: 'Rejected',       color: 'text-red-700',     bg: 'bg-red-100'    },
  cancelled:      { label: 'Cancelled',      color: 'text-slate-500',   bg: 'bg-slate-100'  },
  needs_revision: { label: 'Needs Revision', color: 'text-orange-700',  bg: 'bg-orange-100' },
};
