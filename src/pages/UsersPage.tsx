import React, { useState } from 'react'
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  RefreshCw,
  Search,
  X,
  Shield,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
} from 'lucide-react'
import { useDocumentTitle, useUsersPage } from '../hooks'
import {
  Button,
  Drawer,
  Header,
  TextInput,
  Modal,
  ConfirmModal,
  ListBadge,
} from '../components'
import type {
  UsersPageProps,
  UserItem,
} from '../types'

export const UsersPage: React.FC<UsersPageProps> = ({
  isDark,
  onToggleTheme,
  currentPath = '/users',
  onNavigate,
}) => {
  useDocumentTitle('Users Management | Grievance Portal')

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [copiedUid, setCopiedUid] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    usersList,
    filteredUsers,
    roles,
    stats,
    loading,
    refreshing,
    toast,
    searchQuery,
    setSearchQuery,
    selectedRoleFilter,
    setSelectedRoleFilter,
    isAddModalOpen,
    setIsAddModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    activeUser,
    actionLoading,
    modalError,
    handleOpenAdd,
    handleOpenEdit,
    handleOpenDelete,
    setToast,
    fetchData,
    handleCreateUser,
    handleUpdateUserRole,
    handleDeleteUser,
    currentUserRole: role,
    canViewUsers,
    canCreateUser,
    canEditUser,
    canDeleteUser,
    currentAuthUser,
    signOutUser,
  } = useUsersPage()

  // Form states for Add User Modal
  const [addForm, setAddForm] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'user',
  })

  // Form states for Edit User Modal
  const [editRoleForm, setEditRoleForm] = useState({
    email: '',
    displayName: '',
    role: 'user',
  })

  // Open Add User Modal
  const onOpenAddModal = () => {
    setAddForm({
      email: '',
      password: '',
      displayName: '',
      role: roles.length > 0 ? roles[0].name : 'user',
    })
    setShowPassword(false)
    handleOpenAdd()
  }

  // Open Edit User Modal
  const onOpenEditModal = (u: UserItem) => {
    setEditRoleForm({
      email: u.email.endsWith('@firebase.auth') ? '' : u.email,
      displayName: u.displayName || '',
      role: u.role,
    })
    handleOpenEdit(u)
  }

  // Copy UID helper
  const handleCopyUid = (uid: string) => {
    navigator.clipboard.writeText(uid)
    setCopiedUid(uid)
    setTimeout(() => setCopiedUid(null), 2000)
  }

  // Submit Add User
  const onSubmitAddUser = (e: React.FormEvent) => {
    e.preventDefault()
    handleCreateUser({
      email: addForm.email,
      password: addForm.password,
      displayName: addForm.displayName,
      role: addForm.role,
    })
  }

  // Submit Edit Role & Profile
  const onSubmitEditRole = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeUser) return
    handleUpdateUserRole({
      firebase_uid: activeUser.firebase_uid,
      role: editRoleForm.role,
      email: editRoleForm.email.trim() || undefined,
      displayName: editRoleForm.displayName.trim() || undefined,
    })
  }

  // Helper for role badge variant & styling
  const getRoleBadgeVariant = (roleName: string): 'error' | 'warning' | 'info' | 'success' | 'neutral' => {
    const r = (roleName || '').toLowerCase().trim()
    if (r === 'super_admin') return 'error'
    if (r === 'admin') return 'warning'
    if (r === 'officer' || r === 'coordinator') return 'info'
    if (r === 'user' || r === 'citizen') return 'success'
    return 'neutral'
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
        title="Users Management"
        subtitle="Manage Authentication accounts and RBAC access roles"
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        role={role}
        userEmail={currentAuthUser?.email}
        onSignOut={() => signOutUser()}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
        {!canViewUsers ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#1a1d2e] border border-gray/15 text-center space-y-4 max-w-xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-darkblue dark:text-offwhite">
              Access Restricted
            </h2>
            <p className="text-xs sm:text-sm text-gray dark:text-gray/70">
              You do not have permission to view or manage user accounts. Please contact an administrator to request access.
            </p>
          </div>
        ) : (
          <>
            {/* Banner Section */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-darkblue via-[#30386b] to-lightblue p-5 sm:p-8 text-offwhite shadow-xl shadow-darkblue/10">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-2xl space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs">
                    <Sparkles className="w-3.5 h-3.5 text-orange animate-pulse" />
                    Firebase Auth & RBAC Directory
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                    User Accounts & Access Control
                  </h1>
                  <p className="text-xs sm:text-sm text-offwhite/85 leading-relaxed">
                    Create new authenticated user credentials in Firebase, assign their system roles, and govern permissions seamlessly across the portal.
                  </p>
                </div>

                {canCreateUser && (
                  <div className="flex shrink-0">
                    <Button
                      variant="dark"
                      size="md"
                      onClick={onOpenAddModal}
                      leftIcon={<UserPlus className="w-4 h-4" />}
                      className="bg-white text-darkblue hover:bg-offwhite dark:bg-orange dark:text-darkblue font-semibold shadow-lg shadow-black/10 border-0"
                    >
                      Create User
                    </Button>
                  </div>
                )}
              </div>

              <div className="hidden sm:block absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
                <Users className="w-64 h-64 text-white" />
              </div>
            </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div
                key={idx}
                className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1a1d2e] p-4 sm:p-5 border border-gray/15 dark:border-gray/10 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-gray dark:text-gray/80 truncate">
                    {stat.title}
                  </span>
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shrink-0 shadow-xs`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="mt-2 sm:mt-3">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-darkblue dark:text-offwhite tracking-tight">
                    {loading ? (
                      <span className="inline-block w-8 h-7 bg-gray/20 rounded animate-pulse" />
                    ) : (
                      stat.count
                    )}
                  </span>
                  <p className="text-[11px] sm:text-xs text-gray dark:text-gray/70 mt-0.5 truncate font-medium">
                    {stat.change}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Filters & Search Control Bar */}
        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl p-4 sm:p-5 border border-gray/15 dark:border-gray/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray dark:text-gray/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by email, name, UID or role..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray/20 dark:border-gray/15 bg-offwhite/50 dark:bg-[#151726]/70 text-xs sm:text-sm font-medium text-darkblue dark:text-offwhite placeholder:text-gray/60 focus:outline-none focus:ring-2 focus:ring-lightblue/30 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray hover:text-darkblue dark:hover:text-offwhite"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Role Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray dark:text-gray/70 shrink-0 hidden sm:inline">
                Role:
              </span>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2.5 rounded-xl border border-gray/20 dark:border-gray/15 bg-offwhite/50 dark:bg-[#151726]/70 text-xs sm:text-sm font-semibold text-darkblue dark:text-offwhite focus:outline-none focus:ring-2 focus:ring-lightblue/30 cursor-pointer"
              >
                <option value="All">All Roles ({usersList.length})</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-gray/10">
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

            {canCreateUser && (
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenAddModal}
                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                className="text-xs font-semibold"
              >
                Add User
              </Button>
            )}
          </div>
        </div>

        {/* Users Table Card */}
        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray/15 dark:border-gray/10 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="px-5 py-4 border-b border-gray/15 dark:border-gray/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-lightblue dark:text-orange" />
              <div>
                <h2 className="text-sm sm:text-base font-bold text-darkblue dark:text-offwhite leading-none">
                  Registered Users Directory
                </h2>
                <p className="text-[11px] text-gray dark:text-gray/70 mt-1">
                  Showing {filteredUsers.length} of {usersList.length} authenticated users
                </p>
              </div>
            </div>
          </div>

          {/* Table Body */}
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-gray/10 dark:bg-gray/15 animate-pulse"
                />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-gray/10 dark:bg-gray/15 flex items-center justify-center mx-auto text-gray/50 mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-darkblue dark:text-offwhite">
                No users found
              </h3>
              <p className="text-xs text-gray dark:text-gray/70 mt-1 max-w-sm mx-auto">
                {searchQuery || selectedRoleFilter !== 'All'
                  ? 'No users match your active search filter query.'
                  : 'No user accounts found in the database.'}
              </p>
              {canCreateUser && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onOpenAddModal}
                  leftIcon={<UserPlus className="w-4 h-4" />}
                  className="mt-4 text-xs font-semibold"
                >
                  Create First User
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-offwhite/50 dark:bg-[#151726]/60 border-b border-gray/15 dark:border-gray/10 text-[11px] font-bold text-gray uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">User / Account</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Firebase UID</th>
                    <th className="py-3.5 px-4">Assigned Role</th>
                    <th className="py-3.5 px-4 hidden lg:table-cell">Created</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray/10 text-xs sm:text-sm">
                  {filteredUsers.map((userItem) => {
                    const initials = (userItem.displayName || userItem.email || 'U')
                      .slice(0, 2)
                      .toUpperCase()
                    const isSuper = userItem.role.toLowerCase().trim() === 'super_admin'

                    return (
                      <tr
                        key={userItem.firebase_uid}
                        className="hover:bg-offwhite/40 dark:hover:bg-[#151726]/40 transition-colors"
                      >
                        {/* User info */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-bold text-xs sm:text-sm uppercase shrink-0 ${
                                isSuper
                                  ? 'bg-rose-500/15 text-rose-600 dark:bg-rose-500/25 dark:text-rose-400 ring-1 ring-rose-500/30'
                                  : userItem.role.toLowerCase().includes('admin')
                                  ? 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/25 dark:text-amber-400 ring-1 ring-amber-500/30'
                                  : 'bg-lightblue/15 text-lightblue dark:bg-orange/20 dark:text-orange ring-1 ring-lightblue/20'
                              }`}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                {userItem.email.endsWith('@firebase.auth') ? (
                                  <button
                                    type="button"
                                    onClick={() => onOpenEditModal(userItem)}
                                    className="text-xs font-semibold text-lightblue dark:text-orange hover:underline cursor-pointer flex items-center gap-1"
                                    title="Click to assign email"
                                  >
                                    <Mail className="w-3 h-3" />
                                    <span>Set User Email</span>
                                  </button>
                                ) : (
                                  <p className="font-bold text-darkblue dark:text-offwhite truncate text-xs sm:text-sm">
                                    {userItem.email}
                                  </p>
                                )}
                                {userItem.isCurrentUser && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-lightblue/20 text-lightblue dark:bg-orange/20 dark:text-orange">
                                    You
                                  </span>
                                )}
                              </div>
                              {userItem.displayName ? (
                                <p className="text-[11px] text-gray dark:text-gray/70 truncate">
                                  {userItem.displayName}
                                </p>
                              ) : (
                                userItem.email.endsWith('@firebase.auth') && (
                                  <p className="text-[10px] text-gray/70 font-mono">
                                    ID: {userItem.firebase_uid.substring(0, 8)}...
                                  </p>
                                )
                              )}
                              <div className="md:hidden mt-0.5 flex items-center gap-1 text-[10px] text-gray font-mono">
                                <span>{userItem.firebase_uid.substring(0, 12)}...</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyUid(userItem.firebase_uid)}
                                  className="hover:text-darkblue dark:hover:text-offwhite cursor-pointer"
                                  title="Copy UID"
                                >
                                  {copiedUid === userItem.firebase_uid ? (
                                    <Check className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Firebase UID */}
                        <td className="py-4 px-4 hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-gray dark:text-gray/70 max-w-[160px] truncate">
                              {userItem.firebase_uid}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyUid(userItem.firebase_uid)}
                              className="p-1 rounded text-gray hover:text-darkblue dark:hover:text-offwhite hover:bg-gray/10 cursor-pointer transition-colors"
                              title="Copy Firebase UID"
                            >
                              {copiedUid === userItem.firebase_uid ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col items-start gap-0.5">
                            <ListBadge
                              variant={getRoleBadgeVariant(userItem.role)}
                              size="sm"
                              icon={<Shield className="w-3 h-3" />}
                            >
                              {userItem.role}
                            </ListBadge>
                            {userItem.roleDescription && (
                              <span className="text-[10px] text-gray dark:text-gray/60 line-clamp-1 max-w-[180px]">
                                {userItem.roleDescription}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Created Date */}
                        <td className="py-4 px-4 hidden lg:table-cell text-xs text-gray dark:text-gray/70">
                          {userItem.createdAt
                            ? new Date(userItem.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'Active'}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                            {canEditUser && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenEditModal(userItem)}
                                leftIcon={<Pencil className="w-3.5 h-3.5" />}
                                className="text-xs px-2.5 py-1.5 h-8 font-medium"
                              >
                                Edit Role
                              </Button>
                            )}

                            {canDeleteUser && !userItem.isCurrentUser && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDelete(userItem)}
                                className="text-xs px-2 py-1.5 h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                title="Delete user profile"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
        )}
      </main>

      {/* 1. Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !actionLoading && setIsAddModalOpen(false)}
        title="Create New User Account"
        subtitle="Provision a new user directly in Firebase Auth & assign their RBAC role"
        size="lg"
      >
        <form onSubmit={onSubmitAddUser} className="space-y-4">
          {modalError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Informational Banner */}
          <div className="p-3 rounded-xl bg-lightblue/10 dark:bg-orange/10 border border-lightblue/20 dark:border-orange/20 text-xs text-darkblue dark:text-offwhite flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-lightblue dark:text-orange shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Firebase Authentication Integration</p>
              <p className="text-gray dark:text-gray/80 text-[11px] mt-0.5">
                The credentials entered below will be registered in Firebase Auth and mapped to the selected RBAC role in Supabase.
              </p>
            </div>
          </div>

          <TextInput
            label="Email Address *"
            type="email"
            value={addForm.email}
            onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
            placeholder="user@example.com"
            leftIcon={<Mail className="w-4 h-4 text-gray" />}
            required
            fullWidth
          />

          <TextInput
            label="Full Name / Display Name (Optional)"
            type="text"
            value={addForm.displayName}
            onChange={(e) => setAddForm({ ...addForm, displayName: e.target.value })}
            placeholder="Jane Doe"
            leftIcon={<UserIcon className="w-4 h-4 text-gray" />}
            fullWidth
          />

          {/* Password Input with Visibility Toggle */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-darkblue dark:text-offwhite">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                placeholder="Minimum 6 characters"
                minLength={6}
                required
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray/25 dark:border-gray/20 bg-white dark:bg-[#151726] text-xs sm:text-sm font-medium text-darkblue dark:text-offwhite placeholder:text-gray/50 focus:outline-none focus:ring-2 focus:ring-lightblue/30"
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray hover:text-darkblue dark:hover:text-offwhite cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-gray dark:text-gray/60">
              Must be at least 6 characters for Firebase Authentication.
            </p>
          </div>

          {/* Role Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-darkblue dark:text-offwhite">
              Assign Role *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {roles.map((r) => {
                const isSelected = addForm.role.toLowerCase() === r.name.toLowerCase()
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setAddForm({ ...addForm, role: r.name })}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between ${
                      isSelected
                        ? 'border-lightblue bg-lightblue/10 dark:border-orange dark:bg-orange/15 shadow-xs'
                        : 'border-gray/20 hover:border-gray/40 dark:border-gray/15 dark:hover:border-gray/30 bg-white dark:bg-[#151726]/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Shield className={`w-3.5 h-3.5 ${isSelected ? 'text-lightblue dark:text-orange' : 'text-gray'}`} />
                        <span className="font-bold text-xs capitalize text-darkblue dark:text-offwhite">
                          {r.name}
                        </span>
                      </div>
                      {r.description && (
                        <p className="text-[10px] text-gray dark:text-gray/60 mt-1 line-clamp-1">
                          {r.description}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-lightblue dark:text-orange shrink-0 mt-0.5" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray/15">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={actionLoading}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Create User in Firebase
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Edit User Role & Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !actionLoading && setIsEditModalOpen(false)}
        title="Edit User Account & Role"
        subtitle={`Modify access level and profile details for ${activeUser?.email || 'user'}`}
        size="md"
      >
        <form onSubmit={onSubmitEditRole} className="space-y-4">
          {modalError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-offwhite dark:bg-[#151726] border border-gray/15 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray">Firebase UID:</span>
              <span className="font-mono text-[11px] text-gray/80">{activeUser?.firebase_uid}</span>
            </div>
          </div>

          <TextInput
            label="Email Address"
            type="email"
            value={editRoleForm.email}
            onChange={(e) => setEditRoleForm({ ...editRoleForm, email: e.target.value })}
            placeholder="user@example.com"
            leftIcon={<Mail className="w-4 h-4 text-gray" />}
            fullWidth
          />

          <TextInput
            label="Display Name / Full Name"
            type="text"
            value={editRoleForm.displayName}
            onChange={(e) => setEditRoleForm({ ...editRoleForm, displayName: e.target.value })}
            placeholder="Full Name"
            leftIcon={<UserIcon className="w-4 h-4 text-gray" />}
            fullWidth
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-darkblue dark:text-offwhite">
              Select Role *
            </label>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {roles.map((r) => {
                const isSelected = editRoleForm.role.toLowerCase() === r.name.toLowerCase()
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setEditRoleForm({ ...editRoleForm, role: r.name })}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-lightblue bg-lightblue/10 dark:border-orange dark:bg-orange/15 shadow-xs'
                        : 'border-gray/20 hover:border-gray/40 dark:border-gray/15 dark:hover:border-gray/30 bg-white dark:bg-[#151726]/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className={`w-4 h-4 ${isSelected ? 'text-lightblue dark:text-orange' : 'text-gray'}`} />
                      <div>
                        <span className="font-bold text-xs capitalize text-darkblue dark:text-offwhite">
                          {r.name}
                        </span>
                        {r.description && (
                          <p className="text-[10px] text-gray dark:text-gray/60 mt-0.5">
                            {r.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-lightblue dark:text-orange shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray/15">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={actionLoading}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Delete User Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => !actionLoading && setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteUser}
        title="Revoke & Delete User Profile"
        message={`Are you sure you want to remove user "${activeUser?.email}" (${activeUser?.firebase_uid}) from the portal database? This will remove their RBAC role and access permissions.`}
        confirmText="Yes, Delete User"
        cancelText="Cancel"
        isLoading={actionLoading}
        variant="danger"
      />
    </div>
  )
}

export default UsersPage
