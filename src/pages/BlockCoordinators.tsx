import { useState, useEffect } from 'react'
import {
  Menu,
  Sun,
  Moon,
  LogOut,
  Users,
  MapPin,
  Phone,
  Search,
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
  RefreshCw,
  Plus,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { supabase } from '../lib/supabase'
import { Button } from '../components/Buttons'
import { Drawer } from '../components/Drawer'
import { TextInput } from '../components/TextInput'
import type { BlockCoordinatorsProps, BlockCoordinatorRow, CoordinatorStatItem, FormResponseRow } from '../types'

export const BlockCoordinators = ({
  isDark,
  onToggleTheme,
  currentPath = '/block_coordinators',
  onNavigate,
}: BlockCoordinatorsProps) => {
  useDocumentTitle('Block Coordinators | Grievance Portal')
  const { user, signOutUser } = useAuth()
  const { canViewCoordinators, canManageCoordinators, loading: permissionsLoading } = usePermissions()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [coordinators, setCoordinators] = useState<BlockCoordinatorRow[]>([])
  const [grievances, setGrievances] = useState<FormResponseRow[]>([])
  const [loading, setLoading] = useState(true)

  // Add coordinator modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newCoordinator, setNewCoordinator] = useState({
    name: '',
    block: '',
    phone_no: '',
  })
  const [formError, setFormError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!canViewCoordinators) {
      setCoordinators([])
      setGrievances([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [coordRes, grvRes] = await Promise.all([
        supabase.from('block_coordinators').select('*'),
        supabase.from('form_responses').select('*'),
      ])

      if (coordRes.error) {
        setCoordinators([])
      } else {
        setCoordinators(coordRes.data || [])
      }

      if (grvRes.error) {
        setGrievances([])
      } else {
        setGrievances(grvRes.data || [])
      }
    } catch {
      setCoordinators([])
      setGrievances([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!permissionsLoading) {
      if (canViewCoordinators) {
        fetchData()
      } else {
        setCoordinators([])
        setGrievances([])
        setLoading(false)
      }
    }
  }, [permissionsLoading, canViewCoordinators])

  const handleAddCoordinator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageCoordinators) {
      setFormError('Permission Denied: You do not have permission to manage coordinators.')
      return
    }
    if (!newCoordinator.name.trim() || !newCoordinator.block.trim()) {
      setFormError('Name and Block are required.')
      return
    }

    try {
      setIsSubmitting(true)
      setFormError(null)

      const { data, error } = await supabase
        .from('block_coordinators')
        .insert([
          {
            name: newCoordinator.name.trim(),
            block: newCoordinator.block.trim(),
            phone_no: newCoordinator.phone_no.trim() || null,
          },
        ])
        .select()

      if (error) {
        setFormError(error.message)
      } else {
        if (data && data.length > 0) {
          setCoordinators((prev) => [...prev, data[0]])
        } else {
          await fetchData()
        }
        setIsAddModalOpen(false)
        setNewCoordinator({ name: '', block: '', phone_no: '' })
      }
    } catch (err: any) {
      setFormError(err?.message || 'Failed to add coordinator')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Dynamic calculations from live DB data
  const totalCoordinators = coordinators.length
  const uniqueBlocksCount = new Set(
    coordinators.map((c) => (c.block || '').trim()).filter(Boolean)
  ).size
  const activeCasesCount = grievances.filter((g) => {
    const s = (g.status || '').toLowerCase()
    return s === 'pending' || s === 'in progress' || s === 'under review'
  }).length
  const resolvedCasesCount = grievances.filter(
    (g) => (g.status || '').toLowerCase() === 'resolved'
  ).length

  const stats: CoordinatorStatItem[] = [
    {
      title: 'Total Coordinators',
      count: totalCoordinators.toString(),
      change: `${uniqueBlocksCount} unique blocks covered`,
      icon: Users,
      color: 'bg-lightblue/15 text-lightblue dark:bg-lightblue/25',
    },
    {
      title: 'Blocks Assigned',
      count: uniqueBlocksCount.toString(),
      change: 'Active administrative zones',
      icon: MapPin,
      color: 'bg-green-500/15 text-green-600 dark:bg-green-500/25 dark:text-green-400',
    },
    {
      title: 'Active Block Cases',
      count: activeCasesCount.toString(),
      change: 'Pending live resolution',
      icon: AlertCircle,
      color: 'bg-orange/15 text-orange dark:bg-orange/25',
    },
    {
      title: 'Resolved Grievances',
      count: resolvedCasesCount.toString(),
      change: 'Successfully addressed',
      icon: CheckCircle2,
      color: 'bg-darkblue/15 text-darkblue dark:bg-darkblue/40 dark:text-offwhite',
    },
  ]

  const filteredCoordinators = coordinators.filter((c) => {
    const query = searchQuery.toLowerCase()
    const nameMatch = (c.name || '').toLowerCase().includes(query)
    const blockMatch = (c.block || '').toLowerCase().includes(query)
    const phoneMatch = (c.phone_no || '').toLowerCase().includes(query)
    return nameMatch || blockMatch || phoneMatch
  })

  // Get grievance count matching a coordinator's block
  const getCasesForBlock = (blockName: string | null) => {
    if (!blockName) return { active: 0, resolved: 0 }
    const norm = blockName.toLowerCase()
    const matching = grievances.filter(
      (g) => (g.room_no_and_block_name || '').toLowerCase().includes(norm)
    )
    const active = matching.filter((g) => {
      const s = (g.status || '').toLowerCase()
      return s === 'pending' || s === 'in progress' || s === 'under review'
    }).length
    const resolved = matching.filter(
      (g) => (g.status || '').toLowerCase() === 'resolved'
    ).length
    return { active, resolved }
  }

  const canManage = canManageCoordinators

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
              Live coordinator contacts and jurisdiction assignments fetched directly from the database.
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
                    {loading ? '...' : item.count}
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
                Active field officers overseeing grievance resolution
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

              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                isLoading={loading}
                leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
              >
                Refresh
              </Button>

              {canManage && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add Coordinator
                </Button>
              )}
            </div>
          </div>

          {/* Coordinators Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray/20 text-xs font-semibold text-gray uppercase tracking-wider">
                  <th className="pb-3 pl-2">Coordinator</th>
                  <th className="pb-3">Block &amp; Jurisdiction</th>
                  <th className="pb-3">Phone Number</th>
                  <th className="pb-3">Active Cases</th>
                  <th className="pb-3 pr-2">Resolved Cases</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray/15">
                {loading || permissionsLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray text-xs">
                      Loading coordinators from database...
                    </td>
                  </tr>
                ) : !canViewCoordinators ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray text-xs">
                      Access Restricted: You do not have permission to view block coordinators.
                    </td>
                  </tr>
                ) : filteredCoordinators.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray text-xs">
                      No block coordinators found in database.
                    </td>
                  </tr>
                ) : (
                  filteredCoordinators.map((c, idx) => {
                    const blockCases = getCasesForBlock(c.block)
                    return (
                      <tr
                        key={`${c.name}-${c.block}-${idx}`}
                        className="hover:bg-offwhite/60 dark:hover:bg-[#1a1d2e]/60 transition-colors"
                      >
                        <td className="py-4 pl-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-lightblue/20 text-lightblue dark:bg-orange/20 dark:text-orange flex items-center justify-center font-bold text-sm uppercase shadow-xs">
                              {(c.name || 'C').charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-darkblue dark:text-offwhite">
                                {c.name || 'Unnamed Coordinator'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4">
                          <div className="font-medium text-darkblue dark:text-offwhite flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray shrink-0" />
                            <span>{c.block || 'Unassigned Block'}</span>
                          </div>
                        </td>

                        <td className="py-4 text-xs">
                          {c.phone_no ? (
                            <div className="flex items-center gap-1.5 text-darkblue dark:text-offwhite">
                              <Phone className="w-3.5 h-3.5 text-gray shrink-0" />
                              <a
                                href={`tel:${c.phone_no}`}
                                className="hover:text-lightblue hover:underline"
                              >
                                {c.phone_no}
                              </a>
                            </div>
                          ) : (
                            <span className="text-gray">-</span>
                          )}
                        </td>

                        <td className="py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange/15 text-orange dark:bg-orange/25">
                            {blockCases.active} Pending
                          </span>
                        </td>

                        <td className="py-4 pr-2 font-semibold text-green-600 dark:text-green-400 text-xs">
                          {blockCases.resolved} Resolved
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Coordinator Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1a1d2e] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray/20 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray/15">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-lightblue/15 text-lightblue">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-darkblue dark:text-offwhite">
                  Add Block Coordinator
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-gray hover:text-darkblue dark:hover:text-offwhite hover:bg-gray/10 dark:hover:bg-gray/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddCoordinator} className="space-y-4">
              <TextInput
                label="Full Name"
                placeholder="e.g. Ramesh Kumar"
                required
                value={newCoordinator.name}
                onChange={(e) =>
                  setNewCoordinator((prev) => ({ ...prev, name: e.target.value }))
                }
              />

              <TextInput
                label="Block / Ward Name"
                placeholder="e.g. North Block, Block A, Room 101-120"
                required
                value={newCoordinator.block}
                onChange={(e) =>
                  setNewCoordinator((prev) => ({ ...prev, block: e.target.value }))
                }
              />

              <TextInput
                label="Phone Number"
                placeholder="e.g. +91 98765 43210"
                type="tel"
                value={newCoordinator.phone_no}
                onChange={(e) =>
                  setNewCoordinator((prev) => ({ ...prev, phone_no: e.target.value }))
                }
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray/15">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                >
                  Save Coordinator
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlockCoordinators
