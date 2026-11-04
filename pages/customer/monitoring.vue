<script setup lang="ts">
import { monitoringCustomerApi, type CustomerMonitoringEvent } from '@/api/customer/monitoring'
import { formatDateTimeID } from '@/helper/customerPortal'
import { card, sectionGap } from '@/helper/portalTheme'

useHead({ title: 'Monitoring Koneksi - Lilly Networks' })
definePageMeta({ ssr: false })

const toast = useCustomToast()
const events = ref<CustomerMonitoringEvent[]>([])
const isLoading = ref(true)
const selectedTimeRange = ref('1d')
const serviceStatus = ref('unknown')

const latestEvent = computed(() => events.value[0] ?? null)

const latestStatusLabel = computed(() => {
  const status = latestEvent.value?.status?.toLowerCase() || ''

  if (!status) return 'Belum ada data'
  if (status.includes('up') || status.includes('online') || status.includes('connected')) return 'Terhubung'
  if (status.includes('down') || status.includes('offline') || status.includes('disconnected') || status.includes('lost')) return 'Terputus'
  return 'Memeriksa...'
})

const connectionStatusClass = computed(() => {
  const status = latestEvent.value?.status?.toLowerCase() || ''

  if (!status) return 'bg-yellow-500'
  if (status.includes('up') || status.includes('online') || status.includes('connected')) return 'bg-green-500'
  if (status.includes('down') || status.includes('offline') || status.includes('disconnected') || status.includes('lost')) return 'bg-red-500'
  return 'bg-yellow-500'
})

const summary = computed(() => {
  const total = events.value.length
  const up = events.value.filter((event) => /up|online|connected/i.test(event.status)).length
  const down = events.value.filter((event) => /down|offline|disconnected|lost/i.test(event.status)).length

  return { total, up, down }
})

async function loadHistory() {
  isLoading.value = true
  try {
    const response = await monitoringCustomerApi().getHistory(selectedTimeRange.value)
    events.value = response?.data || []
  } catch (error: any) {
    toast.error('Gagal memuat riwayat koneksi', error?.message)
  } finally {
    isLoading.value = false
  }
}

async function loadHealth() {
  try {
    const response = await monitoringCustomerApi().getHealth()
    serviceStatus.value = response?.data?.status || 'unknown'
  } catch {
    serviceStatus.value = 'unknown'
  }
}

onMounted(async () => {
  await Promise.all([loadHealth(), loadHistory()])
})

watch(selectedTimeRange, () => {
  loadHistory()
})
</script>

<template>
  <CustomerPortalShell title="Monitoring Koneksi" subtitle="Riwayat status koneksi internet Anda" back-to="/customer">
    <div class="bg-white rounded-xl shadow-sm px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <div :class="['w-3 h-3 rounded-full', connectionStatusClass]"></div>
        <span class="text-sm font-medium text-gray-700">{{ latestStatusLabel }}</span>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-500">Status layanan</span>
        <span class="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700">
          {{ serviceStatus }}
        </span>
      </div>
    </div>

    <div :class="sectionGap">
      <div :class="[card, 'mb-4']">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-[0.12em] text-gray-500">Rentang waktu</p>
            <h3 class="text-lg font-semibold text-gray-900 mt-1">Riwayat koneksi</h3>
          </div>

          <select v-model="selectedTimeRange" class="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#A93133]/20">
            <option value="1h">1 jam</option>
            <option value="6h">6 jam</option>
            <option value="1d" selected>1 hari</option>
            <option value="7d">7 hari</option>
            <option value="30d">30 hari</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div :class="card">
          <p class="text-xs uppercase tracking-[0.12em] text-gray-500">Total event</p>
          <p class="mt-2 text-2xl font-bold text-gray-900">{{ summary.total }}</p>
        </div>
        <div :class="card">
          <p class="text-xs uppercase tracking-[0.12em] text-gray-500">Terhubung</p>
          <p class="mt-2 text-2xl font-bold text-emerald-600">{{ summary.up }}</p>
        </div>
        <div :class="card">
          <p class="text-xs uppercase tracking-[0.12em] text-gray-500">Terputus</p>
          <p class="mt-2 text-2xl font-bold text-red-600">{{ summary.down }}</p>
        </div>
      </div>

      <div :class="[card, 'overflow-hidden']">
        <div class="px-4 py-3 border-b border-gray-200">
          <h3 class="text-base font-semibold text-gray-900">Log koneksi terakhir</h3>
        </div>

        <div v-if="isLoading" class="px-4 py-10 text-center text-sm text-gray-500">
          <div class="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-[#A93133]"></div>
          Memuat riwayat koneksi...
        </div>

        <div v-else-if="events.length === 0" class="px-4 py-10 text-center text-sm text-gray-500">
          Belum ada data monitoring untuk akun Anda.
        </div>

        <ul v-else class="divide-y divide-gray-200">
          <li v-for="event in events" :key="event.id" class="flex items-start justify-between gap-4 px-4 py-4">
            <div class="min-w-0">
              <p class="font-medium text-gray-900">{{ event.message || event.status }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ formatDateTimeID(event.timestamp) }}</p>
            </div>
            <span
              class="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
              :class="event.status.toLowerCase().includes('up') || event.status.toLowerCase().includes('online') || event.status.toLowerCase().includes('connected')
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'"
            >
              {{ event.status }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </CustomerPortalShell>
</template>
