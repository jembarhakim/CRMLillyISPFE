// Role-based permissions and menu configuration
export interface MenuItem {
  label: string
  icon: string
  link: string
  feature?: string
  roles?: string[] // Keep for backward compatibility
  description?: string
}

export interface RoleConfig {
  name: string
  displayName: string
  description: string
  permissions: string[]
}

// Define all available roles
export const ROLES = {
  ADMIN: 'ADMIN',
  CUSTOMER_SERVICE: 'CUSTOMER_SERVICE', 
  NOC: 'NOC',
  TECHNICIAN: 'TECHNICIAN',
  FINANCE: 'FINANCE'
} as const

// Role mapping to handle backend role names (with spaces) to frontend role names (with underscores)
export const ROLE_MAPPING: Record<string, string> = {
  'CUSTOMER SERVICE': 'CUSTOMER_SERVICE',
  'CUSTOMER_SERVICE': 'CUSTOMER_SERVICE',
  'ADMIN': 'ADMIN',
  'NOC': 'NOC',
  'TECHNICIAN': 'TECHNICIAN',
  'FINANCE': 'FINANCE'
}

// Function to normalize role names
export function normalizeRole(role: string): string {
  return ROLE_MAPPING[role] || role
}

// Role configurations
export const ROLE_CONFIGS: Record<string, RoleConfig> = {
  [ROLES.ADMIN]: {
    name: ROLES.ADMIN,
    displayName: 'Administrator',
    description: 'Full system access',
    permissions: ['*'] // All permissions
  },
  [ROLES.CUSTOMER_SERVICE]: {
    name: ROLES.CUSTOMER_SERVICE,
    displayName: 'Customer Service',
    description: 'Customer management and ticket handling',
    permissions: [
      'dashboard:view',
      'customer:manage',
      'customer:view',
      'area:view',
      'area:manage',
      'report:view',
      'internet_package:view',
      'internet_package:manage',
      'assets:view',
      'assets:manage',
      'company:view',
      'company:manage',
      'invoice:view',
      'invoice:manage',
      'transaction:view',
      'transaction:manage',
      'tickets:view',
      'tickets:manage',
      'tickets:create',
      'trouble_reports:view',
      'trouble_reports:manage'
    ]
  },
  [ROLES.NOC]: {
    name: ROLES.NOC,
    displayName: 'Network Operations Center',
    description: 'Network monitoring and technical support',
    permissions: [
      'dashboard:view',
      'customer:view',
      'report:view',
      'tickets:view',
      'tickets:manage',
      'trouble_reports:view'
    ]
  },
  [ROLES.TECHNICIAN]: {
    name: ROLES.TECHNICIAN,
    displayName: 'Technician',
    description: 'Field work and technical resolution',
    permissions: [
      'dashboard:view',
      'customer:view',
      'tickets:view',
      'tickets:manage',
      'trouble_reports:view'
    ]
  },
  [ROLES.FINANCE]: {
    name: ROLES.FINANCE,
    displayName: 'Finance',
    description: 'Financial management and reporting',
    permissions: [
      'dashboard:view',
      'report:view',
      'invoice:manage',
      'transaction:manage'
    ]
  }
}

// Main navigation menu with role-based permissions
export const MAIN_MENU: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: 'i-heroicons-home',
    link: '/dashboard',
    feature: 'dashboard',
    description: 'Main dashboard overview'
  },
  {
    label: 'Customer',
    icon: 'i-heroicons-user-circle-16-solid',
    link: '/dashboard/customer',
    feature: 'customer',
    description: 'Customer management'
  },
  {
    label: 'Area',
    icon: 'i-heroicons-map',
    link: '/dashboard/area',
    feature: 'area',
    description: 'Geographic area management'
  },
  {
    label: 'Report',
    icon: 'i-heroicons-book-open-solid',
    link: '/dashboard/report',
    feature: 'report',
    description: 'System reports and analytics'
  },
  {
    label: 'Internet Package',
    icon: 'i-heroicons-wifi-16-solid',
    link: '/dashboard/internet-package',
    feature: 'internet_package',
    description: 'Internet package management'
  },
  {
    label: 'Assets',
    icon: 'i-heroicons-arrow-down-on-square-stack',
    link: '/dashboard/asset',
    feature: 'assets',
    description: 'Asset inventory management'
  },
  {
    label: 'Company',
    icon: 'i-heroicons-building-office-16-solid',
    link: '/dashboard/companies',
    feature: 'company',
    description: 'Company management'
  },
  {
    label: 'Invoice',
    icon: 'i-heroicons-document-currency-dollar-16-solid',
    link: '/dashboard/invoice',
    feature: 'invoice',
    description: 'Invoice management'
  },
  {
    label: 'Recurring Invoices',
    icon: 'i-heroicons-arrow-path-16-solid',
    link: '/dashboard/recurring-invoice',
    feature: 'invoice',
    description: 'Recurring invoice management'
  },
  {
    label: 'Transaction',
    icon: 'i-heroicons-document-currency-dollar-16-solid',
    link: '/dashboard/transaction',
    feature: 'transaction',
    description: 'Financial transactions'
  },
  {
    label: 'Tickets',
    icon: 'i-heroicons-exclamation-triangle-16-solid',
    link: '/dashboard/tickets',
    feature: 'tickets',
    description: 'Support ticket management'
  },
  {
    label: 'Trouble Reports',
    icon: 'i-heroicons-exclamation-triangle-16-solid',
    link: '/dashboard/trouble-reports',
    feature: 'trouble_reports',
    description: 'Trouble report management'
  },
  {
    label: 'User Management',
    icon: 'i-heroicons-user-circle-16-solid',
    link: '/dashboard/user-management',
    feature: 'user_management',
    description: 'User and role management'
  }
]

// Utility functions for role-based access control
export function hasPermission(userRole: string, permission: string): boolean {
  const normalizedRole = normalizeRole(userRole)
  const roleConfig = ROLE_CONFIGS[normalizedRole]
  if (!roleConfig) return false
  
  // Admin has all permissions
  if (roleConfig.permissions.includes('*')) return true
  
  return roleConfig.permissions.includes(permission)
}

export function canAccessMenu(userRole: string, menuItem: MenuItem): boolean {
  // If no roles specified, allow access
  if (!menuItem.roles || menuItem.roles.length === 0) {
    return true
  }
  
  return menuItem.roles.includes(userRole)
}

export function canAccessMenuByFeature(featurePermissions: Record<string, number>, menuItem: MenuItem): boolean {
  // If no feature specified, allow access
  if (!menuItem.feature) {
    return true
  }
  
  // Check if user has permission for this feature (can_access = 1)
  return featurePermissions[menuItem.feature] === 1
}

export function getMenuForRole(userRole: string): MenuItem[] {
  const normalizedRole = normalizeRole(userRole)
  return MAIN_MENU.filter(item => canAccessMenu(normalizedRole, item))
}

export function getMenuForFeaturePermissions(featurePermissions: Record<string, number>): MenuItem[] {
  return MAIN_MENU.filter(item => canAccessMenuByFeature(featurePermissions, item))
}

export function getRoleDisplayName(role: string): string {
  const normalizedRole = normalizeRole(role)
  return ROLE_CONFIGS[normalizedRole]?.displayName || role
}

export function getRoleDescription(role: string): string {
  const normalizedRole = normalizeRole(role)
  return ROLE_CONFIGS[normalizedRole]?.description || ''
}
