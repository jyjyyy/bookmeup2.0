import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-4xl mx-auto mb-6">
          🔍
        </div>
        <h1 className="text-5xl font-extrabold text-[#2A1F2D] mb-3">404</h1>
        <p className="text-lg text-[#8a7a92] mb-8">Cette page n&apos;existe pas ou a été déplacée.</p>
        <Link
          href="/"
          className="inline-flex px-6 py-3 rounded-full btn-gradient text-white font-semibold text-sm shadow-[0_6px_20px_rgba(200,109,215,0.35)] hover:shadow-[0_10px_28px_rgba(200,109,215,0.45)] transition-all"
        >
          Retour à l&apos;accueil →
        </Link>
      </div>
    </div>
  )
}
