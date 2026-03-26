import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-extrabold" style={{ background: 'linear-gradient(135deg, #C86DD7, #9C44AF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BookMeUp</span>
          <p className="text-sm text-[#7A6B80] mt-1">Réinitialisez votre mot de passe</p>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-bookmeup border border-[#EDE8F0]">
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

