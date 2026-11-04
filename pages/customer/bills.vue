<script setup lang="ts">
import { billingCustomerApi, type CustomerBill } from '@/api/customer/billing'
import { billStatusStyle, formatDateID, formatRupiah } from '@/helper/customerPortal'
import { card, sectionGap, sectionLabel, buttonPrimary } from '@/helper/portalTheme'
import { downloadInvoicePdf } from '@/helper/invoicePdf'

useHead({ title: 'Tagihan Saya - Lilly Networks' })
definePageMeta({ ssr: false })

const toast = useCustomToast()

const bills = ref<CustomerBill[]>([])
const isLoading = ref(true)
const isPayingId = ref<string | null>(null)
const isDownloadingId = ref<string | null>(null)

const pendingTotal = computed(() =>
  bills.value.filter((bill) => bill.status !== 'paid').reduce((sum, bill) => sum + bill.amount, 0)
)

// Number of bills still waiting for payment (shown in the summary card).
const unpaidCount = computed(() => bills.value.filter((bill) => bill.status !== 'paid').length)

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

// --- Midtrans Snap ---------------------------------------------------------
// snap.js is loaded lazily on the first payment so the portal boots fast on
// mobile connections. Keys come from runtime config (see nuxt.config.ts).
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

    // Fallback: when no token is returned, open the hosted payment page.
    if (!snap?.token) {
      if (snap?.redirect_url) {
        window.open(snap.redirect_url, '_blank')
        return
      }
      throw new Error('Token pembayaran tidak tersedia')
    }

    await loadSnapScript()

    ;(window as any).snap.pay(snap.token, {
      onSuccess: () => {
        toast.success('Pembayaran berhasil', 'Status tagihan akan diperbarui otomatis.')
        loadBills()
      },
      onPending: () => {
        toast.warning('Pembayaran menunggu', 'Selesaikan pembayaran sesuai instruksi.')
        loadBills()
      },
      onError: () => {
        toast.error('Pembayaran gagal', 'Silakan coba lagi atau gunakan metode lain.')
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

// --- PDF receipt -----------------------------------------------------------
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
  <CustomerPortalShell title="Tagihan Saya" subtitle="Riwayat tagihan bulanan" back-to="/customer">
    <!-- Summary -->
    <div :class="[card, 'mb-5']">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p :class="sectionLabel">Total tagihan</p>
          <p
            class="portal-value mt-1.5"
            :class="pendingTotal > 0 ? 'text-[#A93133]' : 'text-gray-900'"
          >
            {{ formatRupiah(pendingTotal) }}
          </p>
          <p class="text-xs text-gray-500 mt-1">
            <template v-if="pendingTotal > 0">{{ unpaidCount }} tagihan belum dibayar</template>
            <template v-else>Semua tagihan sudah lunas</template>
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          title="Muat ulang"
          aria-label="Muat ulang"
          @click="loadBills"
        >
          <LucideIcon name="refresh-cw" :size="16" :class="isLoading ? 'animate-spin' : ''" />
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!isLoading && bills.length === 0" :class="[card, 'py-10 text-center']">
      <LucideIcon name="credit-card" :size="32" class="mx-auto text-gray-300 mb-2" />
      <p class="text-sm text-gray-500">Belum ada tagihan.</p>
    </div>

    <!-- Bill list: one card per bill, consistent padding -->
    <template v-else>
      <div v-if="isLoading" :class="[card, 'py-10 text-center']">
        <div class="animate-spin rounded-full h-7 w-7 border-2 border-gray-200 border-t-[#A93133] mx-auto mb-3"></div>
        <p class="text-xs text-gray-500">Memuat tagihan...</p>
      </div>

      <div v-else :class="sectionGap">
        <div v-for="bill in bills" :key="bill.invoice_id" :class="card">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900">{{ bill.month }}</p>
              <p class="text-xs text-gray-500 mt-0.5">
                Jatuh tempo {{ formatDateID(bill.due_date) }}
              </p>
            </div>
            <UBadge
              size="sm"
              class="shrink-0"
              :color="billStatusStyle(bill.status).color"
              :label="bill.status_label || billStatusStyle(bill.status).label"
            />
          </div>

          <p class="portal-heading mt-3">{{ formatRupiah(bill.amount) }}</p>

          <div class="flex items-center gap-2 mt-3.5">
            <UButton
              size="sm"
              :disabled="!bill.is_payable"
              :loading="isPayingId === bill.invoice_id"
              class="rounded-full bg-[#A93133] hover:bg-[#8F2729] text-white border-0"
              @click="payBill(bill)"
            >
              <LucideIcon name="wallet" :size="14" class="mr-1" />
              {{ bill.is_payable ? 'Bayar' : 'Lunas' }}
            </UButton>
            <UButton
              size="sm"
              color="gray"
              variant="outline"
              class="rounded-full"
              :loading="isDownloadingId === bill.invoice_id"
              @click="downloadReceipt(bill)"
            >
              <LucideIcon name="download" :size="14" class="mr-1" />
              Unduh
            </UButton>
          </div>
        </div>
      </div>
    </template>

    <p class="text-[11px] text-gray-400 mt-5 text-center leading-relaxed">
      Pembayaran mendukung QRIS, Virtual Account, dan e-wallet melalui Midtrans.
    </p>
  </CustomerPortalShell>
</template>
