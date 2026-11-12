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

  // Customer portal routes require a customer session; the login page itself
  // remains public so unauthenticated visitors can sign in.
  if (to.path.startsWith('/customer')) {
    if (to.path === '/customer/login') {
      if (authStore.isLoggedIn && authStore.userType === 'customer') {
        return navigateTo('/customer')
      }
      if (authStore.isLoggedIn && authStore.userType === 'employee') {
        return navigateTo('/dashboard')
      }
      return
    }

    if (!authStore.isLoggedIn || authStore.userType !== 'customer') {
      return navigateTo('/customer/login')
    }

    return
  }

  // Invoice payment links are public and have their own payment flow.
  if (to.path.startsWith('/invoice')) {
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
