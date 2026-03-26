'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/lib/firebaseClient'
import { doc, getDoc } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

// Vérifie si identitytoolkit.googleapis.com est joignable (5s max).
// Une réponse HTTP (même 400) prouve que le réseau fonctionne.
// Un AbortError ou TypeError indique un bloc réseau / AdBlock / pare-feu.
async function checkFirebaseReachable(apiKey: string): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        signal: controller.signal,
      }
    )
    return true // n'importe quelle réponse = réseau OK
  } catch {
    return false // abort (timeout 5s) ou TypeError (bloqué)
  } finally {
    clearTimeout(timer)
  }
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Vérification Firebase au montage
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    console.log('[AUTH] firebase config', { hasApiKey: !!apiKey, authDomain, projectId })
    if (!apiKey || !authDomain || !projectId) {
      setError('Configuration Firebase manquante. Vérifiez le fichier .env.local.')
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    console.time('[PERF] login total')
    console.log('[AUTH] submit', { email })

    try {
      // Pré-test réseau (5s) : détecte AdBlock / firewall avant de tenter la connexion
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
      if (apiKey) {
        const reachable = await checkFirebaseReachable(apiKey)
        if (!reachable) {
          setError(
            'Firebase est inaccessible depuis votre navigateur.\n' +
            '→ Désactivez votre AdBlocker (uBlock, Brave, etc.)\n' +
            '→ Ou ouvrez un onglet en navigation privée\n' +
            '→ Ou testez depuis un autre réseau / 4G'
          )
          return
        }
      }

      console.time('[PERF] signIn')
      const cred = await signInWithEmailAndPassword(auth, email, password)
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
        errorMessage = 'La connexion a expiré (15s). Désactivez votre AdBlocker ou essayez en navigation privée.'
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Erreur réseau. Vérifiez votre connexion internet ou désactivez votre AdBlocker.'
      } else if (err.code === 'auth/unauthorized-domain') {
        errorMessage = 'Domaine non autorisé dans Firebase. Ajoutez ce domaine dans Firebase Console → Authentication → Settings → Authorized domains.'
      } else if (err.code === 'auth/invalid-api-key' || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        errorMessage = 'Configuration Firebase invalide. Vérifiez le fichier .env.local.'
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = 'Email ou mot de passe incorrect.'
      } else if (err.code) {
        errorMessage = `Erreur [${err.code}]: ${err.message || 'Connexion impossible'}`
      }
      
      setError(errorMessage)
    } finally {
      console.log('[AUTH] finally setLoading false')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-extrabold gradient-text">BookMeUp</span>
          <p className="text-sm text-[#7A6B80] mt-1">Votre espace beauté en ligne</p>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-bookmeup border border-[#EDE8F0]">
          <h1 className="text-2xl font-extrabold text-[#2A1F2D] mb-1 text-center">
            Connexion
          </h1>
          <p className="text-sm text-[#7A6B80] text-center mb-7">
            Connectez-vous à votre compte BookMeUp
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[16px] text-sm whitespace-pre-line">
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

            <Button type="submit" disabled={loading} className="w-full btn-gradient rounded-[16px] py-3 font-bold">
              {loading ? 'Connexion…' : 'Se connecter →'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Mot de passe oublié ?
            </Link>
            <p className="text-sm text-[#7A6B80]">
              Pas encore de compte ?{' '}
              <Link
                href={`/auth/signup?${searchParams.toString()}`}
                className="text-primary hover:underline font-semibold"
              >
                S'inscrire gratuitement
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

