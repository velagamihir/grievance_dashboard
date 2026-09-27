import { useState, type FormEvent } from 'react'
import { KeyRound, Mail, ArrowLeft, CheckCircle2, RotateCw } from 'lucide-react'
import { TextInput } from '../components/TextInput'
import { Button } from '../components/Buttons'
import { useAuth } from '../context/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { ForgotPasswordProps } from '../types'

export const ForgotPassword = ({ initialEmail = '', onBackToLogin, onSuccess }: ForgotPasswordProps) => {
  useDocumentTitle('Reset Password | Grievance Portal')
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState<string | undefined>()
  const [generalError, setGeneralError] = useState<string | undefined>()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const validate = (): boolean => {
    if (!email.trim()) {
      setError('Email is required')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address')
      return false
    }
    setError(undefined)
    return true
  }

  const mapFirebaseError = (code: string): string => {
    switch (code) {
      case 'auth/user-not-found':
        return 'No account found with this email address'
      case 'auth/invalid-email':
        return 'Invalid email address format'
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again in a few minutes'
      case 'auth/network-request-failed':
        return 'Network connection error. Please check your internet connection'
      default:
        return 'Failed to send password reset email. Please try again'
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setGeneralError(undefined)
    if (!validate()) return

    setIsLoading(true)
    try {
      await resetPassword(email.trim().toLowerCase())
      setIsSubmitted(true)
      onSuccess?.(email.trim().toLowerCase())
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string }
      setGeneralError(mapFirebaseError(firebaseError.code || ''))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setGeneralError(undefined)
    setResendSuccess(false)
    setIsResending(true)
    try {
      await resetPassword(email.trim().toLowerCase())
      setResendSuccess(true)
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string }
      setGeneralError(mapFirebaseError(firebaseError.code || ''))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-6 bg-offwhite dark:bg-[#151726] transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#20243a] rounded-2xl sm:rounded-3xl shadow-xl shadow-darkblue/5 dark:shadow-black/30 border border-gray/20 p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8">
        {isSubmitted ? (
          <div className="text-center space-y-5 sm:space-y-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-lightblue/15 text-lightblue mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-darkblue dark:text-offwhite tracking-tight">
                Check Your Email
              </h1>
              <p className="text-sm text-gray leading-relaxed">
                We've sent password reset instructions to{' '}
                <span className="font-semibold text-darkblue dark:text-offwhite">{email}</span>.
              </p>
              <p className="text-xs text-gray/80">
                Be sure to check your <strong>Spam / Junk</strong> folder or Promotions tab if you don't see it in your inbox.
              </p>
            </div>

            {resendSuccess && (
              <div className="p-3 rounded-xl bg-lightblue/10 border border-lightblue/20 text-lightblue text-xs font-medium">
                Reset link resent successfully!
              </div>
            )}

            {generalError && (
              <div className="p-3.5 rounded-xl bg-orange/10 border border-orange/20 text-orange text-xs font-medium">
                {generalError}
              </div>
            )}

            <div className="pt-2 space-y-3">
              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={onBackToLogin}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Sign In
              </Button>

              <div className="flex justify-center">
                <button
                  type="button"
                  disabled={isResending}
                  onClick={handleResend}
                  className="inline-flex items-center gap-1.5 text-xs text-lightblue hover:underline font-medium disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  {isResending ? 'Sending...' : "Didn't receive email? Resend"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-darkblue dark:bg-orange flex items-center justify-center shadow-md transition-colors">
                <KeyRound className="w-9 h-9 text-offwhite" />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-darkblue dark:text-offwhite tracking-tight">
                  Reset Password
                </h1>
                <p className="text-sm text-gray mt-1">
                  Enter your email to receive password reset instructions
                </p>
              </div>
            </div>

            {generalError && (
              <div className="p-3.5 rounded-xl bg-orange/10 border border-orange/20 text-orange text-xs font-medium">
                {generalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <TextInput
                label="Email"
                id="reset-email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError(undefined)
                }}
                error={error}
                fullWidth
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                isLoading={isLoading}
              >
                Send Reset Link
              </Button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onBackToLogin}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray hover:text-darkblue dark:hover:text-offwhite transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
