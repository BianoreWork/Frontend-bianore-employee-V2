import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { emitNotificationReceived } from '../lib/notificationEvents';
import type { ApiNotification } from '../types/api';

type NotificationRow = {
  id: number;
  recipient_user_id: number;
  type: string;
  title: string;
  message: string;
  reference_type: string | null;
  reference_id: number | null;
  read_at: string | null;
  created_at: string;
};

function mapRow(row: NotificationRow): ApiNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    reference_type: row.reference_type,
    reference_id: row.reference_id,
    read_at: row.read_at,
    created_at: row.created_at,
  };
}

export function subscribeToNotifications(userId: number): RealtimeChannel | null {
  if (!supabase) return null;

  return supabase
    .channel(`notifications:user:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_user_id=eq.${userId}`,
      },
      payload => {
        emitNotificationReceived(mapRow(payload.new as NotificationRow));
      },
    )
    .subscribe();
}

export function unsubscribeFromNotifications(channel: RealtimeChannel | null) {
  if (!supabase || !channel) return;
  supabase.removeChannel(channel);
}
