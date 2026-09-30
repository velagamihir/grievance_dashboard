import React, { useState, useMemo } from 'react'
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  RefreshCw,
  Users,
  Layers,
  Lock,
  Search,
  X,
  Sparkles,
  Check,
} from 'lucide-react'
import { useDocumentTitle, useRolesPage } from '../hooks'
import {
  Button,
  Drawer,
  Header,
  TextInput,
  TextArea,
  Modal,
  ConfirmModal,
  ListBadge,
} from '../components'
import type {
  RolesPageProps,
  PermissionRow,
  RoleWithPermissions,
} from '../types'

export const RolesPage: React.FC<RolesPageProps> = ({
  isDark,
  onToggleTheme,
  currentPath = '/roles',
  onNavigate,
}) => {
  useDocumentTitle('Roles & Permissions | Grievance Portal')

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const {
    rolesWithPermissions,
    filteredRoles,
    permissions,
    distinctResources,
    stats,
    loading,
    refreshing,
    toast,
    searchQuery,
    setSearchQuery,
    selectedResourceFilter,
    setSelectedResourceFilter,
    isAddModalOpen,
    setIsAddModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isPermsModalOpen,
    setIsPermsModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    activeRole,
    actionLoading,
    modalError,
    handleOpenAdd,
    handleOpenEdit,
    handleOpenPermissions,
    handleOpenDelete,
    setToast,
    fetchData,
    handleCreateRole,
    handleUpdateRole,
    handleChangePermissions,
    handleDeleteRole,
    currentUserRole: role,
    canViewRoles,
    canCreateRole,
    canEditRole,
    canChangePermissions,
    canDeleteRole,
    displayName,
    user,
    signOutUser,
  } = useRolesPage()

  // Form states for Add Role Modal
  const [addForm, setAddForm] = useState({
    name: '',
    description: '',
    selectedPermIds: [] as number[],
  })

  // Form states for Edit Role Modal
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
  })

  // State for Change Permissions Modal
  const [modalSelectedPermIds, setModalSelectedPermIds] = useState<number[]>([])
  const [permSearchQuery, setPermSearchQuery] = useState('')

  // Open Add Role Modal
  const onOpenAddModal = () => {
    setAddForm({
      name: '',
      description: '',
      selectedPermIds: [],
    })
    handleOpenAdd()
  }

  // Open Edit Role Modal
  const onOpenEditModal = (r: RoleWithPermissions) => {
    setEditForm({
      name: r.name || '',
      description: r.description || '',
    })
    handleOpenEdit(r)
  }

  // Open Change Permissions Modal
  const onOpenPermsModal = (r: RoleWithPermissions) => {
    setModalSelectedPermIds(r.permissionIds || [])
    setPermSearchQuery('')
    handleOpenPermissions(r)
  }

  // Permissions grouped by resource (e.g. 'grievances', 'block_coordinators', 'users')
  const permissionsByResource = useMemo(() => {
    const map = new Map<string, PermissionRow[]>()
    permissions.forEach((p) => {
      const res = p.resource || 'general'
      const list = map.get(res) || []
      list.push(p)
      map.set(res, list)
    })
    return map
  }, [permissions])

  // Submit Add Role
  const onSubmitAddRole = (e: React.FormEvent) => {
    e.preventDefault()
    handleCreateRole({
      name: addForm.name,
      description: addForm.description,
      permissionIds: addForm.selectedPermIds,
    })
  }

  // Submit Edit Role
  const onSubmitEditRole = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeRole) return
    handleUpdateRole(activeRole.id, {
      name: editForm.name,
      description: editForm.description,
    })
  }

  // Submit Change Permissions
  const onSubmitChangePerms = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeRole) return
    handleChangePermissions(activeRole.id, modalSelectedPermIds)
  }

  // Toggle single permission in Change Permissions Modal
  const togglePermId = (id: number) => {
    setModalSelectedPermIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  // Toggle category permissions in Change Permissions Modal
  const toggleCategoryPerms = (categoryPerms: PermissionRow[]) => {
    const catIds = categoryPerms.map((p) => p.id)
    const allSelected = catIds.every((id) => modalSelectedPermIds.includes(id))

    if (allSelected) {
      // Deselect all in category
      setModalSelectedPermIds((prev) => prev.filter((id) => !catIds.includes(id)))
    } else {
      // Select all in category
      setModalSelectedPermIds((prev) => Array.from(new Set([...prev, ...catIds])))
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

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 max-w-sm sm:max-w-md z-[9999] flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
            toast.type === 'success'
              ? 'bg-green-600 text-white shadow-green-600/20'
              : toast.type === 'error'
              ? 'bg-red-600 text-white shadow-red-600/20'
              : 'bg-darkblue text-white shadow-darkblue/20 dark:bg-orange dark:text-darkblue'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : toast.type === 'error' ? (
              <ShieldAlert className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="truncate">{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="opacity-70 hover:opacity-100 ml-1 shrink-0 p-1 cursor-pointer"
            aria-label="Close toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Global Header */}
      <Header
        title="Roles & Permissions"
        subtitle="Role-Based Access Control (RBAC) Governance"
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        role={role}
        userEmail={user?.email}
        userName={displayName}
        onSignOut={() => signOutUser()}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
        {/* Banner Section */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-darkblue via-[#333d79] to-lightblue p-5 sm:p-8 text-offwhite shadow-xl shadow-darkblue/10">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-orange" />
              Security &amp; Privilege Administration
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
              Roles &amp; Permission Matrix
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-offwhite/85">
              Create new roles, assign granular permissions across grievances, coordinators, and users, and govern access levels in real-time.
            </p>
          </div>

          <div className="hidden sm:block absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
            <Shield className="w-64 h-64 text-white" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          <div className="bg-white dark:bg-[#20243a] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray/20 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray uppercase tracking-wider">
                Configured Roles
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-darkblue dark:text-offwhite mt-1">
                {stats.totalRoles}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-lightblue/15 text-lightblue dark:bg-lightblue/25">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#20243a] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray/20 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray uppercase tracking-wider">
                System Permissions
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-orange mt-1">
                {stats.totalPermissions}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-orange/15 text-orange dark:bg-orange/25">
              <KeyRound className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#20243a] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray/20 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray uppercase tracking-wider">
                Active Role Bindings
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-darkblue dark:text-offwhite mt-1">
                {stats.totalAssignedLinks}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-darkblue/15 text-darkblue dark:bg-darkblue/40 dark:text-offwhite">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#20243a] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray/20 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray uppercase tracking-wider">
                Assigned User Profiles
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {stats.totalUsers}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-green-500/15 text-green-600 dark:bg-green-500/25 dark:text-green-400">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* Roles Directory & Management Section */}
        <div className="bg-white dark:bg-[#20243a] rounded-2xl sm:rounded-3xl border border-gray/20 shadow-sm p-4 sm:p-6 md:p-8 space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray/15">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg sm:text-xl font-bold text-darkblue dark:text-offwhite leading-tight">
                  System Roles Directory
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-lightblue/15 text-lightblue dark:bg-lightblue/25">
                  {rolesWithPermissions.length} roles
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray">
                Configure role access levels, manage permission associations, and assign users
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative w-full sm:w-auto flex-1 sm:max-w-xs sm:min-w-[200px]">
                <TextInput
                  size="sm"
                  placeholder="Search role or permission..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4 text-gray" />}
                  rightIcon={
                    searchQuery ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="hover:text-darkblue dark:hover:text-offwhite cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : undefined
                  }
                />
              </div>

              {/* Resource Filter Dropdown */}
              <div className="relative flex items-center min-w-[140px]">
                <div className="absolute left-2.5 pointer-events-none text-lightblue dark:text-orange">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <select
                  value={selectedResourceFilter}
                  onChange={(e) => setSelectedResourceFilter(e.target.value)}
                  className="w-full appearance-none bg-offwhite dark:bg-[#151726] border border-gray/20 hover:border-lightblue/40 dark:hover:border-lightblue/40 rounded-xl pl-8 pr-7 py-1.5 text-xs font-semibold text-darkblue dark:text-offwhite focus:outline-none focus:ring-2 focus:ring-lightblue/25 cursor-pointer transition-all shadow-xs"
                  title="Filter by resource"
                  aria-label="Filter by resource"
                >
                  {distinctResources.map((res) => (
                    <option
                      key={res}
                      value={res}
                      className="bg-white dark:bg-[#1a1d2e] text-darkblue dark:text-offwhite font-normal capitalize"
                    >
                      {res === 'All' ? 'All Resources' : res.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 text-xs text-gray opacity-60">▾</span>
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                isLoading={refreshing}
                aria-label="Refresh roles list"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>

              {/* Add New Role Button (Permission Protected) */}
              {canCreateRole && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onOpenAddModal}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  <span className="hidden xs:inline">Add Role</span>
                  <span className="xs:hidden">Add</span>
                </Button>
              )}
            </div>
          </div>

          {/* Access Denied Warning if user cannot view roles */}
          {!canViewRoles && !loading ? (
            <div className="py-12 px-6 flex flex-col items-center justify-center text-center rounded-3xl border-2 border-dashed border-red-500/20 bg-red-500/5 space-y-3.5">
              <div className="p-4 rounded-3xl bg-red-500/10 text-red-500">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-base font-bold text-darkblue dark:text-offwhite">
                  Access Restricted
                </h4>
                <p className="text-xs sm:text-sm text-gray">
                  You do not have permission to view or manage system roles and permissions. Contact an administrator to request access.
                </p>
              </div>
            </div>
          ) : /* Roles Cards Grid */
          loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-44 rounded-2xl bg-offwhite/60 dark:bg-[#1f233a]/60 animate-pulse border border-gray/10"
                />
              ))}
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="py-12 px-6 flex flex-col items-center justify-center text-center rounded-3xl border-2 border-dashed border-gray/20 bg-white/40 dark:bg-[#20243a]/40 space-y-3.5">
              <div className="p-4 rounded-3xl bg-lightblue/10 dark:bg-lightblue/20 text-lightblue">
                <Shield className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-base font-bold text-darkblue dark:text-offwhite">
                  No Roles Found
                </h4>
                <p className="text-xs sm:text-sm text-gray">
                  {searchQuery || selectedResourceFilter !== 'All'
                    ? 'No roles match your search and filter criteria.'
                    : 'No roles have been configured in the database yet.'}
                </p>
              </div>
              {canCreateRole && (
                <Button variant="primary" size="sm" onClick={onOpenAddModal}>
                  Add New Role
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              {filteredRoles.map((roleItem) => {
                const isSuper = (roleItem.name || '').toLowerCase() === 'super_admin'
                const isBuiltinAdmin = (roleItem.name || '').toLowerCase() === 'admin'
                const isUser = (roleItem.name || '').toLowerCase() === 'user'

                return (
                  <div
                    key={roleItem.id}
                    className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray/20 p-4 sm:p-5.5 space-y-4 shadow-xs hover:shadow-md hover:border-lightblue/40 transition-all flex flex-col justify-between"
                  >
                    {/* Top Row: Icon + Role Name + Badges + Actions */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                              isSuper
                                ? 'bg-orange/15 text-orange dark:bg-orange/25'
                                : isBuiltinAdmin
                                ? 'bg-lightblue/15 text-lightblue dark:bg-lightblue/25'
                                : 'bg-green-500/15 text-green-600 dark:bg-green-500/25 dark:text-green-400'
                            }`}
                          >
                            <Shield className="w-5 h-5" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-base text-darkblue dark:text-offwhite capitalize truncate">
                                {roleItem.name.replace(/_/g, ' ')}
                              </h4>
                              {isSuper && (
                                <ListBadge variant="orange" size="sm">
                                  System Admin
                                </ListBadge>
                              )}
                              {isBuiltinAdmin && (
                                <ListBadge variant="lightblue" size="sm">
                                  Administrator
                                </ListBadge>
                              )}
                              {isUser && (
                                <ListBadge variant="neutral" size="sm">
                                  Default Citizen
                                </ListBadge>
                              )}
                            </div>
                            <p className="text-xs text-gray mt-0.5 line-clamp-1">
                              {roleItem.description || 'No description provided'}
                            </p>
                          </div>
                        </div>

                        {/* Top Action Icons (Edit / Delete) */}
                        <div className="flex items-center gap-1 shrink-0">
                          {canEditRole && (
                            <button
                              type="button"
                              onClick={() => onOpenEditModal(roleItem)}
                              className="p-1.5 rounded-lg text-gray hover:text-lightblue hover:bg-lightblue/10 transition-colors cursor-pointer"
                              title={`Edit ${roleItem.name}`}
                              aria-label={`Edit ${roleItem.name}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}

                          {!isSuper && canDeleteRole && (
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(roleItem)}
                              className="p-1.5 rounded-lg text-gray hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title={`Delete ${roleItem.name}`}
                              aria-label={`Delete ${roleItem.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Meta Tags: Users Assigned + Permission Count */}
                      <div className="flex items-center gap-2.5 text-xs text-gray flex-wrap">
                        <span className="inline-flex items-center gap-1 bg-offwhite dark:bg-[#20243a] px-2.5 py-1 rounded-lg border border-gray/10">
                          <Users className="w-3.5 h-3.5 text-lightblue" />
                          <strong>{roleItem.assignedUsersCount || 0}</strong> user(s) assigned
                        </span>

                        <span className="inline-flex items-center gap-1 bg-offwhite dark:bg-[#20243a] px-2.5 py-1 rounded-lg border border-gray/10">
                          <KeyRound className="w-3.5 h-3.5 text-orange" />
                          <strong>{roleItem.permissions.length}</strong> permissions active
                        </span>
                      </div>

                      {/* Permission Badges Preview */}
                      <div className="pt-1">
                        <p className="text-[11px] font-semibold text-gray uppercase tracking-wider mb-2">
                          Granted Permissions Preview:
                        </p>
                        {isSuper ? (
                          <div className="p-2.5 rounded-xl bg-orange/10 border border-orange/20 text-xs font-semibold text-orange flex items-center gap-2">
                            <Sparkles className="w-4 h-4 shrink-0" />
                            <span>Unrestricted super_admin access to all {permissions.length} system privileges.</span>
                          </div>
                        ) : roleItem.permissions.length === 0 ? (
                          <div className="p-2.5 rounded-xl bg-offwhite dark:bg-[#151726] border border-gray/15 text-xs text-gray italic">
                            No permissions granted yet. Click &quot;Change Permissions&quot; to assign access.
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                            {roleItem.permissions.map((perm) => (
                              <span
                                key={perm.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-offwhite dark:bg-[#20243a] border border-gray/15 text-darkblue dark:text-offwhite shadow-2xs"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-lightblue shrink-0" />
                                <span>{perm.name}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action: Manage Permissions Button */}
                    <div className="pt-3 border-t border-gray/15 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-gray font-mono">
                        role_id: #{roleItem.id}
                      </span>

                      {canChangePermissions ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenPermsModal(roleItem)}
                          leftIcon={<KeyRound className="w-3.5 h-3.5 text-orange" />}
                          className="text-xs"
                        >
                          Change Permissions
                        </Button>
                      ) : (
                        <span className="text-xs text-gray italic">Read-only view</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* ========================================== */}
      {/* 1. ADD ROLE MODAL                          */}
      {/* ========================================== */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        size="lg"
        title="Create New Role"
        subtitle="Define a custom system role and assign initial access permissions"
        icon={<Shield className="w-5 h-5 text-orange" />}
        iconBgColor="bg-orange/15 dark:bg-orange/25"
        error={modalError}
      >
        <form onSubmit={onSubmitAddRole} className="space-y-4">
          <TextInput
            label="Role Name"
            placeholder="e.g. hostel_warden, department_head, coordinator"
            helperText="Identifier used in the database (e.g. hostel_warden)"
            required
            value={addForm.name}
            onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
          />

          <TextArea
            label="Role Description"
            placeholder="Describe the jurisdiction and duties of this role..."
            rows={2}
            value={addForm.description}
            onChange={(e) => setAddForm((prev) => ({ ...prev, description: e.target.value }))}
          />

          {/* Initial Permissions Selection */}
          <div className="space-y-2 pt-2 border-t border-gray/15">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-darkblue dark:text-offwhite uppercase tracking-wider">
                Select Initial Permissions ({addForm.selectedPermIds.length} selected)
              </label>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-3 p-3 rounded-2xl bg-offwhite dark:bg-[#151726] border border-gray/20">
              {Array.from(permissionsByResource.entries()).map(([resource, permsList]) => {
                const allSelected = permsList.every((p) => addForm.selectedPermIds.includes(p.id))

                return (
                  <div key={resource} className="space-y-1.5">
                    <div className="flex items-center justify-between border-b border-gray/15 pb-1">
                      <span className="text-xs font-bold text-lightblue capitalize">
                        {resource.replace(/_/g, ' ')}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const ids = permsList.map((p) => p.id)
                          if (allSelected) {
                            setAddForm((prev) => ({
                              ...prev,
                              selectedPermIds: prev.selectedPermIds.filter((id) => !ids.includes(id)),
                            }))
                          } else {
                            setAddForm((prev) => ({
                              ...prev,
                              selectedPermIds: Array.from(new Set([...prev.selectedPermIds, ...ids])),
                            }))
                          }
                        }}
                        className="text-[11px] text-gray hover:text-darkblue dark:hover:text-offwhite font-medium"
                      >
                        {allSelected ? 'Deselect Category' : 'Select Category'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {permsList.map((p) => {
                        const isChecked = addForm.selectedPermIds.includes(p.id)
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center gap-2 p-2 rounded-xl text-xs cursor-pointer transition-colors border ${
                              isChecked
                                ? 'bg-lightblue/15 border-lightblue/30 text-darkblue dark:text-offwhite font-medium'
                                : 'bg-white dark:bg-[#20243a] border-gray/15 text-gray hover:bg-gray/5'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setAddForm((prev) => ({
                                  ...prev,
                                  selectedPermIds: isChecked
                                    ? prev.selectedPermIds.filter((id) => id !== p.id)
                                    : [...prev.selectedPermIds, p.id],
                                }))
                              }}
                              className="rounded text-lightblue focus:ring-lightblue/30 w-3.5 h-3.5"
                            />
                            <span className="truncate">{p.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-gray/15">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={actionLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={actionLoading}
              className="w-full sm:w-auto"
            >
              Save Role
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* 2. EDIT ROLE DETAILS MODAL                 */}
      {/* ========================================== */}
      {activeRole && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          size="md"
          title={`Edit Role: ${activeRole.name}`}
          subtitle="Update role display name and administrative description"
          icon={<Pencil className="w-5 h-5 text-lightblue" />}
          error={modalError}
        >
          <form onSubmit={onSubmitEditRole} className="space-y-4">
            <TextInput
              label="Role Name"
              placeholder="e.g. warden, coordinator"
              required
              value={editForm.name}
              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
            />

            <TextArea
              label="Role Description"
              placeholder="Describe this role's purpose and duties..."
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
            />

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-gray/15">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(false)}
                disabled={actionLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={actionLoading}
                className="w-full sm:w-auto"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================== */}
      {/* 3. CHANGE PERMISSIONS MODAL                */}
      {/* ========================================== */}
      {activeRole && (
        <Modal
          isOpen={isPermsModalOpen}
          onClose={() => setIsPermsModalOpen(false)}
          size="xl"
          title={`Permissions for Role: ${activeRole.name}`}
          subtitle={`Select which actions this role is authorized to perform (${modalSelectedPermIds.length} of ${permissions.length} granted)`}
          icon={<KeyRound className="w-5 h-5 text-orange" />}
          iconBgColor="bg-orange/15 dark:bg-orange/25"
          error={modalError}
        >
          <form onSubmit={onSubmitChangePerms} className="space-y-4">
            {/* Search Filter within modal */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <TextInput
                  size="sm"
                  placeholder="Filter permissions..."
                  value={permSearchQuery}
                  onChange={(e) => setPermSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-3.5 h-3.5 text-gray" />}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalSelectedPermIds(permissions.map((p) => p.id))}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-offwhite dark:bg-[#20243a] border border-gray/20 text-darkblue dark:text-offwhite hover:bg-gray/10 transition-colors"
                >
                  Grant All
                </button>
                <button
                  type="button"
                  onClick={() => setModalSelectedPermIds([])}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-offwhite dark:bg-[#20243a] border border-gray/20 text-gray hover:text-darkblue dark:hover:text-offwhite hover:bg-gray/10 transition-colors"
                >
                  Revoke All
                </button>
              </div>
            </div>

            {/* Categorized Permissions Checkbox Matrix */}
            <div className="max-h-80 overflow-y-auto space-y-4 p-3.5 rounded-2xl bg-offwhite dark:bg-[#151726] border border-gray/20">
              {Array.from(permissionsByResource.entries()).map(([resource, permsList]) => {
                const filteredPerms = permsList.filter((p) => {
                  if (!permSearchQuery.trim()) return true
                  const q = permSearchQuery.toLowerCase().trim()
                  return (
                    (p.name || '').toLowerCase().includes(q) ||
                    (p.description || '').toLowerCase().includes(q) ||
                    (p.action || '').toLowerCase().includes(q)
                  )
                })

                if (filteredPerms.length === 0) return null

                const allInCatSelected = permsList.every((p) => modalSelectedPermIds.includes(p.id))
                const someInCatSelected = permsList.some((p) => modalSelectedPermIds.includes(p.id))

                return (
                  <div key={resource} className="space-y-2">
                    {/* Category Header */}
                    <div className="flex items-center justify-between border-b border-gray/15 pb-1.5">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-lightblue" />
                        <span className="text-xs font-bold text-darkblue dark:text-offwhite capitalize">
                          {resource.replace(/_/g, ' ')} Module
                        </span>
                        <span className="text-[11px] text-gray">
                          ({permsList.filter((p) => modalSelectedPermIds.includes(p.id)).length}/{permsList.length})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleCategoryPerms(permsList)}
                        className="text-xs text-lightblue hover:underline font-medium"
                      >
                        {allInCatSelected ? 'Revoke Category' : someInCatSelected ? 'Grant Remaining' : 'Grant Category'}
                      </button>
                    </div>

                    {/* Permissions Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredPerms.map((perm) => {
                        const isGranted = modalSelectedPermIds.includes(perm.id)

                        return (
                          <div
                            key={perm.id}
                            onClick={() => togglePermId(perm.id)}
                            className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                              isGranted
                                ? 'bg-white dark:bg-[#20243a] border-lightblue/50 dark:border-lightblue/50 shadow-2xs'
                                : 'bg-white/60 dark:bg-[#1a1d2e]/60 border-gray/15 hover:border-gray/30 opacity-75'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                isGranted
                                  ? 'bg-lightblue border-lightblue text-white'
                                  : 'border-gray/30 bg-offwhite dark:bg-[#151726]'
                              }`}
                            >
                              {isGranted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-darkblue dark:text-offwhite leading-tight">
                                {perm.name}
                              </p>
                              {perm.description && (
                                <p className="text-[11px] text-gray mt-0.5 line-clamp-1">
                                  {perm.description}
                                </p>
                              )}
                              <span className="inline-block mt-1 font-mono text-[10px] text-gray/70 px-1.5 py-0.2 rounded bg-offwhite dark:bg-[#151726] border border-gray/10">
                                {perm.action}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-gray/15">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPermsModalOpen(false)}
                disabled={actionLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={actionLoading}
                className="w-full sm:w-auto"
              >
                Save Permissions
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================== */}
      {/* 4. DELETE ROLE CONFIRMATION MODAL          */}
      {/* ========================================== */}
      {activeRole && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteRole}
          title={`Delete Role "${activeRole.name}"?`}
          subtitle="This action will revoke this role from all assigned users and remove all permissions."
          confirmText="Delete Role"
          isLoading={actionLoading}
          details={
            <div className="space-y-1">
              <p className="font-semibold text-darkblue dark:text-offwhite">
                Role: <span className="capitalize">{activeRole.name.replace(/_/g, ' ')}</span>
              </p>
              <p className="text-gray">
                Permissions assigned: <strong>{activeRole.permissions.length}</strong>
              </p>
              <p className="text-gray">
                Users currently holding this role: <strong>{activeRole.assignedUsersCount || 0}</strong>
              </p>
            </div>
          }
        />
      )}
    </div>
  )
}

export default RolesPage
