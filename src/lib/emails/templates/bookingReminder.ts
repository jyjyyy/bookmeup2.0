interface BookingReminderEmailData {
  clientName: string
  proName: string
  serviceName: string
  date: string // formatted date
  time: string
  duration?: number
  hoursUntil: number // 24 or 2
}

export function bookingReminderEmail(data: BookingReminderEmailData) {
  const hoursText = data.hoursUntil === 24 ? '24 heures' : '2 heures'
  const subject = `Rappel : Votre rendez-vous dans ${hoursText} – BookMe Up`

  // Determine display name for professional with safe fallback
  const displayProName = data.proName && data.proName.trim() && data.proName !== 'Professionnel'
    ? data.proName.trim()
    : 'Votre professionnel BookMe Up'

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #e5e5e5;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a; letter-spacing: -0.5px;">
                BookMe Up
              </h1>
              <p style="margin: 16px 0 0; font-size: 18px; font-weight: 500; color: #333333;">
                Rappel de rendez-vous
              </p>
            </td>
          </tr>

          <!-- Main Message -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #333333;">
                Bonjour ${data.clientName},
              </p>
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #666666;">
                Ceci est un rappel automatique : votre rendez-vous avec <strong>${displayProName}</strong> aura lieu dans <strong>${hoursText}</strong>.
              </p>
            </td>
          </tr>

          <!-- Appointment Summary Card -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fafafa; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      
                      <!-- Date -->
                      <tr>
                        <td style="padding: 0 0 16px; border-bottom: 1px solid #e5e5e5;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 0 0 8px; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; color: #999999;">
                                Date
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">
                                ${data.date}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Time -->
                      <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #e5e5e5;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 0 0 8px; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; color: #999999;">
                                Heure
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">
                                ${data.time}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Service -->
                      <tr>
                        <td style="padding: 16px 0; border-bottom: ${data.duration ? '1px solid #e5e5e5' : 'none'};">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 0 0 8px; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; color: #999999;">
                                Service
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 0; font-size: 16px; font-weight: 500; color: #1a1a1a;">
                                ${data.serviceName}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      ${data.duration ? `
                      <!-- Duration -->
                      <tr>
                        <td style="padding: 16px 0 0;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 0 0 8px; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; color: #999999;">
                                Durée
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 0; font-size: 16px; font-weight: 500; color: #1a1a1a;">
                                ${data.duration} minutes
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ` : ''}

                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Additional Info -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 20px; background-color: #fff3cd; border-left: 3px solid #ffc107; border-radius: 4px;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #856404;">
                      <strong style="color: #856404;">Rappel :</strong> Si vous souhaitez modifier ou annuler votre rendez-vous, veuillez le faire au moins 24 heures à l'avance pour éviter toute pénalité.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px; background-color: #fafafa; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 0 12px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #999999;">
                      Cet email a été envoyé automatiquement par BookMe Up
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0; text-align: center;">
                    <a href="https://bookmeup.com" style="color: #666666; text-decoration: none; font-size: 12px;">
                      bookmeup.com
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  return { subject, html }
}

