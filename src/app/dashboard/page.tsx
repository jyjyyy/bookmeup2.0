import { Card } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[32px] border border-white/70 bg-white/90 p-4 shadow-[0_10px_40px_rgba(20,0,50,0.04)]">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
            Prochain rendez-vous
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Aucun rendez-vous à venir pour le moment.
          </p>
        </Card>
        <Card className="rounded-[32px] border border-white/70 bg-white/90 p-4 shadow-[0_10px_40px_rgba(20,0,50,0.04)]">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
            Rendez-vous aujourd&apos;hui
          </p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
        </Card>
        <Card className="rounded-[32px] border border-white/70 bg-white/90 p-4 shadow-[0_10px_40px_rgba(20,0,50,0.04)]">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
            Statut de l&apos;abonnement
          </p>
          <p className="mt-2 text-sm text-gray-700">Starter (par défaut)</p>
        </Card>
      </div>
      <Card className="rounded-[32px] border border-dashed border-pink-100 bg-pink-50/60 p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Bienvenue sur votre espace beauté ✨
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Ajoutez vos services, définissez vos horaires et commencez à accepter
          des réservations en ligne en quelques minutes.
        </p>
      </Card>
    </div>
  )
}


