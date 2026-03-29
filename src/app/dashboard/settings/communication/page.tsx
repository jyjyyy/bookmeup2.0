'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[#9C44AF] text-xs font-semibold mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Notifications
        </div>
        <h1 className="text-2xl font-extrabold text-[#2A1F2D] mb-1">Communication</h1>
        <p className="text-sm text-[#8a7a92]">
          Gérez les notifications envoyées à vous et à vos clients.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-[20px] text-sm flex items-center gap-3">
          <span>⚠️</span> {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-[20px] text-sm flex items-center gap-3">
          <span>✅</span> {success}
        </div>
      )}

      {/* Notifications Email */}
      <div className="bg-white rounded-[24px] border border-primary/8 shadow-[0_4px_20px_rgba(20,0,50,0.04)] p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-[10px] bg-[#F5F0F7] flex items-center justify-center text-sm">📧</div>
          <div>
            <h2 className="text-base font-bold text-[#2A1F2D]">Notifications par email</h2>
            <p className="text-xs text-[#8a7a92]">Emails automatiques envoyés à vos clients.</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-semibold text-[#2A1F2D]">Confirmation de réservation</p>
              <p className="text-xs text-[#8a7a92]">Email envoyé au client après chaque réservation confirmée</p>
            </div>
            <Switch
              checked={settings.emailBookingConfirmed}
              onChange={toggle('emailBookingConfirmed')}
            />
          </div>
          <div className="border-t border-[#EDE8F0]" />
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-semibold text-[#2A1F2D]">Annulation de réservation</p>
              <p className="text-xs text-[#8a7a92]">Email envoyé au client en cas d&apos;annulation</p>
            </div>
            <Switch
              checked={settings.emailBookingCancelled}
              onChange={toggle('emailBookingCancelled')}
            />
          </div>
          <div className="border-t border-[#EDE8F0]" />
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-semibold text-[#2A1F2D]">Rappel 24h avant</p>
              <p className="text-xs text-[#8a7a92]">Email de rappel envoyé au client la veille du rendez-vous</p>
            </div>
            <Switch
              checked={settings.emailReminder24h}
              onChange={toggle('emailReminder24h')}
            />
          </div>
        </div>
      </div>

      {/* Notifications SMS */}
      <div className="bg-white rounded-[24px] border border-primary/8 shadow-[0_4px_20px_rgba(20,0,50,0.04)] p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-[10px] bg-[#F5F0F7] flex items-center justify-center text-sm">💬</div>
          <div>
            <h2 className="text-base font-bold text-[#2A1F2D]">Notifications par SMS</h2>
            <p className="text-xs text-[#8a7a92]">SMS envoyés à vos clients.</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-semibold text-[#2A1F2D]">Rappel SMS 24h avant</p>
              <p className="text-xs text-[#8a7a92]">SMS de rappel envoyé au client la veille du rendez-vous</p>
            </div>
            <Switch
              checked={settings.smsReminder24h}
              onChange={toggle('smsReminder24h')}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="btn-gradient rounded-full px-8 text-sm font-bold shadow-[0_4px_16px_rgba(200,109,215,0.3)]"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer les préférences'}
        </Button>
      </div>
    </div>
  )
}
