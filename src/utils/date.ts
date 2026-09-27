/**
 * Date and time formatting utility functions
 */

export const formatDate = (
  dateStr: string | null | undefined,
  fallback = 'N/A'
): string => {
  if (!dateStr) return fallback
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export const formatDateTime = (
  dateStr: string | null | undefined,
  fallback = 'N/A'
): string => {
  if (!dateStr) return fallback
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export const formatRelativeTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'Recently'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr

    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`

    return formatDate(dateStr)
  } catch {
    return dateStr
  }
}
