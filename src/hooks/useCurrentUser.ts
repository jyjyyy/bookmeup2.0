'use client'

import { useEffect, useState, useRef } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebaseClient'
import type { CurrentUser, Profile, UserRole } from '@/lib/auth'

type Status = 'loading' | 'ready'

interface UseCurrentUserResult {
  current: CurrentUser | null
  status: Status
}

// Cache module-level pour éviter de re-fetcher le profil à chaque montage
let cachedUser: CurrentUser | null = null
let cacheTimestamp = 0
const CACHE_TTL = 60_000 // 1 minute

export function useCurrentUser(): UseCurrentUserResult {
  const [current, setCurrent] = useState<CurrentUser | null>(cachedUser)
  const [status, setStatus] = useState<Status>(cachedUser ? 'ready' : 'loading')
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mountedRef.current) return

      if (!user) {
        cachedUser = { user: null, profile: null }
        cacheTimestamp = Date.now()
        setCurrent(cachedUser)
        setStatus('ready')
        return
      }

      // Utiliser le cache si encore frais
      const now = Date.now()
      if (
        cachedUser?.user?.uid === user.uid &&
        now - cacheTimestamp < CACHE_TTL
      ) {
        setCurrent(cachedUser)
        setStatus('ready')
        return
      }

      try {
        const snap = await getDoc(doc(db, 'profiles', user.uid))
        if (!mountedRef.current) return

        const profile: Profile | null = snap.exists()
          ? {
              id: snap.id,
              role: (snap.data().role as UserRole) ?? 'client',
              name: snap.data().name ?? null,
              email: snap.data().email ?? user.email ?? null,
              city: snap.data().city ?? null,
            }
          : null

        const result: CurrentUser = { user, profile }
        cachedUser = result
        cacheTimestamp = Date.now()
        setCurrent(result)
        setStatus('ready')
      } catch {
        if (!mountedRef.current) return
        setCurrent({ user, profile: null })
        setStatus('ready')
      }
    })

    return () => {
      mountedRef.current = false
      unsubscribe()
    }
  }, [])

  return { current, status }
}

// Invalider le cache (à appeler après signOut)
export function invalidateUserCache() {
  cachedUser = null
  cacheTimestamp = 0
}