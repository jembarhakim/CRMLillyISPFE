import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '',
    user: { 
      user_id: "", 
      role: ''
    },
  }),
  getters: {
    isLoggedIn: (state) => {
      // Always check both state and cookie for token
      const tokenFromCookie = process.client ? useCookie('token', { default: () => '' }).value : ''
      const currentToken = state.token || tokenFromCookie
      return !!currentToken && currentToken !== '' && currentToken !== 'null'
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
        
        this.token = tokenCookie.value || ''
        this.user.role = roleCookie.value || ''
        
        console.log('Auth store initialized from cookies - token:', this.token, 'role:', this.user.role)
      }
    },
    login({token,role_id}:{token:string,role_id?:string}) {
      console.log('Auth store login called with token:', token, 'role_id:', role_id)
      
      if (process.client) {
        const tokenCookie = useCookie('token', { 
          default: () => '',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          secure: false, // Set to true in production
          sameSite: 'lax' // More permissive for development
        })
        const roleCookie = useCookie('role_id', { 
          default: () => '',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          secure: false, // Set to true in production
          sameSite: 'lax' // More permissive for development
        })
        
        // Set cookies first
        tokenCookie.value = token
        roleCookie.value = role_id || ''
      }
      
      // Then update state
      this.token = token
      this.user.role = role_id || ''
      
      console.log('Auth store after login - token:', this.token, 'role:', this.user.role)
    },
    logout() {
      if (process.client) {
        const tokenCookie = useCookie('token')
        const roleCookie = useCookie('role_id')
        
        tokenCookie.value = ''
        roleCookie.value = ''
      }
      
      this.token = ''
      this.user = { user_id: "", role: "" }
      
      console.log('Auth store logged out')
    },
  },
})