'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await signIn(email, password)

      // Charger le profil Firestore
      const profileRef = doc(db, 'profiles', user.uid)
      const profileSnap = await getDoc(profileRef)

      if (!profileSnap.exists()) {
        setError('Profil introuvable, contactez le support.')
        setLoading(false)
        return
      }

      const profileData = profileSnap.data()
      const role = profileData.role || 'client'

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
          console.error('[Login] Error creating session cookie:', sessionError)
          setError('Erreur lors de la création de la session. Veuillez réessayer.')
          setLoading(false)
          return
        }

        // Check subscription status first
        const { checkSubscriptionStatus } = await import('@/lib/subscription')
        const subscriptionStatus = await checkSubscriptionStatus(user.uid)
        
        if (!subscriptionStatus.hasActiveSubscription) {
          router.push('/dashboard/settings/subscription')
        } else {
          router.push('/dashboard')
        }
      } else {
        router.push('/search')
      }
    } catch (err: any) {
      setError(
        err.message || 'Erreur lors de la connexion. Vérifiez vos identifiants.'
      )
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-200">
          <h1 className="text-3xl font-bold text-primary mb-2 text-center">
            Connexion
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Connectez-vous à votre compte BookMeUp
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[32px] text-sm">
                {error}
              </div>
            )}

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
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Mot de passe oublié ?
            </Link>
            <p className="text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <Link
                href="/auth/signup"
                className="text-primary hover:underline font-medium"
              >
                S'inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

