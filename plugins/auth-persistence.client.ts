export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  
  // Initialize auth store from cookies
  authStore.initFromCookies()
  
  console.log('Auth persistence plugin loaded - token exists:', !!authStore.token)
})
