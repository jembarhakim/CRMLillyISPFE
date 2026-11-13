<template>
  <div class="min-h-screen bg-gray-50">
    <AdminPageHeader
      class="w-full"
      title="MikroTik"
      description="Kelola akun hotspot lokal, sesi aktif, profil, dan IP binding."
      icon="server"
      eyebrow="Manajemen Jaringan"
    >
      <template #actions>
        <span class="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
          RouterOS API
        </span>
      </template>
    </AdminPageHeader>

    <div class="w-full py-8">
      <HotspotManager class="mb-8" />

      <details class="mb-8 rounded-lg border border-gray-200 bg-white p-4">
        <summary class="cursor-pointer font-medium text-gray-700">Monitoring SSH lama (opsional, bukan daftar perangkat The Dude)</summary>
        <div class="pt-5">
      <!-- Connection Panel -->
      <div class="bg-white rounded-lg shadow-sm border mb-8">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Pengaturan Koneksi</h3>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Alamat Host</label>
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
              <label class="block text-sm font-medium text-gray-700 mb-2">Nama Pengguna</label>
              <input
                v-model="connectionConfig.username"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Kata Sandi</label>
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
              <LucideIcon name="plug" :size="16" class="mr-2" />
              {{ connectionStatus === 'connecting' ? 'Menghubungkan...' : 'Hubungkan' }}
            </button>
            <button
              @click="disconnectFromMikroTik"
              :disabled="connectionStatus !== 'connected'"
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LucideIcon name="x" :size="16" class="mr-2" />
              Putuskan Koneksi
            </button>
            <button
              @click="refreshLogs"
              :disabled="connectionStatus !== 'connected'"
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LucideIcon name="rotate-ccw" :size="16" class="mr-2" />
              Muat Ulang Log
            </button>
          </div>
        </div>
      </div>

      <!-- Logs Panel -->
      <div class="bg-white rounded-lg shadow-sm border">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">Log Perangkat</h3>
            <div class="flex items-center space-x-4">
              <!-- Time Range Selector -->
              <div class="flex items-center space-x-2">
                <label class="text-sm font-medium text-gray-700">Rentang Waktu:</label>
                <select
                  v-model="selectedTimeRange"
                  @change="changeTimeRange"
                  class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1h">1 Jam Terakhir</option>
                  <option value="6h">6 Jam Terakhir</option>
                  <option value="1d" selected>1 Hari Terakhir</option>
                  <option value="7d">7 Hari Terakhir</option>
                  <option value="30d">30 Hari Terakhir</option>
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
              <LucideIcon name="info" :size="48" class="mb-4 text-gray-400" />
              <p>Belum ada log. Hubungkan ke MikroTik untuk melihat log.</p>
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
                      {{ statusLabel(log.status) }}
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
            <span>Menampilkan {{ filteredLogs.length }} dari {{ logs.length }} log</span>
            <span>Pembaruan terakhir: {{ lastUpdateTime }}</span>
          </div>
        </div>
      </div>

      <!-- Netwatch Devices Panel -->
      <div v-if="connectionStatus === 'connected'" class="mt-8 bg-white rounded-lg shadow-sm border">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">Perangkat Netwatch</h3>
            <button
              @click="getNetwatchDevices"
              :disabled="connectionStatus !== 'connected'"
              class="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <LucideIcon name="rotate-ccw" :size="16" class="mr-1" />
              Muat Ulang
            </button>
          </div>
        </div>
        <div class="p-6">
          <div v-if="netwatchDevices.length === 0" class="text-center py-8 text-gray-500">
            <LucideIcon name="globe" :size="48" class="mb-4 text-gray-400" />
            <p>Perangkat Netwatch tidak ditemukan. Hubungkan ke MikroTik untuk melihat perangkat.</p>
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
                <p><span class="font-medium">Interval:</span> {{ device.interval || 'Tidak tersedia' }}</p>
                <p><span class="font-medium">Batas Waktu:</span> {{ device.timeout || 'Tidak tersedia' }}</p>
                <p v-if="device.comment"><span class="font-medium">Catatan:</span> {{ device.comment }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- System Info Panel -->
      <div v-if="connectionStatus === 'connected'" class="mt-8 bg-white rounded-lg shadow-sm border">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Informasi Sistem</h3>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="font-medium text-gray-900 mb-2">Beban CPU</h4>
              <p class="text-sm text-gray-600">{{ systemInfo.cpu_load || 'N/A' }}</p>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="font-medium text-gray-900 mb-2">Penggunaan Memori</h4>
              <p class="text-sm text-gray-600">{{ systemInfo.memory || 'N/A' }}</p>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="font-medium text-gray-900 mb-2">Waktu Aktif</h4>
              <p class="text-sm text-gray-600">{{ systemInfo.uptime || 'N/A' }}</p>
            </div>
          </div>
        </div>
      </div>
        </div>
      </details>
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
          <LucideIcon name="x" :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useApiHost } from '~/composables/useApiHost'
import { useAuthStore } from '~/stores/auth'
import LucideIcon from '@/components/LucideIcon.vue'
import HotspotManager from '@/components/mikrotik/HotspotManager.vue'

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
    const redirectPath = authStore.userType === 'employee' ? '/employee' : '/login'
    navigateTo(redirectPath)
    throw new Error('Token autentikasi tidak valid atau tidak tersedia')
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
      showAlert('Sesi berakhir. Silakan masuk kembali.', 'error')
      const userType = authStore.userType
      authStore.logout()
      const redirectPath = userType === 'employee' ? '/employee' : '/login'
      navigateTo(redirectPath)
    }
  }
}

// Reactive data
const connectionStatus = ref('disconnected')
const connectionConfig = ref({
  host: '',
  port: 22,
  username: '',
  password: ''
})

const logs = ref([])
const systemInfo = ref({})
const netwatchDevices = ref([])
const selectedTimeRange = ref('1d')
const activeLogFilter = ref('all')
const lastUpdateTime = ref('Belum pernah')
const alert = ref({ show: false, message: '', type: 'info' })

// Log filters - simplified to only UP and DOWN
const logFilters = [
  { value: 'all', label: 'Semua' },
  { value: 'up', label: 'Terhubung' },
  { value: 'down', label: 'Terputus' }
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
      showAlert('Berhasil terhubung ke MikroTik', 'success')
      await refreshLogs()
      await getSystemInfo()
      await getNetwatchDevices()
      startAutoRefresh()
    } else {
      throw new Error(data.message || 'Gagal terhubung')
    }
  } catch (error) {
    connectionStatus.value = 'disconnected'
    handleTokenExpiration(error)
    showAlert(`Koneksi gagal: ${error.message}`, 'error')
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
      showAlert('Berhasil memutuskan koneksi dari MikroTik', 'success')
    } else {
      throw new Error(data.message || 'Gagal memutuskan koneksi')
    }
  } catch (error) {
    handleTokenExpiration(error)
    showAlert(`Gagal memutuskan koneksi: ${error.message}`, 'error')
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
      throw new Error(data.message || 'Gagal mengambil log')
    }
  } catch (error) {
    handleTokenExpiration(error)
    showAlert(`Gagal memuat ulang log: ${error.message}`, 'error')
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
      throw new Error(data.message || 'Gagal mengambil perangkat Netwatch')
    }
  } catch (error) {
    console.error('Error getting netwatch devices:', error)
    handleTokenExpiration(error)
    showAlert(`Gagal mengambil perangkat Netwatch: ${error.message}`, 'error')
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

const statusLabel = (status) => {
  const labels = {
    up: 'Terhubung',
    down: 'Terputus',
    warning: 'Peringatan',
    error: 'Kesalahan',
    critical: 'Kritis'
  }
  return labels[status.toLowerCase()] || status
}

const formatTime = (timestamp) => {
  if (!timestamp) return 'Tidak tersedia'
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
