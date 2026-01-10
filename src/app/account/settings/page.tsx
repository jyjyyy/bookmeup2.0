'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { getCurrentUser, signOut, sendResetEmail } from '@/lib/auth'
import { auth } from '@/lib/firebaseClient'
import { deleteUser } from 'firebase/auth'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'

export default function ClientSettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const current = await getCurrentUser()

        if (!current.user || !current.profile) {
          // Preserve redirect back to settings after login
          router.replace('/auth/login?redirect=/account/settings')
          return
        }

        if (current.profile.role !== 'client') {
          // Non-client users should not access this page
          router.replace('/')
          return
        }

        setEmail(current.profile.email || current.user.email || null)
      } catch (err: any) {
        console.error('[ClientSettings] Error loading user:', err)
        setError(err.message || 'Erreur lors du chargement de vos paramètres.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router])

  const handleLogout = async () => {
    try {
      setError(null)
      await signOut()

      const redirect = searchParams.get('redirect')
      if (redirect && redirect.startsWith('/')) {
        router.replace(redirect)
      } else {
        router.replace('/')
      }
    } catch (err: any) {
      console.error('[ClientSettings] Error during logout:', err)
      setError(err.message || 'Erreur lors de la déconnexion.')
    }
  }

  const handleChangePassword = async () => {
    if (!email) {
      setError("Impossible d'envoyer l'email de réinitialisation (email manquant).")
      return
    }

    try {
      setError(null)
      setSuccess(null)
      await sendResetEmail(email)
      setSuccess(
        'Un email de réinitialisation de mot de passe a été envoyé. Consultez votre boîte mail.'
      )
    } catch (err: any) {
      console.error('[ClientSettings] Error sending reset email:', err)
      setError(
        err.message || "Erreur lors de l'envoi de l'email de réinitialisation."
      )
    }
  }

  const handleDeleteAccount = async () => {
    if (deleting) return

    if (!confirmDelete) {
      setConfirmDelete(true)
      setSuccess(null)
      setError(null)
      return
    }

    const user = auth.currentUser
    if (!user) {
      setError('Aucun utilisateur connecté.')
      return
    }

    try {
      setDeleting(true)
      setError(null)
      setSuccess(null)

      await deleteUser(user)

      // After deletion, redirect to home
      router.replace('/')
    } catch (err: any) {
      console.error('[ClientSettings] Error deleting account:', err)

      if (err.code === 'auth/requires-recent-login') {
        setError(
          'Pour supprimer votre compte, veuillez vous reconnecter puis réessayer.'
        )
      } else {
        setError(
          err.message || 'Erreur lors de la suppression du compte. Veuillez réessayer.'
        )
      }
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-10 rounded-[32px] text-center">
          <Loader />
          <p className="mt-4 text-gray-600">Chargement de vos paramètres...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto space-y-6"
        >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Paramètres du compte
        </h1>
        <p className="text-sm text-gray-600">
          Gérez la sécurité de votre compte et votre accès à BookMeUp.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-[32px] text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-[32px] text-sm">
          {success}
        </div>
      )}

      {/* Mot de passe */}
      <Card className="rounded-[32px] shadow-bookmeup p-6">
        <CardHeader>
          <CardTitle>Mot de passe</CardTitle>
          <CardDescription>
            Recevez un email pour changer votre mot de passe en toute sécurité.
          </CardDescription>
        </CardHeader>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-600">
            <p className="font-medium">
              Adresse email : <span className="font-semibold">{email}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Un lien de réinitialisation sera envoyé à cette adresse.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleChangePassword}
            className="rounded-[32px] whitespace-nowrap"
          >
            Changer mon mot de passe
          </Button>
        </div>
      </Card>

      {/* Déconnexion */}
      <Card className="rounded-[32px] shadow-bookmeup p-6">
        <CardHeader>
          <CardTitle>Déconnexion</CardTitle>
          <CardDescription>
            Terminez votre session sur cet appareil.
          </CardDescription>
        </CardHeader>
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            className="rounded-[32px]"
          >
            Me déconnecter
          </Button>
        </div>
      </Card>

      {/* Suppression du compte */}
      <Card className="rounded-[32px] shadow-bookmeup p-6 border border-red-100">
        <CardHeader>
          <CardTitle className="text-red-700">Supprimer mon compte</CardTitle>
          <CardDescription>
            Cette action est définitive. Toutes vos réservations futures seront
            annulées et vous ne pourrez plus accéder à votre compte.
          </CardDescription>
        </CardHeader>
        <div className="mt-4 space-y-3">
          {confirmDelete && (
            <p className="text-sm text-red-600">
              Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est
              irréversible.
            </p>
          )}
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="rounded-[32px]"
          >
            {deleting
              ? 'Suppression en cours...'
              : confirmDelete
              ? 'Confirmer la suppression définitive'
              : 'Supprimer mon compte'}
          </Button>
        </div>
      </Card>
        </motion.div>
      </div>
    </div>
  )
}


