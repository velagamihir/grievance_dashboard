import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  X,
  Shield,
  LogOut,
  ChevronRight,
  Layers,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import { supabase } from '../lib/supabase'
import { resolveIcon } from '../utils'
import type { RouteData, RoleRouteItem, DrawerProps } from '../types'

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  currentPath = '/',
  onNavigate,
}) => {
  const { user, signOutUser } = useAuth()
  const {
    role: permRole,
    displayName: permDisplayName,
    permissions,
    isSuperAdmin,
    canViewAllGrievances,
    canCreateGrievance,
    canEditGrievance,
    canEditStatus,
    canDeleteGrievance,
    canViewCoordinators,
    canCreateCoordinator,
    canEditCoordinator,
    canDeleteCoordinator,
    canViewRoles,
    canCreateRole,
    canEditRole,
    canChangePermissions,
    canDeleteRole,
    canViewUsers,
    canCreateUser,
    canEditUser,
    canDeleteUser,
    canViewTasks,
    canCreateTask,
    canEditTask,
    canDeleteTask,
    canUpdateTaskStatus,
    loading: permissionsLoading,
  } = usePermissions()

  const [role, setRole] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [rawRoutes, setRawRoutes] = useState<RouteData[]>([])
  const [loading, setLoading] = useState(true)

  // Determine if user has at least one permission in a given route category
  const isRoutePermitted = useCallback(
    (route: RouteData): boolean => {
      if (isSuperAdmin) return true

      const p = (route.path || '').toLowerCase().trim()
      const name = (route.name || '').toLowerCase().trim()

      // 1. Dashboard / Home - general access
      if (
        p === '/' ||
        p === '/dashboard' ||
        p.includes('dashboard') ||
        name.includes('dashboard') ||
        name.includes('home')
      ) {
        return true
      }

      // 2. Grievances category
      if (
        p === '/grievances' ||
        p === '/grievance' ||
        p === '/complaints' ||
        p.includes('grievance') ||
        name.includes('grievance')
      ) {
        const hasGrievancePerms =
          canViewAllGrievances ||
          canCreateGrievance ||
          canEditGrievance ||
          canEditStatus ||
          canDeleteGrievance ||
          permissions.some((perm) => (perm.resource || '').toLowerCase().trim() === 'grievances')
        return hasGrievancePerms
      }

      // 3. Block Coordinators category
      if (
        p === '/block_coordinators' ||
        p === '/block-coordinators' ||
        p.includes('coordinator') ||
        name.includes('coordinator')
      ) {
        const hasCoordinatorPerms =
          canViewCoordinators ||
          canCreateCoordinator ||
          canEditCoordinator ||
          canDeleteCoordinator ||
          permissions.some(
            (perm) =>
              (perm.resource || '').toLowerCase().trim() === 'block_coordinators' ||
              (perm.resource || '').toLowerCase().trim() === 'coordinators'
          )
        return hasCoordinatorPerms
      }

      // 4. Roles & Permissions category
      if (
        p === '/roles' ||
        p === '/permissions' ||
        p.includes('role') ||
        name.includes('role') ||
        name.includes('permission')
      ) {
        const hasRolePerms =
          canViewRoles ||
          canCreateRole ||
          canEditRole ||
          canChangePermissions ||
          canDeleteRole ||
          permissions.some(
            (perm) =>
              (perm.resource || '').toLowerCase().trim() === 'roles' ||
              (perm.resource || '').toLowerCase().trim() === 'permissions'
          )
        return hasRolePerms
      }

      // 5. Users category
      if (p === '/users' || p.includes('user') || name.includes('user')) {
        const hasUsersPerms =
          canViewUsers ||
          canCreateUser ||
          canEditUser ||
          canDeleteUser ||
          permissions.some((perm) => (perm.resource || '').toLowerCase().trim() === 'users')
        return hasUsersPerms
      }

      // 6. Work Assignments / Tasks category
      if (
        p === '/tasks' ||
        p === '/works' ||
        p.includes('task') ||
        p.includes('work') ||
        name.includes('task') ||
        name.includes('work')
      ) {
        const hasTasksPerms =
          canViewTasks ||
          canCreateTask ||
          canEditTask ||
          canDeleteTask ||
          canUpdateTaskStatus ||
          permissions.some(
            (perm) =>
              (perm.resource || '').toLowerCase().trim() === 'tasks' ||
              (perm.resource || '').toLowerCase().trim() === 'works'
          )
        return hasTasksPerms
      }

      // 7. Generic resource match from path or name
      const resourceKey = p.replace(/^\//, '').replace(/[_\s-]+/g, '_')
      if (resourceKey) {
        const hasResourcePerm = permissions.some((perm) => {
          const pRes = (perm.resource || '').toLowerCase().replace(/[_\s-]+/g, '_').trim()
          return pRes === resourceKey || pRes.startsWith(resourceKey) || resourceKey.startsWith(pRes)
        })
        return hasResourcePerm
      }

      return false
    },
    [
      isSuperAdmin,
      canViewAllGrievances,
      canCreateGrievance,
      canEditGrievance,
      canEditStatus,
      canDeleteGrievance,
      canViewCoordinators,
      canCreateCoordinator,
      canEditCoordinator,
      canDeleteCoordinator,
      canViewRoles,
      canCreateRole,
      canEditRole,
      canChangePermissions,
      canDeleteRole,
      canViewUsers,
      canCreateUser,
      canEditUser,
      canDeleteUser,
      canViewTasks,
      canCreateTask,
      canEditTask,
      canDeleteTask,
      canUpdateTaskStatus,
      permissions,
    ]
  )

  // Filtered routes based on active category permissions
  const routes = useMemo(() => {
    return rawRoutes.filter(isRoutePermitted)
  }, [rawRoutes, isRoutePermitted])

  useEffect(() => {
    let isMounted = true

    const fetchUserRoutes = async () => {
      if (!user) {
        if (isMounted) {
          setRole(null)
          setRawRoutes([])
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)

        // 1. Fetch user profile for assigned role and display name
        const { data: profile } = await supabase
          .from('profiles')
          .select('firebase_uid, role, display_name')
          .eq('firebase_uid', user.uid)
          .maybeSingle()

        const userRole = profile?.role || permRole || null
        const userDisplayName = profile?.display_name || permDisplayName || user.displayName || null
        if (isMounted) {
          setRole(userRole)
          setDisplayName(userDisplayName)
        }

        let resolvedRoutes: RouteData[] = []

        // 2. If user has an assigned role, query role_routes
        if (userRole) {
          const { data: roleRoutes, error: routesError } = await supabase
            .from('role_routes')
            .select(`
              route_id,
              role,
              routes (
                id,
                name,
                path,
                icon,
                sort_order
              )
            `)
            .ilike('role', userRole)

          if (!routesError && roleRoutes && roleRoutes.length > 0) {
            const parsed = (roleRoutes as unknown as RoleRouteItem[])
              .map((item) => (Array.isArray(item.routes) ? item.routes[0] : item.routes))
              .filter((r): r is RouteData => r !== null && typeof r === 'object')
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

            resolvedRoutes = parsed
          }
        }

        // Include Users Management route candidate if user is admin / super_admin or has users permission
        const normalizedRole = userRole?.toLowerCase().trim() || ''
        const isAdmin = normalizedRole === 'super_admin' || normalizedRole === 'admin'
        if ((isAdmin || canViewUsers) && !resolvedRoutes.some((r) => r.path === '/users')) {
          resolvedRoutes.push({
            name: 'Users Management',
            path: '/users',
            icon: 'users',
            sort_order: 98,
          })
        }

        // Include Roles & Permissions route candidate if user is admin / super_admin
        if (isAdmin && !resolvedRoutes.some((r) => r.path === '/roles')) {
          resolvedRoutes.push({
            name: 'Roles & Permissions',
            path: '/roles',
            icon: 'shield',
            sort_order: 99,
          })
        }

        // Include Work Assignments route candidate if permitted
        if ((isAdmin || canViewTasks) && !resolvedRoutes.some((r) => r.path === '/tasks')) {
          resolvedRoutes.push({
            name: 'Work Assignments',
            path: '/tasks',
            icon: 'clipboard-list',
            sort_order: 4,
          })
        }

        if (isMounted) {
          setRawRoutes(resolvedRoutes)
        }
      } catch {
        if (isMounted) {
          setRawRoutes([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (!permissionsLoading) {
      fetchUserRoutes()
    }

    return () => {
      isMounted = false
    }
  }, [user, permRole, permissionsLoading, canViewUsers])

  const handleItemClick = (path: string) => {
    if (onNavigate) {
      onNavigate(path)
    }
    onClose()
  }

  const formattedRole = role
    ? role.charAt(0).toUpperCase() + role.slice(1)
    : 'User'

  return (
    <>
      {/* Backdrop overlay for mobile & tablet */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Close navigation drawer"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onClose()
        }}
        className={`fixed inset-0 bg-darkblue/40 dark:bg-black/70 backdrop-blur-xs z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer sidebar panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-[#1a1d2e] border-r border-gray/20 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar Navigation"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray/15 dark:border-gray/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-darkblue to-lightblue dark:from-orange dark:to-orange/80 flex items-center justify-center text-offwhite shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-darkblue dark:text-offwhite leading-tight">
                Grievance Portal
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[11px] font-medium text-gray dark:text-gray/80 tracking-wide uppercase">
                  {formattedRole} Mode
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray hover:text-darkblue dark:hover:text-offwhite hover:bg-gray/10 dark:hover:bg-gray/20 transition-colors focus:outline-none focus:ring-2 focus:ring-lightblue/30"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Navigation Content */}
        <nav className="flex-1 px-4 py-5 overflow-y-auto space-y-1.5">
          <div className="px-3 pb-2">
            <p className="text-[11px] font-semibold tracking-wider text-gray/70 uppercase">
              Navigation Menu
            </p>
          </div>

          {loading ? (
            // Skeleton Loader while fetching
            <div className="space-y-2.5 px-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-11 rounded-xl bg-gray/10 dark:bg-gray/15 animate-pulse"
                />
              ))}
            </div>
          ) : routes.length === 0 ? (
            // Empty state
            <div className="py-12 px-4 text-center border-2 border-dashed border-gray/15 rounded-2xl">
              <Layers className="w-8 h-8 mx-auto text-gray/40 mb-2" />
              <p className="text-xs font-semibold text-darkblue dark:text-offwhite">
                No routes configured
              </p>
              <p className="text-[11px] text-gray mt-1">
                No accessible pages assigned for role &quot;{role || 'unknown'}&quot;.
              </p>
            </div>
          ) : (
            // Dynamic Routes from Supabase
            routes.map((route, index) => {
              const IconComponent = resolveIcon(route.icon)
              const isActive = currentPath === route.path

              return (
                <button
                  key={`${route.path}-${index}`}
                  type="button"
                  onClick={() => handleItemClick(route.path)}
                  className={`w-full group flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lightblue/30 ${
                    isActive
                      ? 'bg-darkblue text-offwhite dark:bg-orange dark:text-darkblue shadow-sm'
                      : 'text-darkblue/80 dark:text-offwhite/80 hover:bg-gray/10 dark:hover:bg-gray/15 hover:text-darkblue dark:hover:text-offwhite'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`p-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-white/15 dark:bg-darkblue/15 text-offwhite dark:text-darkblue'
                          : 'bg-gray/10 dark:bg-gray/20 text-gray group-hover:text-darkblue dark:group-hover:text-offwhite'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span className="truncate">{route.name}</span>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isActive
                        ? 'opacity-80 translate-x-0.5'
                        : 'opacity-30 group-hover:opacity-70 group-hover:translate-x-0.5'
                    }`}
                  />
                </button>
              )
            })
          )}
        </nav>

        {/* Drawer Footer with User Info and Sign Out */}
        <div className="p-4 border-t border-gray/15 dark:border-gray/10 space-y-3 bg-offwhite/50 dark:bg-[#151726]/40">
          <div className="p-3 rounded-2xl bg-white dark:bg-[#20243a] border border-gray/15 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-lightblue/20 text-lightblue dark:bg-orange/20 dark:text-orange flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                {displayName ? displayName.charAt(0) : user?.email ? user.email.charAt(0) : 'U'}
              </div>
              <div className="text-xs min-w-0">
                <p className="font-semibold text-darkblue dark:text-offwhite truncate">
                  {displayName || user?.email || 'Authenticated User'}
                </p>
                {displayName && user?.email ? (
                  <p className="text-gray text-[10px] truncate">{user.email}</p>
                ) : (
                  <p className="text-gray text-[11px] capitalize">{role || 'Citizen'}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                signOutUser()
                onClose()
              }}
              title="Sign out"
              className="p-1.5 rounded-lg text-gray hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors focus:outline-none"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Drawer
