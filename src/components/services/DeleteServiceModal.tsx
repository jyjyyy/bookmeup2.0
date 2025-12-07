'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

interface DeleteServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  serviceName: string
  serviceId: string
}

export function DeleteServiceModal({
  isOpen,
  onClose,
  onSuccess,
  serviceName,
  serviceId,
}: DeleteServiceModalProps) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/services/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serviceId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la suppression du service')
        setLoading(false)
        return
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression du service')
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Supprimer le service">
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[32px] text-sm">
            {error}
          </div>
        )}

        <p className="text-gray-700">
          Voulez-vous vraiment supprimer le service{' '}
          <span className="font-semibold">{serviceName}</span> ?
        </p>
        <p className="text-sm text-gray-500">
          Cette action est irréversible.
        </p>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

