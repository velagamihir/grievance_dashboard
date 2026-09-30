import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  hasPermission as checkPermission,
  hasPermissionName as checkPermissionName,
  checkCanCreateGrievance,
  checkCanEditGrievance,
  checkCanEditStatus,
  checkCanDeleteGrievance,
  checkCanViewAllGrievances,
  checkCanManageCoordinators,
  checkCanViewCoordinators,
  checkCanCreateCoordinator,
  checkCanEditCoordinator,
  checkCanDeleteCoordinator,
  checkCanViewRoles,
  checkCanCreateRole,
  checkCanEditRole,
  checkCanManagePermissions,
  checkCanDeleteRole,
  checkCanViewUsers,
  checkCanCreateUser,
  checkCanEditUser,
  checkCanDeleteUser,
  checkCanTriggerWorkflow1,
  checkCanTriggerWorkflow2,
  checkCanTriggerWorkflows,
  isAdminOrSuperAdmin,
  isSuperAdmin,
} from '../utils'
import type { PermissionRow, RoleRow } from '../types'

interface RolePermissionJoined {
  permission_id: number
  permissions: PermissionRow | PermissionRow[] | null
}

export interface UserPermissionsState {
  role: string | null
  displayName: string | null
  permissions: PermissionRow[]
  allPermissions: PermissionRow[]
  loading: boolean
  isSuperAdmin: boolean
  isAdminOrSuperAdmin: boolean
  hasPermission: (resource: string, action: string) => boolean
  hasPermissionName: (name: string) => boolean
  canCreateGrievance: boolean
  canEditGrievance: boolean
  canEditStatus: boolean
  canDeleteGrievance: boolean
  canViewAllGrievances: boolean
  canTriggerWorkflow1: boolean
  canTriggerWorkflow2: boolean
  canTriggerWorkflows: boolean
  canManageCoordinators: boolean
  canViewCoordinators: boolean
  canCreateCoordinator: boolean
  canAddCoordinator: boolean
  canEditCoordinator: boolean
  canDeleteCoordinator: boolean
  canViewRoles: boolean
  canCreateRole: boolean
  canAddRole: boolean
  canEditRole: boolean
  canChangePermissions: boolean
  canManagePermissions: boolean
  canDeleteRole: boolean
  canViewUsers: boolean
  canCreateUser: boolean
  canAddUser: boolean
  canEditUser: boolean
  canDeleteUser: boolean
  refreshPermissions: () => Promise<void>
}

export function usePermissions(): UserPermissionsState {
  const { user } = useAuth()
  const [role, setRole] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<PermissionRow[]>([])
  const [allPermissions, setAllPermissions] = useState<PermissionRow[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setRole(null)
      setDisplayName(null)
      setPermissions([])
      setAllPermissions([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const { data: allPermsData } = await supabase
        .from('permissions')
        .select('*')
        .order('id', { ascending: true })

      const availablePerms: PermissionRow[] = allPermsData || []
      setAllPermissions(availablePerms)

      // 2. Fetch user's assigned role and display name from `profiles` in Supabase
      let userRole: string | null = null
      let userDisplayName: string | null = null

      const { data: profileByUid } = await supabase
        .from('profiles')
        .select('role, display_name, email')
        .eq('firebase_uid', user.uid)
        .maybeSingle()

      if (profileByUid) {
        if (profileByUid.role) userRole = profileByUid.role
        if (profileByUid.display_name) userDisplayName = profileByUid.display_name
      } else if (user.email) {
        const { data: profileByEmail } = await supabase
          .from('profiles')
          .select('role, display_name, email')
          .eq('email', user.email)
          .maybeSingle()

        if (profileByEmail) {
          if (profileByEmail.role) userRole = profileByEmail.role
          if (profileByEmail.display_name) userDisplayName = profileByEmail.display_name
        }
      }

      setRole(userRole)
      setDisplayName(userDisplayName || user.displayName || null)

      if (!userRole) {
        setPermissions([])
        return
      }

      const cleanRole = userRole.trim().toLowerCase()

      // If user is super_admin, grant ALL permissions
      if (isSuperAdmin(cleanRole)) {
        setPermissions(availablePerms)
        return
      }

      // 3. Find matching role from `roles` table
      const { data: allRoles } = await supabase
        .from('roles')
        .select('id, name')

      const matchedRole = (allRoles as RoleRow[] | null || []).find(
        (r) =>
          r.name?.toLowerCase().trim() === cleanRole ||
          String(r.id) === cleanRole
      )

      const roleId = matchedRole ? matchedRole.id : (!isNaN(Number(cleanRole)) ? Number(cleanRole) : null)

      if (roleId === null) {
        setPermissions([])
        return
      }

      // 4. Query role_permissions with joined permissions
      const { data: rpData } = await supabase
        .from('role_permissions')
        .select(`
          permission_id,
          permissions (
            id,
            name,
            resource,
            action,
            description
          )
        `)
        .eq('role_id', roleId)

      let grantedPermissionIds: string[] = []
      let joinedPerms: PermissionRow[] = []

      if (rpData && rpData.length > 0) {
        const typedRpData = rpData as unknown as RolePermissionJoined[]
        grantedPermissionIds = typedRpData.map((rp) => String(rp.permission_id))
        joinedPerms = typedRpData
          .map((rp) => (Array.isArray(rp.permissions) ? rp.permissions[0] : rp.permissions))
          .filter((p): p is PermissionRow => p !== null && typeof p === 'object' && Boolean(p.name))
      }

      // 5. Match against available permissions
      let matchedPerms: PermissionRow[] = []

      if (joinedPerms.length > 0) {
        matchedPerms = joinedPerms
      } else if (availablePerms.length > 0 && grantedPermissionIds.length > 0) {
        const grantedSet = new Set(grantedPermissionIds.map((id) => String(id).trim()))
        matchedPerms = availablePerms.filter((p) => grantedSet.has(String(p.id).trim()))
      }

      setPermissions(matchedPerms)
    } catch {
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  // Helper functions delegating to src/utils/permissions
  const hasPermission = (resource: string, action: string): boolean =>
    checkPermission(permissions, resource, action)

  const hasPermissionName = (name: string): boolean =>
    checkPermissionName(permissions, name)

  const isSuper = isSuperAdmin(role)
  const isSuperOrAdmin = isAdminOrSuperAdmin(role)

  const canCreateGrievance = isSuper || checkCanCreateGrievance(permissions)
  const canEditGrievance = isSuper || checkCanEditGrievance(permissions)
  const canEditStatus = isSuper || checkCanEditStatus(permissions)
  const canDeleteGrievance = isSuper || checkCanDeleteGrievance(permissions)
  const canViewAllGrievances = isSuper || checkCanViewAllGrievances(permissions)
  const canTriggerWorkflow1 = isSuper || checkCanTriggerWorkflow1(permissions)
  const canTriggerWorkflow2 = isSuper || checkCanTriggerWorkflow2(permissions)
  const canTriggerWorkflows = isSuper || checkCanTriggerWorkflows(permissions)
  const canManageCoordinators = isSuper || checkCanManageCoordinators(permissions)
  const canViewCoordinators = isSuper || checkCanViewCoordinators(permissions)
  const canCreateCoordinator = isSuper || checkCanCreateCoordinator(permissions)
  const canAddCoordinator = canCreateCoordinator
  const canEditCoordinator = isSuper || checkCanEditCoordinator(permissions)
  const canDeleteCoordinator = isSuper || checkCanDeleteCoordinator(permissions)

  const canViewRoles = isSuper || checkCanViewRoles(permissions)
  const canCreateRole = isSuper || checkCanCreateRole(permissions)
  const canAddRole = canCreateRole
  const canEditRole = isSuper || checkCanEditRole(permissions)
  const canChangePermissions = isSuper || checkCanManagePermissions(permissions)
  const canManagePermissions = canChangePermissions
  const canDeleteRole = isSuper || checkCanDeleteRole(permissions)

  const canViewUsers = isSuper || checkCanViewUsers(permissions)
  const canCreateUser = isSuper || checkCanCreateUser(permissions)
  const canAddUser = canCreateUser
  const canEditUser = isSuper || checkCanEditUser(permissions)
  const canDeleteUser = isSuper || checkCanDeleteUser(permissions)

  return {
    role,
    displayName,
    permissions,
    allPermissions,
    loading,
    isSuperAdmin: isSuper,
    isAdminOrSuperAdmin: isSuperOrAdmin,
    hasPermission,
    hasPermissionName,
    canCreateGrievance,
    canEditGrievance,
    canEditStatus,
    canDeleteGrievance,
    canViewAllGrievances,
    canTriggerWorkflow1,
    canTriggerWorkflow2,
    canTriggerWorkflows,
    canManageCoordinators,
    canViewCoordinators,
    canCreateCoordinator,
    canAddCoordinator,
    canEditCoordinator,
    canDeleteCoordinator,
    canViewRoles,
    canCreateRole,
    canAddRole,
    canEditRole,
    canChangePermissions,
    canManagePermissions,
    canDeleteRole,
    canViewUsers,
    canCreateUser,
    canAddUser,
    canEditUser,
    canDeleteUser,
    refreshPermissions: fetchPermissions,
  }
}

export default usePermissions
