'use client'

import { useState, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface AddServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  proId: string
}

export function AddServiceModal({
  isOpen,
  onClose,
  onSuccess,
  proId,
}: AddServiceModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('30')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Le nom est requis')
      return
    }

    if (!price || Number(price) <= 0) {
      setError('Le prix doit être supérieur à 0')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/services/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proId,
          name,
          description,
          price: Number(price),
          duration: Number(duration),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.limitReached) {
          setError(
            'Vous avez atteint la limite de votre abonnement Starter (15 services maximum).'
          )
        } else {
          setError(data.error || 'Erreur lors de la création du service')
        }
        setLoading(false)
        return
      }

      // Reset form
      setName('')
      setDescription('')
      setPrice('')
      setDuration('30')
      setError('')
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du service')
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setName('')
      setDescription('')
      setPrice('')
      setDuration('30')
      setError('')
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Ajouter un service">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[32px] text-sm">
            {error}
          </div>
        )}

        <Input
          type="text"
          label="Nom du service"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
          placeholder="Ex: Pose d'ongles"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={4}
            className="w-full px-4 py-3 rounded-[32px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Décrivez votre service..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            label="Prix (€)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            disabled={loading}
            min="0"
            step="0.01"
            placeholder="45"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durée (minutes)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-[32px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
              <option value="120">120 min</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Création...' : 'Créer le service'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

