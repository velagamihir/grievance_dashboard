import { useState } from 'react'
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
  Search,
  Filter
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/Buttons'
import { Drawer } from '../components/Drawer'

interface HomeProps {
  isDark: boolean
  onToggleTheme: () => void
}

export const Home = ({ isDark, onToggleTheme }: HomeProps) => {
  const { user, signOutUser } = useAuth()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const stats = [
    {
      title: 'Total Grievances',
      count: '128',
      change: '+12% from last week',
      icon: Inbox,
      color: 'bg-lightblue/15 text-lightblue dark:bg-lightblue/25',
    },
    {
      title: 'Pending Review',
      count: '24',
      change: '4 high priority',
      icon: Clock,
      color: 'bg-orange/15 text-orange dark:bg-orange/25',
    },
    {
      title: 'In Progress',
      count: '42',
      change: '18 assigned',
      icon: AlertCircle,
      color: 'bg-darkblue/15 text-darkblue dark:bg-darkblue/40 dark:text-offwhite',
    },
    {
      title: 'Resolved',
      count: '62',
      change: '94% satisfaction rate',
      icon: CheckCircle2,
      color: 'bg-green-500/15 text-green-600 dark:bg-green-500/25 dark:text-green-400',
    },
  ]

  const recentGrievances = [
    {
      id: 'GRV-2026-089',
      title: 'Delay in Document Verification',
      department: 'Revenue & Records',
      date: 'Today, 10:24 AM',
      priority: 'High',
      status: 'Pending',
    },
    {
      id: 'GRV-2026-088',
      title: 'Sanitation Maintenance in Ward 4',
      department: 'Public Works',
      date: 'Yesterday, 04:15 PM',
      priority: 'Medium',
      status: 'In Progress',
    },
    {
      id: 'GRV-2026-087',
      title: 'Streetlight outage on Main Blvd',
      department: 'Electricity Dept',
      date: 'Sep 24, 2026',
      priority: 'Low',
      status: 'Resolved',
    },
    {
      id: 'GRV-2026-086',
      title: 'Water Supply disruption complaint',
      department: 'Water Board',
      date: 'Sep 23, 2026',
      priority: 'High',
      status: 'In Progress',
    },
  ]

  return (
    <div className="min-h-screen bg-offwhite dark:bg-[#151726] text-darkblue dark:text-offwhite transition-colors duration-200">
      {/* Navigation Drawer */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

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
              Welcome back, {user?.email?.split('@')[0] || 'Admin'}
            </h2>
            <p className="text-sm sm:text-base text-offwhite/85">
              Here is an overview of active grievances, resolution progress, and department activities for today.
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
                    {item.count}
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
                Monitor and process the latest reported citizen complaints
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search grievance..."
                  className="pl-9 pr-3 py-2 text-xs rounded-xl bg-offwhite dark:bg-[#151726] border border-gray/20 text-darkblue dark:text-offwhite placeholder:text-gray/70 focus:outline-none focus:border-lightblue transition-colors"
                />
              </div>
              <button
                type="button"
                className="p-2 rounded-xl bg-offwhite dark:bg-[#151726] border border-gray/20 text-gray hover:text-darkblue dark:hover:text-offwhite transition-colors"
                aria-label="Filter grievances"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grievance Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray/20 text-xs font-semibold text-gray uppercase tracking-wider">
                  <th className="pb-3 pl-2">ID</th>
                  <th className="pb-3">Title &amp; Subject</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Reported</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3 pr-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray/15">
                {recentGrievances.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-offwhite/60 dark:hover:bg-[#1a1d2e]/60 transition-colors"
                  >
                    <td className="py-4 pl-2 font-mono text-xs font-bold text-lightblue">
                      {item.id}
                    </td>
                    <td className="py-4 font-semibold text-darkblue dark:text-offwhite">
                      {item.title}
                    </td>
                    <td className="py-4 text-gray text-xs">
                      {item.department}
                    </td>
                    <td className="py-4 text-gray text-xs">
                      {item.date}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          item.priority === 'High'
                            ? 'bg-orange/15 text-orange'
                            : item.priority === 'Medium'
                            ? 'bg-lightblue/15 text-lightblue'
                            : 'bg-gray/15 text-gray'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-4 pr-2">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          item.status === 'Resolved'
                            ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                            : item.status === 'In Progress'
                            ? 'bg-lightblue/15 text-lightblue'
                            : 'bg-orange/15 text-orange'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home
