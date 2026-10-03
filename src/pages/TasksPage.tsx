import { useState, useMemo } from 'react'
import {
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  X,
  RefreshCw,
  Calendar,
  Users,
  Edit3,
  Trash2,
  Eye,
  ListTodo,
  Sparkles,
} from 'lucide-react'
import { Header } from '../components/Header'
import { Drawer } from '../components/Drawer'
import { Button } from '../components/Buttons'
import { Modal } from '../components/Modal'
import { useTasksPage } from '../hooks/useTasksPage'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type {
  TasksPageProps,
  CreateTaskFormData,
  UpdateTaskFormData,
  UpdateAssignmentStatusFormData,
  TaskWithAssignments,
} from '../types'

const PRIORITY_COLORS = {
  Low: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  Medium: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  High: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  Urgent: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
}

const STATUS_COLORS = {
  Pending: 'bg-gray/15 text-gray dark:text-gray/80 border-gray/30',
  'In Progress': 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  Completed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  Cancelled: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
}

export const TasksPage = ({
  isDark,
  onToggleTheme,
  currentPath = '/tasks',
  onNavigate,
}: TasksPageProps) => {
  useDocumentTitle('Work Assignments | Grievance Portal')

  const {
    user,
    signOutUser,
    role,
    displayName,
    canCreateTask,
    canEditTask,
    canDeleteTask,
    canUpdateTaskStatus,
    tasks,
    filteredTasks,
    profiles,
    roles,
    stats,
    loading,
    refreshing,
    toast,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    scopeFilter,
    setScopeFilter,
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
    handleOpenAdd,
    handleOpenEdit,
    handleOpenDelete,
    handleOpenDetails,
    handleOpenStatusUpdate,
    fetchData,
    handleCreateTask,
    handleUpdateTask,
    handleUpdateAssignmentStatus,
    handleDeleteTask,
  } = useTasksPage()

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Add Modal Form State
  const [addForm, setAddForm] = useState<CreateTaskFormData>({
    title: '',
    description: '',
    priority: 'Medium',
    due_date: '',
    assigned_to_all: true,
    assigned_role: null,
    assigned_uids: [],
  })

  // Edit Modal Form State
  const [editForm, setEditForm] = useState<UpdateTaskFormData>({
    id: 0,
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Pending',
    due_date: '',
    assigned_to_all: false,
    assigned_role: null,
    assigned_uids: [],
  })

  // Status Update Modal Form State
  const [statusForm, setStatusForm] = useState<UpdateAssignmentStatusFormData>({
    taskId: 0,
    status: 'In Progress',
    notes: '',
  })

  const [memberSearchQuery, setMemberSearchQuery] = useState('')

  // Member counts per role for quick badges
  const roleCounts = useMemo(() => {
    const counts = new Map<string, number>()
    profiles.forEach((p) => {
      const r = (p.role || 'user').toLowerCase().trim()
      counts.set(r, (counts.get(r) || 0) + 1)
    })
    return counts
  }, [profiles])

  // Helper to assign task to all members of a chosen role
  const handleSelectRoleScope = (selectedRole: string, isEdit: boolean) => {
    if (isEdit) {
      if (selectedRole === 'all') {
        setEditForm((prev) => ({
          ...prev,
          assigned_to_all: true,
          assigned_role: null,
          assigned_uids: [],
        }))
      } else if (selectedRole === 'custom') {
        setEditForm((prev) => ({
          ...prev,
          assigned_to_all: false,
          assigned_role: null,
        }))
      } else {
        const uids = profiles
          .filter((p) => (p.role || '').toLowerCase().trim() === selectedRole.toLowerCase().trim())
          .map((p) => p.firebase_uid)
        setEditForm((prev) => ({
          ...prev,
          assigned_to_all: false,
          assigned_role: selectedRole,
          assigned_uids: uids,
        }))
      }
    } else {
      if (selectedRole === 'all') {
        setAddForm((prev) => ({
          ...prev,
          assigned_to_all: true,
          assigned_role: null,
          assigned_uids: [],
        }))
      } else if (selectedRole === 'custom') {
        setAddForm((prev) => ({
          ...prev,
          assigned_to_all: false,
          assigned_role: null,
        }))
      } else {
        const uids = profiles
          .filter((p) => (p.role || '').toLowerCase().trim() === selectedRole.toLowerCase().trim())
          .map((p) => p.firebase_uid)
        setAddForm((prev) => ({
          ...prev,
          assigned_to_all: false,
          assigned_role: selectedRole,
          assigned_uids: uids,
        }))
      }
    }
  }

  // Filtered members for member assignment selector
  const filteredProfiles = useMemo(() => {
    if (!memberSearchQuery.trim()) return profiles
    const q = memberSearchQuery.toLowerCase().trim()
    return profiles.filter((p) => {
      const name = (p.display_name || '').toLowerCase()
      const email = (p.email || '').toLowerCase()
      const roleName = (p.role || '').toLowerCase()
      return name.includes(q) || email.includes(q) || roleName.includes(q)
    })
  }, [profiles, memberSearchQuery])

  // Open Create Modal Initializer
  const onOpenAddModal = () => {
    setAddForm({
      title: '',
      description: '',
      priority: 'Medium',
      due_date: '',
      assigned_to_all: true,
      assigned_role: null,
      assigned_uids: [],
    })
    setMemberSearchQuery('')
    handleOpenAdd()
  }

  // Open Edit Modal Initializer
  const onOpenEditModal = (task: TaskWithAssignments) => {
    setEditForm({
      id: task.id,
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      assigned_to_all: task.assigned_to_all,
      assigned_role: null,
      assigned_uids: task.assignments.map((a) => a.user_uid),
    })
    setMemberSearchQuery('')
    handleOpenEdit(task)
  }

  // Open Quick Status Update Modal Initializer
  const onOpenStatusModal = (
    task: TaskWithAssignments,
    targetUserUid?: string,
    initialStatus?: 'Pending' | 'In Progress' | 'Completed',
    initialNotes?: string
  ) => {
    const targetUid = targetUserUid || user?.uid || ''
    const targetAssign = task.assignments.find((a) => a.user_uid === targetUid)
    setStatusForm({
      taskId: task.id,
      userUid: targetUid,
      status: initialStatus || targetAssign?.status || 'In Progress',
      notes: initialNotes !== undefined ? initialNotes : targetAssign?.notes || '',
    })
    handleOpenStatusUpdate(task)
  }

  // Toggle selection for assigned UID
  const toggleAssignUid = (uid: string, isEdit = false) => {
    if (isEdit) {
      setEditForm((prev) => {
        const exists = prev.assigned_uids.includes(uid)
        return {
          ...prev,
          assigned_uids: exists
            ? prev.assigned_uids.filter((id) => id !== uid)
            : [...prev.assigned_uids, uid],
        }
      })
    } else {
      setAddForm((prev) => {
        const exists = prev.assigned_uids.includes(uid)
        return {
          ...prev,
          assigned_uids: exists
            ? prev.assigned_uids.filter((id) => id !== uid)
            : [...prev.assigned_uids, uid],
        }
      })
    }
  }

  // Select all or none
  const toggleSelectAllMembers = (isEdit = false) => {
    const allUids = profiles.map((p) => p.firebase_uid)
    if (isEdit) {
      setEditForm((prev) => ({
        ...prev,
        assigned_uids: prev.assigned_uids.length === allUids.length ? [] : allUids,
      }))
    } else {
      setAddForm((prev) => ({
        ...prev,
        assigned_uids: prev.assigned_uids.length === allUids.length ? [] : allUids,
      }))
    }
  }

  return (
    <div className="min-h-screen bg-offwhite dark:bg-[#151726] text-darkblue dark:text-offwhite transition-colors duration-200">
      {/* Navigation Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentPath={currentPath}
        onNavigate={onNavigate}
      />

      {/* Global Header */}
      <Header
        title="Work Assignments"
        subtitle="Team Work Allocation & Progress Tracking Console"
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        role={role}
        userEmail={user?.email}
        userName={displayName}
        onSignOut={() => signOutUser()}
      />

      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-semibold border ${
              toast.type === 'success'
                ? 'bg-emerald-500 text-white border-emerald-600'
                : toast.type === 'error'
                  ? 'bg-rose-500 text-white border-rose-600'
                  : 'bg-blue-600 text-white border-blue-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-darkblue via-[#333b70] to-lightblue p-5 sm:p-8 text-offwhite shadow-xl shadow-darkblue/10">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-orange" />
              Collaborative Team Tasking
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
              Work & Assignment Management
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-offwhite/85">
              Create, distribute, and track operational assignments for all or selected council members with real-time status visibility.
            </p>
          </div>

          <div className="hidden sm:block absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
            <ListTodo className="w-64 h-64 text-white" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {stats.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="bg-white dark:bg-[#20243a] p-4 sm:p-5 rounded-2xl border border-gray/15 dark:border-gray/10 shadow-xs hover:shadow-md transition-shadow space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-sm`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-darkblue dark:text-offwhite">
                    {item.count}
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-darkblue dark:text-offwhite">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-gray mt-0.5">{item.change}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Action Controls & Filter Bar */}
        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray/15 dark:border-gray/10 p-4 space-y-4 shadow-xs">
          {/* Top Row: Search & Scope Filter Tabs & Create Button */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Scope Filter Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-offwhite/70 dark:bg-[#151726]/70 border border-gray/15 self-start">
              <button
                type="button"
                onClick={() => setScopeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  scopeFilter === 'all'
                    ? 'bg-darkblue text-offwhite dark:bg-orange dark:text-darkblue shadow-xs'
                    : 'text-gray hover:text-darkblue dark:hover:text-offwhite'
                }`}
              >
                All Works ({tasks.length})
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('assigned_to_me')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  scopeFilter === 'assigned_to_me'
                    ? 'bg-darkblue text-offwhite dark:bg-orange dark:text-darkblue shadow-xs'
                    : 'text-gray hover:text-darkblue dark:hover:text-offwhite'
                }`}
              >
                Assigned to Me
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchData()}
                isLoading={refreshing}
                leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
                className="text-xs font-medium"
              >
                Refresh
              </Button>

              {canCreateTask && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onOpenAddModal}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="text-xs font-semibold shadow-sm"
                >
                  Create Work Assignment
                </Button>
              )}
            </div>
          </div>

          {/* Bottom Row: Search, Status Filter & Priority Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t border-gray/10">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search works by title, description, or assigned member..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-gray/20 dark:border-gray/15 bg-offwhite/50 dark:bg-[#151726]/60 text-darkblue dark:text-offwhite placeholder:text-gray focus:outline-none focus:ring-2 focus:ring-lightblue/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray hover:text-darkblue dark:hover:text-offwhite"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray shrink-0 hidden sm:inline">
                Status:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray/20 dark:border-gray/15 bg-offwhite/50 dark:bg-[#151726]/60 text-xs sm:text-sm font-semibold text-darkblue dark:text-offwhite focus:outline-none focus:ring-2 focus:ring-lightblue/30 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray shrink-0 hidden sm:inline">
                Priority:
              </span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray/20 dark:border-gray/15 bg-offwhite/50 dark:bg-[#151726]/60 text-xs sm:text-sm font-semibold text-darkblue dark:text-offwhite focus:outline-none focus:ring-2 focus:ring-lightblue/30 cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Works List / Cards */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray/15">
            <RefreshCw className="w-8 h-8 text-lightblue animate-spin" />
            <p className="text-sm font-medium text-gray">Loading work assignments...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray/15 space-y-3 p-6">
            <div className="w-12 h-12 rounded-full bg-lightblue/10 text-lightblue flex items-center justify-center mx-auto">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-darkblue dark:text-offwhite">
              No Work Assignments Found
            </h3>
            <p className="text-xs sm:text-sm text-gray max-w-md mx-auto">
              {searchQuery || statusFilter !== 'All' || priorityFilter !== 'All' || scopeFilter !== 'all'
                ? 'No assignments match your current search and filter settings. Try adjusting your filters.'
                : 'There are no active work assignments. Create a work assignment to distribute tasks to members.'}
            </p>
            {canCreateTask && (
              <Button variant="primary" size="sm" onClick={onOpenAddModal} className="mt-2">
                Create First Work
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredTasks.map((task) => {
              const isAssigned =
                task.assigned_to_all || task.assignments.some((a) => a.user_uid === user?.uid)
              const priorityClass =
                PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.Medium
              const statusClass =
                STATUS_COLORS[task.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.Pending

              const completionPct =
                task.totalAssignedCount > 0
                  ? Math.round((task.completedCount / task.totalAssignedCount) * 100)
                  : task.status === 'Completed'
                    ? 100
                    : 0

              return (
                <div
                  key={task.id}
                  className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray/15 dark:border-gray/10 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  {/* Top Section: Badges & Title */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${priorityClass}`}
                        >
                          {task.priority} Priority
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${statusClass}`}
                        >
                          {task.status}
                        </span>
                      </div>

                      {task.due_date && (
                        <div className="flex items-center gap-1 text-[11px] text-gray font-medium">
                          <Calendar className="w-3 h-3 text-lightblue" />
                          <span>{new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-darkblue dark:text-offwhite leading-snug group-hover:text-lightblue transition-colors line-clamp-2">
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-xs text-gray dark:text-gray/80 line-clamp-3 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Middle Section: Assignment Status & Progress */}
                  <div className="space-y-2.5 pt-3 border-t border-gray/10 text-xs">
                    <div className="flex items-center justify-between text-gray">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-lightblue" />
                        <span className="font-medium">
                          {task.assigned_to_all
                            ? 'All Members'
                            : `${task.totalAssignedCount} Assigned`}
                        </span>
                      </div>
                      <span className="font-semibold text-darkblue dark:text-offwhite">
                        {task.completedCount}/{task.totalAssignedCount} done ({completionPct}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-gray/15 dark:bg-gray/25 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          completionPct === 100
                            ? 'bg-emerald-500'
                            : completionPct > 0
                              ? 'bg-lightblue'
                              : 'bg-gray/30'
                        }`}
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>

                    {/* Assignee Avatar Pile */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {task.assignments.slice(0, 4).map((a) => {
                          const name = a.userProfile?.display_name || a.userProfile?.email || 'U'
                          const isDone = a.status === 'Completed'
                          return (
                            <div
                              key={a.id}
                              title={`${name} (${a.status})`}
                              className={`w-6 h-6 rounded-full border-2 border-white dark:border-[#1a1d2e] flex items-center justify-center text-[9px] font-bold uppercase ${
                                isDone
                                  ? 'bg-emerald-500 text-white'
                                  : a.status === 'In Progress'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-lightblue/20 text-lightblue'
                              }`}
                            >
                              {name.charAt(0)}
                            </div>
                          )
                        })}
                        {task.assignments.length > 4 && (
                          <div className="w-6 h-6 rounded-full border-2 border-white dark:border-[#1a1d2e] bg-gray/20 text-gray flex items-center justify-center text-[9px] font-bold">
                            +{task.assignments.length - 4}
                          </div>
                        )}
                      </div>

                      {/* My Status Badge if assigned */}
                      {task.myAssignment && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            task.myAssignment.status === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : task.myAssignment.status === 'In Progress'
                                ? 'bg-amber-500/10 text-amber-600'
                                : 'bg-gray/15 text-gray'
                          }`}
                        >
                          My Status: {task.myAssignment.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="pt-2 flex items-center justify-between gap-1.5 border-t border-gray/10">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDetails(task)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      className="text-xs px-2.5 font-medium"
                    >
                      Details
                    </Button>

                    <div className="flex items-center gap-1">
                      {isAssigned && canUpdateTaskStatus && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenStatusModal(task)}
                          className="text-xs px-2.5 font-semibold text-lightblue border-lightblue/30 hover:bg-lightblue/10"
                        >
                          Update Status
                        </Button>
                      )}

                      {canEditTask && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenEditModal(task)}
                          className="p-1.5 text-gray hover:text-darkblue dark:hover:text-offwhite"
                          title="Edit work assignment"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      {canDeleteTask && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDelete(task)}
                          className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          title="Delete work assignment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* 1. CREATE WORK ASSIGNMENT MODAL                           */}
      {/* ========================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !actionLoading && setIsAddModalOpen(false)}
        title="Create Work Assignment"
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleCreateTask(addForm)
          }}
          className="space-y-4"
        >
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-darkblue dark:text-offwhite mb-1.5">
              Work Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={addForm.title}
              onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
              placeholder="e.g., Audit Hostel Block B sanitation & submit report"
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray/20 dark:border-gray/15 bg-offwhite/50 dark:bg-[#151726]/60 text-darkblue dark:text-offwhite focus:outline-none focus:ring-2 focus:ring-lightblue/30"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-darkblue dark:text-offwhite mb-1.5">
              Description / Instructions
            </label>
            <textarea
              rows={3}
              value={addForm.description}
              onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
              placeholder="Provide detailed instructions, action points, or submission requirements..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray/20 dark:border-gray/15 bg-offwhite/50 dark:bg-[#151726]/60 text-darkblue dark:text-offwhite focus:outline-none focus:ring-2 focus:ring-lightblue/30 resize-none"
            />
          </div>

          {/* Priority & Due Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-darkblue dark:text-offwhite mb-1.5">
                Priority
              </label>
              <select
                value={addForm.priority}
                onChange={(e) =>
                  setAddForm({
                    ...addForm,
                    priority: e.target.value as CreateTaskFormData['priority'],
                  })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray/20 dark:border-gray/15 bg-offwhite/50 dark:bg-[#151726]/60 text-darkblue dark:text-offwhite focus:outline-none focus:ring-2 focus:ring-lightblue/30 cursor-pointer"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Urgent">Urgent Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-darkblue dark:text-offwhite mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={addForm.due_date || ''}
                onChange={(e) => setAddForm({ ...addForm, due_date: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray/20 dark:border-gray/15 bg-offwhite/50 dark:bg-[#151726]/60 text-darkblue dark:text-offwhite focus:outline-none focus:ring-2 focus:ring-lightblue/30"
              />
            </div>
          </div>

          {/* Member Assignment Section */}
          <div className="space-y-3 pt-2 border-t border-gray/10">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-darkblue dark:text-offwhite">
                Member Assignment Allocation <span className="text-rose-500">*</span>
              </label>

              {/* Assign to All Toggle */}
              <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={addForm.assigned_to_all}
                  onChange={(e) =>
                    setAddForm({
                      ...addForm,
                      assigned_to_all: e.target.checked,
                      assigned_role: null,
                      assigned_uids: e.target.checked ? [] : addForm.assigned_uids,
                    })
                  }
                  className="rounded border-gray/30 text-lightblue focus:ring-lightblue w-4 h-4"
                />
                <span>Assign to All Members ({profiles.length})</span>
              </label>
            </div>

            {/* Quick Role Selection Buttons */}
            <div className="bg-offwhite/70 dark:bg-[#151726]/60 p-3 rounded-xl border border-gray/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-darkblue dark:text-offwhite uppercase tracking-wider">
                  Quick Assign by Role:
                </span>
                {addForm.assigned_role && (
                  <span className="text-[11px] text-orange font-bold">
                    Target Role: <strong className="capitalize">{addForm.assigned_role}</strong>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSelectRoleScope('all', false)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    addForm.assigned_to_all
                      ? 'bg-lightblue text-white border-lightblue shadow-xs'
                      : 'bg-white dark:bg-[#1a1d2e] border-gray/20 text-gray hover:bg-gray/5'
                  }`}
                >
                  All Members ({profiles.length})
                </button>
                {(roles || []).map((r: any) => {
                  const rName = r.name || ''
                  const count = roleCounts.get(rName.toLowerCase().trim()) || 0
                  const isSelected =
                    !addForm.assigned_to_all &&
                    addForm.assigned_role?.toLowerCase().trim() === rName.toLowerCase().trim()

                  return (
                    <button
                      key={r.id || rName}
                      type="button"
                      onClick={() => handleSelectRoleScope(rName, false)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all capitalize flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-orange text-white border-orange shadow-xs'
                          : 'bg-white dark:bg-[#1a1d2e] border-gray/20 text-gray hover:bg-gray/5'
                      }`}
                    >
                      <span>{rName}</span>
                      <span
                        className={`text-[10px] px-1 py-0.2 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-gray/10 text-gray'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom Member Selector if not assigned to all */}
            {!addForm.assigned_to_all && (
              <div className="space-y-2 bg-offwhite/50 dark:bg-[#151726]/40 p-3 rounded-xl border border-gray/15">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-gray absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      placeholder="Filter members by name or email..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray/20 dark:border-gray/15 bg-white dark:bg-[#1a1d2e] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSelectAllMembers(false)}
                    className="text-xs font-semibold text-lightblue hover:underline whitespace-nowrap"
                  >
                    {addForm.assigned_uids.length === profiles.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                  {filteredProfiles.length === 0 ? (
                    <p className="text-xs text-gray text-center py-2">No members match search.</p>
                  ) : (
                    filteredProfiles.map((p) => {
                      const isSelected = addForm.assigned_uids.includes(p.firebase_uid)
                      return (
                        <label
                          key={p.firebase_uid}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-lightblue/10 border-lightblue/40 text-darkblue dark:text-offwhite font-medium'
                              : 'bg-white dark:bg-[#1a1d2e] border-gray/10 text-gray hover:bg-gray/5'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAssignUid(p.firebase_uid, false)}
                              className="rounded border-gray/30 text-lightblue focus:ring-lightblue w-3.5 h-3.5"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-darkblue dark:text-offwhite truncate">
                                {p.display_name || p.email || 'Unnamed User'}
                              </p>
                              {p.display_name && p.email && (
                                <p className="text-[10px] text-gray truncate">{p.email}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-gray/10 capitalize font-medium shrink-0">
                            {p.role}
                          </span>
                        </label>
                      )
                    })
                  )}
                </div>
                <p className="text-[11px] text-gray">
                  Selected: {addForm.assigned_uids.length} of {profiles.length} members
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray/10">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={actionLoading}>
              Create & Assign Work
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* 2. EDIT WORK ASSIGNMENT MODAL                             */}
      {/* ========================================================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !actionLoading && setIsEditModalOpen(false)}
        title="Edit Work Assignment"
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleUpdateTask(editForm)
          }}
          className="space-y-4"
        >
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-darkblue dark:text-offwhite mb-1.5">
              Work Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray/20 dark:border-gray/15 bg-offwhite/50 dark:bg-[#151726]/60 text-darkblue dark:text-offwhite focus:outline-none focus:ring-2 focus:ring-lightblue/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-darkblue dark:text-offwhite mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray/20 dark:border-gray/15 bg-offwhite/50 dark:bg-[#151726]/60 text-darkblue dark:text-offwhite focus:outline-none focus:ring-2 focus:ring-lightblue/30 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-darkblue dark:text-offwhite mb-1.5">
                Priority
              </label>
              <select
                value={editForm.priority}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    priority: e.target.value as UpdateTaskFormData['priority'],
                  })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray/20 dark:border-gray/15 bg-offwhite/50 dark:bg-[#151726]/60 text-darkblue dark:text-offwhite focus:outline-none focus:ring-2 focus:ring-lightblue/30 cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-darkblue dark:text-offwhite mb-1.5">
                Overall Status
              </label>
              <select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    status: e.target.value as UpdateTaskFormData['status'],
                  })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray/20 dark:border-gray/15 bg-offwhite/50 dark:bg-[#151726]/60 text-darkblue dark:text-offwhite focus:outline-none focus:ring-2 focus:ring-lightblue/30 cursor-pointer"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-darkblue dark:text-offwhite mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={editForm.due_date || ''}
                onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray/20 dark:border-gray/15 bg-offwhite/50 dark:bg-[#151726]/60 text-darkblue dark:text-offwhite focus:outline-none focus:ring-2 focus:ring-lightblue/30"
              />
            </div>
          </div>

          {/* Member Assignment Section */}
          <div className="space-y-3 pt-2 border-t border-gray/10">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-darkblue dark:text-offwhite">
                Assigned Members
              </label>

              <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editForm.assigned_to_all}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      assigned_to_all: e.target.checked,
                      assigned_role: null,
                      assigned_uids: e.target.checked ? [] : editForm.assigned_uids,
                    })
                  }
                  className="rounded border-gray/30 text-lightblue focus:ring-lightblue w-4 h-4"
                />
                <span>Assign to All Members ({profiles.length})</span>
              </label>
            </div>

            {/* Quick Role Selection Buttons */}
            <div className="bg-offwhite/70 dark:bg-[#151726]/60 p-3 rounded-xl border border-gray/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-darkblue dark:text-offwhite uppercase tracking-wider">
                  Quick Assign by Role:
                </span>
                {editForm.assigned_role && (
                  <span className="text-[11px] text-orange font-bold">
                    Target Role: <strong className="capitalize">{editForm.assigned_role}</strong>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSelectRoleScope('all', true)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    editForm.assigned_to_all
                      ? 'bg-lightblue text-white border-lightblue shadow-xs'
                      : 'bg-white dark:bg-[#1a1d2e] border-gray/20 text-gray hover:bg-gray/5'
                  }`}
                >
                  All Members ({profiles.length})
                </button>
                {(roles || []).map((r: any) => {
                  const rName = r.name || ''
                  const count = roleCounts.get(rName.toLowerCase().trim()) || 0
                  const isSelected =
                    !editForm.assigned_to_all &&
                    editForm.assigned_role?.toLowerCase().trim() === rName.toLowerCase().trim()

                  return (
                    <button
                      key={r.id || rName}
                      type="button"
                      onClick={() => handleSelectRoleScope(rName, true)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all capitalize flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-orange text-white border-orange shadow-xs'
                          : 'bg-white dark:bg-[#1a1d2e] border-gray/20 text-gray hover:bg-gray/5'
                      }`}
                    >
                      <span>{rName}</span>
                      <span
                        className={`text-[10px] px-1 py-0.2 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-gray/10 text-gray'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {!editForm.assigned_to_all && (
              <div className="space-y-2 bg-offwhite/50 dark:bg-[#151726]/40 p-3 rounded-xl border border-gray/15">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-gray absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      placeholder="Filter members..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray/20 dark:border-gray/15 bg-white dark:bg-[#1a1d2e] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSelectAllMembers(true)}
                    className="text-xs font-semibold text-lightblue hover:underline"
                  >
                    {editForm.assigned_uids.length === profiles.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                  {filteredProfiles.map((p) => {
                    const isSelected = editForm.assigned_uids.includes(p.firebase_uid)
                    return (
                      <label
                        key={p.firebase_uid}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-lightblue/10 border-lightblue/40 text-darkblue dark:text-offwhite font-medium'
                            : 'bg-white dark:bg-[#1a1d2e] border-gray/10 text-gray hover:bg-gray/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAssignUid(p.firebase_uid, true)}
                            className="rounded border-gray/30 text-lightblue focus:ring-lightblue w-3.5 h-3.5"
                          />
                          <p className="font-semibold text-darkblue dark:text-offwhite truncate">
                            {p.display_name || p.email || 'Unnamed User'}
                          </p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-gray/10 capitalize shrink-0">
                          {p.role}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray/10">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={actionLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* 3. WORK DETAILS & PROGRESS ROSTER MODAL                   */}
      {/* ========================================================= */}
      {activeTask && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title="Work Assignment Details"
          size="lg"
        >
          <div className="space-y-4">
            {/* Header info */}
            <div className="space-y-2 pb-3 border-b border-gray/10">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${
                    PRIORITY_COLORS[activeTask.priority as keyof typeof PRIORITY_COLORS] ||
                    PRIORITY_COLORS.Medium
                  }`}
                >
                  {activeTask.priority} Priority
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${
                    STATUS_COLORS[activeTask.status as keyof typeof STATUS_COLORS] ||
                    STATUS_COLORS.Pending
                  }`}
                >
                  {activeTask.status}
                </span>
                {activeTask.due_date && (
                  <span className="text-xs text-gray flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-lightblue" />
                    Due: {new Date(activeTask.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-darkblue dark:text-offwhite">
                {activeTask.title}
              </h3>

              {activeTask.description && (
                <p className="text-xs sm:text-sm text-gray dark:text-gray/80 leading-relaxed bg-offwhite/50 dark:bg-[#151726]/40 p-3 rounded-xl border border-gray/10">
                  {activeTask.description}
                </p>
              )}

              <div className="text-[11px] text-gray flex items-center gap-4 pt-1">
                <span>
                  Created:{' '}
                  {new Date(activeTask.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Assigned Members Roster */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray">
                  Assigned Members Roster ({activeTask.completedCount}/{activeTask.totalAssignedCount} Completed)
                </h4>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {activeTask.assignments.map((a) => {
                  const name = a.userProfile?.display_name || a.userProfile?.email || 'User'
                  const isCurrent = user?.uid === a.user_uid
                  const canManageMemberStatus = isCurrent || canUpdateTaskStatus || canEditTask
                  return (
                    <div
                      key={a.id !== -1 ? a.id : `synthetic-${a.user_uid}`}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-lightblue/5 border-lightblue/30 dark:bg-lightblue/10'
                          : 'bg-white dark:bg-[#1a1d2e] border-gray/15'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-lightblue/20 text-lightblue flex items-center justify-center text-xs font-bold uppercase shrink-0">
                          {name.charAt(0)}
                        </div>
                        <div className="min-w-0 text-xs">
                          <p className="font-semibold text-darkblue dark:text-offwhite truncate">
                            {name} {isCurrent && <span className="text-lightblue">(You)</span>}
                          </p>
                          {a.notes && (
                            <p className="text-[11px] text-gray italic truncate mt-0.5">
                              "{a.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            STATUS_COLORS[a.status as keyof typeof STATUS_COLORS] ||
                            STATUS_COLORS.Pending
                          }`}
                        >
                          {a.status}
                        </span>

                        {canManageMemberStatus && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsDetailsModalOpen(false)
                              onOpenStatusModal(activeTask, a.user_uid, a.status, a.notes || '')
                            }}
                            className="text-[11px] px-2 py-1 h-7 font-semibold"
                          >
                            Update
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="pt-3 flex justify-end border-t border-gray/10">
              <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* 4. UPDATE MY ASSIGNMENT STATUS MODAL                      */}
      {/* ========================================================= */}
      {activeTask && (
        <Modal
          isOpen={isStatusUpdateModalOpen}
          onClose={() => !actionLoading && setIsStatusUpdateModalOpen(false)}
          title="Update Work Progress"
          size="md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleUpdateAssignmentStatus(statusForm)
            }}
            className="space-y-4"
          >
            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray uppercase tracking-wider mb-0.5">
                Work Assignment
              </h4>
              <p className="text-sm font-bold text-darkblue dark:text-offwhite">
                {activeTask.title}
              </p>
              {statusForm.userUid && (
                <p className="text-xs font-semibold text-lightblue">
                  Target Member:{' '}
                  {profiles.find((p) => p.firebase_uid === statusForm.userUid)?.display_name ||
                    profiles.find((p) => p.firebase_uid === statusForm.userUid)?.email ||
                    (statusForm.userUid === user?.uid ? 'You' : statusForm.userUid)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-darkblue dark:text-offwhite mb-1.5">
                Execution Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={statusForm.status}
                onChange={(e) =>
                  setStatusForm({
                    ...statusForm,
                    status: e.target.value as UpdateAssignmentStatusFormData['status'],
                  })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray/20 dark:border-gray/15 bg-offwhite/50 dark:bg-[#151726]/60 text-darkblue dark:text-offwhite focus:outline-none focus:ring-2 focus:ring-lightblue/30 cursor-pointer"
              >
                <option value="Pending">Pending (Not Started)</option>
                <option value="In Progress">In Progress (Currently Working)</option>
                <option value="Completed">Completed (Work Finished)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-darkblue dark:text-offwhite mb-1.5">
                Progress Notes / Completion Remarks
              </label>
              <textarea
                rows={3}
                value={statusForm.notes || ''}
                onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                placeholder="Add brief notes regarding your progress or findings..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray/20 dark:border-gray/15 bg-offwhite/50 dark:bg-[#151726]/60 text-darkblue dark:text-offwhite focus:outline-none focus:ring-2 focus:ring-lightblue/30 resize-none"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray/10">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsStatusUpdateModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={actionLoading}>
                Save Progress
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* 5. DELETE WORK CONFIRMATION MODAL                         */}
      {/* ========================================================= */}
      {activeTask && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => !actionLoading && setIsDeleteModalOpen(false)}
          title="Delete Work Assignment"
          size="md"
        >
          <div className="space-y-4">
            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <p className="text-xs sm:text-sm text-gray">
              Are you sure you want to delete this work assignment?
            </p>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 space-y-1">
              <p className="font-bold">{activeTask.title}</p>
              <p>This will remove the work and all member progress records permanently.</p>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray/10">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteTask}
                isLoading={actionLoading}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                className="bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500/30"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default TasksPage
