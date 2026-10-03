import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePermissions } from './usePermissions'
import { supabase } from '../lib/supabase'
import type {
  WorklogRow,
  WorklogWithUser,
  ProfileRow,
  TaskRow,
  CreateWorklogFormData,
  UpdateWorklogFormData,
  WorklogStatItem,
  TasksToast,
} from '../types'
import {
  FileText,
  Clock,
  CheckCircle2,
  Edit3,
} from 'lucide-react'

export function useWorklogsPage() {
  const { user, signOutUser } = useAuth()
  const {
    role,
    displayName,
    isSuperAdmin,
    isAdminOrSuperAdmin,
    canViewTasks,
    loading: permissionsLoading,
    refreshPermissions,
  } = usePermissions()

  const [rawWorklogs, setRawWorklogs] = useState<WorklogRow[]>([])
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState<TasksToast | null>(null)
  const [dbNotice, setDbNotice] = useState<string | null>(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [sourceFilter, setSourceFilter] = useState('All')
  const [scopeFilter, setScopeFilter] = useState<'all' | 'my_logs'>('all')
  const [dateFilter, setDateFilter] = useState<string>('')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const [activeWorklog, setActiveWorklog] = useState<WorklogWithUser | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
  }, [])

  // Fetch personal worklogs, profiles, tasks, and user's completed task_assignments from Supabase
  const fetchData = useCallback(async () => {
    if (!user?.uid) {
      setRawWorklogs([])
      setLoading(false)
      return
    }

    try {
      setRefreshing(true)
      setDbNotice(null)

      const [logsRes, profilesRes, tasksRes, completedAssignsRes] = await Promise.all([
        supabase
          .from('worklogs')
          .select('*')
          .eq('user_uid', user.uid)
          .order('completed_at', { ascending: false }),
        supabase.from('profiles').select('*').order('firebase_uid', { ascending: true }),
        supabase.from('tasks').select('*'),
        supabase
          .from('task_assignments')
          .select('*')
          .eq('user_uid', user.uid)
          .eq('status', 'Completed'),
      ])

      let existingLogs: WorklogRow[] = []
      if (logsRes.error) {
        console.warn('Worklogs table notice:', logsRes.error.message)
        setDbNotice(logsRes.error.message)
      } else {
        existingLogs = logsRes.data || []
      }

      const freshTasks = tasksRes.data || []
      const freshProfiles = profilesRes.data || []
      const completedAssigns = completedAssignsRes.data || []

      if (freshProfiles.length > 0) {
        setProfiles(freshProfiles)
      }

      if (freshTasks.length > 0) {
        setTasks(freshTasks)
      }

      // Auto-backfill any completed task assignments for this user not yet in worklogs
      const existingKeySet = new Set(
        existingLogs.map((w) => `${w.task_id || ''}-${w.user_uid}`)
      )

      const missingCompleted = completedAssigns.filter(
        (a) => !existingKeySet.has(`${a.task_id}-${a.user_uid}`)
      )

      if (missingCompleted.length > 0) {
        const taskMapLocal = new Map<number, TaskRow>()
        freshTasks.forEach((t) => taskMapLocal.set(t.id, t))

        const newWorklogRows = missingCompleted.map((a) => {
          const t = taskMapLocal.get(a.task_id)
          return {
            task_id: a.task_id,
            user_uid: user.uid,
            title: t?.title || 'Completed Task Assignment',
            description: a.notes || t?.description || 'Task completed via Work Assignments',
            category: 'Task Completion',
            hours_spent: 1.0,
            log_source: 'Task Completion' as const,
            completed_at: a.completed_at || a.created_at || new Date().toISOString(),
            created_at: a.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        })

        // Insert missing rows to Supabase worklogs
        const { data: inserted, error: insertErr } = await supabase
          .from('worklogs')
          .insert(newWorklogRows)
          .select()

        if (!insertErr && inserted && inserted.length > 0) {
          setRawWorklogs([...inserted, ...existingLogs])
        } else {
          // Fallback to synthetic rows for immediate UI display
          const syntheticRows: WorklogRow[] = newWorklogRows.map((r, idx) => ({
            ...r,
            id: -1 * (idx + 1),
            description: r.description || null,
          }))
          setRawWorklogs([...syntheticRows, ...existingLogs])
        }
      } else {
        setRawWorklogs(existingLogs)
      }
    } catch (err: unknown) {
      console.warn('Error querying worklogs data from Supabase:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user])

  useEffect(() => {
    if (!permissionsLoading) {
      fetchData()
    }
  }, [permissionsLoading, fetchData])

  // Profile Map for fast lookup
  const profileMap = useMemo(() => {
    const map = new Map<string, ProfileRow>()
    profiles.forEach((p) => {
      map.set(p.firebase_uid, p)
    })
    return map
  }, [profiles])

  // Task Map for fast lookup
  const taskMap = useMemo(() => {
    const map = new Map<number, TaskRow>()
    tasks.forEach((t) => {
      map.set(t.id, t)
    })
    return map
  }, [tasks])

  // Processed and enriched worklogs with profile and task references
  const worklogsWithDetails: WorklogWithUser[] = useMemo(() => {
    return rawWorklogs.map((log) => {
      const userProfile = profileMap.get(log.user_uid) || null
      const task = log.task_id ? taskMap.get(log.task_id) || null : null

      return {
        ...log,
        userProfile,
        task,
      }
    })
  }, [rawWorklogs, profileMap, taskMap])

  // Filtered worklogs based on search, category, source, scope, and date
  const filteredWorklogs = useMemo(() => {
    return worklogsWithDetails.filter((log) => {
      // 1. Category Filter
      if (categoryFilter !== 'All') {
        if ((log.category || 'General').toLowerCase() !== categoryFilter.toLowerCase()) {
          return false
        }
      }

      // 2. Source Filter ('Manual' vs 'Task Completion')
      if (sourceFilter !== 'All') {
        if ((log.log_source || 'Manual').toLowerCase() !== sourceFilter.toLowerCase()) {
          return false
        }
      }

      // 3. Date Filter
      if (dateFilter) {
        const logDateStr = (log.completed_at || log.created_at).split('T')[0]
        if (logDateStr !== dateFilter) {
          return false
        }
      }

      // 4. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const titleMatch = log.title.toLowerCase().includes(q)
        const descMatch = (log.description || '').toLowerCase().includes(q)
        const catMatch = (log.category || '').toLowerCase().includes(q)
        const taskTitleMatch = (log.task?.title || '').toLowerCase().includes(q)

        if (!titleMatch && !descMatch && !catMatch && !taskTitleMatch) {
          return false
        }
      }

      return true
    })
  }, [worklogsWithDetails, categoryFilter, sourceFilter, dateFilter, searchQuery])

  // KPI Statistics for current user
  const stats: WorklogStatItem[] = useMemo(() => {
    const totalLogs = worklogsWithDetails.length
    const totalHours = worklogsWithDetails
      .reduce((acc, curr) => acc + (Number(curr.hours_spent) || 0), 0)
      .toFixed(1)
    const taskLogs = worklogsWithDetails.filter((w) => w.log_source === 'Task Completion').length
    const manualLogs = worklogsWithDetails.filter((w) => w.log_source === 'Manual').length
    const avgHours = totalLogs > 0 ? (Number(totalHours) / totalLogs).toFixed(1) : '0'

    return [
      {
        title: 'My Worklogs',
        count: totalLogs,
        change: 'Personal activity entries',
        icon: FileText,
        color: 'from-blue-600 to-indigo-600 text-white',
      },
      {
        title: 'Hours Logged',
        count: `${totalHours} hrs`,
        change: 'Cumulative operational effort',
        icon: Clock,
        color: 'from-amber-500 to-orange-600 text-white',
      },
      {
        title: 'Task Completions',
        count: taskLogs,
        change: 'Auto-synced from works',
        icon: CheckCircle2,
        color: 'from-emerald-500 to-teal-600 text-white',
      },
      {
        title: 'Manual Entries',
        count: manualLogs,
        change: 'Directly logged by you',
        icon: Edit3,
        color: 'from-purple-600 to-violet-700 text-white',
      },
      {
        title: 'Avg Effort / Log',
        count: `${avgHours} hrs`,
        change: 'Average time per activity',
        icon: Clock,
        color: 'from-rose-500 to-red-600 text-white',
      },
    ]
  }, [worklogsWithDetails])

  // Distinct Categories
  const categories = useMemo(() => {
    const base = [
      'All',
      'General',
      'Task Completion',
      'Maintenance',
      'Sanitation',
      'Inspection',
      'Academic',
      'Administrative',
      'Grievance Resolution',
      'Operations',
    ]
    const set = new Set(base)
    rawWorklogs.forEach((w) => {
      if (w.category) set.add(w.category)
    })
    return Array.from(set)
  }, [rawWorklogs])

  // Modal Open Handlers
  const handleOpenAdd = useCallback(() => {
    setModalError(null)
    setIsAddModalOpen(true)
  }, [])

  const handleOpenEdit = useCallback((worklog: WorklogWithUser) => {
    setActiveWorklog(worklog)
    setModalError(null)
    setIsEditModalOpen(true)
  }, [])

  const handleOpenDelete = useCallback((worklog: WorklogWithUser) => {
    setActiveWorklog(worklog)
    setModalError(null)
    setIsDeleteModalOpen(true)
  }, [])

  const handleOpenDetails = useCallback((worklog: WorklogWithUser) => {
    setActiveWorklog(worklog)
    setModalError(null)
    setIsDetailsModalOpen(true)
  }, [])

  // 1. Create Manual Worklog in Supabase
  const handleCreateWorklog = useCallback(
    async (formData: CreateWorklogFormData) => {
      if (!user) {
        showToast('You must be signed in to create worklogs.', 'error')
        return
      }

      if (!formData.title.trim()) {
        setModalError('Work title is required.')
        return
      }

      try {
        setActionLoading(true)
        setModalError(null)

        const completedDate = formData.completed_at
          ? new Date(formData.completed_at).toISOString()
          : new Date().toISOString()

        const worklogPayload = {
          user_uid: user.uid,
          task_id: null,
          title: formData.title.trim(),
          description: formData.description?.trim() || null,
          category: formData.category || 'General',
          hours_spent: Number(formData.hours_spent) || 1.0,
          log_source: 'Manual',
          completed_at: completedDate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { error: insertError } = await supabase
          .from('worklogs')
          .insert([worklogPayload])

        if (insertError) {
          throw insertError
        }

        await fetchData()
        setIsAddModalOpen(false)
        showToast(`Worklog "${formData.title}" recorded successfully!`, 'success')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create worklog'
        setModalError(msg)
        showToast(msg, 'error')
      } finally {
        setActionLoading(false)
      }
    },
    [user, fetchData, showToast]
  )

  // 2. Update Worklog in Supabase
  const handleUpdateWorklog = useCallback(
    async (formData: UpdateWorklogFormData) => {
      if (!formData.title.trim()) {
        setModalError('Work title is required.')
        return
      }

      try {
        setActionLoading(true)
        setModalError(null)

        const completedDate = formData.completed_at
          ? new Date(formData.completed_at).toISOString()
          : new Date().toISOString()

        const updatePayload = {
          title: formData.title.trim(),
          description: formData.description?.trim() || null,
          category: formData.category || 'General',
          hours_spent: Number(formData.hours_spent) || 1.0,
          completed_at: completedDate,
          updated_at: new Date().toISOString(),
        }

        const { error: updateError } = await supabase
          .from('worklogs')
          .update(updatePayload)
          .eq('id', formData.id)

        if (updateError) throw updateError

        await fetchData()
        setIsEditModalOpen(false)
        setActiveWorklog(null)
        showToast(`Worklog updated successfully!`, 'success')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update worklog'
        setModalError(msg)
        showToast(msg, 'error')
      } finally {
        setActionLoading(false)
      }
    },
    [fetchData, showToast]
  )

  // 3. Delete Worklog in Supabase
  const handleDeleteWorklog = useCallback(async () => {
    if (!activeWorklog) return

    try {
      setActionLoading(true)
      setModalError(null)

      const { error: delError } = await supabase
        .from('worklogs')
        .delete()
        .eq('id', activeWorklog.id)

      if (delError) throw delError

      await fetchData()
      setIsDeleteModalOpen(false)
      setActiveWorklog(null)
      showToast(`Worklog "${activeWorklog.title}" deleted successfully!`, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete worklog'
      setModalError(msg)
      showToast(msg, 'error')
    } finally {
      setActionLoading(false)
    }
  }, [activeWorklog, fetchData, showToast])

  return {
    // Auth & Permissions
    user,
    signOutUser,
    role,
    displayName,
    isSuperAdmin,
    isAdminOrSuperAdmin,
    canViewTasks,
    permissionsLoading,
    refreshPermissions,

    // Data State
    worklogs: worklogsWithDetails,
    filteredWorklogs,
    profiles,
    tasks,
    stats,
    categories,
    loading,
    refreshing,
    toast,
    dbNotice,

    // Filters
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    sourceFilter,
    setSourceFilter,
    scopeFilter,
    setScopeFilter,
    dateFilter,
    setDateFilter,

    // Modals
    isAddModalOpen,
    setIsAddModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDetailsModalOpen,
    setIsDetailsModalOpen,
    activeWorklog,
    actionLoading,
    modalError,

    // Modal Triggers
    handleOpenAdd,
    handleOpenEdit,
    handleOpenDelete,
    handleOpenDetails,
    setToast,

    // Operations
    fetchData,
    handleCreateWorklog,
    handleUpdateWorklog,
    handleDeleteWorklog,
  }
}

export default useWorklogsPage
