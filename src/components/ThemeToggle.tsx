import React from 'react'
import { Sun, Moon } from 'lucide-react'

export interface ThemeToggleProps {
  isDark: boolean
  onToggleTheme: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  isDark,
  onToggleTheme,
  className = '',
  size = 'md',
}) => {
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'
  const paddingClass = size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-2.5' : 'p-2'

  return (
    <button
      type="button"
      onClick={onToggleTheme}
      className={`rounded-xl bg-offwhite dark:bg-[#20243a] border border-gray/20 text-darkblue dark:text-offwhite hover:bg-gray/10 dark:hover:bg-gray/20 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-lightblue/50 ${paddingClass} ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light Mode' : 'Dark Mode'}
    >
      {isDark ? (
        <Sun className={`${iconSize} text-orange transition-transform duration-200 hover:rotate-45`} />
      ) : (
        <Moon className={`${iconSize} text-darkblue transition-transform duration-200 hover:-rotate-12`} />
      )}
    </button>
  )
}

export default ThemeToggle
