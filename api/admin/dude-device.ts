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
