import { useApiHost } from '@/composables/useApiHost'

const apiHost = useApiHost()

export interface MikroTikConnectionConfig {
  host: string
  port: number
  username: string
  password: string
}

export interface MikroTikLog {
  host: string
  comment: string
  status: string
  timestamp: string
  type: string
  category: string
  raw?: string
}

export interface MikroTikConnectionStatus {
  status: string
  message: string
  host: string
  port: number
}

export interface MikroTikSystemInfo {
  cpu_load?: string
  memory?: string
  uptime?: string
  version?: string
}

// Connect to MikroTik device
export const connectToMikroTik = async (config: MikroTikConnectionConfig, token: string) => {
  const response = await fetch(`${apiHost}/api/admin/mikrotik/connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(config)
  })
  
  return await response.json()
}

// Disconnect from MikroTik device
export const disconnectFromMikroTik = async (token: string) => {
  const response = await fetch(`${apiHost}/api/admin/mikrotik/disconnect`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  return await response.json()
}

// Get connection status
export const getMikroTikStatus = async (token: string) => {
  const response = await fetch(`${apiHost}/api/admin/mikrotik/status`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  return await response.json()
}

// Get MikroTik logs
export const getMikroTikLogs = async (timeRange: string, token: string) => {
  const response = await fetch(`${apiHost}/api/admin/mikrotik/logs?timeRange=${timeRange}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  return await response.json()
}

// Get real-time logs
export const getMikroTikRealTimeLogs = async (timeRange: string, token: string) => {
  const response = await fetch(`${apiHost}/api/admin/mikrotik/logs/realtime?timeRange=${timeRange}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  return await response.json()
}

// Get system information
export const getMikroTikSystemInfo = async (token: string) => {
  const response = await fetch(`${apiHost}/api/admin/mikrotik/system/info`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  return await response.json()
}

// Execute custom command
export const executeMikroTikCommand = async (command: string, token: string) => {
  const response = await fetch(`${apiHost}/api/admin/mikrotik/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ command })
  })
  
  return await response.json()
}
