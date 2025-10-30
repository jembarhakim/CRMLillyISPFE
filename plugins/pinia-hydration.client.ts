// Plugin to handle Pinia SSR hydration issues
export default defineNuxtPlugin(() => {
  // This plugin runs only on the client side
  if (process.client) {
    // Wait for the app to be ready before initializing stores
    onMounted(() => {
      // Ensure proper hydration by re-initializing auth store
      const authStore = useAuthStore()
      if (authStore && typeof authStore.initFromCookies === 'function') {
        authStore.initFromCookies()
      }
    })
  }
})
