import { api } from '../lib/api';
import type { ApiNotification, ApiNotificationListResponse } from '../types/api';

export const notificationsService = {
  getNotifications: (params?: { page?: number; perPage?: number; unreadOnly?: boolean; type?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    q.set('per_page', String(params?.perPage ?? 50));
    if (params?.unreadOnly) q.set('unread_only', '1');
    if (params?.type) q.set('type', params.type);

    return api.get<ApiNotificationListResponse>(`/notifications?${q}`);
  },

  markAsRead: (id: number) =>
    api.post<{ data: ApiNotification; message: string }>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.post<{ message: string }>('/notifications/read-all'),
};
