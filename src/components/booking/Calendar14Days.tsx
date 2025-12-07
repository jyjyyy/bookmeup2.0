'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface Calendar14DaysProps {
  onSelect: (date: string) => void
}

export function Calendar14Days({ onSelect }: Calendar14DaysProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Générer les 14 prochains jours
  const getNext14Days = () => {
    const days = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      days.push(date)
    }

    return days
  }

  const days = getNext14Days()

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const handleDateClick = (date: Date) => {
    const dateString = formatDate(date)
    setSelectedDate(dateString)
    onSelect(dateString)
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {days.map((date, index) => {
        const dateString = formatDate(date)
        const isSelected = selectedDate === dateString
        const isToday = dateString === formatDate(new Date())

        return (
          <motion.button
            key={dateString}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleDateClick(date)}
            className={`
              p-4 rounded-[32px] border-2 transition-all
              ${
                isSelected
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-200 bg-white hover:border-primary hover:bg-pink-50'
              }
              ${isToday ? 'ring-2 ring-primary ring-offset-2' : ''}
            `}
          >
            <div className="text-center">
              <div className="text-xs font-medium mb-1">
                {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
              </div>
              <div className="text-xl font-bold">
                {date.getDate()}
              </div>
              <div className="text-xs mt-1">
                {date.toLocaleDateString('fr-FR', { month: 'short' })}
              </div>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
