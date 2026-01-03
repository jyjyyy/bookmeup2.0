'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/authContext'
import { signOut } from '@/lib/auth'

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, refresh } = useAuth()

  // Hide header on dashboard pages (dashboard has its own header)
  const isDashboardPage = pathname?.startsWith('/dashboard')

  const handleLogout = async () => {
    try {
      await signOut()
      await refresh() // Refresh auth state after logout
      router.push('/')
    } catch (error) {
      console.error('[Header] Error during logout:', error)
    }
  }

  // Don't render header on dashboard pages
  if (isDashboardPage) {
    return null
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
            {!loading && user && user.role === 'client' && (
              <>
                <Link
                  href="/account/appointments"
                  className="text-slate-700 hover:text-primary transition-colors font-medium text-sm hidden sm:block"
                >
                  Mes rendez-vous
                </Link>
                <Link
                  href="/account/settings"
                  className="text-slate-700 hover:text-primary transition-colors text-xl"
                  title="Paramètres"
                >
                  ⚙️
                </Link>
              </>
            )}
            {!loading && (
              user ? (
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Se déconnecter
                </Button>
              ) : (
                <Link href="/auth/login">
                  <Button variant="primary" size="sm">
                    Se connecter
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

