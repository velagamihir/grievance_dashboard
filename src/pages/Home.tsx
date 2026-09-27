import { useState, useEffect, useMemo } from 'react'
import {
  Inbox,
  TrendingUp,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { supabase } from '../lib/supabase'
import { Button, Drawer, Header } from '../components'
import { formatDate, getStatusBadgeClass } from '../utils'
import type { HomeProps, DashboardStatItem, FormResponseRow } from '../types'

export const Home = ({
  isDark,
  onToggleTheme,
  currentPath = '/',
  onNavigate,
}: HomeProps) => {
  useDocumentTitle('Dashboard | Grievance Portal')
  const { user, signOutUser } = useAuth()
  const { role, canViewAllGrievances, loading: permissionsLoading } = usePermissions()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [grievances, setGrievances] = useState<FormResponseRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGrievances = async () => {
    if (!canViewAllGrievances) {
      setGrievances([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('form_responses')
        .select('*')
        .order('id', { ascending: false })

      if (error) {
        setGrievances([])
      } else {
        setGrievances(data || [])
      }
    } catch {
      setGrievances([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!permissionsLoading) {
      if (canViewAllGrievances) {
        fetchGrievances()
      } else {
        setGrievances([])
        setLoading(false)
      }
    }
  }, [permissionsLoading, canViewAllGrievances])

  // Dynamic statistics and recent list derived via extracted utils
  const stats = useMemo(() => calculateGrievanceStats(grievances), [grievances])
  const recentGrievances = useMemo(() => getRecentGrievances(grievances, 6), [grievances])
  const userDisplayName = useMemo(() => getUserDisplayName(user), [user])

  return (
    <div className="min-h-screen bg-offwhite dark:bg-[#151726] text-darkblue dark:text-offwhite transition-colors duration-200">
      {/* Navigation Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentPath={currentPath}
        onNavigate={onNavigate}
      />

      {/* Global Header */}
      <Header
        title="Grievance Dashboard"
        subtitle="Overview & Incident Resolution"
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        userEmail={user?.email}
        onSignOut={() => signOutUser()}
      />

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
              Welcome back, {userDisplayName}
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
                        {getGrievanceLocation(item)}
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
