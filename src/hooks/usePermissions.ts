import { useState, useEffect } from 'react'
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
  isAdminOrSuperAdmin,
} from '../utils'
import type { PermissionRow } from '../types'

export interface UserPermissionsState {
  role: string | null
  permissions: PermissionRow[]
  allPermissions: PermissionRow[]
  loading: boolean
  isAdminOrSuperAdmin: boolean
  hasPermission: (resource: string, action: string) => boolean
  hasPermissionName: (name: string) => boolean
  canCreateGrievance: boolean
  canEditGrievance: boolean
  canEditStatus: boolean
  canDeleteGrievance: boolean
  canViewAllGrievances: boolean
  canManageCoordinators: boolean
  canViewCoordinators: boolean
  canCreateCoordinator: boolean
  canEditCoordinator: boolean
  canDeleteCoordinator: boolean
  refreshPermissions: () => Promise<void>
}

// Canonical permissions catalog fallback in case Supabase RLS limits anon SELECT on permissions table
const KNOWN_PERMISSIONS: PermissionRow[] = [
  { id: 1, name: 'View Users', resource: 'users', action: 'view', description: 'View users', created_at: '2026-09-26' },
  { id: 2, name: 'Add Users', resource: 'users', action: 'add', description: 'Create users', created_at: '2026-09-26' },
  { id: 3, name: 'Edit Users', resource: 'users', action: 'edit', description: 'Edit users', created_at: '2026-09-26' },
  { id: 4, name: 'Delete Users', resource: 'users', action: 'delete', description: 'Delete users', created_at: '2026-09-26' },
  { id: 5, name: 'View Grievances', resource: 'grievances', action: 'view', description: 'View Grievances', created_at: '2026-09-27' },
  { id: 6, name: 'Add Grievances', resource: 'grievances', action: 'add', description: 'Add Grievances', created_at: '2026-09-27' },
  { id: 7, name: 'Edit Grievances', resource: 'grievances', action: 'edit', description: 'Edit Grievances', created_at: '2026-09-27' },
  { id: 8, name: 'Delete Grievances', resource: 'grievances', action: 'delete', description: 'Delete Grievances', created_at: '2026-09-27' },
  { id: 10, name: 'Edit Status Grievances', resource: 'grievances', action: 'edit status', description: 'Edit Status Grievances', created_at: '2026-09-27' },
  { id: 11, name: 'View Block Coordinators', resource: 'block_coordinators', action: 'view', description: 'View Block Coordinators', created_at: '2026-09-27' },
  { id: 12, name: 'Add Block Coordinators', resource: 'block_coordinators', action: 'add', description: 'Add Block Coordinators', created_at: '2026-09-27' },
  { id: 13, name: 'Edit Block Coordinators', resource: 'block_coordinators', action: 'edit', description: 'Edit Block Coordinators', created_at: '2026-09-27' },
  { id: 14, name: 'Delete Block Coordinators', resource: 'block_coordinators', action: 'delete', description: 'Delete Block Coordinators', created_at: '2026-09-27' },
  { id: 15, name: 'Manage Coordinators', resource: 'block_coordinators', action: 'manage', description: 'Manage Block Coordinators', created_at: '2026-09-27' },
]

export function usePermissions(): UserPermissionsState {
  const { user } = useAuth()
  const [role, setRole] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<PermissionRow[]>([])
  const [allPermissions, setAllPermissions] = useState<PermissionRow[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const fetchPermissions = async () => {
    if (!user) {
      setRole(null)
      setPermissions([])
      setAllPermissions([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 1. Fetch all records from the `permissions` table
      const { data: allPermsData } = await supabase
        .from('permissions')
        .select('*')
        .order('id', { ascending: true })

      const availablePerms: PermissionRow[] =
        allPermsData && allPermsData.length > 0 ? (allPermsData as PermissionRow[]) : KNOWN_PERMISSIONS
      setAllPermissions(availablePerms)

      // 2. Fetch user's assigned role from `profiles` (check firebase_uid, then email)
      let userRole: string | null = null

      const { data: profileByUid } = await supabase
        .from('profiles')
        .select('role')
        .eq('firebase_uid', user.uid)
        .maybeSingle()

      if (profileByUid?.role) {
        userRole = profileByUid.role
      } else if (user.email) {
        const { data: profileByEmail } = await supabase
          .from('profiles')
          .select('role')
          .eq('email', user.email)
          .maybeSingle()

        if (profileByEmail?.role) {
          userRole = profileByEmail.role
        }
      }

      setRole(userRole)

      if (!userRole) {
        setPermissions([])
        return
      }

      const cleanRole = userRole.trim()

      // 3. Find matching role from `roles` table
      const { data: allRoles } = await supabase
        .from('roles')
        .select('id, name')

      const matchedRole = (allRoles || []).find(
        (r: any) =>
          r.name?.toLowerCase().trim() === cleanRole.toLowerCase() ||
          String(r.id) === cleanRole
      )

      const roleId = matchedRole ? matchedRole.id : (!isNaN(Number(cleanRole)) ? Number(cleanRole) : null)

      // 4. Query role_permissions for this roleId
      let grantedPermissionIds: string[] = []

      if (roleId !== null) {
        const { data: rpData } = await supabase
          .from('role_permissions')
          .select('permission_id')
          .eq('role_id', roleId)

        if (rpData && rpData.length > 0) {
          grantedPermissionIds = rpData.map((rp: any) => String(rp.permission_id))
        }
      }

      // 5. Match against available permissions
      const grantedSet = new Set(grantedPermissionIds)
      const matchedPerms = availablePerms.filter((p) => grantedSet.has(String(p.id)))

      setPermissions(matchedPerms)
    } catch {
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPermissions()
  }, [user])

  // Bound helper functions delegating to src/utils/permissions
  const hasPermission = (resource: string, action: string): boolean =>
    checkPermission(permissions, resource, action)

  const hasPermissionName = (name: string): boolean =>
    checkPermissionName(permissions, name)

  // Derived capabilities using utils logic based purely on DB permissions & role
  const canCreateGrievance = checkCanCreateGrievance(permissions)
  const canEditGrievance = checkCanEditGrievance(permissions)
  const canEditStatus = checkCanEditStatus(permissions)
  const canDeleteGrievance = checkCanDeleteGrievance(permissions)
  const canViewAllGrievances = checkCanViewAllGrievances(permissions)
  const isSuperOrAdmin = isAdminOrSuperAdmin(role)
  const canManageCoordinators = checkCanManageCoordinators(permissions, role)
  const canViewCoordinators = checkCanViewCoordinators(permissions, role)
  const canCreateCoordinator = checkCanCreateCoordinator(permissions, role)
  const canEditCoordinator = checkCanEditCoordinator(permissions, role)
  const canDeleteCoordinator = checkCanDeleteCoordinator(permissions, role)

  return {
    role,
    permissions,
    allPermissions,
    loading,
    isAdminOrSuperAdmin: isSuperOrAdmin,
    hasPermission,
    hasPermissionName,
    canCreateGrievance,
    canEditGrievance,
    canEditStatus,
    canDeleteGrievance,
    canViewAllGrievances,
    canManageCoordinators,
    canViewCoordinators,
    canCreateCoordinator,
    canEditCoordinator,
    canDeleteCoordinator,
    refreshPermissions: fetchPermissions,
  }
}

export default usePermissions
