'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Helper pour forcer un timeout sur les promesses
function withTimeout<T>(p: Promise<T>, ms = 15000): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(Object.assign(new Error("LOGIN_TIMEOUT"), { code: "LOGIN_TIMEOUT" })), ms)
    )
  ]) as Promise<T>
}

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    try {
      console.time('[PERF] signIn')
      const cred = await withTimeout(signInWithEmailAndPassword(auth, email, password), 15000)
      console.timeEnd('[PERF] signIn')
      console.log('[AUTH] signIn resolved', { uid: cred.user.uid })
      
      // For now: redirect everyone to /dashboard
      console.time('[PERF] router.push')
      router.push('/dashboard')
      console.timeEnd('[PERF] router.push')
      console.timeEnd('[PERF] login total')
    } catch (err: any) {
      console.timeEnd('[PERF] login total')
      console.log('[AUTH] signIn failed/timeout', err?.code, err?.message, err)
      
      let errorMessage = err.message || 'Erreur lors de la connexion. Vérifiez vos identifiants.'
      
      if (err.code === 'LOGIN_TIMEOUT') {
        errorMessage = 'Connexion bloquée (15s). Vérifiez VPN/AdBlock/DNS ou testez en 4G.'
      }
      
      setError(errorMessage)
    } finally {
      console.log('[AUTH] finally setLoading false')
      setLoading(false)
    }
  }

  return (
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
  )
}

