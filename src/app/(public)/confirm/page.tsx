import { ConfirmCard } from './ConfirmCard'
import { notFound } from 'next/navigation'

interface ConfirmPageProps {
  searchParams: Promise<{ 
    bookingId?: string
    serviceName?: string
    proName?: string
    date?: string
    time?: string
  }>
}

export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
  const params = await searchParams

  // Priorité aux nouveaux paramètres (serviceName, proName, date, time)
  const serviceName = params.serviceName
  const proName = params.proName
  const date = params.date
  const time = params.time

  // Si tous les nouveaux paramètres sont présents, utiliser cette méthode
  if (serviceName && proName && date && time) {
    return (
      <ConfirmCard
        serviceName={serviceName}
        proName={proName}
        date={date}
        time={time}
      />
    )
  }

  // Fallback: Si bookingId est présent, charger depuis Firestore (pour compatibilité future)
  const bookingId = params.bookingId
  if (bookingId) {
    // TODO: Implémenter le chargement depuis Firestore si nécessaire
    // Pour l'instant, on redirige vers notFound car cette fonctionnalité n'est plus utilisée
    notFound()
  }

  // Si aucun paramètre valide n'est fourni
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-primary mb-4">
            Réservation non trouvée
          </h1>
          <p className="text-slate-600">
            Les informations de réservation sont manquantes.
          </p>
        </div>
      </div>
    </div>
  )
}
