'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth'
import { invalidateUserCache, useCurrentUser } from '@/hooks/useCurrentUser'

export function Header() {
  const { current, status } = useCurrentUser()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const isClient = current?.user && current.profile?.role === 'client'
  const isPro = current?.user && current.profile?.role === 'pro'
  const isLoggedIn = !!current?.user

  const handleSignOut = async () => {
    try {
      invalidateUserCache()
      await signOut()
    } finally {
      router.replace('/')
    }
  }

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-bookmeup-sm sticky top-0 z-50 rounded-b-[32px] border-b border-pink-100/50 animate-slideDown">
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-[#9C44AF] bg-clip-text text-transparent">
              BookMeUp
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden sm:flex items-center gap-6">
            <Link href="/" className="text-slate-700 hover:text-primary transition-colors font-medium text-sm">
              Accueil
            </Link>
            <Link href="/search" className="text-slate-700 hover:text-primary transition-colors font-medium text-sm">
              Recherche
            </Link>
            {isClient && (
              <Link href="/account/appointments" className="text-slate-700 hover:text-primary transition-colors text-sm font-medium">
                Mes rendez-vous
              </Link>
            )}
            {isClient && (
              <Link href="/account/settings" className="text-slate-700 hover:text-primary transition-colors text-sm font-medium">
                <span className="text-lg">⚙️</span>
              </Link>
            )}
            {isPro && (
              <Link href="/dashboard" className="text-slate-700 hover:text-primary transition-colors text-sm font-medium">
                Dashboard
              </Link>
            )}
            {status === 'loading' ? (
              <div className="h-9 w-24 rounded-[32px] bg-primary/10 animate-pulse" />
            ) : isLoggedIn ? (
              <Button variant="primary" size="sm" onClick={handleSignOut}>
                Se déconnecter
              </Button>
            ) : (
              <Link href="/auth/login">
                <Button variant="primary" size="sm">Connexion</Button>
              </Link>
            )}
          </nav>

          {/* Burger mobile */}
          <button
            className="sm:hidden flex flex-col gap-1.5 p-2 rounded-xl hover:bg-primary/5 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            <span className={`block w-5 h-0.5 bg-slate-700 transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-slate-700 transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-slate-700 transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        {/* Menu mobile déroulant */}
        {menuOpen && (
          <nav className="sm:hidden mt-4 pb-2 flex flex-col gap-1 border-t border-pink-100/50 pt-4">
            <Link href="/" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-[16px] text-slate-700 hover:bg-pink-50 hover:text-primary text-sm font-medium transition-colors">
              Accueil
            </Link>
            <Link href="/search" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-[16px] text-slate-700 hover:bg-pink-50 hover:text-primary text-sm font-medium transition-colors">
              Recherche
            </Link>
            {isClient && (
              <Link href="/account/appointments" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-[16px] text-slate-700 hover:bg-pink-50 hover:text-primary text-sm font-medium transition-colors">
                Mes rendez-vous
              </Link>
            )}
            {isClient && (
              <Link href="/account/settings" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-[16px] text-slate-700 hover:bg-pink-50 hover:text-primary text-sm font-medium transition-colors">
                Paramètres
              </Link>
            )}
            {isPro && (
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-[16px] text-slate-700 hover:bg-pink-50 hover:text-primary text-sm font-medium transition-colors">
                Dashboard
              </Link>
            )}
            <div className="mt-2">
              {isLoggedIn ? (
                <Button variant="primary" size="sm" className="w-full" onClick={handleSignOut}>
                  Se déconnecter
                </Button>
              ) : (
                <Link href="/auth/login" onClick={() => setMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">Connexion</Button>
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
