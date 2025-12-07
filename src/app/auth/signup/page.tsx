'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signUp, UserRole } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
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
      await signUp(email, password, name, role)
      // Redirection selon le rôle
      if (role === 'pro') {
        router.push('/dashboard')
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-200">
          <h1 className="text-3xl font-bold text-primary mb-2 text-center">
            Inscription
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Créez votre compte BookMeUp
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[32px] text-sm">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Je suis
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  disabled={loading}
                  className={`
                    flex-1 px-4 py-3 rounded-full font-medium transition-all
                    ${
                      role === 'client'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                    flex-1 px-4 py-3 rounded-full font-medium transition-all
                    ${
                      role === 'pro'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                    disabled:opacity-50
                  `}
                >
                  Je suis professionnelle
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Inscription...' : 'S\'inscrire'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Déjà un compte ?{' '}
              <Link
                href="/auth/login"
                className="text-primary hover:underline font-medium"
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

