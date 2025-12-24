'use client'

import { Card } from '@/components/ui/card'

interface DatePickerProps {
  selectedDate: string | null // "YYYY-MM-DD"
  onSelectDate: (date: string) => void
}

export function DatePicker({ selectedDate, onSelectDate }: DatePickerProps) {
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

  // Formater une date en YYYY-MM-DD en heure locale (pas UTC)
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleDateClick = (date: Date) => {
    const dateString = formatDate(date)
    onSelectDate(dateString)
  }

  const isToday = (date: Date) => {
    return formatDate(date) === formatDate(new Date())
  }

  const isPast = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  return (
    <Card className="rounded-[32px] p-6">
      <h2 className="text-xl font-bold text-[#2A1F2D] mb-6">
        Choisis ta date
      </h2>

      {/* Slider horizontal scrollable */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="flex gap-3 min-w-max">
          {days.map((date) => {
            const dateString = formatDate(date)
            const isSelected = selectedDate === dateString
            const isTodayDate = isToday(date)
            const isPastDate = isPast(date)

            return (
              <button
                key={dateString}
                onClick={() => !isPastDate && handleDateClick(date)}
                disabled={isPastDate}
                className={`
                  flex-shrink-0 w-20 p-4 rounded-[24px] border-2 transition-all text-center
                  ${
                    isPastDate
                      ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                      : isSelected
                      ? 'bg-primary border-primary text-white shadow-bookmeup'
                      : 'bg-white border-gray-200 hover:border-primary hover:bg-secondary'
                  }
                  ${isTodayDate && !isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                `}
              >
                <div className="text-xs font-medium mb-1">
                  {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </div>
                <div className="text-xl font-bold">
                  {date.getDate()}
                </div>
                <div className="text-xs mt-1">
                  {date.toLocaleDateString('fr-FR', { month: 'short' })}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

