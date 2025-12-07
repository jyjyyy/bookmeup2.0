import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-200">
          <h1 className="text-3xl font-bold text-primary mb-2 text-center">
            Mot de passe oublié
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Réinitialisez votre mot de passe
          </p>
          
          <ForgotPasswordForm />

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-primary hover:underline"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

