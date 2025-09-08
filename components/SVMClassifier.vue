<template>
  <div class="bg-white border border-gray-200 rounded-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">🤖 SVM Trouble Ticket Classifier</h3>
    
    <div class="space-y-4">
      <!-- Input Section -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Enter Trouble Ticket Title
        </label>
        <div class="flex gap-2">
          <UInput
            v-model="ticketTitle"
            placeholder="e.g., Internet sangat lambat, WiFi tidak connect, Router mati"
            class="flex-1"
            @keyup.enter="classifyTicket"
          />
          <UButton
            @click="classifyTicket"
            :loading="isClassifying"
            :disabled="!ticketTitle.trim()"
            color="blue"
          >
            Classify
          </UButton>
        </div>
      </div>

      <!-- Classification Result -->
      <div v-if="classificationResult" class="bg-gray-50 rounded-lg p-4">
        <h4 class="font-medium text-gray-900 mb-2">Classification Result:</h4>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-600">Type:</span>
            <span 
              :class="getTypeColor(classificationResult.type)"
              class="px-2 py-1 text-xs font-medium rounded-full"
            >
              {{ classificationResult.type?.toUpperCase() }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-600">Confidence:</span>
            <div class="flex items-center gap-2">
              <div class="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  :class="getConfidenceColor(classificationResult.confidence)"
                  class="h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${classificationResult.confidence * 100}%` }"
                ></div>
              </div>
              <span class="text-sm text-gray-600">
                {{ Math.round(classificationResult.confidence * 100) }}%
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-600">Description:</span>
            <span class="text-sm text-gray-700">{{ classificationResult.description }}</span>
          </div>
        </div>
      </div>

      <!-- Example Titles -->
      <div class="bg-blue-50 rounded-lg p-4">
        <h4 class="font-medium text-blue-900 mb-2">💡 Try these examples:</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            v-for="example in exampleTitles"
            :key="example"
            @click="ticketTitle = example; classifyTicket()"
            class="text-left text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-100 p-2 rounded transition-colors"
          >
            "{{ example }}"
          </button>
        </div>
      </div>

      <!-- ML Stats -->
      <div v-if="mlStats" class="bg-green-50 rounded-lg p-4">
        <h4 class="font-medium text-green-900 mb-2">📊 ML Statistics:</h4>
        <div class="text-sm text-green-700">
          <p>Supported Types: {{ mlStats.supported_types }}</p>
          <p>Available Types: {{ mlStats.types?.join(', ') }}</p>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ticketsApi } from '@/api/tickets'

const ticketTitle = ref('')
const classificationResult = ref<any>(null)
const mlStats = ref<any>(null)
const isClassifying = ref(false)
const error = ref('')

const exampleTitles = [
  'Internet mati total kabel di tiang putus',
  'Wifi tidak jalan karena listrik padam',
  'Router stuck tidak dapat alamat ip',
  'Lampu indikator modem mati total',
  'Wifi gagal karena koneksi server bermasalah',
  'Koneksi drop karena kebanyakan user',
  'Kabel jaringan terkelupas jadi koneksi hilang',
  'Tidak ada sinyal karena listrik mati',
  'DHCP gagal memberikan ip address',
  'Overload user koneksi jadi putus putus'
]

const getTypeColor = (type: string) => {
  const colors = {
    kabel_putus: 'bg-red-100 text-red-800',
    listrik_mati: 'bg-yellow-100 text-yellow-800',
    kendala_dhcp: 'bg-blue-100 text-blue-800',
    perangkat_mati: 'bg-gray-100 text-gray-800',
    config_koneksi_server: 'bg-purple-100 text-purple-800',
    over_user: 'bg-orange-100 text-orange-800',
    wifi: 'bg-blue-100 text-blue-800',
    internet: 'bg-green-100 text-green-800',
    hardware: 'bg-orange-100 text-orange-800',
    power: 'bg-red-100 text-red-800',
    software: 'bg-purple-100 text-purple-800',
    other: 'bg-gray-100 text-gray-800'
  }
  return colors[type as keyof typeof colors] || colors.other
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'bg-green-500'
  if (confidence >= 0.6) return 'bg-yellow-500'
  return 'bg-red-500'
}

const classifyTicket = async () => {
  if (!ticketTitle.value.trim()) return
  
  try {
    isClassifying.value = true
    error.value = ''
    
    const response = await ticketsApi().classifyTicket(ticketTitle.value.trim())
    classificationResult.value = response.data
    
    // Load ML stats if not already loaded
    if (!mlStats.value) {
      await loadMLStats()
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to classify ticket'
    console.error('Classification error:', err)
  } finally {
    isClassifying.value = false
  }
}

const loadMLStats = async () => {
  try {
    const response = await ticketsApi().getMLStats()
    mlStats.value = response.data
  } catch (err) {
    console.error('Failed to load ML stats:', err)
  }
}

// Load ML stats on component mount
onMounted(() => {
  loadMLStats()
})
</script>
