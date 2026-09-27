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
 * Strictly checks role_permissions from the database.
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

    // Action synonyms if resource matches
    if (pResource === targetResource) {
      if (
        (targetAction === 'view' || targetAction === 'read' || targetAction === 'select' || targetAction === 'view_all') &&
        (pAction === 'view' || pAction === 'read' || pAction === 'select' || pAction === 'view_all')
      ) {
        return true
      }
      if (
        (targetAction === 'add' || targetAction === 'create' || targetAction === 'insert') &&
        (pAction === 'add' || pAction === 'create' || pAction === 'insert')
      ) {
        return true
      }
      if (
        (targetAction === 'edit' || targetAction === 'update') &&
        (pAction === 'edit' || pAction === 'update')
      ) {
        return true
      }
      if (
        (targetAction === 'delete' || targetAction === 'remove') &&
        (pAction === 'delete' || pAction === 'remove')
      ) {
        return true
      }
      if (
        (targetAction === 'edit_status' || targetAction === 'update_status' || targetAction === 'edit' || targetAction === 'status') &&
        (pAction === 'edit_status' || pAction === 'update_status' || pAction === 'status')
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
 * Checks if user has permission to edit grievance details.
 * Matches: resource="grievances" action="edit", or name="Edit Grievances".
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
    hasPermission(permissions, 'grievances', 'edit status') ||
    hasPermission(permissions, 'grievances', 'edit_status') ||
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
 * Checks if user has permission to manage block coordinators.
 * Matches: resource="block_coordinators" action="add/edit/delete", or name="Manage Coordinators".
 */
export const checkCanManageCoordinators = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'block_coordinators', 'add') ||
    hasPermission(permissions, 'block_coordinators', 'insert') ||
    hasPermission(permissions, 'block_coordinators', 'edit') ||
    hasPermission(permissions, 'block_coordinators', 'update') ||
    hasPermission(permissions, 'block_coordinators', 'delete') ||
    hasPermissionName(permissions, 'Manage Coordinators') ||
    hasPermissionName(permissions, 'manage_coordinators')
  )
}

/**
 * Checks if user has permission to view block coordinators.
 * Matches: resource="block_coordinators" action="view", or name="View Coordinators".
 */
export const checkCanViewCoordinators = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'block_coordinators', 'view') ||
    hasPermission(permissions, 'block_coordinators', 'read') ||
    hasPermission(permissions, 'block_coordinators', 'select') ||
    hasPermissionName(permissions, 'View Coordinators') ||
    hasPermissionName(permissions, 'view_coordinators')
  )
}
