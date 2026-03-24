'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { getCurrentUser, sendResetEmail, signOut } from '@/lib/auth'
import { auth } from '@/lib/firebaseClient'
import { deleteUser } from 'firebase/auth'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'

export default function SecurityPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [sendingReset, setSendingReset] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const current = await getCurrentUser()

        if (!current.user || !current.profile) {
          router.replace('/auth/login?redirect=/dashboard/settings/security')
          return
        }

        if (current.profile.role !== 'pro') {
          router.replace('/')
          return
        }

        setEmail(current.profile.email || current.user.email || null)
      } catch (err: any) {
        console.error('[DashboardSecurity] Error loading user:', err)
        setError(err?.message || 'Erreur lors du chargement de vos paramètres.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router])

  const handleChangePassword = async () => {
    if (sendingReset) return

    if (!email) {
      setError("Impossible d'envoyer l'email de réinitialisation (email manquant).")
      return
    }

    try {
      setSendingReset(true)
      setError(null)
      setSuccess(null)

      await sendResetEmail(email)
      setSuccess(
        'Un email de réinitialisation de mot de passe a été envoyé. Consultez votre boîte mail.'
      )
    } catch (err: any) {
      console.error('[DashboardSecurity] Error sending reset email:', err)
      setError(err?.message || "Erreur lors de l'envoi de l'email de réinitialisation.")
    } finally {
      setSendingReset(false)
    }
  }

  const handleLogout = async () => {
    if (loggingOut) return

    try {
      setLoggingOut(true)
      setError(null)
      setSuccess(null)

      await signOut()

      const redirect = searchParams.get('redirect')
      if (redirect && redirect.startsWith('/')) {
        router.replace(redirect)
      } else {
        router.replace('/')
      }
    } catch (err: any) {
      console.error('[DashboardSecurity] Error during logout:', err)
      setError(err?.message || 'Erreur lors de la déconnexion.')
    } finally {
      setLoggingOut(false)
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

      router.replace('/')
    } catch (err: any) {
      console.error('[DashboardSecurity] Error deleting account:', err)

      if (err?.code === 'auth/requires-recent-login') {
        setError('Pour supprimer votre compte, veuillez vous reconnecter puis réessayer.')
      } else {
        setError(err?.message || 'Erreur lors de la suppression du compte. Veuillez réessayer.')
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-3xl"
    >
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">Sécurité</h1>
        <p className="text-gray-600 text-sm">
          Gérez la sécurité de votre compte et votre accès à BookMeUp.
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-[32px] text-sm"
        >
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-[32px] text-sm"
        >
          {success}
        </motion.div>
      )}

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
            disabled={sendingReset}
            className="rounded-[32px] whitespace-nowrap"
          >
            {sendingReset ? 'Envoi...' : 'Changer mon mot de passe'}
          </Button>
        </div>
      </Card>

      <Card className="rounded-[32px] shadow-bookmeup p-6">
        <CardHeader>
          <CardTitle>Déconnexion</CardTitle>
          <CardDescription>Terminez votre session sur cet appareil.</CardDescription>
        </CardHeader>
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-[32px]"
          >
            {loggingOut ? 'Déconnexion...' : 'Me déconnecter'}
          </Button>
        </div>
      </Card>

      <Card className="rounded-[32px] shadow-bookmeup p-6 border border-red-100">
        <CardHeader>
          <CardTitle className="text-red-700">Supprimer mon compte</CardTitle>
          <CardDescription>
            Cette action est définitive. Vous ne pourrez plus accéder à votre compte.
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
  )
}

