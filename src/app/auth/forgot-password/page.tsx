import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center hero-light px-4 py-12">
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-extrabold gradient-text">BookMeUp</span>
          <p className="text-sm text-[#8a7a92] mt-1">Réinitialisez votre mot de passe</p>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-[0_20px_60px_rgba(20,0,50,0.1)] border border-primary/10">
          <h1 className="text-2xl font-extrabold text-[#2A1F2D] mb-1 text-center">
            Mot de passe oublié
          </h1>
          <p className="text-sm text-[#7A6B80] text-center mb-7">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>

          <ForgotPasswordForm />

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-primary hover:underline font-medium"
            >
              ← Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

