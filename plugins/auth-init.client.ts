export default defineNuxtPlugin({
  name: 'auth-init',
  setup() {
    const authStore = useAuthStore()
    
    // Initialize auth store from cookies immediately
    authStore.initFromCookies()
    
    console.log('Auth plugin initialized - token exists:', !!authStore.token, 'isInitialized:', authStore.isInitialized)
  }
})