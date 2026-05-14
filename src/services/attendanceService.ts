import { api } from '../lib/api';
import type {
  AttendanceTodayResponse,
  AttendanceCheckResponse,
  AttendanceHistoryResponse,
  AttendanceRecapResponse,
  AttendanceDetailResponse,
} from '../types/api';

interface CheckPayload {
  latitude?: number;
  longitude?: number;
}

export const attendanceService = {
  today: () => api.get<AttendanceTodayResponse>('/attendance/today'),

  checkIn: (payload?: CheckPayload) =>
    api.post<AttendanceCheckResponse>('/attendance/check-in', payload ?? {}),

  checkOut: (payload?: CheckPayload) =>
    api.post<AttendanceCheckResponse>('/attendance/check-out', payload ?? {}),

  history: (page = 1, perPage = 30) =>
    api.get<AttendanceHistoryResponse>(
      `/attendance/history?page=${page}&per_page=${perPage}`,
    ),

  recap: (month?: number, year?: number) => {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();
    return api.get<AttendanceRecapResponse>(`/attendance/recap?month=${m}&year=${y}`);
  },

  detail: (date: string) =>
    api.get<AttendanceDetailResponse>(`/attendance/detail?date=${date}`),
};
