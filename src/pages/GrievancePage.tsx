import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Plus,
  Trash2,
  Edit3,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  User as UserIcon,
  X,
  RefreshCw,
  Tag,
  MapPin,
  Bus,
  Layers,
  Sparkles,
  Mail,
  GraduationCap,
  Building,
  Download,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { supabase } from '../lib/supabase'
import {
  Button,
  Drawer,
  Header,
  List,
  ListItem,
  ListBadge,
  AddGrievanceCard,
  InputCard,
  Modal,
  ConfirmModal,
} from '../components'
import {
  STATUS_OPTIONS,
  GRIEVANCE_TYPES,
  initialGrievanceFormData,
  getStatusBadgeVariant,
  formatDate,
  exportGrievancesToExcel,
} from '../utils'
import type {
  GrievancePageProps,
  FormResponseRow,
  GrievanceFormData,
  SourceRow,
} from '../types'

export const GrievancePage: React.FC<GrievancePageProps> = ({
  isDark,
  onToggleTheme,
  currentPath = '/grievances',
  onNavigate,
}) => {
  useDocumentTitle('Grievances | Grievance Portal')
  const { user, signOutUser } = useAuth()
  const {
    role,
    loading: permissionsLoading,
    canViewAllGrievances,
    canCreateGrievance,
    canEditGrievance,
    canEditStatus,
    canDeleteGrievance,
  } = usePermissions()

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [grievances, setGrievances] = useState<FormResponseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedGrievance, setSelectedGrievance] = useState<FormResponseRow | null>(null)
  const [formData, setFormData] = useState<GrievanceFormData>(initialGrievanceFormData)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Auto-clear toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
  }

  const [sources, setSources] = useState<string[]>(['Form', 'Web Portal', 'Mobile App', 'Kiosk'])

  // Fetch Sources from Supabase
  const fetchSources = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sources')
        .select('id, source_name')
        .order('id', { ascending: true })

      if (!error && data && data.length > 0) {
        const names = (data as SourceRow[]).map((s) => s.source_name).filter(Boolean)
        if (names.length > 0) {
          setSources(names)
        }
      }
    } catch (err) {
      console.warn('[GrievancePage] Error fetching sources:', err)
    }
  }, [])

  const fetchGrievances = useCallback(async () => {
    if (!canViewAllGrievances) {
      setGrievances([])
      setLoading(false)
      return
    }

    try {
      setRefreshing(true)
      const { data, error } = await supabase
        .from('form_responses')
        .select('*')
        .order('id', { ascending: false })

      if (error) {
        console.warn('[GrievancePage] Supabase fetch error:', error.message)
        showToast(`Database error: ${error.message}`, 'error')
        setGrievances([])
      } else if (data) {
        setGrievances(data as FormResponseRow[])
      }
    } catch (err: unknown) {
      console.error('[GrievancePage] Unexpected error:', err)
      showToast('Error connecting to database', 'error')
      setGrievances([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [canViewAllGrievances])

  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  useEffect(() => {
    if (!permissionsLoading) {
      if (canViewAllGrievances) {
        fetchGrievances()
      } else {
        setGrievances([])
        setLoading(false)
      }
    }
  }, [permissionsLoading, canViewAllGrievances, fetchGrievances])

  // 1. Inline Status Dropdown Change
  const handleStatusChange = async (grievanceId: number, newStatus: string) => {
    if (!canEditStatus) {
      showToast('Permission Denied: You do not have permission to update grievance status.', 'error')
      return
    }

    const previousGrievances = [...grievances]
    // Optimistic Update
    setGrievances((prev) =>
      prev.map((g) => (g.id === grievanceId ? { ...g, status: newStatus } : g))
    )

    try {
      const { error } = await supabase
        .from('form_responses')
        .update({ status: newStatus })
        .eq('id', grievanceId)

      if (error) {
        console.warn('[handleStatusChange] Error updating status in Supabase:', error.message)
        // Even if supabase fails or offline, notify user
        showToast(`Status updated to "${newStatus}" locally`, 'info')
      } else {
        showToast(`Grievance #${grievanceId} status updated to "${newStatus}"`, 'success')
      }
    } catch (err) {
      console.error('[handleStatusChange] Unexpected error:', err)
      setGrievances(previousGrievances)
      showToast('Failed to update status. Please try again.', 'error')
    }
  }

  // 2. Open Add Grievance Modal
  const handleOpenAddModal = () => {
    if (!canCreateGrievance) {
      showToast('Permission Denied: You do not have permission to file grievances.', 'error')
      return
    }
    setIsAddModalOpen(true)
  }


  // 4. Open Edit Grievance Modal
  const handleOpenEditModal = (item: FormResponseRow) => {
    if (!canEditGrievance) {
      showToast('Permission Denied: You do not have permission to edit grievance details.', 'error')
      return
    }
    setSelectedGrievance(item)
    setFormData({
      name: item.name || '',
      email: item.email || '',
      type_of_grievance: item.type_of_grievance || 'Hostel & Accommodation',
      problem_description: item.problem_description || '',
      branch: item.branch || 'Computer Science',
      section: item.section || 'A',
      year: item.year || '1st Year',
      room_no_and_block_name: item.room_no_and_block_name || '',
      bus_route: item.bus_route || '',
      bus_number: item.bus_number || '',
      suggestions: item.suggestions || '',
      status: item.status || 'Pending',
      source: item.source || 'Form',
    })
    setIsEditModalOpen(true)
  }

  // 5. Submit Update Grievance Details
  const handleUpdateGrievance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGrievance) return

    if (!canEditGrievance) {
      showToast('Permission Denied: You do not have permission to edit grievance details.', 'error')
      return
    }

    try {
      setSubmitting(true)
      const updatedFields = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        type_of_grievance: formData.type_of_grievance,
        problem_description: formData.problem_description.trim(),
        branch: formData.branch,
        section: formData.section,
        year: formData.year,
        room_no_and_block_name: formData.room_no_and_block_name.trim(),
        bus_route: formData.bus_route.trim(),
        bus_number: formData.bus_number.trim(),
        suggestions: formData.suggestions.trim(),
        status: formData.status,
      }

      const { error } = await supabase
        .from('form_responses')
        .update(updatedFields)
        .eq('id', selectedGrievance.id)

      if (error) {
        console.warn('[handleUpdateGrievance] Supabase update error:', error.message)
      }

      setGrievances((prev) =>
        prev.map((g) => (g.id === selectedGrievance.id ? { ...g, ...updatedFields } : g))
      )
      showToast(`Grievance #${selectedGrievance.id} updated successfully!`, 'success')
      setIsEditModalOpen(false)
      setSelectedGrievance(null)
    } catch (err) {
      console.error('[handleUpdateGrievance] Unexpected error:', err)
      showToast('Failed to update grievance details.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // 6. Open Delete Confirmation Modal
  const handleOpenDeleteModal = (item: FormResponseRow) => {
    if (!canDeleteGrievance) {
      showToast('Permission Denied: You do not have permission to delete grievances.', 'error')
      return
    }
    setSelectedGrievance(item)
    setIsDeleteModalOpen(true)
  }

  // 7. Confirm Delete Grievance
  const handleDeleteGrievance = async () => {
    if (!selectedGrievance) return

    if (!canDeleteGrievance) {
      showToast('Permission Denied: You do not have permission to delete grievances.', 'error')
      return
    }

    try {
      setSubmitting(true)
      const { error } = await supabase
        .from('form_responses')
        .delete()
        .eq('id', selectedGrievance.id)

      if (error) {
        console.warn('[handleDeleteGrievance] Supabase delete error:', error.message)
      }

      setGrievances((prev) => prev.filter((g) => g.id !== selectedGrievance.id))
      showToast(`Grievance #${selectedGrievance.id} deleted successfully!`, 'success')
      setIsDeleteModalOpen(false)
      setSelectedGrievance(null)
    } catch (err) {
      console.error('[handleDeleteGrievance] Unexpected error:', err)
      showToast('Failed to delete grievance.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Statistics calculation
  const stats = useMemo(() => {
    const total = grievances.length
    const notYetStarted = grievances.filter((g) => {
      const s = (g.status || '').toLowerCase()
      return s === 'not yet started' || s === 'pending'
    }).length
    const inProgress = grievances.filter((g) => (g.status || '').toLowerCase() === 'in progress').length
    const issueMailSent = grievances.filter((g) => (g.status || '').toLowerCase() === 'issue mail sent').length
    const finalMailSent = grievances.filter((g) => (g.status || '').toLowerCase() === 'final mail sent').length
    const resolved = grievances.filter((g) => (g.status || '').toLowerCase() === 'resolved').length

    return { total, notYetStarted, inProgress, issueMailSent, finalMailSent, resolved }
  }, [grievances])

  // Export Grievances to Excel / CSV
  const handleExportToExcel = () => {
    try {
      if (grievances.length === 0) {
        showToast('No grievances available to export.', 'info')
        return
      }
      exportGrievancesToExcel(grievances)
      showToast(`Exported ${grievances.length} grievance(s) to Excel!`, 'success')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to export grievances.', 'error')
    }
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

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${toast.type === 'success'
            ? 'bg-green-600 text-white shadow-green-600/20'
            : toast.type === 'error'
              ? 'bg-red-600 text-white shadow-red-600/20'
              : 'bg-darkblue text-white shadow-darkblue/20 dark:bg-orange dark:text-darkblue'
            }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : toast.type === 'error' ? (
            <ShieldAlert className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="opacity-70 hover:opacity-100 ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Global Header */}
      <Header
        title="Grievance Management"
        subtitle="Citizen & Student Incident Resolution Console"
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        role={role}
        userEmail={user?.email}
        onSignOut={() => signOutUser()}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-darkblue via-[#404a8b] to-lightblue p-6 sm:p-8 text-offwhite shadow-xl shadow-darkblue/10">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-orange" />
              Role-Based Grievance Operations
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Grievance Records &amp; Actions
            </h2>
            <p className="text-sm sm:text-base text-offwhite/85">
              Review filed grievances, update incident progress in real-time, edit grievance details, and submit new complaints.
            </p>
          </div>

          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
            <Layers className="w-64 h-64 text-white" />
          </div>
        </div>

        {/* Stats Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white dark:bg-[#20243a] p-5 rounded-3xl border border-gray/20 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray uppercase tracking-wider">
                Total Grievances
              </span>
              <div className="text-3xl font-bold text-darkblue dark:text-offwhite mt-1">
                {stats.total}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-lightblue/15 text-lightblue dark:bg-lightblue/25">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#20243a] p-5 rounded-3xl border border-gray/20 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray uppercase tracking-wider">
                Not Yet Started
              </span>
              <div className="text-3xl font-bold text-orange mt-1">
                {stats.notYetStarted}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-orange/15 text-orange dark:bg-orange/25">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#20243a] p-5 rounded-3xl border border-gray/20 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray uppercase tracking-wider">
                In Progress
              </span>
              <div className="text-3xl font-bold text-darkblue dark:text-offwhite mt-1">
                {stats.inProgress}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-darkblue/15 text-darkblue dark:bg-darkblue/40 dark:text-offwhite">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#20243a] p-5 rounded-3xl border border-gray/20 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray uppercase tracking-wider">
                Resolved
              </span>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {stats.resolved}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-green-500/15 text-green-600 dark:bg-green-500/25 dark:text-green-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Grievance Management Section using Reusable List */}
        <div className="bg-white dark:bg-[#20243a] rounded-3xl border border-gray/20 shadow-sm p-6 sm:p-8 space-y-6">
          <List<FormResponseRow>
            title="Registered Complaints"
            subtitle="View, triage, and modify incident records"
            count={grievances.length}
            items={grievances}
            isLoading={loading || permissionsLoading}
            keyExtractor={(item) => item.id}
            searchable
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search by name, description, room, route..."
            searchKeys={['name', 'problem_description', 'email', 'type_of_grievance', 'room_no_and_block_name', 'bus_route']}
            filterOptions={[
              { label: 'All', value: 'All', count: stats.total },
              { label: 'Not Yet Started', value: 'Not Yet Started', count: stats.notYetStarted },
              { label: 'In Progress', value: 'In progress', count: stats.inProgress },
              { label: 'Issue Mail Sent', value: 'Issue mail sent', count: stats.issueMailSent },
              { label: 'Final Mail Sent', value: 'Final mail sent', count: stats.finalMailSent },
              { label: 'Resolved', value: 'Resolved', count: stats.resolved },
            ]}
            selectedFilter={statusFilter}
            onFilterSelect={setStatusFilter}
            filterFn={(item, filter) => {
              if (filter === 'All') return true
              return (item.status || '').toLowerCase() === filter.toLowerCase()
            }}
            variant="card"
            pagination
            pageSize={6}
            headerActions={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportToExcel}
                  disabled={!canViewAllGrievances || grievances.length === 0}
                  leftIcon={<Download className="w-4 h-4" />}
                  title="Export grievances to Excel / CSV"
                >
                  <span className="hidden sm:inline">Export Excel</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchGrievances}
                  disabled={!canViewAllGrievances}
                  isLoading={refreshing}
                  aria-label="Refresh list"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>

                {canCreateGrievance && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenAddModal}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add Grievance
                  </Button>
                )}
              </div>
            }
            emptyTitle={
              !canViewAllGrievances
                ? 'Access Restricted'
                : grievances.length === 0
                ? 'No Grievances in Database'
                : 'No Matching Grievances'
            }
            emptyDescription={
              !canViewAllGrievances
                ? 'You do not have permission to view grievances. Please contact your administrator to assign role permissions.'
                : grievances.length === 0
                ? 'No grievances have been registered in the database yet.'
                : 'No grievance records match your current search and filter criteria.'
            }
            emptyActionLabel={canCreateGrievance ? 'File New Grievance' : undefined}
            onEmptyAction={canCreateGrievance ? handleOpenAddModal : undefined}
            renderItem={(item) => {
              const formattedDate = formatDate(item.created_at, 'Recently')

              return (
                <ListItem
                  key={item.id}
                  variant="card"
                  size="lg"
                  leading={
                    <div className="w-11 h-11 rounded-2xl bg-lightblue/15 text-lightblue dark:bg-orange/20 dark:text-orange flex items-center justify-center font-bold text-sm shadow-xs">
                      #{item.id}
                    </div>
                  }
                  title={
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-darkblue dark:text-offwhite text-sm sm:text-base">
                        {item.name || 'Anonymous Student'}
                      </span>
                      <span className="text-xs text-gray font-normal">
                        ({item.email || 'No email'})
                      </span>
                    </div>
                  }
                  badge={
                    <ListBadge variant={getStatusBadgeVariant(item.status)} size="sm">
                      {item.status || 'Pending'}
                    </ListBadge>
                  }
                  subtitle={
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray flex-wrap">
                      <span className="font-medium text-lightblue dark:text-lightblue">
                        {item.type_of_grievance || 'General Grievance'}
                      </span>
                      <span>•</span>
                      <span>{formattedDate}</span>
                      {item.branch && (
                        <>
                          <span>•</span>
                          <span>{item.branch} {item.year ? `(${item.year})` : ''}</span>
                        </>
                      )}
                    </div>
                  }
                  description={
                    <p className="text-xs sm:text-sm text-darkblue/90 dark:text-offwhite/90 mt-2 bg-offwhite/70 dark:bg-[#151726]/60 p-3 rounded-xl border border-gray/10">
                      {item.problem_description}
                    </p>
                  }
                  meta={
                    <div className="flex items-center gap-3 text-[11px] text-gray flex-wrap mt-2">
                      {item.room_no_and_block_name && (
                        <div className="flex items-center gap-1 bg-gray/10 dark:bg-gray/20 px-2.5 py-1 rounded-lg">
                          <MapPin className="w-3 h-3 text-gray" />
                          <span>{item.room_no_and_block_name}</span>
                        </div>
                      )}
                      {item.bus_number && (
                        <div className="flex items-center gap-1 bg-gray/10 dark:bg-gray/20 px-2.5 py-1 rounded-lg">
                          <Bus className="w-3 h-3 text-gray" />
                          <span>Bus #{item.bus_number}</span>
                        </div>
                      )}
                      {item.source && (
                        <div className="flex items-center gap-1 bg-gray/10 dark:bg-gray/20 px-2.5 py-1 rounded-lg">
                          <Tag className="w-3 h-3 text-gray" />
                          <span>{item.source}</span>
                        </div>
                      )}
                    </div>
                  }
                  trailing={
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2.5">
                      {/* Interactive Status Dropdown */}
                      <div className="relative flex items-center">
                        <select
                          value={item.status || 'Pending'}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          disabled={!canEditStatus}
                          title={
                            !canEditStatus
                              ? 'Permission Denied: Only authorized coordinators & admins can change status'
                              : 'Change grievance status'
                          }
                          className={`appearance-none cursor-pointer text-xs font-semibold py-1.5 pl-3 pr-8 rounded-xl border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-lightblue/30 disabled:cursor-not-allowed disabled:opacity-60 ${item.status === 'Resolved'
                            ? 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30'
                            : item.status === 'In Progress'
                              ? 'bg-lightblue/15 text-lightblue dark:text-lightblue border-lightblue/30'
                              : item.status === 'Under Review'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                : item.status === 'Rejected'
                                  ? 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30'
                                  : 'bg-orange/15 text-orange border-orange/30'
                            }`}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option
                              key={opt.value}
                              value={opt.value}
                              className="bg-white dark:bg-[#1a1d2e] text-darkblue dark:text-offwhite font-normal"
                            >
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-2.5 text-xs opacity-60">
                          ▾
                        </span>
                      </div>

                      {/* Edit Details Action */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditModal(item)}
                        disabled={!canEditGrievance}
                        title={
                          !canEditGrievance
                            ? 'Permission Denied: You do not have permission to edit details'
                            : 'Edit grievance details'
                        }
                        className="p-2"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden md:inline ml-1 text-xs">Edit</span>
                      </Button>

                      {/* Delete Action */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDeleteModal(item)}
                        disabled={!canDeleteGrievance}
                        title={
                          !canDeleteGrievance
                            ? 'Permission Denied: Only administrators can delete grievances'
                            : 'Delete grievance'
                        }
                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  }
                />
              )
            }}
          />
        </div>
      </main>

      {/* ========================================== */}
      {/* ADD GRIEVANCE MODAL                        */}
      {/* ========================================== */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        size="2xl"
        showCloseButton={false}
      >
        <AddGrievanceCard
          variant="embedded"
          readOnlyStatus={!canEditStatus}
          onCancel={() => setIsAddModalOpen(false)}
          onSuccess={(created) => {
            setGrievances((prev) => [created, ...prev])
            setIsAddModalOpen(false)
            showToast('Grievance filed successfully!', 'success')
          }}
        />
      </Modal>

      {/* ========================================== */}
      {/* EDIT GRIEVANCE DETAILS MODAL               */}
      {/* ========================================== */}
      {selectedGrievance && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          size="2xl"
          showCloseButton={false}
        >
          <InputCard
            title={`Edit Grievance #${selectedGrievance.id}`}
            subtitle="Update complaint details, department assignment, and notes"
            icon={<Edit3 className="w-5 h-5" />}
            iconBgColor="bg-lightblue/15 text-lightblue dark:bg-lightblue/25"
            variant="embedded"
            submitButtonText="Save Changes"
            isLoading={submitting}
            onCancel={() => setIsEditModalOpen(false)}
            onSubmit={handleUpdateGrievance}
            fields={[
              {
                name: 'name',
                label: 'Student / Complainant Name',
                type: 'text',
                required: true,
                leftIcon: <UserIcon className="w-4 h-4" />,
                colSpan: 1,
              },
              {
                name: 'email',
                label: 'Contact Email Address',
                type: 'email',
                required: true,
                leftIcon: <Mail className="w-4 h-4" />,
                colSpan: 1,
              },
              {
                name: 'type_of_grievance',
                label: 'Category / Department',
                type: 'select',
                required: true,
                leftIcon: <Layers className="w-4 h-4" />,
                options: GRIEVANCE_TYPES,
                colSpan: 1,
              },
              {
                name: 'source',
                label: 'Submission Source',
                type: 'select',
                leftIcon: <Tag className="w-4 h-4" />,
                options: sources,
                colSpan: 1,
              },
              {
                name: 'status',
                label: 'Status',
                type: 'select',
                disabled: !canEditStatus,
                options: ['Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected'],
                colSpan: 1,
              },
              {
                name: 'problem_description',
                label: 'Detailed Problem Description',
                type: 'textarea',
                required: true,
                rows: 4,
                colSpan: 'full',
              },
              {
                name: 'branch',
                label: 'Branch / Major',
                type: 'text',
                leftIcon: <GraduationCap className="w-4 h-4" />,
                colSpan: 1,
              },
              {
                name: 'section',
                label: 'Section',
                type: 'text',
                colSpan: 1,
              },
              {
                name: 'year',
                label: 'Year of Study',
                type: 'text',
                colSpan: 1,
              },
              {
                name: 'room_no_and_block_name',
                label: 'Room No & Block',
                type: 'text',
                leftIcon: <Building className="w-4 h-4" />,
                colSpan: 1,
              },
              {
                name: 'bus_number',
                label: 'Bus No / Route',
                type: 'text',
                leftIcon: <Bus className="w-4 h-4" />,
                colSpan: 1,
              },
              {
                name: 'suggestions',
                label: 'Suggestions / Action Notes',
                type: 'text',
                leftIcon: <Sparkles className="w-4 h-4" />,
                colSpan: 'full',
              },
            ]}
            values={formData as unknown as Record<string, string>}
            onChange={(name, value) => setFormData((prev) => ({ ...prev, [name]: value }))}
          />
        </Modal>
      )}

      {/* ========================================== */}
      {/* DELETE CONFIRMATION MODAL                  */}
      {/* ========================================== */}
      {selectedGrievance && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteGrievance}
          title={`Delete Grievance #${selectedGrievance.id}?`}
          subtitle="This action cannot be undone."
          confirmText="Delete Record"
          isLoading={submitting}
          message={
            <p className="p-3 rounded-xl bg-offwhite dark:bg-[#151726] border border-gray/15">
              Are you sure you want to permanently delete the grievance filed by{' '}
              <strong>{selectedGrievance.name || 'this student'}</strong> for{' '}
              <strong>{selectedGrievance.type_of_grievance || 'General Issue'}</strong>?
            </p>
          }
        />
      )}
    </div>
  )
}

export default GrievancePage
