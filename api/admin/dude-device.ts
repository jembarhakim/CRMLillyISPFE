export interface DudeDevice {
  id: string
  device_name: string
  ip_address: string
  status: string
  user_name: string
  user_phone: string
  address: string
  notes: string
  latitude: number | null
  longitude: number | null
  last_seen: string
}

export interface DudeDeviceDetails {
  user_name: string
  user_phone: string
  address: string
  notes: string
  latitude: number | null
  longitude: number | null
}

export interface DudePingJobStatus {
  running: boolean
  total: number
  completed: number
  up: number
  down: number
  failed: number
  started_at?: string
  finished_at?: string
}

export const dudeDeviceAdminApi = () => {
  const api = useApiHost()
  const token = useCookie('token')
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token.value}`
  }

  return {
    getAll: async () => {
      const response = await fetch(`${api}/api/admin/dude-devices`, { headers })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || 'Failed to load The Dude devices')
      }
      return result
    },

    startPingAll: async () => {
      const response = await fetch(`${api}/api/admin/dude-devices/ping-all`, {
        method: 'POST',
        headers
      })
      const result = await response.json()
      if (!response.ok && !(response.status === 409 && result.data?.running)) {
        throw new Error(result.message || 'Failed to start The Dude ping check')
      }
      return result
    },

    getPingAllStatus: async () => {
      const response = await fetch(`${api}/api/admin/dude-devices/ping-all`, { headers })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || 'Failed to get The Dude ping check status')
      }
      return result
    },

    updateDetails: async (id: string, details: DudeDeviceDetails) => {
      const response = await fetch(`${api}/api/admin/dude-devices/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(details)
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update router details')
      }
      return result
    }
  }
}
