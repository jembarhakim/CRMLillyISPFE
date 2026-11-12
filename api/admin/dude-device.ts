export interface DudeDevice {
  id: string
  device_name: string
  ip_address: string
  map_name?: string
  status: string
  user_name: string
  user_phone: string
  address: string
  notes: string
  latitude: number | null
  longitude: number | null
  last_seen: string
  last_down_at?: string | null
}

export interface DudeDeviceDetails {
  user_name: string
  user_phone: string
  address: string
  notes: string
  latitude: number | null
  longitude: number | null
}

export interface DudeCSVMapPreview {
  name: string
  rows: number
  devices: number
  skipped: number
}

export interface DudeCSVPreview {
  rows: number
  skipped: number
  maps: DudeCSVMapPreview[]
}

export interface DudeCSVImportResult {
  created: number
  updated: number
  total: number
  map_name: string
  skipped: number
}

export interface DudeRouterOSSyncStatus {
  enabled: boolean
  running: boolean
  interval_seconds: number
  total: number
  completed: number
  up: number
  down: number
  failed: number
  last_started_at?: string
  last_finished_at?: string
  last_error?: string
}

export const dudeDeviceAdminApi = () => {
  const api = useApiHost()
  const authStore = useAuthStore()

  const headers = (json = false): HeadersInit => {
    const token = authStore.getToken
    if (!token || token === 'null' || token === 'undefined') {
      throw new Error('Sesi login tidak ditemukan. Silakan login kembali.')
    }
    return {
      Authorization: `Bearer ${token}`,
      ...(json ? { 'Content-Type': 'application/json' } : {})
    }
  }

  const parseResponse = async (response: Response, fallback: string) => {
    const body = await response.text()
    let result: unknown
    try {
      result = JSON.parse(body)
    } catch {
      const details = body.trim().slice(0, 300) || response.statusText || 'Empty response'
      throw new Error(`${fallback}: server returned non-JSON response (HTTP ${response.status}): ${details}`)
    }

    if (typeof result !== 'object' || result === null) {
      throw new Error(`${fallback}: server returned an invalid response (HTTP ${response.status})`)
    }
    return result as Record<string, unknown>
  }

  const readResponse = async (response: Response, fallback: string) => {
    const result = await parseResponse(response, fallback)
    if (!response.ok || result.success === false) {
      const message = typeof result.message === 'string' ? result.message : fallback
      throw new Error(`${message} (HTTP ${response.status})`)
    }
    return result
  }

  return {
    getAll: async () => {
      const response = await fetch(`${api}/api/admin/dude-devices`, { headers: headers(true) })
      return readResponse(response, 'Failed to load The Dude devices')
    },

    previewCSV: async (file: File) => {
      const body = new FormData()
      body.append('file', file)
      const response = await fetch(`${api}/api/admin/dude-devices/import/preview`, {
        method: 'POST',
        headers: headers(),
        body
      })
      return readResponse(response, 'Failed to preview The Dude CSV')
    },

    importCSV: async (file: File, mapName: string) => {
      const body = new FormData()
      body.append('file', file)
      body.append('map_name', mapName)
      const response = await fetch(`${api}/api/admin/dude-devices/import`, {
        method: 'POST',
        headers: headers(),
        body
      })
      return readResponse(response, 'Failed to import The Dude CSV')
    },

    startRouterOSSync: async () => {
      const response = await fetch(`${api}/api/admin/dude-devices/sync`, {
        method: 'POST',
        headers: headers(true)
      })
      const result = await parseResponse(response, 'Failed to start RouterOS status sync')
      const data = result.data
      const alreadyRunning = typeof data === 'object' && data !== null && 'running' in data && data.running === true
      if (!response.ok && !(response.status === 409 && alreadyRunning)) {
        const message = typeof result.message === 'string' ? result.message : 'Failed to start RouterOS status sync'
        throw new Error(`${message} (HTTP ${response.status})`)
      }
      return result
    },

    getRouterOSSyncStatus: async () => {
      const response = await fetch(`${api}/api/admin/dude-devices/sync`, { headers: headers(true) })
      return readResponse(response, 'Failed to get RouterOS status sync')
    },

    updateDetails: async (id: string, details: DudeDeviceDetails) => {
      const response = await fetch(`${api}/api/admin/dude-devices/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: headers(true),
        body: JSON.stringify(details)
      })
      return readResponse(response, 'Failed to update router details')
    }
  }
}
