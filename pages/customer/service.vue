<script setup lang="ts">
import {
  serviceCustomerApi,
  type AvailablePlan,
  type ServicePageData,
  type ServiceRequestItem,
} from '@/api/customer/service-request'
import { formatDateID, formatDateTimeID, formatRupiah, serviceRequestStatusStyle } from '@/helper/customerPortal'
import { card, sectionGap, sectionLabel, field, fieldLabel, buttonPrimary } from '@/helper/portalTheme'

useHead({ title: 'Layanan Saya - Lilly Networks' })
definePageMeta({ ssr: false })

const toast = useCustomToast()

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

const requestTypes: Array<{ value: RequestType; label: string; icon: string }> = [
  { value: 'upgrade', label: 'Upgrade', icon: 'trending-up' },
  { value: 'downgrade', label: 'Downgrade', icon: 'trending-down' },
  { value: 'relocation', label: 'Relokasi', icon: 'map-pin' },
]

// Only show plans in the valid direction for the selected request type.
const planOptions = computed<AvailablePlan[]>(() => {
  const plans = page.value.available_plans || []
  if (requestType.value === 'upgrade') return plans.filter((plan) => plan.direction === 'upgrade')
  if (requestType.value === 'downgrade') return plans.filter((plan) => plan.direction === 'downgrade')
  return []
})

const hasPendingRequest = computed(() =>
  (page.value.requests || []).some((request) => request.status === 'pending')
)

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
    formError.value = 'Silakan pilih paket yang ingin Anda ajukan'
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

    toast.success('Pengajuan terkirim', 'Permohonan Anda masuk ke antrean persetujuan tim CRM.')
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
  if (request.request_type === 'relocation') {
    return request.new_address || '-'
  }
  return `${request.current_product_name || '-'} → ${request.requested_product_name || '-'}`
}

onMounted(loadPage)
</script>


<template>
  <CustomerPortalShell
    title="Layanan Saya"
    subtitle="Paket internet & pengajuan perubahan"
    back-to="/customer"
  >
    <!-- Loading -->
    <div v-if="isLoading" :class="[card, 'text-center']" style="padding-top:2.5rem;padding-bottom:2.5rem">
      <div class="portal-spinner-dark"></div>
      <p class="portal-meta" style="margin-top:.75rem">Memuat data layanan...</p>
    </div>

    <div v-else :class="sectionGap">
      <!-- ================= Summary card ================= -->
      <section :class="card">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p :class="sectionLabel">Paket aktif</p>
            <p class="portal-heading" style="margin-top:.375rem">
              {{ page.summary.product_name || 'Belum ada paket' }}
            </p>
            <p class="portal-meta" style="margin-top:.25rem">
              {{ page.summary.description || 'Hubungi layanan pelanggan untuk pemasangan paket' }}
            </p>
          </div>
          <UBadge
            size="sm"
            class="shrink-0"
            :color="page.summary.is_active ? 'green' : 'red'"
            :label="page.summary.is_active ? 'Aktif' : 'Tidak aktif'"
          />
        </div>

        <dl class="portal-grid2">
          <div class="portal-stat">
            <dt class="portal-stat-label">Download</dt>
            <dd class="portal-stat-value">
              {{ page.summary.download_speed_mbps || '-' }}
              <span class="portal-stat-unit">Mbps</span>
            </dd>
          </div>
          <div class="portal-stat">
            <dt class="portal-stat-label">Upload</dt>
            <dd class="portal-stat-value">
              {{ page.summary.upload_speed_mbps || '-' }}
              <span class="portal-stat-unit">Mbps</span>
            </dd>
          </div>
          <div class="portal-stat">
            <dt class="portal-stat-label">Biaya bulanan</dt>
            <dd class="portal-stat-value-sm">{{ formatRupiah(page.summary.price) }}</dd>
          </div>
          <div class="portal-stat">
            <dt class="portal-stat-label">Tagihan berikutnya</dt>
            <dd class="portal-stat-value-sm">{{ formatDateID(page.summary.next_invoice_date) }}</dd>
          </div>
        </dl>

        <p v-if="page.summary.active_since" class="portal-meta" style="margin-top:.75rem">
          Aktif sejak {{ formatDateID(page.summary.active_since) }} ·
          sisa {{ page.summary.days_remaining }} hari
        </p>
      </section>

      <!-- ================= Request form ================= -->
      <section>
        <h3 :class="sectionLabel" style="margin-bottom:.75rem">Ajukan Perubahan</h3>

        <div :class="card">
          <p class="portal-meta" style="margin-bottom:1rem">
            Pengajuan akan diperiksa dan disetujui oleh tim CRM kami.
          </p>

          <!-- Type selector -->
          <div class="portal-type-grid">
            <button
              v-for="type in requestTypes"
              :key="type.value"
              type="button"
              class="portal-type-btn"
              :class="requestType === type.value ? 'portal-type-btn-active' : ''"
              @click="selectRequestType(type.value)"
            >
              <LucideIcon :name="type.icon" :size="18" />
              <span>{{ type.label }}</span>
            </button>
          </div>

          <!-- Package selection (upgrade / downgrade) -->
          <div v-if="requestType !== 'relocation'" class="portal-plan-list">
            <p v-if="planOptions.length === 0" class="portal-meta portal-empty-inline">
              Tidak ada paket
              {{ requestType === 'upgrade' ? 'lebih tinggi' : 'lebih rendah' }}
              yang tersedia saat ini.
            </p>

            <label
              v-for="plan in planOptions"
              :key="plan.id"
              class="portal-plan"
              :class="form.requested_product_id === plan.id ? 'portal-plan-active' : ''"
            >
              <input
                v-model="form.requested_product_id"
                type="radio"
                :value="plan.id"
                class="portal-plan-radio"
              />
              <span class="portal-plan-body">
                <span class="portal-plan-name">{{ plan.name }}</span>
                <span class="portal-plan-desc">{{ plan.description }}</span>
              </span>
              <span class="portal-plan-price">
                <span class="portal-plan-price-value">{{ formatRupiah(plan.price) }}</span>
                <span class="portal-plan-price-speed">
                  {{ plan.download_speed_mbps }}M / {{ plan.upload_speed_mbps }}M
                </span>
              </span>
            </label>
          </div>

          <!-- Relocation fields -->
          <div v-else style="margin-top:1rem">
            <label class="portal-form-row">
              <span :class="fieldLabel">Alamat Baru</span>
              <textarea
                v-model="form.new_address"
                rows="3"
                maxlength="500"
                placeholder="Alamat lengkap lokasi baru beserta patokan"
                :class="field"
              ></textarea>
            </label>
          </div>

          <!-- Note -->
          <label class="portal-form-row" style="margin-top:1rem">
            <span :class="fieldLabel">Catatan (opsional)</span>
            <input
              v-model="form.note"
              type="text"
              maxlength="500"
              :placeholder="requestType === 'relocation' ? 'Contoh: pindah tanggal 30 Oktober' : 'Alasan atau permintaan khusus'"
              :class="field"
            />
          </label>

          <p v-if="formError" class="portal-alert" style="margin-top:1rem">
            <LucideIcon name="alert-triangle" :size="14" />
            <span>{{ formError }}</span>
          </p>

          <p v-if="hasPendingRequest" class="portal-note" style="margin-top:1rem">
            Anda masih memiliki pengajuan yang menunggu persetujuan. Pengajuan baru dengan jenis
            yang sama akan ditolak hingga pengajuan sebelumnya diproses.
          </p>

          <button
            type="button"
            :disabled="isSubmitting"
            :class="buttonPrimary"
            style="margin-top:1rem"
            @click="submitRequest"
          >
            <span v-if="isSubmitting" class="portal-spinner"></span>
            {{ isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan' }}
          </button>
        </div>
      </section>

      <!-- ================= Request history ================= -->
      <section>
        <h3 :class="sectionLabel" style="margin-bottom:.75rem">Riwayat Pengajuan</h3>

        <div v-if="page.requests.length === 0" :class="[card, 'text-center']" style="padding-top:2rem;padding-bottom:2rem">
          <LucideIcon name="package" :size="30" style="color:#d1d5db;display:block;margin:0 auto .5rem" />
          <p class="portal-meta">Belum ada pengajuan perubahan layanan.</p>
        </div>

        <div v-else :class="sectionGap">
          <div v-for="request in page.requests" :key="request.id" :class="card">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="portal-heading">{{ request.type_label }}</p>
                <p class="portal-body" style="margin-top:.25rem">{{ requestSummaryText(request) }}</p>
                <p class="portal-meta" style="margin-top:.375rem">
                  Diajukan {{ formatDateTimeID(request.created_at) }}
                </p>
              </div>
              <UBadge
                size="sm"
                class="shrink-0"
                :color="serviceRequestStatusStyle(request.status).color"
                :label="serviceRequestStatusStyle(request.status).label"
              />
            </div>

            <p v-if="request.note" class="portal-quote">"{{ request.note }}"</p>

            <div v-if="request.review_note || request.reviewed_at" class="portal-review">
              <p class="portal-review-label">Catatan admin</p>
              <p class="portal-body">{{ request.review_note || '-' }}</p>
              <p v-if="request.reviewed_at" class="portal-meta" style="margin-top:.25rem">
                Diproses {{ formatDateTimeID(request.reviewed_at) }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </CustomerPortalShell>
</template>
