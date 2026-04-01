'use client'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface BookingForExport {
  id: string
  date: string
  start_time: string
  end_time?: string
  serviceName?: string
  client_name?: string
  status?: string
}

function formatDateFR(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

function statusLabel(status?: string): string {
  switch (status) {
    case 'confirmed': return 'Confirmé'
    case 'pending': return 'En attente'
    case 'cancelled': return 'Annulé'
    default: return status || '—'
  }
}

/**
 * Export bookings as CSV and trigger download.
 */
export function exportBookingsCsv(bookings: BookingForExport[], periodLabel: string) {
  const bom = '\uFEFF'
  const rows = [
    ['Date', 'Heure début', 'Heure fin', 'Service', 'Client', 'Statut'].join(';'),
    ...bookings.map((b) =>
      [
        formatDateFR(b.date),
        b.start_time,
        b.end_time || '—',
        b.serviceName || '—',
        b.client_name || '—',
        statusLabel(b.status),
      ].join(';')
    ),
  ].join('\n')

  const blob = new Blob([bom + rows], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `rendez-vous-${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export bookings as PDF and trigger download.
 */
export function exportBookingsPdf(bookings: BookingForExport[], periodLabel: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  const marginLeft = 40
  let y = 40

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Rendez-vous', marginLeft, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  y += 18
  doc.text(`Période : ${periodLabel}`, marginLeft, y)
  y += 14
  doc.text(`Exporté le : ${new Date().toLocaleDateString('fr-FR')}`, marginLeft, y)
  y += 24

  if (bookings.length === 0) {
    doc.text('Aucun rendez-vous sur cette période.', marginLeft, y)
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Heure', 'Service', 'Client', 'Statut']],
      body: bookings.map((b) => [
        formatDateFR(b.date),
        `${b.start_time}${b.end_time ? ` – ${b.end_time}` : ''}`,
        b.serviceName || '—',
        b.client_name || '—',
        statusLabel(b.status),
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [200, 109, 215], textColor: 255 },
      margin: { left: marginLeft, right: marginLeft },
      theme: 'grid',
    })
  }

  doc.save(`rendez-vous-${new Date().toISOString().slice(0, 10)}.pdf`)
}
