import Link from "next/link"
import { Sparkles } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — Branding (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-prune to-prune-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-5" />
        <div className="relative flex flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-terracotta" />
            <span className="font-heading text-xl font-bold">BookMeUp</span>
          </Link>

          <div className="max-w-md">
            <h1 className="font-heading text-3xl font-bold leading-tight">
              Votre agenda beauté, prêt en 5 minutes
            </h1>
            <p className="mt-4 text-white/70 leading-relaxed">
              Rejoignez les 500+ professionnelles qui simplifient leur quotidien
              avec BookMeUp.
            </p>
          </div>

          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} BookMeUp
          </p>
        </div>
      </div>

      {/* Right panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[var(--bg-primary)]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2 text-[var(--text-primary)]">
              <Sparkles className="h-6 w-6 text-terracotta" />
              <span className="font-heading text-xl font-bold">BookMeUp</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
