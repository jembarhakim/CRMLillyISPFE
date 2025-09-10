import { useApiHost } from '@/composables/useApiHost'

const apiHost = useApiHost()

export interface ConnectionStatus {
  status: string
  uptime: string
  last_check: string
  latency_ms: number
  packet_loss_percent: number
}

export interface NetworkInfo {
  ip_address: string
  gateway: string
  dns_server: string
  subnet: string
  mac_address: string
}

export interface CustomerInfo {
  package: string
  speed: string
  data_limit: string
  expiry_date: string
  status: string
}

export interface ConnectionEvent {
  id: string
  status: string
  timestamp: string
  duration?: string
  message: string
}

export interface MonitoringSummary {
  total_uptime: string
  uptime_percent: number
  total_downtime: string
  average_latency_ms: number
  total_events: number
  last_down_time?: string
  last_up_time?: string
}

// Get connection status for the authenticated customer
export const getConnectionStatus = async (token: string): Promise<{ success: boolean; data: ConnectionStatus; message: string }> => {
  const response = await fetch(`${apiHost}/api/customer/monitoring/status`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  return await response.json()
}

// Get network information for the authenticated customer
export const getNetworkInfo = async (token: string): Promise<{ success: boolean; data: NetworkInfo; message: string }> => {
  const response = await fetch(`${apiHost}/api/customer/monitoring/network`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  return await response.json()
}

// Get customer information for monitoring
export const getCustomerInfo = async (token: string): Promise<{ success: boolean; data: CustomerInfo; message: string }> => {
  const response = await fetch(`${apiHost}/api/customer/monitoring/info`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  return await response.json()
}

// Get connection history for the authenticated customer
export const getConnectionHistory = async (timeRange: string, token: string): Promise<{ success: boolean; data: ConnectionEvent[]; message: string }> => {
  const response = await fetch(`${apiHost}/api/customer/monitoring/history?timeRange=${timeRange}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  return await response.json()
}

// Get monitoring summary for the authenticated customer
export const getMonitoringSummary = async (token: string): Promise<{ success: boolean; data: MonitoringSummary; message: string }> => {
  const response = await fetch(`${apiHost}/api/customer/monitoring/summary`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  return await response.json()
}

// Health check for customer monitoring service
export const getMonitoringHealth = async (token: string): Promise<{ success: boolean; data: any; message: string }> => {
  const response = await fetch(`${apiHost}/api/customer/monitoring/health`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  return await response.json()
}
