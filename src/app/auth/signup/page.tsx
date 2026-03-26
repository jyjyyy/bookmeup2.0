'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signUp, UserRole } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole>('client')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Le nom est requis.')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    setLoading(true)

    try {
      const user = await signUp(email, password, name, role)
      
      // Vérifier s'il y a une redirection vers une page de réservation
      const redirectUrl = searchParams.get('redirect')
      const serviceId = searchParams.get('service_id')
      const date = searchParams.get('date')
      const time = searchParams.get('time')

      if (redirectUrl && redirectUrl.startsWith('/booking/') && role === 'client') {
        // Construire l'URL de réservation avec les paramètres restaurés
        const bookingParams = new URLSearchParams()
        if (serviceId) bookingParams.set('service_id', serviceId)
        if (date) bookingParams.set('date', date)
        if (time) bookingParams.set('time', time)
        
        const bookingUrl = bookingParams.toString()
          ? `${redirectUrl}?${bookingParams.toString()}`
          : redirectUrl
        
        router.push(bookingUrl)
        return
      }
      
      // Redirection selon le rôle
      if (role === 'pro') {
        // Create session cookie for PRO users
        try {
          const idToken = await user.getIdToken()
          const sessionResponse = await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
            credentials: 'include',
          })

          const sessionData = await sessionResponse.json()
          
          if (!sessionResponse.ok || !sessionData.ok) {
            throw new Error(sessionData.error || 'Échec de la création de la session')
          }
        } catch (sessionError: any) {
          console.error('[Signup] Error creating session cookie:', sessionError)
          setError('Erreur lors de la création de la session. Veuillez réessayer.')
          setLoading(false)
          return
        }

        // New pro users must select subscription - redirect to subscription page
        router.push('/dashboard/settings/subscription')
      } else {
        router.push('/search')
      }
    } catch (err: any) {
      setError(
        err.message || 'Erreur lors de l\'inscription. Veuillez réessayer.'
      )
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-extrabold gradient-text">BookMeUp</span>
          <p className="text-sm text-[#7A6B80] mt-1">Créez votre compte gratuitement</p>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-bookmeup border border-[#EDE8F0]">
          <h1 className="text-2xl font-extrabold text-[#2A1F2D] mb-1 text-center">
            Inscription
          </h1>
          <p className="text-sm text-[#7A6B80] text-center mb-7">
            Créez votre compte BookMeUp
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[16px] text-sm">
                {error}
              </div>
            )}

            <Input
              type="text"
              label="Nom complet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              placeholder="Jean Dupont"
            />

            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />

            <Input
              type="password"
              label="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />

            <Input
              type="password"
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />

            {/* Sélecteur de rôle */}
            <div>
              <label className="block text-sm font-semibold text-[#2A1F2D] mb-2">
                Je suis
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  disabled={loading}
                  className={`
                    flex-1 px-4 py-3 rounded-[14px] font-semibold text-sm transition-all
                    ${
                      role === 'client'
                        ? 'bg-primary text-white shadow-bookmeup-sm'
                        : 'bg-secondary text-[#2A1F2D] hover:bg-primary/10'
                    }
                    disabled:opacity-50
                  `}
                >
                  Je suis cliente
                </button>
                <button
                  type="button"
                  onClick={() => setRole('pro')}
                  disabled={loading}
                  className={`
                    flex-1 px-4 py-3 rounded-[14px] font-semibold text-sm transition-all
                    ${
                      role === 'pro'
                        ? 'bg-primary text-white shadow-bookmeup-sm'
                        : 'bg-secondary text-[#2A1F2D] hover:bg-primary/10'
                    }
                    disabled:opacity-50
                  `}
                >
                  Je suis professionnelle
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full btn-gradient rounded-[16px] py-3 font-bold">
              {loading ? 'Inscription…' : 'Créer mon compte →'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#7A6B80]">
              Déjà un compte ?{' '}
              <Link
                href={`/auth/login?${searchParams.toString()}`}
                className="text-primary hover:underline font-semibold"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

