'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebaseClient'
import { getCurrentUser, type CurrentUser, signOut } from '@/lib/auth'

export function Header() {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-white/95 backdrop-blur-sm shadow-bookmeup-sm sticky top-0 z-50 rounded-b-[32px] border-b border-pink-100/50"
    >
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-[#9C44AF] bg-clip-text text-transparent">
              BookMeUp
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-slate-700 hover:text-primary transition-colors font-medium text-sm hidden sm:block"
            >
              Accueil
            </Link>
            <Link
              href="/search"
              className="text-slate-700 hover:text-primary transition-colors font-medium text-sm hidden sm:block"
            >
              Recherche
            </Link>
            {/* Lien CLIENT vers Mes rendez-vous */}
            <ClientAppointmentsLink />
            {/* Lien vers les paramètres CLIENT uniquement */}
            <ClientSettingsLink />
            <AuthButton />
          </nav>
        </div>
      </div>
    </motion.header>
  )
}

function AuthButton() {
  const router = useRouter()
  const [current, setCurrent] = useState<CurrentUser | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setCurrent({ user: null, profile: null })
      } else {
        setCurrent((prev) =>
          prev ? { ...prev, user } : { user, profile: null }
        )
      }
    })

    return () => unsubscribe()
  }, [])

  // Pas d'utilisateur connecté → bouton Connexion
  if (!current?.user) {
    return (
      <Link href="/auth/login">
        <Button variant="primary" size="sm">
          Connexion
        </Button>
      </Link>
    )
  }

  // Utilisateur connecté (CLIENT ou PRO) → bouton Se déconnecter
  return (
    <Button
      variant="primary"
      size="sm"
      onClick={async () => {
        try {
          await signOut()
        } finally {
          router.replace('/')
        }
      }}
    >
      Se déconnecter
    </Button>
  )
}

function ClientAppointmentsLink() {
  const [current, setCurrent] = useState<CurrentUser | null>(null)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const data = await getCurrentUser()
        if (isMounted) {
          setCurrent(data)
        }
      } catch {
        if (isMounted) {
          setCurrent({ user: null, profile: null })
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [])

  if (!current?.user || current.profile?.role !== 'client') {
    return null
  }

  return (
    <Link
      href="/account/appointments"
      className="hidden sm:flex items-center gap-1 text-slate-700 hover:text-primary transition-colors text-sm font-medium"
    >
      <span>Mes rendez-vous</span>
    </Link>
  )
}

function ClientSettingsLink() {
  const [current, setCurrent] = useState<CurrentUser | null>(null)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const data = await getCurrentUser()
        if (isMounted) {
          setCurrent(data)
        }
      } catch {
        if (isMounted) {
          setCurrent({ user: null, profile: null })
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [])

  if (!current?.user || current.profile?.role !== 'client') {
    return null
  }

  return (
    <Link
      href="/account/settings"
      className="hidden sm:flex items-center text-slate-700 hover:text-primary transition-colors text-sm font-medium"
    >
      <span className="text-lg">⚙️</span>
    </Link>
  )
}


