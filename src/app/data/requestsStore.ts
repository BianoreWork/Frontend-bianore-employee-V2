import {
  type LucideIcon,
  Umbrella, Key, Thermometer, PenLine, Timer,
  Banknote, Package, UserCheck, ArrowLeftRight,
} from 'lucide-react';

export type RequestType =
  | 'leave'
  | 'permission'
  | 'sick_leave'
  | 'attendance_correction'
  | 'overtime'
  | 'cash_advance'
  | 'item_request'
  | 'shift_substitution'
  | 'shift_swap';

export type RequestCategory = 'absensi' | 'operasional';

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

  // Operational fields
  amount?: number;
  installments?: number;
  itemName?: string;
  itemQty?: number;
  itemSpec?: string;
  priority?: 'normal' | 'urgent';
  coverEmployeeName?: string;
  shiftDate?: string;
  swapEmployeeName?: string;
  swapShiftDate?: string;

  timeline: TimelineEvent[];
}

const seedData: AttendanceRequest[] = [];

let store: AttendanceRequest[] = [...seedData];
let idCounter = 1;

export const requestsStore = {
  getAll: () => [...store],
  getById: (id: string) => store.find(r => r.id === id),
  add: (req: Omit<AttendanceRequest, 'id'>) => {
    const id = `LOCAL-${String(idCounter++).padStart(3, '0')}`;
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
            timeline: [...r.timeline, { time: new Date().toISOString().slice(0, 16).replace('T', ' '), label: 'Request dibatalkan', done: true }],
          }
        : r
    );
  },
};

export const REQUEST_TYPE_META: Record<RequestType, { label: string; color: string; bg: string; Icon: LucideIcon; category: RequestCategory }> = {
  leave:                 { label: 'Cuti',             color: 'text-blue-700',   bg: 'bg-blue-50',   Icon: Umbrella,       category: 'absensi'    },
  permission:            { label: 'Izin',             color: 'text-purple-700', bg: 'bg-purple-50', Icon: Key,            category: 'absensi'    },
  sick_leave:            { label: 'Sakit',            color: 'text-red-700',    bg: 'bg-red-50',    Icon: Thermometer,    category: 'absensi'    },
  attendance_correction: { label: 'Koreksi Absensi',  color: 'text-orange-700', bg: 'bg-orange-50', Icon: PenLine,        category: 'absensi'    },
  overtime:              { label: 'Lembur',           color: 'text-amber-700',  bg: 'bg-amber-50',  Icon: Timer,          category: 'absensi'    },
  cash_advance:          { label: 'Kasbon',           color: 'text-emerald-700',bg: 'bg-emerald-50',Icon: Banknote,       category: 'operasional'},
  item_request:          { label: 'Permintaan Barang',color: 'text-teal-700',   bg: 'bg-teal-50',   Icon: Package,        category: 'operasional'},
  shift_substitution:    { label: 'Ganti Shift',      color: 'text-indigo-700', bg: 'bg-indigo-50', Icon: UserCheck,      category: 'operasional'},
  shift_swap:            { label: 'Tukar Shift',      color: 'text-violet-700', bg: 'bg-violet-50', Icon: ArrowLeftRight, category: 'operasional'},
};

export const STATUS_META: Record<RequestStatus, { label: string; color: string; bg: string }> = {
  draft:          { label: 'Draft',           color: 'text-slate-600',   bg: 'bg-slate-100'  },
  pending:        { label: 'Menunggu',        color: 'text-amber-700',   bg: 'bg-amber-100'  },
  approved:       { label: 'Disetujui',       color: 'text-emerald-700', bg: 'bg-emerald-100'},
  rejected:       { label: 'Ditolak',         color: 'text-red-700',     bg: 'bg-red-100'    },
  cancelled:      { label: 'Dibatalkan',      color: 'text-slate-500',   bg: 'bg-slate-100'  },
  needs_revision: { label: 'Perlu Revisi',    color: 'text-orange-700',  bg: 'bg-orange-100' },
};

export const ABSENSI_TYPES: RequestType[] = ['leave', 'permission', 'sick_leave', 'attendance_correction', 'overtime'];
export const OPERASIONAL_TYPES: RequestType[] = ['cash_advance', 'item_request', 'shift_substitution', 'shift_swap'];
