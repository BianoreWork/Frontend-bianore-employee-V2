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
