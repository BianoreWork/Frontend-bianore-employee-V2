import { api } from '../lib/api';
import type {
  AttendanceTodayResponse,
  AttendanceHomeResponse,
  AttendanceCheckResponse,
  AttendanceHistoryResponse,
  AttendanceRecapResponse,
  AttendanceDetailResponse,
} from '../types/api';

export interface CheckInPayload {
  latitude?: number;
  longitude?: number;
  client_captured_at?: string;
  device_uid?: string;
  platform?: string;
  photo?: string; // base64 data URL
}

interface CheckOutPayload {
  latitude?: number;
  longitude?: number;
  client_captured_at?: string;
  device_uid?: string;
  platform?: string;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

function appendIfDefined(form: FormData, key: string, val: string | number | boolean | undefined | null) {
  if (val !== undefined && val !== null) form.append(key, String(val));
}

export const attendanceService = {
  home: (date?: string) =>
    api.get<AttendanceHomeResponse>(`/attendance/home${date ? `?date=${encodeURIComponent(date)}` : ''}`),

  today: () => api.get<AttendanceTodayResponse>('/attendance/today'),

  checkIn: (payload: CheckInPayload = {}) => {
    const form = new FormData();
    appendIfDefined(form, 'latitude', payload.latitude);
    appendIfDefined(form, 'longitude', payload.longitude);
    appendIfDefined(form, 'client_captured_at', payload.client_captured_at);
    appendIfDefined(form, 'device_uid', payload.device_uid);
    appendIfDefined(form, 'platform', payload.platform ?? 'web');
    if (payload.photo) {
      form.append('photo', dataUrlToBlob(payload.photo), 'selfie.jpg');
    }
    return api.postForm<AttendanceCheckResponse>('/attendance/check-in', form);
  },

  checkOut: (payload: CheckOutPayload = {}) =>
    api.post<AttendanceCheckResponse>('/attendance/check-out', payload),

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
