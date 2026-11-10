<template>
  <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <header class="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
      <div>
        <h2 class="text-lg font-semibold text-slate-900">Monitoring The Dude</h2>
        <p class="text-sm text-slate-500">Impor perangkat dari Network Map The Dude dan pantau status IP melalui RouterOS API.</p>
      </div>
      <span class="rounded-full px-3 py-1 text-sm" :class="connected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'">
        {{ connected ? `API terhubung${routerHost ? ` · ${routerHost}` : ''}` : 'API belum terhubung' }}
      </span>
    </header>

    <div class="space-y-4 p-5">
      <p v-if="notice.message" class="rounded-lg px-4 py-3 text-sm" :class="notice.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'">
        {{ notice.message }}
      </p>

      <form v-if="canConnect" class="space-y-3 rounded-lg bg-slate-50 p-4" @submit.prevent="connect">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label class="text-sm">Host server The Dude
            <input v-model.trim="connection.host" required placeholder="IP router/server The Dude" class="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label class="text-sm">Port API
            <input v-model.number="connection.port" required type="number" min="1" max="65535" class="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label class="text-sm">Username API
            <input v-model.trim="connection.username" required autocomplete="username" class="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label class="text-sm">Password API
            <input v-model="connection.password" required type="password" autocomplete="current-password" class="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <div class="flex flex-col justify-end gap-2">
            <label class="flex items-center gap-2 text-sm">
              <input v-model="connection.use_tls" type="checkbox" /> Gunakan API-SSL
            </label>
            <button :disabled="connecting" class="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
              {{ connecting ? 'Menghubungkan...' : connected ? 'Sambungkan ulang' : 'Hubungkan API' }}
            </button>
          </div>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>WinBox Anda menunjukkan server 103.148.18.248 dan service api port 8783. “Available From” adalah IP sumber backend yang diizinkan, bukan Host.</span>
          <button v-if="connected" type="button" :disabled="connecting" class="text-rose-600 hover:underline" @click="disconnect">
            Putuskan koneksi
          </button>
        </div>
      </form>
      <p v-else-if="!connected" class="rounded bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Server The Dude belum tersambung. Minta SUPERADMIN menghubungkan API terlebih dahulu.
      </p>

      <div v-if="canConnect" class="space-y-3 rounded-lg border border-slate-200 p-4">
        <div>
          <h3 class="font-medium text-slate-900">Impor perangkat dari Network Map</h3>
          <p class="text-sm text-slate-500">Pilih CSV hasil ekspor The Dude. Perangkat dengan IP yang sama akan diperbarui, bukan digandakan.</p>
        </div>
        <div class="flex flex-wrap items-end gap-3">
          <label class="min-w-64 flex-1 text-sm">File CSV
            <input type="file" accept=".csv,text/csv" class="mt-1 block w-full rounded border px-3 py-2" @change="selectCSV" />
          </label>
          <label class="min-w-64 flex-1 text-sm">Network Map
            <select v-model="selectedMap" :disabled="!csvPreview || importing" class="mt-1 w-full rounded border px-3 py-2">
              <option value="" disabled>Pilih map yang akan diimpor</option>
              <option v-for="map in csvPreview?.maps || []" :key="map.name" :value="map.name">
                {{ map.name }} · {{ map.devices }} IP
              </option>
            </select>
          </label>
          <button type="button" :disabled="!selectedCsv || !selectedMap || importing || previewing" class="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50" @click="importSelectedCSV">
            {{ importing ? 'Mengimpor...' : 'Impor perangkat' }}
          </button>
        </div>
        <p v-if="previewing" class="text-sm text-slate-500">Membaca Network Map dari CSV...</p>
        <p v-if="csvPreview" class="text-sm text-slate-600">
          {{ csvPreview.rows }} baris · {{ selectedMapPreview?.devices || 0 }} IP valid pada map terpilih
          <span v-if="selectedMapPreview?.skipped"> · {{ selectedMapPreview.skipped }} alamat dilewati</span>
        </p>
        <p v-if="csvError" class="rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ csvError }}</p>
      </div>

      <template v-if="connected || canConnect || reportedStatuses.length > 0">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex gap-2">
            <button type="button" class="rounded px-4 py-2 text-sm" :class="tab === 'devices' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'" @click="selectTab('devices')">
              Perangkat <span class="ml-1 rounded-full bg-white/20 px-1.5">{{ displayDevices.length }}</span>
            </button>
            <button type="button" class="rounded px-4 py-2 text-sm" :class="tab === 'services' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'" @click="selectTab('services')">
              Probe/Services <span class="ml-1 rounded-full bg-white/20 px-1.5">{{ services.length }}</span>
            </button>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs text-slate-500">Diperbarui: {{ lastUpdated || 'belum ada' }}</span>
            <button type="button" :disabled="loading" class="rounded border px-3 py-2 text-sm disabled:opacity-60" @click="refresh()">
              {{ loading ? 'Memuat...' : 'Perbarui sekarang' }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div class="rounded-lg bg-slate-50 p-3"><p class="text-xs text-slate-500">Total perangkat</p><p class="text-xl font-semibold">{{ displayDevices.length }}</p></div>
          <div class="rounded-lg bg-emerald-50 p-3"><p class="text-xs text-emerald-700">Up</p><p class="text-xl font-semibold text-emerald-800">{{ statusCounts.up }}</p></div>
          <div class="rounded-lg bg-rose-50 p-3"><p class="text-xs text-rose-700">Down</p><p class="text-xl font-semibold text-rose-800">{{ statusCounts.down }}</p></div>
          <div class="rounded-lg bg-orange-50 p-3"><p class="text-xs text-orange-700">Partially down</p><p class="text-xl font-semibold text-orange-800">{{ statusCounts.partial }}</p></div>
          <div class="rounded-lg bg-amber-50 p-3"><p class="text-xs text-amber-700">Lainnya</p><p class="text-xl font-semibold text-amber-800">{{ statusCounts.other }}</p></div>
        </div>
        <p v-if="hasMissingStatus" class="rounded bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Status sebagian perangkat belum dapat ditentukan dari data perangkat atau probe terkait.
        </p>
        <p v-if="statusSourceError" class="rounded bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Gagal memuat daftar perangkat terdaftar: {{ statusSourceError }}
        </p>
        <p v-else-if="reportedStatuses.length === 0 && statusCounts.up + statusCounts.down + statusCounts.partial === 0" class="rounded bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Impor CSV Network Map terlebih dahulu. Backend akan mengecek status IP melalui RouterOS API setiap {{ syncStatus.interval_seconds || 60 }} detik.
        </p>

        <div class="flex flex-wrap items-center gap-3">
          <input v-model.trim="search" type="search" placeholder="Cari nama atau IP perangkat..." class="w-full rounded border px-3 py-2 text-sm sm:max-w-sm" />
          <label class="flex items-center gap-2 text-sm text-slate-600">
            <input v-model="showOnlyDown" type="checkbox" />
            Hanya tampilkan down
          </label>
          <span class="ml-auto text-sm text-slate-500">Sinkronisasi otomatis tiap {{ syncStatus.interval_seconds || 60 }} detik</span>
          <button v-if="canConnect" type="button" :disabled="syncStarting || syncStatus.running" class="rounded border border-blue-200 px-3 py-2 text-sm text-blue-700 disabled:opacity-60" @click="runRouterOSSync">
            {{ syncStarting ? 'Memulai sinkronisasi...' : syncStatus.running ? `Mengecek ${syncStatus.completed}/${syncStatus.total}` : 'Sinkronkan sekarang' }}
          </button>
        </div>
        <p v-if="syncStatus.running" class="text-sm text-slate-600">
          Sinkronisasi berjalan: {{ syncStatus.completed }}/{{ syncStatus.total }} selesai · {{ syncStatus.up }} up · {{ syncStatus.down }} down · {{ syncStatus.failed }} gagal diperiksa
        </p>
        <p v-else-if="syncStatus.total > 0" class="text-sm text-slate-600">
          Sinkronisasi terakhir: {{ syncStatus.up }} up · {{ syncStatus.down }} down · {{ syncStatus.failed }} gagal diperiksa dari {{ syncStatus.total }} IP.
        </p>
        <p v-if="syncStatus.last_error" class="rounded bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Sinkronisasi terakhir mengalami kendala: {{ syncStatus.last_error }}
        </p>
        <p v-if="syncActionError" class="rounded bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ syncActionError }}</p>

        <p v-if="loadError" class="rounded bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ loadError }}</p>
        <div v-else-if="!loading && filteredRows.length === 0" class="rounded border border-dashed p-8 text-center text-sm text-slate-500">
          Tidak ada data dari The Dude. Periksa akun API dan pastikan user memiliki policy <code>dude</code>.
        </div>
        <div v-else class="overflow-x-auto rounded border">
          <table class="min-w-full divide-y text-sm">
            <thead class="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">ID</th>
                <th class="px-4 py-3">{{ tab === 'devices' ? 'Perangkat' : 'Probe/Service' }}</th>
                <th class="px-4 py-3">{{ tab === 'devices' ? 'Alamat' : 'Perangkat' }}</th>
                <th v-if="tab === 'devices'" class="px-4 py-3">Map</th>
                <th class="px-4 py-3">Detail status</th>
                <th class="px-4 py-3">Grup / Catatan</th>
                <th class="px-4 py-3">Data lainnya</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="(item, index) in paginatedRows" :key="item['.id'] || `${item.name}-${item.address}-${index}`" class="hover:bg-slate-50">
                <td class="whitespace-nowrap px-4 py-3">
                  <span class="rounded-full px-2 py-1 text-xs font-medium" :class="statusClass(item)">
                    {{ statusLabel(item) }}
                  </span>
                </td>
                <td class="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">{{ item['.id'] || '-' }}</td>
                <td class="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{{ item.name || item['.id'] || '(tanpa nama)' }}</td>
                <td class="whitespace-nowrap px-4 py-3 text-slate-600">{{ tab === 'devices' ? item.address || item.host || item['ip-address'] || '-' : item.device || item['device-name'] || '-' }}</td>
                <td v-if="tab === 'devices'" class="whitespace-nowrap px-4 py-3 text-slate-600">{{ item.map_name || '-' }}</td>
                <td class="max-w-xs px-4 py-3 text-slate-600">{{ tab === 'devices' ? deviceDetail(item) : item['problem-description'] || item['status-message'] || item['last-msg'] || item.message || item.status || '-' }}</td>
                <td class="max-w-xs px-4 py-3 text-slate-600">{{ item.group || item.comment || item.type || '-' }}</td>
                <td class="max-w-sm px-4 py-3 text-xs text-slate-500">
                  <details>
                    <summary class="cursor-pointer">Lihat field</summary>
                    <dl class="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                      <template v-for="(value, key) in item" :key="key">
                        <dt class="break-all font-medium">{{ key }}</dt><dd class="break-all">{{ value }}</dd>
                      </template>
                    </dl>
                  </details>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="filteredRows.length > pageSize" class="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <span>Menampilkan {{ pageStart + 1 }}–{{ Math.min(pageStart + pageSize, filteredRows.length) }} dari {{ filteredRows.length }}</span>
          <div class="flex items-center gap-2">
            <button type="button" class="rounded border px-3 py-1.5 disabled:opacity-50" :disabled="currentPage === 1" @click="currentPage--">
              Sebelumnya
            </button>
            <span>Halaman {{ currentPage }} / {{ totalPages }}</span>
            <button type="button" class="rounded border px-3 py-1.5 disabled:opacity-50" :disabled="currentPage === totalPages" @click="currentPage++">
              Berikutnya
            </button>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRuntimeConfig } from 'nuxt/app'
import { computed, onMounted, onUnmounted, reactive, ref, shallowRef, watch } from 'vue'
import { mikrotikAdminApi } from '@/api/admin/mikrotik'
import {
  dudeDeviceAdminApi,
  type DudeCSVPreview,
  type DudeRouterOSSyncStatus,
} from '@/api/admin/dude-device'
import { useNetworkSocket } from '@/composables/useNetworkSocket'
import { useAuthStore } from '@/stores/auth'

type DudeItem = Record<string, string | undefined>
type DudeTab = 'devices' | 'services'
type ReportedDeviceStatus = {
  device_name: string
  ip_address: string
  status: string
  map_name?: string
  last_seen?: string
}

const routerApi = mikrotikAdminApi().routerOS
const dudeDeviceApi = dudeDeviceAdminApi()
const authStore = useAuthStore()
const runtimeConfig = useRuntimeConfig()
const { latestUpdate, connect: connectStatusSocket, disconnect: disconnectStatusSocket } =
  useNetworkSocket(runtimeConfig.public.NETWORK_WS_URL as string)
const canConnect = computed(() => ['SUPERADMIN', 'ADMIN'].includes(String(authStore.user.role).toUpperCase()))
const connected = ref(false)
const connecting = ref(false)
const loading = ref(false)
const tab = ref<DudeTab>('devices')
const routerHost = ref('')
const search = ref('')
const showOnlyDown = ref(false)
const currentPage = ref(1)
const pageSize = 50
const devices = shallowRef<DudeItem[]>([])
const services = shallowRef<DudeItem[]>([])
const servicesLoaded = ref(false)
const reportedStatuses = shallowRef<ReportedDeviceStatus[]>([])
const statusSourceError = ref('')
const syncStarting = ref(false)
const syncStatus = ref<DudeRouterOSSyncStatus>({
  enabled: true,
  running: false,
  interval_seconds: 60,
  total: 0,
  completed: 0,
  up: 0,
  down: 0,
  failed: 0,
})
const syncActionError = ref('')
const selectedCsv = ref<File | null>(null)
const selectedMap = ref('')
const csvPreview = ref<DudeCSVPreview | null>(null)
const previewing = ref(false)
const importing = ref(false)
const csvError = ref('')
const loadError = ref('')
const notice = ref({ message: '', type: 'success' })
const lastUpdated = ref('')
const connection = reactive({ host: '103.148.18.248', port: 8783, username: '', password: '', use_tls: false })

const displayDevices = computed(() => {
  const reportedByName = new Map(reportedStatuses.value.map((item) => [normalizeName(item.device_name), item]))
  const reportedByIP = new Map(reportedStatuses.value.map((item) => [normalizeName(item.ip_address), item]))
  const knownAddresses = new Set<string>()
  const merged = devices.value.map((device) => {
    const address = normalizeName(device.address || device.host || device['ip-address'])
    const reported = reportedByIP.get(address) || reportedByName.get(normalizeName(device.name))
    if (!reported) return device
    knownAddresses.add(normalizeName(reported.ip_address))
    return {
      ...device,
      address: device.address || reported.ip_address,
      map_name: reported.map_name,
      status: reported.status,
    }
  })
  for (const reported of reportedStatuses.value) {
    const address = normalizeName(reported.ip_address)
    if (address && !knownAddresses.has(address)) {
      merged.push({
        '.id': `status:${reported.ip_address}`,
        name: reported.device_name,
        address: reported.ip_address,
        status: reported.status,
        map_name: reported.map_name,
      })
      knownAddresses.add(address)
    }
  }
  return merged
})
const currentItems = computed(() => tab.value === 'devices' ? displayDevices.value : services.value)
const filteredRows = computed(() => {
  const query = search.value.toLocaleLowerCase()
  return currentItems.value.filter((item) => {
    if (showOnlyDown.value && !(tab.value === 'devices' ? isDeviceDown(item) : isDown(item))) return false
    return !query || Object.values(item).some((value) => String(value || '').toLocaleLowerCase().includes(query))
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize)))
const pageStart = computed(() => (currentPage.value - 1) * pageSize)
const paginatedRows = computed(() => filteredRows.value.slice(pageStart.value, pageStart.value + pageSize))
const reportedStatusByName = computed(() => new Map(
  reportedStatuses.value.flatMap((item) => [
    [normalizeName(item.device_name), item.status] as const,
    [normalizeName(item.ip_address), item.status] as const,
  ]),
))
const selectedMapPreview = computed(() => csvPreview.value?.maps.find((map) => map.name === selectedMap.value))
const servicesByDevice = computed(() => {
  const byDevice = new Map<string, DudeItem[]>()
  for (const service of services.value) {
    for (const identifier of [service.device, service['device-name']]) {
      const key = normalizeName(identifier)
      if (!key) continue
      const matches = byDevice.get(key) || []
      matches.push(service)
      byDevice.set(key, matches)
    }
  }
  return byDevice
})
const statusCounts = computed(() => ({
  up: displayDevices.value.filter((item) => deviceStatus(item) === 'UP').length,
  down: displayDevices.value.filter((item) => deviceStatus(item) === 'DOWN').length,
  partial: displayDevices.value.filter((item) => deviceStatus(item) === 'PARTIALLY DOWN').length,
  other: displayDevices.value.filter((item) => !['UP', 'DOWN', 'PARTIALLY DOWN'].includes(deviceStatus(item))).length,
}))
const hasMissingStatus = computed(() => currentItems.value.some((item) => (
  tab.value === 'devices' ? deviceStatus(item) === 'UNKNOWN' : !hasStatus(item)
)))

function showNotice(message: string, type: 'success' | 'error' = 'success') {
  notice.value = { message, type }
}

function getData<T>(result: unknown, label: string): T {
  const data = (result as { data?: T })?.data
  if (data === undefined) throw new Error(`Respons ${label} dari backend tidak valid`)
  return data
}

function statusText(item: DudeItem): string {
  return [
    item.status,
    item.state,
    item.availability,
    item['device-status'],
    item['service-status'],
    item['status-message'],
    item['last-msg'],
    item.message,
  ].filter(Boolean).join(' ').toLowerCase()
}

function hasStatus(item: DudeItem): boolean {
  return Boolean(
    item.status ||
    item.state ||
    item.availability ||
    item['device-status'] ||
    item['service-status'] ||
    item['status-message'] ||
    item['last-msg'] ||
    item.message,
  )
}

function normalizeName(value: string | undefined): string {
  return (value || '').trim().toLocaleLowerCase()
}

function isDown(item: DudeItem): boolean {
  return /\b(down|error|unreachable|offline|timeout)\b/.test(statusText(item))
}

function isUp(item: DudeItem): boolean {
  return !isDown(item) && /\b(up|ok|online|running)\b/.test(statusText(item))
}

function relatedServices(device: DudeItem): DudeItem[] {
  return [device['.id'], device.name]
    .map(normalizeName)
    .filter(Boolean)
    .flatMap((identifier) => servicesByDevice.value.get(identifier) || [])
}

function resolveDeviceStatus(device: DudeItem): string {
  const directStatus = statusText(device)
  if (/\bpartially[\s_-]*down\b/.test(directStatus)) return 'PARTIALLY DOWN'
  if (/\b(down|error|unreachable|offline|timeout)\b/.test(directStatus)) return 'DOWN'
  if (/\b(up|ok|online|running)\b/.test(directStatus)) return 'UP'

  const reportedStatus =
    reportedStatusByName.value.get(normalizeName(device.name)) ||
    reportedStatusByName.value.get(normalizeName(device.address || device.host || device['ip-address']))
  if (reportedStatus) {
    if (/\b(down|error|unreachable|offline|timeout)\b/i.test(reportedStatus)) return 'DOWN'
    if (/\b(up|ok|online|running)\b/i.test(reportedStatus)) return 'UP'
  }

  const deviceServices = relatedServices(device)
  if (deviceServices.length === 0) return 'UNKNOWN'
  const hasDownService = deviceServices.some(isDown)
  const hasUpService = deviceServices.some(isUp)
  if (hasDownService && hasUpService) return 'PARTIALLY DOWN'
  if (hasDownService) return 'DOWN'
  if (deviceServices.every(isUp)) return 'UP'
  return 'UNKNOWN'
}

function deviceStatus(device: DudeItem): string {
  return resolveDeviceStatus(device)
}

function isDeviceDown(device: DudeItem): boolean {
  return ['DOWN', 'PARTIALLY DOWN'].includes(deviceStatus(device))
}

function deviceDetail(device: DudeItem): string {
  const directDetail = device['status-message'] || device['last-msg'] || device.message
  if (directDetail) return directDetail
  const issues = relatedServices(device)
    .filter(isDown)
    .map((service) => {
      const probe = service.probe || service.name || 'Probe'
      const problem = service['problem-description'] || service['status-message'] || service['last-msg']
      return problem ? `${probe}: ${problem}` : `${probe}: down`
    })
  return issues.length > 0 ? issues.join('; ') : '-'
}

function statusLabel(item: DudeItem): string {
  if (tab.value === 'devices') return deviceStatus(item)
  if (isDown(item)) return 'DOWN'
  if (isUp(item)) return 'UP'
  return item.status || 'UNKNOWN'
}

function statusClass(item: DudeItem): string {
  if (tab.value === 'devices') {
    const status = deviceStatus(item)
    if (status === 'PARTIALLY DOWN') return 'bg-orange-50 text-orange-700'
    if (status === 'DOWN') return 'bg-rose-50 text-rose-700'
    if (status === 'UP') return 'bg-emerald-50 text-emerald-700'
    return 'bg-slate-100 text-slate-600'
  }
  if (isDown(item)) return 'bg-rose-50 text-rose-700'
  if (isUp(item)) return 'bg-emerald-50 text-emerald-700'
  return 'bg-slate-100 text-slate-600'
}

async function checkStatus() {
  await loadPersistedStatuses()
  if (canConnect.value) await loadRouterOSSyncStatus()
  connectStatusSocket()
  try {
    const result = getData<{ status: string; host?: string }>(await routerApi.getStatus(), 'status')
    connected.value = result.status === 'connected'
    routerHost.value = result.host || ''
    if (connected.value) await refresh()
  } catch (error) {
    connected.value = false
    showNotice(error instanceof Error ? error.message : 'Gagal memeriksa status API', 'error')
  }
}

async function connect() {
  connecting.value = true
  try {
    await routerApi.connect({ ...connection })
    connected.value = true
    routerHost.value = connection.host
    connection.password = ''
    await refresh()
    connectStatusSocket()
    showNotice('Berhasil terhubung. Daftar perangkat The Dude sedang ditampilkan.')
  } catch (error) {
    connected.value = false
    showNotice(error instanceof Error ? error.message : 'Gagal menghubungkan API', 'error')
  } finally {
    connecting.value = false
  }
}

async function disconnect() {
  connecting.value = true
  try {
    await routerApi.disconnect()
    connected.value = false
    routerHost.value = ''
    devices.value = []
    services.value = []
    servicesLoaded.value = false
    reportedStatuses.value = []
    statusSourceError.value = ''
    showNotice('Koneksi ke server The Dude diputus.')
  } catch (error) {
    showNotice(error instanceof Error ? error.message : 'Gagal memutus koneksi API', 'error')
  } finally {
    connecting.value = false
  }
}

async function loadPersistedStatuses() {
  try {
    const response = await dudeDeviceApi.getAll()
    reportedStatuses.value = getData<ReportedDeviceStatus[]>(response, 'status webhook') || []
    statusSourceError.value = ''
  } catch (error) {
    statusSourceError.value = error instanceof Error ? error.message : 'Gagal memuat status webhook.'
  }
}

async function loadRouterOSSyncStatus() {
  try {
    const response = await dudeDeviceApi.getRouterOSSyncStatus()
    syncStatus.value = getData<DudeRouterOSSyncStatus>(response, 'RouterOS status sync')
    if (syncStatus.value.running) startSyncPolling()
  } catch (error) {
    syncActionError.value = error instanceof Error ? error.message : 'Gagal memuat status sinkronisasi.'
  }
}

let syncPollTimer: ReturnType<typeof setInterval> | undefined
function startSyncPolling() {
  if (syncPollTimer) return
  syncPollTimer = setInterval(async () => {
    try {
      const response = await dudeDeviceApi.getRouterOSSyncStatus()
      syncStatus.value = getData<DudeRouterOSSyncStatus>(response, 'RouterOS status sync')
      await loadPersistedStatuses()
      if (!syncStatus.value.running && syncPollTimer) {
        clearInterval(syncPollTimer)
        syncPollTimer = undefined
      }
    } catch (error) {
      syncActionError.value = error instanceof Error ? error.message : 'Gagal memperbarui status sinkronisasi.'
      if (syncPollTimer) clearInterval(syncPollTimer)
      syncPollTimer = undefined
    }
  }, 2000)
}

async function runRouterOSSync() {
  syncStarting.value = true
  syncActionError.value = ''
  try {
    const response = await dudeDeviceApi.startRouterOSSync()
    syncStatus.value = getData<DudeRouterOSSyncStatus>(response, 'RouterOS status sync')
    if (syncStatus.value.running) startSyncPolling()
  } catch (error) {
    syncActionError.value = error instanceof Error ? error.message : 'Gagal menjalankan sinkronisasi RouterOS.'
  } finally {
    syncStarting.value = false
  }
}

async function selectCSV(event: Event) {
  const input = event.target as HTMLInputElement
  selectedCsv.value = input.files?.[0] || null
  selectedMap.value = ''
  csvPreview.value = null
  csvError.value = ''
  if (!selectedCsv.value) return

  previewing.value = true
  try {
    const response = await dudeDeviceApi.previewCSV(selectedCsv.value)
    csvPreview.value = getData<DudeCSVPreview>(response, 'preview CSV')
    if (csvPreview.value.maps.length === 1) selectedMap.value = csvPreview.value.maps[0].name
    if (csvPreview.value.maps.length === 0) csvError.value = 'CSV tidak memiliki map dengan alamat IP valid.'
  } catch (error) {
    csvError.value = error instanceof Error ? error.message : 'Gagal membaca CSV.'
  } finally {
    previewing.value = false
  }
}

async function importSelectedCSV() {
  if (!selectedCsv.value || !selectedMap.value) return
  importing.value = true
  csvError.value = ''
  try {
    const response = await dudeDeviceApi.importCSV(selectedCsv.value, selectedMap.value)
    const result = getData<{ created: number; updated: number; total: number; skipped: number; map_name: string }>(
      response,
      'hasil impor',
    )
    showNotice(
      `${result.total} IP dari map ${result.map_name} diimpor (${result.created} baru, ${result.updated} diperbarui, ${result.skipped} alamat dilewati).`,
    )
    await loadPersistedStatuses()
    await loadRouterOSSyncStatus()
    await runRouterOSSync()
  } catch (error) {
    csvError.value = error instanceof Error ? error.message : 'Gagal mengimpor CSV.'
  } finally {
    importing.value = false
  }
}

function selectTab(nextTab: DudeTab) {
  tab.value = nextTab
  if (nextTab === 'services' && !servicesLoaded.value && connected.value) void refresh(true)
}

async function refresh(includeInventory = true) {
  if ((!connected.value && !connecting.value) || loading.value) return
  loading.value = true
  loadError.value = ''
  try {
    if (includeInventory) {
      const deviceResponse = await routerApi.listDudeDevices()
      devices.value = getData<{ items: DudeItem[] }>(deviceResponse, 'The Dude devices').items || []
      if (tab.value === 'services') {
        const serviceResponse = await routerApi.listDudeServices()
        services.value = getData<{ items: DudeItem[] }>(serviceResponse, 'The Dude services').items || []
        servicesLoaded.value = true
      }
    }
    await loadPersistedStatuses()
    if (canConnect.value) await loadRouterOSSyncStatus()
    lastUpdated.value = new Date().toLocaleTimeString('id-ID')
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Gagal memuat status perangkat The Dude.'
    if (loadError.value.toLowerCase().includes('not connected') || loadError.value.toLowerCase().includes('timeout')) {
      connected.value = false
    }
  } finally {
    loading.value = false
  }
}

watch([tab, search, showOnlyDown], () => {
  currentPage.value = 1
})
watch(totalPages, (pages) => {
  if (currentPage.value > pages) currentPage.value = pages
})

let refreshTimer: ReturnType<typeof setInterval> | undefined
watch(connected, (isConnected) => {
  if (refreshTimer) clearInterval(refreshTimer)
  if (isConnected) refreshTimer = setInterval(() => void refresh(false), 30_000)
})

onMounted(checkStatus)
onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  if (syncPollTimer) clearInterval(syncPollTimer)
  disconnectStatusSocket()
})

watch(latestUpdate, (update) => {
  if (!update) return
  const next = [...reportedStatuses.value]
  const existing = next.findIndex((item) => normalizeName(item.ip_address) === normalizeName(update.ip_address))
  const status = {
    device_name: update.device_name,
    ip_address: update.ip_address,
    status: update.status,
  }
  if (existing >= 0) next[existing] = { ...next[existing], ...status }
  else next.push(status)
  reportedStatuses.value = next
})
</script>
