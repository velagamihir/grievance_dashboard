import type { InputHTMLAttributes, ButtonHTMLAttributes, ReactNode, ComponentType } from 'react'
import type { User } from 'firebase/auth'

// ==========================================
// UI Component Types
// ==========================================

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'dark'

export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

export type InputSize = 'sm' | 'md' | 'lg'

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  size?: InputSize
  fullWidth?: boolean
  containerClassName?: string
}

export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  currentPath?: string
  onNavigate?: (path: string) => void
}

// ==========================================
// List Component Types
// ==========================================

export type ListVariant = 'divided' | 'card' | 'spaced' | 'bordered' | 'flush'
export type ListItemVariant = 'default' | 'card' | 'bordered' | 'flush'
export type ListItemSize = 'sm' | 'md' | 'lg'
export type ListBadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'orange' | 'lightblue' | 'darkblue'

export interface ListBadgeProps {
  children: ReactNode
  variant?: ListBadgeVariant
  size?: 'sm' | 'md'
  icon?: ReactNode
  className?: string
}

export interface ListItemProps {
  title: ReactNode
  subtitle?: ReactNode
  description?: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
  meta?: ReactNode
  onClick?: () => void
  href?: string
  selected?: boolean
  disabled?: boolean
  variant?: ListItemVariant
  size?: ListItemSize
  className?: string
  badge?: ReactNode
}

export interface ListPaginationProps {
  currentPage: number
  totalPages: number
  totalItems?: number
  pageSize?: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  className?: string
  showPageNumbers?: boolean
}

export interface ListFilterOption {
  label: string
  value: string
  count?: number
}

export interface ListFilterProps {
  options: (string | ListFilterOption)[]
  selectedValue: string
  onSelect: (value: string) => void
  className?: string
}

export interface ListEmptyStateProps {
  icon?: ReactNode
  title?: string
  description?: string
  action?: ReactNode
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export interface ListHeaderProps {
  title?: ReactNode
  subtitle?: ReactNode
  count?: number | string
  searchQuery?: string
  onSearchChange?: (query: string) => void
  searchPlaceholder?: string
  filterOptions?: (string | ListFilterOption)[]
  selectedFilter?: string
  onFilterSelect?: (filter: string) => void
  actions?: ReactNode
  className?: string
}

export interface ListProps<T = any> {
  items?: T[]
  renderItem?: (item: T, index: number) => ReactNode
  keyExtractor?: (item: T, index: number) => string | number
  children?: ReactNode
  header?: ReactNode
  footer?: ReactNode
  title?: ReactNode
  subtitle?: ReactNode
  count?: number | string
  searchable?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  searchPlaceholder?: string
  searchKeys?: (keyof T)[]
  filterOptions?: (string | ListFilterOption)[]
  selectedFilter?: string
  onFilterSelect?: (filter: string) => void
  filterFn?: (item: T, filter: string) => boolean
  headerActions?: ReactNode
  isLoading?: boolean
  loadingRows?: number
  skeleton?: ReactNode
  emptyState?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
  emptyActionLabel?: string
  onEmptyAction?: () => void
  pagination?: boolean | ListPaginationProps
  pageSize?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  variant?: ListVariant
  layout?: 'list' | 'grid'
  gridCols?: 1 | 2 | 3 | 4 | { sm?: number; md?: number; lg?: number }
  className?: string
  containerClassName?: string
  itemClassName?: string
  onItemClick?: (item: T, index: number) => void
}

// ==========================================
// Auth & User Profile Types
// ==========================================

export interface LoginFormState {
  username: string
  password: string
}

export interface LoginFormErrors {
  username?: string
  password?: string
  general?: string
}

export interface LoginProps {
  onSuccess?: (user: User) => void
  onForgotPassword?: (email?: string) => void
}

export interface ForgotPasswordProps {
  initialEmail?: string
  onBackToLogin?: () => void
  onSuccess?: (email: string) => void
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, pass: string) => Promise<User>
  signOutUser: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

export type UserRole = 'admin' | 'officer' | 'citizen' | string

export interface UserProfile {
  firebase_uid: string
  role: UserRole
}

// ==========================================
// Routing & Navigation Types
// ==========================================

export interface MainRouterProps {
  isDark: boolean
  onToggleTheme: () => void
}

export interface RouteData {
  name: string
  path: string
  icon: string
  sort_order?: number
}

export interface RoleRouteItem {
  route_id: number | string
  routes: RouteData | RouteData[] | null
}

export interface NavRouteItem {
  id: string
  label: string
  path: string
  iconName?: string
  description?: string
}

export interface UserRBACProfile {
  role: UserRole
  allowedRoutes: string[]
}

export interface RBACContextType {
  role: UserRole | null
  allowedRoutes: string[]
  loading: boolean
  hasAccess: (routeId: string) => boolean
  setRoleAndRoutes: (role: UserRole, allowedRoutes: string[]) => void
}

// ==========================================
// Page Specific Types
// ==========================================

export interface HomeProps {
  isDark: boolean
  onToggleTheme: () => void
  currentPath?: string
  onNavigate?: (path: string) => void
}

export interface DashboardStatItem {
  title: string
  count: string
  change: string
  icon: ComponentType<{ className?: string }>
  color: string
}

export interface RecentGrievanceItem {
  id: string
  title: string
  department: string
  date: string
  priority: 'Low' | 'Medium' | 'High' | string
  status: 'Pending' | 'In Progress' | 'Resolved' | string
}

export interface BlockCoordinatorsProps {
  isDark: boolean
  onToggleTheme: () => void
  currentPath?: string
  onNavigate?: (path: string) => void
}

export interface Coordinator {
  id: string
  name: string
  block: string
  zone: string
  email: string
  phone: string
  activeGrievances: number
  resolvedCount: number
  status: 'Active' | 'On Leave' | 'Busy'
  avatarUrl?: string
}

export interface CoordinatorStatItem {
  title: string
  count: string
  change: string
  icon: ComponentType<{ className?: string }>
  color: string
}
