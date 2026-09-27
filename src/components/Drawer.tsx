import React, { useEffect, useState } from 'react'
import {
  X,
  Shield,
  Home,
  LayoutDashboard,
  Inbox,
  Settings,
  Users,
  User,
  AlertCircle,
  FileText,
  BarChart,
  BarChart2,
  BarChart3,
  Activity,
  Clock,
  HelpCircle,
  Bell,
  Layers,
  MessageSquare,
  ListTodo,
  LogOut,
  ChevronRight,
  Folder,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { RouteData, RoleRouteItem, DrawerProps } from '../types'

// Icon dictionary mapping database icon keys to Lucide icons
const iconMap: Record<string, LucideIcon> = {
  home: Home,
  dashboard: LayoutDashboard,
  'layout-dashboard': LayoutDashboard,
  inbox: Inbox,
  settings: Settings,
  users: Users,
  user: User,
  shield: Shield,
  alert: AlertCircle,
  'alert-circle': AlertCircle,
  file: FileText,
  'file-text': FileText,
  files: Folder,
  folder: Folder,
  report: BarChart3,
  reports: BarChart3,
  analytics: BarChart2,
  charts: BarChart,
  activity: Activity,
  clock: Clock,
  history: Clock,
  help: HelpCircle,
  'help-circle': HelpCircle,
  bell: Bell,
  notifications: Bell,
  messages: MessageSquare,
  complaints: Inbox,
  grievances: Inbox,
  tasks: ListTodo,
}

const resolveIcon = (iconName?: string): LucideIcon => {
  if (!iconName) return Layers
  const key = iconName.toLowerCase().trim().replace(/_/g, '-')
  return iconMap[key] || Layers
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  currentPath = '/',
  onNavigate,
}) => {
  const { user, signOutUser } = useAuth()
  const [role, setRole] = useState<string | null>(null)
  const [routes, setRoutes] = useState<RouteData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchUserRoutes = async () => {
      if (!user) {
        if (isMounted) {
          setRole(null)
          setRoutes([])
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)

        // 1. Fetch user profile for role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('firebase_uid, role')
          .eq('firebase_uid', user.uid)
          .maybeSingle()

        if (profileError) {
          console.error('[Drawer] Profile fetch error:', profileError)
          if (isMounted) {
            setRole(null)
            setRoutes([])
            setLoading(false)
          }
          return
        }

        if (!profile?.role) {
          console.warn('[Drawer] No role assigned to user:', user.uid)
          if (isMounted) {
            setRole(null)
            setRoutes([])
            setLoading(false)
          }
          return
        }

        if (isMounted) {
          setRole(profile.role)
        }

        // 2. Fetch role routes
        const { data: roleRoutes, error: routesError } = await supabase
          .from('role_routes')
          .select(`
            route_id,
            routes (
              name,
              path,
              icon,
              sort_order
            )
          `)
          .eq('role', profile.role)
          .order('sort_order', { referencedTable: 'routes', ascending: true })

        if (routesError) {
          console.error('[Drawer] Routes fetch error:', routesError)
          if (isMounted) setRoutes([])
        } else if (roleRoutes && isMounted) {
          // Normalize routes array
          const parsedRoutes: RouteData[] = (roleRoutes as unknown as RoleRouteItem[])
            .map((item) => (Array.isArray(item.routes) ? item.routes[0] : item.routes))
            .filter((r): r is RouteData => r !== null && typeof r === 'object')

          setRoutes(parsedRoutes)
        }
      } catch (err) {
        console.error('[Drawer] Unexpected error loading navigation:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchUserRoutes()

    return () => {
      isMounted = false
    }
  }, [user])

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
                {user?.email ? user.email.charAt(0) : 'U'}
              </div>
              <div className="text-xs min-w-0">
                <p className="font-semibold text-darkblue dark:text-offwhite truncate">
                  {user?.email || 'Authenticated User'}
                </p>
                <p className="text-gray text-[11px] capitalize">{role || 'Citizen'}</p>
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
