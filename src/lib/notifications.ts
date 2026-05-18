import { supabase } from '@/lib/supabase'

export type NotificationType =
  | 'saved_search_match'
  | 'landlord_response'
  | 'price_drop'
  | 'availability_update'
  | 'verification_update'
  | 'system_announcement'

export interface TenantNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  linkUrl: string | null
  metadata: Record<string, unknown>
  readAt: string | null
  createdAt: string
}

interface NotificationRow {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  link_url: string | null
  metadata: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

function toNotification(row: NotificationRow): TenantNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    linkUrl: row.link_url,
    metadata: row.metadata ?? {},
    readAt: row.read_at,
    createdAt: row.created_at,
  }
}

export async function getTenantNotifications(userId: string) {
  const { data, error } = await supabase
    .from('tenant_notifications')
    .select('id,user_id,type,title,body,link_url,metadata,read_at,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) throw error
  return (data as NotificationRow[]).map(toNotification)
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const { error } = await supabase
    .from('tenant_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('tenant_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)

  if (error) throw error
}

export function subscribeToTenantNotifications(userId: string, onInsert: (notification: TenantNotification) => void) {
  const channelId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  const channel = supabase
    .channel(`tenant-notifications:${userId}:${channelId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'tenant_notifications', filter: `user_id=eq.${userId}` },
      (payload) => onInsert(toNotification(payload.new as NotificationRow)),
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
