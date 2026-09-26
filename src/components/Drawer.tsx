import React from 'react'
import { X, Shield } from 'lucide-react'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose }) => {
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
        className={`fixed inset-0 bg-darkblue/40 dark:bg-black/60 backdrop-blur-xs z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer sidebar panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-white dark:bg-[#1a1d2e] border-r border-gray/20 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar Navigation"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-darkblue dark:bg-orange flex items-center justify-center text-offwhite shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-darkblue dark:text-offwhite leading-tight">
                Grievance Portal
              </h2>
              <p className="text-xs text-gray">Admin Dashboard</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray hover:text-darkblue dark:hover:text-offwhite hover:bg-gray/10 dark:hover:bg-gray/20 transition-colors focus:outline-none"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Navigation Content - Kept blank for now as requested */}
        <nav className="flex-1 p-6 overflow-y-auto">
          {/* Blank navigation section for future routes */}
          <div className="h-full flex items-center justify-center border-2 border-dashed border-gray/20 rounded-2xl p-4 text-center">
            <span className="text-xs font-medium text-gray/70">
              Drawer navigation items will appear here
            </span>
          </div>
        </nav>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-gray/20">
          <div className="p-3 rounded-2xl bg-offwhite dark:bg-[#20243a] border border-gray/15 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-lightblue/20 text-lightblue flex items-center justify-center font-bold text-xs">
              GD
            </div>
            <div className="text-xs truncate">
              <p className="font-semibold text-darkblue dark:text-offwhite truncate">
                Grievance Management
              </p>
              <p className="text-gray text-[11px] truncate">v1.0.0</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Drawer
