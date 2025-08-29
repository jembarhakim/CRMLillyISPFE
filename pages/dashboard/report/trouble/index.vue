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
  rows.value = (list?.data || list) as any[]
  troubleTypes.value = (types?.data || types) as any[]
  const s = (byType?.data || byType) as any[]
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
    data: seriesData.value.map(item => item.name),
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
    name: 'Ticket Count',
    type: 'bar',
    data: seriesData.value.map(item => item.value),
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
  const sortedData = [...seriesData.value].sort((a, b) => b.value - a.value)
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

const hotspots = ref<any[]>([])

// Summary statistics
const summaryStats = computed(() => {
  const total = rows.value.length
  const byType = seriesData.value.reduce((acc, item) => acc + item.value, 0)
  const avgPerType = byType > 0 ? (byType / seriesData.value.length).toFixed(1) : 0
  return { total, byType, avgPerType, typesCount: seriesData.value.length }
})

// Chart data for inline display
const byTypeModalRows = computed(() => {
  return [...seriesData.value]
    .map((r:any)=>({ type: r.type, name: r.name, count: r.value }))
    .sort((a,b)=> b.count - a.count)
})
const byTypeModalTotal = computed(()=> byTypeModalRows.value.reduce((a:any,b:any)=> a + (b.count||0), 0))

const byTypeChartData = computed(() => {
  return {
    labels: byTypeModalRows.value.map(r => r.name),
    datasets: [
      {
        label: 'Ticket Count',
        data: byTypeModalRows.value.map(r => r.count),
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
</script>

<template>
  <div class="space-y-6 text-gray-900">
    <h1 class="text-2xl font-semibold text-gray-900">Trouble Reports</h1>

    <!-- Summary Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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
               class="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

    <!-- Trouble Frequency -->
    <div class="grid grid-cols-1 gap-6">
      <div class="p-4 bg-white rounded-lg shadow border border-gray-100">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold text-gray-800">Trouble Frequency (Most to Least)</h2>
        </div>
        <p class="text-sm text-gray-600 mb-3">Realtime updates every 10s</p>
        <ECharts :option="troubleFrequencyOption" style="height:320px" />
      </div>
    </div>

    <!-- Detailed Table -->
    <div class="p-4 bg-white rounded-lg shadow border border-gray-100">
      <h2 class="mb-4 font-semibold text-gray-800">All Trouble Tickets</h2>
      <div class="table-scroll-container">
        <div class="table-scroll-content">
          <table class="min-w-full text-sm text-gray-900">
            <thead class="bg-gray-100">
              <tr class="text-left border-b border-gray-200 uppercase text-xs tracking-wide text-gray-800">
                <th class="p-2">ID</th>
                <th class="p-2">Title</th>
                <th class="p-2">Type</th>
                <th class="p-2">Status</th>
                <th class="p-2">Assignee</th>
                <th class="p-2">Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rows" :key="r.id" class="border-b border-gray-100 odd:bg-white even:bg-gray-50 hover:bg-gray-100/70">
                <td class="p-2">{{ r.id }}</td>
                <td class="p-2">{{ r.title }}</td>
                <td class="p-2 capitalize">{{ typeNameMap[r.type] || r.type }}</td>
                <td class="p-2 capitalize">
                  <span :class="{
                    'px-2 py-1 rounded-full text-xs font-medium': true,
                    'bg-red-100 text-red-800': r.status === 'unfinished',
                    'bg-yellow-100 text-yellow-800': r.status === 'ongoing',
                    'bg-green-100 text-green-800': r.status === 'finished',
                    'bg-gray-100 text-gray-800': !['unfinished', 'ongoing', 'finished'].includes(r.status)
                  }">
                    {{ r.status }}
                  </span>
                </td>
                <td class="p-2 capitalize">{{ r.current_assignee_name || r.current_assignee_role }}</td>
                <td class="p-2">{{ r.created_at?.slice?.(0,10) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="table-scroll-footer">
          <span class="scroll-hint">↔ Scroll horizontally to see more columns | ↕ Scroll vertically for more rows</span>
        </div>
      </div>
    </div>

    
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
        const data = (res.data || res) as any[]
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


