<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">🤖 SVM Machine Learning Testing</h1>
      <p class="text-gray-600">Test the SVM classifier for automatic trouble ticket classification</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- SVM Classifier Component -->
      <div>
        <SVMClassifier />
      </div>

      <!-- Testing Results -->
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
        
        <div v-if="testResults.length === 0" class="text-center text-gray-500 py-8">
          No test results yet. Try classifying some tickets above.
        </div>
        
        <div v-else class="space-y-3 max-h-96 overflow-y-auto">
          <div 
            v-for="(result, index) in testResults" 
            :key="index"
            class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
          >
            <div class="flex justify-between items-start mb-2">
              <h4 class="font-medium text-gray-900 text-sm">{{ result.title }}</h4>
              <button
                @click="removeResult(index)"
                class="text-gray-400 hover:text-red-500 text-xs"
              >
                ✕
              </button>
            </div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs text-gray-600">Predicted:</span>
              <span 
                :class="getTypeColor(result.predictedType)"
                class="px-2 py-1 text-xs font-medium rounded-full"
              >
                {{ result.predictedType?.toUpperCase() }}
              </span>
              <span class="text-xs text-gray-500">
                ({{ Math.round(result.confidence * 100) }}%)
              </span>
            </div>
            <div v-if="result.actualType" class="flex items-center gap-2">
              <span class="text-xs text-gray-600">Actual:</span>
              <span 
                :class="getTypeColor(result.actualType)"
                class="px-2 py-1 text-xs font-medium rounded-full"
              >
                {{ result.actualType?.toUpperCase() }}
              </span>
              <span 
                :class="result.predictedType === result.actualType ? 'text-green-600' : 'text-red-600'"
                class="text-xs font-medium"
              >
                {{ result.predictedType === result.actualType ? '✓ Correct' : '✗ Wrong' }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Statistics -->
        <div v-if="testResults.length > 0" class="mt-4 pt-4 border-t border-gray-200">
          <h4 class="font-medium text-gray-900 mb-2">Statistics</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600">Total Tests:</span>
              <span class="font-medium">{{ testResults.length }}</span>
            </div>
            <div>
              <span class="text-gray-600">Accuracy:</span>
              <span class="font-medium">{{ accuracy }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Test Buttons -->
    <div class="mt-6 bg-gray-50 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Test Examples</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          v-for="example in quickTestExamples"
          :key="example.title"
          @click="runQuickTest(example)"
          class="text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
        >
          <div class="font-medium text-sm text-gray-900 mb-1">{{ example.title }}</div>
          <div class="text-xs text-gray-500">Expected: {{ example.expectedType }}</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SVMClassifier from '@/components/SVMClassifier.vue'
import { ticketsApi } from '@/api/tickets'

interface TestResult {
  title: string
  predictedType: string
  confidence: number
  actualType?: string
}

const testResults = ref<TestResult[]>([])

const quickTestExamples = [
  { title: 'Internet mati total kabel di tiang putus', expectedType: 'kabel_putus' },
  { title: 'Wifi tidak jalan karena listrik padam', expectedType: 'listrik_mati' },
  { title: 'Router stuck tidak dapat alamat ip', expectedType: 'kendala_dhcp' },
  { title: 'Lampu indikator modem mati total', expectedType: 'perangkat_mati' },
  { title: 'Wifi gagal karena koneksi server bermasalah', expectedType: 'config_koneksi_server' },
  { title: 'Koneksi drop karena kebanyakan user', expectedType: 'over_user' },
  { title: 'Kabel jaringan terkelupas jadi koneksi hilang', expectedType: 'kabel_putus' },
  { title: 'Tidak ada sinyal karena listrik mati', expectedType: 'listrik_mati' },
  { title: 'DHCP gagal memberikan ip address', expectedType: 'kendala_dhcp' },
  { title: 'Overload user koneksi jadi putus putus', expectedType: 'over_user' },
  { title: 'Perangkat tidak bisa hidup lagi', expectedType: 'perangkat_mati' },
  { title: 'Config jaringan gagal', expectedType: 'config_koneksi_server' }
]

const accuracy = computed(() => {
  if (testResults.value.length === 0) return 0
  
  const correct = testResults.value.filter(result => 
    result.actualType && result.predictedType === result.actualType
  ).length
  
  return Math.round((correct / testResults.value.length) * 100)
})

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

const runQuickTest = async (example: any) => {
  try {
    const response = await ticketsApi().classifyTicket(example.title)
    const result = response.data
    
    testResults.value.unshift({
      title: example.title,
      predictedType: result.type,
      confidence: result.confidence,
      actualType: example.expectedType
    })
    
    // Keep only last 20 results
    if (testResults.value.length > 20) {
      testResults.value = testResults.value.slice(0, 20)
    }
  } catch (error) {
    console.error('Quick test error:', error)
  }
}

const removeResult = (index: number) => {
  testResults.value.splice(index, 1)
}

// Listen for classification events from SVMClassifier component
onMounted(() => {
  // This could be enhanced with event listeners if needed
})
</script>
