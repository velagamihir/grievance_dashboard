import { useState } from 'react'
import {
  Menu,
  Sun,
  Moon,
  LogOut,
  Users,
  MapPin,
  Phone,
  Mail,
  Search,
  UserPlus,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  User as UserIcon,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/Buttons'
import { Drawer } from '../components/Drawer'
import type { BlockCoordinatorsProps, Coordinator, CoordinatorStatItem } from '../types'

export const BlockCoordinators = ({
  isDark,
  onToggleTheme,
  currentPath = '/block_coordinators',
  onNavigate,
}: BlockCoordinatorsProps) => {
  const { user, signOutUser } = useAuth()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')

  const stats: CoordinatorStatItem[] = [
    {
      title: 'Total Coordinators',
      count: '16',
      change: 'Covering 24 Wards',
      icon: Users,
      color: 'bg-lightblue/15 text-lightblue dark:bg-lightblue/25',
    },
    {
      title: 'Active on Duty',
      count: '14',
      change: '2 on scheduled leave',
      icon: CheckCircle2,
      color: 'bg-green-500/15 text-green-600 dark:bg-green-500/25 dark:text-green-400',
    },
    {
      title: 'Active Block Cases',
      count: '68',
      change: 'Assigned to coordinators',
      icon: AlertCircle,
      color: 'bg-orange/15 text-orange dark:bg-orange/25',
    },
    {
      title: 'Avg Resolution Time',
      count: '3.8h',
      change: '-18% from last month',
      icon: Clock,
      color: 'bg-darkblue/15 text-darkblue dark:bg-darkblue/40 dark:text-offwhite',
    },
  ]

  const coordinators: Coordinator[] = [
    {
      id: 'BC-01',
      name: 'Rajesh Sharma',
      block: 'North Block (Ward 1 - 4)',
      zone: 'North District',
      email: 'rajesh.sharma@gov.in',
      phone: '+91 98765 43210',
      activeGrievances: 6,
      resolvedCount: 42,
      status: 'Active',
    },
    {
      id: 'BC-02',
      name: 'Pooja Verma',
      block: 'Central Block (Ward 5 - 8)',
      zone: 'Central District',
      email: 'pooja.verma@gov.in',
      phone: '+91 98765 43211',
      activeGrievances: 12,
      resolvedCount: 58,
      status: 'Busy',
    },
    {
      id: 'BC-03',
      name: 'Anil Deshmukh',
      block: 'East Block (Ward 9 - 12)',
      zone: 'East District',
      email: 'anil.deshmukh@gov.in',
      phone: '+91 98765 43212',
      activeGrievances: 4,
      resolvedCount: 31,
      status: 'Active',
    },
    {
      id: 'BC-04',
      name: 'Sunita Rao',
      block: 'South Block (Ward 13 - 16)',
      zone: 'South District',
      email: 'sunita.rao@gov.in',
      phone: '+91 98765 43213',
      activeGrievances: 8,
      resolvedCount: 49,
      status: 'Active',
    },
    {
      id: 'BC-05',
      name: 'Vikas Patel',
      block: 'West Block (Ward 17 - 20)',
      zone: 'West District',
      email: 'vikas.patel@gov.in',
      phone: '+91 98765 43214',
      activeGrievances: 0,
      resolvedCount: 26,
      status: 'On Leave',
    },
    {
      id: 'BC-06',
      name: 'Deepak Nair',
      block: 'Metro Block (Ward 21 - 24)',
      zone: 'Urban Metro District',
      email: 'deepak.nair@gov.in',
      phone: '+91 98765 43215',
      activeGrievances: 9,
      resolvedCount: 65,
      status: 'Active',
    },
  ]

  const filteredCoordinators = coordinators.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.block.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
                Block Coordinators
              </h1>
              <p className="text-xs text-gray mt-0.5 hidden sm:block">
                Jurisdiction Management &amp; Assignment
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-darkblue via-[#38417c] to-lightblue p-6 sm:p-8 text-offwhite shadow-xl shadow-darkblue/10">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs">
              <MapPin className="w-3.5 h-3.5 text-orange" />
              Field Administration Directory
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Block &amp; Ward Coordinators
            </h2>
            <p className="text-sm sm:text-base text-offwhite/85">
              Assign block officers, monitor on-ground grievance response rates, and coordinate field resolutions.
            </p>
          </div>

          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
            <Users className="w-64 h-64 text-white" />
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

        {/* Coordinators Directory */}
        <div className="bg-white dark:bg-[#20243a] rounded-3xl border border-gray/20 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-darkblue dark:text-offwhite">
                Coordinators Directory
              </h3>
              <p className="text-xs sm:text-sm text-gray mt-0.5">
                Active field officers overseeing municipal grievance resolution
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search coordinator / block..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs rounded-xl bg-offwhite dark:bg-[#151726] border border-gray/20 text-darkblue dark:text-offwhite placeholder:text-gray/70 focus:outline-none focus:border-lightblue transition-colors w-52 sm:w-64"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-offwhite dark:bg-[#151726] p-1 rounded-xl border border-gray/20 text-xs">
                {['All', 'Active', 'Busy', 'On Leave'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      statusFilter === st
                        ? 'bg-darkblue text-offwhite dark:bg-orange dark:text-darkblue shadow-xs'
                        : 'text-gray hover:text-darkblue dark:hover:text-offwhite'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Add Coordinator
              </Button>
            </div>
          </div>

          {/* Coordinators Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray/20 text-xs font-semibold text-gray uppercase tracking-wider">
                  <th className="pb-3 pl-2">Coordinator</th>
                  <th className="pb-3">Block &amp; Jurisdiction</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">Active Cases</th>
                  <th className="pb-3">Resolved</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray/15">
                {filteredCoordinators.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray text-xs">
                      No block coordinators match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCoordinators.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-offwhite/60 dark:hover:bg-[#1a1d2e]/60 transition-colors"
                    >
                      <td className="py-4 pl-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-lightblue/20 text-lightblue dark:bg-orange/20 dark:text-orange flex items-center justify-center font-bold text-sm uppercase shadow-xs">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-darkblue dark:text-offwhite">
                              {c.name}
                            </div>
                            <span className="text-[11px] font-mono text-gray">{c.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4">
                        <div className="font-medium text-darkblue dark:text-offwhite flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray shrink-0" />
                          <span>{c.block}</span>
                        </div>
                        <span className="text-xs text-gray">{c.zone}</span>
                      </td>

                      <td className="py-4 text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 text-darkblue dark:text-offwhite">
                          <Mail className="w-3.5 h-3.5 text-gray shrink-0" />
                          <span>{c.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray">
                          <Phone className="w-3.5 h-3.5 text-gray shrink-0" />
                          <span>{c.phone}</span>
                        </div>
                      </td>

                      <td className="py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange/15 text-orange dark:bg-orange/25">
                          {c.activeGrievances} Pending
                        </span>
                      </td>

                      <td className="py-4 font-semibold text-green-600 dark:text-green-400 text-xs">
                        {c.resolvedCount} Cases
                      </td>

                      <td className="py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            c.status === 'Active'
                              ? 'bg-green-500/15 text-green-600 dark:bg-green-500/25 dark:text-green-400'
                              : c.status === 'Busy'
                              ? 'bg-orange/15 text-orange dark:bg-orange/25'
                              : 'bg-gray/15 text-gray'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td className="py-4 pr-2 text-right">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-gray hover:text-darkblue dark:hover:text-offwhite hover:bg-gray/10 dark:hover:bg-gray/20 transition-colors"
                          aria-label="Coordinator options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
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

export default BlockCoordinators
