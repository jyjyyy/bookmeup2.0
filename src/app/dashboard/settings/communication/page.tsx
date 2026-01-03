'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getCurrentUser } from '@/lib/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'

type PlanType = 'starter' | 'pro' | 'premium'
type ReminderChannel = 'email' | 'sms'

export default function CommunicationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<PlanType | null>(null)
  const [reminderChannel, setReminderChannel] = useState<ReminderChannel>('email')

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        setError(null)

        const currentUser = await getCurrentUser()

        if (!currentUser.user || !currentUser.profile) {
          router.push('/auth/login')
          return
        }

        if (currentUser.profile.role !== 'pro') {
          router.push('/')
          return
        }

        const uid = currentUser.user.uid

        // Load current plan from Firestore
        const proDoc = await getDoc(doc(db, 'pros', uid))
        if (proDoc.exists()) {
          const proData = proDoc.data()
          const plan = (proData?.plan as PlanType) || 'starter'
          setCurrentPlan(plan)

          // Load notification settings
          const notificationSettings = proData?.notificationSettings || {}
          // SMS reminders temporarily hidden for business reasons.
          // Backend logic preserved for future reactivation.
          // Force UI to always display "email" regardless of stored value
          // If reminderChannel === "sms" exists in Firestore, it remains untouched
          // but UI will display "Email activé" as fallback
          const storedChannel = notificationSettings?.reminderChannel || 'email'
          // Keep stored value in state (even if "sms") but UI will always show "Email activé"
          setReminderChannel(storedChannel as ReminderChannel)
        } else {
          setCurrentPlan('starter')
          setReminderChannel('email')
        }
      } catch (err: any) {
        console.error('Error loading communication settings:', err)
        setError(err.message || 'Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [router])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const currentUser = await getCurrentUser()

      if (!currentUser.user) {
        throw new Error('Utilisateur non authentifié')
      }

      const uid = currentUser.user.uid

      // SMS reminders temporarily hidden for business reasons.
      // Backend logic preserved for future reactivation.
      // Always save as "email" in UI
      // Note: If reminderChannel === "sms" exists in Firestore, this will overwrite it to "email"
      // This is intentional - UI forces email, but backend logic for SMS remains intact
      const channelToSave = 'email'

      // Update notification settings in Firestore
      await updateDoc(doc(db, 'pros', uid), {
        notificationSettings: {
          reminderChannel: channelToSave,
        },
      })

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Error saving communication settings:', err)
      setError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const isStarter = currentPlan === 'starter'
  const isProOrPremium = currentPlan === 'pro' || currentPlan === 'premium'

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
        <h1 className="text-3xl font-bold text-primary mb-2">Communication</h1>
        <p className="text-gray-600">
          Gérez vos préférences de communication et de notifications
        </p>
      </div>

      {/* Reminder Channel Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="rounded-[32px] p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#2A1F2D] mb-2">
                Rappels automatiques
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Les rappels sont envoyés 24h et 2h avant le rendez-vous
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[24px] text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-[24px] text-sm">
                ✓ Paramètres sauvegardés avec succès
              </div>
            )}

            {/* SMS reminders temporarily hidden for business reasons.
                Backend logic preserved for future reactivation. */}
            
            {/* Email Reminder Display (SMS options hidden) */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 w-5 h-5 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full border-2 border-primary bg-primary"></div>
                </div>
                <label className="flex-1">
                  <div className="font-semibold text-[#2A1F2D]">
                    Email activé
                  </div>
                  <div className="text-sm text-gray-600">
                    Les rappels sont envoyés par email.
                  </div>
                </label>
              </div>
            </div>

            {/* Helper Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-[24px] p-4">
              <p className="text-sm text-blue-800">
                Les rappels sont envoyés automatiquement par email 24h et 2h avant chaque rendez-vous.
              </p>
            </div>

            {/* Save Button - Hidden since reminderChannel is always "email" and cannot be changed */}
            {/* SMS reminders temporarily hidden for business reasons.
                Backend logic preserved for future reactivation. */}
            {/* 
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSave}
                disabled={saving || isStarter}
                className="rounded-[32px] px-6"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader />
                    Sauvegarde...
                  </span>
                ) : (
                  'Enregistrer les paramètres'
                )}
              </Button>
            </div>
            */}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
