import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Login } from './pages/Login'
import { ForgotPassword } from './pages/ForgotPassword'
import { Home } from './pages/Home'
import { BlockCoordinators } from './pages/BlockCoordinators'
import { GrievancePage } from './pages/GrievancePage'
import type { MainRouterProps } from './types'

function MainRouter({ isDark, onToggleTheme }: MainRouterProps) {
  const { user, loading } = useAuth()
  const [authView, setAuthView] = useState<'login' | 'forgot-password'>('login')
  const [resetEmail, setResetEmail] = useState('')
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/')

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleNavigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
    }
    setCurrentPath(path)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-offwhite dark:bg-[#151726]">
        <div className="w-10 h-10 border-4 border-lightblue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="relative min-h-screen bg-offwhite dark:bg-[#151726] transition-colors duration-200">
        {/* Floating Theme Toggle on Auth Screens */}
        <div className="fixed top-4 right-4 z-50">
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2.5 rounded-2xl bg-white dark:bg-[#20243a] border border-gray/20 shadow-md text-darkblue dark:text-offwhite hover:bg-gray/10 dark:hover:bg-gray/20 transition-all duration-150 focus:outline-none"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5 text-orange" /> : <Moon className="w-5 h-5 text-darkblue" />}
          </button>
        </div>

        {authView === 'forgot-password' ? (
          <ForgotPassword
            initialEmail={resetEmail}
            onBackToLogin={() => setAuthView('login')}
            onSuccess={() => setAuthView('login')}
          />
        ) : (
          <Login
            onForgotPassword={(email) => {
              if (email) setResetEmail(email)
              setAuthView('forgot-password')
            }}
          />
        )}
      </div>
    )
  }

  if (
    currentPath === '/grievances' ||
    currentPath === '/grievance' ||
    currentPath === '/complaints' ||
    currentPath.startsWith('/grievances') ||
    currentPath.startsWith('/grievance')
  ) {
    return (
      <GrievancePage
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        currentPath={currentPath}
        onNavigate={handleNavigate}
      />
    )
  }

  if (
    currentPath === '/block_coordinators' ||
    currentPath === '/block-coordinators' ||
    currentPath.startsWith('/block_coordinators')
  ) {
    return (
      <BlockCoordinators
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        currentPath={currentPath}
        onNavigate={handleNavigate}
      />
    )
  }

  return (
    <Home
      isDark={isDark}
      onToggleTheme={onToggleTheme}
      currentPath={currentPath}
      onNavigate={handleNavigate}
    />
  )
}

export function App() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  const toggleTheme = () => setIsDark((prev) => !prev)

  return (
    <AuthProvider>
      <MainRouter isDark={isDark} onToggleTheme={toggleTheme} />
    </AuthProvider>
  )
}

export default App
