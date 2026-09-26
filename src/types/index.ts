import type { InputHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import type { User } from 'firebase/auth'

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
