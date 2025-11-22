import { ref, onUnmounted } from 'vue'

export interface KumaMonitor {
  id: number
  name: string
  type: string
  sendUrl?: number
  status?: 'up' | 'down' | 'pending'
  uptime?: number
  avgResponseTime?: number
  lastCheck?: string
}

export interface KumaGroup {
  id: number
  name: string
  weight: number
  monitorList: KumaMonitor[]
}

export interface KumaMonitorStatus {
  id: number
  status: number // 1=UP, 0=DOWN, 2=PENDING, 3=MAINTENANCE
  uptime?: number
  avgResponseTime?: number
  lastCheck?: number
}

export interface KumaData {
  config: any
  incident: any
  publicGroupList: KumaGroup[]
  maintenanceList: any[]
  monitorStatuses?: Map<number, KumaMonitorStatus>
}

export function useKumaMonitoring(endpoint: string = 'layanan') {
  const data = ref<KumaData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdateTime = ref<Date | null>(null)
  const isConnected = ref(false)
  const isInitialLoad = ref(true)
  const currentEndpoint = ref(endpoint)
  
  let ws: WebSocket | null = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = 5
  let reconnectTimer: NodeJS.Timeout | null = null
  let pollingInterval: NodeJS.Timeout | null = null
  let fetchTimeout: NodeJS.Timeout | null = null
  const FETCH_TIMEOUT = 30000 // 30 seconds (give server time to process)
  
  const KUMA_API_URL = 'http://rndpolije.lilly.net.id:3002'
  const WS_URL = KUMA_API_URL.replace('http://', 'ws://').replace('https://', 'wss://')
  
  // Switch to different endpoint
  const switchEndpoint = (newEndpoint: string) => {
    if (currentEndpoint.value === newEndpoint) return
    
    // Stop current polling
    stopPolling()
    
    // Reset state
    data.value = null
    error.value = null
    isInitialLoad.value = true
    reconnectAttempts = 0
    
    // Update endpoint
    currentEndpoint.value = newEndpoint
    
    // Restart with new endpoint
    connect()
  }
  
  // Try WebSocket first, fallback to polling if WS not available
  const connect = async () => {
    // Start polling immediately (sets isConnected to true)
    // This ensures connection status is shown correctly
    startPolling()
    
    // Fetch initial data (non-blocking, polling will continue)
    // Don't await so polling starts immediately
    fetchData().catch(err => {
      // Initial fetch failure is OK, polling will retry
      console.log('Initial fetch failed, but polling will continue:', err)
    })
  }
  
  // Fetch monitor heartbeat data to get real status
  const fetchMonitorHeartbeat = async (monitorId: number) => {
    try {
      const response = await $fetch(`/api/heartbeat/${monitorId}`, {
        timeout: 5000
      })
      
      // If we got heartbeat data, extract the latest entry
      if (Array.isArray(response) && response.length > 0) {
        return response[response.length - 1] // Return latest heartbeat
      }
      
      return null
    } catch (err) {
      console.warn(`Failed to fetch heartbeat for monitor ${monitorId}:`, err)
      return null
    }
  }
  
  // Fetch monitor status data from Kuma API
  const fetchMonitorStatus = async (monitorId: number): Promise<KumaMonitorStatus | null> => {
    try {
      // Try heartbeat endpoint first
      const heartbeatData = await fetchMonitorHeartbeat(monitorId)
      
      if (heartbeatData && heartbeatData.status !== undefined) {
        return {
          id: monitorId,
          status: heartbeatData.status ?? 2,
          uptime: heartbeatData.uptime,
          avgResponseTime: heartbeatData.avgResponseTime,
          lastCheck: heartbeatData.timestamp || new Date().getTime()
        }
      }
      
      return null
    } catch (err) {
      console.warn(`Failed to fetch status for monitor ${monitorId}:`, err)
      return null
    }
  }
  
  // Enrich status-page data with monitor heartbeat statuses
  const enrichDataWithMonitorStatuses = async (pageData: any) => {
    if (!pageData.publicGroupList) {
      return pageData
    }
    
    // Collect all monitor IDs
    const monitorIds: number[] = []
    pageData.publicGroupList.forEach((group: any) => {
      if (group.monitorList) {
        group.monitorList.forEach((monitor: any) => {
          monitorIds.push(monitor.id)
        })
      }
    })
    
    // Note: We're not enriching from heartbeat API anymore
    // because Kuma already returns heartbeatList in status-page response
    // This enrichment is kept for future use if needed
    
    return pageData
  }

  const fetchData = async () => {
    // Don't block if already loading, but allow rapid updates
    if (loading.value) {
      // Skip this update if one is already in progress (prevents queue buildup)
      return
    }
    
    // Only show loading state on initial load or when not connected
    // During live polling, don't show loading spinner
    const shouldShowLoading = isInitialLoad.value || !isConnected.value
    
    if (shouldShowLoading) {
      loading.value = true
    }
    error.value = null
    
    // Clear any existing timeout
    if (fetchTimeout) {
      clearTimeout(fetchTimeout)
      fetchTimeout = null
    }
    
    // Set timeout for 5 seconds
    let timeoutTriggered = false
    fetchTimeout = setTimeout(() => {
      timeoutTriggered = true
      if (shouldShowLoading) {
        // Show loading state if timeout occurs
        loading.value = true
      }
    }, FETCH_TIMEOUT)
    
    try {
      // Create a timeout promise that rejects after 5 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 5 seconds')), FETCH_TIMEOUT)
      })
      
      // Create fetch promise with timeout using current endpoint
      const fetchPromise = $fetch(`/api/status-page/${currentEndpoint.value}`, {
        timeout: FETCH_TIMEOUT
      }).catch(err => {
        // If it's already a timeout, throw it as-is
        if (err.message?.includes('timeout')) {
          throw new Error('Request timeout after 5 seconds')
        }
        throw err
      })
      
      // Race between fetch and timeout
      let response = await Promise.race([fetchPromise, timeoutPromise])
      
      // Don't need to enrich - Kuma API already returns heartbeatList
      // Just use response as-is
      
      // Clear timeout if fetch succeeded
      if (fetchTimeout) {
        clearTimeout(fetchTimeout)
        fetchTimeout = null
      }
      
      data.value = response as KumaData
      lastUpdateTime.value = new Date()
      isInitialLoad.value = false
      
      // Reset reconnect attempts on success
      reconnectAttempts = 0
      // Keep isConnected as true (set when polling starts, not on each fetch)
      // This ensures it stays true as long as polling is active
    } catch (err) {
      // Clear timeout on error
      if (fetchTimeout) {
        clearTimeout(fetchTimeout)
        fetchTimeout = null
      }
      
      console.error('Error fetching monitoring data:', err)
      
      // Check if it's a timeout error
      const isTimeout = timeoutTriggered || 
                       (err instanceof Error && err.message?.includes('timeout')) ||
                       (err instanceof Error && err.message === 'Request timeout after 5 seconds')
      
      const errorMessage = isTimeout
        ? 'Request timeout after 5 seconds' 
        : (err instanceof Error ? err.message : 'Failed to fetch monitoring data')
      
      error.value = errorMessage
      
      // If timeout occurred during live polling, show loading briefly then error
      if (isTimeout && isConnected.value && !isInitialLoad.value && data.value) {
        // Show loading for 500ms, then show error (keep existing data visible during timeout)
        loading.value = true
        await new Promise(resolve => setTimeout(resolve, 500))
        loading.value = false
      } else if (!isConnected.value || isInitialLoad.value) {
        // For initial load or disconnected, show error after brief loading
        await new Promise(resolve => setTimeout(resolve, 500))
        loading.value = false
      } else {
        // During live polling with existing data, don't show loading/error, just silently retry
        loading.value = false
      }
      
      // Don't set isConnected to false on individual errors
      // Only set to false when we actually stop polling
      // This allows for temporary network issues without showing "Offline"
      
      // Handle reconnection with exponential backoff
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000) // Exponential backoff, max 30s
        reconnectTimer = setTimeout(() => {
          fetchData()
        }, delay)
      } else {
        // Only disconnect after max reconnection attempts
        // This indicates persistent failure
        isConnected.value = false
      }
    } finally {
      // Only clear loading if we were showing it
      if (shouldShowLoading || timeoutTriggered) {
        loading.value = false
      }
    }
  }
  
  const startPolling = () => {
    // Stop any existing polling
    stopPolling()
    
    // Set connected status immediately when polling starts
    // This ensures UI shows "Live" status right away
    isConnected.value = true
    
    // Poll every 5 seconds for real-time feel (instead of 30s)
    pollingInterval = setInterval(() => {
      fetchData()
    }, 5000)
    
    console.log('Monitoring polling started - status: Live')
  }
  
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
    // Only set disconnected if we're actually stopping polling
    // (not on individual fetch failures)
  }
  
  const disconnect = () => {
    stopPolling()
    
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    
    if (fetchTimeout) {
      clearTimeout(fetchTimeout)
      fetchTimeout = null
    }
    
    if (ws) {
      ws.close()
      ws = null
    }
    
    isConnected.value = false
  }
  
  // Cleanup on unmount
  onUnmounted(() => {
    disconnect()
  })
  
  return {
    data,
    loading,
    error,
    lastUpdateTime,
    isConnected,
    currentEndpoint,
    connect,
    disconnect,
    fetchData,
    switchEndpoint
  }
}
