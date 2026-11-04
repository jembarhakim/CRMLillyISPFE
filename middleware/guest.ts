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
    // A customer session must never be sent to the staff dashboard: the admin
    // endpoints reject customer tokens ("Customer token cannot access this
    // resource"), which is exactly the confusing 403 seen after login.
    if (authStore.userType === 'customer') {
      console.log('Guest middleware: customer session found, redirecting to portal');
      return navigateTo('/customer')
    }

    console.log('Guest middleware: User already logged in, redirecting to dashboard');
    return navigateTo('/dashboard');
  }
});
