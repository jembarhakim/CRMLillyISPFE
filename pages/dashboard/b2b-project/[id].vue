<script setup lang="ts">
import { b2bProjectAdminApi, type B2BProjectDetail } from '@/api/admin/b2b-project'
import { formatIDR } from '@/helper/currency'
import { formatDateToYMD } from '@/helper/date'

useHead({ title: 'Detail Proyek B2B - CRM System' })
definePageMeta({ ssr: false })

const route = useRoute()
const router = useRouter()
const toast = useCustomToast()

const projectId = computed(() => String(route.params.id || ''))
const detail = ref<B2BProjectDetail | null>(null)
const isLoading = ref(true)
const isChangingStatus = ref(false)
const showStatusModal = ref(false)
const tab = ref('ringkasan')

const nextStatus = ref('')
const statusNote = ref('')

const tabs = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'penawaran', label: 'Penawaran' },
  { id: 'termin', label: 'Termin' },
  { id: 'margin', label: 'Margin' },
  { id: 'wo', label: 'WO & BAST' },
]

// Lifecycle order: drives both the timeline and the "next status" action.
const flow = ['penawaran', 'deal', 'pengerjaan', 'serah_terima', 'pelunasan']

const statusMeta: Record<string, { label: string; color: 'gray' | 'blue' | 'green' | 'orange' | 'red' }> = {
  penawaran: { label: 'Penawaran', color: 'gray' },
  deal: { label: 'Deal', color: 'blue' },
  pengerjaan: { label: 'Pengerjaan', color: 'orange' },
  serah_terima: { label: 'Serah Terima', color: 'green' },
  pelunasan: { label: 'Pelunasan', color: 'green' },
  batal: { label: 'Batal', color: 'red' },
}

const project = computed(() => detail.value?.project)
const margin = computed(() => detail.value?.margin)
const currentStep = computed(() => flow.indexOf(project.value?.status || 'penawaran'))
const canAdvance = computed(() => currentStep.value >= 0 && currentStep.value < flow.length - 1)
const nextStatusLabel = computed(() =>
  canAdvance.value ? statusMeta[flow[currentStep.value + 1]]?.label : ''
)

const paidTotal = computed(() =>
  (detail.value?.milestones || [])
    .filter((m) => m.status === 'paid')
    .reduce((sum, m) => sum + m.amount, 0)
)

const paidPercent = computed(() => {
  const contract = project.value?.contract_value || 0
  if (contract <= 0) return 0
  return Math.min(100, Math.round((paidTotal.value / contract) * 100))
})

async function load() {
  isLoading.value = true
  try {
    const res = await b2bProjectAdminApi().detail(projectId.value)
    detail.value = res.data
  } catch (error: any) {
    toast.error('Gagal memuat proyek', error?.message)
    router.push('/dashboard/b2b-project')
  } finally {
    isLoading.value = false
  }
}

function openStatusModal(status: string) {
  nextStatus.value = status
  statusNote.value = ''
  showStatusModal.value = true
}

async function submitStatus() {
  isChangingStatus.value = true
  try {
    await b2bProjectAdminApi().changeStatus(projectId.value, nextStatus.value, statusNote.value)
    toast.success('Status diperbarui', statusMeta[nextStatus.value]?.label || nextStatus.value)
    showStatusModal.value = false
    await load()
  } catch (error: any) {
    toast.error('Gagal mengubah status', error?.message)
  } finally {
    isChangingStatus.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="p-4 sm:p-6 max-w-7xl mx-auto">
    <button
      type="button"
      class="text-sm text-gray-500 hover:text-gray-800 mb-3"
      @click="router.push('/dashboard/b2b-project')"
    >
      ← Kembali ke daftar proyek
    </button>

    <div v-if="isLoading" class="bg-white rounded-xl border border-gray-200 p-10 text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
      <p class="text-sm text-gray-500">Memuat proyek...</p>
    </div>

    <template v-else-if="project">
      <!-- Title -->
      <div class="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-xl font-bold text-gray-900">{{ project.title }}</h1>
            <UBadge
              size="sm"
              :color="statusMeta[project.status]?.color || 'gray'"
              :label="statusMeta[project.status]?.label || project.status"
            />
          </div>
          <p class="text-sm text-gray-500 mt-1">{{ project.code }} · {{ project.client_name }}</p>
        </div>

        <div class="flex items-center gap-2">
          <UButton v-if="canAdvance" size="sm" @click="openStatusModal(flow[currentStep + 1])">
            Lanjut: {{ nextStatusLabel }}
          </UButton>
          <UButton
            v-if="project.status !== 'batal' && project.status !== 'pelunasan'"
            size="sm"
            color="red"
            variant="outline"
            @click="openStatusModal('batal')"
          >
            Batalkan
          </UButton>
        </div>
      </div>

      <!-- Timeline -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 mb-4 overflow-x-auto">
        <div class="flex items-center min-w-[520px]">
          <div v-for="(step, index) in flow" :key="step" class="flex-1 flex items-center">
            <div class="flex flex-col items-center flex-1">
              <span
                class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                :class="index <= currentStep ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'"
              >
                {{ index + 1 }}
              </span>
              <span
                class="text-[11px] mt-1 text-center leading-tight"
                :class="index <= currentStep ? 'text-gray-800 font-semibold' : 'text-gray-400'"
              >
                {{ statusMeta[step]?.label }}
              </span>
            </div>
            <div
              v-if="index < flow.length - 1"
              class="h-0.5 flex-1 -mt-4"
              :class="index < currentStep ? 'bg-primary' : 'bg-gray-200'"
            ></div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          class="px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
          :class="tab === t.id
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-500 hover:text-gray-800'"
          @click="tab = t.id"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- ================= Ringkasan ================= -->
      <div v-if="tab === 'ringkasan'" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="lg:col-span-2 space-y-4">
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <h2 class="text-sm font-bold text-gray-900 mb-3">Informasi Proyek</h2>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt class="text-xs text-gray-500">Kode Proyek</dt>
                <dd class="font-semibold text-gray-900">{{ project.code }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500">Klien</dt>
                <dd class="font-semibold text-gray-900">{{ project.client_name }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500">PIC</dt>
                <dd class="text-gray-800">{{ project.pic_name || '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500">Telepon PIC</dt>
                <dd class="text-gray-800">{{ project.pic_phone || '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500">Nilai Kontrak</dt>
                <dd class="font-semibold text-gray-900">{{ formatIDR(project.contract_value) }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500">Lokasi</dt>
                <dd class="text-gray-800">{{ project.location || '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500">Tanggal Mulai</dt>
                <dd class="text-gray-800">{{ project.start_date ? formatDateToYMD(project.start_date) : '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500">Target Selesai</dt>
                <dd class="text-gray-800">{{ project.target_end_date ? formatDateToYMD(project.target_end_date) : '-' }}</dd>
              </div>
            </dl>
            <p v-if="project.notes" class="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
              {{ project.notes }}
            </p>
          </div>

          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <h2 class="text-sm font-bold text-gray-900 mb-3">Riwayat Status</h2>
            <ol v-if="detail?.status_logs?.length" class="relative border-l border-gray-200 ml-2 space-y-3">
              <li v-for="log in detail.status_logs" :key="log.id" class="ml-4">
                <span class="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-primary"></span>
                <p class="text-sm font-medium text-gray-800">
                  {{ statusMeta[log.to_status]?.label || log.to_status }}
                </p>
                <p class="text-xs text-gray-500">{{ log.created_at?.replace('T', ' ').slice(0, 16) }}</p>
                <p v-if="log.note" class="text-xs text-gray-500 italic">{{ log.note }}</p>
              </li>
            </ol>
            <p v-else class="text-sm text-gray-500">Belum ada riwayat.</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <h2 class="text-sm font-bold text-gray-900 mb-3">Progres Keuangan</h2>
            <p class="text-xs text-gray-500">Sudah dibayar</p>
            <p class="text-xl font-bold text-gray-900">{{ formatIDR(paidTotal) }}</p>
            <p class="text-xs text-gray-500 mt-1">dari {{ formatIDR(project.contract_value) }}</p>
            <div class="h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
              <div class="h-full bg-primary" :style="{ width: paidPercent + '%' }"></div>
            </div>
            <p class="text-xs text-gray-500 mt-1">{{ paidPercent }}% terbayar</p>
          </div>

          <div
            v-if="margin"
            class="rounded-xl border p-4"
            :class="margin.is_over_budget ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'"
          >
            <h2 class="text-sm font-bold mb-2" :class="margin.is_over_budget ? 'text-red-700' : 'text-gray-900'">
              Margin
            </h2>
            <p class="text-xs text-gray-600">Anggaran: {{ formatIDR(margin.budget) }}</p>
            <p class="text-xs text-gray-600">Realisasi: {{ formatIDR(margin.actual) }}</p>
            <p class="text-lg font-bold mt-1" :class="margin.is_over_budget ? 'text-red-700' : 'text-green-700'">
              {{ formatIDR(margin.margin_amount) }}
            </p>
            <p class="text-xs" :class="margin.is_over_budget ? 'text-red-600' : 'text-gray-500'">
              {{ margin.usage_percent }}% anggaran terpakai
            </p>
          </div>
        </div>
      </div>

      <!-- ================= Other tabs ================= -->
      <QuotationPanel
        v-else-if="tab === 'penawaran'"
        :project-id="projectId"
        :project="project"
        :quotations="detail?.quotations || []"
        @changed="load"
      />

      <MilestonePanel
        v-else-if="tab === 'termin'"
        :project-id="projectId"
        :milestones="detail?.milestones || []"
        :contract-value="project.contract_value"
        @changed="load"
      />

      <MarginPanel
        v-else-if="tab === 'margin' && margin"
        :project-id="projectId"
        :margin="margin"
        :expenses="detail?.expenses || []"
        @changed="load"
      />

      <WorkOrderPanel
        v-else-if="tab === 'wo'"
        :project-id="projectId"
        :project="project"
        :work-orders="detail?.work_orders || []"
        :basts="detail?.basts || []"
        @changed="load"
      />
    </template>

    <!-- Status modal -->
    <UModal v-model="showStatusModal">
      <div class="p-5">
        <h2 class="text-lg font-bold text-gray-900 mb-1">Ubah Status Proyek</h2>
        <p class="text-sm text-gray-500 mb-4">
          Status baru: <strong>{{ statusMeta[nextStatus]?.label || nextStatus }}</strong>
        </p>
        <UFormGroup label="Catatan (opsional)">
          <UTextarea v-model="statusNote" :rows="3" placeholder="Alasan perubahan status" />
        </UFormGroup>
        <div class="flex justify-end gap-2 mt-4">
          <UButton color="gray" variant="ghost" @click="showStatusModal = false">Batal</UButton>
          <UButton :loading="isChangingStatus" @click="submitStatus">Simpan</UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>
