import { ref, onUnmounted } from 'vue'
import { useApiHost } from './useApiHost'

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

export function useWebSocket(url: string, token: string) {
  const apiHost = useApiHost()
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const messages = ref<WebSocketMessage[]>([])
  const error = ref<string | null>(null)

  const connect = () => {
    try {
      // Convert HTTP URL to WebSocket URL
      const wsUrl = url.replace('http://', 'ws://').replace('https://', 'wss://')
      const fullUrl = `${wsUrl}?customer_id=${token}`
      
      ws.value = new WebSocket(fullUrl)

      ws.value.onopen = () => {
        isConnected.value = true
        error.value = null
        console.log('WebSocket connected')
      }

      ws.value.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          messages.value.push(message)
          
          // Keep only last 100 messages
          if (messages.value.length > 100) {
            messages.value = messages.value.slice(-100)
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      ws.value.onclose = () => {
        isConnected.value = false
        console.log('WebSocket disconnected')
      }

      ws.value.onerror = (err) => {
        error.value = 'WebSocket connection error'
        console.error('WebSocket error:', err)
      }
    } catch (err) {
      error.value = 'Failed to create WebSocket connection'
      console.error('WebSocket connection error:', err)
    }
  }

  const disconnect = () => {
    if (ws.value) {
      ws.value.close()
      ws.value = null
      isConnected.value = false
    }
  }

  const sendMessage = (message: any) => {
    if (ws.value && isConnected.value) {
      ws.value.send(JSON.stringify(message))
    }
  }

  // Auto-cleanup on unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    ws,
    isConnected,
    messages,
    error,
    connect,
    disconnect,
    sendMessage
  }
}
