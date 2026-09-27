import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { PermissionRow } from '../types'

export interface UserPermissionsState {
  role: string | null
  permissions: PermissionRow[]
  allPermissions: PermissionRow[]
  loading: boolean
  hasPermission: (resource: string, action: string) => boolean
  hasPermissionName: (name: string) => boolean
  canCreateGrievance: boolean
  canEditGrievance: boolean
  canEditStatus: boolean
  canDeleteGrievance: boolean
  canViewAllGrievances: boolean
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
      console.group('[usePermissions] 🔐 Resolving Database Permissions')
      console.log('[usePermissions] User:', { uid: user.uid, email: user.email })

      // 1. Fetch all records from the `permissions` table
      const { data: allPermsData, error: allPermsErr } = await supabase
        .from('permissions')
        .select('*')
        .order('id', { ascending: true })

      if (allPermsErr) {
        console.warn('[usePermissions] Error querying permissions table:', allPermsErr.message)
      } else {
        console.log('[usePermissions] Permissions table count:', allPermsData?.length ?? 0)
      }

      const availablePerms: PermissionRow[] = (allPermsData as PermissionRow[]) || []
      setAllPermissions(availablePerms)

      // 2. Fetch user's assigned role from `profiles`
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('firebase_uid', user.uid)
        .maybeSingle()

      if (profileErr) {
        console.warn('[usePermissions] Error querying profiles table:', profileErr.message)
      } else {
        console.log('[usePermissions] Profile result for uid:', profileData)
      }

      const userRole = profileData?.role || null
      setRole(userRole)

      if (!userRole) {
        console.log('[usePermissions] No role assigned in profiles table. Granted permissions: []')
        console.groupEnd()
        setPermissions([])
        return
      }

      // 3. Query role from `roles` table to get role_id
      const { data: roleData, error: roleErr } = await supabase
        .from('roles')
        .select('id, name')
        .ilike('name', userRole)
        .maybeSingle()

      if (roleErr) {
        console.warn('[usePermissions] Error querying roles table:', roleErr.message)
      } else {
        console.log('[usePermissions] Role record matching:', roleData)
      }

      if (roleData?.id) {
        // 4. Query permission assignments from `role_permissions`
        const { data: rolePermsData, error: rolePermErr } = await supabase
          .from('role_permissions')
          .select('permission_id')
          .eq('role_id', roleData.id)

        if (!rolePermErr && rolePermsData && rolePermsData.length > 0) {
          const grantedIds: number[] = rolePermsData.map((rp: any) => rp.permission_id)

          // 5. Filter the permissions table records matching grantedIds from DB
          const matchedPerms: PermissionRow[] = availablePerms.length > 0
            ? availablePerms.filter((p) => grantedIds.includes(p.id))
            : await (async () => {
                const { data: directQuery } = await supabase
                  .from('permissions')
                  .select('*')
                  .in('id', grantedIds)
                return (directQuery as PermissionRow[]) || []
              })()

          console.log('[usePermissions] Resolved active permissions:', matchedPerms.map((p) => p.name))
          setPermissions(matchedPerms)
        } else {
          console.log('[usePermissions] No entries in role_permissions for role_id:', roleData.id)
          setPermissions([])
        }
      } else {
        setPermissions([])
      }
      console.groupEnd()
    } catch (err) {
      console.error('[usePermissions] Unexpected error loading permissions:', err)
      console.groupEnd()
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPermissions()
  }, [user])

  // Pure DB permission check helper by (resource, action)
  const hasPermission = (resource: string, action: string): boolean => {
    if (!permissions || permissions.length === 0) return false

    return permissions.some(
      (p) =>
        p.resource?.toLowerCase() === resource.toLowerCase() &&
        p.action?.toLowerCase() === action.toLowerCase()
    )
  }

  // Pure DB permission check helper by permission name
  const hasPermissionName = (name: string): boolean => {
    if (!permissions || permissions.length === 0) return false

    return permissions.some((p) => p.name?.toLowerCase() === name.toLowerCase())
  }

  // Check if current user is an administrator or super_admin
  const isSuperAdmin = (role || '').toLowerCase() === 'super_admin'
  const isAdmin = (role || '').toLowerCase() === 'admin'
  const isOfficer = (role || '').toLowerCase() === 'officer'
  const isPrivileged = isSuperAdmin || isAdmin

  // Capabilities derived from database permissions and role mapping
  const canCreateGrievance =
    isPrivileged ||
    isOfficer ||
    role === 'user' ||
    hasPermission('grievances', 'create') ||
    hasPermission('grievances', 'insert') ||
    hasPermissionName('create_grievance') ||
    hasPermissionName('grievances:create') ||
    hasPermissionName('file_grievance') ||
    !role // Allow authenticated users to file by default

  const canEditGrievance =
    isPrivileged ||
    isOfficer ||
    hasPermission('grievances', 'update') ||
    hasPermission('grievances', 'edit') ||
    hasPermissionName('edit_grievance') ||
    hasPermissionName('update_grievance') ||
    hasPermissionName('grievances:update')

  const canEditStatus =
    isPrivileged ||
    isOfficer ||
    hasPermission('grievances', 'update_status') ||
    hasPermission('grievances', 'edit_status') ||
    hasPermissionName('edit_status') ||
    hasPermissionName('update_status') ||
    hasPermissionName('grievances:status')

  const canDeleteGrievance =
    isPrivileged ||
    hasPermission('grievances', 'delete') ||
    hasPermissionName('delete_grievance') ||
    hasPermissionName('grievances:delete')

  const canViewAllGrievances =
    isPrivileged ||
    isOfficer ||
    hasPermission('grievances', 'read') ||
    hasPermission('grievances', 'view_all') ||
    hasPermissionName('view_all_grievances')

  return {
    role,
    permissions,
    allPermissions,
    loading,
    hasPermission,
    hasPermissionName,
    canCreateGrievance,
    canEditGrievance,
    canEditStatus,
    canDeleteGrievance,
    canViewAllGrievances,
    refreshPermissions: fetchPermissions,
  }
}

export default usePermissions
