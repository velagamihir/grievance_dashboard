import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePermissions } from './usePermissions'
import { supabase } from '../lib/supabase'
import type {
  RoleRow,
  PermissionRow,
  RolePermissionRow,
  ProfileRow,
  RoleWithPermissions,
  CreateRoleFormData,
  UpdateRoleFormData,
} from '../types'

export interface RolesToast {
  type: 'success' | 'error' | 'info'
  message: string
}

export function useRolesPage() {
  const { user, signOutUser } = useAuth()
  const {
    role: currentUserRole,
    displayName,
    isSuperAdmin,
    isAdminOrSuperAdmin,
    canViewRoles,
    canCreateRole,
    canAddRole,
    canEditRole,
    canChangePermissions,
    canManagePermissions,
    canDeleteRole,
    loading: permissionsLoading,
    refreshPermissions,
  } = usePermissions()

  const [roles, setRoles] = useState<RoleRow[]>([])
  const [permissions, setPermissions] = useState<PermissionRow[]>([])
  const [rolePermissions, setRolePermissions] = useState<RolePermissionRow[]>([])
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState<RolesToast | null>(null)

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedResourceFilter, setSelectedResourceFilter] = useState('All')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPermsModalOpen, setIsPermsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const [activeRole, setActiveRole] = useState<RoleWithPermissions | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Auto-clear toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
  }, [])

  // Fetch all roles, permissions, role_permissions, and user profiles
  const fetchData = useCallback(async () => {
    if (!canViewRoles) {
      setLoading(false)
      setRefreshing(false)
      return
    }

    try {
      setRefreshing(true)
      const [rolesRes, permsRes, rpRes, profilesRes] = await Promise.all([
        supabase.from('roles').select('*').order('id', { ascending: true }),
        supabase.from('permissions').select('*').order('id', { ascending: true }),
        supabase.from('role_permissions').select('*'),
        supabase.from('profiles').select('firebase_uid, role'),
      ])

      if (rolesRes.error) throw rolesRes.error
      if (permsRes.error) throw permsRes.error
      if (rpRes.error) throw rpRes.error

      setRoles(rolesRes.data || [])
      setPermissions(permsRes.data || [])
      setRolePermissions(rpRes.data || [])
      setProfiles(profilesRes.data || [])
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error fetching roles and permissions', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [canViewRoles, showToast])

  useEffect(() => {
    if (!permissionsLoading) {
      if (canViewRoles) {
        fetchData()
      } else {
        setLoading(false)
      }
    }
  }, [permissionsLoading, canViewRoles, fetchData])

  // Combine roles with their granted permissions and user counts
  const rolesWithPermissions: RoleWithPermissions[] = useMemo(() => {
    const permsById = new Map<number, PermissionRow>()
    permissions.forEach((p) => permsById.set(p.id, p))

    // Group permission IDs by role_id
    const permsByRole = new Map<number, number[]>()
    rolePermissions.forEach((rp) => {
      const list = permsByRole.get(rp.role_id) || []
      list.push(rp.permission_id)
      permsByRole.set(rp.role_id, list)
    })

    // Count user profiles per role
    const usersCountByRole = new Map<string, number>()
    profiles.forEach((p) => {
      if (p.role) {
        const key = p.role.toLowerCase().trim()
        usersCountByRole.set(key, (usersCountByRole.get(key) || 0) + 1)
      }
    })

    return roles.map((r) => {
      // If role is super_admin, it gets all permissions in the system
      const isSuper = (r.name || '').toLowerCase().trim() === 'super_admin'
      const grantedIds = isSuper ? permissions.map((p) => p.id) : permsByRole.get(r.id) || []
      const grantedPerms = grantedIds
        .map((id) => permsById.get(id))
        .filter((p): p is PermissionRow => Boolean(p))

      const roleKey = (r.name || '').toLowerCase().trim()
      const userCount = usersCountByRole.get(roleKey) || 0

      return {
        ...r,
        permissionIds: grantedIds,
        permissions: grantedPerms,
        assignedUsersCount: userCount,
      }
    })
  }, [roles, permissions, rolePermissions, profiles])

  // Distinct resource categories from permissions table
  const distinctResources = useMemo(() => {
    const set = new Set<string>()
    permissions.forEach((p) => {
      if (p.resource) set.add(p.resource)
    })
    return ['All', ...Array.from(set).sort()]
  }, [permissions])

  // Filtered roles based on search and resource filter
  const filteredRoles = useMemo(() => {
    return rolesWithPermissions.filter((roleItem) => {
      // Resource filter
      if (selectedResourceFilter !== 'All') {
        const hasResource = roleItem.permissions.some(
          (p) => (p.resource || '').toLowerCase() === selectedResourceFilter.toLowerCase()
        )
        if (!hasResource) return false
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const nameMatch = (roleItem.name || '').toLowerCase().includes(q)
        const descMatch = (roleItem.description || '').toLowerCase().includes(q)
        const permMatch = roleItem.permissions.some(
          (p) => (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
        )
        if (!nameMatch && !descMatch && !permMatch) return false
      }

      return true
    })
  }, [rolesWithPermissions, selectedResourceFilter, searchQuery])

  // System Stats
  const stats = useMemo(() => {
    const totalRoles = roles.length
    const totalPermissions = permissions.length
    const totalAssignedLinks = rolePermissions.length
    const totalUsers = profiles.length

    return {
      totalRoles,
      totalPermissions,
      totalAssignedLinks,
      totalUsers,
    }
  }, [roles, permissions, rolePermissions, profiles])

  // Action Handlers
  const handleOpenAdd = useCallback(() => {
    setModalError(null)
    setIsAddModalOpen(true)
  }, [])

  const handleOpenEdit = useCallback((roleItem: RoleWithPermissions) => {
    setActiveRole(roleItem)
    setModalError(null)
    setIsEditModalOpen(true)
  }, [])

  const handleOpenPermissions = useCallback((roleItem: RoleWithPermissions) => {
    setActiveRole(roleItem)
    setModalError(null)
    setIsPermsModalOpen(true)
  }, [])

  const handleOpenDelete = useCallback((roleItem: RoleWithPermissions) => {
    setActiveRole(roleItem)
    setModalError(null)
    setIsDeleteModalOpen(true)
  }, [])

  // 1. Create New Role
  const handleCreateRole = useCallback(
    async (formData: CreateRoleFormData) => {
      if (!canCreateRole) {
        showToast('Permission denied: You do not have permission to create roles.', 'error')
        return
      }

      const cleanName = formData.name.trim().toLowerCase().replace(/\s+/g, '_')
      if (!cleanName) {
        setModalError('Role name is required')
        return
      }

      // Duplicate check
      const duplicate = roles.some((r) => (r.name || '').toLowerCase().trim() === cleanName)
      if (duplicate) {
        setModalError(`Role "${cleanName}" already exists. Please choose a different name.`)
        return
      }

      try {
        setActionLoading(true)
        setModalError(null)

        // Insert into roles
        const { data: newRoleData, error: roleError } = await supabase
          .from('roles')
          .insert([
            {
              name: cleanName,
              description: formData.description.trim() || null,
            },
          ])
          .select()
          .single()

        if (roleError) throw roleError
        const createdRole: RoleRow = newRoleData

        // Insert role_permissions if selected
        if (formData.permissionIds.length > 0) {
          const insertPayload = formData.permissionIds.map((pId) => ({
            role_id: createdRole.id,
            permission_id: pId,
          }))

          await supabase
            .from('role_permissions')
            .insert(insertPayload)
        }

        // Grant default routes access to new role
        try {
          const defaultRoutes = [1, 2, 3] // Dashboard, Block Coordinators, Grievances
          const routePayload = defaultRoutes.map((rId) => ({
            role: cleanName,
            route_id: rId,
          }))
          await supabase.from('role_routes').insert(routePayload)
        } catch {
          // Non-blocking route insertion
        }

        await fetchData()
        await refreshPermissions()
        setIsAddModalOpen(false)
        showToast(`Role "${cleanName}" created successfully!`, 'success')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create role'
        setModalError(msg)
        showToast(msg, 'error')
      } finally {
        setActionLoading(false)
      }
    },
    [canCreateRole, roles, fetchData, refreshPermissions, showToast]
  )

  // 2. Edit Existing Role (Name & Description)
  const handleUpdateRole = useCallback(
    async (roleId: number, formData: UpdateRoleFormData) => {
      if (!canEditRole) {
        showToast('Permission denied: You do not have permission to edit roles.', 'error')
        return
      }

      const cleanName = formData.name.trim().toLowerCase().replace(/\s+/g, '_')
      if (!cleanName) {
        setModalError('Role name is required')
        return
      }

      // Check duplicate name excluding current role
      const duplicate = roles.some(
        (r) => r.id !== roleId && (r.name || '').toLowerCase().trim() === cleanName
      )
      if (duplicate) {
        setModalError(`Role "${cleanName}" already exists.`)
        return
      }

      const targetRole = roles.find((r) => r.id === roleId)
      const oldName = targetRole?.name

      try {
        setActionLoading(true)
        setModalError(null)

        const { error: updateError } = await supabase
          .from('roles')
          .update({
            name: cleanName,
            description: formData.description.trim() || null,
          })
          .eq('id', roleId)

        if (updateError) throw updateError

        // If role name changed, update role_routes and profiles
        if (oldName && oldName !== cleanName) {
          try {
            await supabase
              .from('role_routes')
              .update({ role: cleanName })
              .eq('role', oldName)

            await supabase
              .from('profiles')
              .update({ role: cleanName })
              .eq('role', oldName)
          } catch {
            // Non-blocking cleanup
          }
        }

        await fetchData()
        await refreshPermissions()
        setIsEditModalOpen(false)
        setActiveRole(null)
        showToast(`Role "${cleanName}" updated successfully!`, 'success')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update role'
        setModalError(msg)
        showToast(msg, 'error')
      } finally {
        setActionLoading(false)
      }
    },
    [canEditRole, roles, fetchData, refreshPermissions, showToast]
  )

  // 3. Change Permissions for Role
  const handleChangePermissions = useCallback(
    async (roleId: number, selectedPermissionIds: number[]) => {
      if (!canChangePermissions) {
        showToast('Permission denied: You do not have permission to change role permissions.', 'error')
        return
      }

      const targetRole = roles.find((r) => r.id === roleId)
      if (!targetRole) return

      try {
        setActionLoading(true)
        setModalError(null)

        // Delete existing role_permissions
        const { error: delError } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', roleId)

        if (delError) throw delError

        // Insert new selected permissions
        if (selectedPermissionIds.length > 0) {
          const insertPayload = selectedPermissionIds.map((pId) => ({
            role_id: roleId,
            permission_id: pId,
          }))

          const { error: insError } = await supabase
            .from('role_permissions')
            .insert(insertPayload)

          if (insError) throw insError
        }

        await fetchData()
        await refreshPermissions()
        setIsPermsModalOpen(false)
        setActiveRole(null)
        showToast(`Permissions updated for role "${targetRole.name}"!`, 'success')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update permissions'
        setModalError(msg)
        showToast(msg, 'error')
      } finally {
        setActionLoading(false)
      }
    },
    [canChangePermissions, roles, fetchData, refreshPermissions, showToast]
  )

  // 4. Delete Role
  const handleDeleteRole = useCallback(async () => {
    if (!canDeleteRole) {
      showToast('Permission denied: You do not have permission to delete roles.', 'error')
      return
    }

    if (!activeRole) return

    if (activeRole.name === 'super_admin') {
      showToast('Action Forbidden: The super_admin role is system-critical and cannot be deleted.', 'error')
      setIsDeleteModalOpen(false)
      return
    }

    try {
      setActionLoading(true)
      setModalError(null)

      // Delete associated role_permissions
      await supabase.from('role_permissions').delete().eq('role_id', activeRole.id)

      // Delete associated role_routes
      if (activeRole.name) {
        await supabase.from('role_routes').delete().eq('role', activeRole.name)
      }

      // Delete role record
      const { error: delError } = await supabase.from('roles').delete().eq('id', activeRole.id)
      if (delError) throw delError

      await fetchData()
      await refreshPermissions()
      setIsDeleteModalOpen(false)
      setActiveRole(null)
      showToast(`Role "${activeRole.name}" deleted successfully!`, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete role'
      setModalError(msg)
      showToast(msg, 'error')
    } finally {
      setActionLoading(false)
    }
  }, [canDeleteRole, activeRole, fetchData, refreshPermissions, showToast])

  return {
    // Auth & Permission info
    currentUserRole,
    isSuperAdmin,
    isAdminOrSuperAdmin,
    canViewRoles,
    canCreateRole,
    canAddRole,
    canEditRole,
    canChangePermissions,
    canManagePermissions,
    canDeleteRole,
    permissionsLoading,
    displayName,
    user,
    signOutUser,

    // Data State
    roles,
    permissions,
    rolePermissions,
    rolesWithPermissions,
    filteredRoles,
    distinctResources,
    stats,
    loading,
    refreshing,
    toast,

    // Search & Filter State
    searchQuery,
    setSearchQuery,
    selectedResourceFilter,
    setSelectedResourceFilter,

    // Modals State
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

    // Modal Triggers
    handleOpenAdd,
    handleOpenEdit,
    handleOpenPermissions,
    handleOpenDelete,
    showToast,
    setToast,

    // Mutations
    fetchData,
    handleCreateRole,
    handleUpdateRole,
    handleChangePermissions,
    handleDeleteRole,
  }
}
