import { useApiHost } from '@/composables/useApiHost'

export interface DeviceStatus {
  ip: string
  status: 'up' | 'down'
  last_checked: string
  recommendation?: string
}

export interface MonitoringResponse {
  success: boolean
  data: {
    status: string
    ip: string
    last_checked: string
    recommendation?: string
    formatted_response: string
  }
  message: string
}

export interface ConnectionStatusResponse {
  success: boolean
  data: {
    devices: DeviceStatus[]
    formatted_responses: string[]
  }
  message: string
}

export interface NetwatchScriptResponse {
  success: boolean
  data: {
    script: string
    ip_address: string
    customer_name: string
  }
  message: string
}

export interface TroubleshootingResponse {
  success: boolean
  data: {
    ip_address: string
    recommendations: string[]
    formatted_response: string
  }
  message: string
}

export interface BulkMonitoringResponse {
  success: boolean
  data: {
    results: Array<{
      customer_id: string
      ip_address: string
      status: string
      last_checked: string
      recommendation?: string
      error?: string
    }>
    formatted_responses: string[]
    total_devices: number
    successful_checks: number
  }
  message: string
}

export interface MonitoringStatsResponse {
  success: boolean
  data: {
    total_monitored_devices: number
    devices_up: number
    devices_down: number
    last_check_time: string | null
    monitoring_active: boolean
  }
  message: string
}

// Monitor a specific customer device
export const monitorCustomerDevice = async (customerId: string, ipAddress: string, token: string): Promise<MonitoringResponse> => {
  const apiHost = useApiHost()
  const response = await fetch(`${apiHost}/api/admin/network-monitoring/customer/${customerId}/monitor?ip=${ipAddress}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  return await response.json()
}

// Get connection status for a customer
export const getCustomerConnectionStatus = async (customerId: string, token: string): Promise<ConnectionStatusResponse> => {
  const apiHost = useApiHost()
  const response = await fetch(`${apiHost}/api/admin/network-monitoring/customer/${customerId}/status`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  return await response.json()
}

// Generate Netwatch script for an IP
export const generateNetwatchScript = async (ipAddress: string, customerName: string, token: string): Promise<NetwatchScriptResponse> => {
  const apiHost = useApiHost()
  const response = await fetch(`${apiHost}/api/admin/network-monitoring/netwatch/script`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ip_address: ipAddress,
      customer_name: customerName
    })
  })
  
  return await response.json()
}

// Get troubleshooting recommendations
export const getTroubleshootingRecommendations = async (ipAddress: string, token: string): Promise<TroubleshootingResponse> => {
  const apiHost = useApiHost()
  const response = await fetch(`${apiHost}/api/admin/network-monitoring/troubleshooting?ip=${ipAddress}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  return await response.json()
}

// Bulk monitor multiple devices
export const bulkMonitorDevices = async (devices: Array<{customer_id: string, ip_address: string}>, token: string): Promise<BulkMonitoringResponse> => {
  const apiHost = useApiHost()
  const response = await fetch(`${apiHost}/api/admin/network-monitoring/bulk/monitor`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ devices })
  })
  
  return await response.json()
}

// Get monitoring statistics
export const getMonitoringStats = async (token: string): Promise<MonitoringStatsResponse> => {
  const apiHost = useApiHost()
  const response = await fetch(`${apiHost}/api/admin/network-monitoring/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  return await response.json()
}

// Network Monitoring API client
export const networkMonitoringApi = () => ({
  monitorCustomerDevice,
  getCustomerConnectionStatus,
  generateNetwatchScript,
  getTroubleshootingRecommendations,
  bulkMonitorDevices,
  getMonitoringStats
})
