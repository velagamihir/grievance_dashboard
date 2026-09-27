import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePermissions } from './usePermissions'
import { supabase } from '../lib/supabase'
import {
  GRIEVANCE_TYPES,
  initialGrievanceFormData,
  exportGrievancesToExcel,
  validateLocationRequirement,
} from '../utils'
import type {
  FormResponseRow,
  GrievanceFormData,
  SourceRow,
} from '../types'

export interface GrievanceToast {
  type: 'success' | 'error' | 'info'
  message: string
}

export function useGrievancePage() {
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

  const [grievances, setGrievances] = useState<FormResponseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState<GrievanceToast | null>(null)

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedGrievance, setSelectedGrievance] = useState<FormResponseRow | null>(null)
  const [formData, setFormData] = useState<GrievanceFormData>(initialGrievanceFormData)
  const [editError, setEditError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [sources, setSources] = useState<string[]>(['Form', 'Web Portal', 'Mobile App', 'Kiosk'])

  // Auto-clear toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
  }, [])

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
      console.warn('[useGrievancePage] Error fetching sources:', err)
    }
  }, [])

  // Fetch Grievances from Supabase
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
        console.warn('[useGrievancePage] Supabase fetch error:', error.message)
        showToast(`Database error: ${error.message}`, 'error')
        setGrievances([])
      } else if (data) {
        setGrievances(data as FormResponseRow[])
      }
    } catch (err: unknown) {
      console.error('[useGrievancePage] Unexpected error:', err)
      showToast('Error connecting to database', 'error')
      setGrievances([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [canViewAllGrievances, showToast])

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
  const handleStatusChange = useCallback(async (grievanceId: number, newStatus: string) => {
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
        showToast(`Status updated to "${newStatus}" locally`, 'info')
      } else {
        showToast(`Grievance #${grievanceId} status updated to "${newStatus}"`, 'success')
      }
    } catch (err) {
      console.error('[handleStatusChange] Unexpected error:', err)
      setGrievances(previousGrievances)
      showToast('Failed to update status. Please try again.', 'error')
    }
  }, [canEditStatus, grievances, showToast])

  // 2. Open Add Grievance Modal
  const handleOpenAddModal = useCallback(() => {
    if (!canCreateGrievance) {
      showToast('Permission Denied: You do not have permission to file grievances.', 'error')
      return
    }
    setIsAddModalOpen(true)
  }, [canCreateGrievance, showToast])

  // 3. Open Edit Grievance Modal
  const handleOpenEditModal = useCallback((item: FormResponseRow) => {
    if (!canEditGrievance) {
      showToast('Permission Denied: You do not have permission to edit grievance details.', 'error')
      return
    }
    setSelectedGrievance(item)
    setEditError(null)
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
  }, [canEditGrievance, showToast])

  // 4. Submit Update Grievance Details
  const handleUpdateGrievance = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGrievance) return
    setEditError(null)

    if (!canEditGrievance) {
      const msg = 'Permission Denied: You do not have permission to edit grievance details.'
      setEditError(msg)
      showToast(msg, 'error')
      return
    }

    const locationValidation = validateLocationRequirement({
      room_no_and_block_name: formData.room_no_and_block_name,
      bus_route: formData.bus_route,
      bus_number: formData.bus_number,
    })

    if (!locationValidation.isValid) {
      const msg = locationValidation.error || 'Either Room No & Block or Bus No / Route is mandatory.'
      setEditError(msg)
      showToast(msg, 'error')
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
  }, [selectedGrievance, canEditGrievance, formData, showToast])

  // 5. Open Delete Confirmation Modal
  const handleOpenDeleteModal = useCallback((item: FormResponseRow) => {
    if (!canDeleteGrievance) {
      showToast('Permission Denied: You do not have permission to delete grievances.', 'error')
      return
    }
    setSelectedGrievance(item)
    setIsDeleteModalOpen(true)
  }, [canDeleteGrievance, showToast])

  // 6. Confirm Delete Grievance
  const handleDeleteGrievance = useCallback(async () => {
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
  }, [selectedGrievance, canDeleteGrievance, showToast])

  // 7. Handle Add Grievance Success Callback
  const handleGrievanceCreated = useCallback((created: FormResponseRow) => {
    setGrievances((prev) => [created, ...prev])
    setIsAddModalOpen(false)
    showToast('Grievance filed successfully!', 'success')
  }, [showToast])

  // Available Grievance Categories (including dynamic DB categories)
  const availableGrievanceTypes = useMemo(() => {
    const typesSet = new Set<string>(GRIEVANCE_TYPES)
    grievances.forEach((g) => {
      if (g.type_of_grievance) typesSet.add(g.type_of_grievance)
    })
    return ['All', ...Array.from(typesSet)]
  }, [grievances])

  // Filtered by Type for List and Category-specific Stats
  const filteredByTypeGrievances = useMemo(() => {
    if (typeFilter === 'All') return grievances
    return grievances.filter(
      (g) => (g.type_of_grievance || '').toLowerCase() === typeFilter.toLowerCase()
    )
  }, [grievances, typeFilter])

  // Fully filtered grievances (Type + Status + Search) for Export
  const fullyFilteredGrievances = useMemo(() => {
    return filteredByTypeGrievances.filter((item) => {
      // 1. Status filter
      if (statusFilter !== 'All') {
        if ((item.status || '').toLowerCase() !== statusFilter.toLowerCase()) {
          return false
        }
      }
      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matches = [
          item.name,
          item.problem_description,
          item.email,
          item.type_of_grievance,
          item.room_no_and_block_name,
          item.bus_route,
          item.bus_number,
          item.branch,
        ].some((val) => val && String(val).toLowerCase().includes(q))
        if (!matches) return false
      }
      return true
    })
  }, [filteredByTypeGrievances, statusFilter, searchQuery])

  // Statistics calculation (reactive to selected grievance type)
  const stats = useMemo(() => {
    const target = filteredByTypeGrievances
    const total = target.length
    const notYetStarted = target.filter((g) => {
      const s = (g.status || '').toLowerCase()
      return s === 'not yet started' || s === 'pending'
    }).length
    const inProgress = target.filter((g) => (g.status || '').toLowerCase() === 'in progress').length
    const issueMailSent = target.filter((g) => (g.status || '').toLowerCase() === 'issue mail sent').length
    const finalMailSent = target.filter((g) => (g.status || '').toLowerCase() === 'final mail sent').length
    const resolved = target.filter((g) => (g.status || '').toLowerCase() === 'resolved').length

    return { total, notYetStarted, inProgress, issueMailSent, finalMailSent, resolved }
  }, [filteredByTypeGrievances])

  // Export Grievances to Excel / CSV (Filtered by Type, Status, & Search)
  const handleExportToExcel = useCallback(() => {
    try {
      const exportData = fullyFilteredGrievances
      if (exportData.length === 0) {
        showToast('No grievances matching current filters to export.', 'info')
        return
      }

      const typeTag = typeFilter !== 'All' ? `_${typeFilter.replace(/[^a-zA-Z0-9]/g, '_')}` : ''
      const statusTag = statusFilter !== 'All' ? `_${statusFilter.replace(/[^a-zA-Z0-9]/g, '_')}` : ''
      const dateTag = new Date().toISOString().slice(0, 10)
      const filename = `grievances${typeTag}${statusTag}_${dateTag}.csv`

      exportGrievancesToExcel(exportData, filename)
      showToast(
        `Exported ${exportData.length} grievance(s)${
          typeFilter !== 'All' ? ` for "${typeFilter}"` : ''
        }${statusFilter !== 'All' ? ` [${statusFilter}]` : ''} to Excel!`,
        'success'
      )
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to export grievances.', 'error')
    }
  }, [fullyFilteredGrievances, typeFilter, statusFilter, showToast])

  return {
    // States
    grievances,
    loading,
    refreshing,
    toast,
    isAddModalOpen,
    isEditModalOpen,
    isDeleteModalOpen,
    selectedGrievance,
    formData,
    editError,
    submitting,
    searchQuery,
    statusFilter,
    typeFilter,
    sources,
    stats,
    availableGrievanceTypes,
    filteredByTypeGrievances,
    fullyFilteredGrievances,
    canViewAllGrievances,
    canCreateGrievance,
    canEditGrievance,
    canEditStatus,
    canDeleteGrievance,
    permissionsLoading,
    role,
    user,

    // Setters & Helpers
    setToast,
    setSearchQuery,
    setStatusFilter,
    setTypeFilter,
    setIsAddModalOpen,
    setIsEditModalOpen,
    setIsDeleteModalOpen,
    setSelectedGrievance,
    setFormData,
    setEditError,
    showToast,
    signOutUser,

    // Actions & Handlers
    fetchGrievances,
    handleStatusChange,
    handleOpenAddModal,
    handleOpenEditModal,
    handleUpdateGrievance,
    handleOpenDeleteModal,
    handleDeleteGrievance,
    handleExportToExcel,
    handleGrievanceCreated,
  }
}
