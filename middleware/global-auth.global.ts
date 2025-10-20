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

  // Handle login page - redirect to dashboard if already logged in
  if (to.path === '/login') {
    if (authStore.isLoggedIn) {
      console.log('Global auth middleware: User already logged in, redirecting to dashboard');
      return navigateTo('/dashboard');
    }
    return; // Allow access to login page if not logged in
  }

  // Handle customer pages - they have their own auth logic
  if (to.path.startsWith('/customer') || to.path.startsWith('/invoice')) {
    return;
  }

  // For protected routes (dashboard, etc.), check authentication
  const isProtectedRoute = to.path.startsWith('/dashboard');
  
  if (isProtectedRoute) {
    if (!authStore.isLoggedIn) {
      console.log('Global auth middleware: User not logged in, redirecting to login');
      return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
    }
    console.log('Global auth middleware: User is authenticated, allowing access to:', to.path);
  }
});
