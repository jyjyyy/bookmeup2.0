'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

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
          <Link
            href="/"
            className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity flex items-center gap-2"
          >
            <span>BookMeUp</span>
            <span className="text-xl">✨</span>
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
            <Link href="/auth/login">
              <Button variant="primary" size="sm">
                Connexion
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </motion.header>
  )
}

