# BookMeUp18

**La plateforme de réservation pensée pour les professionnelles de la beauté et du bien-être.**

Vos clientes réservent en 60 secondes. Vous gérez tout depuis un seul dashboard.

---

## Stack technique

| Couche | Choix | Justification |
|--------|-------|---------------|
| Framework | **Next.js 15** (App Router, RSC, Server Actions) | Performance, SEO, DX, écosystème React |
| Langage | **TypeScript strict** | Sécurité du typage, autocomplétion, refactoring sûr |
| Styling | **Tailwind CSS v4** + composants custom (CVA) | Tokens design, dark mode natif, bundle minimal |
| Animations | **Framer Motion** | Micro-interactions sobres, layout animations |
| Base de données | **Firebase** (Firestore + Auth + Storage) | Choix pragmatique : le projet existant utilise déjà Firebase avec des données réelles. Migrer vers Supabase ajouterait de la friction sans gain immédiat. |
| Paiements | **Stripe** (Checkout + Customer Portal + Webhooks) | Standard industrie, portail client intégré |
| Emails | **Resend** | API simple, templates HTML, monitoring |
| Calendrier | **Google Calendar API** (OAuth 2.0) | Sync bidirectionnelle native |
| SMS | **Twilio** (plan Premium) | Fiabilité, couverture FR |
| Validation | **Zod** | Validation runtime + inférence de types |
| Tests | **Vitest** + **Playwright** | Tests unitaires rapides + E2E sur flows critiques |
| Icônes | **Lucide React** | Cohérent, léger, 1000+ icônes |

### Pourquoi Firebase plutôt que Supabase ?

Le projet BookMeUp existant utilise Firebase avec des données en production, des règles de sécurité configurées, et des clés API en place. Repartir sur Supabase impliquerait une migration de données, une reconfiguration complète de l'auth, et une courbe d'apprentissage SQL/RLS. Firebase reste parfaitement adapté pour ce type de SaaS temps réel.

---

## Prérequis

- **Node.js** 18+
- **npm** 9+
- Un projet **Firebase** avec Firestore, Auth et Storage activés
- Un compte **Stripe** (mode test suffit pour le développement)

---

## Installation

```bash
# 1. Cloner et installer
cd BookMeUp18
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env.local
# → Remplir les valeurs dans .env.local

# 3. (Optionnel) Peupler la base avec des données de test
npm run seed

# 4. Lancer le serveur de développement
npm run dev
```

L'app est accessible sur [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Serveur de développement (Turbopack) |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | Vérification ESLint |
| `npm run seed` | Peuplement de la base de données |
| `npm run test` | Tests unitaires (Vitest) |
| `npm run test:e2e` | Tests E2E (Playwright) |

---

## Structure du projet

```
BookMeUp18/
├── src/
│   ├── app/                    # Pages et routes (App Router)
│   │   ├── auth/               # Login, signup, forgot-password
│   │   ├── (public)/           # Pages publiques (search, pro, booking)
│   │   ├── dashboard/          # Dashboard pro (protégé)
│   │   ├── account/            # Espace client (protégé)
│   │   └── api/                # API routes (41 endpoints)
│   ├── components/
│   │   ├── ui/                 # Composants de base (Button, Card, Input...)
│   │   ├── layout/             # Header, Footer, Sidebar
│   │   ├── shared/             # Animations, Theme provider
│   │   ├── booking/            # Tunnel de réservation
│   │   ├── dashboard/          # Widgets dashboard
│   │   └── stats/              # Graphiques et KPIs
│   ├── lib/
│   │   ├── db/                 # Firebase client/admin, schema, seed
│   │   ├── hooks/              # useAuth, useNotifications...
│   │   ├── types/              # Types TypeScript centraux
│   │   ├── utils/              # Helpers (cn, formatters...)
│   │   ├── exports/            # Export CSV/PDF
│   │   └── stats/              # Calculs statistiques par plan
│   └── styles/                 # CSS global + design tokens
├── public/                     # Assets statiques
├── tests/                      # Tests E2E
└── docs/                       # Documentation technique
```

---

## Déploiement

### Vercel (recommandé)

1. Connecter le repo GitHub à Vercel
2. Configurer les variables d'environnement dans le dashboard Vercel
3. Déployer — c'est automatique à chaque push

### Variables de production à adapter

- `NEXT_PUBLIC_BASE_URL` → votre domaine de production
- Passer les clés Stripe en mode live (`sk_live_xxx`)
- Configurer le webhook Stripe vers `https://votredomaine.com/api/stripe/webhook`
- Vérifier le domaine d'envoi dans Resend

---

## Direction artistique

- **Palette** : crème, rose poudré, terracotta, prune profonde, vert sauge
- **Typographie** : Fraunces (titres) + Inter (texte)
- **Bordures** : généreuses (12–16px), jamais carrées
- **Ombres** : subtiles et douces
- **Mode sombre** : palette dédiée (aubergine, cacao, prune nuit)
- **Animations** : fade-in 8px, stagger 40ms, scale 0.98 sur tap

---

## Licence

Projet privé. Tous droits réservés.
