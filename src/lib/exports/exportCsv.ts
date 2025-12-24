import type { AccountingExportData } from './exportData'

/**
 * Escape CSV value (wrap in quotes if contains separator, newline, or quote)
 * Use semicolon (;) as separator for Excel FR compatibility
 */
function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  
  const str = String(value)
  
  // If contains semicolon, newline, or quote, wrap in quotes and escape quotes
  if (str.includes(';') || str.includes('\n') || str.includes('"') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  
  return str
}

/**
 * Format number with dot as decimal separator
 * toFixed already uses dot, but we ensure consistency
 */
function formatNumber(value: number): string {
  return value.toFixed(2)
}

/**
 * Format currency value (€)
 */
function formatCurrency(value: number): string {
  return formatNumber(value)
}

/**
 * Generate CSV row from array of values
 */
function csvRow(values: (string | number | null | undefined)[]): string {
  return values.map(escapeCsvValue).join(';')
}

/**
 * Generate accounting CSV files from export data.
 *
 * STRICT:
 * - Do not recalculate data
 * - Do not access Firestore
 * - CSV generation only
 */
export function generateAccountingCsv(data: AccountingExportData): {
  resume: string
  byService: string
  byClient: string
  byMonth: string
} {
  // 1) resume_comptabilite.csv
  const resumeRows: string[] = []
  resumeRows.push(csvRow(['Période', 'Revenu total (€)', 'Heures travaillées', 'TVA (%)', 'TVA (€)', 'Revenu HT (€)', 'Revenu TTC (€)']))
  
  // For resume, we'll show a single row with summary data
  // The period would ideally come from the context, but since we don't have it,
  // we'll use a generic label or calculate from revenueByMonth
  let periodLabel = 'Période sélectionnée'
  if (data.revenueByMonth.length > 0) {
    const months = data.revenueByMonth.map(m => m.month).sort()
    if (months.length === 1) {
      periodLabel = months[0]
    } else {
      periodLabel = `${months[0]} - ${months[months.length - 1]}`
    }
  }
  
  resumeRows.push(csvRow([
    periodLabel,
    formatCurrency(data.totalRevenue),
    formatNumber(data.workedHours),
    formatNumber(data.vat.vatRate * 100), // Convert to percentage
    formatCurrency(data.vat.vatAmount),
    formatCurrency(data.vat.revenueExclVat),
    formatCurrency(data.vat.revenueInclVat),
  ]))
  
  const resume = resumeRows.join('\n')

  // 2) revenu_par_service.csv
  const byServiceRows: string[] = []
  byServiceRows.push(csvRow(['Service', 'Réservations', 'Revenu (€)']))
  
  if (data.revenueByService.length === 0) {
    // Empty array → CSV with headers only
  } else {
    for (const item of data.revenueByService) {
      byServiceRows.push(csvRow([
        item.serviceName,
        item.bookingsCount,
        formatCurrency(item.revenue),
      ]))
    }
  }
  
  const byService = byServiceRows.join('\n')

  // 3) revenu_par_client.csv
  const byClientRows: string[] = []
  byClientRows.push(csvRow(['Client', 'Réservations', 'Revenu (€)']))
  
  if (data.revenueByClient.length === 0) {
    // Empty array → CSV with headers only
  } else {
    for (const item of data.revenueByClient) {
      byClientRows.push(csvRow([
        item.clientIdentifier,
        item.bookingsCount,
        formatCurrency(item.revenue),
      ]))
    }
  }
  
  const byClient = byClientRows.join('\n')

  // 4) revenu_par_mois.csv
  const byMonthRows: string[] = []
  byMonthRows.push(csvRow(['Mois', 'Revenu (€)']))
  
  if (data.revenueByMonth.length === 0) {
    // Empty array → CSV with headers only
  } else {
    for (const item of data.revenueByMonth) {
      // Format month as readable label (YYYY-MM → "Mois Année" or keep YYYY-MM)
      const monthLabel = item.month
      byMonthRows.push(csvRow([
        monthLabel,
        formatCurrency(item.revenue),
      ]))
    }
  }
  
  const byMonth = byMonthRows.join('\n')

  return {
    resume,
    byService,
    byClient,
    byMonth,
  }
}

