import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Users,
  MapPin,
  Phone,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { supabase } from '../lib/supabase'
import {
  Button,
  Drawer,
  TextInput,
  Header,
  List,
  ListItem,
  ListBadge,
  Modal,
  ConfirmModal,
} from '../components'
import { calculateCoordinatorStats, getCoordinatorCases, validateCoordinatorForm } from '../utils'
import type { BlockCoordinatorsProps, BlockCoordinatorRow, FormResponseRow } from '../types'

export const BlockCoordinators = ({
  isDark,
  onToggleTheme,
  currentPath = '/block_coordinators',
  onNavigate,
}: BlockCoordinatorsProps) => {
  useDocumentTitle('Block Coordinators | Grievance Portal')
  const { user, signOutUser } = useAuth()
  const {
    role,
    canViewCoordinators,
    canAddCoordinator,
    canEditCoordinator,
    canDeleteCoordinator,
    loading: permissionsLoading,
  } = usePermissions()

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

  // Edit coordinator modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editFormError, setEditFormError] = useState<string | null>(null)
  const [editingTarget, setEditingTarget] = useState<BlockCoordinatorRow | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    block: '',
    phone_no: '',
  })

  // Delete coordinator modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingTarget, setDeletingTarget] = useState<BlockCoordinatorRow | null>(null)

  const fetchData = useCallback(async () => {
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
  }, [canViewCoordinators])

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
  }, [permissionsLoading, canViewCoordinators, fetchData])

  const handleAddCoordinator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canAddCoordinator) {
      setFormError('Permission Denied: You do not have permission to add coordinators.')
      return
    }

    const validation = validateCoordinatorForm(newCoordinator)
    if (!validation.isValid) {
      setFormError(validation.errorMessage || 'All fields (Name, Block, and Phone Number) are required.')
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
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to add coordinator')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenEdit = (c: BlockCoordinatorRow) => {
    setEditingTarget(c)
    setEditForm({
      name: c.name || '',
      block: c.block || '',
      phone_no: c.phone_no || '',
    })
    setEditFormError(null)
    setIsEditModalOpen(true)
  }

  const handleEditCoordinator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canEditCoordinator) {
      setEditFormError('Permission Denied: You do not have permission to edit coordinators.')
      return
    }

    const validation = validateCoordinatorForm(editForm)
    if (!validation.isValid) {
      setEditFormError(validation.errorMessage || 'All fields (Name, Block, and Phone Number) are required.')
      return
    }

    try {
      setIsEditing(true)
      setEditFormError(null)

      let query = supabase.from('block_coordinators').update({
        name: editForm.name.trim(),
        block: editForm.block.trim(),
        phone_no: editForm.phone_no.trim() || null,
      })

      if (editingTarget?.name) {
        query = query.eq('name', editingTarget.name)
      }
      if (editingTarget?.block) {
        query = query.eq('block', editingTarget.block)
      }

      const { error } = await query

      if (error) {
        setEditFormError(error.message)
      } else {
        await fetchData()
        setIsEditModalOpen(false)
        setEditingTarget(null)
      }
    } catch (err: unknown) {
      setEditFormError(err instanceof Error ? err.message : 'Failed to update coordinator')
    } finally {
      setIsEditing(false)
    }
  }

  const handleOpenDelete = (c: BlockCoordinatorRow) => {
    setDeletingTarget(c)
    setDeleteError(null)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteCoordinator = async () => {
    if (!canDeleteCoordinator) {
      setDeleteError('Permission Denied: You do not have permission to delete coordinators.')
      return
    }
    if (!deletingTarget) return

    try {
      setIsDeleting(true)
      setDeleteError(null)

      let query = supabase.from('block_coordinators').delete()

      if (deletingTarget.name) {
        query = query.eq('name', deletingTarget.name)
      }
      if (deletingTarget.block) {
        query = query.eq('block', deletingTarget.block)
      }

      const { error } = await query

      if (error) {
        setDeleteError(error.message)
      } else {
        await fetchData()
        setIsDeleteModalOpen(false)
        setDeletingTarget(null)
      }
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete coordinator')
    } finally {
      setIsDeleting(false)
    }
  }

  // Dynamic calculations from live DB data
  const stats = useMemo(() => calculateCoordinatorStats(coordinators), [coordinators])

  // Get grievance count matching a coordinator's block
  const getCasesForBlock = (blockName: string | null) => getCoordinatorCases(grievances, blockName)

  const hasActionColumn = canEditCoordinator || canDeleteCoordinator

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
        title="Block Coordinators"
        subtitle="Jurisdiction Management & Assignment"
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        role={role}
        userEmail={user?.email}
        onSignOut={() => signOutUser()}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-darkblue via-[#38417c] to-lightblue p-5 sm:p-8 text-offwhite shadow-xl shadow-darkblue/10">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs">
              <MapPin className="w-3.5 h-3.5 text-orange" />
              Field Administration Directory
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
              Block &amp; Ward Coordinators
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-offwhite/85">
              Live coordinator contacts and jurisdiction assignments fetched directly from the database.
            </p>
          </div>

          <div className="hidden sm:block absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
            <Users className="w-64 h-64 text-white" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1">
          {stats.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="bg-white dark:bg-[#20243a] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray/20 shadow-sm hover:shadow-md transition-shadow space-y-3"
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
                  <div className="text-2xl sm:text-3xl font-bold text-darkblue dark:text-offwhite">
                    {loading ? '...' : item.count}
                  </div>
                  <p className="text-xs text-gray mt-1">{item.change}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Coordinators Directory using List component */}
        <div className="bg-white dark:bg-[#20243a] rounded-2xl sm:rounded-3xl border border-gray/20 shadow-sm p-4 sm:p-6 md:p-8">
          <List<BlockCoordinatorRow>
            items={coordinators}
            isLoading={loading || permissionsLoading}
            searchable
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search coordinator or block..."
            searchKeys={['name', 'block', 'phone_no']}
            title="Coordinators Directory"
            subtitle="Active field officers overseeing grievance resolution"
            count={coordinators.length}
            variant="divided"
            emptyTitle={!canViewCoordinators ? 'Access Restricted' : 'No block coordinators found'}
            emptyDescription={
              !canViewCoordinators
                ? 'You do not have permission to view block coordinators.'
                : 'No coordinator records match your search query.'
            }
            headerActions={
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchData}
                  isLoading={loading}
                  leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
                >
                  Refresh
                </Button>

                {canAddCoordinator && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsAddModalOpen(true)}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    <span className="hidden xs:inline">Add Coordinator</span>
                    <span className="xs:hidden">Add</span>
                  </Button>
                )}
              </div>
            }
            renderItem={(c, idx) => {
              const blockCases = getCasesForBlock(c.block)
              return (
                <ListItem
                  key={`${c.name}-${c.block}-${idx}`}
                  size="lg"
                  variant="flush"
                  leading={
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-lightblue/20 text-lightblue dark:bg-orange/20 dark:text-orange flex items-center justify-center font-bold text-sm uppercase shadow-xs">
                      {(c.name || 'C').charAt(0)}
                    </div>
                  }
                  title={c.name || 'Unnamed Coordinator'}
                  subtitle={
                    <div className="flex items-center gap-1.5 text-xs text-darkblue dark:text-offwhite mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-gray shrink-0" />
                      <span className="font-medium">{c.block || 'Unassigned Block'}</span>
                    </div>
                  }
                  meta={
                    <div className="flex items-center gap-2.5 flex-wrap mt-1">
                      {c.phone_no ? (
                        <a
                          href={`tel:${c.phone_no}`}
                          className="inline-flex items-center gap-1.5 text-xs text-gray hover:text-lightblue dark:hover:text-lightblue transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-gray shrink-0" />
                          <span>{c.phone_no}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-gray/60">No phone provided</span>
                      )}
                      <ListBadge variant="orange" size="sm">
                        {blockCases.active} Pending
                      </ListBadge>
                      <ListBadge variant="success" size="sm">
                        {blockCases.resolved} Resolved
                      </ListBadge>
                    </div>
                  }
                  trailing={
                    hasActionColumn ? (
                      <div className="flex items-center gap-1.5">
                        {canEditCoordinator && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="p-2 rounded-xl text-gray hover:text-lightblue hover:bg-lightblue/10 transition-colors cursor-pointer"
                            title="Edit Coordinator"
                            aria-label={`Edit ${c.name}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {canDeleteCoordinator && (
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(c)}
                            className="p-2 rounded-xl text-gray hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete Coordinator"
                            aria-label={`Delete ${c.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : undefined
                  }
                />
              )
            }}
          />
        </div>
      </main>

      {/* Add Coordinator Global Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Block Coordinator"
        subtitle="Create a new coordinator assignment"
        icon={<Users className="w-5 h-5" />}
        error={formError}
      >
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
            required
            value={newCoordinator.phone_no}
            onChange={(e) =>
              setNewCoordinator((prev) => ({ ...prev, phone_no: e.target.value }))
            }
          />

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-gray/15">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="w-full sm:w-auto"
            >
              Save Coordinator
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Coordinator Global Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingTarget(null)
        }}
        title="Edit Block Coordinator"
        subtitle="Update coordinator details & jurisdiction"
        icon={<Pencil className="w-5 h-5" />}
        error={editFormError}
      >
        <form onSubmit={handleEditCoordinator} className="space-y-4">
          <TextInput
            label="Full Name"
            placeholder="e.g. Ramesh Kumar"
            required
            value={editForm.name}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />

          <TextInput
            label="Block / Ward Name"
            placeholder="e.g. North Block, Block A, Room 101-120"
            required
            value={editForm.block}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, block: e.target.value }))
            }
          />

          <TextInput
            label="Phone Number"
            placeholder="e.g. +91 98765 43210"
            type="tel"
            required
            value={editForm.phone_no}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, phone_no: e.target.value }))
            }
          />

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-gray/15">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditModalOpen(false)
                setEditingTarget(null)
              }}
              disabled={isEditing}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isEditing}
              className="w-full sm:w-auto"
            >
              Update Coordinator
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Coordinator Global Confirm Modal */}
      {deletingTarget && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false)
            setDeletingTarget(null)
          }}
          onConfirm={handleDeleteCoordinator}
          title="Delete Coordinator"
          subtitle="This action cannot be undone."
          error={deleteError}
          isLoading={isDeleting}
          confirmText="Confirm Delete"
          details={
            <>
              <p className="font-semibold text-darkblue dark:text-offwhite">
                {deletingTarget.name || 'Unnamed Coordinator'}
              </p>
              <p className="text-gray">{deletingTarget.block || 'Unassigned Block'}</p>
              {deletingTarget.phone_no && <p className="text-gray">{deletingTarget.phone_no}</p>}
            </>
          }
        />
      )}
    </div>
  )
}

export default BlockCoordinators
