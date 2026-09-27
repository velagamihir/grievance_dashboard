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
    value: 'Issue mail sent',
    label: 'Issue Mail Sent',
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
    value: 'Final mail sent',
    label: 'Final Mail Sent',
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

export const getStatusBadgeVariant = (st?: string | null): ListBadgeVariant => {
  if (!st) return 'orange'
  const normalized = st.trim().toLowerCase()
  switch (normalized) {
    case 'resolved':
      return 'success'
    case 'final mail sent':
      return 'darkblue'
    case 'in progress':
      return 'lightblue'
    case 'issue mail sent':
      return 'warning'
    case 'not yet started':
    case 'pending':
    default:
      return 'orange'
  }
}

export const getStatusBadgeClass = (status: string | null | undefined): string => {
  if (!status) return 'bg-orange/15 text-orange border-orange/30'
  const s = status.trim().toLowerCase()
  if (s === 'resolved') {
    return 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30'
  }
  if (s === 'final mail sent') {
    return 'bg-darkblue/15 text-darkblue dark:bg-darkblue/40 dark:text-offwhite border-darkblue/30'
  }
  if (s === 'in progress') {
    return 'bg-lightblue/15 text-lightblue dark:text-lightblue border-lightblue/30'
  }
  if (s === 'issue mail sent') {
    return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
  }
  return 'bg-orange/15 text-orange border-orange/30'
}

export const getStatusSelectClass = (status: string | null | undefined): string => {
  return `appearance-none cursor-pointer text-xs font-semibold py-1.5 pl-3 pr-8 rounded-xl border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-lightblue/30 disabled:cursor-not-allowed disabled:opacity-60 ${getStatusBadgeClass(
    status
  )}`
}
