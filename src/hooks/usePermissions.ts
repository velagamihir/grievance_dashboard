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
  checkCanAddCoordinator,
  checkCanEditCoordinator,
  checkCanDeleteCoordinator,
  isAdminOrSuperAdmin,
  isSuperAdmin,
} from '../utils'
import type { PermissionRow } from '../types'

export interface UserPermissionsState {
  role: string | null
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
  canManageCoordinators: boolean
  canViewCoordinators: boolean
  canCreateCoordinator: boolean
  canAddCoordinator: boolean
  canEditCoordinator: boolean
  canDeleteCoordinator: boolean
  refreshPermissions: () => Promise<void>
}

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

      // 1. Fetch all records directly from the `permissions` table in the database
      const { data: allPermsData, error: permsError } = await supabase
        .from('permissions')
        .select('*')
        .order('id', { ascending: true })

      if (permsError) {
        console.error('[Permissions] Error fetching permissions from DB:', permsError)
      } else {
        console.log('[Permissions] permissions table rows fetched from DB:', allPermsData?.length)
      }

      const availablePerms: PermissionRow[] = allPermsData || []
      setAllPermissions(availablePerms)

      // 2. Fetch user's assigned role from `profiles` table in database
      let userRole: string | null = null

      const { data: profileByUid, error: uidError } = await supabase
        .from('profiles')
        .select('role')
        .eq('firebase_uid', user.uid)
        .maybeSingle()

      if (uidError) {
        console.error('[Permissions] Error fetching profile by uid:', uidError)
      }

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

      console.log('[Permissions] Authenticated User UID:', user.uid, '| DB Resolved Role:', userRole)
      setRole(userRole)

      if (!userRole) {
        setPermissions([])
        return
      }

      const cleanRole = userRole.trim().toLowerCase()

      // If user is super_admin, grant ALL permissions available from database
      if (isSuperAdmin(cleanRole)) {
        console.log('[Permissions] super_admin detected: Granting all backend database permissions.')
        setPermissions(availablePerms)
        return
      }

      // 3. For all other roles: Find matching role in `roles` table
      const { data: allRoles, error: rolesError } = await supabase
        .from('roles')
        .select('id, name')

      if (rolesError) {
        console.error('[Permissions] Error fetching roles from DB:', rolesError)
      }

      const matchedRole = (allRoles || []).find(
        (r: any) =>
          r.name?.toLowerCase().trim() === cleanRole ||
          String(r.id) === cleanRole
      )

      const roleId = matchedRole ? matchedRole.id : (!isNaN(Number(cleanRole)) ? Number(cleanRole) : null)
      console.log('[Permissions] Matched Role ID:', roleId, 'for role:', cleanRole)

      if (roleId === null) {
        setPermissions([])
        return
      }

      // 4. Query role_permissions for this roleId from database (with joined permissions)
      const { data: rpData, error: rpError } = await supabase
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

      if (rpError) {
        console.error('[Permissions] Error fetching role_permissions from DB:', rpError)
      }

      let grantedPermissionIds: string[] = []
      let joinedPerms: PermissionRow[] = []

      if (rpData && rpData.length > 0) {
        grantedPermissionIds = rpData.map((rp: any) => String(rp.permission_id))
        joinedPerms = rpData
          .map((rp: any) => (Array.isArray(rp.permissions) ? rp.permissions[0] : rp.permissions))
          .filter((p: any): p is PermissionRow => p !== null && typeof p === 'object' && Boolean(p.name))
      }

      console.log('[Permissions] Granted DB Permission IDs for', cleanRole, ':', grantedPermissionIds)

      // 5. Resolve permissions from DB
      let matchedPerms: PermissionRow[] = []

      if (joinedPerms.length > 0) {
        matchedPerms = joinedPerms
      } else if (availablePerms.length > 0 && grantedPermissionIds.length > 0) {
        const grantedSet = new Set(grantedPermissionIds.map((id) => String(id).trim()))
        matchedPerms = availablePerms.filter((p) => grantedSet.has(String(p.id).trim()))
      }

      console.log('[Permissions] DB Active Permissions for', cleanRole, ':', matchedPerms.map((p) => p.name))
      setPermissions(matchedPerms)
    } catch (err) {
      console.error('[Permissions] Error resolving user permissions from backend:', err)
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

  // Derived capabilities evaluated purely from the database permissions array (or super_admin root)
  const isSuper = isSuperAdmin(role)
  const isSuperOrAdmin = isAdminOrSuperAdmin(role)

  const canCreateGrievance = isSuper || checkCanCreateGrievance(permissions)
  const canEditGrievance = isSuper || checkCanEditGrievance(permissions)
  const canEditStatus = isSuper || checkCanEditStatus(permissions)
  const canDeleteGrievance = isSuper || checkCanDeleteGrievance(permissions)
  const canViewAllGrievances = isSuper || checkCanViewAllGrievances(permissions)
  const canManageCoordinators = isSuper || checkCanManageCoordinators(permissions)
  const canViewCoordinators = isSuper || checkCanViewCoordinators(permissions)
  const canCreateCoordinator = isSuper || checkCanCreateCoordinator(permissions)
  const canAddCoordinator = canCreateCoordinator
  const canEditCoordinator = isSuper || checkCanEditCoordinator(permissions)
  const canDeleteCoordinator = isSuper || checkCanDeleteCoordinator(permissions)

  console.log('[Permissions Evaluated]', {
    role,
    isSuperAdmin: isSuper,
    canViewCoordinators,
    canAddCoordinator,
    canEditCoordinator,
    canDeleteCoordinator,
    activePermissions: permissions.map((p) => p.name),
  })

  return {
    role,
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
    canManageCoordinators,
    canViewCoordinators,
    canCreateCoordinator,
    canAddCoordinator,
    canEditCoordinator,
    canDeleteCoordinator,
    refreshPermissions: fetchPermissions,
  }
}

export default usePermissions
