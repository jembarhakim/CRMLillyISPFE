export default defineNuxtPlugin({
  name: 'auth-init',
  setup() {
    const authStore = useAuthStore()
    
    // Track app start time for initial load detection
    if (process.client) {
      (window as any).__appStartTime = Date.now()
    }
    
    // Initialize auth store from cookies immediately
    authStore.initFromCookies()
    
    console.log('Auth plugin initialized - token exists:', !!authStore.token, 'isInitialized:', authStore.isInitialized)
  }
})