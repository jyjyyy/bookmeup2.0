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

const inputStyles = "w-full px-4 py-3 rounded-[14px] border border-[#EDE8F0] bg-[#FDFBFE] text-[#2A1F2D] text-sm placeholder:text-[#B5A8BE] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white transition-all duration-200"
const labelStyles = "block text-xs font-semibold text-[#2A1F2D] mb-2 tracking-wide"

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
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-3 bg-red-50/80 border border-red-200/60 text-red-600 px-4 py-3 rounded-[14px] text-sm">
            <div className="w-8 h-8 rounded-[8px] bg-red-100 flex items-center justify-center shrink-0 text-xs">⚠️</div>
            <p className="text-xs leading-relaxed">{error}</p>
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
          <label className={labelStyles}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={3}
            className={`${inputStyles} resize-none`}
            placeholder="Décrivez votre service..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
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
            <label className={labelStyles}>Durée</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={loading}
              className={`${inputStyles} pr-10 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%239A8DA3%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E')] bg-[length:1.1rem] bg-[right_0.8rem_center] bg-no-repeat`}
            >
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1h</option>
              <option value="90">1h30</option>
              <option value="120">2h</option>
              <option value="150">2h30</option>
              <option value="180">3h</option>
            </select>
          </div>
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between p-4 rounded-[16px] bg-[#FDFBFE] border border-[#EDE8F0]">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center ${isActive ? 'bg-emerald-50' : 'bg-[#F5F0F7]'}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-[#C5BAD0]'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2A1F2D]">Service actif</p>
              <p className="text-[11px] text-[#8a7a92]">{isActive ? 'Visible et réservable' : 'Masqué pour les clients'}</p>
            </div>
          </div>
          <Switch
            checked={isActive}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setIsActive(e.target.checked)
            }
            disabled={loading}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 py-3 rounded-full text-sm font-semibold border border-[#EDE8F0] text-[#2A1F2D] hover:bg-[#F5F0F7] transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 rounded-full text-sm font-bold btn-gradient shadow-[0_4px_16px_rgba(200,109,215,0.3)] hover:shadow-[0_6px_24px_rgba(200,109,215,0.4)] transition-all disabled:opacity-50"
          >
            {loading ? 'Mise à jour...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
