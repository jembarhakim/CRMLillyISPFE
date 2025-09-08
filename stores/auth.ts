import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '',
    user: { 
      user_id: "", 
      role: '',
      name: '',
      email: ''
    },
  }),
  getters: {
    isLoggedIn: (state) => {
      // Simple check - just validate the token in state
      return !!state.token && 
             state.token !== '' && 
             state.token !== 'null' && 
             state.token !== 'undefined' &&
             state.token.length > 10
    },
    getToken: (state) => {
      // Always get the most current token from cookie if available
      if (process.client) {
        const tokenCookie = useCookie('token', { default: () => '' })
        const cookieToken = tokenCookie.value
        console.log('Auth store getToken called - cookie token:', cookieToken, 'state token:', state.token)
        
        // If cookie has a valid token but state doesn't, update state
        if (cookieToken && cookieToken !== '' && cookieToken !== 'null' && cookieToken !== state.token) {
          state.token = cookieToken
        }
        
        return cookieToken || state.token
      }
      return state.token
    },
  },
  actions: {
    // Initialize store from cookies (call this on app startup)
    initFromCookies() {
      if (process.client) {
        const tokenCookie = useCookie('token', { default: () => '' })
        const roleCookie = useCookie('role_id', { default: () => '' })
        const nameCookie = useCookie('user_name', { default: () => '' })
        const emailCookie = useCookie('user_email', { default: () => '' })
        
        const tokenValue = tokenCookie.value || ''
        const roleValue = roleCookie.value || ''
        const nameValue = nameCookie.value || ''
        const emailValue = emailCookie.value || ''
        
        // Only update if values are different to avoid unnecessary reactivity triggers
        if (this.token !== tokenValue) {
          this.token = tokenValue
        }
        if (this.user.role !== roleValue) {
          this.user.role = roleValue
        }
        if (this.user.name !== nameValue) {
          this.user.name = nameValue
        }
        if (this.user.email !== emailValue) {
          this.user.email = emailValue
        }
        
        console.log('Auth store initialized from cookies - token:', this.token ? 'exists' : 'missing', 'role:', this.user.role, 'name:', this.user.name)
      }
    },
    login({token,role_id,name,email}:{token:string,role_id?:string,name?:string,email?:string}) {
      console.log('Auth store login called with token:', token, 'role_id:', role_id, 'name:', name)
      
      if (process.client) {
        const tokenCookie = useCookie('token', { 
          default: () => '',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          secure: false, // Set to true in production
          sameSite: 'lax', // More permissive for development
          httpOnly: false // Allow client-side access
        })
        const roleCookie = useCookie('role_id', { 
          default: () => '',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          secure: false, // Set to true in production
          sameSite: 'lax', // More permissive for development
          httpOnly: false // Allow client-side access
        })
        const nameCookie = useCookie('user_name', { 
          default: () => '',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          secure: false, // Set to true in production
          sameSite: 'lax', // More permissive for development
          httpOnly: false // Allow client-side access
        })
        const emailCookie = useCookie('user_email', { 
          default: () => '',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          secure: false, // Set to true in production
          sameSite: 'lax', // More permissive for development
          httpOnly: false // Allow client-side access
        })
        
        // Set cookies first
        tokenCookie.value = token
        roleCookie.value = role_id || ''
        nameCookie.value = name || ''
        emailCookie.value = email || ''
        
        console.log('Cookies set - token:', tokenCookie.value ? 'exists' : 'missing')
      }
      
      // Then update state
      this.token = token
      this.user.role = role_id || ''
      this.user.name = name || ''
      this.user.email = email || ''
      
      console.log('Auth store after login - token:', this.token, 'role:', this.user.role, 'name:', this.user.name)
    },
    logout() {
      if (process.client) {
        const tokenCookie = useCookie('token')
        const roleCookie = useCookie('role_id')
        const nameCookie = useCookie('user_name')
        const emailCookie = useCookie('user_email')
        
        tokenCookie.value = ''
        roleCookie.value = ''
        nameCookie.value = ''
        emailCookie.value = ''
      }
      
      this.token = ''
      this.user = { user_id: "", role: "", name: "", email: "" }
      
      console.log('Auth store logged out')
    },
    // Method to check if user is properly authenticated
    async verifyAuth() {
      if (!this.isLoggedIn) {
        return false
      }
      
      try {
        // Try to verify token with backend
        const { authApi } = await import('@/api/auth')
        const response = await authApi().verifyAuth()
        
        if (response.success) {
          // Update user data from response
          this.user = { ...this.user, ...response.data }
          return true
        } else {
          this.logout()
          return false
        }
      } catch (error) {
        console.error('Auth verification failed:', error)
        // Don't logout on network errors, only on auth errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          this.logout()
          return false
        }
        return true // Assume valid if network error
      }
    },
  },
})