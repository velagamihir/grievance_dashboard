import React, { useState } from 'react'
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
  ChevronDown,
} from 'lucide-react'
import { useDocumentTitle, useGrievancePage } from '../hooks'
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
  getStatusBadgeVariant,
  formatDate,
} from '../utils'
import type {
  GrievancePageProps,
  FormResponseRow,
} from '../types'

const ExpandableDescription: React.FC<{ text?: string | null }> = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text) return null

  const isLong = text.length > 110

  return (
    <div className="mt-2 bg-offwhite/70 dark:bg-[#151726]/60 p-3 rounded-xl border border-gray/10">
      <p
        className={`text-xs sm:text-sm text-darkblue/90 dark:text-offwhite/90 leading-relaxed whitespace-pre-line ${!isExpanded ? 'line-clamp-2 sm:line-clamp-3' : ''
          }`}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
          className="mt-1.5 text-xs font-semibold text-lightblue hover:text-lightblue/80 transition-colors inline-flex items-center gap-1 focus:outline-none cursor-pointer"
        >
          <span>{isExpanded ? 'Show less' : 'Show more'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
              }`}
          />
        </button>
      )}
    </div>
  )
}

export const GrievancePage: React.FC<GrievancePageProps> = ({
  isDark,
  onToggleTheme,
  currentPath = '/grievances',
  onNavigate,
}) => {
  useDocumentTitle('Grievances | Grievance Portal')

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [resolveConfirmItem, setResolveConfirmItem] = useState<{ id: number; name: string } | null>(null)
  const [resolvingStatus, setResolvingStatus] = useState(false)

  // Extracted custom hook containing all functions, state, and API operations
  const {
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
    displayName,
    allowedGrievanceType,
    canUpdateGrievanceStatus,
    user,
    setToast,
    setSearchQuery,
    setStatusFilter,
    setTypeFilter,
    setIsAddModalOpen,
    setIsEditModalOpen,
    setIsDeleteModalOpen,
    setFormData,
    setEditError,
    signOutUser,
    fetchGrievances,
    handleStatusChange,
    handleOpenAddModal,
    handleOpenEditModal,
    handleUpdateGrievance,
    handleOpenDeleteModal,
    handleDeleteGrievance,
    handleExportToExcel,
    handleGrievanceCreated,
  } = useGrievancePage()

  const onStatusSelectChange = (item: FormResponseRow, targetStatus: string) => {
    if (item.status === 'Resolved') {
      setToast({
        message: 'This grievance is marked as Resolved and its status cannot be changed back.',
        type: 'error',
      })
      return
    }

    if (!canEditStatus || !canUpdateGrievanceStatus(item)) {
      setToast({
        message: allowedGrievanceType
          ? `Permission Denied: Users assigned to "${allowedGrievanceType}" are not permitted to update status.`
          : 'Permission Denied: You do not have permission to update grievance status.',
        type: 'error',
      })
      return
    }

    if (targetStatus === 'Resolved') {
      setResolveConfirmItem({ id: item.id, name: item.name || 'this student' })
      return
    }

    handleStatusChange(item.id, targetStatus)
  }

  const handleConfirmResolve = async () => {
    if (!resolveConfirmItem) return
    try {
      setResolvingStatus(true)
      await handleStatusChange(resolveConfirmItem.id, 'Resolved')
      setResolveConfirmItem(null)
    } finally {
      setResolvingStatus(false)
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
          className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 max-w-sm sm:max-w-md z-[9999] flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${toast.type === 'success'
            ? 'bg-green-600 text-white shadow-green-600/20'
            : toast.type === 'error'
              ? 'bg-red-600 text-white shadow-red-600/20'
              : 'bg-darkblue text-white shadow-darkblue/20 dark:bg-orange dark:text-darkblue'
            }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : toast.type === 'error' ? (
              <ShieldAlert className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="truncate">{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="opacity-70 hover:opacity-100 ml-1 shrink-0 p-1 cursor-pointer"
            aria-label="Close toast"
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
        userName={displayName}
        onSignOut={() => signOutUser()}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
        {/* Banner Section */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-darkblue via-[#404a8b] to-lightblue p-5 sm:p-8 text-offwhite shadow-xl shadow-darkblue/10">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-orange" />
                Role-Based Grievance Operations
              </div>
              {allowedGrievanceType && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange/25 border border-orange/40 text-xs font-bold text-orange backdrop-blur-xs">
                  <Layers className="w-3.5 h-3.5" />
                  Scoped: {allowedGrievanceType} Grievances Only
                </div>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
              Grievance Records &amp; Actions
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-offwhite/85">
              Review filed grievances, update incident progress in real-time, edit grievance details, and submit new complaints.
            </p>
          </div>

          <div className="hidden sm:block absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
            <Layers className="w-64 h-64 text-white" />
          </div>
        </div>

        {/* Stats Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          <div className="bg-white dark:bg-[#20243a] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray/20 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray uppercase tracking-wider">
                Total Grievances
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-darkblue dark:text-offwhite mt-1">
                {stats.total}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-lightblue/15 text-lightblue dark:bg-lightblue/25">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#20243a] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray/20 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray uppercase tracking-wider">
                Not Yet Started
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-orange mt-1">
                {stats.notYetStarted}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-orange/15 text-orange dark:bg-orange/25">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#20243a] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray/20 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray uppercase tracking-wider">
                In Progress
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-darkblue dark:text-offwhite mt-1">
                {stats.inProgress}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-darkblue/15 text-darkblue dark:bg-darkblue/40 dark:text-offwhite">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#20243a] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray/20 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray uppercase tracking-wider">
                Resolved
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {stats.resolved}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-green-500/15 text-green-600 dark:bg-green-500/25 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* Grievance Management Section using Reusable List */}
        <div className="bg-white dark:bg-[#20243a] rounded-2xl sm:rounded-3xl border border-gray/20 shadow-sm p-4 sm:p-6 md:p-8 space-y-6">
          <List<FormResponseRow>
            title="Registered Complaints"
            subtitle={
              typeFilter === 'All'
                ? 'View, triage, and modify incident records'
                : `Filtered by category: ${typeFilter} (${filteredByTypeGrievances.length} records)`
            }
            count={filteredByTypeGrievances.length}
            items={filteredByTypeGrievances}
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
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Type of Grievance Filter or Scoped Category Badge */}
                {allowedGrievanceType ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange/15 border border-orange/30 text-xs font-bold text-orange shadow-xs">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Category: {allowedGrievanceType}</span>
                  </div>
                ) : (
                  <div className="relative flex items-center min-w-[150px] sm:min-w-[185px]">
                    <div className="absolute left-2.5 pointer-events-none text-lightblue dark:text-orange">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full appearance-none bg-offwhite dark:bg-[#151726] border border-gray/20 hover:border-lightblue/40 dark:hover:border-lightblue/40 rounded-xl pl-8 pr-7 py-1.5 text-xs font-semibold text-darkblue dark:text-offwhite focus:outline-none focus:ring-2 focus:ring-lightblue/25 cursor-pointer transition-all shadow-xs"
                      title="Filter by Type of Grievance"
                      aria-label="Filter by Type of Grievance"
                    >
                      <option value="All">All Categories ({grievances.length})</option>
                      {availableGrievanceTypes
                        .filter((t) => t !== 'All')
                        .map((type) => {
                          const count = grievances.filter(
                            (g) => (g.type_of_grievance || '').toLowerCase() === type.toLowerCase()
                          ).length
                          return (
                            <option
                              key={type}
                              value={type}
                              className="bg-white dark:bg-[#1a1d2e] text-darkblue dark:text-offwhite font-normal"
                            >
                              {type} ({count})
                            </option>
                          )
                        })}
                    </select>
                    <span className="pointer-events-none absolute right-2.5 text-xs text-gray opacity-60">▾</span>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportToExcel}
                  disabled={!canViewAllGrievances || fullyFilteredGrievances.length === 0}
                  leftIcon={<Download className="w-4 h-4" />}
                  title={
                    typeFilter !== 'All' || statusFilter !== 'All'
                      ? `Export ${fullyFilteredGrievances.length} filtered grievance(s) to Excel`
                      : 'Export all grievances to Excel'
                  }
                >
                  <span className="hidden sm:inline">Export Excel</span>
                  <span className="sm:hidden">Export</span>
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
                    <span className="hidden xs:inline">Add Grievance</span>
                    <span className="xs:hidden">Add</span>
                  </Button>
                )}
              </div>
            }
            emptyTitle={
              !canViewAllGrievances
                ? 'Access Restricted'
                : filteredByTypeGrievances.length === 0
                  ? 'No Grievances in Database'
                  : 'No Matching Grievances'
            }
            emptyDescription={
              !canViewAllGrievances
                ? 'You do not have permission to view grievances. Please contact your administrator to assign role permissions.'
                : filteredByTypeGrievances.length === 0
                  ? 'No grievances have been registered in the database for this category yet.'
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
                    <ExpandableDescription text={item.problem_description} />
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
                      {(() => {
                        const isAllowed = canEditStatus && canUpdateGrievanceStatus(item)
                        const isStatusDisabled = !isAllowed || item.status === 'Resolved'

                        return (
                          <div className="relative flex items-center">
                            <select
                              value={item.status || 'Not Yet Started'}
                              onChange={(e) => onStatusSelectChange(item, e.target.value)}
                              disabled={isStatusDisabled}
                              title={
                                item.status === 'Resolved'
                                  ? 'This grievance is marked as Resolved and cannot be changed back.'
                                  : !canEditStatus || !isAllowed
                                    ? allowedGrievanceType
                                      ? `Permission Denied: Users assigned to "${allowedGrievanceType}" are not permitted to update status`
                                      : 'Permission Denied: Only authorized coordinators & admins can change status'
                                    : 'Change grievance status'
                              }
                              className={`appearance-none text-xs font-semibold py-1.5 pl-3 pr-8 rounded-xl border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-lightblue/30 ${
                                item.status === 'Resolved'
                                  ? 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30 cursor-not-allowed opacity-90'
                                  : isStatusDisabled
                                    ? 'cursor-not-allowed opacity-60'
                                    : 'cursor-pointer'
                              } ${
                                item.status === 'In progress'
                                  ? 'bg-lightblue/15 text-lightblue dark:text-lightblue border-lightblue/30'
                                  : item.status === 'Resolved'
                                    ? ''
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
                        )
                      })()}

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
          onSuccess={handleGrievanceCreated}
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
            alert={editError ? { type: 'error', message: editError } : null}
            onCancel={() => {
              setIsEditModalOpen(false)
              setEditError(null)
            }}
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
                options: allowedGrievanceType ? [allowedGrievanceType] : GRIEVANCE_TYPES,
                disabled: Boolean(allowedGrievanceType),
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
                disabled: !canEditStatus || selectedGrievance.status === 'Resolved',
                options: STATUS_OPTIONS.map((s) => s.value),
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
                placeholder: 'e.g. Room 304, Block B',
                helperText: 'Mandatory if Bus No / Route is not specified',
                type: 'text',
                leftIcon: <Building className="w-4 h-4" />,
                colSpan: 1,
              },
              {
                name: 'bus_number',
                label: 'Bus No / Route',
                placeholder: 'e.g. Route 14 / KA-01-F-4421',
                helperText: 'Mandatory if Room & Block is not specified',
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
            onChange={(name, value) => {
              setFormData((prev) => ({ ...prev, [name]: value }))
              if (editError) setEditError(null)
            }}
          />
        </Modal>
      )}

      {/* ========================================== */}
      {/* RESOLVE STATUS CONFIRMATION MODAL          */}
      {/* ========================================== */}
      {resolveConfirmItem && (
        <ConfirmModal
          isOpen={Boolean(resolveConfirmItem)}
          onClose={() => setResolveConfirmItem(null)}
          onConfirm={handleConfirmResolve}
          title={`Mark Grievance #${resolveConfirmItem.id} as Resolved?`}
          subtitle="Final Resolution Confirmation"
          variant="primary"
          confirmText="Yes, Mark as Resolved"
          cancelText="Cancel"
          isLoading={resolvingStatus}
          message={
            <div className="space-y-2">
              <p className="text-xs sm:text-sm text-darkblue/90 dark:text-offwhite/90">
                Are you sure you want to mark the grievance for{' '}
                <strong>{resolveConfirmItem.name}</strong> as <strong>Resolved</strong>?
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-500/20">
                ⚠️ Once marked as Resolved, this grievance will be locked and cannot be changed back to any other status.
              </p>
            </div>
          }
        />
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
