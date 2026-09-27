import type { FormResponseRow } from '../types'
import { formatDate } from './date'

/**
 * Escapes a field for CSV / Excel export
 */
const escapeCSV = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '""'
  const str = String(value)
  // Replace double quotes with two double quotes
  const escaped = str.replace(/"/g, '""')
  return `"${escaped}"`
}

/**
 * Export grievances to an Excel-compatible CSV file with UTF-8 BOM
 */
export function exportGrievancesToExcel(
  grievances: FormResponseRow[],
  filename = `grievances_${new Date().toISOString().slice(0, 10)}.csv`
) {
  if (!grievances || grievances.length === 0) {
    throw new Error('No grievances available to export.')
  }

  // Define column headers
  const headers = [
    'Grievance ID',
    'Date Logged',
    'Complainant Name',
    'Email Address',
    'Grievance Type',
    'Problem Description',
    'Branch / Department',
    'Section',
    'Year',
    'Room No & Block',
    'Bus Route',
    'Bus Number',
    'Suggestions',
    'Status',
    'Source',
  ]

  // Map rows
  const rows = grievances.map((g) => [
    escapeCSV(g.id),
    escapeCSV(formatDate(g.created_at, 'N/A')),
    escapeCSV(g.name || 'Anonymous'),
    escapeCSV(g.email || ''),
    escapeCSV(g.type_of_grievance || ''),
    escapeCSV(g.problem_description || ''),
    escapeCSV(g.branch || ''),
    escapeCSV(g.section || ''),
    escapeCSV(g.year || ''),
    escapeCSV(g.room_no_and_block_name || ''),
    escapeCSV(g.bus_route || ''),
    escapeCSV(g.bus_number || ''),
    escapeCSV(g.suggestions || ''),
    escapeCSV(g.status || 'Not Yet Started'),
    escapeCSV(g.source || 'Form'),
  ])

  // Combine CSV content with UTF-8 BOM so Excel opens special characters correctly
  const csvContent =
    '\uFEFF' +
    [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join(
      '\r\n'
    )

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
