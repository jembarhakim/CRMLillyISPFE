export default defineNuxtRouteMiddleware((to) => {
  const { isLoggedIn, user, userType } = useAuth()
  const authStore = useAuthStore()
  
  // If not logged in, redirect to appropriate login page
  if (!isLoggedIn.value) {
    // Check stored userType to determine correct login page
    const storedUserType = authStore.userType
    const redirectPath = storedUserType === 'employee' ? '/employee' : '/login'
    return navigateTo(redirectPath)
  }

  // Define route permissions
  // ADMIN role no longer exists - SUPERADMIN is the only admin role
  const routePermissions: Record<string, string[]> = {
    '/dashboard': ['SUPERADMIN', 'CUSTOMER_SERVICE', 'NOC', 'TECHNICIAN', 'FINANCE'],
    '/dashboard/customer': ['SUPERADMIN', 'CUSTOMER_SERVICE', 'NOC', 'TECHNICIAN'],
    '/dashboard/area': ['SUPERADMIN', 'CUSTOMER_SERVICE'],
    '/dashboard/report': ['SUPERADMIN', 'CUSTOMER_SERVICE', 'NOC', 'FINANCE'],
    '/dashboard/internet-package': ['SUPERADMIN', 'CUSTOMER_SERVICE'],
    '/dashboard/asset': ['SUPERADMIN', 'CUSTOMER_SERVICE'],
    '/dashboard/companies': ['SUPERADMIN', 'CUSTOMER_SERVICE'],
    '/dashboard/invoice': ['SUPERADMIN', 'CUSTOMER_SERVICE', 'FINANCE'],
    '/dashboard/transaction': ['SUPERADMIN', 'CUSTOMER_SERVICE', 'FINANCE'],
    '/dashboard/tickets': ['SUPERADMIN', 'CUSTOMER_SERVICE', 'NOC', 'TECHNICIAN'],
    '/dashboard/tickets/reports': ['SUPERADMIN', 'CUSTOMER_SERVICE', 'NOC', 'TECHNICIAN'],
    '/dashboard/user-management': ['SUPERADMIN'],
  }

  const userRole = user.value?.role
  const requiredRoles = routePermissions[to.path]

  // If route requires specific roles and we have a role
  if (requiredRoles && userRole) {
    if (!requiredRoles.includes(userRole)) {
      // Redirect to dashboard if user doesn't have permission
      return navigateTo('/dashboard')
    }
  }
  
  // If we don't have a role yet but we're logged in, allow access
  // The role will be loaded asynchronously
  if (!userRole && isLoggedIn.value) {
    console.log('User logged in but role not loaded yet, allowing access')
    return
  }
})
