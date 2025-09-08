export const useAuth = () => {
  const authStore = useAuthStore()
  
  const isLoggedIn = computed(() => authStore.isLoggedIn)
  const user = computed(() => authStore.user)
  const token = computed(() => authStore.token)
  
  const login = (credentials: { token: string; role_id?: string; name?: string; email?: string }) => {
    authStore.login(credentials)
  }
  
  const logout = () => {
    authStore.logout()
    navigateTo('/login')
  }
  
  return {
    isLoggedIn,
    user,
    token,
    login,
    logout
  }
}
