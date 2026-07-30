# BookMeUp18 — Roadmap

## Phase 1 — Socle (v0.1.0) ✅

- [x] Initialisation projet (Next.js 15, TypeScript strict, Tailwind v4)
- [x] Design system complet (tokens, palette, dark mode, composants UI)
- [x] Landing page (hero, features, pricing, témoignages, FAQ, CTA)
- [x] Pages d'authentification (login, signup avec sélection de rôle)
- [x] Firebase client + admin setup
- [x] Auth context (useAuth hook)
- [x] Schéma Firestore documenté
- [x] Seed script (données de démo)
- [x] README, ROADMAP, CHANGELOG, .env.example

## Phase 2 — Dashboard Pro (v0.2.0) ⏳

- [ ] Layout dashboard (sidebar, topbar, responsive)
- [ ] Page dashboard principale (KPIs du jour, prochains RDV)
- [ ] Gestion des services (CRUD, limites par plan)
- [ ] Configuration des disponibilités (horaires hebdo + exceptions)
- [ ] Gestion clientèle (liste, blocage/déblocage, historique)
- [ ] Notifications (bell icon, polling 15s)
- [ ] Paramètres (compte, abonnement, communication, sécurité)

## Phase 3 — Réservation Client (v0.3.0) ⏳

- [ ] Page profil public du pro (galerie, services, avis)
- [ ] Tunnel de réservation (service → créneau → coordonnées → confirmation)
- [ ] Recherche de pros (ville, service, filtres)
- [ ] Espace client (RDV à venir, historique, annulation)
- [ ] Emails de confirmation et annulation (Resend)

## Phase 4 — Paiements & Intégrations (v0.4.0) ⏳

- [ ] Stripe Checkout (souscription plans)
- [ ] Stripe Customer Portal
- [ ] Stripe Webhooks (sync statut, déblocage features)
- [ ] Google Calendar OAuth 2.0 (sync RDV)
- [ ] Upload photos galerie (API serveur)

## Phase 5 — Analytics & Exports (v0.5.0) ⏳

- [ ] Statistiques Starter (KPIs basiques)
- [ ] Statistiques Pro (graphiques 30j/90j, revenus par service)
- [ ] Statistiques Premium (comparaison périodes, taux d'occupation)
- [ ] Export CSV comptable
- [ ] Export PDF (jsPDF)

## Phase 6 — Polish & Production (v1.0.0) ⏳

- [ ] Tests E2E (Playwright) sur flows critiques
- [ ] Tests unitaires (Vitest) sur utils
- [ ] SEO (sitemap, JSON-LD, pages métier, pages ville×métier)
- [ ] Accessibilité AA (axe-core, navigation clavier, ARIA)
- [ ] Performance (Lighthouse > 90, next/image, lazy loading)
- [ ] Sécurité (CSP, rate limiting, validation Zod côté serveur)
- [ ] RGPD (export données, suppression compte)
- [ ] SMS rappels J-1 (Twilio, plan Premium)
- [ ] Onboarding guidé pro (5 étapes avec barre de progression)
- [ ] Pages légales (CGU, mentions légales, confidentialité)

## Futur (v1.x)

- [ ] Multi-praticiennes (équipe pour salons)
- [ ] Paiements en ligne (acompte à la réservation)
- [ ] Avis clients vérifiés
- [ ] Application mobile (React Native ou PWA)
- [ ] API publique pour intégrateurs
