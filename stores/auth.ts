import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => {
    // Create user object with proper prototype chain
    const user = Object.create(Object.prototype)
    user.user_id = ""
    user.role = ""
    user.name = ""
    user.email = ""
    
    return {
      token: '',
      user,
      isInitialized: false,
    }
  },
  getters: {
    isLoggedIn: (state) => {
      // Wait for initialization and then check token
      if (!state.isInitialized) return false
      
      // Check both state token and cookie token for reliability
      const stateToken = state.token
      let cookieToken = ''
      
      if (process.client) {
        const tokenCookie = useCookie('token', { default: () => '' })
        cookieToken = tokenCookie.value || ''
      }
      
      const validToken = stateToken || cookieToken
      
      return !!validToken && 
             validToken !== '' && 
             validToken !== 'null' && 
             validToken !== 'undefined' &&
             validToken.length > 10
    },
    getToken: (state) => {
      // Always get the most current token from cookie if available
      if (process.client) {
        const tokenCookie = useCookie('token', { default: () => '' })
        const cookieToken = tokenCookie.value
        console.log('Auth store getToken called - cookie token:', cookieToken, 'state token:', state.token)
        
        return cookieToken || state.token
      }
      return state.token
    },
  },
  actions: {
    // Initialize store from cookies (call this on app startup)
    initFromCookies() {
      if (process.client) {
        const tokenCookie = useCookie('token', { 
          default: () => '',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          secure: false, // Set to true in production
          sameSite: 'lax',
          httpOnly: false
        })
        const roleCookie = useCookie('role_id', { 
          default: () => '',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          secure: false,
          sameSite: 'lax',
          httpOnly: false
        })
        const nameCookie = useCookie('user_name', { 
          default: () => '',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          secure: false,
          sameSite: 'lax',
          httpOnly: false
        })
        const emailCookie = useCookie('user_email', { 
          default: () => '',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          secure: false,
          sameSite: 'lax',
          httpOnly: false
        })
        
        const tokenValue = tokenCookie.value || ''
        const roleValue = roleCookie.value || ''
        const nameValue = nameCookie.value || ''
        const emailValue = emailCookie.value || ''
        
        // Only update if values are different to avoid unnecessary reactivity triggers
        if (this.token !== tokenValue) {
          this.token = tokenValue
        }
        if (this.user.role !== roleValue) {
          this.user.user_id = roleValue // Update user_id as well if it's the role
          this.user.role = roleValue
        }
        if (this.user.name !== nameValue) {
          this.user.name = nameValue
        }
        if (this.user.email !== emailValue) {
          this.user.email = emailValue
        }
        
        // Mark as initialized
        this.isInitialized = true
        
        console.log('Auth store initialized from cookies - token:', this.token ? 'exists' : 'missing', 'role:', this.user.role, 'name:', this.user.name, 'initialized:', this.isInitialized)
        
        // If no valid token found, ensure we don't trigger unnecessary API calls
        if (!this.token || this.token === '' || this.token === 'null' || this.token === 'undefined') {
          console.log('No valid token found during initialization - user not authenticated')
        }
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
        
        // Also store in localStorage as backup
        try {
          localStorage.setItem('token', token)
          localStorage.setItem('role_id', role_id || '')
          localStorage.setItem('user_name', name || '')
          localStorage.setItem('user_email', email || '')
        } catch (e) {
          // Ignore localStorage errors
        }
        
        console.log('Cookies set - token:', tokenCookie.value ? 'exists' : 'missing')
      }
      
      // Then update state
      this.token = token
      this.user.user_id = role_id || ''
      this.user.role = role_id || ''
      this.user.name = name || ''
      this.user.email = email || ''
      this.isInitialized = true
      
      console.log('Auth store after login - token:', this.token, 'role:', this.user.role, 'name:', this.user.name)
    },
    logout() {
      if (process.client) {
        const tokenCookie = useCookie('token')
        const roleCookie = useCookie('role_id')
        const nameCookie = useCookie('user_name')
        const emailCookie = useCookie('user_email')
        
        // Clear cookies by setting them to empty and removing them
        tokenCookie.value = ''
        roleCookie.value = ''
        nameCookie.value = ''
        emailCookie.value = ''
        
        // Also clear from localStorage as backup
        try {
          localStorage.removeItem('token')
          localStorage.removeItem('role_id')
          localStorage.removeItem('user_name')
          localStorage.removeItem('user_email')
        } catch (e) {
          // Ignore localStorage errors
        }
      }
      
      this.token = ''
      // Create user object with proper prototype chain
      const user = Object.create(Object.prototype)
      user.user_id = ""
      user.role = ""
      user.name = ""
      user.email = ""
      this.user = user
      this.isInitialized = true // Keep initialized to prevent race conditions
      
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
      } catch (error: any) {
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