<script setup lang="ts">
import { b2bProjectAdminApi, type B2BProject } from '@/api/admin/b2b-project'
import { formatIDR } from '@/helper/currency'
import { formatDateToYMD } from '@/helper/date'

useHead({ title: 'Proyek B2B - CRM System' })
definePageMeta({ ssr: false })

const toast = useCustomToast()
const router = useRouter()

const projects = ref<B2BProject[]>([])
const isLoading = ref(true)
const isSaving = ref(false)
const search = ref('')
const statusFilter = ref('')

const showCreate = ref(false)

// Status metadata drives both the table badge and the filter dropdown.
const statusMeta: Record<string, { label: string; color: 'gray' | 'blue' | 'green' | 'orange' | 'red' }> = {
  penawaran: { label: 'Penawaran', color: 'gray' },
  deal: { label: 'Deal', color: 'blue' },
  pengerjaan: { label: 'Pengerjaan', color: 'orange' },
  serah_terima: { label: 'Serah Terima', color: 'green' },
  pelunasan: { label: 'Pelunasan', color: 'green' },
  batal: { label: 'Batal', color: 'red' },
}

const columns = [
  { key: 'code', label: 'Kode / Proyek' },
  { key: 'client_name', label: 'Klien' },
  { key: 'contract_value', label: 'Nilai Kontrak' },
  { key: 'period', label: 'Periode' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '' },
]

const form = reactive({
  code: '',
  title: '',
  client_name: '',
  pic_name: '',
  pic_phone: '',
  pic_email: '',
  contract_value: 0,
  start_date: '',
  target_end_date: '',
  location: '',
  notes: '',
})

const summary = computed(() => {
  const total = projects.value.length
  const running = projects.value.filter((p) => p.status === 'pengerjaan').length
  const value = projects.value.reduce((sum, p) => sum + (p.contract_value || 0), 0)
  return { total, running, value }
})

async function load() {
  isLoading.value = true
  try {
    const res = await b2bProjectAdminApi().list(statusFilter.value, search.value)
    projects.value = res?.data || []
  } catch (error: any) {
    toast.error('Gagal memuat proyek', error?.message)
  } finally {
    isLoading.value = false
  }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(load, 350)
})
watch(statusFilter, load)

async function submitCreate() {
  if (!form.title.trim() || !form.client_name.trim()) {
    toast.error('Data belum lengkap', 'Judul proyek dan nama klien wajib diisi.')
    return
  }

  isSaving.value = true
  try {
    const res = await b2bProjectAdminApi().create({
      ...form,
      contract_value: Number(form.contract_value) || 0,
    })
    toast.success('Proyek dibuat', res?.data?.code || '')
    showCreate.value = false
    resetForm()
    await load()
  } catch (error: any) {
    toast.error('Gagal membuat proyek', error?.message)
  } finally {
    isSaving.value = false
  }
}

function resetForm() {
  Object.assign(form, {
    code: '', title: '', client_name: '', pic_name: '', pic_phone: '', pic_email: '',
    contract_value: 0, start_date: '', target_end_date: '', location: '', notes: '',
  })
}

function openDetail(project: B2BProject) {
  router.push(`/dashboard/b2b-project/${project.id}`)
}

onMounted(load)
</script>

<template>
  <div class="w-full">
    <AdminPageHeader
      class="mb-5"
      title="Proyek B2B"
      description="Proyek borongan insidental: penawaran, pengerjaan, hingga serah terima."
      icon="briefcase"
      eyebrow="Proyek & Kontrak"
    >
      <template #actions>
        <UButton color="primary" @click="showCreate = true">
          <LucideIcon name="plus" :size="16" class="mr-1" />
          Proyek Baru
        </UButton>
      </template>
    </AdminPageHeader>

    <!-- Summary -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Total Proyek</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ summary.total }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Sedang Pengerjaan</p>
        <p class="text-2xl font-bold text-orange-600 mt-1">{{ summary.running }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Total Nilai Kontrak</p>
        <p class="text-lg font-bold text-gray-900 mt-1">{{ formatIDR(summary.value) }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-2 mb-3">
      <UInput
        v-model="search"
        placeholder="Cari kode, judul, atau klien..."
        class="w-full sm:w-72"
      />
      <USelect
        v-model="statusFilter"
        :options="[
          { label: 'Semua status', value: '' },
          { label: 'Penawaran', value: 'penawaran' },
          { label: 'Deal', value: 'deal' },
          { label: 'Pengerjaan', value: 'pengerjaan' },
          { label: 'Serah Terima', value: 'serah_terima' },
          { label: 'Pelunasan', value: 'pelunasan' },
          { label: 'Batal', value: 'batal' },
        ]"
        class="w-full sm:w-48"
      />
      <UButton variant="ghost" color="gray" :loading="isLoading" @click="load">
        <LucideIcon name="refresh-cw" :size="16" />
      </UButton>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <UTable :rows="projects" :columns="columns" :loading="isLoading">
        <template #code-data="{ row }">
          <div class="min-w-0">
            <p class="font-semibold text-gray-900">{{ row.code }}</p>
            <p class="text-xs text-gray-500 truncate">{{ row.title }}</p>
          </div>
        </template>

        <template #client_name-data="{ row }">
          <div class="min-w-0">
            <p class="text-sm text-gray-800">{{ row.client_name }}</p>
            <p class="text-xs text-gray-500 truncate">{{ row.pic_name || '-' }}</p>
          </div>
        </template>

        <template #contract_value-data="{ row }">
          <span class="font-semibold text-gray-900">{{ formatIDR(row.contract_value) }}</span>
        </template>

        <template #period-data="{ row }">
          <p class="text-xs text-gray-600">
            {{ row.start_date ? formatDateToYMD(row.start_date) : '-' }}
            <span class="text-gray-400">→</span>
            {{ row.target_end_date ? formatDateToYMD(row.target_end_date) : '-' }}
          </p>
        </template>

        <template #status-data="{ row }">
          <UBadge
            size="sm"
            :color="statusMeta[row.status]?.color || 'gray'"
            :label="statusMeta[row.status]?.label || row.status"
          />
        </template>

        <template #actions-data="{ row }">
          <UButton size="xs" color="gray" variant="ghost" @click="openDetail(row)">
            Detail
          </UButton>
        </template>
      </UTable>
    </div>

    <!-- Create modal -->
    <UModal v-model="showCreate">
      <div class="p-5 max-h-[85vh] overflow-y-auto">
        <h2 class="text-lg font-bold text-gray-900 mb-1">Proyek B2B Baru</h2>
        <p class="text-xs text-gray-500 mb-4">
          Kosongkan kode untuk membuat otomatis (PRJ-YYYYMM-####).
        </p>

        <div class="space-y-3">
          <UFormGroup label="Judul Proyek" required>
            <UInput v-model="form.title" placeholder="Contoh: Instalasi jaringan kantor cabang" />
          </UFormGroup>
          <UFormGroup label="Kode Proyek">
            <UInput v-model="form.code" placeholder="Otomatis jika kosong" />
          </UFormGroup>
          <UFormGroup label="Nama Klien / Instansi" required>
            <UInput v-model="form.client_name" placeholder="PT / Dinas / Instansi" />
          </UFormGroup>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormGroup label="PIC Klien">
              <UInput v-model="form.pic_name" />
            </UFormGroup>
            <UFormGroup label="Telepon PIC">
              <UInput v-model="form.pic_phone" />
            </UFormGroup>
          </div>

          <UFormGroup label="Nilai Kontrak (Rp)">
            <UInput v-model.number="form.contract_value" type="number" min="0" />
          </UFormGroup>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormGroup label="Tanggal Mulai">
              <UInput v-model="form.start_date" type="date" />
            </UFormGroup>
            <UFormGroup label="Target Selesai">
              <UInput v-model="form.target_end_date" type="date" />
            </UFormGroup>
          </div>

          <UFormGroup label="Lokasi">
            <UInput v-model="form.location" />
          </UFormGroup>
          <UFormGroup label="Catatan">
            <UTextarea v-model="form.notes" :rows="3" />
          </UFormGroup>
        </div>

        <div class="flex justify-end gap-2 mt-5">
          <UButton color="gray" variant="ghost" @click="showCreate = false">Batal</UButton>
          <UButton :loading="isSaving" @click="submitCreate">Simpan Proyek</UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>
