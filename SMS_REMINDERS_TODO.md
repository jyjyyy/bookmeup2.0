# SMS Reminders Implementation Guide

This document outlines what needs to be implemented to enable SMS reminders for bookings.

## Current Status

✅ **Backend is ready for SMS reminders**
- The reminder system supports `reminderChannel === "sms"`
- Email reminders are NOT sent when SMS is selected
- Placeholders and TODOs are in place for SMS implementation

## What's Already Done

1. **Reminder Channel Detection**
   - The system checks `notificationSettings.reminderChannel` for each booking
   - If `reminderChannel === "sms"`, email logic is skipped
   - If `reminderChannel === "email"`, email reminders are sent as normal

2. **Placeholder Logic**
   - In `/api/reminders/send/route.ts`, SMS reminders are detected but skipped
   - Logs indicate when SMS reminders would be sent (but aren't implemented yet)
   - Counters track skipped SMS reminders: `reminders24hSmsSkipped`, `reminders2hSmsSkipped`

## What Needs to Be Implemented

### 1. SMS Provider Setup

Choose and configure an SMS provider (recommended: **Twilio**):

```bash
npm install twilio
```

Add environment variables:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### 2. Create SMS Sending Function

Create a new file: `src/lib/sms/sendSMS.ts`

```typescript
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

interface SMSReminderData {
  phoneNumber: string
  clientName: string
  proName: string
  serviceName: string
  date: string
  time: string
  hoursUntil: number
}

export async function sendSMSReminder(data: SMSReminderData): Promise<boolean> {
  try {
    // Format SMS message
    const hoursText = data.hoursUntil === 24 ? '24 heures' : '2 heures'
    const message = `Rappel BookMe Up: Votre rendez-vous avec ${data.proName} (${data.serviceName}) est prévu dans ${hoursText} - ${data.date} à ${data.time}.`

    // Send SMS via Twilio
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: data.phoneNumber, // Must be in E.164 format (e.g., +33612345678)
    })

    console.log('[SMS] Reminder sent:', {
      to: data.phoneNumber,
      messageId: result.sid,
    })

    return true
  } catch (error) {
    console.error('[SMS] Error sending reminder:', error)
    return false
  }
}
```

### 3. Update Reminder Route

In `/api/reminders/send/route.ts`, uncomment and update the SMS sending code:

1. Import the SMS function:
```typescript
import { sendSMSReminder } from '@/lib/sms/sendSMS'
```

2. Replace the placeholder code in the `reminderChannel === 'sms'` blocks with:
```typescript
// Validate phone number exists
if (!bookingData.client_phone) {
  console.warn(`[Reminders] No phone number for booking ${bookingId}, skipping SMS`)
  results.errors.push(`No phone number for booking ${bookingId}`)
  continue
}

// Format phone number to E.164 format if needed
const phoneNumber = formatPhoneNumber(bookingData.client_phone)

const smsSent = await sendSMSReminder({
  phoneNumber,
  clientName: bookingData.client_name || 'Client',
  proName,
  serviceName,
  date: bookingData.date,
  time: bookingData.start_time,
  hoursUntil: 24, // or 2
})

if (smsSent) {
  await adminDb.collection('bookings').doc(bookingId).update({
    reminder24hSent: true, // or reminder2hSent
    reminder24hSentAt: FieldValue.serverTimestamp(),
  })
  results.reminders24hSent++
  console.log(`[Reminders] 24h SMS reminder sent for booking ${bookingId}`)
} else {
  results.errors.push(`Failed to send 24h SMS reminder for booking ${bookingId}`)
}
```

### 4. Phone Number Formatting

Create a utility function to format phone numbers to E.164 format:

```typescript
// src/lib/utils/phone.ts
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '')
  
  // If starts with 0, replace with +33 (France)
  if (cleaned.startsWith('0')) {
    cleaned = '+33' + cleaned.substring(1)
  } else if (!cleaned.startsWith('+')) {
    // Assume French number if no country code
    cleaned = '+33' + cleaned
  }
  
  return cleaned
}
```

### 5. Error Handling

Consider implementing:
- Retry logic for failed SMS sends
- Rate limiting to avoid Twilio limits
- Queue system for high-volume scenarios
- Fallback to email if SMS fails (optional)

### 6. Testing

Before enabling SMS reminders in production:

1. Test with a verified phone number
2. Verify SMS delivery
3. Check Firestore flags are set correctly
4. Monitor costs (SMS can be expensive)
5. Test error scenarios (invalid phone, provider errors)

## Implementation Checklist

- [ ] Install SMS provider SDK (e.g., Twilio)
- [ ] Add environment variables
- [ ] Create `sendSMSReminder` function
- [ ] Create phone number formatting utility
- [ ] Update `/api/reminders/send/route.ts` to use SMS function
- [ ] Remove placeholder code and TODO comments
- [ ] Test SMS sending with real phone numbers
- [ ] Verify reminder flags are set correctly
- [ ] Monitor SMS costs and usage
- [ ] Update documentation

## Notes

- **Phone Number Required**: Bookings must have `client_phone` field populated
- **Cost**: SMS reminders have a cost per message (check Twilio pricing)
- **Rate Limits**: Be aware of Twilio rate limits
- **International**: Phone numbers must be in E.164 format for international support
- **Privacy**: Ensure compliance with SMS regulations (opt-in, opt-out)

## Alternative Providers

If not using Twilio, consider:
- **Vonage (formerly Nexmo)**
- **AWS SNS**
- **MessageBird**
- **SendGrid** (also supports SMS)

The implementation pattern will be similar, just change the SDK and API calls.

