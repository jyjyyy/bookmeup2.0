'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface AppNotification {
  id: string
  type: 'booking' | 'cancellation' | 'reminder' | 'system' | 'booking_cancelled'
  title: string
  message: string
  createdAt: Date
  read: boolean
  bookingId?: string
}

const POLL_INTERVAL = 15_000 // 15 seconds

/**
 * Hook to fetch notifications for a professional user via server-side API.
 * Uses polling every 15s instead of client-side Firestore (avoids permission issues).
 */
export function useNotifications(proId: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!proId) return
    try {
      const res = await fetch(`/api/notifications?proId=${encodeURIComponent(proId)}`)
      if (!res.ok) {
        console.error('[useNotifications] API error:', res.status)
        return
      }
      const data = await res.json()
      const notifs: AppNotification[] = (data.notifications || []).map((n: any) => ({
        id: n.id,
        type: n.type || 'system',
        title: n.title || 'Notification',
        message: n.message || '',
        createdAt: new Date(n.createdAt),
        read: n.read === true,
        bookingId: n.bookingId,
      }))
      setNotifications(notifs)
      setUnreadCount(notifs.filter((n) => !n.read).length)
    } catch (error) {
      console.error('[useNotifications] Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [proId])

  useEffect(() => {
    if (!proId) {
      setLoading(false)
      return
    }

    // Initial fetch
    fetchNotifications()

    // Poll every 15 seconds
    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [proId, fetchNotifications])

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!proId) return
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))

      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      })
    } catch (error) {
      console.error('[useNotifications] markAsRead error:', error)
      // Refetch on error to restore correct state
      fetchNotifications()
    }
  }, [proId, fetchNotifications])

  const markAllAsRead = useCallback(async () => {
    if (!proId) return
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)

      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proId, all: true }),
      })
    } catch (error) {
      console.error('[useNotifications] markAllAsRead error:', error)
      fetchNotifications()
    }
  }, [proId, fetchNotifications])

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead }
}
