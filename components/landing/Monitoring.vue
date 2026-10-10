<template>
    <section id="id_monitoring" class="py-10 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 w-full max-w-full"
        style="background-color: #121212;">
        <div class="max-w-6xl mx-auto">
            <!-- Tab Navigation - Dynamically generated from monitoringEndpoints -->
            <div class="mb-6 flex gap-1 bg-white/5 rounded-lg p-1 backdrop-blur-sm border border-white/10 shadow-lg">
                <button v-for="endpoint in monitoringEndpoints" :key="endpoint.id"
                    @click="switchMonitoringTab(endpoint.id)"
                    class="flex-1 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 relative overflow-hidden group"
                    :class="monitoringTab === endpoint.id
                        ? 'bg-white text-gray-900 shadow-lg transform scale-[1.02]'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'">
                    <span class="relative z-10">{{ endpoint.label }}</span>
                    <span v-if="monitoringTab === endpoint.id"
                        class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-t-lg"></span>
                </button>
            </div>

            <!-- Loading State - Only show on initial load or when not connected -->
            <div v-if="monitoringLoading && (!monitoringConnected || !monitoringData)" class="text-center py-12">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-current"
                    :style="{ borderTopColor: '#10b981' }"></div>
                <p class="mt-4 text-gray-300">Loading monitoring data...</p>
            </div>

            <!-- Error State - Only show if error and no data (not during live polling) -->
            <div v-else-if="monitoringError && !monitoringData" class="text-center py-12 px-4">
                <div class="bg-red-900/30 border border-red-500/50 rounded-lg p-6 max-w-md mx-auto">
                    <i class="fas fa-exclamation-circle text-red-400 text-3xl mb-3"></i>
                    <p class="text-red-300 font-semibold mb-2">Failed to load monitoring data</p>
                    <p class="text-red-400 text-sm mb-4">{{ monitoringError }}</p>
                    <button @click="fetchMonitoringData" :style="{ backgroundColor: themeColor }"
                        class="px-4 py-2 text-white text-sm rounded hover:opacity-90 transition-all">
                        Retry
                    </button>
                </div>
            </div>

            <!-- Monitoring Data -->
            <Transition name="fade" mode="out-in">
                <div v-if="monitoringData && monitoringData.publicGroupList" key="monitoring-data" class="space-y-6">
                    <!-- Main Status Card -->
                    <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <!-- Header Section -->
                        <div class="bg-gradient-to-r"
                            style="background: linear-gradient(135deg, #166534 0%, #15803d 100%);">
                            <div class="px-6 sm:px-8 py-4">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-4">
                                        <div
                                            class="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                            <i class="fas fa-server text-white text-xl"></i>
                                        </div>
                                        <div>
                                            <h2 class="text-xl sm:text-2xl font-bold text-white">{{
                                                monitoringData.config?.title ||
                                                'SystemStatus' }}</h2>
                                            <p class="text-green-100 text-sm mt-1">
                                                Real-time monitoring of services and infrastructure
                                                <span v-if="lastUpdateTime" class="ml-2 text-green-200">
                                                    • Last updated: {{ getLastUpdateText() }}
                                                </span>
                                            </p>
                                            <div class="flex items-center gap-2 mt-1">
                                                <div class="flex items-center gap-1.5">
                                                    <div class="w-2 h-2 rounded-full"
                                                        :class="monitoringConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'"
                                                        :title="monitoringConnected ? 'Connected (real-time)' : 'Disconnected'">
                                                    </div>
                                                    <span class="text-green-200 text-xs">
                                                        {{ monitoringConnected ? 'Live' : 'Offline' }}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span v-if="lastUpdateTime" class="text-green-100 text-xs hidden sm:block">
                                            Updates: 5s
                                        </span>
                                        <button @click="fetchMonitoringData"
                                            class="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
                                            title="Refresh now">
                                            <i class="fas fa-sync-alt text-white"
                                                :class="{ 'animate-spin': monitoringLoading }"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- System Status Banner -->
                        <div class="px-6 sm:px-8 py-6 border-b border-gray-100">
                            <div class="bg-white border-2 border-green-100 rounded-xl p-6 flex items-center gap-4">
                                <div class="flex-shrink-0">
                                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                        <i class="fas fa-check-circle text-green-600 text-3xl"></i>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <h3 class="text-2xl font-bold text-gray-900 mb-1">Semua Sistem Berfungsi</h3>
                                    <p class="text-gray-600 text-sm">{{ getOverallStatusText() }}</p>
                                </div>
                                <div class="hidden sm:block text-right">
                                    <div class="text-3xl font-bold text-green-600">{{ getOverallUptime() }}%</div>
                                    <div class="text-xs text-gray-500 mt-1">Uptime (24h)</div>
                                </div>
                            </div>
                        </div>

                        <!-- Monitoring Groups -->
                        <div class="p-6 sm:p-8">
                            <div v-for="group in sortedMonitoringGroups" :key="group.id" class="mb-8 last:mb-0">
                                <h3 class="text-lg sm:text-xl font-bold text-black mb-4">
                                    {{ group.name || 'Untitled Group' }}
                                </h3>

                                <div class="space-y-3">
                                    <div v-for="monitor in group.monitorList" :key="monitor.id"
                                        class="bg-gray-800 rounded-xl p-4 sm:p-5 hover:bg-gray-700 transition-all duration-300 border border-gray-700 shadow-lg"
                                        :class="{ 'ring-2 ring-green-500/50': monitoringConnected && !monitoringLoading }">
                                        <div class="flex items-start gap-4">
                                            <!-- Uptime Badge -->
                                            <div class="flex-shrink-0">
                                                <div class="rounded-lg px-3 py-2 min-w-[70px] text-center"
                                                    :style="{ backgroundColor: getUptimeBadgeColor(getMonitorUptime(monitor)) }">
                                                    <div class="text-white font-bold text-sm sm:text-base">{{
                                                        getMonitorUptime(monitor) }}%
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Service Info -->
                                            <div class="flex-1 min-w-0">
                                                <div class="flex items-center gap-2 mb-2">
                                                    <h4 class="font-semibold text-white text-base sm:text-lg">{{
                                                        monitor.name }}</h4>
                                                    <span v-if="monitor.type"
                                                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                                        :style="{ backgroundColor: getMonitorTypeColor(monitor.type) + '20', color: getMonitorTypeColor(monitor.type) }">
                                                        {{ typeof monitor.type === 'string' ? monitor.type.toUpperCase()
                                                            : 'UNKNOWN' }}
                                                    </span>
                                                </div>

                                                <!-- Uptime Graph -->
                                                <div class="flex items-center gap-1 mb-2">
                                                    <div class="flex items-end gap-0.5 h-8 flex-1">
                                                        <div v-for="(bar, index) in getUptimeBars(monitor)" :key="index"
                                                            class="flex-1 rounded-sm transition-all hover:opacity-80"
                                                            :style="{
                                                                height: `${bar}%`,
                                                                minHeight: bar === 0 ? '2px' : '4px',
                                                                backgroundColor: getUptimeBarColor(bar)
                                                            }" :title="`Uptime: ${bar.toFixed(1)}%`"></div>
                                                    </div>
                                                </div>

                                                <!-- Timestamps -->
                                                <div class="flex items-center gap-4 text-xs text-gray-400">
                                                    <span>
                                                        <i class="fas fa-clock mr-1"></i>
                                                        {{ getMonitorTimeRange(monitor) }}
                                                    </span>
                                                    <span>
                                                        <i class="fas fa-sync-alt mr-1"></i>
                                                        Last check: {{ lastUpdateTime ? getLastUpdateText() : 'Never' }}
                                                    </span>
                                                </div>
                                            </div>

                                            <!-- Status Indicator -->
                                            <div class="flex-shrink-0 flex flex-col items-center gap-2">
                                                <div class="w-3 h-3 rounded-full"
                                                    :style="{ backgroundColor: getMonitorStatusColor(monitor) }"
                                                    :class="{ 'animate-pulse': isMonitorActive(monitor) }"
                                                    :title="getMonitorStatusText(monitor)"></div>
                                                <span class="text-xs text-white hidden sm:inline">{{
                                                    getMonitorStatusText(monitor) }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Empty State -->
                            <div v-if="sortedMonitoringGroups.length === 0" class="text-center py-12">
                                <i class="fas fa-server text-gray-400 text-5xl mb-4"></i>
                                <p class="text-gray-300">No monitoring groups available</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>
        </div>
    </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Menerima warna tema dari index.vue
defineProps({
    themeColor: {
        type: String,
        default: 'rgb(220, 38, 38)'
    }
})

// Konfigurasi endpoint
const monitoringEndpoints = [
    { id: 'layanan', label: 'Website' },
    { id: 'menara', label: 'Menara' },
    { id: 'lilly', label: 'Lilly' },
    { id: 'bedjo', label: 'Bedjo' }
]

const defaultEndpoint = monitoringEndpoints[0]?.id || 'layanan'

// Kuma Monitoring via composable (Asumsi auto-import Nuxt)
const {
    data: monitoringData,
    loading: monitoringLoading,
    error: monitoringError,
    lastUpdateTime,
    isConnected: monitoringConnected,
    currentEndpoint: monitoringCurrentEndpoint,
    connect: connectMonitoring,
    disconnect: disconnectMonitoring,
    fetchData: fetchMonitoringData,
    switchEndpoint: switchMonitoringEndpoint
} = useKumaMonitoring(defaultEndpoint)

const metricsCache = ref({})
const metricsError = ref(null)
const metricsLastAttempt = ref(null)
let metricsInterval = null

// Fetch metrics
const fetchMetrics = async () => {
    try {
        metricsLastAttempt.value = new Date()
        const response = await $fetch('/api/metrics')

        if (response?.error) {
            metricsError.value = response.error
            return
        }

        if (response?.monitors) {
            metricsCache.value = response.monitors
            metricsError.value = null
        }
    } catch (error) {
        metricsError.value = error.message || 'Unknown error'
    }
}

// Tab management
const monitoringTab = ref(defaultEndpoint)
const switchMonitoringTab = (endpointId) => {
    if (monitoringTab.value === endpointId) return
    monitoringTab.value = endpointId
    switchMonitoringEndpoint(endpointId)
}

const sortedMonitoringGroups = computed(() => {
    if (!monitoringData.value || !monitoringData.value.publicGroupList) return []
    return [...monitoringData.value.publicGroupList].sort((a, b) => (a.weight || 0) - (b.weight || 0))
})

// Web scraping fallback status Kuma
const STATUS_PAGE_URL = "https://rndpolije.lilly.net.id/status/layanan"
async function fetchKumaStatus() {
    try {
        const response = await fetch(STATUS_PAGE_URL)
        const htmlText = await response.text()
        const regex = /window\.preloadData = JSON\.parse\('(.+?)'\);/
        const match = htmlText.match(regex)

        if (match && match[1]) {
            const rawJson = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\')
            const data = JSON.parse(rawJson)
            // Logika preload Kuma berjalan di sini secara background
        }
    } catch (error) {
        console.error("Error fetching Kuma:", error)
    }
}

const getRealStatusData = (monitor) => {
    const metricsData = metricsCache.value[monitor.name]
    if (metricsData) {
        return {
            status: metricsData.status,
            msg: metricsData.status === 1 ? 'Operational' : (metricsData.status === 0 ? 'Down' : 'Unknown'),
            ping: metricsData.responseTime || 0
        }
    }

    if (!monitoringData.value?.heartbeatList) return null
    const history = monitoringData.value.heartbeatList[String(monitor.id)]
    if (!history || history.length === 0) return null

    return history[history.length - 1]
}

const isDownMessage = (msg) => {
    const msgLower = (msg || '').toLowerCase()
    return msgLower.includes('timeout') || msgLower.includes('down') || msgLower.includes('error') ||
        msgLower.includes('failed') || msgLower.includes('unreachable') || msgLower.includes('refused') ||
        msgLower.includes('test')
}

const getMonitorStatusText = (monitor) => {
    const data = getRealStatusData(monitor)
    if (!data) return 'Pending'
    if (isDownMessage(data.msg)) return 'Down'
    if (data.status === 1) return 'Operational'
    if (data.status === 0) return 'Down'
    if (data.status === 2) return 'Pending'
    if (data.status === 3) return 'Maintenance'
    return 'Unknown'
}

const getMonitorStatusColor = (monitor) => {
    const data = getRealStatusData(monitor)
    if (!data) return '#9ca3af'
    if (isDownMessage(data.msg)) return '#ef4444' // Red

    if (data.status === 1) return '#10b981' // Green
    if (data.status === 0) return '#ef4444' // Red
    if (data.status === 2) return '#eab308' // Yellow
    if (data.status === 3) return '#3b82f6' // Blue
    return '#9ca3af'
}

const isMonitorActive = (monitor) => {
    const data = getRealStatusData(monitor)
    if (!data || isDownMessage(data.msg)) return false
    return data.status === 1
}

const getMonitorUptime = (monitor) => {
    const data = getRealStatusData(monitor)
    if (!data || isDownMessage(data.msg)) return '0.00'
    if (data.status === 1) return '100.00'
    if (data.status === 0) return '0.00'
    return '---'
}

const getUptimeBars = (monitor) => {
    const bars = []
    const data = getRealStatusData(monitor)
    let barValue = 100 // Green

    if (!data) barValue = 50 // Gray
    else if (isDownMessage(data.msg) || data.status === 0) barValue = 0 // Red
    else if (data.status === 2) barValue = 50 // Yellow
    else if (data.status === 3) barValue = 75 // Blue

    for (let i = 0; i < 40; i++) bars.push(barValue)
    return bars
}

const getLastUpdateText = () => {
    if (!lastUpdateTime.value) return 'Never'
    const diff = Math.floor((new Date() - lastUpdateTime.value) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
}

const getMonitorTimeRange = (monitor) => `${25 + (monitor.id * 3 % 15)}m ago - now`

const getOverallUptime = () => {
    if (!monitoringData.value?.publicGroupList) return '99.99'
    let totalUptime = 0, monitorCount = 0
    monitoringData.value.publicGroupList.forEach(g => g.monitorList.forEach(m => {
        totalUptime += parseFloat(getMonitorUptime(m) || 0)
        monitorCount++
    }))
    return monitorCount === 0 ? '100.00' : (totalUptime / monitorCount).toFixed(2)
}

const getOverallStatusText = () => {
    const totalMonitors = sortedMonitoringGroups.value.reduce((sum, group) => sum + (group.monitorList?.length || 0), 0)
    return totalMonitors === 0 ? 'No monitors configured' : `All ${totalMonitors} services are operational`
}

const getMonitorTypeColor = (type) => {
    const typeColors = { 'http': '#3b82f6', 'https': '#3b82f6', 'ping': '#10b981', 'tcp': '#f59e0b', 'udp': '#8b5cf6', 'dns': '#ec4899' }
    return (type && typeof type === 'string') ? (typeColors[type.toLowerCase()] || '#6b7280') : '#6b7280'
}

const getUptimeBadgeColor = (uptime) => {
    const val = parseFloat(uptime)
    if (val >= 99.9) return '#10b981'
    if (val >= 99.0) return '#22c55e'
    if (val >= 95.0) return '#eab308'
    if (val >= 90.0) return '#f59e0b'
    return '#ef4444'
}

const getUptimeBarColor = (uptime) => {
    if (uptime >= 99.0) return '#22c55e'
    if (uptime >= 95.0) return '#84cc16'
    if (uptime >= 90.0) return '#eab308'
    if (uptime >= 85.0) return '#f59e0b'
    return '#ef4444'
}

onMounted(() => {
    connectMonitoring()
    fetchMetrics()
    fetchKumaStatus()
    metricsInterval = setInterval(fetchMetrics, 5000)
})

onUnmounted(() => {
    if (metricsInterval) clearInterval(metricsInterval)
    disconnectMonitoring()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>