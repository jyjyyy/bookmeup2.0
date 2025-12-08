import { GoogleCalendarClient } from './GoogleCalendarClient'

export default function GoogleCalendarPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">
          Intégration Google Calendar
        </h1>
        <p className="text-gray-600">
          Synchronisez vos rendez-vous avec Google Calendar
        </p>
      </div>

      {/* Client Component handles auth, plan check, and integration UI */}
      <GoogleCalendarClient />
    </div>
  )
}
