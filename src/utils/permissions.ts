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
 * Checks if user has permission to view users.
 */
export const checkCanViewUsers = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'users', 'view') ||
    hasPermission(permissions, 'users', 'read') ||
    hasPermission(permissions, 'users', 'select') ||
    hasPermissionName(permissions, 'View Users') ||
    hasPermissionName(permissions, 'view_users')
  )
}

/**
 * Checks if user has permission to create/add new users.
 */
export const checkCanCreateUser = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'users', 'add') ||
    hasPermission(permissions, 'users', 'create') ||
    hasPermission(permissions, 'users', 'insert') ||
    hasPermissionName(permissions, 'Add Users') ||
    hasPermissionName(permissions, 'Create Users') ||
    hasPermissionName(permissions, 'create_user') ||
    hasPermissionName(permissions, 'add_user')
  )
}

export const checkCanAddUser = checkCanCreateUser

/**
 * Checks if user has permission to edit user details / roles.
 */
export const checkCanEditUser = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'users', 'edit') ||
    hasPermission(permissions, 'users', 'update') ||
    hasPermissionName(permissions, 'Edit Users') ||
    hasPermissionName(permissions, 'edit_user')
  )
}

/**
 * Checks if user has permission to delete users.
 */
export const checkCanDeleteUser = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'users', 'delete') ||
    hasPermission(permissions, 'users', 'remove') ||
    hasPermissionName(permissions, 'Delete Users') ||
    hasPermissionName(permissions, 'delete_user')
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
    hasPermission(permissions, 'permissions', 'view') ||
    hasPermission(permissions, 'permissions', 'read') ||
    hasPermissionName(permissions, 'View Roles') ||
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
    hasPermissionName(permissions, 'Add Roles') ||
    hasPermissionName(permissions, 'Create Roles') ||
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
    hasPermissionName(permissions, 'Edit Roles') ||
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
    hasPermission(permissions, 'role_permissions', 'edit') ||
    hasPermission(permissions, 'role_permissions', 'update') ||
    hasPermissionName(permissions, 'Manage Permissions') ||
    hasPermissionName(permissions, 'Edit Permissions') ||
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
    hasPermissionName(permissions, 'Delete Roles') ||
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

/**
 * Checks if user has permission to view tasks / works.
 */
export const checkCanViewTasks = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'tasks', 'view') ||
    hasPermission(permissions, 'tasks', 'read') ||
    hasPermission(permissions, 'works', 'view') ||
    hasPermission(permissions, 'works', 'read') ||
    hasPermissionName(permissions, 'View Works') ||
    hasPermissionName(permissions, 'View Tasks') ||
    hasPermissionName(permissions, 'view_tasks') ||
    hasPermissionName(permissions, 'view_works')
  )
}

/**
 * Checks if user has permission to create/assign new tasks / works.
 */
export const checkCanCreateTask = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'tasks', 'add') ||
    hasPermission(permissions, 'tasks', 'create') ||
    hasPermission(permissions, 'tasks', 'insert') ||
    hasPermission(permissions, 'works', 'add') ||
    hasPermission(permissions, 'works', 'create') ||
    hasPermissionName(permissions, 'Create Works') ||
    hasPermissionName(permissions, 'Add Works') ||
    hasPermissionName(permissions, 'Create Tasks') ||
    hasPermissionName(permissions, 'Add Tasks') ||
    hasPermissionName(permissions, 'create_tasks') ||
    hasPermissionName(permissions, 'create_task')
  )
}

/**
 * Checks if user has permission to edit tasks / works.
 */
export const checkCanEditTask = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'tasks', 'edit') ||
    hasPermission(permissions, 'tasks', 'update') ||
    hasPermission(permissions, 'works', 'edit') ||
    hasPermission(permissions, 'works', 'update') ||
    hasPermissionName(permissions, 'Edit Works') ||
    hasPermissionName(permissions, 'Edit Tasks') ||
    hasPermissionName(permissions, 'edit_tasks') ||
    hasPermissionName(permissions, 'edit_task')
  )
}

/**
 * Checks if user has permission to delete tasks / works.
 */
export const checkCanDeleteTask = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'tasks', 'delete') ||
    hasPermission(permissions, 'tasks', 'remove') ||
    hasPermission(permissions, 'works', 'delete') ||
    hasPermission(permissions, 'works', 'remove') ||
    hasPermissionName(permissions, 'Delete Works') ||
    hasPermissionName(permissions, 'Delete Tasks') ||
    hasPermissionName(permissions, 'delete_tasks') ||
    hasPermissionName(permissions, 'delete_task')
  )
}

/**
 * Checks if user has permission to update task assignment status.
 */
export const checkCanUpdateTaskStatus = (
  permissions: PermissionRow[] | null | undefined
): boolean => {
  return (
    hasPermission(permissions, 'tasks', 'update_status') ||
    hasPermission(permissions, 'tasks', 'edit_status') ||
    hasPermission(permissions, 'tasks', 'edit') ||
    hasPermission(permissions, 'works', 'update_status') ||
    hasPermissionName(permissions, 'Update Work Status') ||
    hasPermissionName(permissions, 'Update Task Status') ||
    hasPermissionName(permissions, 'update_task_status')
  )
}

/**
 * Normalizes grievance category strings for robust keyword & prefix matching.
 */
export const normalizeCategory = (cat?: string | null): string => {
  if (!cat) return ''
  return cat.toLowerCase().replace(/[^a-z0-9]/g, '').trim()
}

/**
 * Returns canonical category identifier to prevent substring and keyword collisions.
 */
export const getCanonicalCategory = (raw?: string | null): string | null => {
  if (!raw) return null
  const str = raw.trim().toLowerCase()
  if (
    str === '' ||
    str === 'all' ||
    str === 'all types' ||
    str === 'all categories' ||
    str === 'unrestricted'
  ) {
    return null
  }

  // 1. Infrastructure (must be before generic terms)
  if (
    str.includes('infrastruct') ||
    str.includes('smart board') ||
    str.includes('smartboard') ||
    str.includes('lim') ||
    str.includes('benches') ||
    str.includes('fans') ||
    str.includes('lights') ||
    str.includes('classroom')
  ) {
    return 'infrastructure'
  }

  // 2. Hostel & Accommodation
  if (str.includes('hostel') || str.includes('accommodation') || str.includes('warden')) {
    return 'hostel'
  }

  // 3. Transport & Bus
  if (str.includes('transport') || str.includes('bus')) {
    return 'transport'
  }

  // 4. Sanitation & Cleanliness
  if (str.includes('clean') || str.includes('sanitat')) {
    return 'sanitation'
  }

  // 5. Academic & Faculty
  if (str.includes('acad') || str.includes('faculty') || str.includes('course') || str.includes('exam')) {
    return 'academic'
  }

  // 6. Water & Electricity
  if (str.includes('water') || str.includes('electric') || str.includes('power')) {
    return 'water_electricity'
  }

  // 7. Canteen & Mess
  if (str.includes('canteen') || str.includes('mess') || str.includes('food')) {
    return 'canteen_mess'
  }

  return normalizeCategory(str)
}

/**
 * Checks if a grievance type matches a role's allowed grievance type.
 * Returns true if allowedType is unrestricted (null, empty, 'all', 'all types')
 * or if there is an exact or canonical category match between the two.
 */
export const isMatchingGrievanceType = (
  allowedType?: string | null,
  grievanceType?: string | null
): boolean => {
  if (!allowedType) return true
  const normAllowed = allowedType.trim().toLowerCase()
  if (
    normAllowed === '' ||
    normAllowed === 'all' ||
    normAllowed === 'all types' ||
    normAllowed === 'all categories' ||
    normAllowed === 'unrestricted'
  ) {
    return true
  }

  if (!grievanceType) return false
  const normTarget = grievanceType.trim().toLowerCase()

  // 1. Direct equality
  if (normAllowed === normTarget) return true

  // 2. Normalized alphanumeric equality
  const cleanAllowed = normalizeCategory(normAllowed)
  const cleanTarget = normalizeCategory(normTarget)
  if (cleanAllowed && cleanTarget && cleanAllowed === cleanTarget) return true

  // 3. Canonical category resolution (eliminates substring false positives like 'ac' in 'academic')
  const canonAllowed = getCanonicalCategory(normAllowed)
  const canonTarget = getCanonicalCategory(normTarget)

  if (canonAllowed && canonTarget && canonAllowed === canonTarget) {
    return true
  }

  return false
}

/**
 * Infers grievance category from role name (e.g. 'hostel_warden' -> 'Hostel & Accommodation', 'lim' -> 'Infrastructure').
 */
export const inferGrievanceTypeFromRoleName = (roleName?: string | null): string | null => {
  if (!roleName) return null
  const r = roleName.trim().toLowerCase()

  // Built-in system roles that are not department-specific by name
  if (r === 'super_admin' || r === 'superadmin' || r === 'admin' || r === 'user' || r === 'citizen') {
    return null
  }

  if (r.includes('hostel') || r.includes('accommodation') || r.includes('warden')) {
    return 'Hostel'
  }
  if (r.includes('transport') || r.includes('bus')) {
    return 'Transport'
  }
  if (r.includes('sanitat') || r.includes('clean')) {
    return 'Cleanliness/Sanitization'
  }
  if (r.includes('acad') || r.includes('faculty')) {
    return 'Academic'
  }
  if (r.includes('lim') || r.includes('infrastruct') || r.includes('classroom')) {
    return "Infrastructure(lights, fans, ac's, Smart boards, benches)"
  }
  if (r.includes('canteen') || r.includes('mess')) {
    return 'Canteen & Mess'
  }
  if (r.includes('water') || r.includes('electric')) {
    return 'Water & Electricity'
  }

  return null
}

/**
 * Parses allowed grievance type from a role row, with fallback to metadata in description and role name inference.
 */
export const parseRoleAllowedGrievanceType = (
  roleRow?: { name?: string | null; allowed_grievance_type?: string | null; description?: string | null } | null
): string | null => {
  if (!roleRow) return null
  if (roleRow.allowed_grievance_type && roleRow.allowed_grievance_type.trim()) {
    const val = roleRow.allowed_grievance_type.trim()
    if (val.toLowerCase() === 'all' || val.toLowerCase() === 'all types') {
      return null
    }
    return val
  }

  // Fallback 1: Check if description contains "[Grievance Type: ...]" tag
  if (roleRow.description) {
    const match = roleRow.description.match(/\[(?:Grievance Type|Allowed Type|Category):\s*([^\]]+)\]/i)
    if (match && match[1]) {
      const parsed = match[1].trim()
      if (parsed.toLowerCase() !== 'all' && parsed.toLowerCase() !== 'all types') {
        return parsed
      }
    }
  }

  // Fallback 2: Infer from role name
  if (roleRow.name) {
    const inferred = inferGrievanceTypeFromRoleName(roleRow.name)
    if (inferred) return inferred
  }

  return null
}

/**
 * Checks if a user with a given role and allowed type can access (view/filter) a specific grievance.
 * If allowedGrievanceType is set, it strictly checks that the grievance belongs to that category.
 */
export const canRoleAccessGrievance = (
  role?: string | null,
  allowedGrievanceType?: string | null,
  grievanceType?: string | null
): boolean => {
  if (allowedGrievanceType) {
    return isMatchingGrievanceType(allowedGrievanceType, grievanceType)
  }
  // If no allowedGrievanceType restriction is set:
  if (isSuperAdmin(role) || isAdminOrSuperAdmin(role)) return true
  return true
}

/**
 * Checks if a user can update the status of a specific grievance.
 * If allowedGrievanceType is set, it strictly checks that the grievance belongs to that category.
 */
export const canRoleUpdateGrievanceStatus = (
  role?: string | null,
  allowedGrievanceType?: string | null,
  canEditStatusPermission: boolean = true,
  grievanceType?: string | null
): boolean => {
  if (!canEditStatusPermission) return false
  if (allowedGrievanceType) {
    return isMatchingGrievanceType(allowedGrievanceType, grievanceType)
  }
  // If no allowedGrievanceType restriction is set:
  if (isSuperAdmin(role) || isAdminOrSuperAdmin(role)) return true
  return true
}



