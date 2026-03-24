'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebaseClient'
import { doc, getDoc } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

// Helper pour forcer un timeout sur les promesses
function withTimeout<T>(p: Promise<T>, ms = 15000): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(Object.assign(new Error("LOGIN_TIMEOUT"), { code: "LOGIN_TIMEOUT" })), ms)
    )
  ]) as Promise<T>
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Log Firebase initialization au montage
  useEffect(() => {
    console.log('[AUTH] firebase', {
      apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    })
  }, [])

  // Debug: log onAuthStateChanged
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      console.log('[AUTH] onAuthStateChanged', u?.uid ?? null)
    })
    return () => unsub()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    console.time('[PERF] login total')
    console.log('[AUTH] submit', { email })

    try {
      console.time('[PERF] signIn')
      const cred = await withTimeout(signInWithEmailAndPassword(auth, email, password), 15000)
      console.timeEnd('[PERF] signIn')
      console.log('[AUTH] signIn resolved', { uid: cred.user.uid })
      
      const user = cred.user

      // Charger le profil Firestore
      console.time('[PERF] fetch profile')
      const profileRef = doc(db, 'profiles', user.uid)
      const profileSnap = await getDoc(profileRef)
      console.timeEnd('[PERF] fetch profile')

      if (!profileSnap.exists()) {
        console.timeEnd('[PERF] login total')
        setError('Profil introuvable, contactez le support.')
        return
      }

      const profileData = profileSnap.data()
      const role = profileData.role || 'client'

      // Vérifier s'il y a une redirection vers une page de réservation
      const redirectUrl = searchParams.get('redirect')
      const serviceId = searchParams.get('service_id')
      const date = searchParams.get('date')
      const time = searchParams.get('time')

      if (redirectUrl && redirectUrl.startsWith('/booking/')) {
        // Construire l'URL de réservation avec les paramètres restaurés
        const bookingParams = new URLSearchParams()
        if (serviceId) bookingParams.set('service_id', serviceId)
        if (date) bookingParams.set('date', date)
        if (time) bookingParams.set('time', time)
        
        const bookingUrl = bookingParams.toString()
          ? `${redirectUrl}?${bookingParams.toString()}`
          : redirectUrl
        
        console.time('[PERF] router.push')
        router.push(bookingUrl)
        console.timeEnd('[PERF] router.push')
        console.timeEnd('[PERF] login total')
        return
      }

      // Redirection selon le rôle
      if (role === 'pro') {
        // Create session cookie for PRO users
        try {
          console.time('[PERF] session fetch')
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
          console.timeEnd('[PERF] session fetch')
          
          if (!sessionResponse.ok || !sessionData.ok) {
            throw new Error(sessionData.error || 'Échec de la création de la session')
          }
        } catch (sessionError: any) {
          console.timeEnd('[PERF] login total')
          console.error('[Login] Error creating session cookie:', sessionError)
          setError('Erreur lors de la création de la session. Veuillez réessayer.')
          return
        }

        // Check subscription status first
        console.time('[PERF] check subscription')
        const { checkSubscriptionStatus } = await import('@/lib/subscription')
        const subscriptionStatus = await checkSubscriptionStatus(user.uid)
        console.timeEnd('[PERF] check subscription')
        
        console.time('[PERF] router.push')
        if (!subscriptionStatus.hasActiveSubscription) {
          router.push('/dashboard/settings/subscription')
        } else {
          router.push('/dashboard')
        }
        console.timeEnd('[PERF] router.push')
        console.timeEnd('[PERF] login total')
      } else {
        console.time('[PERF] router.push')
        router.push('/search')
        console.timeEnd('[PERF] router.push')
        console.timeEnd('[PERF] login total')
      }
    } catch (err: any) {
      console.timeEnd('[PERF] login total')
      console.log('[AUTH] signIn failed/timeout', err?.code, err?.message, err)
      
      // Gérer les erreurs spécifiques
      let errorMessage = err.message || 'Erreur lors de la connexion. Vérifiez vos identifiants.'
      
      if (err.code === 'LOGIN_TIMEOUT') {
        errorMessage = 'Connexion bloquée (15s). Vérifiez VPN/AdBlock/DNS ou testez en 4G.'
      } else if (err.code === 'auth/unauthorized-domain') {
        errorMessage = 'Domaine non autorisé dans Firebase Auth. Ajoutez localhost dans Authorized domains.'
      } else if (err.code === 'auth/invalid-api-key' || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        errorMessage = 'Erreur de configuration: clé API Firebase invalide ou manquante.'
      } else if (err.code) {
        // Afficher le code d'erreur + message
        errorMessage = `[${err.code}] ${err.message || 'Erreur lors de la connexion'}`
      }
      
      setError(errorMessage)
    } finally {
      console.log('[AUTH] finally setLoading false')
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
                href={`/auth/signup?${searchParams.toString()}`}
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

