<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">MikroTik Monitoring</h1>
            <p class="text-sm text-gray-600">Monitor your MikroTik device logs and system status</p>
          </div>
          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-2">
              <div 
                :class="[
                  'w-3 h-3 rounded-full',
                  connectionStatus === 'connected' ? 'bg-green-500' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                ]"
              ></div>
              <span class="text-sm font-medium text-gray-700">
                {{ connectionStatus === 'connected' ? 'Connected' : 
                   connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Connection Panel -->
      <div class="bg-white rounded-lg shadow-sm border mb-8">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Connection Settings</h3>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Host</label>
              <input
                v-model="connectionConfig.host"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="192.168.1.1"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Port</label>
              <input
                v-model="connectionConfig.port"
                type="number"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="22"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                v-model="connectionConfig.username"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                v-model="connectionConfig.password"
                type="password"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <div class="flex space-x-3">
            <button
              @click="connectToMikroTik"
              :disabled="connectionStatus === 'connected' || connectionStatus === 'connecting'"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="lucide:plug" class="w-4 h-4 mr-2" />
              {{ connectionStatus === 'connecting' ? 'Connecting...' : 'Connect' }}
            </button>
            <button
              @click="disconnectFromMikroTik"
              :disabled="connectionStatus !== 'connected'"
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="lucide:x" class="w-4 h-4 mr-2" />
              Disconnect
            </button>
            <button
              @click="refreshLogs"
              :disabled="connectionStatus !== 'connected'"
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="lucide:refresh-cw" class="w-4 h-4 mr-2" />
              Refresh Logs
            </button>
          </div>
        </div>
      </div>

      <!-- Logs Panel -->
      <div class="bg-white rounded-lg shadow-sm border">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">Device Logs</h3>
            <div class="flex items-center space-x-4">
              <!-- Time Range Selector -->
              <div class="flex items-center space-x-2">
                <label class="text-sm font-medium text-gray-700">Time Range:</label>
                <select
                  v-model="selectedTimeRange"
                  @change="changeTimeRange"
                  class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1h">Last 1 Hour</option>
                  <option value="6h">Last 6 Hours</option>
                  <option value="1d" selected>Last 1 Day</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
              
              <!-- Filter Buttons -->
              <div class="flex space-x-2">
                <button
                  v-for="filter in logFilters"
                  :key="filter.value"
                  @click="setLogFilter(filter.value)"
                  :class="[
                    'px-3 py-1 text-sm rounded-full border transition-colors',
                    activeLogFilter === filter.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                  ]"
                >
                  {{ filter.label }}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="p-6">
          <!-- Logs Container -->
          <div class="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            <div v-if="logs.length === 0" class="p-8 text-center text-gray-500">
              <Icon name="lucide:info" class="w-12 h-12 mb-4 text-gray-400" />
              <p>No logs available. Connect to MikroTik to view logs.</p>
            </div>
            
            <div v-else class="divide-y divide-gray-200">
              <div
                v-for="(log, index) in filteredLogs"
                :key="index"
                class="p-4 hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center space-x-3 mb-2">
                      <span class="font-medium text-gray-900">{{ log.host }}</span>
                      <span class="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {{ log.category }}
                      </span>
                    </div>
                    <p class="text-gray-700 text-sm">{{ log.comment }}</p>
                  </div>
                  <div class="flex items-center space-x-3">
                    <span
                      :class="[
                        'px-3 py-1 text-xs font-medium rounded-full',
                        getStatusClass(log.status)
                      ]"
                    >
                      {{ log.status }}
                    </span>
                    <span class="text-xs text-gray-500">
                      {{ formatTime(log.timestamp) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Logs Summary -->
          <div class="mt-4 flex justify-between items-center text-sm text-gray-600">
            <span>Showing {{ filteredLogs.length }} of {{ logs.length }} logs</span>
            <span>Last updated: {{ lastUpdateTime }}</span>
          </div>
        </div>
      </div>

      <!-- Netwatch Devices Panel -->
      <div v-if="connectionStatus === 'connected'" class="mt-8 bg-white rounded-lg shadow-sm border">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">Netwatch Devices</h3>
            <button
              @click="getNetwatchDevices"
              :disabled="connectionStatus !== 'connected'"
              class="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Icon name="lucide:refresh-cw" class="w-4 h-4 mr-1" />
              Refresh
            </button>
          </div>
        </div>
        <div class="p-6">
          <div v-if="netwatchDevices.length === 0" class="text-center py-8 text-gray-500">
            <Icon name="lucide:network" class="w-12 h-12 mb-4 text-gray-400" />
            <p>No Netwatch devices found. Connect to MikroTik to view devices.</p>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div 
              v-for="device in netwatchDevices" 
              :key="device.host"
              :class="[
                'p-4 rounded-lg border-2',
                device.status === 'UP' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              ]"
            >
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium text-gray-900">{{ device.host }}</h4>
                <span 
                  :class="[
                    'px-2 py-1 rounded-full text-xs font-medium',
                    device.status === 'UP' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  ]"
                >
                  {{ device.status }}
                </span>
              </div>
              <div class="text-sm text-gray-600 space-y-1">
                <p><span class="font-medium">Interval:</span> {{ device.interval || 'N/A' }}</p>
                <p><span class="font-medium">Timeout:</span> {{ device.timeout || 'N/A' }}</p>
                <p v-if="device.comment"><span class="font-medium">Comment:</span> {{ device.comment }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- System Info Panel -->
      <div v-if="connectionStatus === 'connected'" class="mt-8 bg-white rounded-lg shadow-sm border">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">System Information</h3>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="font-medium text-gray-900 mb-2">CPU Load</h4>
              <p class="text-sm text-gray-600">{{ systemInfo.cpu_load || 'N/A' }}</p>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="font-medium text-gray-900 mb-2">Memory Usage</h4>
              <p class="text-sm text-gray-600">{{ systemInfo.memory || 'N/A' }}</p>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="font-medium text-gray-900 mb-2">Uptime</h4>
              <p class="text-sm text-gray-600">{{ systemInfo.uptime || 'N/A' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Alert Messages -->
    <div
      v-if="alert.show"
      :class="[
        'fixed top-4 right-4 p-4 rounded-lg shadow-lg max-w-md z-50',
        alert.type === 'success' ? 'bg-green-500 text-white' :
        alert.type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
      ]"
    >
      <div class="flex items-center justify-between">
        <span>{{ alert.message }}</span>
        <button @click="closeAlert" class="ml-4 text-white hover:text-gray-200">
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useApiHost } from '~/composables/useApiHost'
import { useAuthStore } from '~/stores/auth'
import { Icon } from '#components'

// Set page title
useHead({
  title: 'MikroTik Monitoring - CRM System'
})

// API configuration
const apiHost = useApiHost()
const authStore = useAuthStore()

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = authStore.getToken
  if (!token || token === '' || token === 'null' || token === 'undefined') {
    // Try to redirect to login if no token
    navigateTo('/login')
    throw new Error('No valid authentication token available')
  }
  return {
    'Authorization': `Bearer ${token}`
  }
}

// Helper function to handle token expiration
const handleTokenExpiration = (error) => {
  if (error.message && error.message.includes('Invalid Token')) {
    // Use global token expiration handler with modal confirmation
    if (window.handleTokenExpiration) {
      window.handleTokenExpiration()
    } else {
      // Fallback if global handler not available
      showAlert('Session expired. Please login again.', 'error')
      authStore.logout()
      navigateTo('/login')
    }
  }
}

// Reactive data
const connectionStatus = ref('disconnected')
const connectionConfig = ref({
  host: '10.10.3.1',
  port: 2223,
  username: 'polije',
  password: '2025'
})

const logs = ref([])
const systemInfo = ref({})
const netwatchDevices = ref([])
const selectedTimeRange = ref('1d')
const activeLogFilter = ref('all')
const lastUpdateTime = ref('Never')
const alert = ref({ show: false, message: '', type: 'info' })

// Log filters - simplified to only UP and DOWN
const logFilters = [
  { value: 'all', label: 'All' },
  { value: 'up', label: 'UP' },
  { value: 'down', label: 'DOWN' }
]

// Computed properties
const filteredLogs = computed(() => {
  if (activeLogFilter.value === 'all') return logs.value
  
  return logs.value.filter(log => {
    // Only filter by UP or DOWN status
    return log.status.toLowerCase() === activeLogFilter.value.toLowerCase()
  })
})

// Methods
const showAlert = (message, type = 'info') => {
  alert.value = { show: true, message, type }
  setTimeout(() => {
    closeAlert()
  }, 5000)
}

const closeAlert = () => {
  alert.value.show = false
}

const connectToMikroTik = async () => {
  try {
    connectionStatus.value = 'connecting'
    
    const response = await fetch(`${apiHost}/api/admin/mikrotik/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(connectionConfig.value)
    })
    
    const data = await response.json()
    
    if (data.success) {
      connectionStatus.value = 'connected'
      showAlert('Successfully connected to MikroTik', 'success')
      await refreshLogs()
      await getSystemInfo()
      await getNetwatchDevices()
      startAutoRefresh()
    } else {
      throw new Error(data.message || 'Failed to connect')
    }
  } catch (error) {
    connectionStatus.value = 'disconnected'
    handleTokenExpiration(error)
    showAlert(`Connection failed: ${error.message}`, 'error')
  }
}

const disconnectFromMikroTik = async () => {
  try {
    const response = await fetch(`${apiHost}/api/admin/mikrotik/disconnect`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    
    const data = await response.json()
    
    if (data.success) {
      connectionStatus.value = 'disconnected'
      logs.value = []
      systemInfo.value = {}
      netwatchDevices.value = []
      stopAutoRefresh()
      showAlert('Successfully disconnected from MikroTik', 'success')
    } else {
      throw new Error(data.message || 'Failed to disconnect')
    }
  } catch (error) {
    handleTokenExpiration(error)
    showAlert(`Disconnect failed: ${error.message}`, 'error')
  }
}

const refreshLogs = async () => {
  if (connectionStatus.value !== 'connected') return
  
  try {
    const response = await fetch(`${apiHost}/api/admin/mikrotik/logs?timeRange=${selectedTimeRange.value}`, {
      headers: getAuthHeaders()
    })
    
    const data = await response.json()
    
    if (data.success) {
      logs.value = data.data.logs || []
      lastUpdateTime.value = new Date().toLocaleString('id-ID')
    } else {
      throw new Error(data.message || 'Failed to get logs')
    }
  } catch (error) {
    handleTokenExpiration(error)
    showAlert(`Failed to refresh logs: ${error.message}`, 'error')
  }
}

const getNetwatchDevices = async () => {
  if (connectionStatus.value !== 'connected') return
  
  try {
    const response = await fetch(`${apiHost}/api/admin/mikrotik/netwatch/devices`, {
      headers: getAuthHeaders()
    })
    
    const data = await response.json()
    
    // Debug logging
    console.log('Netwatch devices API response:', data)
    
    if (data.success) {
      netwatchDevices.value = data.data.devices || []
      console.log('Netwatch devices set to:', netwatchDevices.value)
    } else {
      throw new Error(data.message || 'Failed to get netwatch devices')
    }
  } catch (error) {
    console.error('Error getting netwatch devices:', error)
    handleTokenExpiration(error)
    showAlert(`Failed to get netwatch devices: ${error.message}`, 'error')
  }
}

const getSystemInfo = async () => {
  if (connectionStatus.value !== 'connected') return
  
  try {
    const response = await fetch(`${apiHost}/api/admin/mikrotik/system/info`, {
      headers: getAuthHeaders()
    })
    
    const data = await response.json()
    
    if (data.success) {
      systemInfo.value = data.data || {}
    }
  } catch (error) {
    console.error('Failed to get system info:', error)
    handleTokenExpiration(error)
  }
}

const changeTimeRange = () => {
  if (connectionStatus.value === 'connected') {
    refreshLogs()
  }
}

const setLogFilter = (filter) => {
  activeLogFilter.value = filter
}

const getStatusClass = (status) => {
  const statusLower = status.toLowerCase()
  if (statusLower === 'up') return 'bg-green-100 text-green-800'
  if (statusLower === 'down') return 'bg-red-100 text-red-800'
  if (statusLower === 'warning') return 'bg-yellow-100 text-yellow-800'
  if (statusLower === 'error' || statusLower === 'critical') return 'bg-red-100 text-red-800'
  return 'bg-blue-100 text-blue-800'
}

const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A'
  return new Date(timestamp).toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Auto-refresh logs every 30 seconds when connected
let refreshInterval = null

const startAutoRefresh = () => {
  if (refreshInterval) clearInterval(refreshInterval)
  
  refreshInterval = setInterval(() => {
    if (connectionStatus.value === 'connected') {
      refreshLogs()
      getNetwatchDevices()
    }
  }, 30000)
}

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

// Lifecycle hooks
onMounted(() => {
  // Check initial connection status
  checkConnectionStatus()
})

onUnmounted(() => {
  stopAutoRefresh()
})

// Check connection status on mount
const checkConnectionStatus = async () => {
  try {
    const response = await fetch(`${apiHost}/api/admin/mikrotik/status`, {
      headers: getAuthHeaders()
    })
    
    const data = await response.json()
    
    if (data.success && data.data.status === 'connected') {
      connectionStatus.value = 'connected'
      await refreshLogs()
      await getSystemInfo()
      startAutoRefresh()
    }
  } catch (error) {
    console.error('Failed to check connection status:', error)
  }
}

// Watch connection status changes
watch(connectionStatus, (newStatus) => {
  if (newStatus === 'connected') {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})
</script>

<style scoped>
/* Custom scrollbar for logs container */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
