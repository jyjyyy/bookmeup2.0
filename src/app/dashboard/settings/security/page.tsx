'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getCurrentUser, signOut, changePassword, deleteAccount, AuthError } from '@/lib/auth'
import { auth } from '@/lib/firebaseClient'
import { User } from 'firebase/auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'

export default function SecurityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // Delete Account State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Logout State
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true)
        const userData = await getCurrentUser()

        if (!userData.user || !userData.profile) {
          router.push('/auth/login')
          return
        }

        if (userData.profile.role !== 'pro') {
          router.push('/')
          return
        }

        setCurrentUser(userData.user)
      } catch (err: any) {
        console.error('Error loading user:', err)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Tous les champs sont requis')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas')
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError('Le nouveau mot de passe doit être différent de l\'ancien')
      return
    }

    if (!currentUser) {
      setPasswordError('Utilisateur non authentifié')
      return
    }

    try {
      setChangingPassword(true)

      // Use shared changePassword function
      await changePassword(currentUser, currentPassword, newPassword)

      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (error: any) {
      if (error instanceof AuthError) {
        setPasswordError(error.userMessage)
      } else {
        setPasswordError(error.message || 'Erreur lors du changement de mot de passe')
      }
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') {
      setDeleteError('Veuillez taper "SUPPRIMER" pour confirmer')
      return
    }

    if (!currentUser) {
      setDeleteError('Utilisateur non authentifié')
      return
    }

    try {
      setDeletingAccount(true)
      setDeleteError(null)

      // Use shared deleteAccount function
      await deleteAccount(currentUser)

      // Sign out and redirect
      await signOut()
      router.push('/auth/login?message=account-deleted')
    } catch (error: any) {
      if (error instanceof AuthError) {
        setDeleteError(error.userMessage)
      } else {
        setDeleteError(error.message || 'Erreur lors de la suppression du compte')
      }
    } finally {
      setDeletingAccount(false)
    }
  }

  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      await signOut()
      router.push('/auth/login')
    } catch (error: any) {
      console.error('Error logging out:', error)
    } finally {
      setLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">Sécurité</h1>
        <p className="text-gray-600">
          Gérez la sécurité de votre compte professionnel
        </p>
      </div>

      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="rounded-[32px] p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#2A1F2D] mb-2">
                Changer le mot de passe
              </h2>
              <p className="text-sm text-gray-600">
                Mettez à jour votre mot de passe pour renforcer la sécurité de votre compte.
              </p>
            </div>

            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[24px] text-sm">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-[24px] text-sm">
                ✓ Mot de passe modifié avec succès
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe actuel
                </label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={changingPassword}
                  className="rounded-[24px]"
                  required
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={changingPassword}
                  className="rounded-[24px]"
                  required
                  minLength={6}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Minimum 6 caractères
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le nouveau mot de passe
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={changingPassword}
                  className="rounded-[24px]"
                  required
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={changingPassword}
                  className="rounded-[32px] px-6"
                >
                  {changingPassword ? (
                    <span className="flex items-center gap-2">
                      <Loader />
                      Modification...
                    </span>
                  ) : (
                    'Modifier le mot de passe'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="rounded-[32px] p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[#2A1F2D] mb-2">
                Déconnexion
              </h2>
              <p className="text-sm text-gray-600">
                Déconnectez-vous de votre compte professionnel.
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleLogout}
                disabled={loggingOut}
                variant="outline"
                className="rounded-[32px] px-6"
              >
                {loggingOut ? (
                  <span className="flex items-center gap-2">
                    <Loader />
                    Déconnexion...
                  </span>
                ) : (
                  'Se déconnecter'
                )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Delete Account */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="rounded-[32px] p-6 border-red-200">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-red-600 mb-2">
                Supprimer le compte
              </h2>
              <p className="text-sm text-gray-600 mb-2">
                La suppression de votre compte est définitive.
              </p>
              <p className="text-sm text-gray-600">
                Toutes vos données professionnelles seront conservées dans notre système pour des raisons légales et de facturation.
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setDeleteModalOpen(true)}
                variant="outline"
                className="rounded-[32px] px-6 border-red-300 text-red-600 hover:bg-red-50"
              >
                Supprimer mon compte
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Delete Account Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] p-6 max-w-md w-full shadow-xl"
          >
            <h3 className="text-xl font-bold text-red-600 mb-4">
              Confirmer la suppression
            </h3>
            
            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-700">
                <strong className="text-red-600">Attention :</strong> Cette action est irréversible.
              </p>
              <p className="text-sm text-gray-700">
                Votre compte Firebase Auth sera supprimé. Vos données Firestore (bookings, services, etc.) seront conservées pour des raisons légales.
              </p>
              <p className="text-sm font-medium text-gray-900">
                Pour confirmer, tapez <strong className="text-red-600">SUPPRIMER</strong> ci-dessous :
              </p>
              
              <Input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => {
                  setDeleteConfirmText(e.target.value)
                  setDeleteError(null)
                }}
                disabled={deletingAccount}
                className="rounded-[24px]"
                placeholder="SUPPRIMER"
              />

              {deleteError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[24px] text-sm">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setDeleteConfirmText('')
                  setDeleteError(null)
                }}
                disabled={deletingAccount}
                variant="outline"
                className="rounded-[32px] px-6"
              >
                Annuler
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={deletingAccount || deleteConfirmText !== 'SUPPRIMER'}
                className="rounded-[32px] px-6 bg-red-600 hover:bg-red-700"
              >
                {deletingAccount ? (
                  <span className="flex items-center gap-2">
                    <Loader />
                    Suppression...
                  </span>
                ) : (
                  'Supprimer définitivement'
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
