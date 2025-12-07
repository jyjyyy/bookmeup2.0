# BookMeUp 2.0

SaaS de réservation professionnelle avec Next.js 16, Firebase et Stripe.

## Structure du projet

- **Next.js 16** avec App Router
- **Firebase** (Auth + Firestore + Admin SDK)
- **Stripe** pour les abonnements
- **Google Calendar** intégration
- **TailwindCSS** + **Framer Motion**

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

## Configuration

Créez un fichier `.env.local` avec vos clés API:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...
```

