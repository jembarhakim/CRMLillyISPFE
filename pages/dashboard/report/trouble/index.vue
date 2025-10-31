<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { ticketsApi } from '@/api/tickets'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

// Set page title
useHead({
  title: 'Trouble Report - CRM System'
})

const rows = ref<any[]>([])
const seriesData = ref<any[]>([])
const loading = ref(true)
const troubleTypes = ref<any[]>([])
const selectedTimeFilter = ref('current_month') // Default to current month

const timeFilterOptions = [
  { value: 'current_month', label: '1 Bulan Ini' },
  { value: 'last_month', label: 'Bulan Lalu' },
  { value: 'this_year', label: 'Tahun Ini' },
]

const typeNameMap = computed(() => {
  const map: Record<string, string> = {}
  for (const t of troubleTypes.value) map[t.id] = t.name || t.id
  return map
})

let pollTimer: any = null

// Helper functions for date filtering
function getDateRange(filter: string) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  switch (filter) {
    case 'current_month':
      const startOfMonth = new Date(currentYear, currentMonth, 1)
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0)
      return {
        start: startOfMonth.toISOString().split('T')[0],
        end: endOfMonth.toISOString().split('T')[0]
      }
    case 'last_month':
      const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1)
      const endOfLastMonth = new Date(currentYear, currentMonth, 0)
      return {
        start: startOfLastMonth.toISOString().split('T')[0],
        end: endOfLastMonth.toISOString().split('T')[0]
      }
    case 'this_year':
      const startOfYear = new Date(currentYear, 0, 1)
      const endOfYear = new Date(currentYear, 11, 31)
      return {
        start: startOfYear.toISOString().split('T')[0],
        end: endOfYear.toISOString().split('T')[0]
      }
    default:
      return { start: '', end: '' }
  }
}

async function fetchSnapshot() {
  const dateRange = getDateRange(selectedTimeFilter.value)
  const [list, byType, types] = await Promise.all([
    ticketsApi().list() as any,
    ticketsApi().byType(dateRange.start, dateRange.end) as any,
    ticketsApi().troubleTypes() as any,
  ])
  rows.value = Array.isArray(list?.data || list) ? (list?.data || list) as any[] : []
  troubleTypes.value = Array.isArray(types?.data || types) ? (types?.data || types) as any[] : []
  const s = Array.isArray(byType?.data || byType) ? (byType?.data || byType) as any[] : []
  seriesData.value = s.map((r:any) => {
    const typeName = typeNameMap.value[r.type] || r.type || 'Unknown'
    return {
      name: typeName,
      value: r.count,
      type: r.type
    }
  })
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(fetchSnapshot, 10000) // 10s realtime-ish refresh
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = null
}

onMounted(async () => {
  await fetchSnapshot()
  loading.value = false
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})

// Watch for time filter changes and refetch data
watch(selectedTimeFilter, () => {
  fetchSnapshot()
})

// Keep a simple bar chart for "Tickets by Type" (still useful)
// Aggregate accumulation per trouble type from current rows snapshot
const accumulationByType = computed(() => {
  const totals: Record<string, number> = {}
  const list = Array.isArray(rows.value) ? rows.value : []

  for (const t of list) {
    const rawType = (t.type || t.type_name || 'unknown') as string
    const key = rawType
    // Coerce accumulation to number to handle string values like "2"
    const rawAcc = (t as any).accumulation
    const parsed = typeof rawAcc === 'number' ? rawAcc : Number(rawAcc)
    const acc = Number.isFinite(parsed) && parsed > 0 ? parsed : 1
    totals[key] = (totals[key] || 0) + acc
  }

  // Map to display objects with human-friendly names
  return Object.entries(totals).map(([type, total]) => ({
    type,
    name: typeNameMap.value[type] || type,
    value: total,
  }))
})

const barOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: Array.isArray(accumulationByType.value) ? accumulationByType.value.map(item => item.name) : [],
    axisLabel: {
      rotate: 45,
      color: '#374151'
    }
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#374151' }
  },
  series: [{
    name: 'Customers Affected',
    type: 'bar',
    data: Array.isArray(accumulationByType.value) ? accumulationByType.value.map(item => item.value) : [],
    itemStyle: {
      color: function(params: any) {
        const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']
        return colors[params.dataIndex % colors.length]
      }
    },
    label: {
      show: true,
      position: 'top',
      color: '#374151'
    }
  }]
}))

// Trouble frequency chart (most to least frequent) — realtime via polling
const troubleFrequencyOption = computed(() => {
  const safeSeries = Array.isArray(seriesData.value) ? seriesData.value : []
  const sortedData = [...safeSeries].sort((a, b) => b.value - a.value)
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function(params: any) {
        const data = params[0]
        return `${data.name}<br/>Frequency: ${data.value} tickets<br/>Rank: #${data.dataIndex + 1}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: sortedData.map(item => item.name),
      axisLabel: {
        rotate: 45,
        color: '#374151',
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#374151' },
      name: 'Ticket Count',
      nameTextStyle: { color: '#374151' }
    },
    series: [{
      name: 'Trouble Frequency',
      type: 'bar',
      data: sortedData.map((item, index) => ({
        value: item.value,
        itemStyle: {
          color: index === 0 ? '#EF4444' : index === 1 ? '#F59E0B' : index === 2 ? '#10B981' : '#3B82F6'
        }
      })),
      label: {
        show: true,
        position: 'top',
        color: '#374151',
        formatter: function(params: any) {
          return `${params.value}\n#${params.dataIndex + 1}`
        }
      }
    }]
  }
})

// Accumulation analysis chart
const accumulationOption = computed(() => {
  // Group tickets by accumulation ranges - Enhanced for massive scale outages
  const ranges = [
    { name: 'Single Customer', min: 1, max: 1, color: '#3B82F6' },
    { name: '2-5 Customers', min: 2, max: 5, color: '#F59E0B' },
    { name: '6-10 Customers', min: 6, max: 10, color: '#EF4444' },
    { name: '11-50 Customers', min: 11, max: 50, color: '#DC2626' },
    { name: '51-100 Customers', min: 51, max: 100, color: '#991B1B' },
    { name: '101-500 Customers', min: 101, max: 500, color: '#7F1D1D' },
    { name: '500+ Customers', min: 501, max: Infinity, color: '#450A0A' }
  ]
  
  const data = ranges.map(range => {
    const safeRows = Array.isArray(rows.value) ? rows.value : []
    const count = safeRows.filter(ticket => {
      const accumulation = ticket.accumulation || 1
      return accumulation >= range.min && accumulation <= range.max
    }).length
    
    return {
      name: range.name,
      value: count,
      itemStyle: { color: range.color }
    }
  })
  
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: data.map(item => item.name)
    },
    series: [{
      name: 'Accumulation Distribution',
      type: 'pie',
      radius: '50%',
      data: data,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
})

const hotspots = ref<any[]>([])

// Summary statistics
const summaryStats = computed(() => {
  const safeRows = Array.isArray(rows.value) ? rows.value : []
  const safeSeries = Array.isArray(seriesData.value) ? seriesData.value : []
  const total = safeRows.length
  const byType = safeSeries.reduce((acc, item) => acc + item.value, 0)
  const avgPerType = byType > 0 && safeSeries.length > 0 ? (byType / safeSeries.length).toFixed(1) : 0
  
  // Accumulation statistics (reuse safeRows from above)
  const totalCustomersAffected = safeRows.reduce((acc, ticket) => acc + (ticket.accumulation || 1), 0)
  const highAccumulationTickets = safeRows.filter(ticket => (ticket.accumulation || 1) > 1).length
  const maxAccumulation = safeRows.length > 0 ? Math.max(...safeRows.map(ticket => ticket.accumulation || 1), 0) : 0
  
  return { 
    total, 
    byType, 
    avgPerType, 
    typesCount: seriesData.value.length,
    totalCustomersAffected,
    highAccumulationTickets,
    maxAccumulation
  }
})

// Chart data for inline display
const byTypeModalRows = computed(() => {
  const safeAccum = Array.isArray(accumulationByType.value) ? accumulationByType.value : []
  return [...safeAccum]
    .map((r:any)=>({ type: r.type, name: r.name, count: r.value }))
    .sort((a,b)=> b.count - a.count)
})
const byTypeModalTotal = computed(() => {
  const safeModalRows = Array.isArray(byTypeModalRows.value) ? byTypeModalRows.value : []
  return safeModalRows.reduce((a:any,b:any)=> a + (b.count||0), 0)
})

const byTypeChartData = computed(() => {
  const safeModalRows = Array.isArray(byTypeModalRows.value) ? byTypeModalRows.value : []
  return {
    labels: safeModalRows.map(r => r.name),
    datasets: [
      {
        label: 'Customers Affected',
        data: safeModalRows.map(r => r.count),
        backgroundColor: '#4F46E5', // biru indigo
      },
    ],
  }
})

const byTypeChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
}

// Fetch hotspots data
onMounted(async () => {
  const res:any = await ticketsApi().hotspots()
  hotspots.value = res.data || res
})

// Auto-detection function
// Format accumulation numbers for display
function formatAccumulation(accumulation: number): string {
  if (accumulation === 1) {
    return '1 customer'
  } else if (accumulation < 1000) {
    return `${accumulation} customers`
  } else if (accumulation < 1000000) {
    return `${(accumulation / 1000).toFixed(1)}K customers`
  } else {
    return `${(accumulation / 1000000).toFixed(1)}M customers`
  }
}

async function triggerAutoDetection() {
  loading.value = true
  try {
    await ticketsApi().autoDetectAndGroup()
    // Refresh data after auto-detection
    await fetchSnapshot()
    alert('Auto-detection completed successfully!')
  } catch (error: any) {
    console.error('Auto-detection failed:', error)
    alert('Auto-detection failed: ' + (error.message || 'Unknown error'))
  } finally {
    loading.value = false
  }
}

const accumulationEditModal = ref(false)
const accumulationEditState = ref({
  ticket: null as any,
  value: '',
  error: ''
});
function openAccumulationModal(ticket:any) {
  accumulationEditState.value = {
    ticket,
    value: String(ticket.accumulation || 1),
    error: ''
  }
  accumulationEditModal.value = true;
}
function confirmAccumulationEdit() {
  const val = parseInt(accumulationEditState.value.value)
  if (isNaN(val) || val < 1) {
    accumulationEditState.value.error = 'Please enter a valid number greater than 0';
    return;
  }
  accumulationEditState.value.error = '';
  doUpdateAccumulation(accumulationEditState.value.ticket, val);
}
async function doUpdateAccumulation(ticket:any, accumulation:number) {
  loading.value = true
  try {
    await ticketsApi().updateAccumulation([ticket.id], accumulation)
    accumulationEditModal.value = false
    await fetchSnapshot()
  } catch (error:any) {
    accumulationEditState.value.error = error?.message || 'Failed to update accumulation.'
  } finally {
    loading.value = false
  }
}

// Send ticket to Customer Service
async function sendToCS(ticket: any) {
  const note = prompt(`Send ticket #${ticket.id} to Customer Service:\n"${ticket.title}"\n\nEnter note (optional):`)
  
  if (note !== null) {
    try {
      await ticketsApi().sendToCS(ticket.id, note || '')
      alert('Ticket sent to Customer Service successfully!')
      // Refresh data
      await fetchSnapshot()
    } catch (error: any) {
      console.error('Failed to send to CS:', error)
      alert('Failed to send to CS: ' + (error.message || 'Unknown error'))
    }
  }
}
</script>

<template>
  <div class="space-y-6 text-gray-900 pt-4">
    <h1 class="text-2xl font-semibold text-gray-900">Trouble Reports</h1>

    <!-- Action Buttons -->
    <div class="flex justify-between items-center">
      <div class="flex gap-2">
        <!-- <button 
          @click="triggerAutoDetection"
          :disabled="loading"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Processing...' : 'Auto-Detect Groups' }}
        </button> -->
        <button 
          @click="fetchSnapshot"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Refresh Data
        </button>
      </div>
    </div>

    <!-- Summary Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div class="text-blue-600 text-sm font-medium">Total Tickets</div>
        <div class="text-2xl font-bold text-blue-900">{{ summaryStats.total }}</div>
      </div>
      <div class="p-4 bg-green-50 rounded-lg border border-green-200">
        <div class="text-green-600 text-sm font-medium">Types Covered</div>
        <div class="text-2xl font-bold text-green-900">{{ summaryStats.typesCount }}</div>
      </div>
      <div class="p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div class="text-purple-600 text-sm font-medium">Total by Type</div>
        <div class="text-2xl font-bold text-purple-900">{{ summaryStats.byType }}</div>
      </div>
      <div class="p-4 bg-orange-50 rounded-lg border border-orange-200">
        <div class="text-orange-600 text-sm font-medium">Avg per Type</div>
        <div class="text-2xl font-bold text-orange-900">{{ summaryStats.avgPerType }}</div>
      </div>
      <div class="p-4 bg-red-50 rounded-lg border border-red-200">
        <div class="text-red-600 text-sm font-medium">Customers Affected</div>
        <div class="text-2xl font-bold text-red-900">{{ summaryStats.totalCustomersAffected }}</div>
      </div>
      <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div class="text-yellow-600 text-sm font-medium">High Accumulation</div>
        <div class="text-2xl font-bold text-yellow-900">{{ summaryStats.highAccumulationTickets }}</div>
        <div class="text-xs text-yellow-700">Max: {{ summaryStats.maxAccumulation }}</div>
      </div>
    </div>

    <!-- Emergency Alert for Massive Outages -->
    <div v-if="summaryStats.maxAccumulation > 100" class="bg-gradient-to-r from-red-600 to-red-800 text-white p-6 rounded-lg border-4 border-red-300 shadow-lg mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="text-4xl">🚨</div>
          <div>
            <h3 class="text-xl font-bold">CRITICAL OUTAGE DETECTED</h3>
            <p class="text-red-100">Maximum accumulation: {{ formatAccumulation(summaryStats.maxAccumulation) }}</p>
            <p class="text-sm text-red-200">This appears to be a datacenter or server-level issue affecting multiple customers.</p>
          </div>
        </div>
        <div class="text-right">
          <button class="bg-white text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-50 transition-colors">
            EMERGENCY RESPONSE
          </button>
        </div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <!-- Bar Chart -->
       <div class="p-4 bg-white rounded-lg shadow border border-gray-100">
         <div class="flex items-center justify-between mb-3">
           <h2 class="font-semibold text-gray-800">Tickets by Type (Bar Chart)</h2>
           <!-- Time Filter Dropdown -->
           <div class="flex items-center gap-2">
             <label class="text-sm font-medium text-gray-700">Filter Waktu:</label>
             <select 
               v-model="selectedTimeFilter" 
               class="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
               @change="fetchSnapshot"
             >
               <option v-for="option in timeFilterOptions" :key="option.value" :value="option.value">
                 {{ option.label }}
               </option>
             </select>
           </div>
         </div>
         <ECharts :option="barOption" style="height:320px" />
         <!-- Chart instead of table -->
         <div class="mt-4">
           <Bar :data="byTypeChartData" :options="byTypeChartOptions" style="height: 200px;" />
         </div>
       </div>
      
      <!-- Hot Locations Map -->
      <div class="p-4 bg-white rounded-lg shadow border border-gray-100">
        <h2 class="mb-3 font-semibold text-gray-800">Hot Locations</h2>
        <div id="map" class="w-full h-80 rounded border"></div>
      </div>
    </div>

    <!-- Trouble Frequency and Accumulation -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="p-4 bg-white rounded-lg shadow border border-gray-100">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold text-gray-800">Trouble Frequency (Most to Least)</h2>
        </div>
        <p class="text-sm text-gray-600 mb-3">Realtime updates every 10s</p>
        <ECharts :option="troubleFrequencyOption" style="height:320px" />
      </div>
      
      <div class="p-4 bg-white rounded-lg shadow border border-gray-100">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold text-gray-800">Accumulation Analysis</h2>
        </div>
        <p class="text-sm text-gray-600 mb-3">Customers affected by similar problems</p>
        <ECharts :option="accumulationOption" style="height:320px" />
      </div>
    </div>

    <!-- Responsive Trouble Tickets Display -->
    <div class="bg-white rounded-lg shadow border border-gray-100 p-4">
      <h2 class="mb-4 font-semibold text-gray-800">All Trouble Tickets</h2>
      
      <!-- Desktop Table View -->
      <div class="hidden md:block">
        <div class="table-scroll-container">
          <div class="table-scroll-content">
            <table class="min-w-full text-sm text-gray-900">
              <thead class="bg-gray-100">
                <tr class="text-left border-b border-gray-200 uppercase text-xs tracking-wide text-gray-800">
                  <th class="p-2">ID</th>
                  <th class="p-2">Title</th>
                  <th class="p-2">Type</th>
                  <th class="p-2">Status</th>
                  <th class="p-2">Accumulation</th>
                  <th class="p-2">Assignee</th>
                  <th class="p-2">Created</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in rows" :key="r.id" class="border-b border-gray-100 odd:bg-white even:bg-gray-50 hover:bg-gray-100/70">
                  <td class="p-2">{{ r.id }}</td>
                  <td class="p-2">{{ r.title }}</td>
                  <td class="p-2 capitalize">{{ typeNameMap[r.type] || r.type }}</td>
                  <td class="p-2">
                    <span v-if="r.status === 'finished'"
                      class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-bold bg-green-600 text-white shadow-lg border-2 border-green-700">
                      ✅ Finished
                    </span>
                    <span v-else-if="r.status === 'ongoing'"
                      class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-bold bg-orange-600 text-white shadow-lg border-2 border-orange-700 animate-pulse">
                      🔄 Ongoing
                    </span>
                    <span v-else
                      class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-bold bg-red-600 text-white shadow-lg border-2 border-red-700 animate-pulse">
                      ⚠️ Unfinished
                    </span>
                  </td>
                  <td class="p-2">
                    <div class="flex items-center space-x-2">
                      <span :class="{
                        'px-2 py-1 rounded-full text-xs font-medium': true,
                        'bg-blue-100 text-blue-800': r.accumulation === 1,
                        'bg-orange-100 text-orange-800': r.accumulation > 1 && r.accumulation <= 5,
                        'bg-red-100 text-red-800': r.accumulation > 5 && r.accumulation <= 50,
                        'bg-red-200 text-red-900': r.accumulation > 50 && r.accumulation <= 100,
                        'bg-red-300 text-red-950': r.accumulation > 100 && r.accumulation <= 500,
                        'bg-red-400 text-white font-bold': r.accumulation > 500
                      }">
                        {{ formatAccumulation(r.accumulation || 1) }}
                      </span>
                      <button 
                        @click="openAccumulationModal(r)"
                        class="text-blue-600 hover:text-blue-800 text-xs underline"
                        title="Edit accumulation"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                  <td class="p-2 capitalize">{{ r.current_assignee_name || r.current_assignee_role }}</td>
                  <td class="p-2">{{ r.created_at?.slice?.(0,10) }}</td>
                  <!-- <td class="p-2">
                    <button 
                      @click="sendToCS(r)"
                      class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                      title="Send to Customer Service"
                    >
                      To CS
                    </button>
                  </td> -->
                </tr>
              </tbody>
            </table>
          </div>
          <div class="table-scroll-footer">
            <span class="scroll-hint">↔ Scroll horizontally to see more columns | ↕ Scroll vertically for more rows</span>
          </div>
        </div>
      </div>

      <!-- Mobile Card View -->
      <div class="md:hidden space-y-3">
        <template v-for="r in rows" :key="r.id">
          <div class="bg-white rounded-lg shadow border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <!-- Card Header -->
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-lg font-bold text-gray-900">#{{ r.id }}</span>
                  <span v-if="r.status === 'finished'"
                    class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-bold bg-green-600 text-white shadow-lg border-2 border-green-700">
                    ✅ Finished
                  </span>
                  <span v-else-if="r.status === 'ongoing'"
                    class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-bold bg-orange-600 text-white shadow-lg border-2 border-orange-700 animate-pulse">
                    🔄 Ongoing
                  </span>
                  <span v-else
                    class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-bold bg-red-600 text-white shadow-lg border-2 border-red-700 animate-pulse">
                    ⚠️ Unfinished
                  </span>
                </div>
                <h3 class="font-semibold text-gray-900 text-base leading-tight">{{ r.title }}</h3>
              </div>
            </div>

            <!-- Card Content -->
            <div class="space-y-3">
              <!-- Type and Assignee -->
              <div class="flex flex-wrap gap-2 text-xs">
                <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  Type: {{ typeNameMap[r.type] || r.type || 'Unknown' }}
                </span>
                <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  Assignee: {{ r.current_assignee_name || r.current_assignee_role || 'Unassigned' }}
                </span>
                <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  Created: {{ r.created_at?.slice?.(0,10) }}
                </span>
              </div>

              <!-- Accumulation -->
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">Accumulation:</span>
                <div class="flex items-center space-x-2">
                  <span :class="{
                    'px-2 py-1 rounded-full text-xs font-medium': true,
                    'bg-blue-100 text-blue-800': r.accumulation === 1,
                    'bg-orange-100 text-orange-800': r.accumulation > 1 && r.accumulation <= 5,
                    'bg-red-100 text-red-800': r.accumulation > 5 && r.accumulation <= 50,
                    'bg-red-200 text-red-900': r.accumulation > 50 && r.accumulation <= 100,
                    'bg-red-300 text-red-950': r.accumulation > 100 && r.accumulation <= 500,
                    'bg-red-400 text-white font-bold': r.accumulation > 500
                  }">
                    {{ formatAccumulation(r.accumulation || 1) }}
                  </span>
                  <button 
                    @click="openAccumulationModal(r)"
                    class="text-blue-600 hover:text-blue-800 text-xs underline"
                    title="Edit accumulation"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="pt-3 border-t border-gray-100">
                <button 
                  @click="sendToCS(r)"
                  class="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  title="Send to Customer Service"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                  Send to CS
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- Empty State -->
        <div v-if="rows.length === 0" class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
            </path>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No tickets found</h3>
          <p class="mt-1 text-sm text-gray-500">No trouble tickets match the current filters.</p>
        </div>
      </div>
    </div>

    <UModal v-model="accumulationEditModal" :ui="{width:'sm:max-w-lg w-full'}">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">Edit Accumulation</h3>
            <UButton icon="x" size="sm" @click="accumulationEditModal = false" variant="ghost"/>
          </div>
        </template>
        <div>
          <p>Edit accumulation for ticket #{{accumulationEditState.ticket?.id}}<br>
          <span class="text-sm text-gray-500 font-mono">"{{accumulationEditState.ticket?.title}}"</span></p>
          <div class="mt-2 text-sm text-gray-700">Current: <b>{{accumulationEditState.ticket?.accumulation||1}}</b> customers</div>
          <div class="mt-4">
            <label class="text-sm">Enter new accumulation:</label>
            <UInput v-model="accumulationEditState.value" type="number" min="1" class="w-full mt-1" @keyup.enter="confirmAccumulationEdit" autofocus />
            <div v-if="accumulationEditState.error" class="mt-1 text-red-600 text-xs">{{accumulationEditState.error}}</div>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2 mt-4">
            <UButton color="gray" @click="accumulationEditModal=false">Cancel</UButton>
            <UButton color="blue" :loading="loading" @click="confirmAccumulationEdit">Save</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
    
  </div>
</template>

<script lang="ts">
// Leaflet map attach using client-only hydration
export default {
  mounted() {
    if (process.client) {
      // defer import to client
      import('leaflet').then(async (Lmod:any)=>{
        const L = Lmod.default || Lmod
        const map = L.map('map').setView([-6.2,106.8], 11)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(map)
        const res = await (ticketsApi() as any).hotspots()
        const data = Array.isArray(res.data || res) ? (res.data || res) as any[] : []
        data.forEach((p:any)=>{
          if (p.gps_lat && p.gps_lng) {
            L.circleMarker([p.gps_lat, p.gps_lng], { radius: 4 + Math.min(p.count, 12), color:'#ef4444'}).addTo(map)
          }
        })
      })
    }
  }
}
</script>

<style scoped>
#map{ min-height: 20rem; }
</style>


