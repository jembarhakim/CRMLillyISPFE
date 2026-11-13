<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
    serviceCustomerApi,
    type AvailablePlan,
    type ServicePageData,
    type ServiceRequestItem,
} from '@/api/customer/service-request'
import { formatDateTimeID, formatRupiah, serviceRequestStatusStyle } from '@/helper/customerPortal'
import { useCustomToast } from '@/composables/useCustomToast'

const toast = useCustomToast()

// Tab "Ubah Paket" — only renders the service content, NOT a copy of the
// whole customer dashboard (the old version was a corrupted copy of index.vue
// that referenced undefined state and even rendered itself, which broke the
// tab switching).

type RequestType = 'upgrade' | 'downgrade' | 'relocation'

const page = ref<ServicePageData>({
    summary: {
        product_id: '',
        product_name: '',
        description: '',
        price: 0,
        download_speed_mbps: 0,
        upload_speed_mbps: 0,
        days_remaining: 0,
        is_active: false,
    },
    available_plans: [],
    requests: [],
})

const isLoading = ref(true)
const isSubmitting = ref(false)
const formError = ref('')

const requestType = ref<RequestType>('upgrade')
const form = reactive({
    requested_product_id: '',
    new_address: '',
    new_area_id: '',
    note: '',
})

const hasPendingRequest = computed(() =>
    (page.value.requests || []).some((r) => r.status === 'pending')
)

const productNameText = computed(() => page.value.summary.product_name || 'Belum Terdaftar')
const productPriceText = computed(() => formatRupiah(page.value.summary.price))

const planOptions = computed<AvailablePlan[]>(() => {
    const plans = page.value.available_plans || []
    if (requestType.value === 'upgrade') return plans.filter((p) => p.direction === 'upgrade')
    if (requestType.value === 'downgrade') return plans.filter((p) => p.direction === 'downgrade')
    return []
})

async function loadPage() {
    isLoading.value = true
    try {
        const response = await serviceCustomerApi().getPage()
        page.value = response.data
    } catch (error: any) {
        toast.error('Gagal memuat data layanan', error?.message)
    } finally {
        isLoading.value = false
    }
}

function selectRequestType(type: RequestType) {
    requestType.value = type
    form.requested_product_id = ''
    formError.value = ''
}

async function submitRequest() {
    formError.value = ''
    if (requestType.value !== 'relocation' && !form.requested_product_id) {
        formError.value = 'Silakan pilih paket yang ingin diajukan'
        return
    }
    if (requestType.value === 'relocation' && form.new_address.trim().length < 10) {
        formError.value = 'Alamat baru wajib diisi minimal 10 karakter'
        return
    }

    isSubmitting.value = true
    try {
        await serviceCustomerApi().createRequest({
            request_type: requestType.value,
            requested_product_id: requestType.value === 'relocation' ? undefined : form.requested_product_id,
            new_address: requestType.value === 'relocation' ? form.new_address.trim() : undefined,
            new_area_id: requestType.value === 'relocation' ? form.new_area_id || undefined : undefined,
            note: form.note.trim() || undefined,
        })

        toast.success('Pengajuan terkirim', 'Permohonan Anda masuk ke antrean persetujuan CRM.')
        form.requested_product_id = ''
        form.new_address = ''
        form.new_area_id = ''
        form.note = ''
        await loadPage()
    } catch (error: any) {
        formError.value = error?.message || 'Gagal mengirim pengajuan'
    } finally {
        isSubmitting.value = false
    }
}

function requestSummaryText(request: ServiceRequestItem) {
    if (request.request_type === 'relocation') return request.new_address || '-'
    return `${request.current_product_name || '-'} → ${request.requested_product_name || '-'}`
}

function requestTypeLabel(type: string) {
    if (type === 'upgrade') return 'Peningkatan'
    if (type === 'downgrade') return 'Penurunan'
    if (type === 'relocation') return 'Relokasi'
    return 'Lainnya'
}

onMounted(loadPage)
</script>

<template>
    <div class="space-y-6">
        <!-- Ringkasan paket aktif -->
        <div class="bg-white rounded-3xl p-6 shadow-[0_10px_25px_rgb(169,49,51,0.05)] border border-white">
            <div v-if="isLoading" class="animate-pulse space-y-3">
                <div class="h-4 bg-gray-100 rounded-full w-40"></div>
                <div class="h-8 bg-gray-100 rounded-2xl w-64"></div>
            </div>
            <div v-else class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <p class="text-xs font-medium text-gray-500 mb-1">Paket layanan Anda</p>
                    <h3 class="text-2xl font-extrabold text-gray-900 leading-tight">{{ productNameText }}</h3>
                    <p class="mt-2 text-xs text-gray-500">
                        {{ page.summary.download_speed_mbps }} Mbps · Rp {{ formatRupiah(page.summary.price) }}/bln
                    </p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase"
                        :class="page.summary.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                        {{ page.summary.is_active ? 'Aktif' : 'Tidak aktif' }}
                    </span>
                    <span class="px-3 py-1 rounded-full bg-[#F9EBEB] text-[#A93133] text-[10px] font-bold">
                        {{ page.summary.days_remaining }} hari tersisa
                    </span>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Form pengajuan -->
            <div class="bg-white rounded-3xl p-6 shadow-[0_10px_25px_rgb(169,49,51,0.05)] border border-white">
                <h3 class="text-xs font-bold text-gray-700 pb-2.5 border-b border-gray-100">Ajukan Perubahan Paket</h3>

                <div class="mt-4 flex gap-2">
                    <button v-for="opt in [
                        { id: 'upgrade', label: 'Peningkatan' },
                        { id: 'downgrade', label: 'Penurunan' },
                        { id: 'relocation', label: 'Relokasi' },
                    ]" :key="opt.id" type="button" @click="selectRequestType(opt.id as RequestType)"
                        class="px-4 py-2 rounded-full text-xs font-bold transition-all"
                        :class="requestType === opt.id ? 'bg-[#A93133] text-white shadow-sm' : 'bg-[#F9EBEB] text-[#A93133] hover:bg-white'">
                        {{ opt.label }}
                    </button>
                </div>

                <form class="mt-4 space-y-3" @submit.prevent="submitRequest">
                    <template v-if="requestType !== 'relocation'">
                        <label class="block">
                            <span class="text-[11px] font-semibold text-gray-500">Pilih paket tujuan</span>
                            <select v-model="form.requested_product_id"
                                class="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#A93133]/20">
                                <option value="" disabled>— Pilih paket —</option>
                                <option v-for="plan in planOptions" :key="plan.id" :value="plan.id">
                                    {{ plan.name }} — {{ formatRupiah(plan.price) }}/bln
                                </option>
                            </select>
                        </label>
                        <p v-if="planOptions.length === 0" class="text-[11px] text-gray-400">
                            Tidak ada paket {{ requestType === 'upgrade' ? 'peningkatan' : 'penurunan' }} yang tersedia.
                        </p>
                    </template>

                    <template v-else>
                        <label class="block">
                            <span class="text-[11px] font-semibold text-gray-500">Alamat baru</span>
                            <textarea v-model="form.new_address" rows="2"
                                class="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#A93133]/20"
                                placeholder="Alamat pemasangan yang baru (min. 10 karakter)"></textarea>
                        </label>
                        <label class="block">
                            <span class="text-[11px] font-semibold text-gray-500">Area (opsional)</span>
                            <input v-model="form.new_area_id" type="text"
                                class="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#A93133]/20" />
                        </label>
                    </template>

                    <label class="block">
                        <span class="text-[11px] font-semibold text-gray-500">Catatan (opsional)</span>
                        <textarea v-model="form.note" rows="2"
                            class="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#A93133]/20"
                            placeholder="Info tambahan untuk tim kami"></textarea>
                    </label>

                    <p v-if="formError" class="text-xs text-red-600">{{ formError }}</p>

                    <button type="submit" :disabled="isSubmitting || isLoading"
                        class="w-full py-2.5 rounded-xl bg-[#A93133] text-white text-sm font-bold hover:bg-red-800 disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2">
                        <LucideIcon name="send" :size="14" />
                        {{ isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan' }}
                    </button>

                    <p v-if="hasPendingRequest" class="text-[11px] text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
                        Anda masih memiliki pengajuan yang menunggu persetujuan.
                    </p>
                </form>
            </div>

            <!-- Riwayat pengajuan -->
            <div class="bg-white rounded-3xl p-6 shadow-[0_10px_25px_rgb(169,49,51,0.05)] border border-white">
                <h3 class="text-xs font-bold text-gray-700 pb-2.5 border-b border-gray-100">Riwayat Pengajuan</h3>

                <div v-if="isLoading" class="py-8 text-center text-xs text-gray-400">Memuat...</div>
                <div v-else-if="page.requests.length === 0" class="py-8 text-center text-xs text-gray-400">
                    Belum ada pengajuan.
                </div>
                <ul v-else class="mt-3 space-y-3">
                    <li v-for="request in page.requests" :key="request.id"
                        class="p-3.5 rounded-2xl bg-[#F9EBEB]/40 border border-[#A93133]/10">
                        <div class="flex items-center justify-between gap-2">
                            <p class="text-xs font-bold text-gray-900">{{ requestTypeLabel(request.request_type) }}</p>
                            <UBadge size="xs" :color="serviceRequestStatusStyle(request.status).color"
                                :label="serviceRequestStatusStyle(request.status).label" />
                        </div>
                        <p class="mt-1.5 text-[11px] text-gray-600">{{ requestSummaryText(request) }}</p>
                        <p class="mt-1 text-[10px] text-gray-400">Diajukan {{ formatDateTimeID(request.created_at) }}</p>
                        <p v-if="request.review_note" class="mt-1.5 text-[11px] text-gray-500 italic">
                            {{ request.review_note }}
                        </p>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>
