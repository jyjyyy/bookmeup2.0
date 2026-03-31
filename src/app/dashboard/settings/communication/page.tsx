'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getCurrentUser } from '@/lib/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { Switch } from '@/components/ui/switch'
import { Loader } from '@/components/ui/loader'

interface CommunicationSettings {
  emailBookingConfirmed: boolean
  emailBookingCancelled: boolean
  emailReminder24h: boolean
  smsReminder24h: boolean
}

const DEFAULT_SETTINGS: CommunicationSettings = {
  emailBookingConfirmed: true,
  emailBookingCancelled: true,
  emailReminder24h: true,
  smsReminder24h: false,
}

export default function CommunicationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uid, setUid] = useState<string | null>(null)
  const [settings, setSettings] = useState<CommunicationSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const current = await getCurrentUser()

        if (!current.user || !current.profile) {
          router.push('/auth/login')
          return
        }
        if (current.profile.role !== 'pro') {
          router.push('/')
          return
        }

        setUid(current.user.uid)

        const settingsDoc = await getDoc(doc(db, 'pros', current.user.uid, 'settings', 'communication'))
        if (settingsDoc.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...settingsDoc.data() })
        }
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const toggle = (key: keyof CommunicationSettings) => () => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    if (!uid) return
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      await setDoc(doc(db, 'pros', uid, 'settings', 'communication'), settings, { merge: true })
      setSuccess('Préférences de communication enregistrées.')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
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
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[#9C44AF] text-xs font-semibold mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Notifications
        </div>
        <h1 className="text-2xl font-extrabold text-[#2A1F2D] mb-1">Communication</h1>
        <p className="text-sm text-[#8a7a92]">
          Gérez les notifications envoyées à vous et à vos clients.
        </p>
      </motion.div>

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
          <p className="text-xs font-medium">{success}</p>
        </div>
      )}

      {/* Email notifications */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-white rounded-[22px] border border-[#EDE8F0] shadow-[0_4px_20px_rgba(20,0,50,0.04)] p-6 hover:shadow-[0_6px_28px_rgba(20,0,50,0.06)] transition-shadow"
      >
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-sky-100/60 to-sky-50 flex items-center justify-center text-lg">📧</div>
          <div>
            <h2 className="text-[15px] font-bold text-[#2A1F2D]">Notifications par email</h2>
            <p className="text-xs text-[#8a7a92]">Emails automatiques envoyés à vos clients.</p>
          </div>
        </div>
        <div className="space-y-0">
          {/* Toggle row */}
          <div className="flex items-center justify-between py-4 px-4 rounded-t-[14px] bg-[#FDFBFE] border border-[#EDE8F0] border-b-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-emerald-50 flex items-center justify-center text-xs">✉️</div>
              <div>
                <p className="text-sm font-semibold text-[#2A1F2D]">Confirmation de réservation</p>
                <p className="text-[11px] text-[#B5A8BE]">Email envoyé au client après chaque réservation confirmée</p>
              </div>
            </div>
            <Switch
              checked={settings.emailBookingConfirmed}
              onChange={toggle('emailBookingConfirmed')}
            />
          </div>
          <div className="flex items-center justify-between py-4 px-4 bg-[#FDFBFE] border border-[#EDE8F0] border-b-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-red-50 flex items-center justify-center text-xs">❌</div>
              <div>
                <p className="text-sm font-semibold text-[#2A1F2D]">Annulation de réservation</p>
                <p className="text-[11px] text-[#B5A8BE]">Email envoyé au client en cas d&apos;annulation</p>
              </div>
            </div>
            <Switch
              checked={settings.emailBookingCancelled}
              onChange={toggle('emailBookingCancelled')}
            />
          </div>
          <div className="flex items-center justify-between py-4 px-4 rounded-b-[14px] bg-[#FDFBFE] border border-[#EDE8F0]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-amber-50 flex items-center justify-center text-xs">🔔</div>
              <div>
                <p className="text-sm font-semibold text-[#2A1F2D]">Rappel 24h avant</p>
                <p className="text-[11px] text-[#B5A8BE]">Email de rappel envoyé au client la veille du rendez-vous</p>
              </div>
            </div>
            <Switch
              checked={settings.emailReminder24h}
              onChange={toggle('emailReminder24h')}
            />
          </div>
        </div>
      </motion.div>

      {/* SMS notifications */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="bg-white rounded-[22px] border border-[#EDE8F0] shadow-[0_4px_20px_rgba(20,0,50,0.04)] p-6 hover:shadow-[0_6px_28px_rgba(20,0,50,0.06)] transition-shadow"
      >
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-emerald-100/60 to-emerald-50 flex items-center justify-center text-lg">💬</div>
          <div>
            <h2 className="text-[15px] font-bold text-[#2A1F2D]">Notifications par SMS</h2>
            <p className="text-xs text-[#8a7a92]">SMS envoyés à vos clients.</p>
          </div>
        </div>
        <div className="flex items-center justify-between py-4 px-4 rounded-[14px] bg-[#FDFBFE] border border-[#EDE8F0]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-purple-50 flex items-center justify-center text-xs">📱</div>
            <div>
              <p className="text-sm font-semibold text-[#2A1F2D]">Rappel SMS 24h avant</p>
              <p className="text-[11px] text-[#B5A8BE]">SMS de rappel envoyé au client la veille du rendez-vous</p>
            </div>
          </div>
          <Switch
            checked={settings.smsReminder24h}
            onChange={toggle('smsReminder24h')}
          />
        </div>
      </motion.div>

      {/* Save button */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-end pt-2"
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-gradient rounded-full px-8 py-3 text-sm font-bold shadow-[0_4px_16px_rgba(200,109,215,0.3)] hover:shadow-[0_8px_28px_rgba(200,109,215,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer les préférences'}
        </button>
      </motion.div>
    </div>
  )
}
