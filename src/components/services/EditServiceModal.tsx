'use client'

import React, { useState, useEffect, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  isActive: boolean
}

interface EditServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  service: Service | null
}

export function EditServiceModal({
  isOpen,
  onClose,
  onSuccess,
  service,
}: EditServiceModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('30')
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (service) {
      setName(service.name)
      setDescription(service.description || '')
      setPrice(service.price.toString())
      setDuration(service.duration.toString())
      setIsActive(service.isActive)
    }
  }, [service])

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

    if (!service) {
      setError('Service introuvable')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/services/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: service.id,
          name,
          description,
          price: Number(price),
          duration: Number(duration),
          isActive,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la mise à jour du service')
        setLoading(false)
        return
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du service')
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading && service) {
      setName(service.name)
      setDescription(service.description || '')
      setPrice(service.price.toString())
      setDuration(service.duration.toString())
      setIsActive(service.isActive)
      setError('')
      onClose()
    }
  }

  if (!service) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Modifier le service">
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

        <div className="pt-2">
          <Switch
            label="Service actif"
            checked={isActive}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setIsActive(e.target.checked)
            }
            disabled={loading}
          />
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
            {loading ? 'Mise à jour...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

