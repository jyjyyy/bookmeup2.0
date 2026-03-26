'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { getCurrentUser, sendResetEmail, signOut } from '@/lib/auth'
import { auth } from '@/lib/firebaseClient'
import { deleteUser } from 'firebase/auth'
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
        <div className="flex flex-col items-center gap-3 text-[#7A6B80]">
          <Loader />
          <p className="text-sm">Chargement…</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      suppressHydrationWarning
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5 max-w-3xl"
    >
      <div>
        <h1 className="text-2xl font-extrabold text-[#2A1F2D] mb-1">Sécurité</h1>
        <p className="text-sm text-[#7A6B80]">
          Gérez la sécurité de votre compte et votre accès à BookMeUp.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-[16px] text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] rounded-[16px] text-sm">
          {success}
        </div>
      )}

      <div className="bg-white rounded-[24px] border border-[#EDE8F0] shadow-bookmeup-sm p-6">
        <h2 className="text-base font-bold text-[#2A1F2D] mb-1">Mot de passe</h2>
        <p className="text-sm text-[#7A6B80] mb-4">Recevez un email pour changer votre mot de passe en toute sécurité.</p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-[#7A6B80]">
            <p>Email : <span className="font-semibold text-[#2A1F2D]">{email}</span></p>
            <p className="text-xs mt-0.5">Un lien de réinitialisation sera envoyé à cette adresse.</p>
          </div>
          <Button
            type="button"
            onClick={handleChangePassword}
            disabled={sendingReset}
            className="btn-gradient rounded-[12px] whitespace-nowrap text-sm font-semibold"
          >
            {sendingReset ? 'Envoi…' : 'Changer mon mot de passe'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-[#EDE8F0] shadow-bookmeup-sm p-6">
        <h2 className="text-base font-bold text-[#2A1F2D] mb-1">Déconnexion</h2>
        <p className="text-sm text-[#7A6B80] mb-4">Terminez votre session sur cet appareil.</p>
        <Button
          type="button"
          variant="outline"
          onClick={handleLogout}
          disabled={loggingOut}
          className="rounded-[12px] text-sm font-semibold border-[#EDE8F0] text-[#2A1F2D] hover:border-primary hover:text-primary"
        >
          {loggingOut ? 'Déconnexion…' : 'Me déconnecter'}
        </Button>
      </div>

      <div className="bg-white rounded-[24px] border border-red-100 shadow-bookmeup-sm p-6">
        <h2 className="text-base font-bold text-red-700 mb-1">Supprimer mon compte</h2>
        <p className="text-sm text-[#7A6B80] mb-4">Cette action est définitive. Vous ne pourrez plus accéder à votre compte.</p>
        <div className="space-y-3">
          {confirmDelete && (
            <p className="text-sm text-red-600 bg-red-50 rounded-[12px] px-4 py-3">
              Êtes-vous sûr ? Cette action est irréversible.
            </p>
          )}
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="rounded-[12px] text-sm font-semibold"
          >
            {deleting
              ? 'Suppression en cours…'
              : confirmDelete
              ? 'Confirmer la suppression définitive'
              : 'Supprimer mon compte'}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

