import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePermissions } from './usePermissions'
import { supabase } from '../lib/supabase'
import type {
  TaskRow,
  TaskAssignmentRow,
  TaskAssignmentWithUser,
  TaskWithAssignments,
  ProfileRow,
  CreateTaskFormData,
  UpdateTaskFormData,
  UpdateAssignmentStatusFormData,
  TaskStatItem,
  TasksToast,
} from '../types'
import { CheckSquare, Clock, AlertTriangle, UserCheck, CheckCircle2 } from 'lucide-react'

export function useTasksPage() {
  const { user, signOutUser } = useAuth()
  const {
    role,
    displayName,
    isSuperAdmin,
    isAdminOrSuperAdmin,
    canViewTasks,
    canCreateTask,
    canAddTask,
    canEditTask,
    canDeleteTask,
    canUpdateTaskStatus,
    loading: permissionsLoading,
    refreshPermissions,
  } = usePermissions()

  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [assignments, setAssignments] = useState<TaskAssignmentRow[]>([])
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState<TasksToast | null>(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [scopeFilter, setScopeFilter] = useState<'all' | 'assigned_to_me' | 'created_by_me'>('all')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isStatusUpdateModalOpen, setIsStatusUpdateModalOpen] = useState(false)

  const [activeTask, setActiveTask] = useState<TaskWithAssignments | null>(null)
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

  // Fetch all tasks, assignments, and member profiles from Supabase
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true)
      const [tasksRes, assignmentsRes, profilesRes] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('task_assignments').select('*'),
        supabase.from('profiles').select('*').order('firebase_uid', { ascending: true }),
      ])

      if (tasksRes.error) {
        console.warn('Tasks table notice:', tasksRes.error.message)
        setTasks([])
      } else {
        setTasks(tasksRes.data || [])
      }

      if (assignmentsRes.error) {
        console.warn('Assignments table notice:', assignmentsRes.error.message)
        setAssignments([])
      } else {
        setAssignments(assignmentsRes.data || [])
      }

      if (!profilesRes.error && profilesRes.data) {
        setProfiles(profilesRes.data)
      }
    } catch (err: unknown) {
      console.warn('Error querying tasks data from Supabase:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

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

  // Processed and enriched tasks with full assignment details
  const tasksWithAssignments: TaskWithAssignments[] = useMemo(() => {
    const currentUid = user?.uid || ''

    return tasks.map((task) => {
      const explicitAssignments = assignments.filter((a) => String(a.task_id) === String(task.id))
      const explicitMap = new Map<string, TaskAssignmentRow>()
      explicitAssignments.forEach((a) => explicitMap.set(a.user_uid, a))

      let finalAssignments: TaskAssignmentWithUser[] = []

      if (task.assigned_to_all) {
        finalAssignments = profiles.map((p) => {
          const explicit = explicitMap.get(p.firebase_uid)
          if (explicit) {
            return {
              ...explicit,
              userProfile: p,
            }
          }
          return {
            id: -1,
            task_id: task.id,
            user_uid: p.firebase_uid,
            status: 'Pending' as const,
            notes: null,
            completed_at: null,
            created_at: task.created_at,
            userProfile: p,
          }
        })
      } else {
        finalAssignments = explicitAssignments.map((a) => ({
          ...a,
          userProfile: profileMap.get(a.user_uid) || null,
        }))
      }

      const creator = profileMap.get(task.created_by) || null
      const myAssignment = finalAssignments.find((a) => a.user_uid === currentUid) || null
      const completedCount = finalAssignments.filter((a) => a.status === 'Completed').length
      const totalAssignedCount = finalAssignments.length

      return {
        ...task,
        assignments: finalAssignments,
        creatorProfile: creator,
        myAssignment,
        completedCount,
        totalAssignedCount,
      }
    })
  }, [tasks, assignments, profiles, profileMap, user])

  // Filtered tasks based on search, status, priority, and scope
  const filteredTasks = useMemo(() => {
    const currentUid = user?.uid || ''

    return tasksWithAssignments.filter((task) => {
      // 1. Status Filter
      if (statusFilter !== 'All') {
        if (task.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false
        }
      }

      // 2. Priority Filter
      if (priorityFilter !== 'All') {
        if (task.priority.toLowerCase() !== priorityFilter.toLowerCase()) {
          return false
        }
      }

      // 3. Scope Filter ('all' | 'assigned_to_me' | 'created_by_me')
      if (scopeFilter === 'assigned_to_me') {
        const isAssigned =
          task.assigned_to_all || task.assignments.some((a) => a.user_uid === currentUid)
        if (!isAssigned) return false
      } else if (scopeFilter === 'created_by_me') {
        if (task.created_by !== currentUid) return false
      }

      // 4. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const titleMatch = task.title.toLowerCase().includes(q)
        const descMatch = (task.description || '').toLowerCase().includes(q)
        const creatorMatch =
          (task.creatorProfile?.display_name || '').toLowerCase().includes(q) ||
          (task.creatorProfile?.email || '').toLowerCase().includes(q)
        const assigneeMatch = task.assignments.some((a) => {
          const name = a.userProfile?.display_name || ''
          const email = a.userProfile?.email || ''
          return name.toLowerCase().includes(q) || email.toLowerCase().includes(q)
        })

        if (!titleMatch && !descMatch && !creatorMatch && !assigneeMatch) {
          return false
        }
      }

      return true
    })
  }, [tasksWithAssignments, statusFilter, priorityFilter, scopeFilter, searchQuery, user])

  // KPI Statistics
  const stats: TaskStatItem[] = useMemo(() => {
    const currentUid = user?.uid || ''
    const total = tasksWithAssignments.length
    const inProgress = tasksWithAssignments.filter((t) => t.status === 'In Progress').length
    const completed = tasksWithAssignments.filter((t) => t.status === 'Completed').length
    const urgentHigh = tasksWithAssignments.filter(
      (t) => (t.priority === 'High' || t.priority === 'Urgent') && t.status !== 'Completed'
    ).length
    const assignedToMe = tasksWithAssignments.filter(
      (t) => t.assigned_to_all || t.assignments.some((a) => a.user_uid === currentUid)
    ).length

    return [
      {
        title: 'Total Works',
        count: total,
        change: 'System assignments',
        icon: CheckSquare,
        color: 'from-blue-600 to-indigo-600 text-white',
      },
      {
        title: 'In Progress',
        count: inProgress,
        change: 'Active Execution',
        icon: Clock,
        color: 'from-amber-500 to-orange-600 text-white',
      },
      {
        title: 'Completed',
        count: completed,
        change: 'Fully Resolved',
        icon: CheckCircle2,
        color: 'from-emerald-500 to-teal-600 text-white',
      },
      {
        title: 'Urgent / High Priority',
        count: urgentHigh,
        change: 'Needs Attention',
        icon: AlertTriangle,
        color: 'from-rose-500 to-red-600 text-white',
      },
      {
        title: 'Assigned to Me',
        count: assignedToMe,
        change: 'Personal Action Items',
        icon: UserCheck,
        color: 'from-purple-600 to-violet-700 text-white',
      },
    ]
  }, [tasksWithAssignments, user])

  // Modal Open Handlers
  const handleOpenAdd = useCallback(() => {
    setModalError(null)
    setIsAddModalOpen(true)
  }, [])

  const handleOpenEdit = useCallback((task: TaskWithAssignments) => {
    setActiveTask(task)
    setModalError(null)
    setIsEditModalOpen(true)
  }, [])

  const handleOpenDelete = useCallback((task: TaskWithAssignments) => {
    setActiveTask(task)
    setModalError(null)
    setIsDeleteModalOpen(true)
  }, [])

  const handleOpenDetails = useCallback((task: TaskWithAssignments) => {
    setActiveTask(task)
    setModalError(null)
    setIsDetailsModalOpen(true)
  }, [])

  const handleOpenStatusUpdate = useCallback((task: TaskWithAssignments) => {
    setActiveTask(task)
    setModalError(null)
    setIsStatusUpdateModalOpen(true)
  }, [])

  // 1. Create Task & Assign to Members in Supabase
  const handleCreateTask = useCallback(
    async (formData: CreateTaskFormData) => {
      if (!user) {
        showToast('You must be signed in to create work assignments.', 'error')
        return
      }

      if (!formData.title.trim()) {
        setModalError('Work title is required.')
        return
      }

      if (!formData.assigned_to_all && formData.assigned_uids.length === 0) {
        setModalError('Please select at least one member or toggle "Assign to All".')
        return
      }

      try {
        setActionLoading(true)
        setModalError(null)

        // 1. Insert main task record
        const taskPayload = {
          title: formData.title.trim(),
          description: formData.description?.trim() || null,
          priority: formData.priority,
          status: 'Pending',
          due_date: formData.due_date || null,
          assigned_to_all: formData.assigned_to_all,
          created_by: user.uid,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { data: createdTask, error: taskError } = await supabase
          .from('tasks')
          .insert([taskPayload])
          .select()
          .single()

        if (taskError) {
          throw taskError
        }

        const taskId = createdTask.id

        // 2. Prepare assignment list
        let targetUids: string[] = []
        if (formData.assigned_to_all) {
          targetUids = profiles.map((p) => p.firebase_uid)
        } else {
          targetUids = formData.assigned_uids
        }

        // Deduplicate
        targetUids = Array.from(new Set(targetUids))

        if (targetUids.length > 0) {
          const assignmentRows = targetUids.map((uid) => ({
            task_id: taskId,
            user_uid: uid,
            status: 'Pending',
            created_at: new Date().toISOString(),
          }))

          const { error: assignError } = await supabase
            .from('task_assignments')
            .insert(assignmentRows)

          if (assignError) {
            console.warn('Assignment notice:', assignError.message)
          }
        }

        await fetchData()
        setIsAddModalOpen(false)
        showToast(`Work "${formData.title}" assigned successfully!`, 'success')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create work assignment'
        setModalError(msg)
        showToast(msg, 'error')
      } finally {
        setActionLoading(false)
      }
    },
    [user, profiles, fetchData, showToast]
  )

  // 2. Update Task & Assignments in Supabase
  const handleUpdateTask = useCallback(
    async (formData: UpdateTaskFormData) => {
      if (!formData.title.trim()) {
        setModalError('Work title is required.')
        return
      }

      try {
        setActionLoading(true)
        setModalError(null)

        const updatePayload = {
          title: formData.title.trim(),
          description: formData.description?.trim() || null,
          priority: formData.priority,
          status: formData.status,
          due_date: formData.due_date || null,
          assigned_to_all: formData.assigned_to_all,
          updated_at: new Date().toISOString(),
        }

        const { error: updateError } = await supabase
          .from('tasks')
          .update(updatePayload)
          .eq('id', formData.id)

        if (updateError) throw updateError

        // Sync assignment rows if member selection changed
        let targetUids: string[] = []
        if (formData.assigned_to_all) {
          targetUids = profiles.map((p) => p.firebase_uid)
        } else {
          targetUids = formData.assigned_uids
        }
        targetUids = Array.from(new Set(targetUids))

        // Get current assignments for this task
        const { data: existingAssignments } = await supabase
          .from('task_assignments')
          .select('user_uid')
          .eq('task_id', formData.id)

        const existingUidSet = new Set((existingAssignments || []).map((a) => a.user_uid))
        const targetUidSet = new Set(targetUids)

        // Find UIDs to add
        const toAdd = targetUids.filter((uid) => !existingUidSet.has(uid))
        if (toAdd.length > 0) {
          const newRows = toAdd.map((uid) => ({
            task_id: formData.id,
            user_uid: uid,
            status: 'Pending',
            created_at: new Date().toISOString(),
          }))
          await supabase.from('task_assignments').insert(newRows)
        }

        // Find UIDs to remove
        const toRemove = Array.from(existingUidSet).filter((uid) => !targetUidSet.has(uid))
        if (toRemove.length > 0) {
          await supabase
            .from('task_assignments')
            .delete()
            .eq('task_id', formData.id)
            .in('user_uid', toRemove)
        }

        // Sync worklog if overall status is marked Completed
        if (formData.status === 'Completed' && user) {
          try {
            const { data: existingLog } = await supabase
              .from('worklogs')
              .select('id')
              .eq('task_id', formData.id)
              .eq('user_uid', user.uid)
              .maybeSingle()

            if (!existingLog) {
              await supabase.from('worklogs').insert([
                {
                  task_id: formData.id,
                  user_uid: user.uid,
                  title: formData.title.trim(),
                  description: formData.description?.trim() || 'Task marked completed via Work edit',
                  category: 'Task Completion',
                  hours_spent: 1.0,
                  log_source: 'Task Completion',
                  completed_at: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              ])
            }
          } catch (logErr) {
            console.warn('Worklog sync notice:', logErr)
          }
        }

        await fetchData()
        setIsEditModalOpen(false)
        setActiveTask(null)
        showToast(`Work details updated successfully!`, 'success')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update work'
        setModalError(msg)
        showToast(msg, 'error')
      } finally {
        setActionLoading(false)
      }
    },
    [user, profiles, fetchData, showToast]
  )

  // 3. Update Individual Assignment Status
  const handleUpdateAssignmentStatus = useCallback(
    async (formData: UpdateAssignmentStatusFormData) => {
      if (!user) {
        showToast('You must be signed in to update work status.', 'error')
        return
      }

      try {
        setActionLoading(true)
        setModalError(null)

        const isCompleted = formData.status === 'Completed'
        const taskIdNum = Number(formData.taskId)
        const userUidStr = formData.userUid ? String(formData.userUid) : String(user.uid)

        const assignmentData = {
          task_id: taskIdNum,
          user_uid: userUidStr,
          status: formData.status,
          notes: formData.notes?.trim() || null,
          completed_at: isCompleted ? new Date().toISOString() : null,
        }

        // 1. Try upsert with onConflict for atomic operation
        const { error: upsertErr } = await supabase
          .from('task_assignments')
          .upsert(assignmentData, { onConflict: 'task_id,user_uid' })

        // 2. Fallback to manual check-then-write if upsert has an issue
        if (upsertErr) {
          console.warn('Upsert fallback triggered:', upsertErr.message)
          const { data: existingRow } = await supabase
            .from('task_assignments')
            .select('id')
            .eq('task_id', taskIdNum)
            .eq('user_uid', userUidStr)
            .maybeSingle()

          if (existingRow) {
            const { error: assignError } = await supabase
              .from('task_assignments')
              .update({
                status: formData.status,
                notes: formData.notes?.trim() || null,
                completed_at: isCompleted ? new Date().toISOString() : null,
              })
              .eq('id', existingRow.id)

            if (assignError) throw assignError
          } else {
            const { error: insertError } = await supabase
              .from('task_assignments')
              .insert([
                {
                  ...assignmentData,
                  created_at: new Date().toISOString(),
                },
              ])

            if (insertError) throw insertError
          }
        }

        // 3. Recalculate overall task status if necessary
        const { data: taskAssigns } = await supabase
          .from('task_assignments')
          .select('status')
          .eq('task_id', taskIdNum)

        if (taskAssigns && taskAssigns.length > 0) {
          const allCompleted = taskAssigns.every((a) => a.status === 'Completed')
          const anyInProgress = taskAssigns.some(
            (a) => a.status === 'In Progress' || a.status === 'Completed'
          )

          let newOverallStatus = 'Pending'
          if (allCompleted) {
            newOverallStatus = 'Completed'
          } else if (anyInProgress) {
            newOverallStatus = 'In Progress'
          }

          await supabase
            .from('tasks')
            .update({ status: newOverallStatus, updated_at: new Date().toISOString() })
            .eq('id', taskIdNum)
        }

        // 4. If status is Completed, automatically record/sync in worklogs table
        if (isCompleted) {
          try {
            // 4a. Fetch fresh task title & details
            const { data: freshTask } = await supabase
              .from('tasks')
              .select('id, title, description')
              .eq('id', taskIdNum)
              .maybeSingle()

            const taskDetail = freshTask || tasks.find((t) => t.id === taskIdNum)
            const logTitle = taskDetail?.title || activeTask?.title || 'Completed Task Assignment'
            const logDescription =
              formData.notes?.trim() ||
              taskDetail?.description ||
              activeTask?.description ||
              'Task completed via Work Assignments'

            const { data: existingLog, error: logCheckErr } = await supabase
              .from('worklogs')
              .select('id')
              .eq('task_id', taskIdNum)
              .eq('user_uid', userUidStr)
              .maybeSingle()

            if (logCheckErr) {
              console.warn('Notice checking worklogs:', logCheckErr.message)
            }

            if (!existingLog) {
              const { error: insertWorklogErr } = await supabase.from('worklogs').insert([
                {
                  task_id: taskIdNum,
                  user_uid: userUidStr,
                  title: logTitle,
                  description: logDescription,
                  category: 'Task Completion',
                  hours_spent: 1.0,
                  log_source: 'Task Completion',
                  completed_at: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              ])

              if (insertWorklogErr) {
                console.error('Worklog insert notice/error:', insertWorklogErr.message)
              }
            } else {
              const { error: updateWorklogErr } = await supabase
                .from('worklogs')
                .update({
                  title: logTitle,
                  description: logDescription,
                  completed_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingLog.id)

              if (updateWorklogErr) {
                console.error('Worklog update notice/error:', updateWorklogErr.message)
              }
            }
          } catch (worklogErr) {
            console.warn('Worklog auto-sync notice:', worklogErr)
          }
        }

        await fetchData()
        setIsStatusUpdateModalOpen(false)
        setIsDetailsModalOpen(false)
        showToast(
          isCompleted
            ? `Work completed and logged to Worklogs successfully!`
            : `Work status updated to "${formData.status}"!`,
          'success'
        )
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update status'
        setModalError(msg)
        showToast(msg, 'error')
      } finally {
        setActionLoading(false)
      }
    },
    [user, fetchData, showToast]
  )

  // 4. Delete Task
  const handleDeleteTask = useCallback(async () => {
    if (!activeTask) return

    try {
      setActionLoading(true)
      setModalError(null)

      const { error: delError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', activeTask.id)

      if (delError) throw delError

      await fetchData()
      setIsDeleteModalOpen(false)
      setActiveTask(null)
      showToast(`Work "${activeTask.title}" removed successfully!`, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete work'
      setModalError(msg)
      showToast(msg, 'error')
    } finally {
      setActionLoading(false)
    }
  }, [activeTask, fetchData, showToast])

  return {
    // Auth & Permissions
    user,
    signOutUser,
    role,
    displayName,
    isSuperAdmin,
    isAdminOrSuperAdmin,
    canViewTasks,
    canCreateTask,
    canAddTask,
    canEditTask,
    canDeleteTask,
    canUpdateTaskStatus,
    permissionsLoading,
    refreshPermissions,

    // Data State
    tasks: tasksWithAssignments,
    filteredTasks,
    profiles,
    stats,
    loading,
    refreshing,
    toast,

    // Filters
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    scopeFilter,
    setScopeFilter,

    // Modals
    isAddModalOpen,
    setIsAddModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDetailsModalOpen,
    setIsDetailsModalOpen,
    isStatusUpdateModalOpen,
    setIsStatusUpdateModalOpen,
    activeTask,
    actionLoading,
    modalError,

    // Modal Triggers
    handleOpenAdd,
    handleOpenEdit,
    handleOpenDelete,
    handleOpenDetails,
    handleOpenStatusUpdate,
    setToast,

    // Operations
    fetchData,
    handleCreateTask,
    handleUpdateTask,
    handleUpdateAssignmentStatus,
    handleDeleteTask,
  }
}

export default useTasksPage
