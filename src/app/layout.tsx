import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Header } from '@/components/layout/Header'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'BookMeUp - Réservation beauté en ligne',
  description: 'Réservez facilement avec les meilleurs professionnels de beauté. Simple, rapide, élégant.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="font-sans">
        <Header />
        {children}
      </body>
    </html>
  )
}
