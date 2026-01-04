'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebaseClient'
import { signOut } from '@/lib/auth'

export function Header() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
      // Debug log as requested
      console.log('Auth user in navbar:', firebaseUser?.email ?? null)
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
      // Redirect to home page after logout
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

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
            {!loading && (
              user ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleLogout}
                >
                  Se déconnecter
                </Button>
              ) : (
                <Link href="/auth/login">
                  <Button variant="primary" size="sm">
                    Connexion
                  </Button>
                </Link>
              )
            )}
          </nav>
        </div>
      </div>
    </motion.header>
  )
}

