import type { InputHTMLAttributes, ButtonHTMLAttributes, ReactNode, ComponentType } from 'react'
import type { User } from 'firebase/auth'
import type { LucideIcon } from 'lucide-react'

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

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  size?: InputSize
  fullWidth?: boolean
  containerClassName?: string
}

export type InputCardVariant = 'card' | 'embedded' | 'flat' | 'bordered'

export interface InputCardFieldOption {
  label: string
  value: string
}

export interface InputCardField {
  name: string
  label?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'textarea' | 'select'
  placeholder?: string
  defaultValue?: string
  value?: string
  onChange?: (value: string) => void
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  rows?: number
  options?: (string | InputCardFieldOption)[]
  colSpan?: 1 | 2 | 3 | 'full'
  className?: string
}

export interface InputCardProps {
  title?: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  iconBgColor?: string
  iconColor?: string
  fields?: InputCardField[]
  values?: Record<string, string>
  onChange?: (name: string, value: string) => void
  errors?: Record<string, string>
  onSubmit?: (e: React.FormEvent, values: Record<string, string>) => void | Promise<void>
  onCancel?: () => void
  onReset?: () => void
  submitButtonText?: ReactNode
  cancelButtonText?: ReactNode
  resetButtonText?: ReactNode
  submitIcon?: ReactNode
  showCancel?: boolean
  showReset?: boolean
  isLoading?: boolean
  disabled?: boolean
  variant?: InputCardVariant
  actions?: ReactNode
  children?: ReactNode
  className?: string
  headerClassName?: string
  bodyClassName?: string
  footerClassName?: string
  alert?: { type: 'success' | 'error' | 'info'; message: string } | null
}

export interface AddGrievanceCardProps {
  initialData?: Partial<GrievanceFormData>
  onSubmit?: (data: GrievanceFormData) => Promise<void> | void
  onSuccess?: (createdRecord: FormResponseRow) => void
  onCancel?: () => void
  title?: string
  subtitle?: string
  icon?: ReactNode
  showCancel?: boolean
  submitButtonText?: string
  className?: string
  variant?: InputCardVariant
  autoFocus?: boolean
  readOnlyStatus?: boolean
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

export interface ListProps<T = Record<string, unknown>> {
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

export interface GrievancePageProps {
  isDark: boolean
  onToggleTheme: () => void
  currentPath?: string
  onNavigate?: (path: string) => void
}

export interface GrievanceFormData {
  name: string
  email: string
  type_of_grievance: string
  problem_description: string
  branch: string
  section: string
  year: string
  room_no_and_block_name: string
  bus_route: string
  bus_number: string
  suggestions: string
  status: string
  source: string
}


export interface BlockCoordinatorsProps {
  isDark: boolean
  onToggleTheme: () => void
  currentPath?: string
  onNavigate?: (path: string) => void
}

export interface RolesPageProps {
  isDark: boolean
  onToggleTheme: () => void
  currentPath?: string
  onNavigate?: (path: string) => void
}

export interface RoleWithPermissions extends RoleRow {
  permissionIds: number[]
  permissions: PermissionRow[]
  assignedUsersCount?: number
}

export interface CreateRoleFormData {
  name: string
  description: string
  permissionIds: number[]
}

export interface UpdateRoleFormData {
  name: string
  description: string
}

export interface RoleStatItem {
  title: string
  count: string | number
  change: string
  icon: ComponentType<{ className?: string }>
  color: string
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

export interface UsersPageProps {
  isDark: boolean
  onToggleTheme: () => void
  currentPath?: string
  onNavigate?: (path: string) => void
}

export interface UserItem {
  firebase_uid: string
  email: string
  displayName?: string | null
  role: string
  roleDescription?: string | null
  createdAt?: string | null
  isCurrentUser?: boolean
}

export interface CreateUserFormData {
  email: string
  password: string
  displayName?: string
  role: string
}

export interface UpdateUserRoleFormData {
  firebase_uid: string
  role: string
  email?: string
  displayName?: string
}

export type UpdateUserFormData = UpdateUserRoleFormData

export interface UserStatItem {
  title: string
  count: string | number
  change: string
  icon: ComponentType<{ className?: string }>
  color: string
}

export interface UsersToast {
  type: 'success' | 'error' | 'info'
  message: string
}

// ==========================================
// Form Validation Types
// ==========================================

export interface LocationValidationData {
  room_no_and_block_name?: string | null
  bus_route?: string | null
  bus_number?: string | null
}

export interface LocationValidationResult {
  isValid: boolean
  error: string | null
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
  errorMessage: string | null
}

// ==========================================
// Database Schema Types (Supabase Public Tables)
// ==========================================

export interface BlockCoordinatorRow {
  name: string | null
  block: string | null
  phone_no: string | null
}

export interface FormResponseRow {
  id: number
  created_at: string | null
  email: string | null
  name: string | null
  type_of_grievance: string | null
  bus_route: string | null
  bus_number: string | null
  problem_description: string | null
  branch: string | null
  section: string | null
  year: string | null
  room_no_and_block_name: string | null
  suggestions: string | null
  status: string | null
  source: string | null
}

export interface PermissionRow {
  id: number
  name: string
  resource: string
  action: string
  description: string | null
  created_at: string
}

export interface ProfileRow {
  firebase_uid: string
  role: string
  email?: string | null
  display_name?: string | null
  created_at?: string | null
}

export interface RolePermissionRow {
  role_id: number
  permission_id: number
}

export interface RoleRouteRow {
  role: string
  route_id: number
}

export interface RoleRow {
  id: number
  name: string
  description: string | null
  created_at: string
}

export interface RouteRow {
  id: number
  name: string
  path: string
  icon: string | null
  sort_order: number | null
}

export interface SourceRow {
  id: number
  source_name: string
}

export interface TaskRow {
  id: number
  title: string
  description: string | null
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled'
  due_date: string | null
  assigned_to_all: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface TaskAssignmentRow {
  id: number
  task_id: number
  user_uid: string
  status: 'Pending' | 'In Progress' | 'Completed'
  notes: string | null
  completed_at: string | null
  created_at: string
}

export interface TaskAssignmentWithUser extends TaskAssignmentRow {
  userProfile?: ProfileRow | null
}

export interface TaskWithAssignments extends TaskRow {
  assignments: TaskAssignmentWithUser[]
  creatorProfile?: ProfileRow | null
  myAssignment?: TaskAssignmentRow | null
  completedCount: number
  totalAssignedCount: number
}

export interface CreateTaskFormData {
  title: string
  description?: string
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  due_date?: string | null
  assigned_to_all: boolean
  assigned_uids: string[]
}

export interface UpdateTaskFormData {
  id: number
  title: string
  description?: string
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled'
  due_date?: string | null
  assigned_to_all: boolean
  assigned_uids: string[]
}

export interface UpdateAssignmentStatusFormData {
  taskId: number
  userUid?: string
  status: 'Pending' | 'In Progress' | 'Completed'
  notes?: string
}

export interface TaskStatItem {
  title: string
  count: number
  change: string
  icon: LucideIcon
  color: string
}

export interface TasksToast {
  message: string
  type: 'success' | 'error' | 'info'
}

export interface TasksPageProps {
  isDark: boolean
  onToggleTheme: () => void
  currentPath?: string
  onNavigate?: (path: string) => void
}

export interface DatabaseSchema {
  block_coordinators: BlockCoordinatorRow
  form_responses: FormResponseRow
  permissions: PermissionRow
  profiles: ProfileRow
  role_permissions: RolePermissionRow
  role_routes: RoleRouteRow
  roles: RoleRow
  routes: RouteRow
  sources: SourceRow
  tasks: TaskRow
  task_assignments: TaskAssignmentRow
}


