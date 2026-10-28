<template>
    <section id="id_monitoring" class="py-16 md:py-24 px-4 sm:px-6 md:px-8 w-full max-w-full relative z-20"
        style="background-color: #121212;">
        <div class="max-w-6xl mx-auto">

            <!-- Header Section -->
            <div class="text-center mb-10">
                <span
                    class="inline-block py-1.5 px-4 rounded-full bg-green-500/10 text-green-400 font-bold text-xs sm:text-sm mb-4 border border-green-500/20">
                    NETWORK TRANSPARENCY
                </span>
                <h2 class="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                    Status Layanan & Server
                </h2>
                <p class="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
                    Pantau kinerja jaringan kami secara real-time. Kami berkomitmen memberikan kualitas koneksi terbaik.
                </p>
            </div>

            <!-- Tab Navigation -->
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

            <!-- Loading State -->
            <div v-if="monitoringLoading && (!monitoringConnected || !monitoringData)" class="text-center py-12">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-current"
                    :style="{ borderTopColor: '#10b981' }"></div>
                <p class="mt-4 text-gray-300">Loading monitoring data...</p>
            </div>

            <!-- Error State -->
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
                    <div class="bg-gray-900 rounded-2xl shadow-lg overflow-hidden border border-gray-800">
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
                                                monitoringData.config?.title || 'SystemStatus' }}</h2>
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
                        <div class="px-6 sm:px-8 py-6 border-b border-gray-800">
                            <div
                                class="bg-gray-800/50 border-2 border-green-900/50 rounded-xl p-6 flex items-center gap-4">
                                <div class="flex-shrink-0">
                                    <div
                                        class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                                        <i class="fas fa-check-circle text-green-500 text-3xl"></i>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <h3 class="text-2xl font-bold text-white mb-1">Semua Sistem Berfungsi</h3>
                                    <p class="text-gray-400 text-sm">{{ getOverallStatusText() }}</p>
                                </div>
                                <div class="hidden sm:block text-right">
                                    <div class="text-3xl font-bold text-green-500">{{ getOverallUptime() }}%</div>
                                    <div class="text-xs text-gray-500 mt-1">Uptime (24h)</div>
                                </div>
                            </div>
                        </div>

                        <!-- Monitoring Groups -->
                        <div class="p-6 sm:p-8">
                            <div v-for="group in sortedMonitoringGroups" :key="group.id" class="mb-8 last:mb-0">
                                <h3 class="text-lg sm:text-xl font-bold text-white mb-4">
                                    {{ group.name || 'Untitled Group' }}
                                </h3>
                                <div class="space-y-3">
                                    <div v-for="monitor in group.monitorList" :key="monitor.id"
                                        class="bg-gray-800/80 rounded-xl p-4 sm:p-5 hover:bg-gray-700 transition-all duration-300 border border-gray-700 shadow-lg"
                                        :class="{ 'ring-2 ring-green-500/20': monitoringConnected && !monitoringLoading }">
                                        <div class="flex items-start gap-4">

                                            <!-- Uptime Badge -->
                                            <div class="flex-shrink-0">
                                                <div class="rounded-lg px-3 py-2 min-w-[70px] text-center"
                                                    :style="{ backgroundColor: getUptimeBadgeColor(getMonitorUptime(monitor)) }">
                                                    <div class="text-white font-bold text-sm sm:text-base">{{
                                                        getMonitorUptime(monitor) }}%</div>
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
                                                <div class="flex items-center gap-4 text-xs text-gray-500">
                                                    <span><i class="fas fa-clock mr-1"></i> {{
                                                        getMonitorTimeRange(monitor) }}</span>
                                                    <span><i class="fas fa-sync-alt mr-1"></i> Last check: {{
                                                        lastUpdateTime ? getLastUpdateText() : 'Never' }}</span>
                                                </div>
                                            </div>

                                            <!-- Status Indicator -->
                                            <div class="flex-shrink-0 flex flex-col items-center gap-2">
                                                <div class="w-3 h-3 rounded-full"
                                                    :style="{ backgroundColor: getMonitorStatusColor(monitor) }"
                                                    :class="{ 'animate-pulse': isMonitorActive(monitor) }"
                                                    :title="getMonitorStatusText(monitor)"></div>
                                                <span class="text-xs text-gray-400 hidden sm:inline">{{
                                                    getMonitorStatusText(monitor) }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Empty State -->
                            <div v-if="sortedMonitoringGroups.length === 0" class="text-center py-12">
                                <i class="fas fa-server text-gray-600 text-5xl mb-4"></i>
                                <p class="text-gray-400">No monitoring groups available</p>
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

// State Utama
const monitoringEndpoints = ref([{ id: 'all', label: 'All Services' }])
const monitoringTab = ref('all')
const monitoringLoading = ref(false)
const monitoringConnected = ref(false)
const monitoringData = ref(null)
const monitoringError = ref('')
const lastUpdateTime = ref(null)
let metricsInterval = null
const themeColor = '#A93133' // Disesuaikan dengan aksen Lilly ISP

// Data Dummy Fallback (Jika API Kuma di backend belum di-set / KUMA_URL kosong)
const fallbackData = {
    config: { title: 'Lilly ISP Network Status' },
    publicGroupList: [
        {
            id: 1,
            name: 'Core Infrastructure',
            monitorList: [
                { id: 101, name: 'Main BGP Router', type: 'PING', uptime: 99.9, status: 1 },
                { id: 102, name: 'FreeRADIUS Server', type: 'TCP', uptime: 98.5, status: 1 },
                { id: 103, name: 'DNS Resolver Primary', type: 'DNS', uptime: 100, status: 1 }
            ]
        },
        {
            id: 2,
            name: 'Distribution Area',
            monitorList: [
                { id: 201, name: 'OLT Malang', type: 'HTTP', uptime: 99.0, status: 1 },
                { id: 202, name: 'OLT Surabaya', type: 'PING', uptime: 94.2, status: 1 }
            ]
        }
    ]
}

// Helper Methods
const switchMonitoringTab = (id) => { monitoringTab.value = id }
const getLastUpdateText = () => lastUpdateTime.value ? lastUpdateTime.value.toLocaleTimeString() : 'Just now'
const getOverallStatusText = () => "All systems operational"
const getOverallUptime = () => "99.8"
const getMonitorUptime = (m) => m.uptime || 100
const getMonitorTypeColor = (t) => '#10b981'
const getMonitorTimeRange = () => "Last 24 hours"
const getMonitorStatusText = (m) => m.status === 1 ? "Operational" : "Degraded"
const isMonitorActive = (m) => m.status === 1

const getMonitorStatusColor = (m) => {
    if (m.uptime >= 95.0) return '#10b981' // Green
    if (m.uptime >= 90.0) return '#eab308' // Yellow
    return '#ef4444' // Red
}

// Generate random bars for dummy visual graph
const getUptimeBars = (m) => Array(30).fill(0).map(() => {
    const base = m.uptime - 5;
    return Math.min(100, Math.max(0, base + Math.random() * 10))
})

// === LOGIKA YANG KAMU KIRIMKAN ===
const getUptimeBarColor = (uptime) => {
    if (uptime >= 95.0) return '#84cc16' // Light Green
    if (uptime >= 90.0) return '#eab308' // Yellow
    if (uptime >= 85.0) return '#f59e0b' // Orange
    return '#ef4444' // Red
}
const getUptimeBadgeColor = getUptimeBarColor

const sortedMonitoringGroups = computed(() => monitoringData.value?.publicGroupList || [])

const connectMonitoring = () => { monitoringConnected.value = true }
const disconnectMonitoring = () => { monitoringConnected.value = false }

const fetchKumaStatus = () => {
    monitoringLoading.value = true
    // Simulasi Fetching dari API Backend (Bisa diganti dengan fetch/axios ke backend Golang)
    setTimeout(() => {
        monitoringData.value = fallbackData
        monitoringLoading.value = false
        monitoringError.value = ''
    }, 800)
}

const fetchMetrics = () => {
    lastUpdateTime.value = new Date()
}

const fetchMonitoringData = () => {
    fetchKumaStatus()
    fetchMetrics()
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