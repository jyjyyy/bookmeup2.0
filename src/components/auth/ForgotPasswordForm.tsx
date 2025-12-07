'use client'

import { useState, FormEvent } from 'react'
import { sendResetEmail } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      await sendResetEmail(email)
      setSuccess(true)
    } catch (err: any) {
      setError(
        err.message || 'Erreur lors de l\'envoi de l\'email. Vérifiez votre adresse email.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-[32px] text-sm">
        Un email de réinitialisation a été envoyé à {email}. Vérifiez votre boîte de réception.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[32px] text-sm">
          {error}
        </div>
      )}

      <p className="text-gray-600 text-sm mb-4">
        Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
      </p>

      <Input
        type="email"
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={loading}
      />

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Envoi...' : 'Envoyer l\'email de réinitialisation'}
      </Button>
    </form>
  )
}

