'use client'


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
    <div className="bg-white rounded-[24px] p-6 border border-[#EDE8F0] shadow-bookmeup-sm">
      <h2 className="text-base font-bold text-[#2A1F2D] mb-5">
        Choisissez une date
      </h2>

      {/* Slider horizontal scrollable */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="flex gap-2 min-w-max">
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
                  flex-shrink-0 w-16 py-3 rounded-[16px] border-2 transition-all text-center
                  ${
                    isPastDate
                      ? 'bg-background border-[#EDE8F0] text-[#C9BBD0] cursor-not-allowed'
                      : isSelected
                      ? 'bg-primary border-primary text-white shadow-bookmeup-sm'
                      : 'bg-white border-[#EDE8F0] hover:border-primary hover:bg-secondary'
                  }
                  ${isTodayDate && !isSelected ? 'ring-2 ring-primary/40 ring-offset-1' : ''}
                `}
              >
                <div className="text-[10px] font-semibold mb-0.5 uppercase tracking-wide">
                  {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </div>
                <div className="text-lg font-extrabold leading-tight">
                  {date.getDate()}
                </div>
                <div className="text-[10px] mt-0.5 opacity-70">
                  {date.toLocaleDateString('fr-FR', { month: 'short' })}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

