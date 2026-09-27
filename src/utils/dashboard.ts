import { Inbox, Clock, CheckCircle2, AlertCircle, Users } from 'lucide-react'
import type { FormResponseRow, DashboardStatItem, BlockCoordinatorRow, CoordinatorStatItem } from '../types'

/**
 * Calculates summary statistics for the Grievance Dashboard.
 */
export const calculateGrievanceStats = (grievances: FormResponseRow[] = []): DashboardStatItem[] => {
  const totalCount = grievances.length

  const notStartedCount = grievances.filter((g) => {
    const s = (g.status || '').toLowerCase().trim()
    return s === 'not yet started' || s === 'pending'
  }).length

  const inProgressCount = grievances.filter((g) => {
    const s = (g.status || '').toLowerCase().trim()
    return s === 'in progress' || s === 'under review' || s === 'issue mail sent'
  }).length

  const resolvedCount = grievances.filter((g) => {
    const s = (g.status || '').toLowerCase().trim()
    return s === 'resolved' || s === 'final mail sent'
  }).length

  return [
    {
      title: 'Total Grievances',
      count: totalCount.toString(),
      change: `${totalCount} records logged in DB`,
      icon: Inbox,
      color: 'bg-lightblue/15 text-lightblue dark:bg-lightblue/25',
    },
    {
      title: 'Not Yet Started',
      count: notStartedCount.toString(),
      change: `${notStartedCount} awaiting initial review`,
      icon: Clock,
      color: 'bg-orange/15 text-orange dark:bg-orange/25',
    },
    {
      title: 'In Progress',
      count: inProgressCount.toString(),
      change: `${inProgressCount} currently active`,
      icon: AlertCircle,
      color: 'bg-darkblue/15 text-darkblue dark:bg-darkblue/40 dark:text-offwhite',
    },
    {
      title: 'Resolved',
      count: resolvedCount.toString(),
      change: `${resolvedCount} resolved successfully`,
      icon: CheckCircle2,
      color: 'bg-green-500/15 text-green-600 dark:bg-green-500/25 dark:text-green-400',
    },
  ]
}

/**
 * Returns the most recent grievances up to the specified limit.
 */
export const getRecentGrievances = (
  grievances: FormResponseRow[] = [],
  limit = 6
): FormResponseRow[] => {
  return grievances.slice(0, limit)
}

/**
 * Extracts a formatted location string from a grievance row.
 */
export const getGrievanceLocation = (item: Partial<FormResponseRow>): string => {
  return item.branch || item.room_no_and_block_name || item.bus_route || item.bus_number || '-'
}

/**
 * Extracts a human-friendly display name from an email address or user object.
 */
export const getUserDisplayName = (
  emailOrUser?: string | null | { email?: string | null }
): string => {
  if (!emailOrUser) return 'User'
  const email = typeof emailOrUser === 'string' ? emailOrUser : emailOrUser.email
  if (!email) return 'User'
  const username = email.split('@')[0]
  return username.charAt(0).toUpperCase() + username.slice(1)
}

/**
 * Calculates statistics for Block Coordinators.
 */
export const calculateCoordinatorStats = (
  coordinators: BlockCoordinatorRow[] = []
): CoordinatorStatItem[] => {
  const totalCoordinators = coordinators.length
  const uniqueBlocksCount = new Set(
    coordinators.map((c) => (c.block || '').trim()).filter(Boolean)
  ).size

  return [
    {
      title: 'Total Coordinators',
      count: totalCoordinators.toString(),
      change: `${uniqueBlocksCount} unique blocks covered`,
      icon: Users,
      color: 'bg-lightblue/15 text-lightblue dark:bg-lightblue/25',
    },
  ]
}

/**
 * Returns active and resolved grievance counts for a coordinator's assigned block.
 */
export const getCoordinatorCases = (
  grievances: FormResponseRow[] = [],
  blockName: string | null
): { active: number; resolved: number } => {
  if (!blockName) return { active: 0, resolved: 0 }
  const norm = blockName.toLowerCase().trim()
  const matching = grievances.filter(
    (g) => (g.room_no_and_block_name || '').toLowerCase().includes(norm)
  )
  const active = matching.filter((g) => {
    const s = (g.status || '').toLowerCase().trim()
    return s === 'pending' || s === 'in progress' || s === 'under review' || s === 'not yet started'
  }).length
  const resolved = matching.filter(
    (g) => (g.status || '').toLowerCase().trim() === 'resolved' || (g.status || '').toLowerCase().trim() === 'final mail sent'
  ).length
  return { active, resolved }
}
