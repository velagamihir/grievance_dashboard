import type { ListBadgeVariant } from '../types'

export const WORKFLOW_1_URL =
  'https://defaultf6981b0a39154628be7e368196415f.8f.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/24/workflows/39cd03b882604c9688cb5736fc47290e/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=KKCJqNkdCwhh0_o5e7_XyOkeLA_9rDFvfmRtmYdnZNc'

export const WORKFLOW_2_URL =
  'https://defaultf6981b0a39154628be7e368196415f.8f.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/03/workflows/d37f8e2b01614d5fa3e273a2ba60c8bb/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=tpqTSnHDMl3WhYF3PMAUyX9TgSMxR3OwLgFKjkA2H-g'

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
    value: 'In progress',
    label: 'In Progress',
    variant: 'lightblue',
    bgClass: 'bg-lightblue/15 text-lightblue',
    borderClass: 'border-lightblue/30',
    textClass: 'text-lightblue',
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

export const triggerStatusAutomatedMail = async (
  status: string,
  item: { name?: string | null; email?: string | null }
): Promise<{ triggered: boolean; success: boolean; message: string }> => {
  const s = (status || '').trim().toLowerCase()
  const isProgress = s === 'in progress' || s === 'in_progress' || s.includes('progress')
  const isResolved = s === 'resolved'

  if (!isProgress && !isResolved) {
    return { triggered: false, success: true, message: '' }
  }

  if (!item.email || !item.email.trim()) {
    return {
      triggered: true,
      success: false,
      message: 'No recipient email address found for grievance notification.',
    }
  }

  const targetUrl = isProgress ? WORKFLOW_1_URL : WORKFLOW_2_URL
  const flowLabel = isProgress ? 'In-Progress notification mail' : 'Resolution confirmation mail'

  try {
    const payload = {
      name: item.name || 'Anonymous',
      email: item.email.trim(),
    }

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      throw new Error(`Mail webhook responded with status ${res.status}`)
    }

    return {
      triggered: true,
      success: true,
      message: `${flowLabel} automatically sent to ${item.email}!`,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error'
    console.warn(`Automated ${flowLabel} error:`, errorMsg)
    return {
      triggered: true,
      success: false,
      message: `Status updated, but could not send ${flowLabel} (${errorMsg}).`,
    }
  }
}

export const normalizeDbStatus = (status?: string | null): string => {
  if (!status) return 'Not Yet Started'
  const s = status.trim().toLowerCase()
  if (s === 'resolved') return 'Resolved'
  if (s.includes('progress') || s.includes('issue mail')) return 'In progress'
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
