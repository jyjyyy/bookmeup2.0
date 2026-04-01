'use client'

import { useState, useEffect, useCallback } from 'react'

export interface AppNotification {
  id: string
  type: 'booking' | 'cancellation' | 'reminder' | 'system'
  title: string
  message: string
  createdAt: Date
  read: boolean
  bookingId?: string
}

/**
 * Hook to listen for real-time notifications for a professional user.
 * Uses Firestore onSnapshot for live updates.
 */
export function useNotifications(proId: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!proId) {
      setLoading(false)
      return
    }

    let unsubscribe: (() => void) | null = null

    const setup = async () => {
      try {
        const { db } = await import('@/lib/firebaseClient')
        const { collection, query, where, orderBy, limit, onSnapshot } = await import('firebase/firestore')

        const notifCol = collection(db, 'notifications')
        const q = query(
          notifCol,
          where('proId', '==', proId),
          orderBy('createdAt', 'desc'),
          limit(20)
        )

        unsubscribe = onSnapshot(q, (snapshot) => {
          const notifs: AppNotification[] = []
          snapshot.forEach((doc) => {
            const data = doc.data()
            let createdAt: Date
            if (data.createdAt?.toDate) {
              createdAt = data.createdAt.toDate()
            } else if (typeof data.createdAt === 'string') {
              createdAt = new Date(data.createdAt)
            } else {
              createdAt = new Date()
            }

            notifs.push({
              id: doc.id,
              type: data.type || 'system',
              title: data.title || 'Notification',
              message: data.message || '',
              createdAt,
              read: data.read === true,
              bookingId: data.bookingId,
            })
          })

          setNotifications(notifs)
          setUnreadCount(notifs.filter((n) => !n.read).length)
          setLoading(false)
        }, (error) => {
          console.error('[useNotifications] Error:', error)
          setLoading(false)
        })
      } catch (error) {
        console.error('[useNotifications] Setup error:', error)
        setLoading(false)
      }
    }

    setup()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [proId])

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!proId) return
    try {
      const { db } = await import('@/lib/firebaseClient')
      const { doc, updateDoc } = await import('firebase/firestore')
      await updateDoc(doc(db, 'notifications', notificationId), { read: true })
    } catch (error) {
      console.error('[useNotifications] markAsRead error:', error)
    }
  }, [proId])

  const markAllAsRead = useCallback(async () => {
    if (!proId) return
    try {
      const { db } = await import('@/lib/firebaseClient')
      const { doc, updateDoc } = await import('firebase/firestore')
      const unread = notifications.filter((n) => !n.read)
      await Promise.all(
        unread.map((n) => updateDoc(doc(db, 'notifications', n.id), { read: true }))
      )
    } catch (error) {
      console.error('[useNotifications] markAllAsRead error:', error)
    }
  }, [proId, notifications])

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead }
}
