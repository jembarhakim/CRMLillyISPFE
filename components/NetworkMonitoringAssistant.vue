<template>
  <div class="network-monitoring-assistant">
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Network Monitoring Assistant</h3>
        <div class="flex items-center space-x-2">
          <div class="flex items-center">
            <div :class="connectionStatusClass" class="w-3 h-3 rounded-full mr-2"></div>
            <span class="text-sm text-gray-600">{{ connectionStatusText }}</span>
          </div>
          <UButton 
            @click="refreshStatus" 
            :loading="loading"
            size="sm"
            color="blue"
            variant="outline"
          >
            Refresh
          </UButton>
        </div>
      </div>

      <!-- Device Input Section -->
      <div class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Customer IP Address</label>
            <UInput 
              v-model="deviceIP" 
              placeholder="192.168.1.100"
              :disabled="loading"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
            <UInput 
              v-model="customerName" 
              placeholder="Customer Name"
              :disabled="loading"
            />
          </div>
        </div>
        
        <div class="flex space-x-2 mt-4">
          <UButton 
            @click="monitorDevice" 
            :loading="loading"
            color="green"
            :disabled="!deviceIP || !customerId"
          >
            Monitor Device
          </UButton>
          <UButton 
            @click="generateScript" 
            :loading="scriptLoading"
            color="blue"
            variant="outline"
            :disabled="!deviceIP || !customerName"
          >
            Generate Netwatch Script
          </UButton>
        </div>
      </div>

      <!-- Status Display -->
      <div v-if="deviceStatus" class="mb-6">
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <h4 class="font-medium text-gray-900">Device Status</h4>
            <span :class="statusBadgeClass" class="px-2 py-1 rounded-full text-xs font-medium">
              {{ deviceStatus.status.toUpperCase() }}
            </span>
          </div>
          
          <div class="text-sm text-gray-600 space-y-1">
            <p><strong>IP:</strong> {{ deviceStatus.ip }}</p>
            <p><strong>Last Checked:</strong> {{ formatTime(deviceStatus.last_checked) }}</p>
            <p v-if="deviceStatus.recommendation" class="mt-2">
              <strong>Recommendation:</strong> {{ deviceStatus.recommendation }}
            </p>
          </div>

          <!-- Formatted Response -->
          <div class="mt-3 p-3 bg-white rounded border">
            <code class="text-sm">{{ formattedResponse }}</code>
          </div>
        </div>
      </div>

      <!-- Netwatch Script Display -->
      <div v-if="netwatchScript" class="mb-6">
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <h4 class="font-medium text-gray-900">MikroTik Netwatch Script</h4>
            <UButton 
              @click="copyScript" 
              size="sm"
              color="gray"
              variant="outline"
            >
              Copy Script
            </UButton>
          </div>
          
          <pre class="text-xs bg-white p-3 rounded border overflow-x-auto">{{ netwatchScript }}</pre>
        </div>
      </div>

      <!-- Troubleshooting Section -->
      <div v-if="deviceStatus && deviceStatus.status === 'down'" class="mb-6">
        <div class="bg-red-50 rounded-lg p-4">
          <h4 class="font-medium text-red-900 mb-2">Troubleshooting Steps</h4>
          <ul class="text-sm text-red-800 space-y-1">
            <li>• Periksa koneksi kabel LAN/WiFi</li>
            <li>• Restart router/modem pelanggan</li>
            <li>• Periksa status listrik di lokasi pelanggan</li>
            <li>• Verifikasi konfigurasi IP address</li>
            <li>• Periksa firewall atau security settings</li>
            <li>• Hubungi teknisi untuk pengecekan fisik</li>
          </ul>
        </div>
      </div>

      <!-- Connection History -->
      <div v-if="connectionHistory.length > 0" class="mb-6">
        <h4 class="font-medium text-gray-900 mb-2">Recent Checks</h4>
        <div class="space-y-2">
          <div 
            v-for="(entry, index) in connectionHistory" 
            :key="index"
            class="flex items-center justify-between p-2 bg-gray-50 rounded"
          >
            <div class="flex items-center">
              <div :class="getStatusClass(entry.status)" class="w-2 h-2 rounded-full mr-2"></div>
              <span class="text-sm">{{ entry.ip }}</span>
            </div>
            <div class="text-xs text-gray-500">
              {{ formatTime(entry.last_checked) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-center">
          <div class="text-red-400 mr-2">⚠️</div>
          <p class="text-red-800 text-sm">{{ error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { networkMonitoringApi } from '@/api/admin/network-monitoring'
import { useAuthStore } from '@/stores/auth'

// Props
interface Props {
  customerId?: string
  initialIP?: string
}

const props = withDefaults(defineProps<Props>(), {
  customerId: '',
  initialIP: ''
})

// Reactive data
const deviceIP = ref(props.initialIP || '')
const customerName = ref('')
const deviceStatus = ref<any>(null)
const netwatchScript = ref('')
const connectionHistory = ref<any[]>([])
const loading = ref(false)
const scriptLoading = ref(false)
const error = ref('')
const connectionStatus = ref<'connected' | 'disconnected' | 'checking'>('disconnected')

// Computed properties
const connectionStatusClass = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return 'bg-green-500'
    case 'disconnected': return 'bg-red-500'
    case 'checking': return 'bg-yellow-500'
    default: return 'bg-gray-500'
  }
})

const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return 'Connected to MikroTik'
    case 'disconnected': return 'Disconnected from MikroTik'
    case 'checking': return 'Checking connection...'
    default: return 'Unknown status'
  }
})

const statusBadgeClass = computed(() => {
  if (!deviceStatus.value) return 'bg-gray-100 text-gray-800'
  return deviceStatus.value.status === 'up' 
    ? 'bg-green-100 text-green-800' 
    : 'bg-red-100 text-red-800'
})

const formattedResponse = computed(() => {
  if (!deviceStatus.value) return ''
  
  if (deviceStatus.value.status === 'up') {
    return `[UP] ${deviceStatus.value.ip} – device online`
  } else {
    return `[DOWN] ${deviceStatus.value.ip} – device offline, rekomendasi: ${deviceStatus.value.recommendation || 'Periksa koneksi'}`
  }
})

// Methods
const monitorDevice = async () => {
  if (!deviceIP.value || !props.customerId) {
    error.value = 'IP address and customer ID are required'
    return
  }

  loading.value = true
  error.value = ''
  connectionStatus.value = 'checking'

  try {
    const authStore = useAuthStore()
    const token = authStore.getToken

    const response = await networkMonitoringApi().monitorCustomerDevice(
      props.customerId,
      deviceIP.value,
      token
    )

    if (response.success) {
      deviceStatus.value = response.data
      connectionStatus.value = 'connected'
      
      // Add to history
      connectionHistory.value.unshift({
        ip: deviceStatus.value.ip,
        status: deviceStatus.value.status,
        last_checked: deviceStatus.value.last_checked
      })

      // Keep only last 10 entries
      if (connectionHistory.value.length > 10) {
        connectionHistory.value = connectionHistory.value.slice(0, 10)
      }
    } else {
      error.value = response.message || 'Failed to monitor device'
      connectionStatus.value = 'disconnected'
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred while monitoring device'
    connectionStatus.value = 'disconnected'
  } finally {
    loading.value = false
  }
}

const generateScript = async () => {
  if (!deviceIP.value || !customerName.value) {
    error.value = 'IP address and customer name are required'
    return
  }

  scriptLoading.value = true
  error.value = ''

  try {
    const authStore = useAuthStore()
    const token = authStore.getToken

    const response = await networkMonitoringApi().generateNetwatchScript(
      deviceIP.value,
      customerName.value,
      token
    )

    if (response.success) {
      netwatchScript.value = response.data.script
    } else {
      error.value = response.message || 'Failed to generate script'
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred while generating script'
  } finally {
    scriptLoading.value = false
  }
}

const copyScript = async () => {
  if (!netwatchScript.value) return

  try {
    await navigator.clipboard.writeText(netwatchScript.value)
    // You could add a toast notification here
  } catch (err) {
    console.error('Failed to copy script:', err)
  }
}

const refreshStatus = () => {
  if (deviceIP.value && props.customerId) {
    monitorDevice()
  }
}

const formatTime = (timestamp: string) => {
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

const getStatusClass = (status: string) => {
  return status === 'up' ? 'bg-green-500' : 'bg-red-500'
}

// Lifecycle
onMounted(() => {
  if (props.initialIP && props.customerId) {
    monitorDevice()
  }
})
</script>

<style scoped>
.network-monitoring-assistant {
  @apply w-full max-w-4xl mx-auto;
}

pre {
  @apply whitespace-pre-wrap;
}
</style>
