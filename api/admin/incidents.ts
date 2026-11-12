import { useApiHost } from '@/composables/useApiHost'
import { useAuthStore } from '@/stores/auth'

export interface MassIncident {
  id: string
  title: string
  description?: string
  source: string
  status: 'active' | 'resolved'
  node_id?: string
  odp_node_id?: string
  node_name: string
  affected_customer_ids: string[]
  affected_ticket_ids: string[]
  eta?: string
  resolution_note?: string
  resolved_at?: string
  created_at: string
  updated_at: string
}

export const incidentsAdminApi = () => {
  const api = useApiHost()
  const authStore = useAuthStore()
  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authStore.getToken}`,
  })
  const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${api}/api/admin/incidents${path}`, {
      ...init,
      headers: { ...headers(), ...init.headers },
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || `Incident request failed (HTTP ${response.status})`)
    }
    return payload.data as T
  }

  return {
    list: (status = '') => request<MassIncident[]>(`?${status ? `status=${encodeURIComponent(status)}` : ''}`),
    create: (body: Partial<MassIncident> & { eta?: string }) =>
      request<MassIncident>('', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: { eta?: string; status?: string; resolution_note?: string }) =>
      request<MassIncident>(`/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
    resolve: (id: string, resolutionNote = '') =>
      request<MassIncident>(`/${encodeURIComponent(id)}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({ resolution_note: resolutionNote }),
      }),
  }
}
