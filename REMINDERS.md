# Automated Booking Reminders

This document describes the automated email reminder system for bookings.

## Overview

The reminder system sends email reminders to clients:
- **24 hours** before their booking
- **2 hours** before their booking

## How It Works

1. A cron job calls `/api/reminders/send` every 10 minutes
2. The API queries all confirmed/pending bookings
3. For each booking, it checks if:
   - The booking is within the reminder window (24h or 2h ± 5 minutes)
   - The professional has `reminderChannel === "email"` in their settings
   - The reminder hasn't been sent yet (checked via `reminder24hSent` and `reminder2hSent` flags)
4. If all conditions are met, an email is sent and the booking is marked with the appropriate flag

## Configuration

### Vercel Cron (Production)

The `vercel.json` file is configured to run the reminder job every 10 minutes:

```json
{
  "crons": [
    {
      "path": "/api/reminders/send",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

### Manual Testing

You can manually trigger the reminder job by calling:

```bash
# Using curl
curl -X POST https://your-domain.com/api/reminders/send \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Or using the GET endpoint (for testing)
curl https://your-domain.com/api/reminders/send
```

### Environment Variables

Optional security (recommended for production):

```env
CRON_SECRET=your-secret-token-here
```

If `CRON_SECRET` is set, the POST endpoint will require an `Authorization: Bearer <secret>` header.

## Firestore Structure

### Booking Document

Each booking document can have these reminder fields:

```typescript
{
  reminder24hSent: boolean
  reminder24hSentAt: Timestamp
  reminder2hSent: boolean
  reminder2hSentAt: Timestamp
}
```

### Professional Settings

Each professional document has notification settings:

```typescript
{
  notificationSettings: {
    reminderChannel: "email" | "sms"  // Default: "email"
  }
}
```

## Reminder Rules

1. **Only confirmed/pending bookings** receive reminders
2. **Only email reminders** are sent if `reminderChannel === "email"`
3. **Each reminder is sent only once** (tracked by flags)
4. **Time window**: ±5 minutes around the exact reminder time (24h or 2h before booking)
5. **No reminders for past bookings**

## Email Template

The reminder email template is located at:
- `src/lib/emails/templates/bookingReminder.ts`

It includes:
- Professional name
- Service name
- Date and time (formatted in French)
- Duration (if available)
- Clear reminder message

## Monitoring

The API returns a summary of processed reminders:

```json
{
  "ok": true,
  "message": "Reminders processed",
  "results": {
    "reminders24hSent": 5,
    "reminders2hSent": 3,
    "errors": []
  }
}
```

Check your application logs for detailed processing information.

## Troubleshooting

### Reminders not being sent

1. Check that bookings have `status === "confirmed"` or `status === "pending"`
2. Verify that `reminderChannel === "email"` in professional settings
3. Ensure the booking date/time is in the future
4. Check that the reminder flags (`reminder24hSent`, `reminder2hSent`) are not already set
5. Verify the cron job is running (check Vercel dashboard)

### Duplicate reminders

The system prevents duplicates by:
- Checking `reminder24hSent` and `reminder2hSent` flags before sending
- Using a 10-minute time window (±5 minutes) to catch bookings
- Marking reminders as sent immediately after successful email delivery

### Time zone issues

All date/time calculations use the server's local time. Ensure your server timezone is correctly configured.

