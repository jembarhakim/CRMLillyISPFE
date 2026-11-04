<script setup lang="ts">
import {
  ticketsCustomerApi,
  type CustomerTicket,
  type CustomerTicketDetail,
  type TroubleTypeOption,
} from '@/api/customer/tickets'
import { ticketStageStyle, formatDateTimeID } from '@/helper/customerPortal'
import { card, sectionGap, sectionLabel, field, fieldLabel, buttonPrimary } from '@/helper/portalTheme'

useHead({ title: 'Keluhan Saya - Lilly Networks' })
definePageMeta({ ssr: false })

const toast = useCustomToast()

// --- State -----------------------------------------------------------------
const tickets = ref<CustomerTicket[]>([])
const troubleTypes = ref<TroubleTypeOption[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const isUploading = ref(false)

const showForm = ref(false)
const formError = ref('')

const form = reactive({
  title: '',
  description: '',
  trouble_type_id: '',
  image_filename: '',
  image_preview: '',
})

const fileInput = ref<HTMLInputElement | null>(null)

// Detail drawer (tracking timeline)
const selectedTicket = ref<CustomerTicketDetail | null>(null)
const isDetailOpen = ref(false)
const isLoadingDetail = ref(false)

// Realtime polling: the staff workflow updates statuses server side, so the
// portal refreshes the list periodically while the page is visible.
const POLL_INTERVAL_MS = 20000
let pollTimer: ReturnType<typeof setInterval> | null = null

const stages = [
  { stage: 'received', label: 'Tiket Diterima' },
  { stage: 'scheduled', label: 'Teknisi Dijadwalkan' },
  { stage: 'handling', label: 'Dalam Penanganan' },
  { stage: 'done', label: 'Selesai' },
]

const summary = computed(() => ({
  total: tickets.value.length,
  active: tickets.value.filter((t) => t.stage !== 'done').length,
  done: tickets.value.filter((t) => t.stage === 'done').length,
}))

// --- Data loading ----------------------------------------------------------
async function loadTickets(silent = false) {
  if (!silent) isLoading.value = true
  try {
    const response = await ticketsCustomerApi().getTickets()
    tickets.value = response?.data || []
  } catch (error: any) {
    if (!silent) toast.error('Gagal memuat keluhan', error?.message)
  } finally {
    isLoading.value = false
  }
}

async function loadTroubleTypes() {
  try {
    const response = await ticketsCustomerApi().getTroubleTypes()
    troubleTypes.value = response?.data || []
  } catch (error) {
    // Lookup failure is not fatal: the type select simply stays empty.
    troubleTypes.value = []
  }
}

function startPolling() {
  stopPolling()
  pollTimer = setInterval(() => {
    if (document.visibilityState === 'visible') {
      loadTickets(true)
      if (isDetailOpen.value && selectedTicket.value) {
        refreshDetail(selectedTicket.value.id, true)
      }
    }
  }, POLL_INTERVAL_MS)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

onMounted(async () => {
  await Promise.all([loadTickets(), loadTroubleTypes()])
  startPolling()
})

onUnmounted(stopPolling)

// --- Upload + submit -------------------------------------------------------
function pickFile() {
  fileInput.value?.click()
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // Client side guard: the API enforces the same limits.
  if (!file.type.startsWith('image/')) {
    formError.value = 'Lampiran harus berupa gambar (JPG, PNG, atau WEBP)'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    formError.value = 'Ukuran gambar maksimum 5MB'
    return
  }

  formError.value = ''
  isUploading.value = true
  try {
    const response = await ticketsCustomerApi().uploadAttachment(file)
    form.image_filename = response.data.filename
    form.image_preview = URL.createObjectURL(file)
  } catch (error: any) {
    formError.value = error?.message || 'Gagal mengunggah lampiran'
  } finally {
    isUploading.value = false
    input.value = ''
  }
}

function removeAttachment() {
  if (form.image_preview) URL.revokeObjectURL(form.image_preview)
  form.image_filename = ''
  form.image_preview = ''
}

function resetForm() {
  removeAttachment()
  form.title = ''
  form.description = ''
  form.trouble_type_id = ''
  formError.value = ''
}

async function submitTicket() {
  formError.value = ''

  if (form.title.trim().length < 5) {
    formError.value = 'Judul keluhan minimal 5 karakter'
    return
  }
  if (form.description.trim().length < 10) {
    formError.value = 'Jelaskan kendala Anda minimal 10 karakter'
    return
  }

  isSubmitting.value = true
  try {
    await ticketsCustomerApi().createTicket({
      title: form.title.trim(),
      description: form.description.trim(),
      trouble_type_id: form.trouble_type_id || undefined,
      image_filename: form.image_filename || undefined,
    })
    toast.success('Keluhan terkirim', 'Tim kami akan menghubungi Anda melalui WhatsApp.')
    resetForm()
    showForm.value = false
    await loadTickets()
  } catch (error: any) {
    formError.value = error?.message || 'Gagal mengirim keluhan'
  } finally {
    isSubmitting.value = false
  }
}

// --- Detail ----------------------------------------------------------------
async function refreshDetail(id: number, silent = false) {
  if (!silent) {
    isDetailOpen.value = true
    isLoadingDetail.value = true
  }
  try {
    const response = await ticketsCustomerApi().getTicket(id)
    selectedTicket.value = response.data
  } catch (error: any) {
    if (!silent) toast.error('Gagal memuat detail tiket', error?.message)
  } finally {
    isLoadingDetail.value = false
  }
}

function openDetail(ticket: CustomerTicket) {
  selectedTicket.value = null
  refreshDetail(ticket.id)
}
</script>

<template>
  <CustomerPortalShell title="Keluhan & Gangguan" subtitle="Laporkan kendala internet Anda" back-to="/customer">
    <!-- Summary: one compact strip -->
    <div :class="[card, 'mb-5 !py-3']">
      <div class="flex items-center justify-between text-xs">
        <div class="flex items-center gap-1.5">
          <LucideIcon name="ticket" :size="14" class="text-gray-400" />
          <span class="text-gray-500">Total <strong class="text-gray-900">{{ summary.total }}</strong></span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-gray-500">Diproses <strong class="text-gray-900">{{ summary.active }}</strong></span>
          <span class="text-gray-500">Selesai <strong class="text-green-600">{{ summary.done }}</strong></span>
        </div>
      </div>
    </div>

    <!-- Toggle form -->
    <button
      v-if="!showForm"
      type="button"
      :class="[buttonPrimary, 'mb-5']"
      @click="showForm = true"
    >
      <LucideIcon name="plus" :size="16" />
      Buat Keluhan Baru
    </button>

    <!-- ================= Create form ================= -->
    <div v-else :class="[card, 'mb-5 space-y-4']">
      <div class="flex items-center justify-between">
        <h2 class="font-bold text-gray-800">Keluhan Baru</h2>
        <UButton color="gray" variant="ghost" size="xs" @click="showForm = false; resetForm()">
          <LucideIcon name="x" :size="16" />
        </UButton>
      </div>

      <label class="block">
        <span :class="fieldLabel">Jenis Kendala</span>
        <select v-model="form.trouble_type_id" :class="field">
          <option value="">Pilih jenis kendala (opsional)</option>
          <option v-for="type in troubleTypes" :key="type.id" :value="type.id">
            {{ type.name || type.id }}
          </option>
        </select>
      </label>

      <label class="block">
        <span :class="fieldLabel">Judul Keluhan</span>
        <input
          v-model="form.title"
          type="text"
          maxlength="150"
          placeholder="Contoh: Internet mati sejak pagi"
          :class="field"
        />
      </label>

      <label class="block">
        <span :class="fieldLabel">Penjelasan</span>
        <textarea
          v-model="form.description"
          rows="4"
          maxlength="1000"
          placeholder="Jelaskan kendala yang Anda alami, kapan mulai terjadi, dan hal lain yang perlu kami ketahui."
          :class="field"
        ></textarea>
      </label>

      <!-- Attachment -->
      <div>
        <span :class="[fieldLabel, '!mb-0']">Foto / Lampiran (opsional)</span>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onFileChange"
        />

        <div v-if="form.image_preview" class="mt-2 relative inline-block">
          <img
            :src="form.image_preview"
            alt="Lampiran keluhan"
            class="h-24 w-24 object-cover rounded-lg border border-gray-200"
          />
          <button
            type="button"
            class="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
            @click="removeAttachment"
          >
            <LucideIcon name="x" :size="12" />
          </button>
        </div>

        <UButton
          v-else
          color="gray"
          variant="outline"
          size="sm"
          class="mt-2"
          :loading="isUploading"
          @click="pickFile"
        >
          <LucideIcon name="upload" :size="14" class="mr-1" />
          {{ isUploading ? 'Mengunggah...' : 'Pilih Foto' }}
        </UButton>
      </div>

      <p v-if="formError" class="text-sm text-red-600 flex items-start gap-1">
        <LucideIcon name="alert-triangle" :size="16" class="mt-0.5 shrink-0" />
        <span>{{ formError }}</span>
      </p>

      <UButton
        block
        size="lg"
        color="green"
        :loading="isSubmitting"
        :disabled="isUploading"
        @click="submitTicket"
      >
        <LucideIcon name="send" :size="16" class="mr-1" />
        Kirim Keluhan
      </UButton>
    </div>

    <!-- ================= History ================= -->
    <h2 :class="[sectionLabel, 'mb-3']">
      Riwayat Keluhan
    </h2>

    <div v-if="isLoading" :class="[card, 'py-10 text-center']">
      <div class="animate-spin rounded-full h-7 w-7 border-2 border-gray-200 border-t-[#A93133] mx-auto mb-3"></div>
      <p class="text-xs text-gray-500">Memuat riwayat keluhan...</p>
    </div>

    <div v-else-if="tickets.length === 0" :class="[card, 'py-10 text-center']">
      <LucideIcon name="ticket" :size="32" class="mx-auto text-gray-300 mb-2" />
      <p class="text-xs text-gray-500 leading-relaxed px-4">
        Belum ada keluhan. Internet bermasalah? Laporkan lewat tombol di atas.
      </p>
    </div>

    <div v-else :class="sectionGap">
      <button
        v-for="ticket in tickets"
        :key="ticket.id"
        type="button"
        :class="[card, 'w-full text-left hover:border-gray-300 transition-colors']"
        @click="openDetail(ticket)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-[11px] text-gray-400">{{ ticket.ticket_number }}</p>
            <p class="text-sm font-semibold text-gray-900 truncate mt-0.5">{{ ticket.title }}</p>
            <p class="text-xs text-gray-500 mt-1">
              {{ ticket.trouble_type_name || 'Kendala umum' }} · {{ formatDateTimeID(ticket.created_at) }}
            </p>
          </div>
          <UBadge
            size="sm"
            class="shrink-0"
            :color="ticketStageStyle(ticket.stage).color"
            :label="ticket.stage_label || ticketStageStyle(ticket.stage).label"
          />
        </div>

        <!-- Compact 4 step progress -->
        <div class="flex items-center gap-1 mt-3">
          <div
            v-for="(step, index) in stages"
            :key="step.stage"
            class="flex-1 h-1 rounded-full"
            :class="ticket.stage_step > index ? 'bg-[#A93133]' : 'bg-gray-200'"
          ></div>
        </div>
        <p class="text-[11px] text-gray-500 mt-2">
          Tahap {{ ticket.stage_step }} dari 4 · {{ ticket.stage_label }}
        </p>
      </button>
    </div>

    <!-- ================= Detail drawer ================= -->
    <div
      v-if="isDetailOpen"
      class="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center"
      @click.self="isDetailOpen = false"
    >
      <div class="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h3 class="font-bold text-gray-800">Detail Keluhan</h3>
          <UButton color="gray" variant="ghost" size="xs" @click="isDetailOpen = false">
            <LucideIcon name="x" :size="18" />
          </UButton>
        </div>

        <div v-if="isLoadingDetail" class="p-10 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>

        <div v-else-if="selectedTicket" class="p-4 space-y-4">
          <div>
            <p class="text-xs text-gray-400">{{ selectedTicket.ticket_number }}</p>
            <p class="font-semibold text-gray-800">{{ selectedTicket.title }}</p>
            <p class="text-xs text-gray-500 mt-1">
              {{ selectedTicket.trouble_type_name || 'Kendala umum' }} ·
              {{ formatDateTimeID(selectedTicket.created_at) }}
            </p>
          </div>

          <UBadge
            size="sm"
            :color="ticketStageStyle(selectedTicket.stage).color"
            :label="selectedTicket.stage_label"
          />

          <p v-if="selectedTicket.description" class="text-sm text-gray-700 whitespace-pre-line">
            {{ selectedTicket.description }}
          </p>

          <img
            v-if="selectedTicket.image_url"
            :src="selectedTicket.image_url"
            alt="Lampiran keluhan"
            class="w-full max-h-56 object-contain rounded-lg border border-gray-200"
          />

          <!-- Tracking timeline -->
          <div>
            <p class="text-sm font-semibold text-gray-800 mb-2">Pelacakan</p>
            <ol class="relative border-l border-gray-200 ml-2 space-y-4">
              <li v-for="entry in selectedTicket.timeline" :key="entry.stage" class="ml-4">
                <span
                  class="absolute -left-[7px] w-3.5 h-3.5 rounded-full border-2"
                  :class="entry.reached ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'"
                ></span>
                <p
                  class="text-sm font-medium"
                  :class="entry.reached ? 'text-gray-800' : 'text-gray-400'"
                >
                  {{ entry.stage_label }}
                </p>
                <p v-if="entry.at" class="text-xs text-gray-500">{{ formatDateTimeID(entry.at) }}</p>
                <p v-if="entry.note" class="text-xs text-gray-500 italic mt-0.5">{{ entry.note }}</p>
              </li>
            </ol>
          </div>

          <p class="text-[11px] text-gray-400 text-center">
            Status diperbarui otomatis setiap 20 detik.
          </p>
        </div>
      </div>
    </div>
  </CustomerPortalShell>
</template>
