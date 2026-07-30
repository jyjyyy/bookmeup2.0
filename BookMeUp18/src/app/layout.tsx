import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import { ThemeProvider } from "@/components/shared/theme-provider"
import { AuthProvider } from "@/lib/hooks/use-auth"
import "@/styles/globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})

/* Playfair Display — Serif élégant pour les titres */
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "700"],
})

export const metadata: Metadata = {
  title: {
    template: "%s | BookMeUp",
    default: "BookMeUp — Votre agenda beauté en ligne",
  },
  description:
    "La plateforme de réservation pour les professionnelles de la beauté et du bien-être. Agenda en ligne, paiements, rappels automatiques.",
  keywords: [
    "réservation beauté",
    "agenda en ligne",
    "coiffeuse",
    "esthéticienne",
    "prise de rendez-vous",
    "booking beauté",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "BookMeUp",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
