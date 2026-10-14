import { onUnmounted, ref } from 'vue'

export interface NetworkStatusUpdate {
  device_name: string
  ip_address: string
  status: 'up' | 'down'
}

export function useNetworkSocket(url: string) {
  const socket = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const error = ref<string | null>(null)
  const latestUpdate = ref<NetworkStatusUpdate | null>(null)

  let reconnectTimer: ReturnType<typeof setTimeout> | undefined
  let reconnectAttempts = 0
  let shouldReconnect = false

  const scheduleReconnect = () => {
    if (!shouldReconnect || reconnectTimer) return

    const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000)
    reconnectAttempts += 1
    reconnectTimer = setTimeout(() => {
      reconnectTimer = undefined
      connect()
    }, delay)
  }

  const connect = () => {
    if (typeof window === 'undefined') return

    shouldReconnect = true
    if (socket.value && (socket.value.readyState === WebSocket.OPEN || socket.value.readyState === WebSocket.CONNECTING)) {
      return
    }

    try {
      const currentSocket = new WebSocket(url)
      socket.value = currentSocket

      currentSocket.onopen = () => {
        isConnected.value = true
        error.value = null
        reconnectAttempts = 0
      }

      currentSocket.onmessage = (event: MessageEvent<string>) => {
        try {
          const update = JSON.parse(event.data) as Partial<NetworkStatusUpdate>
          const ipAddress = update.ip_address?.trim()
          const status = update.status?.toLowerCase()

          if (!ipAddress || (status !== 'up' && status !== 'down')) {
            console.error('Invalid network status update received:', update)
            return
          }

          latestUpdate.value = {
            device_name: update.device_name?.trim() || ipAddress,
            ip_address: ipAddress,
            status
          }
        } catch (parseError) {
          error.value = 'Received an invalid WebSocket message'
          console.error('Unable to parse network status update:', parseError)
        }
      }

      currentSocket.onerror = (event) => {
        error.value = 'Network monitoring connection error'
        console.error('Network monitoring WebSocket error:', event)
        currentSocket.close()
      }

      currentSocket.onclose = () => {
        if (socket.value === currentSocket) {
          socket.value = null
          isConnected.value = false
        }
        scheduleReconnect()
      }
    } catch (connectionError) {
      error.value = 'Unable to start network monitoring connection'
      console.error('Unable to create network monitoring WebSocket:', connectionError)
      scheduleReconnect()
    }
  }

  const disconnect = () => {
    shouldReconnect = false
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = undefined
    }

    socket.value?.close()
    socket.value = null
    isConnected.value = false
  }

  onUnmounted(disconnect)

  return {
    isConnected,
    error,
    latestUpdate,
    connect,
    disconnect
  }
}
