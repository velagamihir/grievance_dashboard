import { useState, useEffect } from 'react'
import {
  Menu,
  Sun,
  Moon,
  LogOut,
  Inbox,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  User as UserIcon,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/Buttons'
import { Drawer } from '../components/Drawer'
import type { HomeProps, DashboardStatItem, FormResponseRow } from '../types'

export const Home = ({
  isDark,
  onToggleTheme,
  currentPath = '/',
  onNavigate,
}: HomeProps) => {
  const { user, signOutUser } = useAuth()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [grievances, setGrievances] = useState<FormResponseRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGrievances = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('form_responses')
        .select('*')
        .order('id', { ascending: false })

      if (error) {
        console.error('[Home] Error fetching grievances from DB:', error.message)
        setGrievances([])
      } else {
        setGrievances(data || [])
      }
    } catch (err) {
      console.error('[Home] Unexpected error fetching grievances:', err)
      setGrievances([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGrievances()
  }, [])

  // Dynamic statistics calculated directly from Supabase form_responses
  const totalCount = grievances.length
  const pendingCount = grievances.filter(
    (g) => (g.status || '').toLowerCase() === 'pending'
  ).length
  const inProgressCount = grievances.filter((g) => {
    const s = (g.status || '').toLowerCase()
    return s === 'in progress' || s === 'under review'
  }).length
  const resolvedCount = grievances.filter(
    (g) => (g.status || '').toLowerCase() === 'resolved'
  ).length

  const stats: DashboardStatItem[] = [
    {
      title: 'Total Grievances',
      count: totalCount.toString(),
      change: `${totalCount} records logged in DB`,
      icon: Inbox,
      color: 'bg-lightblue/15 text-lightblue dark:bg-lightblue/25',
    },
    {
      title: 'Pending Review',
      count: pendingCount.toString(),
      change: `${pendingCount} awaiting initial review`,
      icon: Clock,
      color: 'bg-orange/15 text-orange dark:bg-orange/25',
    },
    {
      title: 'In Progress',
      count: inProgressCount.toString(),
      change: `${inProgressCount} currently being handled`,
      icon: AlertCircle,
      color: 'bg-darkblue/15 text-darkblue dark:bg-darkblue/40 dark:text-offwhite',
    },
    {
      title: 'Resolved',
      count: resolvedCount.toString(),
      change: `${resolvedCount} resolved successfully`,
      icon: CheckCircle2,
      color: 'bg-green-500/15 text-green-600 dark:bg-green-500/25 dark:text-green-400',
    },
  ]

  const recentGrievances = grievances.slice(0, 6)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const getStatusBadgeClass = (status: string | null) => {
    const s = (status || '').toLowerCase()
    if (s === 'resolved') {
      return 'bg-green-500/15 text-green-600 dark:bg-green-500/25 dark:text-green-400'
    }
    if (s === 'in progress' || s === 'under review') {
      return 'bg-lightblue/15 text-lightblue dark:bg-lightblue/25'
    }
    if (s === 'rejected') {
      return 'bg-red-500/15 text-red-600 dark:bg-red-500/25 dark:text-red-400'
    }
    return 'bg-orange/15 text-orange dark:bg-orange/25'
  }

  return (
    <div className="min-h-screen bg-offwhite dark:bg-[#151726] text-darkblue dark:text-offwhite transition-colors duration-200">
      {/* Navigation Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentPath={currentPath}
        onNavigate={onNavigate}
      />

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#1a1d2e]/80 backdrop-blur-md border-b border-gray/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 rounded-xl text-darkblue dark:text-offwhite hover:bg-gray/10 dark:hover:bg-gray/20 transition-colors focus:outline-none"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div>
              <h1 className="text-lg font-bold text-darkblue dark:text-offwhite leading-none">
                Grievance Dashboard
              </h1>
              <p className="text-xs text-gray mt-0.5 hidden sm:block">
                Overview &amp; Incident Resolution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-xl bg-offwhite dark:bg-[#20243a] border border-gray/20 text-darkblue dark:text-offwhite hover:bg-gray/10 dark:hover:bg-gray/20 transition-colors focus:outline-none"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5 text-orange" /> : <Moon className="w-5 h-5 text-darkblue" />}
            </button>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-offwhite dark:bg-[#20243a] border border-gray/15 text-xs text-gray">
              <UserIcon className="w-3.5 h-3.5 text-lightblue" />
              <span className="max-w-[150px] truncate font-medium text-darkblue dark:text-offwhite">
                {user?.email || 'User'}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => signOutUser()}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-darkblue via-[#4a5494] to-lightblue p-6 sm:p-8 text-offwhite shadow-xl shadow-darkblue/10">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs">
              <TrendingUp className="w-3.5 h-3.5 text-orange" />
              Real-time Grievance Analytics
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.email?.split('@')[0] || 'User'}
            </h2>
            <p className="text-sm sm:text-base text-offwhite/85">
              Live overview of active grievances, resolution status, and logged complaints queried directly from the database.
            </p>
          </div>

          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
            <Inbox className="w-64 h-64 text-white" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="bg-white dark:bg-[#20243a] p-6 rounded-3xl border border-gray/20 shadow-sm hover:shadow-md transition-shadow space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray uppercase tracking-wider">
                    {item.title}
                  </span>
                  <div className={`p-2.5 rounded-2xl ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-darkblue dark:text-offwhite">
                    {loading ? '...' : item.count}
                  </div>
                  <p className="text-xs text-gray mt-1">{item.change}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Grievance Management Section */}
        <div className="bg-white dark:bg-[#20243a] rounded-3xl border border-gray/20 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-darkblue dark:text-offwhite">
                Recent Grievances
              </h3>
              <p className="text-xs sm:text-sm text-gray mt-0.5">
                Latest grievances logged in the system
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchGrievances}
                isLoading={loading}
                leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigate && onNavigate('/grievances')}
              >
                Manage All
              </Button>
            </div>
          </div>

          {/* Grievance Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray/20 text-xs font-semibold text-gray uppercase tracking-wider">
                  <th className="pb-3 pl-2">ID</th>
                  <th className="pb-3">Type &amp; Subject</th>
                  <th className="pb-3">Submitted By</th>
                  <th className="pb-3">Branch / Location</th>
                  <th className="pb-3">Reported</th>
                  <th className="pb-3 pr-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray/15">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray text-xs">
                      Loading grievances from database...
                    </td>
                  </tr>
                ) : recentGrievances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray text-xs">
                      No grievances found in database.
                    </td>
                  </tr>
                ) : (
                  recentGrievances.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-offwhite/60 dark:hover:bg-[#1a1d2e]/60 transition-colors"
                    >
                      <td className="py-4 pl-2 font-mono text-xs font-bold text-lightblue">
                        #{item.id}
                      </td>
                      <td className="py-4">
                        <div className="font-semibold text-darkblue dark:text-offwhite line-clamp-1 max-w-xs">
                          {item.type_of_grievance || 'General Grievance'}
                        </div>
                        {item.problem_description && (
                          <div className="text-xs text-gray line-clamp-1 max-w-sm mt-0.5">
                            {item.problem_description}
                          </div>
                        )}
                      </td>
                      <td className="py-4 text-xs text-darkblue dark:text-offwhite">
                        <div>{item.name || 'Anonymous'}</div>
                        <div className="text-gray text-[11px]">{item.email || '-'}</div>
                      </td>
                      <td className="py-4 text-gray text-xs">
                        {item.branch || item.room_no_and_block_name || item.bus_route || '-'}
                      </td>
                      <td className="py-4 text-gray text-xs">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="py-4 pr-2">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${getStatusBadgeClass(
                            item.status
                          )}`}
                        >
                          {item.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home
