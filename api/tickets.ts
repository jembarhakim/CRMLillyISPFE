import { useApiHost } from '@/composables/useApiHost'
import { useAuthStore } from '@/stores/auth'

const authHeader = () => {
  const authStore = useAuthStore()
  const token = authStore.getToken
  console.log('Auth token from store:', token)

  if (!token || token === '' || token === 'null' || token === 'undefined') {
    console.error('authHeader - Invalid token detected:', token)
    throw new Error('No valid authentication token available')
  }

  return { Authorization: `Bearer ${token}` }
}

export const ticketsApi = () => {
  const base = useApiHost()
  return {
    listTechnicians: () => $fetch(`${base}/api/admin/user-management?role=TECHNICIAN`, { headers: authHeader() }),
    list: (history?: boolean) => {
      const url = history ? `${base}/api/tickets?history=true` : `${base}/api/tickets`
      return $fetch(url, { headers: authHeader() })
    },
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
        headers,
      })
    },
    sendToCS: (id: number, note: string, type?: string, imageFile?: File) => {
      const formData = new FormData()
      formData.append('note', note)
      if (type) formData.append('type', type)
      if (imageFile) formData.append('image', imageFile)

      const headers: any = authHeader()
      delete headers['Content-Type']

      return $fetch(`${base}/api/tickets/${id}/send-to-cs`, {
        method: 'POST',
        body: formData,
        headers,
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

      const headers: any = authHeader()
      delete headers['Content-Type']

      try {
        const response = await $fetch(`${base}/api/tickets/${id}/technician-note`, {
          method: 'POST',
          body: formData,
          headers,
          timeout: 30000,
        })
        return response
      } catch (error: any) {
        console.error('Technician note error:', error)
        throw error
      }
    },
    accept: (id: number) => $fetch(`${base}/api/tickets/${id}/accept`, { method: 'POST', headers: authHeader() }),
    setTeam: (id: number, members: { user_id: string; role: 'senior' | 'junior' | 'helper' }[]) =>
      $fetch(`${base}/api/tickets/${id}/team`, { method: 'POST', body: { members }, headers: authHeader() }),
    addStep: (id: number, description: string, imageFiles?: File[]) => {
      const formData = new FormData()
      formData.append('description', description)
      if (imageFiles && imageFiles.length) {
        for (const f of imageFiles) formData.append('images', f)
      }
      const headers: any = authHeader(); delete headers['Content-Type']
      return $fetch(`${base}/api/tickets/${id}/steps`, { method: 'POST', body: formData, headers })
    },
    verifyClose: (id: number) => $fetch(`${base}/api/tickets/${id}/verify-close`, { method: 'POST', headers: authHeader() }),
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
    getTechnicianSteps: () => $fetch(`${base}/api/tickets/technician-steps`, { method: 'GET', headers: authHeader() }),
    getSpareParts: () => $fetch(`${base}/api/tickets/spare-parts`, { method: 'GET', headers: authHeader() }),
    getTechnicianChecklist: (id: number, technicianId: string) => $fetch(`${base}/api/tickets/${id}/technician-checklist?technician_id=${technicianId}`, { method: 'GET', headers: authHeader() }),
    updateTechnicianStep: (id: number, stepId: number, technicianId: string, status: string, notes?: string, sparePartsUsed?: string) => $fetch(`${base}/api/tickets/${id}/technician-step`, { method: 'POST', headers: authHeader(), body: { step_id: stepId, technician_id: technicianId, status, notes, spare_parts_used: sparePartsUsed } }),
    getTechnicianProgress: (id: number, technicianId: string) => $fetch(`${base}/api/tickets/${id}/technician-progress?technician_id=${technicianId}`, { method: 'GET', headers: authHeader() }),
    markTechnicianJobCompleted: (id: number, rxPower: number, notes?: string) => $fetch(`${base}/api/tickets/${id}/technician-complete`, { method: 'POST', headers: authHeader(), body: { rx_power: rxPower, notes } }),
    setNetworkArchitecture: (id: number, architecture: string) => $fetch(`${base}/api/tickets/${id}/network-architecture`, { method: 'POST', headers: authHeader(), body: { architecture: architecture } }),
    getTeamMembers: (id: number) => $fetch(`${base}/api/tickets/${id}/team-members`, { method: 'GET', headers: authHeader() }),
    updateTechnicianStepWithImages: (id: number, stepId: number, technicianId: string, status: string, notes?: string, sparePartsUsed?: string, images?: File[]) => {
      const formData = new FormData();
      formData.append('step_id', stepId.toString());
      formData.append('technician_id', technicianId);
      formData.append('status', status);
      if (notes) formData.append('notes', notes);
      if (sparePartsUsed) formData.append('spare_parts_used', sparePartsUsed);
      if (images && images.length > 0) {
        images.forEach((img) => { formData.append('images', img) })
      }

      const headers: any = authHeader();
      delete headers['Content-Type'];

      return $fetch(`${base}/api/tickets/${id}/technician-step`, {
        method: 'POST',
        body: formData,
        headers,
      })
    },
    getSimilarTroubles: (id: number, timeWindow?: number) => {
      const params = new URLSearchParams();
      if (timeWindow) params.append('time_window', timeWindow.toString());
      const queryString = params.toString();
      const url = queryString ? `${base}/api/tickets/${id}/similar?${queryString}` : `${base}/api/tickets/${id}/similar`;
      return $fetch(url, { headers: authHeader() })
    },
    updateAccumulation: (ticketIds: number[], accumulation: number) => $fetch(`${base}/api/tickets/accumulation`, {
      method: 'POST',
      body: { ticket_ids: ticketIds, accumulation },
      headers: authHeader(),
    }),
    autoDetectAndGroup: () => $fetch(`${base}/api/tickets/accumulation/auto-detect`, {
      method: 'POST',
      headers: authHeader(),
    }),
    getAccumulationStats: () => $fetch(`${base}/api/tickets/accumulation/stats`, { headers: authHeader() }),
    getHighAccumulationTickets: (minAccumulation?: number) => {
      const params = new URLSearchParams();
      if (minAccumulation) params.append('min_accumulation', minAccumulation.toString());
      const queryString = params.toString();
      const url = queryString ? `${base}/api/tickets/accumulation/high?${queryString}` : `${base}/api/tickets/accumulation/high`;
      return $fetch(url, { headers: authHeader() })
    },
  }
}
