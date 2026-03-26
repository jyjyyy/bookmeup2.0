import { SearchPageClient } from './SearchPageClient'

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Dark search banner */}
      <div className="hero-dark pt-10 pb-16">
        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 text-center">
            Trouvez votre prochain soin
          </h1>
          <p className="text-white/65 text-center mb-8 text-base">
            Plus de 3 200 professionnels disponibles près de chez vous
          </p>

          {/* Search box */}
          <div className="max-w-3xl mx-auto bg-white rounded-[22px] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.3)] flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-[16px] bg-background border border-[#EDE8F0] focus-within:border-primary transition-colors">
              <svg className="w-4 h-4 text-[#7A6B80] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-[#7A6B80] text-sm">Coiffure, massage, nail art…</span>
            </div>
            <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-[16px] bg-background border border-[#EDE8F0] focus-within:border-primary transition-colors">
              <svg className="w-4 h-4 text-[#7A6B80] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeWidth="2" />
                <circle cx="12" cy="10" r="3" strokeWidth="2" />
              </svg>
              <span className="text-[#7A6B80] text-sm">Ville ou code postal…</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <SearchPageClient />
      </div>
    </div>
  )
}
