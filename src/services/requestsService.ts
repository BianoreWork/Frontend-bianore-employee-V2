import { api } from '../lib/api';
import type { ApiTimeRequest, ApiTimeRequestListResponse } from '../types/api';

export type FrontendRequestType =
  | 'leave'
  | 'permission'
  | 'sick_leave'
  | 'attendance_correction'
  | 'overtime';

export type FrontendRequestStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'needs_revision'
  | 'cancelled';

export interface MappedRequest {
  id: number;
  requestCode: string;
  type: FrontendRequestType;
  rawType: string;
  status: FrontendRequestStatus;
  title: string;
  reason: string;
  startDate: string | null;
  endDate: string | null;
  dayDuration: string | null;
  totalDays: number | null;
  submittedAt: string | null;
  approver: string;
  branch: string;
  adminNote: string | null;
  isEditable: boolean;
  isFinal: boolean;
  attachments: { id: number; file_url: string; file_name: string; file_type: string }[];
  timeline: { label: string; time: string; done: boolean; note: string | null }[];
  createdAt: string;
}

function mapApiType(apiType: string): FrontendRequestType {
  if (apiType === 'annual_leave' || apiType === 'special_leave') return 'leave';
  return apiType as FrontendRequestType;
}

function mapRequest(r: ApiTimeRequest): MappedRequest {
  return {
    id: r.id,
    requestCode: r.request_code,
    type: mapApiType(r.request_type),
    rawType: r.request_type,
    status: r.request_status as FrontendRequestStatus,
    title: r.title,
    reason: r.reason ?? '',
    startDate: r.start_date,
    endDate: r.end_date,
    dayDuration: r.day_duration,
    totalDays: r.total_days,
    submittedAt: r.submitted_at,
    approver: r.approver?.email ?? 'Manager',
    branch: r.branch?.name ?? '—',
    adminNote: r.manager_note ?? r.rejection_reason ?? null,
    isEditable: r.is_editable,
    isFinal: r.is_final,
    attachments: (r.attachments ?? []).map(a => ({
      id: a.id,
      file_url: a.file_url,
      file_name: a.file_name,
      file_type: a.file_type,
    })),
    timeline: (r.timeline ?? []).map(t => ({
      label: t.title,
      time: t.created_at,
      done: true,
      note: t.description ?? null,
    })),
    createdAt: r.created_at,
  };
}

export const requestsService = {
  getRequests: async (params?: {
    status?: string;
    type?: string;
    page?: number;
    perPage?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.status && params.status !== 'all') q.set('status', params.status);
    if (params?.type)    q.set('type', params.type);
    if (params?.page)    q.set('page', String(params.page));
    q.set('per_page', String(params?.perPage ?? 100));

    const res = await api.get<ApiTimeRequestListResponse>(`/requests?${q}`);
    return {
      data: res.data.map(mapRequest),
      meta: res.meta,
    };
  },

  getRequest: async (id: number) => {
    const res = await api.get<{ data: ApiTimeRequest; message: string }>(`/requests/${id}`);
    return mapRequest(res.data);
  },

  createRequest: (formData: FormData) =>
    api.postForm<{ data: ApiTimeRequest; message: string }>('/requests', formData),

  submitRequest: (id: number) =>
    api.post<{ data: ApiTimeRequest; message: string }>(`/requests/${id}/submit`),

  cancelRequest: (id: number) =>
    api.post<{ message: string }>(`/requests/${id}/cancel`),
};
