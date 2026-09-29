import type { PermissionRow } from '../types'

/**
 * Normalizes string for robust, case-insensitive, punctuation-insensitive matching.
 */
const normalize = (str?: string | null): string => {
  if (!str) return ''
  return str.toLowerCase().replace(/[_\s-]+/g, '_').trim()
}

/**
 * Checks if a user's role-assigned permissions array contains a permission matching resource and action.
 * Strictly distinguishes between full edits and status-only edits.
 */
export const hasPermission = (
  permissions: PermissionRow[] | null | undefined,
  resource: string,
  action: string
): boolean => {
  if (!permissions || permissions.length === 0) return false

  const targetResource = normalize(resource)
  const targetAction = normalize(action)

  return permissions.some((p) => {
    const pResource = normalize(p.resource)
    const pAction = normalize(p.action)

    // Exact normalized match
    if (pResource === targetResource && pAction === targetAction) {
      return true
    }

    if (pResource === targetResource) {
      // 1. View / Read
      if (
        (targetAction === 'view' || targetAction === 'read' || targetAction === 'select' || targetAction === 'view_all') &&
        (pAction === 'view' || pAction === 'read' || pAction === 'select' || pAction === 'view_all')
      ) {
        return true
      }

      // 2. Add / Create / Insert / Manage
      if (
        (targetAction === 'add' || targetAction === 'create' || targetAction === 'insert' || targetAction === 'manage') &&
        (pAction === 'add' || pAction === 'create' || pAction === 'insert' || pAction === 'manage')
      ) {
        return true
      }

      // 3. Edit / Update whole record (strictly NOT status-only edits)
      if (
        (targetAction === 'edit' || targetAction === 'update') &&
        (pAction === 'edit' || pAction === 'update')
      ) {
        return true
      }

      // 4. Delete / Remove
      if (
        (targetAction === 'delete' || targetAction === 'remove') &&
        (pAction === 'delete' || pAction === 'remove')
      ) {
        return true
      }

      // 5. Status-only Edit
      if (
        (targetAction === 'edit_status' || targetAction === 'update_status') &&
        (pAction === 'edit_status' || pAction === 'update_status')
      ) {
        return true
      }
    }

    return false
  })
}

/**
 * Checks if a user's role-assigned permissions array contains a permission by exact or normalized name.
 * Strictly checks role_permissions from the database.
 */
export const hasPermissionName = (
  permissions: PermissionRow[] | null | undefined,
  name: string
): boolean => {
  if (!permissions || permissions.length === 0) return false

  const target = normalize(name)

  return permissions.some((p) => {
    const pName = normalize(p.name)
    return pName === target
  })
}

/**
 * Checks if user has permission to view grievances.
 * Matches: resource="grievances" action="view", or name="View Grievances".
 */
export const checkCanViewAllGrievances = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'grievances', 'view') ||
    hasPermission(permissions, 'grievances', 'read') ||
    hasPermission(permissions, 'grievances', 'select') ||
    hasPermissionName(permissions, 'View Grievances') ||
    hasPermissionName(permissions, 'view_grievances')
  )
}

/**
 * Checks if user has permission to create/add grievances.
 * Matches: resource="grievances" action="add", or name="Add Grievances".
 */
export const checkCanCreateGrievance = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'grievances', 'add') ||
    hasPermission(permissions, 'grievances', 'create') ||
    hasPermission(permissions, 'grievances', 'insert') ||
    hasPermissionName(permissions, 'Add Grievances') ||
    hasPermissionName(permissions, 'Create Grievances') ||
    hasPermissionName(permissions, 'create_grievance')
  )
}

/**
 * Checks if user has permission to edit grievance details (entire record).
 * Matches strictly: resource="grievances" action="edit", or name="Edit Grievances".
 * Does NOT match status-only permission.
 */
export const checkCanEditGrievance = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'grievances', 'edit') ||
    hasPermission(permissions, 'grievances', 'update') ||
    hasPermissionName(permissions, 'Edit Grievances') ||
    hasPermissionName(permissions, 'edit_grievance')
  )
}

/**
 * Checks if user has permission to update grievance status.
 * Matches: resource="grievances" action="edit status", or name="Edit Status Grievances".
 */
export const checkCanEditStatus = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'grievances', 'edit_status') ||
    hasPermission(permissions, 'grievances', 'edit status') ||
    hasPermission(permissions, 'grievances', 'update_status') ||
    hasPermissionName(permissions, 'Edit Status Grievances') ||
    hasPermissionName(permissions, 'edit_status_grievances')
  )
}

/**
 * Checks if user has permission to delete grievances.
 * Matches: resource="grievances" action="delete", or name="Delete Grievances".
 */
export const checkCanDeleteGrievance = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'grievances', 'delete') ||
    hasPermissionName(permissions, 'Delete Grievances') ||
    hasPermissionName(permissions, 'delete_grievance')
  )
}

/**
 * Helper to check if a role is super_admin. Only super_admin has unconditional bypass.
 */
export const isSuperAdmin = (role?: string | null): boolean => {
  if (!role) return false
  const r = normalize(role)
  return r === 'super_admin' || r === 'superadmin'
}

/**
 * Helper to check if a role is admin or super_admin.
 */
export const isAdminOrSuperAdmin = (role?: string | null): boolean => {
  if (!role) return false
  const r = normalize(role)
  return r === 'super_admin' || r === 'superadmin' || r === 'admin'
}

/**
 * Checks if user has permission to create/add/manage block coordinators.
 * Matches ONLY permission 'Manage Coordinators' / 'Add Coordinators' / action='add'|'create'|'insert'|'manage' on resource 'block_coordinators'.
 */
export const checkCanCreateCoordinator = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'block_coordinators', 'add') ||
    hasPermission(permissions, 'block_coordinators', 'create') ||
    hasPermission(permissions, 'block_coordinators', 'insert') ||
    hasPermission(permissions, 'block_coordinators', 'manage') ||
    hasPermissionName(permissions, 'Add Coordinators') ||
    hasPermissionName(permissions, 'Manage Coordinators') ||
    hasPermissionName(permissions, 'Add Block Coordinators') ||
    hasPermissionName(permissions, 'add_coordinators') ||
    hasPermissionName(permissions, 'manage_coordinators') ||
    hasPermissionName(permissions, 'add_block_coordinator')
  )
}

export const checkCanAddCoordinator = checkCanCreateCoordinator
export const checkCanManageCoordinators = checkCanCreateCoordinator

/**
 * Checks if user has permission to edit block coordinators.
 * Matches ONLY permission 'Edit Coordinators' / action='edit'|'update' on resource 'block_coordinators'.
 */
export const checkCanEditCoordinator = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'block_coordinators', 'edit') ||
    hasPermission(permissions, 'block_coordinators', 'update') ||
    hasPermissionName(permissions, 'Edit Coordinators') ||
    hasPermissionName(permissions, 'Edit Block Coordinators') ||
    hasPermissionName(permissions, 'edit_coordinators') ||
    hasPermissionName(permissions, 'edit_block_coordinator')
  )
}

/**
 * Checks if user has permission to delete block coordinators.
 * Matches ONLY permission 'Delete Coordinators' / action='delete'|'remove' on resource 'block_coordinators'.
 */
export const checkCanDeleteCoordinator = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'block_coordinators', 'delete') ||
    hasPermission(permissions, 'block_coordinators', 'remove') ||
    hasPermissionName(permissions, 'Delete Coordinators') ||
    hasPermissionName(permissions, 'Delete Block Coordinators') ||
    hasPermissionName(permissions, 'delete_coordinators') ||
    hasPermissionName(permissions, 'delete_block_coordinator')
  )
}

/**
 * Checks if user has permission to view block coordinators.
 * Matches permission 'View Coordinators' / action='view'|'read'|'select' on resource='block_coordinators' | 'coordinators'.
 */
export const checkCanViewCoordinators = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'block_coordinators', 'view') ||
    hasPermission(permissions, 'coordinators', 'view') ||
    hasPermission(permissions, 'block_coordinators', 'read') ||
    hasPermission(permissions, 'coordinators', 'read') ||
    hasPermissionName(permissions, 'View Coordinators') ||
    hasPermissionName(permissions, 'View Block Coordinators') ||
    hasPermissionName(permissions, 'view_coordinators') ||
    hasPermissionName(permissions, 'view_block_coordinators')
  )
}

/**
 * Checks if user has permission to view roles and permissions.
 */
export const checkCanViewRoles = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'roles', 'view') ||
    hasPermission(permissions, 'roles', 'read') ||
    hasPermission(permissions, 'users', 'view') ||
    hasPermissionName(permissions, 'View Roles') ||
    hasPermissionName(permissions, 'View Users') ||
    hasPermissionName(permissions, 'view_roles')
  )
}

/**
 * Checks if user has permission to create/add new roles.
 */
export const checkCanCreateRole = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'roles', 'add') ||
    hasPermission(permissions, 'roles', 'create') ||
    hasPermission(permissions, 'roles', 'insert') ||
    hasPermission(permissions, 'users', 'add') ||
    hasPermissionName(permissions, 'Add Roles') ||
    hasPermissionName(permissions, 'Add Users') ||
    hasPermissionName(permissions, 'create_role')
  )
}

/**
 * Checks if user has permission to edit role details.
 */
export const checkCanEditRole = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'roles', 'edit') ||
    hasPermission(permissions, 'roles', 'update') ||
    hasPermission(permissions, 'users', 'edit') ||
    hasPermissionName(permissions, 'Edit Roles') ||
    hasPermissionName(permissions, 'Edit Users') ||
    hasPermissionName(permissions, 'edit_role')
  )
}

/**
 * Checks if user has permission to manage/change role permissions.
 */
export const checkCanManagePermissions = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'permissions', 'edit') ||
    hasPermission(permissions, 'permissions', 'update') ||
    hasPermission(permissions, 'role_permissions', 'manage') ||
    hasPermission(permissions, 'roles', 'edit') ||
    hasPermission(permissions, 'users', 'edit') ||
    hasPermissionName(permissions, 'Manage Permissions') ||
    hasPermissionName(permissions, 'Edit Permissions') ||
    hasPermissionName(permissions, 'Edit Roles') ||
    hasPermissionName(permissions, 'manage_permissions')
  )
}

/**
 * Checks if user has permission to delete roles.
 */
export const checkCanDeleteRole = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'roles', 'delete') ||
    hasPermission(permissions, 'roles', 'remove') ||
    hasPermission(permissions, 'users', 'delete') ||
    hasPermissionName(permissions, 'Delete Roles') ||
    hasPermissionName(permissions, 'Delete Users') ||
    hasPermissionName(permissions, 'delete_role')
  )
}

/**
 * Checks if user has permission to trigger Grievance Workflow 1 (Action 1).
 * Matches: resource="grievances" action="trigger_workflow_1" | "trigger_workflow", or name="Trigger Workflow 1".
 */
export const checkCanTriggerWorkflow1 = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'grievances', 'trigger_workflow_1') ||
    hasPermission(permissions, 'grievances', 'trigger_workflow') ||
    hasPermission(permissions, 'grievances', 'trigger_action') ||
    hasPermissionName(permissions, 'Trigger Workflow 1') ||
    hasPermissionName(permissions, 'Trigger Grievance Action 1') ||
    hasPermissionName(permissions, 'trigger_workflow_1')
  )
}

/**
 * Checks if user has permission to trigger Grievance Workflow 2 (Action 2).
 * Matches: resource="grievances" action="trigger_workflow_2" | "trigger_workflow", or name="Trigger Workflow 2".
 */
export const checkCanTriggerWorkflow2 = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'grievances', 'trigger_workflow_2') ||
    hasPermission(permissions, 'grievances', 'trigger_workflow') ||
    hasPermission(permissions, 'grievances', 'trigger_action') ||
    hasPermissionName(permissions, 'Trigger Workflow 2') ||
    hasPermissionName(permissions, 'Trigger Grievance Action 2') ||
    hasPermissionName(permissions, 'trigger_workflow_2')
  )
}

/**
 * Generic check if user has permission to trigger grievance workflows.
 */
export const checkCanTriggerWorkflows = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    checkCanTriggerWorkflow1(permissions) ||
    checkCanTriggerWorkflow2(permissions) ||
    hasPermission(permissions, 'grievances', 'trigger_workflow') ||
    hasPermissionName(permissions, 'Trigger Workflow Actions')
  )
}


