export default defineNuxtRouteMiddleware((to) => {
  const { isLoggedIn, user } = useAuth()
  
  // If not logged in, redirect to login
  if (!isLoggedIn.value) {
    return navigateTo('/login')
  }

  // Define route permissions
  const routePermissions: Record<string, string[]> = {
    '/dashboard': ['ADMIN', 'CUSTOMER_SERVICE', 'NOC', 'TECHNICIAN', 'FINANCE'],
    '/dashboard/customer': ['ADMIN', 'CUSTOMER_SERVICE', 'NOC', 'TECHNICIAN'],
    '/dashboard/area': ['ADMIN', 'CUSTOMER_SERVICE'],
    '/dashboard/report': ['ADMIN', 'CUSTOMER_SERVICE', 'NOC', 'FINANCE'],
    '/dashboard/internet-package': ['ADMIN', 'CUSTOMER_SERVICE'],
    '/dashboard/asset': ['ADMIN', 'CUSTOMER_SERVICE'],
    '/dashboard/companies': ['ADMIN', 'CUSTOMER_SERVICE'],
    '/dashboard/invoice': ['ADMIN', 'CUSTOMER_SERVICE', 'FINANCE'],
    '/dashboard/transaction': ['ADMIN', 'CUSTOMER_SERVICE', 'FINANCE'],
    '/dashboard/tickets': ['ADMIN', 'CUSTOMER_SERVICE', 'NOC', 'TECHNICIAN'],
    '/dashboard/tickets/reports': ['ADMIN', 'CUSTOMER_SERVICE', 'NOC', 'TECHNICIAN'],
    '/dashboard/user-management': ['ADMIN'],
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
