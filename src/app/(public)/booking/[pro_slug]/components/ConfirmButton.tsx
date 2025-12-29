'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { getCurrentUser } from '@/lib/auth'
import type { BookingPro, BookingService } from '../types'

interface ConfirmButtonProps {
  pro: BookingPro
  selectedService: BookingService | null
  selectedDate: string | null
  selectedTime: string | null
  firstName: string
  phone: string
  email: string
}

export function ConfirmButton({
  pro,
  selectedService,
  selectedDate,
  selectedTime,
  firstName,
  phone,
  email,
}: ConfirmButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  // Vérifier l'authentification au montage du composant
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const current = await getCurrentUser()
        setIsAuthenticated(current.user !== null)
      } catch {
        setIsAuthenticated(false)
      }
    }
    checkAuth()
  }, [])

  const isComplete = selectedService && selectedDate && selectedTime
  const isFormValid = firstName.trim() && phone.trim()
  const canConfirm = isComplete && isFormValid

  const handleConfirm = async () => {
    // Vérification d'authentification AVANT toute autre action
    if (!isAuthenticated) {
      // Construire l'URL de redirection avec le contexte de réservation
      const redirectParams = new URLSearchParams({
        redirect: `/booking/${pro.slug}`,
        service_id: selectedService?.id || '',
        date: selectedDate || '',
        time: selectedTime || '',
      })
      
      router.push(`/auth/login?${redirectParams.toString()}`)
      return
    }
    // Validation stricte AVANT toute action
    const validationErrors: string[] = []

    // Vérifier proId
    if (!pro?.id) {
      validationErrors.push('proId manquant')
    }

    // Vérifier proName
    if (!pro?.name || !pro.name.trim()) {
      validationErrors.push('proName manquant')
    }

    // Vérifier serviceId
    if (!selectedService?.id) {
      validationErrors.push('serviceId manquant')
    }

    // Vérifier serviceName
    if (!selectedService?.name || !selectedService.name.trim()) {
      validationErrors.push('serviceName manquant')
    }

    // Vérifier date
    if (!selectedDate || !selectedDate.trim()) {
      validationErrors.push('date manquante')
    }

    // Vérifier time
    if (!selectedTime || !selectedTime.trim()) {
      validationErrors.push('time manquant')
    }

    // Vérifier client_firstname
    if (!firstName || !firstName.trim()) {
      validationErrors.push('client_firstname manquant')
    }

    // Vérifier client_phone
    if (!phone || !phone.trim()) {
      validationErrors.push('client_phone manquant')
    }

    // Si des erreurs de validation, bloquer l'envoi
    if (validationErrors.length > 0) {
      const errorMsg = `Données incomplètes : ${validationErrors.join(', ')}`
      console.error('[ConfirmButton] Validation échouée:', validationErrors)
      setError(errorMsg)
      return
    }

    // Vérification de sécurité supplémentaire (au cas où l'état aurait changé)
    const current = await getCurrentUser()
    if (!current.user) {
      setError('Veuillez créer un compte ou vous connecter pour réserver.')
      const redirectParams = new URLSearchParams({
        redirect: `/booking/${pro.slug}`,
        service_id: selectedService?.id || '',
        date: selectedDate || '',
        time: selectedTime || '',
      })
      router.push(`/auth/login?${redirectParams.toString()}`)
      return
    }

    // Toutes les validations passées, on peut procéder
    setError('')
    setLoading(true)

    try {
      // Préparer les données pour l'API
      // Note: L'API requiert client_email, donc on utilise un email par défaut si non fourni
      const clientEmail = email.trim() || `${firstName.trim().toLowerCase().replace(/\s+/g, '.')}@bookmeup.local`
      
      const bookingData = {
        pro_id: pro.id,
        service_id: selectedService.id,
        date: selectedDate,
        start_time: selectedTime,
        duration: selectedService.duration,
        client_name: firstName.trim(),
        client_email: clientEmail,
        client_phone: phone.trim() || null,
      }

      // Log complet du payload AVANT l'envoi
      console.log('[BOOKING PAYLOAD]', JSON.stringify(bookingData, null, 2))

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      })

      // Log de la réponse
      console.log('[BOOKING RESPONSE]', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
      })

      if (!response.ok) {
        // Essayer de lire l'erreur depuis la réponse
        let errorMessage = 'Erreur lors de la réservation'
        try {
          const errorData = await response.json()
          errorMessage = errorData?.error || errorMessage
          console.error('[BOOKING ERROR]', errorData)
        } catch (parseError) {
          console.error('[BOOKING ERROR] Impossible de parser la réponse d\'erreur:', parseError)
        }
        throw new Error(errorMessage)
      }

      // Succès : lire la réponse
      const result = await response.json()
      console.log('[BOOKING SUCCESS]', result)

      // Vérifier que nous avons bien les données pour la redirection
      if (!selectedService.name || !pro.name || !selectedDate || !selectedTime) {
        throw new Error('Données manquantes pour la redirection')
      }

      // Construire les paramètres de requête pour la page de confirmation
      const params = new URLSearchParams({
        serviceName: selectedService.name,
        proName: pro.name,
        date: selectedDate,
        time: selectedTime,
      })

      console.log('[BOOKING REDIRECT]', `/confirm?${params.toString()}`)

      // Redirection OBLIGATOIRE après succès
      router.push(`/confirm?${params.toString()}`)
    } catch (err: any) {
      console.error('[BOOKING ERROR]', err)
      setError(err.message || 'Erreur lors de la réservation')
      setLoading(false)
    }
  }

  if (!isComplete) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-bookmeup-lg">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="py-4">
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-[24px] text-sm text-center">
              {error}
            </div>
          )}
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className="w-full rounded-[32px] py-6 text-lg font-semibold"
            size="lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader />
                Confirmation en cours…
              </span>
            ) : (
              'Confirmer mon rendez-vous'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

