import { useApiHost } from '@/composables/useApiHost'
import { useAuthStore } from '@/stores/auth'

export interface CustomerMonitoringEvent {
  id: string
  status: string
  timestamp: string
  duration?: string
  message: string
}

export const getConnectionHistory = async (timeRange = '1d'): Promise<{ success: boolean; data: CustomerMonitoringEvent[]; message: string }> => {
  const api = useApiHost()
  const authStore = useAuthStore()
  const token = authStore.getToken

  if (!token || token === '' || token === 'null' || token === 'undefined') {
    throw new Error('No valid authentication token available')
  }

  const response = await fetch(`${api}/api/customer/monitoring/history?timeRange=${encodeURIComponent(timeRange)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.message || 'Terjadi kesalahan pada server')
  }
  return data
}

export const monitoringCustomerApi = () => {
  const api = useApiHost()
  const authStore = useAuthStore()

  const authHeaders = () => {
    const token = authStore.getToken
    if (!token || token === '' || token === 'null' || token === 'undefined') {
      throw new Error('No valid authentication token available')
    }

    return {
      Authorization: `Bearer ${token}`,
    }
  }

  const handle = async (response: Response) => {
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data?.message || 'Terjadi kesalahan pada server')
    }
    return data
  }

  return {
    getHistory: async (timeRange = '1d'): Promise<{ success: boolean; data: CustomerMonitoringEvent[]; message: string }> => {
      const response = await fetch(`${api}/api/customer/monitoring/history?timeRange=${encodeURIComponent(timeRange)}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      return handle(response)
    },
    getHealth: async (): Promise<{ success: boolean; data: { service: string; version: string; status: string }; message: string }> => {
      const response = await fetch(`${api}/api/customer/monitoring/health`, {
        method: 'GET',
      })
      return handle(response)
    },
  }
}

export const customerMonitoringApi = monitoringCustomerApi
