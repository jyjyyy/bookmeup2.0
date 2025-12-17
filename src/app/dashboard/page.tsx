import { Card } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* En-tête avec message de bienvenue */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#2A1F2D] mb-3">
          Tableau de bord
        </h1>
        <p className="text-lg text-slate-600">
          Bienvenue sur votre espace professionnel BookMeUp
        </p>
      </div>

      {/* Statistiques principales */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-bookmeup hover:shadow-bookmeup-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium mb-2">
            Prochain rendez-vous
          </p>
          <p className="text-base text-slate-600">
            Aucun rendez-vous à venir pour le moment.
          </p>
        </Card>

        <Card className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-bookmeup hover:shadow-bookmeup-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium mb-2">
            Rendez-vous aujourd&apos;hui
          </p>
          <p className="text-4xl font-bold text-primary">0</p>
        </Card>

        <Card className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-bookmeup hover:shadow-bookmeup-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium mb-2">
            Statut de l&apos;abonnement
          </p>
          <p className="text-base font-semibold text-[#2A1F2D]">Starter (par défaut)</p>
        </Card>
      </div>

      {/* Message de bienvenue amélioré */}
      <Card className="rounded-[32px] border-2 border-primary/20 bg-gradient-to-br from-secondary/40 to-white p-8 shadow-bookmeup">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">✨</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-[#2A1F2D] mb-3">
              Bienvenue sur votre espace beauté
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Ajoutez vos services, définissez vos horaires et commencez à accepter
              des réservations en ligne en quelques minutes.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}


