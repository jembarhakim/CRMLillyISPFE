<script setup lang="ts">
import {
  notificationsAdminApi,
  type NotificationPreference,
  type NotificationTemplate,
  type QueuedNotification,
} from '@/api/admin/notifications'
import LucideIcon from '@/components/LucideIcon.vue'

definePageMeta({
  middleware: 'auth',
})

useHead({ title: 'WhatsApp Notifications - CRM System' })

const api = notificationsAdminApi()
const activeTab = ref<'templates' | 'queue' | 'preferences'>('templates')
const tabs: Array<{ id: 'templates' | 'queue' | 'preferences'; label: string; icon: string }> = [
  { id: 'templates', label: 'Template', icon: 'file-text' },
  { id: 'queue', label: 'Antrean & Log', icon: 'send' },
  { id: 'preferences', label: 'Reminder Pelanggan', icon: 'users' },
]
const notificationStatuses = [
  { id: 'queued', label: 'Antrean', tone: 'bg-gray-100 text-gray-700', marker: 'bg-gray-400' },
  { id: 'sending', label: 'Mengirim', tone: 'bg-amber-50 text-amber-700', marker: 'bg-amber-500' },
  { id: 'sent', label: 'Terkirim', tone: 'bg-blue-50 text-blue-700', marker: 'bg-blue-500' },
  { id: 'delivered', label: 'Diterima', tone: 'bg-emerald-50 text-emerald-700', marker: 'bg-emerald-500' },
  { id: 'failed', label: 'Gagal', tone: 'bg-red-50 text-red-700', marker: 'bg-red-500' },
]

const statusStyle = (status: string) =>
  notificationStatuses.find((item) => item.id === status)?.tone || 'bg-gray-100 text-gray-700'

const statusLabel = (status: string) =>
  notificationStatuses.find((item) => item.id === status)?.label || status
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const templates = ref<NotificationTemplate[]>([])
const notifications = ref<QueuedNotification[]>([])
const logs = ref<Array<{ id: string; notification_id: string; status: string; attempt: number; details: string; created_at: string }>>([])
const preferences = ref<NotificationPreference[]>([])
const summary = ref<{ counts: Record<string, number>; gateway: string; rate_limit_per_minute: number; max_retries: number } | null>(null)
const search = ref('')
const queueRefreshError = ref('')

const emptyTemplate = (): NotificationTemplate => ({
  key: '',
  name: '',
  category: 'custom',
  body: '',
  enabled: true,
})
const editor = ref<NotificationTemplate>(emptyTemplate())
const editing = ref(false)
const preview = ref('')
const sendTo = ref('')
const sendTemplateKey = ref('')
const sendVariables = ref('{}')
let searchTimer: ReturnType<typeof setTimeout> | undefined
let queueRefreshTimer: ReturnType<typeof setInterval> | undefined
let queueRefreshInProgress = false

const previewVariables = {
  nama_pelanggan: 'Pelanggan Contoh',
  no_invoice: 'INV-2026-001',
  no_tiket: 'TKT-001',
  total_tagihan: 'Rp150.000',
  paket: 'Internet 20 Mbps',
  tanggal_jatuh_tempo: '03-11-2026',
  jadwal_kunjungan: 'besok pukul 10.00',
  nama_teknisi: 'Teknisi Contoh',
  alamat: 'Jl. Contoh No. 1',
  telepon: '628123456789',
  link_pembayaran: 'https://example.com/invoice',
  link_maps: 'https://maps.google.com/',
  link_evaluasi: 'https://example.com/evaluasi',
  ringkasan: 'Internet pelanggan terputus',
}

async function loadData() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [summaryResult, templateResult, queueResult, logsResult, preferenceResult] = await Promise.all([
      api.getSummary(),
      api.getTemplates(),
      api.getQueue(),
      api.getLogs(),
      api.getPreferences(search.value),
    ])
    summary.value = summaryResult.data
    templates.value = templateResult.data || []
    notifications.value = queueResult.data || []
    logs.value = logsResult.data || []
    preferences.value = preferenceResult.data || []
    if (!sendTemplateKey.value && templates.value.length) sendTemplateKey.value = templates.value[0].key
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Gagal memuat notifikasi WhatsApp.'
  } finally {
    loading.value = false
  }
}

async function refreshQueueData() {
  if (queueRefreshInProgress) return
  queueRefreshInProgress = true
  try {
    const [summaryResult, queueResult, logsResult] = await Promise.all([
      api.getSummary(),
      api.getQueue(),
      api.getLogs(),
    ])
    summary.value = summaryResult.data
    notifications.value = queueResult.data || []
    logs.value = logsResult.data || []
    queueRefreshError.value = ''
  } catch (error) {
    queueRefreshError.value = error instanceof Error ? error.message : 'Gagal memperbarui status antrean.'
  } finally {
    queueRefreshInProgress = false
  }
}

function editTemplate(template: NotificationTemplate) {
  editor.value = { ...template }
  editing.value = true
  preview.value = ''
}

function newTemplate() {
  editor.value = emptyTemplate()
  editing.value = false
  preview.value = ''
}

async function saveTemplate() {
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await api.saveTemplate(editor.value, editing.value)
    successMessage.value = 'Template berhasil disimpan.'
    newTemplate()
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Template gagal disimpan.'
  } finally {
    saving.value = false
  }
}

async function deleteTemplate(key: string) {
  if (!confirm(`Hapus template "${key}"?`)) return
  try {
    await api.deleteTemplate(key)
    successMessage.value = 'Template berhasil dihapus.'
    if (editor.value.key === key) newTemplate()
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Template gagal dihapus.'
  }
}

async function previewTemplate() {
  errorMessage.value = ''
  try {
    const response = await api.preview(editor.value.body, previewVariables)
    preview.value = response.data.message
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Pratinjau gagal dibuat.'
  }
}

async function enqueueMessage() {
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const variables = JSON.parse(sendVariables.value || '{}') as Record<string, unknown>
    await api.enqueue(sendTo.value, sendTemplateKey.value, variables)
    successMessage.value = 'Pesan masuk ke antrean WhatsApp.'
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Pesan gagal dimasukkan ke antrean.'
  }
}

async function toggleReminder(preference: NotificationPreference) {
  const previous = preference.invoice_reminders_enabled
  preference.invoice_reminders_enabled = !previous
  try {
    await api.setPreference(preference)
    successMessage.value = `Reminder untuk ${preference.customer_name} ${preference.invoice_reminders_enabled ? 'diaktifkan' : 'dimatikan'}.`
  } catch (error) {
    preference.invoice_reminders_enabled = previous
    errorMessage.value = error instanceof Error ? error.message : 'Preferensi reminder gagal diperbarui.'
  }
}

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    try {
      const response = await api.getPreferences(search.value)
      preferences.value = response.data || []
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Gagal mencari pelanggan.'
    }
  }, 300)
})

watch(activeTab, (tab) => {
  if (queueRefreshTimer) {
    clearInterval(queueRefreshTimer)
    queueRefreshTimer = undefined
  }
  if (tab === 'queue') {
    void refreshQueueData()
    queueRefreshTimer = setInterval(() => {
      void refreshQueueData()
    }, 5000)
  }
})

onMounted(loadData)
onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
  if (queueRefreshTimer) clearInterval(queueRefreshTimer)
})
</script>

<template>
  <div class="w-full space-y-6">
    <AdminPageHeader
      title="Notifikasi WhatsApp"
      description="Kelola template pesan, pantau pengiriman, dan atur pengingat tagihan pelanggan."
      icon="message-circle"
      eyebrow="Pusat Komunikasi"
    >
      <template #actions>
        <button
          class="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loading"
          @click="loadData"
        >
          <LucideIcon name="refresh-cw" :size="16" :class="loading ? 'animate-spin' : ''" />
          {{ loading ? 'Memuat...' : 'Muat ulang' }}
        </button>
      </template>
    </AdminPageHeader>

    <div v-if="errorMessage" class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
      <LucideIcon name="alert-triangle" :size="18" class="mt-0.5 shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>
    <div v-if="successMessage" class="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">
      <LucideIcon name="check-circle" :size="18" class="mt-0.5 shrink-0" />
      <span>{{ successMessage }}</span>
    </div>
    <div v-if="activeTab === 'queue' && queueRefreshError" class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
      <LucideIcon name="alert-triangle" :size="18" class="mt-0.5 shrink-0" />
      <span>Gagal memperbarui status antrean: {{ queueRefreshError }}</span>
    </div>

    <section v-if="summary" aria-label="Ringkasan status pesan">
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div
          v-for="status in notificationStatuses"
          :key="status.id"
          class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm font-medium text-gray-500">{{ status.label }}</p>
            <span class="h-2.5 w-2.5 rounded-full" :class="status.marker"></span>
          </div>
          <p class="mt-2 text-3xl font-bold tracking-tight text-[#111111]">{{ summary.counts[status.id] || 0 }}</p>
        </div>
      </div>
      <div class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-[#A93133]/15 bg-[#F9EBEB]/60 px-4 py-3 text-xs text-gray-600">
        <span class="inline-flex items-center gap-2 font-semibold text-gray-800">
          <span class="h-2 w-2 rounded-full bg-[#A93133]"></span>
          Gateway {{ summary.gateway || 'local' }}
        </span>
        <span>Batas kirim <strong class="text-gray-800">{{ summary.rate_limit_per_minute }}/menit</strong></span>
        <span>Maksimum percobaan <strong class="text-gray-800">{{ summary.max_retries }}</strong></span>
      </div>
    </section>

    <nav class="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm" aria-label="Menu notifikasi">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition sm:px-4"
        :class="activeTab === tab.id ? 'bg-[#A93133] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
        :aria-current="activeTab === tab.id ? 'page' : undefined"
        @click="activeTab = tab.id"
      >
        <LucideIcon :name="tab.icon" :size="16" />
        {{ tab.label }}
      </button>
    </nav>

    <section v-if="activeTab === 'templates'" class="grid items-start gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div class="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 class="font-semibold text-gray-900">Template pesan</h2>
            <p class="mt-1 text-xs text-gray-500">{{ templates.length }} template tersedia</p>
          </div>
          <button
            class="inline-flex items-center gap-2 rounded-lg bg-[#A93133] px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
            @click="newTemplate"
          >
            <LucideIcon name="plus" :size="16" />
            Template baru
          </button>
        </div>
        <div class="divide-y divide-gray-100 px-5">
          <div v-for="template in templates" :key="template.key" class="flex items-start gap-3 py-4">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F9EBEB] text-[#A93133]">
              <LucideIcon name="file-text" :size="18" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <p class="font-semibold text-gray-900">{{ template.name }}</p>
                <span
                  class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  :class="template.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'"
                >
                  {{ template.enabled ? 'Aktif' : 'Nonaktif' }}
                </span>
              </div>
              <p class="mt-1 truncate text-xs text-gray-500">{{ template.key }} · {{ template.category }}</p>
              <p class="mt-2 line-clamp-2 text-sm leading-5 text-gray-600">{{ template.body }}</p>
            </div>
            <div class="flex shrink-0 flex-col gap-1 sm:flex-row">
              <button class="rounded-md px-2 py-1 text-sm font-medium text-[#A93133] transition hover:bg-[#F9EBEB]" @click="editTemplate(template)">Ubah</button>
              <button class="rounded-md px-2 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50" @click="deleteTemplate(template.key)">Hapus</button>
            </div>
          </div>
          <div v-if="!templates.length" class="flex flex-col items-center py-12 text-center">
            <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <LucideIcon name="file-text" :size="22" />
            </div>
            <p class="text-sm font-semibold text-gray-700">Belum ada template</p>
            <p class="mt-1 text-sm text-gray-500">Buat template pertama untuk mulai mengirim pesan.</p>
          </div>
        </div>
      </div>

      <form class="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6" @submit.prevent="saveTemplate">
        <div class="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-[#A93133]">{{ editing ? 'Pengaturan template' : 'Template baru' }}</p>
            <h2 class="mt-1 text-lg font-bold text-gray-900">{{ editing ? 'Ubah template pesan' : 'Buat template pesan' }}</h2>
          </div>
          <LucideIcon name="file-text" :size="20" class="mt-1 text-gray-400" />
        </div>

        <label class="block text-sm font-semibold text-gray-700">
          Key template
          <input
            v-model="editor.key"
            required
            :disabled="editing"
            pattern="[a-zA-Z0-9_-]+"
            class="notification-field mt-1.5 w-full rounded-lg border-gray-300 text-sm shadow-sm transition focus:border-[#A93133] focus:ring-[#A93133]"
            placeholder="contoh: promo_bulanan"
          >
          <span class="mt-1 block text-xs font-normal text-gray-500">Gunakan huruf, angka, garis bawah, atau tanda hubung.</span>
        </label>
        <label class="block text-sm font-semibold text-gray-700">
          Nama
          <input v-model="editor.name" required class="notification-field mt-1.5 w-full rounded-lg border-gray-300 text-sm shadow-sm transition focus:border-[#A93133] focus:ring-[#A93133]">
        </label>
        <label class="block text-sm font-semibold text-gray-700">
          Kategori
          <select v-model="editor.category" class="notification-field mt-1.5 w-full rounded-lg border-gray-300 text-sm shadow-sm transition focus:border-[#A93133] focus:ring-[#A93133]">
            <option value="custom">Custom</option>
            <option value="ticket">Ticket</option>
            <option value="work_order">Work order</option>
            <option value="invoice">Invoice</option>
          </select>
        </label>
        <label class="block text-sm font-semibold text-gray-700">
          Isi pesan
          <textarea
            v-model="editor.body"
            required
            rows="6"
            class="notification-field mt-1.5 w-full resize-y rounded-lg border-gray-300 text-sm leading-6 shadow-sm transition focus:border-[#A93133] focus:ring-[#A93133]"
            placeholder="Halo {{nama_pelanggan}}, tagihan {{no_invoice}}..."
          ></textarea>
        </label>
        <label class="flex cursor-pointer items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
          <input v-model="editor.enabled" type="checkbox" class="rounded border-gray-300 text-[#A93133] focus:ring-[#A93133]">
          <span class="font-medium">Template aktif</span>
        </label>
        <div class="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
          <button
            type="submit"
            :disabled="saving"
            class="inline-flex items-center gap-2 rounded-lg bg-[#A93133] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LucideIcon name="save" :size="16" />
            {{ saving ? 'Menyimpan...' : 'Simpan template' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            @click="previewTemplate"
          >
            <LucideIcon name="eye" :size="16" />
            Pratinjau
          </button>
        </div>
        <div v-if="preview" class="whitespace-pre-wrap rounded-xl border border-[#A93133]/15 bg-[#F9EBEB]/50 p-4 text-sm leading-6 text-gray-800">
          <p class="mb-2 flex items-center gap-2 font-semibold text-[#A93133]"><LucideIcon name="message-circle" :size="16" />Pratinjau pesan</p>
          {{ preview }}
        </div>
      </form>
    </section>

    <section v-else-if="activeTab === 'queue'" class="space-y-5">
      <form class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6" @submit.prevent="enqueueMessage">
        <div class="mb-5 flex items-start gap-3 border-b border-gray-100 pb-4">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F9EBEB] text-[#A93133]">
            <LucideIcon name="send" :size="18" />
          </div>
          <div>
            <h2 class="font-semibold text-gray-900">Kirim pesan manual</h2>
            <p class="mt-1 text-sm text-gray-500">Pesan akan ditambahkan ke antrean pengiriman WhatsApp.</p>
          </div>
        </div>
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label class="block text-sm font-semibold text-gray-700">
            Nomor WhatsApp
            <input v-model="sendTo" required class="notification-field mt-1.5 w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-[#A93133] focus:ring-[#A93133]" placeholder="08xx / 62xx">
          </label>
          <label class="block text-sm font-semibold text-gray-700">
            Template pesan
            <select v-model="sendTemplateKey" required class="notification-field mt-1.5 w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-[#A93133] focus:ring-[#A93133]">
              <option value="" disabled>Pilih template</option>
              <option v-for="template in templates.filter(item => item.enabled)" :key="template.key" :value="template.key">{{ template.name }}</option>
            </select>
          </label>
          <label class="block text-sm font-semibold text-gray-700 xl:col-span-2">
            Variabel pesan (JSON)
            <input v-model="sendVariables" class="notification-field mt-1.5 w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-[#A93133] focus:ring-[#A93133]" placeholder='{"nama_pelanggan":"Budi"}'>
          </label>
          <div class="flex items-end md:col-span-2 xl:col-span-4">
            <button type="submit" class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#A93133] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 sm:w-auto">
              <LucideIcon name="send" :size="16" />
              Masukkan ke antrean
            </button>
          </div>
        </div>
      </form>

      <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div class="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 class="font-semibold text-gray-900">Pesan terbaru</h2>
            <p class="mt-1 text-xs text-gray-500">Status pesan yang sedang atau sudah diproses.</p>
          </div>
          <span class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{{ notifications.length }} pesan</span>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100 text-left text-sm">
            <thead class="bg-gray-50/80 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th class="whitespace-nowrap px-4 py-3 sm:px-5">Penerima</th>
                <th class="px-4 py-3 sm:px-5">Template / pesan</th>
                <th class="whitespace-nowrap px-4 py-3 sm:px-5">Status</th>
                <th class="whitespace-nowrap px-4 py-3 sm:px-5">Percobaan</th>
                <th class="whitespace-nowrap px-4 py-3 sm:px-5">Waktu</th>
                <th class="px-4 py-3 sm:px-5">Error</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in notifications" :key="item.id" class="transition hover:bg-gray-50/70">
                <td class="whitespace-nowrap px-4 py-4 font-medium text-gray-900 sm:px-5">{{ item.recipient }}</td>
                <td class="max-w-md px-4 py-4 sm:px-5">
                  <span class="font-semibold text-gray-800">{{ item.template_key }}</span>
                  <p class="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{{ item.message }}</p>
                </td>
                <td class="whitespace-nowrap px-4 py-4 sm:px-5">
                  <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" :class="statusStyle(item.status)">{{ statusLabel(item.status) }}</span>
                </td>
                <td class="whitespace-nowrap px-4 py-4 text-gray-600 sm:px-5">{{ item.attempts }}/{{ item.max_attempts }}</td>
                <td class="whitespace-nowrap px-4 py-4 text-xs text-gray-500 sm:px-5">{{ new Date(item.created_at).toLocaleString('id-ID') }}</td>
                <td class="max-w-xs px-4 py-4 text-xs text-red-600 sm:px-5">{{ item.last_error || '-' }}</td>
              </tr>
              <tr v-if="!notifications.length">
                <td colspan="6" class="px-4 py-12 text-center">
                  <div class="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                    <LucideIcon name="archive-box" :size="20" />
                  </div>
                  <p class="mt-3 text-sm font-semibold text-gray-700">Antrean masih kosong</p>
                  <p class="mt-1 text-xs text-gray-500">Pesan WhatsApp terbaru akan muncul di sini.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div class="border-b border-gray-100 px-5 py-4">
          <h2 class="font-semibold text-gray-900">Log status pengiriman</h2>
          <p class="mt-1 text-xs text-gray-500">Riwayat perubahan status untuk pesan WhatsApp.</p>
        </div>
        <div class="max-h-96 divide-y divide-gray-100 overflow-auto">
          <div v-for="log in logs" :key="log.id" class="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 py-4 text-sm">
            <div class="flex min-w-0 items-start gap-3">
              <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" :class="notificationStatuses.find(item => item.id === log.status)?.marker || 'bg-gray-400'"></span>
              <div class="min-w-0">
                <p class="font-semibold text-gray-800">{{ statusLabel(log.status) }} · {{ log.notification_id }}</p>
                <p class="mt-1 text-xs leading-5 text-gray-600">{{ log.details }}</p>
              </div>
            </div>
            <p class="shrink-0 text-xs text-gray-500">Percobaan {{ log.attempt }} · {{ new Date(log.created_at).toLocaleString('id-ID') }}</p>
          </div>
          <div v-if="!logs.length" class="px-5 py-10 text-center text-sm text-gray-500">Belum ada log pengiriman.</div>
        </div>
      </div>
    </section>

    <section v-else class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div class="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 class="font-semibold text-gray-900">Pengingat tagihan pelanggan</h2>
          <p class="mt-1 max-w-2xl text-sm leading-5 text-gray-500">
            Pelanggan baru menerima reminder secara default. Pengaturan ini hanya berlaku untuk reminder tagihan.
          </p>
        </div>
        <label class="relative block w-full sm:max-w-xs">
          <LucideIcon name="search" :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input v-model="search" class="notification-field w-full rounded-lg border-gray-300 py-2.5 pl-9 pr-3 text-sm shadow-sm focus:border-[#A93133] focus:ring-[#A93133]" placeholder="Cari nama atau nomor telepon">
        </label>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-100 text-left text-sm">
          <thead class="bg-gray-50/80 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th class="px-5 py-3">Pelanggan</th>
              <th class="px-5 py-3">Nomor WhatsApp</th>
              <th class="px-5 py-3">Reminder tagihan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="preference in preferences" :key="preference.customer_id" class="transition hover:bg-gray-50/70">
              <td class="px-5 py-4 font-semibold text-gray-800">{{ preference.customer_name }}</td>
              <td class="whitespace-nowrap px-5 py-4 text-gray-600">{{ preference.phone }}</td>
              <td class="px-5 py-4">
                <button
                  class="inline-flex min-w-24 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition"
                  :class="preference.invoice_reminders_enabled ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                  @click="toggleReminder(preference)"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="preference.invoice_reminders_enabled ? 'bg-emerald-500' : 'bg-gray-400'"></span>
                  {{ preference.invoice_reminders_enabled ? 'Aktif' : 'Nonaktif' }}
                </button>
              </td>
            </tr>
            <tr v-if="!preferences.length">
              <td colspan="3" class="px-5 py-12 text-center">
                <div class="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <LucideIcon name="users" :size="20" />
                </div>
                <p class="mt-3 text-sm font-semibold text-gray-700">Pelanggan tidak ditemukan</p>
                <p class="mt-1 text-xs text-gray-500">Coba gunakan kata kunci pencarian lain.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.notification-field {
  color-scheme: light;
  background-color: #fff !important;
  color: #111827 !important;
}

.notification-field::placeholder {
  color: #9ca3af !important;
  opacity: 1;
}

.notification-field:disabled {
  background-color: #f3f4f6 !important;
  color: #6b7280 !important;
}
</style>
