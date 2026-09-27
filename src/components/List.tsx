import React, { useState, useMemo } from 'react'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Inbox,
  X,
} from 'lucide-react'
import { Button } from './Buttons'
import { TextInput } from './TextInput'
import type {
  ListProps,
  ListItemProps,
  ListHeaderProps,
  ListPaginationProps,
  ListFilterProps,
  ListEmptyStateProps,
  ListBadgeProps,
  ListBadgeVariant,
  ListItemVariant,
  ListItemSize,
  ListVariant,
} from '../types'

// ==========================================
// List Badge Component
// ==========================================

const badgeVariantStyles: Record<ListBadgeVariant, string> = {
  success: 'bg-green-500/15 text-green-600 dark:bg-green-500/25 dark:text-green-400 border-green-500/20',
  warning: 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/25 dark:text-amber-400 border-amber-500/20',
  error: 'bg-red-500/15 text-red-600 dark:bg-red-500/25 dark:text-red-400 border-red-500/20',
  info: 'bg-blue-500/15 text-blue-600 dark:bg-blue-500/25 dark:text-blue-400 border-blue-500/20',
  neutral: 'bg-gray/15 text-gray dark:bg-gray/25 dark:text-gray/90 border-gray/20',
  orange: 'bg-orange/15 text-orange dark:bg-orange/25 dark:text-orange border-orange/20',
  lightblue: 'bg-lightblue/15 text-lightblue dark:bg-lightblue/25 dark:text-lightblue border-lightblue/20',
  darkblue: 'bg-darkblue/15 text-darkblue dark:bg-darkblue/40 dark:text-offwhite border-darkblue/20',
}

export const ListBadge: React.FC<ListBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
}) => {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border transition-colors ${badgeVariantStyles[variant]} ${sizeClass} ${className}`}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  )
}

// ==========================================
// List Item Component
// ==========================================

const itemVariantStyles: Record<ListItemVariant, string> = {
  default:
    'hover:bg-offwhite/80 dark:hover:bg-[#1a1d2e]/80 transition-colors duration-150',
  card:
    'bg-white dark:bg-[#20243a] border border-gray/20 rounded-2xl shadow-xs hover:shadow-md hover:border-lightblue/40 dark:hover:border-lightblue/40 transition-all duration-200',
  bordered:
    'border border-gray/15 rounded-xl hover:border-gray/30 hover:bg-offwhite/50 dark:hover:bg-[#1a1d2e]/50 transition-all duration-150',
  flush:
    'hover:bg-offwhite/60 dark:hover:bg-[#1a1d2e]/60 transition-colors duration-150',
}

const itemSizeStyles: Record<ListItemSize, string> = {
  sm: 'py-2.5 px-3 gap-2.5 text-xs',
  md: 'py-3.5 px-4 gap-3 text-sm',
  lg: 'py-4.5 px-5 gap-4 text-base',
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  description,
  leading,
  trailing,
  meta,
  onClick,
  href,
  selected = false,
  disabled = false,
  variant = 'default',
  size = 'md',
  className = '',
  badge,
}) => {
  const isClickable = Boolean(onClick || href) && !disabled

  const content = (
    <div className="flex items-center justify-between w-full min-w-0 gap-3">
      {/* Left side: Leading icon/avatar + Content */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {leading && (
          <div className="shrink-0 flex items-center justify-center">
            {leading}
          </div>
        )}

        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-semibold text-darkblue dark:text-offwhite truncate">
              {title}
            </div>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>

          {subtitle && (
            <div className="text-xs text-gray truncate mt-0.5">
              {subtitle}
            </div>
          )}

          {description && (
            <div className="text-xs text-gray/80 mt-1 line-clamp-2">
              {description}
            </div>
          )}

          {meta && (
            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray/75 flex-wrap">
              {meta}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Trailing content (actions, buttons, chevrons) */}
      {trailing && (
        <div
          className="shrink-0 flex items-center gap-2"
          onClick={(e) => {
            // Prevent container click when clicking interactive elements in trailing
            if (isClickable) e.stopPropagation()
          }}
        >
          {trailing}
        </div>
      )}
    </div>
  )

  const commonClasses = `w-full flex items-center ${itemVariantStyles[variant]} ${itemSizeStyles[size]} ${selected
    ? 'bg-lightblue/10 dark:bg-lightblue/20 border-lightblue dark:border-lightblue ring-1 ring-lightblue/30'
    : ''
    } ${disabled
      ? 'opacity-50 pointer-events-none'
      : isClickable
        ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-lightblue/40'
        : ''
    } ${className}`

  if (href) {
    return (
      <a href={href} className={commonClasses}>
        {content}
      </a>
    )
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={commonClasses}
      >
        {content}
      </button>
    )
  }

  return <div className={commonClasses}>{content}</div>
}

// ==========================================
// List Skeleton / Loading Component
// ==========================================

export const ListSkeleton: React.FC<{ rows?: number; variant?: ListItemVariant; size?: ListItemSize }> = ({
  rows = 4,
  variant = 'default',
  size = 'md',
}) => {
  const sizeClass = size === 'sm' ? 'py-3' : size === 'lg' ? 'py-5' : 'py-4'

  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`flex items-center justify-between px-4 ${sizeClass} rounded-2xl bg-offwhite/60 dark:bg-[#1f233a]/60 animate-pulse ${variant === 'card' ? 'border border-gray/10' : ''
            }`}
        >
          <div className="flex items-center gap-3.5 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-gray/20 dark:bg-gray/30 shrink-0" />
            <div className="space-y-2 flex-1 max-w-sm">
              <div className="h-4 bg-gray/20 dark:bg-gray/30 rounded-md w-3/4" />
              <div className="h-3 bg-gray/15 dark:bg-gray/20 rounded-md w-1/2" />
            </div>
          </div>
          <div className="h-8 w-20 bg-gray/20 dark:bg-gray/30 rounded-xl shrink-0" />
        </div>
      ))}
    </div>
  )
}

// ==========================================
// List Empty State Component
// ==========================================

export const ListEmptyState: React.FC<ListEmptyStateProps> = ({
  icon,
  title = 'No items found',
  description = 'Try adjusting your search criteria or filters.',
  action,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`py-12 px-6 flex flex-col items-center justify-center text-center rounded-3xl border-2 border-dashed border-gray/20 bg-white/40 dark:bg-[#20243a]/40 space-y-3.5 ${className}`}
    >
      <div className="p-4 rounded-3xl bg-lightblue/10 dark:bg-lightblue/20 text-lightblue">
        {icon || <Inbox className="w-8 h-8" />}
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-base font-bold text-darkblue dark:text-offwhite">
          {title}
        </h4>
        <p className="text-xs sm:text-sm text-gray">{description}</p>
      </div>
      {action ? (
        action
      ) : actionLabel && onAction ? (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}

// ==========================================
// List Filter Component
// ==========================================

export const ListFilter: React.FC<ListFilterProps> = ({
  options,
  selectedValue,
  onSelect,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1 bg-offwhite dark:bg-[#151726] p-1 rounded-2xl border border-gray/20 text-xs ${className}`}
    >
      {options.map((opt) => {
        const value = typeof opt === 'string' ? opt : opt.value
        const label = typeof opt === 'string' ? opt : opt.label
        const count = typeof opt === 'object' ? opt.count : undefined
        const isSelected = selectedValue === value

        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all duration-150 flex items-center gap-1.5 focus:outline-none ${isSelected
              ? 'bg-darkblue text-offwhite dark:bg-orange dark:text-darkblue shadow-xs font-semibold'
              : 'text-gray hover:text-darkblue dark:hover:text-offwhite hover:bg-gray/10 dark:hover:bg-gray/20'
              }`}
          >
            <span>{label}</span>
            {count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected
                  ? 'bg-white/20 text-offwhite dark:bg-darkblue/20 dark:text-darkblue'
                  : 'bg-gray/20 text-gray'
                  }`}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ==========================================
// List Pagination Component
// ==========================================

export const ListPagination: React.FC<ListPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  className = '',
  showPageNumbers = true,
}) => {
  if (totalPages <= 1 && !totalItems) return null

  const startItem = totalItems !== undefined && pageSize !== undefined
    ? Math.min((currentPage - 1) * pageSize + 1, totalItems)
    : undefined
  const endItem = totalItems !== undefined && pageSize !== undefined
    ? Math.min(currentPage * pageSize, totalItems)
    : undefined

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray/15 text-xs text-gray ${className}`}
    >
      {/* Items Count Summary */}
      <div className="flex items-center gap-3">
        {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
          <span>
            Showing <strong className="text-darkblue dark:text-offwhite">{startItem}</strong> -{' '}
            <strong className="text-darkblue dark:text-offwhite">{endItem}</strong> of{' '}
            <strong className="text-darkblue dark:text-offwhite">{totalItems}</strong> items
          </span>
        ) : (
          <span>
            Page <strong className="text-darkblue dark:text-offwhite">{currentPage}</strong> of{' '}
            <strong className="text-darkblue dark:text-offwhite">{totalPages}</strong>
          </span>
        )}

        {/* Page Size Selector */}
        {onPageSizeChange && pageSize && (
          <div className="flex items-center gap-1.5 ml-2">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-offwhite dark:bg-[#151726] border border-gray/20 rounded-lg px-2 py-1 text-xs text-darkblue dark:text-offwhite focus:outline-none focus:border-lightblue"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {showPageNumbers &&
          Array.from({ length: totalPages }).map((_, i) => {
            const pageNum = i + 1
            // Simple windowing for many pages
            if (
              totalPages > 7 &&
              pageNum !== 1 &&
              pageNum !== totalPages &&
              Math.abs(pageNum - currentPage) > 1
            ) {
              if (pageNum === 2 || pageNum === totalPages - 1) {
                return (
                  <span key={pageNum} className="px-1 text-gray">
                    ...
                  </span>
                )
              }
              return null
            }

            const isCurrent = pageNum === currentPage
            return (
              <Button
                key={pageNum}
                variant={isCurrent ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className={isCurrent ? 'font-bold' : ''}
              >
                {pageNum}
              </Button>
            )
          })}

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// ==========================================
// List Header Component
// ==========================================

export const ListHeader: React.FC<ListHeaderProps> = ({
  title,
  subtitle,
  count,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search items...',
  filterOptions,
  selectedFilter,
  onFilterSelect,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray/15 ${className}`}
    >
      {/* Title & Count */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-2.5">
          {title && (
            <h3 className="text-xl font-bold text-darkblue dark:text-offwhite leading-tight">
              {title}
            </h3>
          )}
          {count !== undefined && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-lightblue/15 text-lightblue dark:bg-lightblue/25">
              {count}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray">{subtitle}</p>
        )}
      </div>

      {/* Interactive Controls (Search, Filters, Actions) */}
      <div className="flex flex-wrap items-center gap-3">
        {onSearchChange && (
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <TextInput
              size="sm"
              placeholder={searchPlaceholder}
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-gray" />}
              rightIcon={
                searchQuery ? (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="hover:text-darkblue dark:hover:text-offwhite cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : undefined
              }
            />
          </div>
        )}

        {filterOptions && selectedFilter && onFilterSelect && (
          <ListFilter
            options={filterOptions}
            selectedValue={selectedFilter}
            onSelect={onFilterSelect}
          />
        )}

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

// ==========================================
// Main Generic List Component
// ==========================================

const listVariantStyles: Record<ListVariant, string> = {
  divided: 'divide-y divide-gray/15',
  spaced: 'space-y-3',
  card: 'space-y-3',
  bordered: 'border border-gray/20 rounded-2xl overflow-hidden divide-y divide-gray/15 bg-white dark:bg-[#20243a]',
  flush: 'space-y-1',
}

export function List<T = any>({
  items,
  renderItem,
  keyExtractor = (_item, idx) => idx,
  children,
  header,
  footer,
  title,
  subtitle,
  count,
  searchable = false,
  searchQuery: controlledSearchQuery,
  onSearchChange: controlledOnSearchChange,
  searchPlaceholder = 'Search...',
  searchKeys,
  filterOptions,
  selectedFilter: controlledSelectedFilter,
  onFilterSelect: controlledOnFilterSelect,
  filterFn,
  headerActions,
  isLoading = false,
  loadingRows = 4,
  skeleton,
  emptyState,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  pagination = false,
  pageSize = 10,
  currentPage: controlledCurrentPage,
  onPageChange: controlledOnPageChange,
  variant = 'divided',
  layout = 'list',
  gridCols = 1,
  className = '',
  containerClassName = '',
  itemClassName = '',
  onItemClick,
}: ListProps<T>) {
  // Internal state for uncontrolled usage
  const [internalSearch, setInternalSearch] = useState('')
  const [internalFilter, setInternalFilter] = useState(
    filterOptions && filterOptions.length > 0
      ? typeof filterOptions[0] === 'string'
        ? filterOptions[0]
        : filterOptions[0].value
      : 'All'
  )
  const [internalPage, setInternalPage] = useState(1)

  const activeSearch = controlledSearchQuery !== undefined ? controlledSearchQuery : internalSearch
  const handleSearchChange = controlledOnSearchChange || setInternalSearch

  const activeFilter = controlledSelectedFilter !== undefined ? controlledSelectedFilter : internalFilter
  const handleFilterSelect = (val: string) => {
    if (controlledOnFilterSelect) {
      controlledOnFilterSelect(val)
    } else {
      setInternalFilter(val)
      setInternalPage(1)
    }
  }

  const activePage = controlledCurrentPage !== undefined ? controlledCurrentPage : internalPage
  const handlePageChange = (page: number) => {
    if (controlledOnPageChange) {
      controlledOnPageChange(page)
    } else {
      setInternalPage(page)
    }
  }

  // Filter & Search Logic
  const filteredItems = useMemo(() => {
    if (!items) return []

    return items.filter((item) => {
      // 1. Search filter
      if (activeSearch.trim()) {
        const query = activeSearch.toLowerCase().trim()
        if (searchKeys && searchKeys.length > 0) {
          const match = searchKeys.some((key) => {
            const val = item[key]
            return val !== undefined && val !== null && String(val).toLowerCase().includes(query)
          })
          if (!match) return false
        } else if (typeof item === 'object' && item !== null) {
          const match = Object.values(item).some((val) =>
            val !== undefined && val !== null && String(val).toLowerCase().includes(query)
          )
          if (!match) return false
        } else if (String(item).toLowerCase().indexOf(query) === -1) {
          return false
        }
      }

      // 2. Custom or standard filter
      if (filterOptions && activeFilter && activeFilter !== 'All') {
        if (filterFn) {
          return filterFn(item, activeFilter)
        }
        if (typeof item === 'object' && item !== null && 'status' in (item as any)) {
          return (item as any).status === activeFilter
        }
      }

      return true
    })
  }, [items, activeSearch, searchKeys, activeFilter, filterOptions, filterFn])

  // Pagination Logic
  const totalItemsCount = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalItemsCount / pageSize))
  const paginatedItems = useMemo(() => {
    if (!pagination) return filteredItems
    const start = (activePage - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, pagination, activePage, pageSize])

  // Responsive Grid layout classes
  const gridClasses = useMemo(() => {
    if (layout !== 'grid') return ''
    if (typeof gridCols === 'number') {
      return `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${gridCols} gap-4`
    }
    return `grid grid-cols-${gridCols.sm || 1} sm:grid-cols-${gridCols.md || 2} lg:grid-cols-${gridCols.lg || 3} gap-4`
  }, [layout, gridCols])

  // Check if custom or built-in header is needed
  const hasBuiltinHeader = Boolean(
    title ||
    subtitle ||
    searchable ||
    filterOptions ||
    headerActions ||
    count !== undefined
  )

  return (
    <div className={`space-y-6 ${containerClassName}`}>
      {/* Header Slot */}
      {header ? (
        header
      ) : hasBuiltinHeader ? (
        <ListHeader
          title={title}
          subtitle={subtitle}
          count={count !== undefined ? count : items ? items.length : undefined}
          searchQuery={searchable ? activeSearch : undefined}
          onSearchChange={searchable ? handleSearchChange : undefined}
          searchPlaceholder={searchPlaceholder}
          filterOptions={filterOptions}
          selectedFilter={activeFilter}
          onFilterSelect={handleFilterSelect}
          actions={headerActions}
        />
      ) : null}

      {/* Main Content Area */}
      {isLoading ? (
        skeleton || <ListSkeleton rows={loadingRows} variant={variant === 'card' ? 'card' : 'default'} />
      ) : items ? (
        paginatedItems.length === 0 ? (
          emptyState || (
            <ListEmptyState
              title={emptyTitle}
              description={emptyDescription}
              actionLabel={emptyActionLabel}
              onAction={onEmptyAction}
            />
          )
        ) : (
          <div className={`${layout === 'grid' ? gridClasses : listVariantStyles[variant]} ${className}`}>
            {paginatedItems.map((item, index) => {
              const key = keyExtractor(item, index)
              const rendered = renderItem ? renderItem(item, index) : (item as React.ReactNode)

              if (onItemClick) {
                return (
                  <div
                    key={key}
                    onClick={() => onItemClick(item, index)}
                    className={itemClassName}
                  >
                    {rendered}
                  </div>
                )
              }

              return <React.Fragment key={key}>{rendered}</React.Fragment>
            })}
          </div>
        )
      ) : (
        <div className={`${layout === 'grid' ? gridClasses : listVariantStyles[variant]} ${className}`}>
          {children}
        </div>
      )}

      {/* Pagination Slot */}
      {pagination && !isLoading && items && items.length > 0 && (
        <ListPagination
          currentPage={activePage}
          totalPages={totalPages}
          totalItems={totalItemsCount}
          pageSize={pageSize}
          onPageChange={handlePageChange}
        />
      )}

      {/* Footer Slot */}
      {footer}
    </div>
  )
}

export default List
