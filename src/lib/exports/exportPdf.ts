'use client'

import jsPDF from 'jspdf'
import autoTable, { type RowInput } from 'jspdf-autotable'
import type { AccountingExportData } from './exportData'

export interface AccountingPdfOptions {
  periodLabel: string
  exportedAt: Date
}

function formatCurrencyEUR(value: number): string {
  // Utiliser un format simple avec deux décimales et un point comme séparateur
  return `${value.toFixed(2)} €`
}

function formatNumber(value: number): string {
  return value.toFixed(2)
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Génère et télécharge un PDF d'export comptable côté client.
 *
 * STRICT :
 * - Ne recalcule pas les données
 * - N'accède pas à Firestore
 * - Utilise uniquement les données fournies par getAccountingExportData
 */
export function generateAccountingPdf(
  data: AccountingExportData,
  options: AccountingPdfOptions
): void {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  })

  const marginLeft = 40
  let cursorY = 40

  // 1) Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Export comptable', marginLeft, cursorY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  cursorY += 20
  doc.text('BookMe Up', marginLeft, cursorY)

  cursorY += 16
  doc.text(`Période : ${options.periodLabel}`, marginLeft, cursorY)

  cursorY += 14
  doc.text(`Date d’export : ${formatDate(options.exportedAt)}`, marginLeft, cursorY)

  // 2) Summary section
  cursorY += 30
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Résumé', marginLeft, cursorY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  cursorY += 18

  const summaryLines = [
    `Revenu total : ${formatCurrencyEUR(data.totalRevenue)}`,
    `Heures travaillées : ${formatNumber(data.workedHours)} h`,
    `TVA : ${(data.vat.vatRate * 100).toFixed(2)} %`,
    `Montant TVA : ${formatCurrencyEUR(data.vat.vatAmount)}`,
    `Revenu HT : ${formatCurrencyEUR(data.vat.revenueExclVat)}`,
    `Revenu TTC : ${formatCurrencyEUR(data.vat.revenueInclVat)}`,
  ]

  for (const line of summaryLines) {
    doc.text(line, marginLeft, cursorY)
    cursorY += 14
  }

  // Petite marge avant les tableaux
  cursorY += 12

  // Helper pour insérer un titre de section et gérer les sauts de page
  const addSectionTitle = (title: string) => {
    const pageHeight = doc.internal.pageSize.getHeight()
    if (cursorY + 30 > pageHeight) {
      doc.addPage()
      cursorY = 40
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(title, marginLeft, cursorY)
    cursorY += 18
  }

  // Helper pour afficher un message "Aucune donnée"
  const addNoDataText = () => {
    const pageHeight = doc.internal.pageSize.getHeight()
    if (cursorY + 20 > pageHeight) {
      doc.addPage()
      cursorY = 40
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text('Aucune donnée', marginLeft, cursorY)
    cursorY += 10
  }

  // 3) Table: Revenue by service
  addSectionTitle('Revenu par service')

  if (data.revenueByService.length === 0) {
    addNoDataText()
  } else {
    const body: RowInput[] = data.revenueByService.map((item) => [
      item.serviceName,
      String(item.bookingsCount),
      formatCurrencyEUR(item.revenue),
    ])

    autoTable(doc, {
      startY: cursorY,
      head: [['Service', 'Réservations', 'Revenu (€)']],
      body,
      styles: {
        fontSize: 10,
      },
      headStyles: {
        fillColor: [200, 109, 215], // mauve primaire
        textColor: 255,
      },
      margin: { left: marginLeft, right: marginLeft },
      theme: 'grid',
    })

    cursorY = (doc as any).lastAutoTable.finalY + 24
  }

  // 4) Table: Revenue by client
  addSectionTitle('Revenu par client')

  if (data.revenueByClient.length === 0) {
    addNoDataText()
  } else {
    const body: RowInput[] = data.revenueByClient.map((item) => [
      item.clientIdentifier,
      String(item.bookingsCount),
      formatCurrencyEUR(item.revenue),
    ])

    autoTable(doc, {
      startY: cursorY,
      head: [['Client', 'Réservations', 'Revenu (€)']],
      body,
      styles: {
        fontSize: 10,
      },
      headStyles: {
        fillColor: [200, 109, 215],
        textColor: 255,
      },
      margin: { left: marginLeft, right: marginLeft },
      theme: 'grid',
    })

    cursorY = (doc as any).lastAutoTable.finalY + 24
  }

  // 5) Table: Revenue by month
  addSectionTitle('Revenu par mois')

  if (data.revenueByMonth.length === 0) {
    addNoDataText()
  } else {
    const body: RowInput[] = data.revenueByMonth.map((item) => [
      item.month,
      formatCurrencyEUR(item.revenue),
    ])

    autoTable(doc, {
      startY: cursorY,
      head: [['Mois', 'Revenu (€)']],
      body,
      styles: {
        fontSize: 10,
      },
      headStyles: {
        fillColor: [200, 109, 215],
        textColor: 255,
      },
      margin: { left: marginLeft, right: marginLeft },
      theme: 'grid',
    })
  }

  // Export: nom de fichier export-comptable-YYYY-MM-DD.pdf
  const filename = `export-comptable-${formatDate(options.exportedAt)}.pdf`
  doc.save(filename)
}


