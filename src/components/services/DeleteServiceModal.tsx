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
      <div className="space-y-5">
        {error && (
          <div className="flex items-center gap-3 bg-red-50/80 border border-red-200/60 text-red-600 px-4 py-3 rounded-[14px] text-sm">
            <div className="w-8 h-8 rounded-[8px] bg-red-100 flex items-center justify-center shrink-0 text-xs">⚠️</div>
            <p className="text-xs leading-relaxed">{error}</p>
          </div>
        )}

        {/* Warning card */}
        <div className="p-5 rounded-[18px] bg-red-50/50 border border-red-200/40">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-red-100 flex items-center justify-center text-lg shrink-0">
              🗑️
            </div>
            <div>
              <p className="text-sm text-[#2A1F2D] leading-relaxed">
                Voulez-vous vraiment supprimer le service{' '}
                <span className="font-bold text-primary">{serviceName}</span> ?
              </p>
              <p className="text-xs text-[#8a7a92] mt-1.5">
                Cette action est irréversible. Les rendez-vous déjà planifiés ne seront pas affectés.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-full text-sm font-semibold border border-[#EDE8F0] text-[#2A1F2D] hover:bg-[#F5F0F7] transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 py-3 rounded-full text-sm font-bold bg-red-500 text-white shadow-[0_4px_16px_rgba(239,68,68,0.3)] hover:bg-red-600 hover:shadow-[0_6px_24px_rgba(239,68,68,0.4)] transition-all disabled:opacity-50"
          >
            {loading ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
