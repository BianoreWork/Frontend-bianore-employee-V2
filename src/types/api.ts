export interface ApiError {
  status: number;
  message: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface Employee {
  id: number;
  full_name: string;
  employee_code: string;
  department?: { id: number; name: string };
  position?: { id: number; name: string };
  branch?: { id: number; name: string };
  approver?: { id: number; email: string; full_name?: string };
  join_date?: string;
  employment_status?: string;
}

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  two_factor_enabled: boolean;
  roles: Role[];
  employee?: Employee;
}

// Auth responses
export interface LoginSuccessResponse {
  status: 'success';
  token: string;
  type: 'bearer';
  user: User;
}

export interface LoginOtpRequiredResponse {
  status: 'otp_required';
  otp_token: string;
  message: string;
}

export interface Login2faRequiredResponse {
  status: '2fa_required';
  temp_token: string;
  message: string;
}

export type LoginResponse =
  | LoginSuccessResponse
  | LoginOtpRequiredResponse
  | Login2faRequiredResponse;

export interface OtpVerifySuccessResponse {
  status: 'success';
  token: string;
  type: 'bearer';
  user: User;
}

export interface OtpVerify2faResponse {
  status: '2fa_required';
  temp_token: string;
  message: string;
}

export type OtpVerifyResponse = OtpVerifySuccessResponse | OtpVerify2faResponse;

export interface TwoFactorVerifyResponse {
  status: 'success';
  token: string;
  type: 'bearer';
  user: User;
}

// Attendance
export interface AttendanceShift {
  name: string;
  start_time: string;
  end_time: string;
}

export interface AttendanceRecord {
  id: number;
  attendance_date: string;
  employee: { id: number; name: string; employee_code: string };
  clock_in_at: string | null;
  clock_out_at: string | null;
  status: string;
  system_status: string;
  status_label: string;
  late_minutes: number;
  overtime_minutes: number;
  work_duration: number | null;
  shift: AttendanceShift | null;
}

export interface AttendanceTodayResponse {
  data: AttendanceRecord | null;
  message: string;
}

export interface AttendanceCheckResponse {
  message: string;
  data: AttendanceRecord;
  anomalies?: unknown[];
}

export interface AttendanceHistoryItem {
  employee_name: string;
  employee_code: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  status_label: string;
  late_minutes: number;
  overtime_minutes: number;
  work_duration: number | null;
  shift: string | null;
  attendance_date?: string;
}

export interface AttendanceHistoryResponse {
  data: AttendanceHistoryItem[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

// Attendance monthly recap
export interface AttendanceRecapData {
  present: number;
  late: number;
  absent: number;
  early_leave: number;
  overtime: number;
  late_overtime: number;
  leave: number;
  sick: number;
  manual_adjustment: number;
}

export interface AttendanceRecapResponse {
  period: string;
  data: AttendanceRecapData;
  total: number;
}

// Attendance detail (specific date) — stored function, shape may vary
export interface AttendanceDetailResponse {
  data: {
    schedule_id?: number;
    schedule?: { id: number; [key: string]: unknown };
    [key: string]: unknown;
  } | null;
}

// Employee time requests (backend format)
export type ApiRequestType =
  | 'annual_leave'
  | 'special_leave'
  | 'permission'
  | 'sick_leave'
  | 'attendance_correction'
  | 'overtime';

export type ApiRequestStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'needs_revision'
  | 'cancelled';

export interface ApiTimelineEvent {
  status: string;
  title: string;
  description: string | null;
  created_at: string;
}

export interface ApiAttachment {
  id: number;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string | null;
}

export interface ApiTimeRequest {
  id: number;
  request_code: string;
  request_type: ApiRequestType;
  request_status: ApiRequestStatus;
  title: string;
  reason: string | null;
  start_date: string | null;
  end_date: string | null;
  day_duration: 'full_day' | 'first_half' | 'second_half' | null;
  total_days: number | null;
  submitted_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  manager_note: string | null;
  is_editable: boolean;
  is_final: boolean;
  employee?: { id: number; employee_code: string; full_name: string };
  approver?: { id: number; email: string };
  branch?: { id: number; name: string };
  attachments?: ApiAttachment[];
  timeline?: ApiTimelineEvent[];
  created_at: string;
}

export interface ApiTimeRequestListResponse {
  data: ApiTimeRequest[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}
