<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import {
    ticketsCustomerApi,
    type CustomerTicket,
    type CustomerTicketDetail,
    type TroubleTypeOption,
} from '@/api/customer/tickets'
import { ticketStageStyle, formatDateTimeID } from '@/helper/customerPortal'
import { useCustomToast } from '@/composables/useCustomToast'

const toast = useCustomToast()

const tickets = ref<CustomerTicket[]>([])
const troubleTypes = ref<TroubleTypeOption[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const isUploading = ref(false)

const stageFilter = ref<'all' | 'active' | 'done'>('all')
const formError = ref('')

const form = reactive({
    title: '',
    description: '',
    trouble_type_id: '',
    image_filename: '',
    image_preview: '',
})

const fileInput = ref<HTMLInputElement | null>(null)
const selectedTicket = ref<CustomerTicketDetail | null>(null)
const isDetailOpen = ref(false)
const isLoadingDetail = ref(false)

const POLL_INTERVAL_MS = 20000
let pollTimer: ReturnType<typeof setInterval> | null = null

const stages = [
    { stage: 'received', label: 'Tiket Diterima', desc: 'Laporan masuk ke sistem NOC' },
    { stage: 'scheduled', label: 'Teknisi Dijadwalkan', desc: 'Penugasan tim lapangan' },
    { stage: 'handling', label: 'Dalam Penanganan', desc: 'Perbaikan jaringan berlangsung' },
    { stage: 'done', label: 'Selesai', desc: 'Koneksi kembali normal' },
]

const summary = computed(() => ({
    total: tickets.value.length,
    active: tickets.value.filter((t) => t.stage !== 'done').length,
    done: tickets.value.filter((t) => t.stage === 'done').length,
}))

const filteredTickets = computed(() => {
    if (stageFilter.value === 'active') return tickets.value.filter((t) => t.stage !== 'done')
    if (stageFilter.value === 'done') return tickets.value.filter((t) => t.stage === 'done')
    return tickets.value
})

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
    } catch {
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

function pickFile() {
    fileInput.value?.click()
}

async function onFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

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
        toast.success('Keluhan terkirim', 'Tim kami akan segera menangani laporan Anda.')
        resetForm()
        await loadTickets()
    } catch (error: any) {
        formError.value = error?.message || 'Gagal mengirim keluhan'
    } finally {
        isSubmitting.value = false
    }
}

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
    <div class="space-y-6">
        <!-- ===== BARIS 1: Filter Pill Kiri & 3 Stat Pill Kanan (Persis Design 1) ===== -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="flex flex-wrap items-center gap-3">
                <div
                    class="bg-white rounded-full px-4 py-2 shadow-sm border border-white flex items-center gap-2 text-xs">
                    <span class="text-gray-500">Saring Status:</span>
                    <select v-model="stageFilter"
                        class="font-bold text-gray-900 bg-transparent focus:outline-none cursor-pointer">
                        <option value="all">Semua Tiket</option>
                        <option value="active">Sedang Diproses</option>
                        <option value="done">Selesai</option>
                    </select>
                </div>

                <div
                    class="bg-white rounded-full px-4 py-2 shadow-sm border border-white flex items-center gap-2 text-xs">
                    <span class="text-gray-500">Muat Ulang Otomatis:</span>
                    <span class="font-bold text-[#A93133]">20 Detik</span>
                </div>

                <button @click="loadTickets()"
                    class="bg-white rounded-full px-4 py-2 shadow-sm border border-white flex items-center gap-1.5 text-xs font-bold text-gray-800 hover:text-[#A93133]">
                    <LucideIcon name="refresh-cw" :size="12" :class="isLoading ? 'animate-spin' : ''" />
                    <span>Muat Ulang</span>
                </button>
            </div>

            <!-- 3 Stat Pills -->
            <div class="grid grid-cols-3 gap-3">
                <div
                    class="bg-white rounded-full px-5 py-2 shadow-sm border border-white flex items-center justify-between gap-3">
                    <span class="text-xs text-gray-500 font-medium">Jumlah</span>
                    <span class="text-base sm:text-lg font-extrabold text-gray-900">{{ summary.total }}</span>
                </div>
                <div
                    class="bg-white rounded-full px-5 py-2 shadow-sm border border-white flex items-center justify-between gap-3">
                    <span class="text-xs text-gray-500 font-medium">Proses</span>
                    <span class="text-base sm:text-lg font-extrabold text-[#A93133]">{{ summary.active }}</span>
                </div>
                <div
                    class="bg-white rounded-full px-5 py-2 shadow-sm border border-white flex items-center justify-between gap-3">
                    <span class="text-xs text-gray-500 font-medium">Selesai</span>
                    <span class="text-base sm:text-lg font-extrabold text-green-600">{{ summary.done }}</span>
                </div>
            </div>
        </div>

        <!-- ===== BARIS 2: 2 Kartu Besar Berdampingan (Form Buat Tiket & Tahapan SLA) ===== -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Kiri: Form Buat Keluhan Baru -->
            <div
                class="bg-white rounded-3xl p-6 shadow-[0_10px_25px_rgb(169,49,51,0.05)] border border-white space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                    <h3 class="text-xs sm:text-sm font-bold text-gray-700">Formulir Laporan Gangguan Baru</h3>
                    <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F9EBEB] text-[#A93133]">PRIORITAS
                        NOC</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label class="block">
                        <span class="text-xs font-semibold text-gray-600">Jenis Kendala</span>
                        <select v-model="form.trouble_type_id"
                            class="mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#A93133]">
                            <option value="">Kendala Umum</option>
                            <option v-for="type in troubleTypes" :key="type.id" :value="type.id">
                                {{ type.name || type.id }}
                            </option>
                        </select>
                    </label>

                    <label class="block">
                        <span class="text-xs font-semibold text-gray-600">Judul Keluhan</span>
                        <input v-model="form.title" type="text" maxlength="150"
                            placeholder="Cth: Lampu LOS merah berkedip"
                            class="mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#A93133]" />
                    </label>
                </div>

                <label class="block">
                    <span class="text-xs font-semibold text-gray-600">Detail Kendala</span>
                    <textarea v-model="form.description" rows="3" maxlength="1000"
                        placeholder="Ceritakan kronologi kendala internet yang Anda alami..."
                        class="mt-1 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#A93133]"></textarea>
                </label>

                <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div>
                        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
                        <div v-if="form.image_preview" class="relative inline-block">
                            <img :src="form.image_preview" alt="Lampiran"
                                class="h-12 w-12 object-cover rounded-xl border border-gray-200" />
                            <button type="button"
                                class="absolute -top-1.5 -right-1.5 bg-[#A93133] text-white rounded-full p-0.5"
                                @click="removeAttachment">
                                <LucideIcon name="x" :size="11" />
                            </button>
                        </div>
                        <button v-else type="button" :disabled="isUploading" @click="pickFile"
                            class="px-4 py-2 rounded-full border border-gray-200 text-xs font-semibold text-gray-700 hover:border-[#A93133] hover:text-[#A93133] inline-flex items-center gap-1.5 transition-colors">
                            <LucideIcon name="camera" :size="13" />
                            <span>{{ isUploading ? 'Mengunggah...' : 'Lampirkan Foto Modem' }}</span>
                        </button>
                    </div>

                    <button type="button" :disabled="isSubmitting || isUploading" @click="submitTicket"
                        class="px-6 py-2.5 rounded-full bg-[#A93133] hover:bg-[#8F2729] text-white text-xs font-bold shadow-md shadow-[#A93133]/20 transition-all disabled:opacity-50 inline-flex items-center gap-1.5">
                        <LucideIcon name="send" :size="13" />
                        <span>{{ isSubmitting ? 'Mengirim...' : 'Kirim Laporan' }}</span>
                    </button>
                </div>

                <p v-if="formError" class="text-xs text-[#A93133] font-medium flex items-center gap-1.5">
                    <LucideIcon name="alert-triangle" :size="14" />
                    <span>{{ formError }}</span>
                </p>
            </div>

            <!-- Kanan: Visual Alur Penanganan Tiket (Ala Cara Berlangganan di Landing Page) -->
            <div
                class="bg-white rounded-3xl p-6 shadow-[0_10px_25px_rgb(169,49,51,0.05)] border border-white flex flex-col justify-between">
                <div>
                    <h3 class="text-xs sm:text-sm font-bold text-gray-700 pb-3 border-b border-gray-100">
                        Alur Penanganan Gangguan Terpadu (Waktu Nyata)
                    </h3>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
                        <div v-for="(step, idx) in stages" :key="step.stage"
                            class="p-3.5 rounded-2xl bg-[#F9EBEB]/40 border border-[#A93133]/10 flex items-start gap-3">
                            <span
                                class="w-7 h-7 rounded-xl bg-[#A93133] text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                                0{{ idx + 1 }}
                            </span>
                            <div>
                                <p class="text-xs font-bold text-gray-900">{{ step.label }}</p>
                                <p class="text-[11px] text-gray-500 mt-0.5">{{ step.desc }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span class="text-gray-500">Klik salah satu tiket di bawah untuk melacak progres</span>
                    <span class="font-bold text-[#A93133]">SLA 99.9%</span>
                </div>
            </div>
        </div>

        <!-- ===== BARIS 3: Layout Asimetris 7:5 (Riwayat Keluhan + 2 Kartu Bantuan Cepat) ===== -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Kiri (7 Kolom): Daftar Riwayat Tiket -->
            <div
                class="lg:col-span-7 bg-white rounded-3xl p-6 shadow-[0_10px_25px_rgb(169,49,51,0.05)] border border-white">
                <h3 class="text-xs sm:text-sm font-bold text-gray-700 pb-3 border-b border-gray-100">
                    Riwayat Laporan & Pelacakan Status
                </h3>

                <div v-if="isLoading" class="py-12 text-center">
                    <div
                        class="animate-spin rounded-full h-7 w-7 border-2 border-gray-200 border-t-[#A93133] mx-auto mb-3">
                    </div>
                    <p class="text-xs text-gray-500">Memuat daftar tiket...</p>
                </div>

                <div v-else-if="filteredTickets.length === 0" class="py-12 text-center">
                    <LucideIcon name="ticket" :size="32" class="mx-auto text-gray-300 mb-2" />
                    <p class="text-xs text-gray-500">Belum ada riwayat laporan gangguan.</p>
                </div>

                <div v-else class="divide-y divide-gray-100 mt-2">
                    <button v-for="ticket in filteredTickets" :key="ticket.id" type="button"
                        class="w-full text-left py-4 hover:bg-[#F9EBEB]/30 px-3 rounded-2xl transition-colors"
                        @click="openDetail(ticket)">
                        <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                                <p class="text-[10px] font-mono font-bold text-[#A93133]">{{ ticket.ticket_number }}</p>
                                <p class="text-sm font-bold text-gray-900 truncate mt-0.5">{{ ticket.title }}</p>
                                <p class="text-[11px] text-gray-500 mt-0.5">
                                    {{ ticket.trouble_type_name || 'Kendala umum' }} · {{
                                        formatDateTimeID(ticket.created_at) }}
                                </p>
                            </div>
                            <UBadge size="xs" :color="ticketStageStyle(ticket.stage).color"
                                :label="ticketStageStyle(ticket.stage).label" />
                        </div>

                        <div class="flex items-center gap-1.5 mt-3">
                            <div v-for="(step, index) in stages" :key="step.stage" class="flex-1 h-1.5 rounded-full"
                                :class="ticket.stage_step > index ? 'bg-[#A93133]' : 'bg-gray-200'"></div>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Kanan (5 Kolom): 2 Kartu Tips Mandiri & Kontak NOC -->
            <div class="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div class="bg-white rounded-3xl p-5 shadow-[0_10px_25px_rgb(169,49,51,0.05)] border border-white">
                    <h3 class="text-xs font-bold text-gray-700 pb-2.5 border-b border-gray-100">Cek Mandiri</h3>
                    <ul class="space-y-3 mt-3 text-xs">
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Mulai ulang modem</span>
                            <span class="font-bold text-gray-900">5 Menit</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Lampu PON</span>
                            <span class="font-bold text-green-600">Hijau Stabil</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Lampu LOS</span>
                            <span class="font-bold text-[#A93133]">Mati (Normal)</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Kabel Patchcord</span>
                            <span class="font-bold text-gray-900">Tidak Tekuk</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Adaptor Listrik</span>
                            <span class="font-bold text-gray-900">Terpasang</span>
                        </li>
                    </ul>
                </div>

                <div class="bg-white rounded-3xl p-5 shadow-[0_10px_25px_rgb(169,49,51,0.05)] border border-white">
                    <h3 class="text-xs font-bold text-gray-700 pb-2.5 border-b border-gray-100">Layanan NOC 24/7</h3>
                    <ul class="space-y-3 mt-3 text-xs">
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Respon Tiket</span>
                            <span class="font-bold text-[#A93133]">&lt; 15 Menit</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Jam Teknisi</span>
                            <span class="font-bold text-gray-900">08:00 - 21:00</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Monitoring NOC</span>
                            <span class="font-bold text-green-600">24 Jam</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Biaya Kunjungan</span>
                            <span class="font-bold text-green-600">Gratis</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Pembaruan WhatsApp</span>
                            <span class="font-bold text-gray-900">Otomatis</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Modal Detail Pelacakan Tiket -->
        <div v-if="isDetailOpen"
            class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-4"
            @click.self="isDetailOpen = false">
            <div class="bg-white w-full max-w-lg rounded-3xl max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
                <div class="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 class="font-extrabold text-gray-900">Pelacakan Penanganan Tiket</h3>
                    <button @click="isDetailOpen = false" class="p-1 text-gray-400 hover:text-gray-800">
                        <LucideIcon name="x" :size="18" />
                    </button>
                </div>

                <div v-if="isLoadingDetail" class="py-10 text-center">
                    <div class="animate-spin rounded-full h-7 w-7 border-2 border-gray-200 border-t-[#A93133] mx-auto">
                    </div>
                </div>

                <div v-else-if="selectedTicket" class="space-y-4">
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <p class="text-xs font-mono font-bold text-[#A93133]">{{ selectedTicket.ticket_number }}</p>
                            <p class="font-extrabold text-gray-900 text-base">{{ selectedTicket.title }}</p>
                            <p class="text-xs text-gray-500 mt-0.5">
                                {{ selectedTicket.trouble_type_name || 'Kendala umum' }} · {{
                                    formatDateTimeID(selectedTicket.created_at) }}
                            </p>
                        </div>
                        <UBadge size="xs" :color="ticketStageStyle(selectedTicket.stage).color"
                            :label="selectedTicket.stage_label" />
                    </div>

                    <p v-if="selectedTicket.description"
                        class="text-xs text-gray-700 bg-[#F9EBEB]/40 p-3.5 rounded-2xl whitespace-pre-line">
                        {{ selectedTicket.description }}
                    </p>

                    <img v-if="selectedTicket.image_url" :src="selectedTicket.image_url" alt="Lampiran"
                        class="w-full max-h-52 object-contain rounded-2xl border border-gray-100" />

                    <div>
                        <p class="text-xs font-bold text-gray-800 mb-3">Linimasa Progres</p>
                        <ol class="relative border-l-2 border-gray-200 ml-2 space-y-4">
                            <li v-for="entry in selectedTicket.timeline" :key="entry.stage" class="ml-4">
                                <span class="absolute -left-[7px] w-3 h-3 rounded-full border-2"
                                    :class="entry.reached ? 'bg-[#A93133] border-[#A93133]' : 'bg-white border-gray-300'"></span>
                                <p class="text-xs font-bold" :class="entry.reached ? 'text-gray-900' : 'text-gray-400'">
                                    {{ entry.stage_label }}
                                </p>
                                <p v-if="entry.at" class="text-[11px] text-gray-500">{{ formatDateTimeID(entry.at) }}
                                </p>
                                <p v-if="entry.note" class="text-[11px] text-gray-600 italic mt-0.5">{{ entry.note }}
                                </p>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>