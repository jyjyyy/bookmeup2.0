# Changelog

Toutes les modifications notables du projet sont documentées ici.
Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
versioning [Semantic Versioning](https://semver.org/lang/fr/).

## [0.1.0] — 2026-04-29

### Ajouté

- **Projet** : initialisation Next.js 15 + TypeScript strict + Tailwind CSS v4
- **Design system** : palette pastel (crème, rose, terracotta, prune, sauge), dark mode dédié, tokens CSS, composants Button/Card/Input/Badge
- **Animations** : composants réutilisables FadeIn, StaggerContainer, StaggerItem, ScaleIn (Framer Motion)
- **Landing page** : hero avec CTA, barre de preuve sociale, 8 fonctionnalités, "comment ça marche" en 3 étapes, pricing 3 plans, témoignages, FAQ accordéon, CTA final
- **Auth** : pages login et signup avec sélection de rôle (pro/cliente), barre de progression, gestion d'erreurs en français
- **Firebase** : configuration client + admin, AuthProvider avec useAuth hook, timeout 5s en fallback
- **Schéma Firestore** : documentation complète de toutes les collections
- **Seed** : script de données de démo (pro, services, disponibilités, bookings, notifications)
- **Documentation** : README (pitch, stack justifiée, install, déploiement), ROADMAP (6 phases), CHANGELOG, .env.example commenté
- **Header/Footer** : navigation responsive, toggle dark mode, liens CTA
- **Theme** : provider light/dark/system avec persistance localStorage
