import type { ListBadgeVariant } from '../types'

export interface StatusOption {
  value: string
  label: string
  variant: ListBadgeVariant
  bgClass: string
  borderClass: string
  textClass: string
}

export const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'Not Yet Started',
    label: 'Not Yet Started',
    variant: 'orange',
    bgClass: 'bg-orange/15 text-orange',
    borderClass: 'border-orange/30',
    textClass: 'text-orange',
  },
  {
    value: 'Issue mail to be  sent',
    label: 'Issue Mail to be Sent',
    variant: 'warning',
    bgClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    borderClass: 'border-amber-500/30',
    textClass: 'text-amber-600 dark:text-amber-400',
  },
  {
    value: 'In progress',
    label: 'In Progress',
    variant: 'lightblue',
    bgClass: 'bg-lightblue/15 text-lightblue',
    borderClass: 'border-lightblue/30',
    textClass: 'text-lightblue',
  },
  {
    value: 'Final mail to be sent',
    label: 'Final Mail to be Sent',
    variant: 'darkblue',
    bgClass: 'bg-darkblue/15 text-darkblue dark:bg-darkblue/40 dark:text-offwhite',
    borderClass: 'border-darkblue/30',
    textClass: 'text-darkblue dark:text-offwhite',
  },
  {
    value: 'Resolved',
    label: 'Resolved',
    variant: 'success',
    bgClass: 'bg-green-500/15 text-green-700 dark:text-green-300',
    borderClass: 'border-green-500/30',
    textClass: 'text-green-600 dark:text-green-400',
  },
]

export const normalizeDbStatus = (status?: string | null): string => {
  if (!status) return 'Not Yet Started'
  const s = status.trim().toLowerCase()
  if (s === 'resolved') return 'Resolved'
  if (s.includes('issue mail')) return 'Issue mail to be  sent'
  if (s.includes('final mail')) return 'Final mail to be sent'
  if (s.includes('progress')) return 'In progress'
  return 'Not Yet Started'
}

export const getStatusBadgeVariant = (st?: string | null): ListBadgeVariant => {
  if (!st) return 'orange'
  const normalized = st.trim().toLowerCase()
  if (normalized === 'resolved') return 'success'
  if (normalized.includes('final mail')) return 'darkblue'
  if (normalized.includes('progress')) return 'lightblue'
  if (normalized.includes('issue mail')) return 'warning'
  return 'orange'
}

export const getStatusBadgeClass = (status: string | null | undefined): string => {
  if (!status) return 'bg-orange/15 text-orange border-orange/30'
  const s = status.trim().toLowerCase()
  if (s === 'resolved') {
    return 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30'
  }
  if (s.includes('final mail')) {
    return 'bg-darkblue/15 text-darkblue dark:bg-darkblue/40 dark:text-offwhite border-darkblue/30'
  }
  if (s.includes('progress')) {
    return 'bg-lightblue/15 text-lightblue dark:text-lightblue border-lightblue/30'
  }
  if (s.includes('issue mail')) {
    return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
  }
  return 'bg-orange/15 text-orange border-orange/30'
}

export const getStatusSelectClass = (status: string | null | undefined): string => {
  return `appearance-none cursor-pointer text-xs font-semibold py-1.5 pl-3 pr-8 rounded-xl border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-lightblue/30 disabled:cursor-not-allowed disabled:opacity-60 ${getStatusBadgeClass(
    status
  )}`
}
