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
    <header className="glass sticky top-0 z-50 border-b border-[#EDE8F0] animate-slideDown">
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-8 h-[68px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[22px] font-extrabold tracking-tight gradient-text">
              BookMeUp
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden sm:flex items-center gap-1 flex-1">
            <Link href="/" className="px-3 py-2 rounded-xl text-[#7A6B80] hover:text-primary hover:bg-secondary transition-all font-medium text-sm">
              Accueil
            </Link>
            <Link href="/search" className="px-3 py-2 rounded-xl text-[#7A6B80] hover:text-primary hover:bg-secondary transition-all font-medium text-sm">
              Recherche
            </Link>
            {isClient && (
              <Link href="/account/appointments" className="px-3 py-2 rounded-xl text-[#7A6B80] hover:text-primary hover:bg-secondary transition-all text-sm font-medium">
                Mes rendez-vous
              </Link>
            )}
            {isPro && (
              <Link href="/dashboard" className="px-3 py-2 rounded-xl text-[#7A6B80] hover:text-primary hover:bg-secondary transition-all text-sm font-medium">
                Dashboard
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="hidden sm:flex items-center gap-2 ml-auto">
            {status === 'loading' ? (
              <div className="h-9 w-24 rounded-[20px] bg-primary/10 animate-pulse" />
            ) : isLoggedIn ? (
              <>
                {isClient && (
                  <Link href="/account/settings" className="p-2 rounded-xl text-[#7A6B80] hover:text-primary hover:bg-secondary transition-all text-sm">
                    ⚙️
                  </Link>
                )}
                <Button variant="subtle" size="sm" onClick={handleSignOut}>
                  Se déconnecter
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="subtle" size="sm">Connexion</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="primary" size="sm">S&apos;inscrire</Button>
                </Link>
              </>
            )}
          </div>

          {/* Burger mobile */}
          <button
            className="sm:hidden ml-auto flex flex-col gap-1.5 p-2 rounded-xl hover:bg-secondary transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            <span className={`block w-5 h-0.5 bg-[#2A1F2D] transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-[#2A1F2D] transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-[#2A1F2D] transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        {/* Menu mobile déroulant */}
        {menuOpen && (
          <nav className="sm:hidden pb-4 flex flex-col gap-1 border-t border-[#EDE8F0] pt-4 animate-fadeIn">
            <Link href="/" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-[14px] text-[#7A6B80] hover:bg-secondary hover:text-primary text-sm font-medium transition-colors">
              Accueil
            </Link>
            <Link href="/search" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-[14px] text-[#7A6B80] hover:bg-secondary hover:text-primary text-sm font-medium transition-colors">
              Recherche
            </Link>
            {isClient && (
              <Link href="/account/appointments" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-[14px] text-[#7A6B80] hover:bg-secondary hover:text-primary text-sm font-medium transition-colors">
                Mes rendez-vous
              </Link>
            )}
            {isClient && (
              <Link href="/account/settings" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-[14px] text-[#7A6B80] hover:bg-secondary hover:text-primary text-sm font-medium transition-colors">
                Paramètres
              </Link>
            )}
            {isPro && (
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-[14px] text-[#7A6B80] hover:bg-secondary hover:text-primary text-sm font-medium transition-colors">
                Dashboard
              </Link>
            )}
            <div className="mt-3 flex gap-2">
              {isLoggedIn ? (
                <Button variant="subtle" size="sm" className="flex-1" onClick={handleSignOut}>
                  Se déconnecter
                </Button>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="flex-1">
                    <Button variant="subtle" size="sm" className="w-full">Connexion</Button>
                  </Link>
                  <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">S&apos;inscrire</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
