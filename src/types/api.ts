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
  branch?: AttendanceBranch;
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
export interface AttendanceBranch {
  id: number;
  name: string;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  radius_meters?: number | string | null;
}

export type OutsideGeofenceBehavior =
  | 'block'
  | 'warn'
  | 'allow'
  | 'block_checkin'
  | 'allow_but_flag'
  | 'allow_with_required_reason';

export interface AttendancePolicy {
  id?: number | null;
  name?: string | null;
  grace_period_minutes?: number | null;
  break_duration_minutes?: number | null;
  checkin_window_before_minutes?: number | null;
  checkin_window_after_minutes?: number | null;
  abnormal_time_threshold?: number | null;
  require_location?: boolean | null;
  require_face?: boolean | null;
  require_photo_checkin?: boolean | null;
  require_device_lock?: boolean | null;
  allow_mobile_checkin?: boolean | null;
  allow_attendance_correction?: boolean | null;
  require_checkout?: boolean | null;
  no_checkout_handling?: string | null;
  auto_absent_after_minutes?: number | null;
  checkin_permission?: string | null;
  outside_geofence_behavior?: OutsideGeofenceBehavior | string | null;
  remote_employees_exempt_from_geofence?: boolean | null;
}

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
  branch?: AttendanceBranch | null;
  assigned_branch?: AttendanceBranch | null;
}

export interface AttendanceTodayResponse {
  data: AttendanceRecord | null;
  message: string;
}

export interface AttendanceHomeSchedule {
  schedule_id?: number | null;
  shift_name?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  branch?: AttendanceBranch | null;
  assigned_branch?: AttendanceBranch | null;
  policy?: AttendancePolicy | null;
  require_location?: boolean | null;
  require_face?: boolean | null;
  require_photo_checkin?: boolean | null;
  require_device_lock?: boolean | null;
  allow_mobile_checkin?: boolean | null;
  checkin_permission?: string | null;
  outside_geofence_behavior?: OutsideGeofenceBehavior | string | null;
  [key: string]: unknown;
}

export interface AttendanceHomeResponse {
  data: {
    today_schedule?: AttendanceHomeSchedule | null;
    today_attendance?: AttendanceRecord | null;
    attendance?: AttendanceRecord | null;
    record?: AttendanceRecord | null;
    today_status?: string | null;
    [key: string]: unknown;
  };
  message?: string;
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

// Attendance detail (specific date) — returned by employee_attendance_detail() stored function
export interface AttendanceDetailSchedule {
  id: number;
  shift_name?: string;
  shift_type?: string;
  start_time?: string;
  end_time?: string;
  shift?: { name?: string; start_time?: string; end_time?: string };
  [key: string]: unknown;
}

export interface AttendanceDetailResponse {
  data: {
    schedule_id?: number;
    schedule?: AttendanceDetailSchedule;
    clock_in_at?: string | null;
    clock_out_at?: string | null;
    system_status?: string | null;
    is_overridden?: boolean;
    override_status?: string | null;
    [key: string]: unknown;
  } | null;
  message?: string;
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
  document_type: 'medical_certificate' | 'general';
  uploaded_at: string | null;
}

export interface ApiTimeRequest {
  id: number;
  request_code: string;
  request_type: ApiRequestType;
  request_status: ApiRequestStatus;
  title: string;
  reason: string | null;

  // Date range (leave / permission / sick_leave)
  start_date: string | null;
  end_date: string | null;
  day_duration: 'full_day' | 'first_half' | 'second_half' | null;
  total_days: number | null;

  // Permission specific
  permission_type: string | null;

  // Sick leave specific
  doctor_name: string | null;
  clinic_name: string | null;

  // Attendance correction specific
  attendance_date: string | null;
  correction_type: string | null;
  current_check_in: string | null;
  current_check_out: string | null;
  current_status: string | null;
  requested_check_in: string | null;
  requested_check_out: string | null;

  // Overtime specific
  overtime_date: string | null;
  overtime_type: string | null;
  overtime_start: string | null;
  overtime_end: string | null;
  total_overtime_minutes: number | null;
  project_task: string | null;

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

export interface ApiNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  reference_type: string | null;
  reference_id: number | null;
  read_at: string | null;
  created_at: string;
}

export interface ApiNotificationListResponse {
  data: ApiNotification[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    unread_count: number;
  };
}
