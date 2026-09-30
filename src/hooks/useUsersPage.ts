import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePermissions } from './usePermissions'
import { supabase } from '../lib/supabase'
import { createFirebaseUser } from '../lib/firebase'
import type {
  RoleRow,
  ProfileRow,
  UserItem,
  CreateUserFormData,
  UpdateUserRoleFormData,
  UserStatItem,
  UsersToast,
} from '../types'
import { Users, ShieldAlert, UserCheck, ShieldCheck } from 'lucide-react'

export function useUsersPage() {
  const { user: currentAuthUser, signOutUser } = useAuth()
  const {
    role: currentUserRole,
    displayName,
    isSuperAdmin,
    isAdminOrSuperAdmin,
    canViewUsers,
    canCreateUser,
    canAddUser,
    canEditUser,
    canDeleteUser,
    loading: permissionsLoading,
    refreshPermissions,
  } = usePermissions()

  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState<UsersToast | null>(null)

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const [activeUser, setActiveUser] = useState<UserItem | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Auto-clear toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
  }, [])

  // Fetch all profiles from Supabase and roles
  const fetchData = useCallback(async () => {
    if (!canViewUsers) {
      setLoading(false)
      setRefreshing(false)
      return
    }

    try {
      setRefreshing(true)
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('firebase_uid', { ascending: true }),
        supabase.from('roles').select('*').order('id', { ascending: true }),
      ])

      if (profilesRes.error) throw profilesRes.error
      if (rolesRes.error) throw rolesRes.error

      const profilesData: ProfileRow[] = profilesRes.data || []
      setProfiles(profilesData)
      setRoles(rolesRes.data || [])

      // Sync active authenticated user's email into Supabase profiles table if missing
      if (currentAuthUser && currentAuthUser.uid && currentAuthUser.email) {
        const existing = profilesData.find((p) => p.firebase_uid === currentAuthUser.uid)
        if (existing && !existing.email) {
          await supabase
            .from('profiles')
            .update({ email: currentAuthUser.email })
            .eq('firebase_uid', currentAuthUser.uid)
        }
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error fetching users from Supabase DB', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [canViewUsers, currentAuthUser, showToast])

  useEffect(() => {
    if (!permissionsLoading) {
      if (canViewUsers) {
        fetchData()
      } else {
        setLoading(false)
      }
    }
  }, [permissionsLoading, canViewUsers, fetchData])

  // Map roles by name
  const roleDescMap = useMemo(() => {
    const map = new Map<string, string | null>()
    roles.forEach((r) => {
      if (r.name) {
        map.set(r.name.toLowerCase().trim(), r.description)
      }
    })
    return map
  }, [roles])

  // Processed Users List directly from Supabase DB profiles
  const usersList: UserItem[] = useMemo(() => {
    const allUids = new Set<string>()
    profiles.forEach((p) => allUids.add(p.firebase_uid))
    if (currentAuthUser?.uid) allUids.add(currentAuthUser.uid)

    const profileMap = new Map<string, ProfileRow>()
    profiles.forEach((p) => profileMap.set(p.firebase_uid, p))

    return Array.from(allUids).map((uid) => {
      const isCurrent = currentAuthUser?.uid === uid
      const profile = profileMap.get(uid)
      const rawRole = profile?.role || 'user'
      const cleanRole = rawRole.toLowerCase().trim()

      let email = profile?.email
      if (!email && isCurrent && currentAuthUser?.email) {
        email = currentAuthUser.email
      }
      if (!email) {
        email = `user-${uid.substring(0, 8)}@firebase.auth`
      }

      let displayName = profile?.display_name
      if (!displayName && isCurrent && currentAuthUser?.displayName) {
        displayName = currentAuthUser.displayName
      }

      const roleDescription = roleDescMap.get(cleanRole) || null

      return {
        firebase_uid: uid,
        email,
        displayName,
        role: rawRole,
        roleDescription,
        createdAt: profile?.created_at,
        isCurrentUser: isCurrent,
      }
    })
  }, [profiles, currentAuthUser, roleDescMap])

  // Filtered Users based on Search & Role Filter
  const filteredUsers = useMemo(() => {
    return usersList.filter((item) => {
      // Role Filter
      if (selectedRoleFilter !== 'All') {
        if (item.role.toLowerCase().trim() !== selectedRoleFilter.toLowerCase().trim()) {
          return false
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const emailMatch = item.email.toLowerCase().includes(q)
        const nameMatch = (item.displayName || '').toLowerCase().includes(q)
        const uidMatch = item.firebase_uid.toLowerCase().includes(q)
        const roleMatch = item.role.toLowerCase().includes(q)

        if (!emailMatch && !nameMatch && !uidMatch && !roleMatch) {
          return false
        }
      }

      return true
    })
  }, [usersList, selectedRoleFilter, searchQuery])

  // System Stats
  const stats: UserStatItem[] = useMemo(() => {
    const total = usersList.length
    const superAdmins = usersList.filter((u) => u.role.toLowerCase().trim() === 'super_admin').length
    const admins = usersList.filter((u) => u.role.toLowerCase().trim() === 'admin').length
    const regularUsers = usersList.filter((u) => u.role.toLowerCase().trim() === 'user').length

    return [
      {
        title: 'Total Users',
        count: total,
        change: 'Supabase DB profiles synced',
        icon: Users,
        color: 'from-blue-600 to-indigo-600 text-white',
      },
      {
        title: 'Super Admins',
        count: superAdmins,
        change: 'Full System Access',
        icon: ShieldAlert,
        color: 'from-rose-500 to-red-600 text-white',
      },
      {
        title: 'Administrators',
        count: admins,
        change: 'Management Level',
        icon: ShieldCheck,
        color: 'from-amber-500 to-orange-600 text-white',
      },
      {
        title: 'Standard Users',
        count: regularUsers,
        change: 'Citizen Portal Access',
        icon: UserCheck,
        color: 'from-emerald-500 to-teal-600 text-white',
      },
    ]
  }, [usersList])

  // Modal Open Handlers
  const handleOpenAdd = useCallback(() => {
    setModalError(null)
    setIsAddModalOpen(true)
  }, [])

  const handleOpenEdit = useCallback((userItem: UserItem) => {
    setActiveUser(userItem)
    setModalError(null)
    setIsEditModalOpen(true)
  }, [])

  const handleOpenDelete = useCallback((userItem: UserItem) => {
    setActiveUser(userItem)
    setModalError(null)
    setIsDeleteModalOpen(true)
  }, [])

  // 1. Create New User in Firebase Auth and Store in Supabase `profiles` table
  const handleCreateUser = useCallback(
    async (formData: CreateUserFormData) => {
      if (!canCreateUser) {
        showToast('Permission denied: You do not have permission to create users.', 'error')
        return
      }

      const email = formData.email.trim().toLowerCase()
      const password = formData.password
      const displayName = formData.displayName?.trim() || undefined
      const role = formData.role.trim().toLowerCase()

      if (!email || !password || !role) {
        setModalError('Email, password, and role are required.')
        return
      }

      if (password.length < 6) {
        setModalError('Password must be at least 6 characters long for Firebase Authentication.')
        return
      }

      try {
        setActionLoading(true)
        setModalError(null)

        // 1. Create user in Firebase Authentication
        const createdFirebaseUser = await createFirebaseUser(email, password, displayName)

        // 2. Insert user record with email directly into Supabase `profiles` table
        const profilePayload: Record<string, unknown> = {
          firebase_uid: createdFirebaseUser.uid,
          role: role,
          email: createdFirebaseUser.email,
        }
        if (displayName) {
          profilePayload.display_name = displayName
        }

        const { error: profileError } = await supabase.from('profiles').upsert([profilePayload])

        if (profileError) {
          console.warn('Profile sync notice with email:', profileError.message)
          // Fallback in case columns are strictly typed
          await supabase.from('profiles').upsert([
            {
              firebase_uid: createdFirebaseUser.uid,
              role: role,
            },
          ])
        }

        await fetchData()
        await refreshPermissions()
        setIsAddModalOpen(false)
        showToast(`User ${email} created and saved to Supabase profiles DB!`, 'success')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create user'
        setModalError(msg)
        showToast(msg, 'error')
      } finally {
        setActionLoading(false)
      }
    },
    [canCreateUser, fetchData, refreshPermissions, showToast]
  )

  // 2. Update User Profile & Role in Supabase `profiles` table
  const handleUpdateUserRole = useCallback(
    async (formData: UpdateUserRoleFormData) => {
      if (!canEditUser) {
        showToast('Permission denied: You do not have permission to edit user roles.', 'error')
        return
      }

      const uid = formData.firebase_uid
      const newRole = formData.role.trim().toLowerCase()
      const newEmail = formData.email?.trim() || undefined
      const newDisplayName = formData.displayName?.trim() || undefined

      if (!uid || !newRole) {
        setModalError('Valid user UID and role are required.')
        return
      }

      try {
        setActionLoading(true)
        setModalError(null)

        const updatePayload: Record<string, unknown> = { role: newRole }
        if (newEmail) updatePayload.email = newEmail
        if (newDisplayName) updatePayload.display_name = newDisplayName

        const { error: updateError } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('firebase_uid', uid)

        if (updateError) {
          console.warn('Update notice fallback:', updateError.message)
          await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('firebase_uid', uid)
        }

        await fetchData()
        await refreshPermissions()
        setIsEditModalOpen(false)
        setActiveUser(null)
        showToast(`User profile and role updated in Supabase DB!`, 'success')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update user profile'
        setModalError(msg)
        showToast(msg, 'error')
      } finally {
        setActionLoading(false)
      }
    },
    [canEditUser, fetchData, refreshPermissions, showToast]
  )

  // 3. Delete User Profile from Supabase `profiles` table
  const handleDeleteUser = useCallback(async () => {
    if (!canDeleteUser) {
      showToast('Permission denied: You do not have permission to delete users.', 'error')
      return
    }

    if (!activeUser) return

    if (activeUser.isCurrentUser) {
      showToast('Action Forbidden: You cannot delete your own active administrator account.', 'error')
      setIsDeleteModalOpen(false)
      return
    }

    try {
      setActionLoading(true)
      setModalError(null)

      // Delete from Supabase profiles
      const { error: delError } = await supabase
        .from('profiles')
        .delete()
        .eq('firebase_uid', activeUser.firebase_uid)

      if (delError) throw delError

      await fetchData()
      await refreshPermissions()
      setIsDeleteModalOpen(false)
      setActiveUser(null)
      showToast(`User "${activeUser.email}" removed from Supabase DB!`, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete user'
      setModalError(msg)
      showToast(msg, 'error')
    } finally {
      setActionLoading(false)
    }
  }, [canDeleteUser, activeUser, fetchData, refreshPermissions, showToast])

  return {
    // Auth & Permission info
    currentUserRole,
    displayName,
    isSuperAdmin,
    isAdminOrSuperAdmin,
    canViewUsers,
    canCreateUser,
    canAddUser,
    canEditUser,
    canDeleteUser,
    permissionsLoading,
    currentAuthUser,
    signOutUser,

    // Data State
    usersList,
    filteredUsers,
    roles,
    stats,
    loading,
    refreshing,
    toast,

    // Search & Filter State
    searchQuery,
    setSearchQuery,
    selectedRoleFilter,
    setSelectedRoleFilter,

    // Modals State
    isAddModalOpen,
    setIsAddModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    activeUser,
    actionLoading,
    modalError,

    // Modal Triggers
    handleOpenAdd,
    handleOpenEdit,
    handleOpenDelete,
    setToast,

    // Mutations
    fetchData,
    handleCreateUser,
    handleUpdateUserRole,
    handleDeleteUser,
  }
}

export default useUsersPage
