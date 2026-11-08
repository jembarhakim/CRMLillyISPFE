import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side to avoid SSR issues
  if (!process.client) {
    return;
  }

  const authStore = useAuthStore();
  
  // Wait for auth store to be initialized
  if (!authStore.isInitialized) {
    authStore.initFromCookies();
    
    // Small delay to ensure initialization is complete
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Allow access to landing page and root path without authentication
  if (to.path === '/landing' || to.path === '/') {
    return;
  }

  // Keep the legacy customer login URL pointed at the customer portal.
  if (to.path === '/login') {
    if (authStore.isLoggedIn) {
      const destination = authStore.userType === 'employee' ? '/dashboard' : '/customer'
      console.log('Global auth middleware: User already logged in, redirecting to:', destination);
      return navigateTo(destination);
    }
    return navigateTo('/customer/login')
  }

  // Handle employee login page
  if (to.path === '/employee') {
    if (authStore.isLoggedIn) {
      console.log('Global auth middleware: User already logged in, redirecting to dashboard');
      return navigateTo('/dashboard');
    }
    return; // Allow access to employee login page if not logged in
  }

  // Handle customer pages - they have their own auth logic.
  // A logged-in CUSTOMER opening the portal login should go back to the
  // portal, never to the staff dashboard.
  if (to.path.startsWith('/customer') || to.path.startsWith('/invoice')) {
    if (to.path === '/customer/login' && authStore.isLoggedIn) {
      // Staff tokens have no business in the portal: send them to the dashboard.
      const isCorporateUser = authStore.userType === 'employee'
      return navigateTo(isCorporateUser ? '/dashboard' : '/customer')
    }
    return;
  }

  // For protected routes (dashboard, etc.), check authentication
  const isProtectedRoute = to.path.startsWith('/dashboard');
  
  if (isProtectedRoute) {
    if (!authStore.isLoggedIn) {
      console.log('Global auth middleware: User not logged in, redirecting to login');
      return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
    }

    // A customer token can never read admin endpoints, so rendering the
    // dashboard would only produce 403 errors. Send them to their own portal.
    if (authStore.userType === 'customer') {
      console.log('Global auth middleware: customer session on admin route, redirecting to portal');
      return navigateTo('/customer')
    }

    console.log('Global auth middleware: User is authenticated, allowing access to:', to.path);
  }
});
