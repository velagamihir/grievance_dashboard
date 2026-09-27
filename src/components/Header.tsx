import React from 'react'
import { Menu, LogOut, Shield, User as UserIcon } from 'lucide-react'
import { Button } from './Buttons'
import { ThemeToggle } from './ThemeToggle'

export interface HeaderProps {
  title: string
  subtitle?: string
  isDark: boolean
  onToggleTheme: () => void
  onOpenDrawer?: () => void
  role?: string | null
  userEmail?: string | null
  onSignOut?: () => void
  rightActions?: React.ReactNode
  showDrawerButton?: boolean
  className?: string
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  isDark,
  onToggleTheme,
  onOpenDrawer,
  role,
  userEmail,
  onSignOut,
  rightActions,
  showDrawerButton = true,
  className = '',
}) => {
  return (
    <header
      className={`sticky top-0 z-30 bg-white/80 dark:bg-[#1a1d2e]/80 backdrop-blur-md border-b border-gray/20 transition-colors duration-200 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Side: Drawer Toggle + Title & Subtitle */}
        <div className="flex items-center gap-4">
          {showDrawerButton && onOpenDrawer && (
            <button
              type="button"
              onClick={onOpenDrawer}
              className="p-2 rounded-xl text-darkblue dark:text-offwhite hover:bg-gray/10 dark:hover:bg-gray/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-lightblue/50"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}

          <div>
            <h1 className="text-lg font-bold text-darkblue dark:text-offwhite leading-none">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-gray mt-0.5 hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Role Badge + Extra Actions + Theme Toggle + User Info + Sign Out */}
        <div className="flex items-center gap-3">
          {role && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-lightblue/10 dark:bg-orange/15 text-xs font-semibold text-lightblue dark:text-orange border border-lightblue/20 dark:border-orange/20">
              <Shield className="w-3.5 h-3.5" />
              <span className="capitalize">{role}</span>
            </div>
          )}

          {rightActions}

          <ThemeToggle isDark={isDark} onToggleTheme={onToggleTheme} />

          {userEmail && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-offwhite dark:bg-[#20243a] border border-gray/15 text-xs text-gray">
              <UserIcon className="w-3.5 h-3.5 text-lightblue" />
              <span className="max-w-[150px] truncate font-medium text-darkblue dark:text-offwhite">
                {userEmail}
              </span>
            </div>
          )}

          {onSignOut && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSignOut}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Sign Out
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
