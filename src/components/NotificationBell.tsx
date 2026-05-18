import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { getTenantNotifications, markAllNotificationsRead, markNotificationRead, subscribeToTenantNotifications, type TenantNotification } from '@/lib/notifications'
import { cn } from '@/lib/utils'

function formatNotificationTime(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(1, Math.round(diff / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(value).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}

export function NotificationBell() {
  const { user, isAuthenticated } = useAuth()
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<TenantNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const unreadCount = useMemo(() => notifications.filter((item) => !item.readAt).length, [notifications])

  useEffect(() => {
    if (!isAuthenticated || !user) return
    setIsLoading(true)
    getTenantNotifications(user.id)
      .then(setNotifications)
      .finally(() => setIsLoading(false))

    try {
      return subscribeToTenantNotifications(user.id, (notification) => {
        setNotifications((current) => [notification, ...current].slice(0, 30))
      })
    } catch {
      return undefined
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  if (!isAuthenticated || !user) return null

  const markOneRead = async (notification: TenantNotification) => {
    if (notification.readAt) return
    await markNotificationRead(notification.id, user.id)
    setNotifications((current) => current.map((item) => (item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item)))
  }

  const markAllRead = async () => {
    await markAllNotificationsRead(user.id)
    setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })))
  }

  return (
    <div className="relative" ref={panelRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn('relative h-10 w-10 rounded-full p-0 touch-manipulation', open && 'bg-accent text-primary')}
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-5 h-5 animate-in zoom-in-75 rounded-full bg-primary px-1 text-[10px] font-bold leading-5 text-primary-foreground shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(92vw,390px)] overflow-hidden rounded-2xl border bg-popover shadow-2xl shadow-black/15 animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="font-display font-semibold">Notifications</p>
              <p className="text-xs text-muted-foreground">{unreadCount ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : 'You are all caught up'}</p>
            </div>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} className="rk-focus flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10">
                <CheckCheck className="h-3.5 w-3.5" />
                Read all
              </button>
            )}
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading updates
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => {
                const content = (
                  <div
                    className={cn(
                      'border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/50 active:bg-muted/70',
                      !notification.readAt && 'bg-primary/5',
                    )}
                    onClick={() => markOneRead(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn('mt-1 h-2 w-2 rounded-full shrink-0', notification.readAt ? 'bg-muted' : 'bg-primary')} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-snug">{notification.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{notification.body}</p>
                        <p className="mt-2 text-[11px] font-medium text-muted-foreground">{formatNotificationTime(notification.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                )

                return notification.linkUrl ? (
                  <Link key={notification.id} to={notification.linkUrl} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                ) : (
                  <button key={notification.id} type="button" className="rk-focus block w-full" aria-label={notification.title}>
                    {content}
                  </button>
                )
              })
            ) : (
              <div className="px-5 py-8 text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="font-display font-semibold">No updates yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Saved searches and listing changes will show up here.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
