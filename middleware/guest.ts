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

  // If user is already logged in, redirect to dashboard
  if (authStore.isLoggedIn) {
    console.log('Guest middleware: User already logged in, redirecting to dashboard');
    return navigateTo('/dashboard');
  }
});
