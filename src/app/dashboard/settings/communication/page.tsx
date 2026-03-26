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
        <h1 className="text-3xl font-bold text-primary mb-2">Communication</h1>
        <p className="text-gray-600 text-sm">
          Gérez les notifications envoyées à vous et à vos clients.
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

      {/* Notifications Email */}
      <Card className="rounded-[32px] shadow-bookmeup p-6">
        <CardHeader>
          <CardTitle>Notifications par email</CardTitle>
          <CardDescription>
            Emails automatiques envoyés à vos clients et à vous-même.
          </CardDescription>
        </CardHeader>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Confirmation de réservation</p>
              <p className="text-xs text-gray-500">Email envoyé au client après chaque réservation confirmée</p>
            </div>
            <Switch
              checked={settings.emailBookingConfirmed}
              onChange={toggle('emailBookingConfirmed')}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Annulation de réservation</p>
              <p className="text-xs text-gray-500">Email envoyé au client en cas d&apos;annulation</p>
            </div>
            <Switch
              checked={settings.emailBookingCancelled}
              onChange={toggle('emailBookingCancelled')}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Rappel 24h avant</p>
              <p className="text-xs text-gray-500">Email de rappel envoyé au client la veille du rendez-vous</p>
            </div>
            <Switch
              checked={settings.emailReminder24h}
              onChange={toggle('emailReminder24h')}
            />
          </div>
        </div>
      </Card>

      {/* Notifications SMS */}
      <Card className="rounded-[32px] shadow-bookmeup p-6">
        <CardHeader>
          <CardTitle>Notifications par SMS</CardTitle>
          <CardDescription>
            SMS envoyés à vos clients (nécessite une configuration Twilio).
          </CardDescription>
        </CardHeader>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Rappel SMS 24h avant</p>
              <p className="text-xs text-gray-500">SMS de rappel envoyé au client la veille du rendez-vous</p>
            </div>
            <Switch
              checked={settings.smsReminder24h}
              onChange={toggle('smsReminder24h')}
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-[32px] px-8"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer les préférences'}
        </Button>
      </div>
    </div>
  )
}
