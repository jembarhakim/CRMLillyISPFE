import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { userManagementAdminApi } from '@/api/admin/user-management'
import { 
  hasPermission, 
  canAccessMenu, 
  canAccessMenuByFeature,
  getMenuForRole, 
  getMenuForFeaturePermissions,
  getRoleDisplayName, 
  getRoleDescription,
  normalizeRole,
  ROLES,
  ROLE_CONFIGS,
  MAIN_MENU,
  type MenuItem
} from '@/utilities/rolePermissions'

export function useRolePermissions() {
  const authStore = useAuthStore()

  // Feature permissions from database
  const featurePermissions = ref<Record<string, number>>({})
  const isLoadingPermissions = ref(false)

  // Current user's role (normalized)
  const userRole = computed(() => {
    const role = authStore.user?.role || ''
    return normalizeRole(role)
  })

  // Current user's menu items (using feature permissions)
  const userMenu = computed(() => {
    if (Object.keys(featurePermissions.value).length === 0) {
      // Fallback to role-based menu if no feature permissions loaded
      if (!userRole.value) return []
      return getMenuForRole(userRole.value)
    }
    return getMenuForFeaturePermissions(featurePermissions.value)
  })

  // Load feature permissions from database
  const loadFeaturePermissions = async () => {
    try {
      isLoadingPermissions.value = true
      const response = await userManagementAdminApi().getUserRolePermissions()
      featurePermissions.value = response.data
    } catch (error) {
      console.error('Failed to load feature permissions:', error)
      // Fallback to empty permissions (will use role-based menu)
      featurePermissions.value = {}
    } finally {
      isLoadingPermissions.value = false
    }
  }

  // Check if user has specific permission
  const can = (permission: string) => {
    return hasPermission(userRole.value, permission)
  }

  // Check if user can access specific menu item
  const canAccess = (menuItem: MenuItem) => {
    return canAccessMenu(userRole.value, menuItem)
  }

  // Check if user can access specific menu item by feature
  const canAccessByFeature = (menuItem: MenuItem) => {
    return canAccessMenuByFeature(featurePermissions.value, menuItem)
  }

  // Check if user can access specific feature
  const canAccessFeature = (feature: string) => {
    return featurePermissions.value[feature] === 1
  }

  // Get role display name
  const getRoleName = (role?: string) => {
    return getRoleDisplayName(role || userRole.value)
  }

  // Get role description
  const getRoleDesc = (role?: string) => {
    return getRoleDescription(role || userRole.value)
  }

  // Check if user is admin
  const isAdmin = computed(() => userRole.value === ROLES.ADMIN)

  // Check if user is customer service
  const isCustomerService = computed(() => userRole.value === ROLES.CUSTOMER_SERVICE)

  // Check if user is NOC
  const isNOC = computed(() => userRole.value === ROLES.NOC)

  // Check if user is technician
  const isTechnician = computed(() => userRole.value === ROLES.TECHNICIAN)

  // Check if user is finance
  const isFinance = computed(() => userRole.value === ROLES.FINANCE)

  // Get all available roles
  const availableRoles = computed(() => Object.values(ROLES))

  // Get role configurations
  const roleConfigs = computed(() => ROLE_CONFIGS)

  return {
    // User state
    userRole,
    userMenu,
    
    // Feature permissions
    featurePermissions,
    isLoadingPermissions,
    loadFeaturePermissions,
    
    // Permission checks
    can,
    canAccess,
    canAccessByFeature,
    canAccessFeature,
    
    // Role information
    getRoleName,
    getRoleDesc,
    availableRoles,
    roleConfigs,
    
    // Role type checks
    isAdmin,
    isCustomerService,
    isNOC,
    isTechnician,
    isFinance,
    
    // Constants
    ROLES,
    MAIN_MENU
  }
}
