import { SearchPageClient } from './SearchPageClient'

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Light search banner */}
      <div className="hero-light pt-10 pb-16">
        <div className="container mx-auto px-6 relative z-10">
          <p className="section-label text-center">Recherche</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#2A1F2D] mb-2 text-center">
            Trouvez votre prochain soin
          </h1>
          <p className="text-[#8a7a92] text-center text-base">
            Coiffure, massage, nail art, soins du visage et bien plus
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <SearchPageClient />
      </div>
    </div>
  )
}
