import type { ApiNotification } from '../types/api';

export const NOTIFICATION_RECEIVED_EVENT = 'notifications:received';

export function emitNotificationReceived(notification: ApiNotification) {
  window.dispatchEvent(
    new CustomEvent<ApiNotification>(NOTIFICATION_RECEIVED_EVENT, {
      detail: notification,
    }),
  );
}
