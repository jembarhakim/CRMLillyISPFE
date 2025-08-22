import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: useCookie('token', { default: () => '' }).value,
    user: { user_id: "", role: "" },
  }),
  getters: {
    isLoggedIn: (state) => !!state.token && state.token !== '',
    getToken: (state) => state.token,
  },
  actions: {
    login({token,role_id}:{token:string,role_id?:string}) {
      const tokenCookie = useCookie('token', { 
        default: () => '',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        secure: true,
        sameSite: 'strict'
      })
      const roleCookie = useCookie('role_id', { 
        default: () => '',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        secure: true,
        sameSite: 'strict'
      })
      
      tokenCookie.value = token
      roleCookie.value = role_id || ''
      this.token = token
    },
    logout() {
      const tokenCookie = useCookie('token')
      const roleCookie = useCookie('role_id')
      
      tokenCookie.value = ''
      roleCookie.value = ''
      this.token = ''
      this.user = { user_id: "", role: "" }
    },
  },
})