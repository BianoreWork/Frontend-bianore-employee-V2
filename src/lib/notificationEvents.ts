import type { ApiNotification } from '../types/api';

export const NOTIFICATION_RECEIVED_EVENT = 'notifications:received';
export const NOTIFICATIONS_UNREAD_COUNT_CHANGED_EVENT = 'notifications:unread-count-changed';

export function emitNotificationReceived(notification: ApiNotification) {
  window.dispatchEvent(
    new CustomEvent<ApiNotification>(NOTIFICATION_RECEIVED_EVENT, {
      detail: notification,
    }),
  );
}

export function emitNotificationsUnreadCountChanged(unreadCount: number) {
  window.dispatchEvent(
    new CustomEvent<number>(NOTIFICATIONS_UNREAD_COUNT_CHANGED_EVENT, {
      detail: unreadCount,
    }),
  );
}
