'use client'

import { useState, useRef, useEffect } from 'react'
import { useNotifications, type AppNotification } from '@/lib/hooks/useNotifications'

interface NotificationBellProps {
  proId: string | null
}

function getNotifIcon(type: AppNotification['type']) {
  switch (type) {
    case 'booking': return '📅'
    case 'cancellation': return '❌'
    case 'reminder': return '⏰'
    case 'system': return '🔔'
    default: return '🔔'
  }
}

function timeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "À l'instant"
  if (diffMin < 60) return `Il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `Il y a ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return 'Hier'
  return `Il y a ${diffD}j`
}

export function NotificationBell({ proId }: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(proId)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-[10px] flex items-center justify-center text-[#8a7a92] hover:bg-white hover:text-[#2A1F2D] hover:shadow-[0_2px_8px_rgba(20,0,50,0.04)] transition-all"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="fixed inset-x-3 top-auto sm:absolute sm:inset-x-auto sm:left-0 sm:top-full mt-2 w-auto sm:w-80 bg-white rounded-[18px] border border-[#EDE8F0] shadow-[0_8px_32px_rgba(20,0,50,0.12)] z-[100] overflow-hidden" style={{ maxWidth: 'calc(100vw - 24px)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#EDE8F0]">
            <h3 className="text-sm font-bold text-[#2A1F2D]">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="text-[11px] font-semibold text-primary hover:text-[#9C44AF] transition-colors"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="w-10 h-10 rounded-[12px] bg-[#F5F0F7] flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-[#B5A8BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-xs text-[#8a7a92]">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => {
                    if (!notif.read) markAsRead(notif.id)
                  }}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-[#FDFBFE] border-b border-[#EDE8F0]/50 last:border-0 ${
                    !notif.read ? 'bg-primary/[0.03]' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-[8px] bg-[#F5F0F7] flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                    {getNotifIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-semibold truncate ${!notif.read ? 'text-[#2A1F2D]' : 'text-[#64576b]'}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#8a7a92] line-clamp-2 mt-0.5">{notif.message}</p>
                    <p className="text-[10px] text-[#B5A8BE] mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
