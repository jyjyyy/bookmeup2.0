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
        <div className="flex flex-col items-center gap-3 text-[#8a7a92]">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-primary/10 to-secondary flex items-center justify-center">
            <Loader />
          </div>
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
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[#9C44AF] text-xs font-semibold mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Sécurité
        </div>
        <h1 className="text-2xl font-extrabold text-[#2A1F2D] mb-1">Sécurité du compte</h1>
        <p className="text-sm text-[#8a7a92]">
          Gérez la sécurité de votre compte et votre accès à BookMeUp.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50/80 border border-red-200/60 text-red-700 rounded-[16px] text-sm flex items-center gap-3 backdrop-blur-sm">
          <div className="w-8 h-8 rounded-[8px] bg-red-100 flex items-center justify-center shrink-0 text-xs">⚠️</div>
          <p className="text-xs">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50/80 border border-emerald-200/60 text-emerald-700 rounded-[16px] text-sm flex items-center gap-3 backdrop-blur-sm">
          <div className="w-8 h-8 rounded-[8px] bg-emerald-100 flex items-center justify-center shrink-0 text-xs">✅</div>
          <p className="text-xs">{success}</p>
        </div>
      )}

      {/* Password */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-white rounded-[22px] border border-[#EDE8F0] shadow-[0_4px_20px_rgba(20,0,50,0.04)] p-6 hover:shadow-[0_6px_28px_rgba(20,0,50,0.06)] transition-shadow"
      >
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-blue-100/60 to-blue-50 flex items-center justify-center text-lg">🔑</div>
          <div>
            <h2 className="text-[15px] font-bold text-[#2A1F2D]">Mot de passe</h2>
            <p className="text-xs text-[#8a7a92]">Recevez un email pour changer votre mot de passe.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-[16px] bg-[#FDFBFE] border border-[#EDE8F0]">
          <div className="text-sm text-[#8a7a92]">
            <p className="text-xs">Email : <span className="font-semibold text-[#2A1F2D]">{email}</span></p>
            <p className="text-[11px] mt-0.5 text-[#B5A8BE]">Un lien de réinitialisation sera envoyé à cette adresse.</p>
          </div>
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={sendingReset}
            className="btn-gradient rounded-full px-6 py-2.5 whitespace-nowrap text-sm font-bold shadow-[0_4px_16px_rgba(200,109,215,0.3)] hover:shadow-[0_6px_24px_rgba(200,109,215,0.4)] transition-all disabled:opacity-50"
          >
            {sendingReset ? 'Envoi…' : 'Changer mon mot de passe'}
          </button>
        </div>
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="bg-white rounded-[22px] border border-[#EDE8F0] shadow-[0_4px_20px_rgba(20,0,50,0.04)] p-6 hover:shadow-[0_6px_28px_rgba(20,0,50,0.06)] transition-shadow"
      >
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-amber-100/60 to-amber-50 flex items-center justify-center text-lg">🚪</div>
          <div>
            <h2 className="text-[15px] font-bold text-[#2A1F2D]">Déconnexion</h2>
            <p className="text-xs text-[#8a7a92]">Terminez votre session sur cet appareil.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="rounded-full text-sm font-semibold border border-[#EDE8F0] text-[#2A1F2D] hover:border-primary/30 hover:text-primary hover:bg-primary/5 px-6 py-2.5 transition-all disabled:opacity-50"
        >
          {loggingOut ? 'Déconnexion…' : 'Me déconnecter'}
        </button>
      </motion.div>

      {/* Delete account */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-[22px] border border-red-200/40 shadow-[0_4px_20px_rgba(20,0,50,0.04)] p-6"
      >
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-red-100/60 to-red-50 flex items-center justify-center text-lg">🗑️</div>
          <div>
            <h2 className="text-[15px] font-bold text-red-600">Supprimer mon compte</h2>
            <p className="text-xs text-[#8a7a92]">Cette action est définitive et irréversible.</p>
          </div>
        </div>
        <div className="space-y-3">
          {confirmDelete && (
            <div className="p-4 rounded-[14px] bg-red-50/80 border border-red-200/40 text-sm text-red-600 flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-red-100 flex items-center justify-center shrink-0 text-xs">⚠️</div>
              <p className="text-xs">Êtes-vous sûr ? Cette action est irréversible et toutes vos données seront supprimées.</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleting}
            className={`rounded-full text-sm font-bold px-6 py-2.5 transition-all disabled:opacity-50 ${
              confirmDelete
                ? 'bg-red-500 text-white shadow-[0_4px_16px_rgba(239,68,68,0.3)] hover:bg-red-600'
                : 'border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300'
            }`}
          >
            {deleting
              ? 'Suppression en cours…'
              : confirmDelete
              ? 'Confirmer la suppression définitive'
              : 'Supprimer mon compte'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
