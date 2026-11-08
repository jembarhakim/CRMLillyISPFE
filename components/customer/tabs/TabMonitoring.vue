<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useApiHost } from '@/composables/useApiHost'
import { useAuthStore } from '@/stores/auth'
import { useWebSocket } from '@/composables/useWebSocket'
import { monitoringCustomerApi, type CustomerMonitoringEvent } from '@/api/customer/monitoring'
import { dashboardCustomerApi } from '@/api/customer/dashboard'

interface CustomerWithStatus {
    id: string; name: string; email: string; ip_address: string; mac_address: string; status: string; last_seen: string | Date;
}

const apiHost = useApiHost()
const authStore = useAuthStore()

const connectionStatus = ref('checking')
const connectionSummary = ref({ totalUp: 0, totalDown: 0, totalOff: 0 })
const customers = ref<CustomerWithStatus[]>([])
const connectionHistory = ref<CustomerMonitoringEvent[]>([])
const selectedTimeRange = ref('1d')
const statusFilter = ref('')
const searchQuery = ref('')
const loading = ref(false)

const { isConnected: wsConnected, messages: wsMessages, connect: wsConnect, disconnect: wsDisconnect } = useWebSocket(
    `${apiHost}/api/customer/monitoring/ws`,
    authStore.user?.user_id || ''
)

const filteredCustomers = computed(() => {
    let list = customers.value
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        list = list.filter((c) => c.name?.toLowerCase().includes(q) || c.ip_address?.toLowerCase().includes(q))
    }
    if (statusFilter.value) {
        list = list.filter((c) => c.status === statusFilter.value)
    }
    return list
})

async function fetchConnectionSummary() {
    try {
        // Customer portal must only read its OWN connection.
        // Previously this called the admin customer list (/api/admin/customer),
        // which a customer token is not allowed to access — it produced a 403
        // and leaked other customers' data.
        const dash = await dashboardCustomerApi().getCustomerDashboard()
        const customer = dash?.data?.customer
        const device = dash?.data?.network_device

        let ownStatus = 'off'
        if (device?.mac_address) {
            const statusResp = await dashboardCustomerApi().checkDeviceStatus()
            ownStatus = statusResp?.data?.status === 'up' ? 'up' : 'down'
        }

        connectionStatus.value = ownStatus
        connectionSummary.value = {
            totalUp: ownStatus === 'up' ? 1 : 0,
            totalDown: ownStatus === 'down' ? 1 : 0,
            totalOff: ownStatus === 'off' ? 1 : 0,
        }

        customers.value = customer?.id
            ? [{
                id: customer.id,
                name: customer.name,
                email: customer.email || '',
                ip_address: device?.ip_static || 'N/A',
                mac_address: device?.mac_address || 'N/A',
                status: ownStatus,
                last_seen: new Date().toISOString(),
            }]
            : []
    } catch (e) {
        console.error('Failed to load monitoring summary:', e)
    }
}

async function fetchConnectionHistory() {
    try {
        const data = await monitoringCustomerApi().getHistory(selectedTimeRange.value)
        if (data.success) connectionHistory.value = data.data || []
    } catch (e) {
        console.error('Failed to get connection history:', e)
    }
}

async function refreshData() {
    loading.value = true
    try {
        await Promise.all([fetchConnectionSummary(), fetchConnectionHistory()])
    } finally {
        loading.value = false
    }
}

const formatTime = (ts: string | Date) => {
    if (!ts) return 'N/A'
    return new Date(ts).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

let refreshInterval: NodeJS.Timeout | null = null

watch(wsMessages, (msgs) => {
    if (msgs.length > 0) {
        const latest = msgs[msgs.length - 1]
        if (latest.type === 'status_update' && latest.data?.status) {
            connectionStatus.value = latest.data.status
        }
    }
}, { deep: true })

onMounted(() => {
    refreshData()
    refreshInterval = setInterval(refreshData, 30000)
    if (authStore.user?.user_id) wsConnect()
})

onUnmounted(() => {
    if (refreshInterval) clearInterval(refreshInterval)
    wsDisconnect()
})
</script>

<template>
    <div class="space-y-6">
        <!-- ===== BARIS 1: Filter Pill Kiri & 3 Stat Pill Kanan (Persis Design 1) ===== -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="flex flex-wrap items-center gap-3">
                <div
                    class="bg-white rounded-full px-4 py-2 shadow-sm border border-white flex items-center gap-2 text-xs">
                    <span class="text-gray-500">Timeframe:</span>
                    <select v-model="selectedTimeRange" @change="fetchConnectionHistory"
                        class="font-bold text-gray-900 bg-transparent focus:outline-none cursor-pointer">
                        <option value="1h">1 Jam</option>
                        <option value="6h">6 Jam</option>
                        <option value="1d">24 Jam</option>
                        <option value="7d">7 Hari</option>
                        <option value="30d">30 Hari</option>
                    </select>
                </div>

                <div
                    class="bg-white rounded-full px-4 py-2 shadow-sm border border-white flex items-center gap-2 text-xs">
                    <span class="text-gray-500">Status:</span>
                    <select v-model="statusFilter"
                        class="font-bold text-gray-900 bg-transparent focus:outline-none cursor-pointer">
                        <option value="">All</option>
                        <option value="up">Up</option>
                        <option value="down">Down</option>
                        <option value="off">Off</option>
                    </select>
                </div>

                <button @click="refreshData"
                    class="bg-white rounded-full px-4 py-2 shadow-sm border border-white flex items-center gap-2 text-xs font-bold text-gray-800 hover:text-[#A93133]">
                    <span class="w-2 h-2 rounded-full" :class="wsConnected ? 'bg-green-500' : 'bg-[#A93133]'"></span>
                    <span>{{ wsConnected ? 'Live Stream' : 'Refresh' }}</span>
                </button>
            </div>

            <!-- 3 Stat Pills -->
            <div class="grid grid-cols-3 gap-3">
                <div
                    class="bg-white rounded-full px-5 py-2 shadow-sm border border-white flex items-center justify-between gap-3">
                    <span class="text-xs text-gray-500 font-medium">Up</span>
                    <span class="text-base sm:text-lg font-extrabold text-green-600">{{ connectionSummary.totalUp
                    }}</span>
                </div>
                <div
                    class="bg-white rounded-full px-5 py-2 shadow-sm border border-white flex items-center justify-between gap-3">
                    <span class="text-xs text-gray-500 font-medium">Down</span>
                    <span class="text-base sm:text-lg font-extrabold text-[#A93133]">{{ connectionSummary.totalDown
                    }}</span>
                </div>
                <div
                    class="bg-white rounded-full px-5 py-2 shadow-sm border border-white flex items-center justify-between gap-3">
                    <span class="text-xs text-gray-500 font-medium">Off</span>
                    <span class="text-base sm:text-lg font-extrabold text-gray-600">{{ connectionSummary.totalOff
                    }}</span>
                </div>
            </div>
        </div>

        <!-- ===== BARIS 2: 2 Kartu Grafik Kembar (Bar Chart + Uptime Kuma Gelap ala Landing Page) ===== -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Kiri: Bar Chart Koneksi (Persis Design 1 dengan Warna Merah Lilly) -->
            <div class="bg-white rounded-3xl p-6 shadow-[0_10px_25px_rgb(169,49,51,0.05)] border border-white">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xs sm:text-sm font-bold text-gray-700">Overall Connection Stability</h3>
                    <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F9EBEB] text-[#A93133]">{{
                        selectedTimeRange.toUpperCase() }}</span>
                </div>

                <div v-if="connectionHistory.length === 0"
                    class="h-44 flex flex-col items-center justify-center text-gray-400">
                    <LucideIcon name="bar-chart-2" :size="28" class="mb-2 opacity-40" />
                    <p class="text-xs">Menunggu data grafik koneksi...</p>
                </div>

                <div v-else class="h-44 flex items-end justify-between gap-2 pt-4 px-2">
                    <div v-for="(event, idx) in connectionHistory.slice(-12)" :key="idx"
                        class="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <div class="w-2.5 sm:w-3 bg-[#F9EBEB] rounded-full h-full flex items-end overflow-hidden">
                            <div class="w-full rounded-full transition-all duration-500"
                                :class="event.status === 'up' ? 'bg-[#A93133] h-4/5' : 'bg-gray-400 h-2/5'"
                                :title="`${event.status.toUpperCase()} - ${formatTime(event.timestamp)}`"></div>
                        </div>
                        <span class="text-[9px] font-semibold text-gray-400 uppercase">{{
                            formatTime(event.timestamp).split(',')[0] }}</span>
                    </div>
                </div>
            </div>

            <!-- Kanan: Status Server & Layanan Gaya Kuma Dark Card (Konsisten Gambar 2 Landing Page) -->
            <div
                class="bg-[#111111] text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                        <span class="w-3 h-3 rounded-full bg-green-400 animate-pulse"></span>
                        <h3 class="text-xs sm:text-sm font-bold">Status Layanan & Server Lilly ISP</h3>
                    </div>
                    <span
                        class="text-xs font-extrabold text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                        99.9% UPTIME
                    </span>
                </div>

                <!-- Bar Hijau Kuma ala Landing Page -->
                <div class="my-4 space-y-3">
                    <div>
                        <div class="flex justify-between text-[11px] text-gray-300 mb-1.5">
                            <span>Core Fiber Backbone</span>
                            <span class="text-green-400 font-bold">Operational</span>
                        </div>
                        <div class="grid grid-cols-20 gap-1">
                            <div v-for="i in 20" :key="i" class="h-3 rounded-xs bg-green-500"></div>
                        </div>
                    </div>

                    <div>
                        <div class="flex justify-between text-[11px] text-gray-300 mb-1.5">
                            <span>Gateway & DNS Resolver</span>
                            <span class="text-green-400 font-bold">Operational</span>
                        </div>
                        <div class="grid grid-cols-20 gap-1">
                            <div v-for="i in 20" :key="i" class="h-3 rounded-xs"
                                :class="i === 14 ? 'bg-amber-400' : 'bg-green-500'"></div>
                        </div>
                    </div>
                </div>

                <div class="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
                    <span>Pantauan Kuma Monitoring Real-time</span>
                    <span class="text-white font-semibold">Ping: 4ms</span>
                </div>
            </div>
        </div>

        <!-- ===== BARIS 3: Layout Asimetris 7:5 (Daftar Perangkat + 2 Kartu Log/Metrik) ===== -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Kiri (7 Kolom): Daftar Perangkat / Koneksi -->
            <div
                class="lg:col-span-7 bg-white rounded-3xl p-6 shadow-[0_10px_25px_rgb(169,49,51,0.05)] border border-white">
                <div
                    class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                    <h3 class="text-xs sm:text-sm font-bold text-gray-700">Status Perangkat Terdaftar</h3>
                    <input v-model="searchQuery" type="text" placeholder="Cari perangkat / IP..."
                        class="px-3.5 py-1.5 rounded-full border border-gray-200 text-xs focus:outline-none focus:border-[#A93133]" />
                </div>

                <div v-if="filteredCustomers.length === 0" class="py-10 text-center text-xs text-gray-400">
                    Tidak ada data perangkat yang ditampilkan.
                </div>

                <div v-else class="divide-y divide-gray-100 mt-2">
                    <div v-for="cust in filteredCustomers.slice(0, 6)" :key="cust.id"
                        class="py-3 flex items-center justify-between text-xs">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-9 h-9 rounded-2xl bg-[#F9EBEB] text-[#A93133] flex items-center justify-center font-extrabold">
                                {{ (cust.name || 'U')[0] }}
                            </div>
                            <div>
                                <p class="font-bold text-gray-900">{{ cust.name || 'Pelanggan' }}</p>
                                <p class="text-[10px] text-gray-400 font-mono">{{ cust.ip_address }} · {{
                                    cust.mac_address }}</p>
                            </div>
                        </div>
                        <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase"
                            :class="cust.status === 'up' ? 'bg-green-100 text-green-700' : cust.status === 'down' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'">
                            {{ cust.status }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Kanan (5 Kolom): 2 Kartu Log Aktivitas & Parameter Jaringan -->
            <div class="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div class="bg-white rounded-3xl p-5 shadow-[0_10px_25px_rgb(169,49,51,0.05)] border border-white">
                    <h3 class="text-xs font-bold text-gray-700 pb-2.5 border-b border-gray-100">Log Koneksi</h3>
                    <div v-if="connectionHistory.length === 0" class="py-8 text-center text-[11px] text-gray-400">
                        Belum ada insiden
                    </div>
                    <ul v-else class="space-y-3 mt-3 text-xs">
                        <li v-for="(ev, i) in connectionHistory.slice(-5)" :key="i"
                            class="flex items-center justify-between">
                            <span class="text-gray-600 flex items-center gap-1.5">
                                <span class="w-2 h-2 rounded-full"
                                    :class="ev.status === 'up' ? 'bg-green-500' : 'bg-[#A93133]'"></span>
                                {{ ev.status === 'up' ? 'Pulih' : 'Putus' }}
                            </span>
                            <span class="font-bold text-gray-900 text-[10px]">{{ formatTime(ev.timestamp).split(',')[0]
                            }}</span>
                        </li>
                    </ul>
                </div>

                <div class="bg-white rounded-3xl p-5 shadow-[0_10px_25px_rgb(169,49,51,0.05)] border border-white">
                    <h3 class="text-xs font-bold text-gray-700 pb-2.5 border-b border-gray-100">Kualitas Jalur</h3>
                    <ul class="space-y-3 mt-3 text-xs">
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Tipe Akses</span>
                            <span class="font-bold text-gray-900">FTTH Optical</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Packet Loss</span>
                            <span class="font-bold text-green-600">0.0%</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Rata-rata Ping</span>
                            <span class="font-bold text-gray-900">4 - 8 ms</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Redaman OLT</span>
                            <span class="font-bold text-green-600">Optimal</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Auto-Check</span>
                            <span class="font-bold text-[#A93133]">30 Detik</span>
                        </li>
                    </ul>
        <!--  -->        </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.grid-cols-20 {
    grid-template-columns: repeat(20, minmax(0, 1fr));
}
</style>