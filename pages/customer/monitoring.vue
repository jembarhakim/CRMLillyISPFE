<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Network Monitoring</h1>
            <p class="text-sm text-gray-600">Monitor your network connection status and performance</p>
          </div>
          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-2">
              <div 
                :class="[
                  'w-3 h-3 rounded-full',
                  connectionStatus === 'up' ? 'bg-green-500' : 
                  connectionStatus === 'down' ? 'bg-red-500' : 'bg-yellow-500'
                ]"
              ></div>
              <span class="text-sm font-medium text-gray-700">
                {{ connectionStatus === 'up' ? 'Connected' : 
                   connectionStatus === 'down' ? 'Disconnected' : 'Checking...' }}
              </span>
            </div>
            <div class="flex items-center space-x-2">
              <div 
                :class="[
                  'w-3 h-3 rounded-full',
                  wsConnected ? 'bg-blue-500' : 'bg-gray-400'
                ]"
              ></div>
              <span class="text-sm font-medium text-gray-700">
                {{ wsConnected ? 'Live Updates' : 'Offline' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Connection Status Summary -->
      <div class="bg-white rounded-lg shadow-sm border mb-8">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Connection Status Summary</h3>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Total Connection Up -->
            <div class="text-center">
              <div class="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-green-100">
                <UIcon name="i-lucide-check-circle" class="w-8 h-8 text-green-600" />
              </div>
              <h4 class="text-lg font-semibold text-gray-900">Total Connection Up</h4>
              <p class="text-2xl font-bold text-green-600">{{ connectionSummary.totalUp || 0 }}</p>
              <p class="text-sm text-gray-600">Active connections</p>
            </div>

            <!-- Total Connection Down -->
            <div class="text-center">
              <div class="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-red-100">
                <UIcon name="i-lucide-x-circle" class="w-8 h-8 text-red-600" />
              </div>
              <h4 class="text-lg font-semibold text-gray-900">Total Connection Down</h4>
              <p class="text-2xl font-bold text-red-600">{{ connectionSummary.totalDown || 0 }}</p>
              <p class="text-sm text-gray-600">Failed connections</p>
            </div>

            <!-- Total Connection Off -->
            <div class="text-center">
              <div class="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-gray-100">
                <UIcon name="i-lucide-power" class="w-8 h-8 text-gray-600" />
              </div>
              <h4 class="text-lg font-semibold text-gray-900">Total Connection Off</h4>
              <p class="text-2xl font-bold text-gray-600">{{ connectionSummary.totalOff || 0 }}</p>
              <p class="text-sm text-gray-600">Disconnected</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Customer List -->
      <div class="bg-white rounded-lg shadow-sm border mb-8">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">Customer Connections</h3>
            <div class="flex items-center space-x-4">
              <!-- Search -->
              <div class="relative">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search customers..."
                  class="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <UIcon name="i-lucide-search" class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              
              <!-- Status Filter -->
              <select
                v-model="statusFilter"
                class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="up">Up</option>
                <option value="down">Down</option>
                <option value="off">Off</option>
              </select>
            </div>
          </div>
        </div>
        <div class="p-6">
          <!-- Customer Table -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MAC Address
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Seen
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-if="loading" class="text-center">
                  <td colspan="5" class="px-6 py-4">
                    <div class="flex items-center justify-center">
                      <UIcon name="i-lucide-refresh-cw" class="w-6 h-6 text-gray-400 animate-spin mr-2" />
                      <span class="text-gray-500">Loading customers...</span>
                    </div>
                  </td>
                </tr>
                <tr v-else-if="filteredCustomers.length === 0" class="text-center">
                  <td colspan="5" class="px-6 py-4 text-gray-500">
                    No customers found
                  </td>
                </tr>
                <tr v-else v-for="customer in filteredCustomers" :key="customer.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <UIcon name="i-lucide-user" class="w-5 h-5 text-gray-600" />
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">{{ customer.name || 'Unknown' }}</div>
                        <div class="text-sm text-gray-500">{{ customer.email || 'N/A' }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ customer.ip_address || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ customer.mac_address || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span 
                      :class="[
                        'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                        getStatusClass(customer.status)
                      ]"
                    >
                      {{ customer.status?.toUpperCase() || 'UNKNOWN' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatTime(customer.last_seen) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Pagination -->
          <div v-if="filteredCustomers.length > 0" class="mt-4 flex items-center justify-between">
            <div class="text-sm text-gray-700">
              Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredCustomers.length) }} of {{ filteredCustomers.length }} customers
            </div>
            <div class="flex space-x-2">
              <button
                @click="currentPage = Math.max(1, currentPage - 1)"
                :disabled="currentPage === 1"
                class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                @click="currentPage = Math.min(totalPages, currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Connection History -->
      <div class="bg-white rounded-lg shadow-sm border">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">Connection History</h3>
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
              
              <!-- Refresh Button -->
              <button
                @click="refreshData"
                :disabled="loading"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UIcon name="i-lucide-refresh-cw" class="w-4 h-4 mr-2" />
                {{ loading ? 'Refreshing...' : 'Refresh' }}
              </button>
            </div>
          </div>
        </div>
        
        <div class="p-6">
          <!-- History Chart -->
          <div class="mb-6">
            <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div v-if="loading" class="text-center">
                <UIcon name="i-lucide-refresh-cw" class="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                <p class="text-gray-500">Loading chart...</p>
              </div>
              <div v-else-if="connectionHistory.length === 0" class="text-center text-gray-500">
                <UIcon name="i-lucide-bar-chart" class="w-8 h-8 mx-auto mb-2" />
                <p>No connection history available</p>
              </div>
              <div v-else class="w-full h-full">
                <!-- Simple status timeline -->
                <div class="flex items-center justify-between h-full px-4">
                  <div 
                    v-for="(event, index) in connectionHistory.slice(-20)" 
                    :key="index"
                    :class="[
                      'w-4 h-4 rounded-full',
                      event.status === 'up' ? 'bg-green-500' : 'bg-red-500'
                    ]"
                    :title="`${event.status.toUpperCase()} - ${formatTime(event.timestamp)}`"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Events -->
          <div class="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            <div v-if="connectionHistory.length === 0" class="p-8 text-center text-gray-500">
              <UIcon name="i-lucide-info" class="w-8 h-8 mx-auto mb-2" />
              <p>No connection events available</p>
            </div>
            
            <div v-else class="divide-y divide-gray-200">
              <div
                v-for="(event, index) in connectionHistory.slice(-10)"
                :key="index"
                class="p-4 hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div 
                      :class="[
                        'w-3 h-3 rounded-full',
                        event.status === 'up' ? 'bg-green-500' : 'bg-red-500'
                      ]"
                    ></div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">
                        Connection {{ event.status === 'up' ? 'Restored' : 'Lost' }}
                      </p>
                      <p class="text-xs text-gray-500">
                        {{ event.duration ? `Duration: ${event.duration}` : '' }}
                      </p>
                    </div>
                  </div>
                  <span class="text-xs text-gray-500">
                    {{ formatTime(event.timestamp) }}
                  </span>
                </div>
              </div>
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
          <UIcon name="i-lucide-x" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useApiHost } from '../../composables/useApiHost'
import { useAuthStore } from '../../stores/auth'
import { useWebSocket } from '../../composables/useWebSocket'
import { 
  getConnectionHistory,
  type ConnectionEvent
} from '../../api/customer/monitoring'
import { customerAdminApi } from '../../api/admin/customer'

// Set page title
useHead({
  title: 'Network Monitoring - CRM System'
})

// Define interfaces for customer data
interface CustomerWithStatus {
  id: string
  name: string
  email: string
  ip_address: string
  mac_address: string
  status: string
  last_seen: string | Date
}

interface ConnectionSummary {
  totalUp: number
  totalDown: number
  totalOff: number
}

// API configuration
const apiHost = useApiHost()
const authStore = useAuthStore()

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = authStore.getToken
  if (!token || token === '' || token === 'null' || token === 'undefined') {
    throw new Error('No valid authentication token available')
  }
  return {
    'Authorization': `Bearer ${token}`
  }
}

// Reactive data
const connectionStatus = ref('checking')
const uptime = ref('')
const lastCheck = ref('')
const connectionSummary = ref<ConnectionSummary>({
  totalUp: 0,
  totalDown: 0,
  totalOff: 0
})
const customers = ref<CustomerWithStatus[]>([])
const connectionHistory = ref<ConnectionEvent[]>([])
const selectedTimeRange = ref('1d')
const loading = ref(false)
const alert = ref({ show: false, message: '', type: 'info' })

// Search and filter
const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)

// WebSocket setup
const { isConnected: wsConnected, messages: wsMessages, connect: wsConnect, disconnect: wsDisconnect } = useWebSocket(
  `${apiHost}/api/customer/monitoring/ws`,
  authStore.user?.user_id || ''
)

// Computed properties
const filteredCustomers = computed((): CustomerWithStatus[] => {
  let filtered = customers.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(customer => 
      customer.name?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.ip_address?.toLowerCase().includes(query)
    )
  }

  // Filter by status
  if (statusFilter.value) {
    filtered = filtered.filter(customer => customer.status === statusFilter.value)
  }

  return filtered
})

const totalPages = computed(() => {
  return Math.ceil(filteredCustomers.value.length / itemsPerPage.value)
})

// Methods
const showAlert = (message: string, type = 'info'): void => {
  alert.value = { show: true, message, type }
  setTimeout(() => {
    closeAlert()
  }, 5000)
}

const closeAlert = (): void => {
  alert.value.show = false
}

const refreshData = async (): Promise<void> => {
  loading.value = true
  try {
    await Promise.all([
      fetchConnectionSummary(),
      fetchCustomers(),
      fetchConnectionHistory()
    ])
    showAlert('Data refreshed successfully', 'success')
  } catch (error: any) {
    showAlert(`Failed to refresh data: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

const fetchConnectionSummary = async (): Promise<void> => {
  try {
    // Get all customers and calculate summary
    const customerApi = customerAdminApi()
    const response = await customerApi.getAllCustomers()
    
    if (response.success) {
      const allCustomers = response.data || []
      
      // Calculate summary from customer data
      let totalUp = 0
      let totalDown = 0
      let totalOff = 0
      
      allCustomers.forEach((customer: any) => {
        // Check if customer has device and determine status
        if (customer.device) {
          // You can add logic here to determine status based on device data
          // For now, we'll use a simple logic based on customer status
          if (customer.status_user === 'active') {
            totalUp++
          } else if (customer.status_user === 'inactive') {
            totalDown++
          } else {
            totalOff++
          }
        } else {
          totalOff++
        }
      })
      
      connectionSummary.value = {
        totalUp,
        totalDown,
        totalOff
      }
    }
  } catch (error) {
    console.error('Failed to get connection summary:', error)
  }
}

const fetchCustomers = async (): Promise<void> => {
  try {
    const customerApi = customerAdminApi()
    const response = await customerApi.getAllCustomers()
    
    if (response.success) {
      const allCustomers = response.data || []
      
      // Transform customer data to include connection info
      customers.value = allCustomers.map((customer: any): CustomerWithStatus => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        ip_address: customer.device?.ip_address || 'N/A',
        mac_address: customer.device?.mac_address || 'N/A',
        status: getCustomerConnectionStatus(customer),
        last_seen: customer.device?.last_seen || customer.updated_at
      }))
    }
  } catch (error) {
    console.error('Failed to get customers:', error)
  }
}

// Helper function to determine customer connection status
const getCustomerConnectionStatus = (customer: any): string => {
  if (!customer.device) {
    return 'off'
  }
  
  // You can add more sophisticated logic here based on device data
  // For now, using customer status as a simple indicator
  if (customer.status_user === 'active') {
    return 'up'
  } else if (customer.status_user === 'inactive') {
    return 'down'
  } else {
    return 'off'
  }
}

const fetchConnectionHistory = async (): Promise<void> => {
  try {
    const token = authStore.getToken
    const data = await getConnectionHistory(selectedTimeRange.value, token)
    
    if (data.success) {
      connectionHistory.value = data.data || []
    }
  } catch (error) {
    console.error('Failed to get connection history:', error)
  }
}

const changeTimeRange = (): void => {
  fetchConnectionHistory()
}

const formatTime = (timestamp: string | Date): string => {
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

const getStatusClass = (status: string): string => {
  const statusLower = status?.toLowerCase()
  if (statusLower === 'up') return 'bg-green-100 text-green-800'
  if (statusLower === 'down') return 'bg-red-100 text-red-800'
  if (statusLower === 'off') return 'bg-gray-100 text-gray-800'
  return 'bg-yellow-100 text-yellow-800'
}

// Auto-refresh data every 30 seconds
let refreshInterval: NodeJS.Timeout | null = null

const startAutoRefresh = (): void => {
  if (refreshInterval) clearInterval(refreshInterval)
  
  refreshInterval = setInterval(() => {
    fetchConnectionSummary()
    fetchCustomers()
    fetchConnectionHistory()
  }, 30000)
}

const stopAutoRefresh = (): void => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

// Watch WebSocket messages for real-time updates
watch(wsMessages, (newMessages) => {
  if (newMessages.length > 0) {
    const latestMessage = newMessages[newMessages.length - 1]
    
    if (latestMessage.type === 'status_update') {
      // Update connection status in real-time
      const data = latestMessage.data
      if (data.status) {
        connectionStatus.value = data.status
        lastCheck.value = new Date().toLocaleString('id-ID')
      }
    }
  }
}, { deep: true })

// Lifecycle hooks
onMounted(() => {
  refreshData()
  startAutoRefresh()
  
  // Connect to WebSocket for real-time updates
  if (authStore.user?.user_id) {
    wsConnect()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
  wsDisconnect()
})
</script>

<style scoped>
/* Custom scrollbar for history container */
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
