import { SearchPageClient } from './SearchPageClient'

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-3">
              Trouve ta pro beauté ✨
            </h1>
            <p className="text-lg text-slate-600">
              Recherche par ville, prestation ou nom de professionnel.
            </p>
          </div>

          {/* Client Component with search logic */}
          <SearchPageClient />
        </div>
      </div>
    </div>
  )
}
