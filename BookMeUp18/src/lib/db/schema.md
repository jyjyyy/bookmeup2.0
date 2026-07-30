# BookMeUp18 — Firestore Schema

## Collections

### `profiles/{uid}`
Profil utilisateur (client ou pro).

| Field | Type | Description |
|-------|------|-------------|
| email | string | Email du compte |
| name | string | Nom ou prénom |
| role | "client" \| "pro" | Rôle |
| city | string? | Ville |
| phone | string? | Téléphone |
| created_at | timestamp | Date de création |
| updated_at | timestamp | Dernière modification |

### `pros/{uid}`
Profil professionnel (complète `profiles`).

| Field | Type | Description |
|-------|------|-------------|
| slug | string | URL-friendly identifier |
| business_name | string | Nom de l'activité |
| description | string | Bio / présentation |
| city | string | Ville |
| address | string? | Adresse complète |
| phone | string? | Téléphone pro |
| plan | "starter" \| "pro" \| "premium" | Plan actif |
| stripe_customer_id | string? | ID client Stripe |
| stripe_subscription_id | string? | ID abonnement Stripe |
| stripe_subscription_status | string? | Statut Stripe |
| gallery.images | string[] | URLs des photos |
| socials.instagram | string? | Lien Instagram |
| socials.facebook | string? | Lien Facebook |
| socials.website | string? | Site web |
| rating | number? | Note moyenne |
| review_count | number? | Nombre d'avis |
| show_in_search | boolean | Visible dans la recherche |
| created_at | timestamp | Date de création |
| updated_at | timestamp | Dernière modification |

### `services/{id}`
Services proposés par un pro.

| Field | Type | Description |
|-------|------|-------------|
| pro_id | string | UID du pro |
| name | string | Nom du service |
| description | string | Description |
| price | number | Prix en euros |
| duration | number | Durée en minutes |
| category | string? | Catégorie |
| is_active | boolean | Actif ou archivé |
| created_at | timestamp | Date de création |
| updated_at | timestamp | Dernière modification |

### `bookings/{id}`
Réservations.

| Field | Type | Description |
|-------|------|-------------|
| pro_id | string | UID du pro |
| client_id | string? | UID du client (si compte) |
| service_id | string | ID du service |
| client_name | string | Nom du client |
| client_email | string | Email du client |
| client_phone | string | Téléphone du client |
| date | string | Date YYYY-MM-DD |
| start_time | string | Heure début HH:mm |
| end_time | string | Heure fin HH:mm |
| status | string | pending, confirmed, cancelled, completed |
| pricing_snapshot | object | { label, price, duration } |
| google_event_id | string? | ID Google Calendar |
| cancelled_at | string? | Date d'annulation |
| cancelled_by | string? | "client" ou "pro" |
| created_at | timestamp | Date de création |

### `pros/{uid}/availability/{day}`
Disponibilités hebdomadaires (0=dimanche à 6=samedi).

| Field | Type | Description |
|-------|------|-------------|
| enabled | boolean | Jour actif |
| slots | array | [{ start: "09:00", end: "18:00" }] |

### `pros/{uid}/exceptions/{id}`
Exceptions (vacances, fermetures).

| Field | Type | Description |
|-------|------|-------------|
| date | string | YYYY-MM-DD |
| all_day | boolean | Fermeture complète |
| start_time | string? | Début exception |
| end_time | string? | Fin exception |
| reason | string? | Raison |

### `notifications/{id}`
Notifications pro.

| Field | Type | Description |
|-------|------|-------------|
| pro_id | string | UID du pro |
| type | string | booking, cancellation, system |
| title | string | Titre |
| message | string | Message |
| read | boolean | Lue ou non |
| booking_id | string? | Référence booking |
| created_at | timestamp | Date de création |

### `pros/{uid}/integrations/google-calendar`
Tokens Google Calendar.

| Field | Type | Description |
|-------|------|-------------|
| access_token | string | Token d'accès |
| refresh_token | string | Token de refresh |
| expires_at | number | Timestamp d'expiration |
| auto_sync | boolean | Sync automatique |
| email | string? | Email Google |
