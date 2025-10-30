export const useAuth = () => {
  const authStore = useAuthStore()
  
  const isLoggedIn = computed(() => authStore.isLoggedIn)
  const user = computed(() => authStore.user)
  const token = computed(() => authStore.token)
  const userType = computed(() => authStore.userType)
  
  const login = (credentials: { token: string; role_id?: string; name?: string; email?: string; userType?: string }) => {
    authStore.login(credentials)
  }
  
  const logout = () => {
    const currentUserType = authStore.userType
    authStore.logout()
    
    // Redirect based on user type
    const redirectPath = currentUserType === 'employee' ? '/employee' : '/login'
    navigateTo(redirectPath)
  }
  
  return {
    isLoggedIn,
    user,
    token,
    userType,
    login,
    logout
  }
}
