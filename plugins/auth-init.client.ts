export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  
  // Initialize auth store from cookies on client side
  authStore.initFromCookies()
  
  console.log('Auth store initialized on client startup')
})