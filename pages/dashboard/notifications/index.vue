<script setup lang="ts">
import {
  notificationsAdminApi,
  type NotificationPreference,
  type NotificationTemplate,
  type QueuedNotification,
} from '@/api/admin/notifications'

definePageMeta({
  middleware: 'auth',
  layout: 'navbar',
})

useHead({ title: 'WhatsApp Notifications - CRM System' })

const api = notificationsAdminApi()
const activeTab = ref<'templates' | 'queue' | 'preferences'>('templates')
const tabs: Array<{ id: 'templates' | 'queue' | 'preferences'; label: string }> = [
  { id: 'templates', label: 'Template' },
  { id: 'queue', label: 'Antrean & Log' },
  { id: 'preferences', label: 'Reminder Pelanggan' },
]
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

onMounted(loadData)
onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Notifikasi WhatsApp</h1>
        <p class="mt-1 text-sm text-gray-600">Kelola template, antrean pesan, dan pengingat tagihan.</p>
      </div>
      <button class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50" :disabled="loading" @click="loadData">
        {{ loading ? 'Memuat...' : 'Muat ulang' }}
      </button>
    </header>

    <div v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ errorMessage }}</div>
    <div v-if="successMessage" class="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{{ successMessage }}</div>

    <section v-if="summary" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div v-for="status in ['queued', 'sending', 'sent', 'delivered', 'failed']" :key="status" class="rounded-xl border bg-white p-4 shadow-sm">
        <p class="text-sm capitalize text-gray-500">{{ status }}</p>
        <p class="mt-1 text-2xl font-semibold text-gray-900">{{ summary.counts[status] || 0 }}</p>
      </div>
      <p class="text-xs text-gray-500 sm:col-span-2 lg:col-span-5">
        Gateway: {{ summary.gateway || 'local' }} · Batas kirim {{ summary.rate_limit_per_minute }}/menit · Maksimum {{ summary.max_retries }} percobaan
      </p>
    </section>

    <nav class="flex gap-2 border-b">
      <button v-for="tab in tabs" :key="tab.id"
        class="border-b-2 px-4 py-3 text-sm font-medium"
        :class="activeTab === tab.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'"
        @click="activeTab = tab.id">
        {{ tab.label }}
      </button>
    </nav>

    <section v-if="activeTab === 'templates'" class="grid gap-6 lg:grid-cols-2">
      <div class="rounded-xl border bg-white p-5 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold">Template pesan</h2>
          <button class="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100" @click="newTemplate">Template baru</button>
        </div>
        <div class="divide-y">
          <div v-for="template in templates" :key="template.key" class="flex items-start justify-between gap-3 py-3">
            <div class="min-w-0">
              <p class="font-medium text-gray-900">{{ template.name }}</p>
              <p class="text-xs text-gray-500">{{ template.key }} · {{ template.category }} · {{ template.enabled ? 'Aktif' : 'Nonaktif' }}</p>
              <p class="mt-1 line-clamp-2 text-sm text-gray-600">{{ template.body }}</p>
            </div>
            <div class="flex shrink-0 gap-2">
              <button class="text-sm text-blue-700 hover:underline" @click="editTemplate(template)">Ubah</button>
              <button class="text-sm text-red-600 hover:underline" @click="deleteTemplate(template.key)">Hapus</button>
            </div>
          </div>
          <p v-if="!templates.length" class="py-5 text-sm text-gray-500">Belum ada template.</p>
        </div>
      </div>

      <form class="space-y-4 rounded-xl border bg-white p-5 shadow-sm" @submit.prevent="saveTemplate">
        <h2 class="text-lg font-semibold">{{ editing ? 'Ubah template' : 'Buat template' }}</h2>
        <label class="block text-sm font-medium text-gray-700">Key
          <input v-model="editor.key" required :disabled="editing" pattern="[a-zA-Z0-9_-]+" class="mt-1 w-full rounded-lg border-gray-300 text-sm disabled:bg-gray-100" placeholder="contoh: promo_bulanan">
        </label>
        <label class="block text-sm font-medium text-gray-700">Nama
          <input v-model="editor.name" required class="mt-1 w-full rounded-lg border-gray-300 text-sm">
        </label>
        <label class="block text-sm font-medium text-gray-700">Kategori
          <select v-model="editor.category" class="mt-1 w-full rounded-lg border-gray-300 text-sm">
            <option value="custom">Custom</option><option value="ticket">Ticket</option><option value="work_order">Work order</option><option value="invoice">Invoice</option>
          </select>
        </label>
        <label class="block text-sm font-medium text-gray-700">Isi pesan
          <textarea v-model="editor.body" required rows="6" class="mt-1 w-full rounded-lg border-gray-300 text-sm" placeholder="Halo {{nama_pelanggan}}, tagihan {{no_invoice}}..."></textarea>
        </label>
        <label class="flex items-center gap-2 text-sm text-gray-700"><input v-model="editor.enabled" type="checkbox" class="rounded border-gray-300"> Template aktif</label>
        <div class="flex flex-wrap gap-2">
          <button type="submit" :disabled="saving" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{{ saving ? 'Menyimpan...' : 'Simpan template' }}</button>
          <button type="button" class="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50" @click="previewTemplate">Pratinjau</button>
        </div>
        <div v-if="preview" class="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-800"><strong>Pratinjau pesan</strong><br>{{ preview }}</div>
      </form>
    </section>

    <section v-else-if="activeTab === 'queue'" class="space-y-6">
      <form class="grid gap-3 rounded-xl border bg-white p-5 shadow-sm md:grid-cols-4" @submit.prevent="enqueueMessage">
        <h2 class="text-lg font-semibold md:col-span-4">Kirim pesan manual</h2>
        <input v-model="sendTo" required class="rounded-lg border-gray-300 text-sm" placeholder="Nomor WhatsApp (08xx / 62xx)">
        <select v-model="sendTemplateKey" required class="rounded-lg border-gray-300 text-sm">
          <option value="" disabled>Pilih template</option>
          <option v-for="template in templates.filter(item => item.enabled)" :key="template.key" :value="template.key">{{ template.name }}</option>
        </select>
        <input v-model="sendVariables" class="rounded-lg border-gray-300 text-sm md:col-span-1" placeholder='Variabel JSON, mis. {"nama_pelanggan":"Budi"}'>
        <button type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Masukkan antrean</button>
      </form>

      <div class="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div class="border-b p-4"><h2 class="font-semibold">Pesan terbaru</h2></div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y text-left text-sm">
            <thead class="bg-gray-50 text-xs uppercase text-gray-500"><tr><th class="px-4 py-3">Penerima</th><th class="px-4 py-3">Template / pesan</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Percobaan</th><th class="px-4 py-3">Waktu</th><th class="px-4 py-3">Error</th></tr></thead>
            <tbody class="divide-y">
              <tr v-for="item in notifications" :key="item.id">
                <td class="whitespace-nowrap px-4 py-3">{{ item.recipient }}</td><td class="max-w-md px-4 py-3"><span class="font-medium">{{ item.template_key }}</span><p class="line-clamp-2 text-xs text-gray-500">{{ item.message }}</p></td>
                <td class="px-4 py-3"><span class="rounded-full bg-gray-100 px-2 py-1 text-xs capitalize">{{ item.status }}</span></td><td class="px-4 py-3">{{ item.attempts }}/{{ item.max_attempts }}</td><td class="whitespace-nowrap px-4 py-3">{{ new Date(item.created_at).toLocaleString('id-ID') }}</td><td class="max-w-xs px-4 py-3 text-xs text-red-600">{{ item.last_error || '-' }}</td>
              </tr>
              <tr v-if="!notifications.length"><td colspan="6" class="px-4 py-6 text-center text-gray-500">Antrean masih kosong.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div class="border-b p-4"><h2 class="font-semibold">Log status pengiriman</h2></div>
        <div class="max-h-80 overflow-auto divide-y">
          <div v-for="log in logs" :key="log.id" class="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
            <span class="font-medium capitalize">{{ log.status }} · {{ log.notification_id }}</span><span class="text-gray-500">Percobaan {{ log.attempt }} · {{ new Date(log.created_at).toLocaleString('id-ID') }}</span><p class="w-full text-xs text-gray-600">{{ log.details }}</p>
          </div>
          <p v-if="!logs.length" class="p-4 text-sm text-gray-500">Belum ada log pengiriman.</p>
        </div>
      </div>
    </section>

    <section v-else class="space-y-4 rounded-xl border bg-white p-5 shadow-sm">
      <div>
        <h2 class="text-lg font-semibold">Pengingat tagihan pelanggan</h2>
        <p class="text-sm text-gray-600">Pelanggan baru menerima reminder secara default. Perubahan berikut hanya berlaku untuk reminder tagihan.</p>
      </div>
      <input v-model="search" class="w-full max-w-md rounded-lg border-gray-300 text-sm" placeholder="Cari nama atau nomor telepon">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y text-left text-sm">
          <thead class="bg-gray-50 text-xs uppercase text-gray-500"><tr><th class="px-4 py-3">Pelanggan</th><th class="px-4 py-3">Nomor WhatsApp</th><th class="px-4 py-3">Reminder tagihan</th></tr></thead>
          <tbody class="divide-y">
            <tr v-for="preference in preferences" :key="preference.customer_id">
              <td class="px-4 py-3 font-medium">{{ preference.customer_name }}</td><td class="px-4 py-3">{{ preference.phone }}</td>
              <td class="px-4 py-3"><button class="rounded-full px-3 py-1 text-xs font-medium" :class="preference.invoice_reminders_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'" @click="toggleReminder(preference)">{{ preference.invoice_reminders_enabled ? 'Aktif' : 'Nonaktif' }}</button></td>
            </tr>
            <tr v-if="!preferences.length"><td colspan="3" class="px-4 py-6 text-center text-gray-500">Pelanggan tidak ditemukan.</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
