import { useState, type FormEvent } from 'react'
import { User, Lock, Eye, EyeOff } from 'lucide-react'
import { TextInput } from '../components/TextInput'
import { Button } from '../components/Buttons'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { LoginFormState, LoginFormErrors, LoginProps } from '../types'
import logoImg from '../assets/images/logos/logo.png'

export const Login = ({ onSuccess, onForgotPassword }: LoginProps) => {
  useDocumentTitle('Sign In | Grievance Portal')
  const { signIn } = useAuth()
  const [formData, setFormData] = useState<LoginFormState>({
    username: '',
    password: '',
  })
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const validate = (): boolean => {
    const newErrors: LoginFormErrors = {}

    if (!formData.username.trim()) {
      newErrors.username = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.username.trim())) {
      newErrors.username = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const mapFirebaseError = (code: string): string => {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password'
      case 'auth/invalid-email':
        return 'Invalid email address format'
      case 'auth/user-disabled':
        return 'This account has been disabled'
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later'
      default:
        return 'Failed to sign in. Please check your credentials'
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    setErrors({})
    try {
      const user = await signIn(formData.username.trim(), formData.password)
      if (user?.uid && user?.email) {
        try {
          await supabase
            .from('profiles')
            .update({ email: user.email })
            .eq('firebase_uid', user.uid)
        } catch {
          // Ignore profile sync error on login
        }
      }
      onSuccess?.(user)
    } catch (err: unknown) {
      const firebaseError = err as { code?: string }
      setErrors({
        general: mapFirebaseError(firebaseError.code || ''),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-6 bg-offwhite dark:bg-[#151726] transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#20243a] rounded-2xl sm:rounded-3xl shadow-xl shadow-darkblue/5 dark:shadow-black/30 border border-gray/20 p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8">
        <div className="flex flex-col items-center text-center space-y-3.5 sm:space-y-4">
          <img
            src={logoImg}
            alt="Grievance Council Logo"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-contain shadow-md bg-darkblue/5 dark:bg-white/5 p-1"
          />

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-darkblue dark:text-offwhite tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm text-gray mt-1">
              Sign in to manage and track grievances
            </p>
          </div>
        </div>

        {errors.general && (
          <div className="p-3.5 rounded-xl bg-orange/10 border border-orange/20 text-orange text-xs font-medium">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <TextInput
            label="Email"
            id="username"
            name="username"
            type="email"
            placeholder="email"
            value={formData.username}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, username: e.target.value }))
              if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }))
            }}
            error={errors.username}
            fullWidth
            leftIcon={<User className="w-4 h-4" />}
          />

          <div>
            <TextInput
              label="Password"
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, password: e.target.value }))
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
              }}
              error={errors.password}
              fullWidth
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="pointer-events-auto p-1 text-gray hover:text-darkblue dark:hover:text-offwhite focus:outline-none transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div className="flex justify-end text-xs mt-2">
              <button
                type="button"
                onClick={() => onForgotPassword?.(formData.username.trim())}
                className="font-medium text-lightblue hover:underline focus:outline-none"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>
      </div>
    </div>
  )
}

export default Login
