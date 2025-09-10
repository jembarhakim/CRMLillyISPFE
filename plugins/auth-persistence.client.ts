export default defineNuxtPlugin({
  name: 'auth-persistence',
  dependsOn: ['auth-init'],
  setup() {
    const authStore = useAuthStore()
    
    // Ensure initialization if not already done
    if (!authStore.isInitialized) {
      authStore.initFromCookies()
    }
    
    // Watch for route changes and restore auth if needed
    const router = useRouter()
    router.beforeEach((to, from, next) => {
      if (!authStore.isInitialized) {
        authStore.initFromCookies()
      }
      next()
    })
    
    console.log('Auth persistence plugin loaded - token exists:', !!authStore.token, 'isInitialized:', authStore.isInitialized)
  }
})
