'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar14Days } from '@/components/booking/Calendar14Days'
import { SlotPicker } from '@/components/booking/SlotPicker'
import { BookingForm } from '@/components/booking/BookingForm'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { motion, AnimatePresence } from 'framer-motion'

interface Service {
  id: string
  name: string
  description: string
  duration: number
  price: number
}

interface Pro {
  id: string
  name: string
  slug: string
  city?: string
}

export function BookingPageClient({ pro, services }: { pro: Pro; services: Service[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const serviceIdParam = searchParams.get('service_id')

  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Pré-sélectionner le service si service_id dans l'URL
  useEffect(() => {
    if (serviceIdParam && services.length > 0) {
      const service = services.find((s) => s.id === serviceIdParam)
      if (service) {
        setSelectedService(service)
        setStep(2)
      }
    }
  }, [serviceIdParam, services])

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setStep(2)
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setStep(3)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setStep(4)
  }

  const handleBack = () => {
    if (step === 4) {
      setStep(3)
      setSelectedTime(null)
    } else if (step === 3) {
      setStep(2)
      setSelectedDate(null)
    } else if (step === 2) {
      setStep(1)
      setSelectedService(null)
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">
          Réserver avec {pro.name}
        </h1>
        {pro.city && (
          <p className="text-gray-600">{pro.city}</p>
        )}
      </div>

      {/* Progress indicator */}
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= s
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s}
            </div>
            {s < 4 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  step > s ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-primary mb-6">
                Choisissez un service
              </h2>
              <div className="space-y-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="w-full text-left p-4 border-2 border-gray-200 rounded-[32px] hover:border-primary transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{service.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {service.duration} min • {service.price} €
                        </p>
                      </div>
                      <div className="text-primary font-bold">→</div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {step === 2 && selectedService && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary">
                  Choisissez une date
                </h2>
                <Button variant="outline" onClick={handleBack}>
                  Retour
                </Button>
              </div>
              <div className="mb-4 p-4 bg-gray-50 rounded-[32px]">
                <p className="font-semibold">{selectedService.name}</p>
                <p className="text-sm text-gray-600">
                  {selectedService.duration} min • {selectedService.price} €
                </p>
              </div>
              <Calendar14Days onSelect={handleDateSelect} />
            </Card>
          </motion.div>
        )}

        {step === 3 && selectedService && selectedDate && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary">
                  Choisissez un créneau
                </h2>
                <Button variant="outline" onClick={handleBack}>
                  Retour
                </Button>
              </div>
              <div className="mb-4 p-4 bg-gray-50 rounded-[32px]">
                <p className="font-semibold">{selectedService.name}</p>
                <p className="text-sm text-gray-600">
                  {new Date(selectedDate).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <SlotPicker
                proId={pro.id}
                serviceId={selectedService.id}
                date={selectedDate}
                duration={selectedService.duration}
                onSelect={handleTimeSelect}
              />
            </Card>
          </motion.div>
        )}

        {step === 4 && selectedService && selectedDate && selectedTime && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary">
                  Vos informations
                </h2>
                <Button variant="outline" onClick={handleBack}>
                  Retour
                </Button>
              </div>
              <div className="mb-6 p-4 bg-gray-50 rounded-[32px]">
                <p className="font-semibold">{selectedService.name}</p>
                <p className="text-sm text-gray-600">
                  {new Date(selectedDate).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  à {selectedTime}
                </p>
              </div>
              <BookingForm
                proId={pro.id}
                serviceId={selectedService.id}
                date={selectedDate}
                startTime={selectedTime}
                duration={selectedService.duration}
              />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

