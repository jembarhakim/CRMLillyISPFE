<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { billingCustomerApi, type CustomerBill } from '@/api/customer/billing'
import { billStatusStyle, formatDateID, formatRupiah } from '@/helper/customerPortal'
import { downloadInvoicePdf } from '@/helper/invoicePdf'
import { useCustomToast } from '@/composables/useCustomToast'

const emit = defineEmits<{ (e: 'paid'): void }>()
const toast = useCustomToast()

const bills = ref<CustomerBill[]>([])
const isLoading = ref(true)
const isPayingId = ref<string | null>(null)
const isDownloadingId = ref<string | null>(null)

const statusFilter = ref<'all' | 'unpaid' | 'paid'>('all')
const sortOrder = ref<'newest' | 'oldest'>('newest')
const yearFilter = ref('all')

const unpaidCount = computed(() => bills.value.filter((b) => b.status !== 'paid').length)
const paidCount = computed(() => bills.value.filter((b) => b.status === 'paid').length)
const pendingTotal = computed(() =>
    bills.value.filter((b) => b.status !== 'paid').reduce((sum, b) => sum + b.amount, 0)
)

const filteredBills = computed(() => {
    let list = [...bills.value]
    if (statusFilter.value === 'unpaid') list = list.filter((b) => b.status !== 'paid')
    if (statusFilter.value === 'paid') list = list.filter((b) => b.status === 'paid')
    return sortOrder.value === 'newest' ? list : list.reverse()
})

const chartBars = computed(() => {
    const slice = bills.value.slice(0, 12).reverse()
    if (slice.length === 0) return []
    const max = Math.max(...slice.map((b) => b.amount || 1), 1)
    return slice.map((b) => ({
        label: (b.month || '').slice(0, 3).toUpperCase(),
        amount: b.amount,
        status: b.status,
        heightPercent: Math.max(20, Math.round(((b.amount || 0) / max) * 100)),
    }))
})

async function loadBills() {
    isLoading.value = true
    try {
        const response = await billingCustomerApi().getBills()
        bills.value = response?.data || []
    } catch (error: any) {
        toast.error('Gagal memuat tagihan', error?.message)
    } finally {
        isLoading.value = false
    }
}

const SNAP_SCRIPT_ID = 'midtrans-snap-script'
const runtimeConfig = useRuntimeConfig()
const snapClientKey = runtimeConfig.public.midtransClientKey as string | undefined
const snapIsProduction = runtimeConfig.public.midtransIsProduction as boolean | undefined

function loadSnapScript(): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve()
    if ((window as any).snap) return Promise.resolve()

    return new Promise((resolve, reject) => {
        const existing = document.getElementById(SNAP_SCRIPT_ID) as HTMLScriptElement | null
        if (existing) {
            existing.addEventListener('load', () => resolve())
            existing.addEventListener('error', () => reject(new Error('Gagal memuat Midtrans')))
            return
        }
        const script = document.createElement('script')
        script.id = SNAP_SCRIPT_ID
        script.src = snapIsProduction
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js'
        if (snapClientKey) script.setAttribute('data-client-key', snapClientKey)
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Gagal memuat Midtrans'))
        document.head.appendChild(script)
    })
}

async function payBill(bill: CustomerBill) {
    isPayingId.value = bill.invoice_id
    try {
        const response = await billingCustomerApi().createSnapToken(bill.invoice_id)
        const snap = response?.data

        if (!snap?.token) {
            if (snap?.redirect_url) {
                window.open(snap.redirect_url, '_blank')
                return
            }
            throw new Error('Token pembayaran tidak tersedia')
        }

        await loadSnapScript()

            ; (window as any).snap.pay(snap.token, {
                onSuccess: () => {
                    toast.success('Pembayaran berhasil', 'Status tagihan diperbarui otomatis.')
                    loadBills()
                    emit('paid')
                },
                onPending: () => {
                    toast.warning('Pembayaran menunggu', 'Selesaikan pembayaran sesuai instruksi.')
                    loadBills()
                },
                onError: () => {
                    toast.error('Pembayaran gagal', 'Silakan coba lagi.')
                },
                onClose: () => {
                    isPayingId.value = null
                    loadBills()
                },
            })
    } catch (error: any) {
        toast.error('Tidak dapat memproses pembayaran', error?.message)
    } finally {
        isPayingId.value = null
    }
}

async function downloadReceipt(bill: CustomerBill) {
    isDownloadingId.value = bill.invoice_id
    try {
        const response = await billingCustomerApi().getInvoice(bill.invoice_id)
        await downloadInvoicePdf(response.data)
        toast.success('Kuitansi diunduh', `invoice-${bill.invoice_id}.pdf`)
    } catch (error: any) {
        toast.error('Gagal mengunduh kuitansi', error?.message)
    } finally {
        isDownloadingId.value = null
    }
}

onMounted(loadBills)
</script>

<template>
    <div class="space-y-6">
        <!-- ===== BARIS 1: Filter Pill Kiri & 3 Stat Pill Kanan (Persis Design 1) ===== -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <!-- 3 Filter Dropdowns -->
            <div class="flex flex-wrap items-center gap-3">
                <div
                    class="bg-white rounded-full px-4 py-2 shadow-sm border border-white flex items-center gap-2 text-xs">
                    <span class="text-gray-500">Timeframe:</span>
                    <select v-model="yearFilter"
                        class="font-bold text-gray-900 bg-transparent focus:outline-none cursor-pointer">
                        <option value="all">All-time</option>
                        <option value="2026">Tahun Ini</option>
                    </select>
                </div>

                <div
                    class="bg-white rounded-full px-4 py-2 shadow-sm border border-white flex items-center gap-2 text-xs">
                    <span class="text-gray-500">Status:</span>
                    <select v-model="statusFilter"
                        class="font-bold text-gray-900 bg-transparent focus:outline-none cursor-pointer">
                        <option value="all">All</option>
                        <option value="unpaid">Belum Bayar</option>
                        <option value="paid">Lunas</option>
                    </select>
                </div>

                <div
                    class="bg-white rounded-full px-4 py-2 shadow-sm border border-white flex items-center gap-2 text-xs">
                    <span class="text-gray-500">Urutan:</span>
                    <select v-model="sortOrder"
                        class="font-bold text-gray-900 bg-transparent focus:outline-none cursor-pointer">
                        <option value="newest">Terbaru</option>
                        <option value="oldest">Terlama</option>
                    </select>
                </div>
            </div>

            <!-- 3 Horizontal Stat Pills -->
            <div class="grid grid-cols-3 gap-3">
                <div
                    class="bg-white rounded-full px-5 py-2 shadow-sm border border-white flex items-center justify-between gap-3">
                    <span class="text-xs text-gray-500 font-medium">Tagihan</span>
                    <span class="text-base sm:text-lg font-extrabold text-gray-900">{{ bills.length }}</span>
                </div>
                <div
                    class="bg-white rounded-full px-5 py-2 shadow-sm border border-white flex items-center justify-between gap-3">
                    <span class="text-xs text-gray-500 font-medium">Unpaid</span>
                    <span class="text-base sm:text-lg font-extrabold text-[#A93133]">{{ unpaidCount }}</span>
                </div>
                <div
                    class="bg-white rounded-full px-5 py-2 shadow-sm border border-white flex items-center justify-between gap-3">
                    <span class="text-xs text-gray-500 font-medium">Lunas</span>
                    <span class="text-base sm:text-lg font-extrabold text-green-600">{{ paidCount }}</span>
                </div>
            </div>
        </div>

        <!-- ===== BARIS 2: 2 Kartu Grafik Berdampingan (Persis Design 1) ===== -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Kiri: Grafik Bar Tagihan Bulanan -->
            <div class="bg-white rounded-3xl p-6 shadow-[0_10px_25px_rgb(169,49,51,0.05)] border border-white">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xs sm:text-sm font-bold text-gray-700">Riwayat Nominal Tagihan Bulanan</h3>
                    <span class="text-[11px] font-semibold text-[#A93133] bg-[#F9EBEB] px-2.5 py-0.5 rounded-full">12
                        Bulan</span>
                </div>

                <div v-if="chartBars.length === 0" class="h-44 flex flex-col items-center justify-center text-gray-400">
                    <LucideIcon name="bar-chart-2" :size="28" class="mb-2 opacity-40" />
                    <p class="text-xs">Belum ada grafik tagihan</p>
                </div>

                <div v-else class="h-44 flex items-end justify-between gap-2 pt-4 px-2">
                    <div v-for="(bar, idx) in chartBars" :key="idx"
                        class="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <div class="w-2.5 sm:w-3 bg-[#F9EBEB] rounded-full h-full flex items-end overflow-hidden">
                            <div class="w-full rounded-full transition-all duration-500"
                                :class="bar.status === 'paid' ? 'bg-[#A93133]' : 'bg-amber-500'"
                                :style="{ height: `${bar.heightPercent}%` }"
                                :title="`${bar.label}: ${formatRupiah(bar.amount)}`"></div>
                        </div>
                        <span class="text-[9px] font-semibold text-gray-400">{{ bar.label }}</span>
                    </div>
                </div>
            </div>

            <!-- Kanan: Ringkasan Status Pembayaran & Tombol Bayar Cepat -->
            <div
                class="bg-white rounded-3xl p-6 shadow-[0_10px_25px_rgb(169,49,51,0.05)] border border-white flex flex-col justify-between relative overflow-hidden">
                <div
                    class="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-[#F9EBEB]/60 blur-2xl pointer-events-none">
                </div>
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xs sm:text-sm font-bold text-gray-700">Status Kewajiban Pembayaran</h3>
                        <button @click="loadBills"
                            class="text-xs font-bold text-[#A93133] hover:underline flex items-center gap-1">
                            <LucideIcon name="refresh-cw" :size="12" :class="isLoading ? 'animate-spin' : ''" />
                            <span>Muat Ulang</span>
                        </button>
                    </div>

                    <div
                        class="p-4 rounded-2xl bg-[#F9EBEB]/50 border border-[#A93133]/10 flex items-center justify-between">
                        <div>
                            <p class="text-xs text-gray-500 font-medium">Total Tunggakan Aktif</p>
                            <p class="text-2xl font-extrabold mt-0.5"
                                :class="pendingTotal > 0 ? 'text-[#A93133]' : 'text-gray-900'">
                                {{ formatRupiah(pendingTotal) }}
                            </p>
                        </div>
                        <span
                            class="w-11 h-11 rounded-2xl bg-[#A93133] text-white flex items-center justify-center shadow-md">
                            <LucideIcon name="wallet" :size="20" />
                        </span>
                    </div>
                </div>

                <!-- Visual Wave / Indikator Lunas -->
                <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span class="text-gray-500">Pembayaran instan via Midtrans</span>
                    <span class="font-bold text-gray-900">QRIS · VA Bank · E-Wallet</span>
                </div>
            </div>
        </div>

        <!-- ===== BARIS 3: Layout Asimetris 5:7 (Daftar Tagihan + 2 Kartu Info Kanan) ===== -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Kiri (7 Kolom): Daftar Tagihan Bulanan -->
            <div
                class="lg:col-span-7 bg-white rounded-3xl p-6 shadow-[0_10px_25px_rgb(169,49,51,0.05)] border border-white">
                <h3 class="text-xs sm:text-sm font-bold text-gray-700 pb-3 border-b border-gray-100">
                    Daftar Tagihan & Kuitansi Resmi
                </h3>

                <div v-if="isLoading" class="py-12 text-center">
                    <div
                        class="animate-spin rounded-full h-7 w-7 border-2 border-gray-200 border-t-[#A93133] mx-auto mb-3">
                    </div>
                    <p class="text-xs text-gray-500">Memuat daftar tagihan...</p>
                </div>

                <div v-else-if="filteredBills.length === 0" class="py-12 text-center">
                    <LucideIcon name="credit-card" :size="32" class="mx-auto text-gray-300 mb-2" />
                    <p class="text-xs text-gray-500">Belum ada tagihan pada filter ini.</p>
                </div>

                <div v-else class="divide-y divide-gray-100 mt-2">
                    <div v-for="bill in filteredBills" :key="bill.invoice_id"
                        class="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xs"
                                :class="bill.status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-[#F9EBEB] text-[#A93133]'">
                                <LucideIcon :name="bill.status === 'paid' ? 'check-circle' : 'file-text'" :size="18" />
                            </div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <p class="text-xs sm:text-sm font-bold text-gray-900">{{ bill.month }}</p>
                                    <UBadge size="xs" :color="billStatusStyle(bill.status).color"
                                        :label="bill.status_label || billStatusStyle(bill.status).label" />
                                </div>
                                <p class="text-[11px] text-gray-500">Jatuh tempo {{ formatDateID(bill.due_date) }}</p>
                            </div>
                        </div>

                        <div class="flex items-center justify-between sm:justify-end gap-3">
                            <p class="text-sm font-extrabold text-gray-900">{{ formatRupiah(bill.amount) }}</p>
                            <div class="flex items-center gap-1.5">
                                <button type="button" :disabled="!bill.is_payable || isPayingId === bill.invoice_id"
                                    @click="payBill(bill)"
                                    class="px-4 py-1.5 rounded-full text-xs font-bold transition-all inline-flex items-center gap-1"
                                    :class="bill.is_payable ? 'bg-[#A93133] text-white hover:bg-[#8F2729] shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'">
                                    <LucideIcon name="wallet" :size="12" />
                                    <span>{{ isPayingId === bill.invoice_id ? '...' : (bill.is_payable ? 'Bayar' :
                                        'Lunas') }}</span>
                                </button>
                                <button type="button" :disabled="isDownloadingId === bill.invoice_id"
                                    @click="downloadReceipt(bill)"
                                    class="p-2 rounded-full border border-gray-200 text-gray-600 hover:text-[#A93133] hover:border-[#A93133] transition-colors"
                                    title="Unduh PDF">
                                    <LucideIcon name="download" :size="13" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Kanan (5 Kolom, Terbagi 2 Kartu Seperti Admin Activity & Top Influencers di Design 1) -->
            <div class="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <!-- Kartu Kanan 1: Metode Pembayaran -->
                <div class="bg-white rounded-3xl p-5 shadow-[0_10px_25px_rgb(169,49,51,0.05)] border border-white">
                    <h3 class="text-xs font-bold text-gray-700 pb-2.5 border-b border-gray-100">Metode Pembayaran</h3>
                    <ul class="space-y-3 mt-3 text-xs">
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">QRIS</span>
                            <span class="font-bold text-gray-900">Instan</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">BCA VA</span>
                            <span class="font-bold text-gray-900">24 Jam</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Mandiri VA</span>
                            <span class="font-bold text-gray-900">24 Jam</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">BRI / BNI VA</span>
                            <span class="font-bold text-gray-900">24 Jam</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">GoPay / OVO</span>
                            <span class="font-bold text-gray-900">Aktif</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Biaya Admin</span>
                            <span class="font-bold text-green-600">Rp 0</span>
                        </li>
                    </ul>
                </div>

                <!-- Kartu Kanan 2: Ketentuan Tagihan -->
                <div class="bg-white rounded-3xl p-5 shadow-[0_10px_25px_rgb(169,49,51,0.05)] border border-white">
                    <h3 class="text-xs font-bold text-gray-700 pb-2.5 border-b border-gray-100">Info Penagihan</h3>
                    <ul class="space-y-3 mt-3 text-xs">
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Terbit Tagihan</span>
                            <span class="font-bold text-gray-900">Tgl 1</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Jatuh Tempo</span>
                            <span class="font-bold text-[#A93133]">Tgl 20</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Masa Tenggang</span>
                            <span class="font-bold text-gray-900">3 Hari</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Kuitansi PDF</span>
                            <span class="font-bold text-green-600">Otomatis</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Notifikasi WA</span>
                            <span class="font-bold text-gray-900">Aktif</span>
                        </li>
                        <li class="flex items-center justify-between">
                            <span class="text-gray-500">Bantuan Billing</span>
                            <span class="font-bold text-[#A93133]">24/7</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>