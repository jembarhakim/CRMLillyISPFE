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
        const nameCookie = useCookie('user_name', { default: () => '' })
        const emailCookie = useCookie('user_email', { default: () => '' })
        
        this.token = tokenCookie.value || ''
        this.user.role = roleCookie.value || ''
        this.user.name = nameCookie.value || ''
        this.user.email = emailCookie.value || ''
        
        console.log('Auth store initialized from cookies - token:', this.token, 'role:', this.user.role, 'name:', this.user.name)
      }
    },
    login({token,role_id,name,email}:{token:string,role_id?:string,name?:string,email?:string}) {
      console.log('Auth store login called with token:', token, 'role_id:', role_id, 'name:', name)
      
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
        const nameCookie = useCookie('user_name', { 
          default: () => '',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          secure: false, // Set to true in production
          sameSite: 'lax' // More permissive for development
        })
        const emailCookie = useCookie('user_email', { 
          default: () => '',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          secure: false, // Set to true in production
          sameSite: 'lax' // More permissive for development
        })
        
        // Set cookies first
        tokenCookie.value = token
        roleCookie.value = role_id || ''
        nameCookie.value = name || ''
        emailCookie.value = email || ''
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
  },
})