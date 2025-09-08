import { useApiHost } from '@/composables/useApiHost'
import { useAuthStore } from '@/stores/auth'

const authHeader = () => {
  const authStore = useAuthStore()
  const token = authStore.getToken
  console.log('Auth token from store:', token) // Debug log
  
  // Validate token before using it
  if (!token || token === '' || token === 'null' || token === 'undefined') {
    console.error('authHeader - Invalid token detected:', token)
    throw new Error('No valid authentication token available')
  }
  
  return { Authorization: `Bearer ${token}` }
}

export const ticketsApi = () => {
  const base = useApiHost()
  return {
    list: () => $fetch(`${base}/api/tickets`, { headers: authHeader() }),
    create: (p: any) => $fetch(`${base}/api/tickets`, { method: 'POST', body: p, headers: authHeader() }),
    sendToNOC: (id: number, note: string, imageFile?: File) => {
      const formData = new FormData()
      formData.append('note', note)
      if (imageFile) formData.append('image', imageFile)

      const headers: any = authHeader()
      delete headers['Content-Type']

      return $fetch(`${base}/api/tickets/${id}/send-to-noc`, {
        method: 'POST',
        body: formData,
        headers
      })
    },
    sendToCS: (id: number, note: string, type?: string, imageFile?: File) => {
      const formData = new FormData()
      formData.append('note', note)
      if (type) formData.append('type', type)
      if (imageFile) formData.append('image', imageFile)

      // For FormData, don't include Content-Type header - let browser set it automatically
      const headers: any = authHeader()
      delete headers['Content-Type']

      return $fetch(`${base}/api/tickets/${id}/send-to-cs`, {
        method: 'POST',
        body: formData,
        headers: headers
      })
    },
    nocSolved: (id: number, note: string) => $fetch(`${base}/api/tickets/${id}/noc-solved`, { method: 'POST', body: { note }, headers: authHeader() }),
    nocPhysical: (id: number, note: string) => $fetch(`${base}/api/tickets/${id}/noc-physical`, { method: 'POST', body: { note }, headers: authHeader() }),
    assignTechnician: (id: number) => $fetch(`${base}/api/tickets/${id}/assign-technician`, { method: 'POST', body: {}, headers: authHeader() }),
    resolve: (id: number, note: string) => $fetch(`${base}/api/tickets/${id}/resolve`, { method: 'POST', body: { note }, headers: authHeader() }),
    addTechnicianNote: async (id: number, note: string, imgTechBf?: File, imgTechAf?: File) => {
      const formData = new FormData()
      formData.append('note', note)
      if (imgTechBf) formData.append('img_tech_bf', imgTechBf)
      if (imgTechAf) formData.append('img_tech_af', imgTechAf)

      // For FormData, don't include Content-Type header - let browser set it automatically
      const headers: any = authHeader()
      delete headers['Content-Type']

      console.log('Sending technician note request:', {
        url: `${base}/api/tickets/${id}/technician-note`,
        note,
        hasImgTechBf: !!imgTechBf,
        hasImgTechAf: !!imgTechAf,
        headers
      })

      // Check file sizes
      if (imgTechBf && imgTechBf.size > 10 * 1024 * 1024) {
        throw new Error('Before image is too large (max 10MB)')
      }
      if (imgTechAf && imgTechAf.size > 10 * 1024 * 1024) {
        throw new Error('After image is too large (max 10MB)')
      }

      try {
        console.log('FormData contents:')
        for (let [key, value] of formData.entries()) {
          console.log(`${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value)
        }
        
        const response = await $fetch(`${base}/api/tickets/${id}/technician-note`, {
          method: 'POST',
          body: formData,
          headers: headers,
          timeout: 30000 // 30 second timeout
        })
        console.log('Technician note response:', response)
        return response
      } catch (error: any) {
        console.error('Technician note error:', error)
        console.error('Error details:', {
          message: error?.message,
          status: error?.status,
          statusText: error?.statusText,
          data: error?.data,
          name: error?.name
        })
        throw error
      }
    },

    delete: (id: number) => $fetch(`${base}/api/tickets/${id}`, { method: 'DELETE', headers: authHeader() }),
    byType: (startDate?: string, endDate?: string) => {
      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      
      const queryString = params.toString()
      const url = queryString ? `${base}/api/tickets/reports/by-type?${queryString}` : `${base}/api/tickets/reports/by-type`
      
      return $fetch(url, { headers: authHeader() })
    },
    troubleTypes: () => $fetch(`${base}/api/tickets/lookups/trouble-types`, { headers: authHeader() }),
    createTroubleType: (id: string, name?: string) => $fetch(`${base}/api/tickets/lookups/trouble-types`, { method: 'POST', body: { id, name }, headers: authHeader() }),
    hotspots: () => $fetch(`${base}/api/tickets/reports/hotspots`, { headers: authHeader() }),
    debugRole: () => $fetch(`${base}/api/tickets/debug/role`, { headers: authHeader() }),
    updates: (since: string) => $fetch(`${base}/api/tickets/updates?since=${encodeURIComponent(since)}`, { headers: authHeader() }),
    
    // ML Classification endpoints
    classifyTicket: (title: string) => $fetch(`${base}/api/tickets/classify`, { 
      method: 'POST', 
      body: { title }, 
      headers: authHeader() 
    }),
    getMLStats: () => $fetch(`${base}/api/tickets/ml/stats`, { headers: authHeader() }),
  }
}


