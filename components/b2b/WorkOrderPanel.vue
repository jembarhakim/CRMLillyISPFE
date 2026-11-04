<script setup lang="ts">
import {
  b2bProjectAdminApi,
  type B2BBast,
  type B2BWorkOrder,
} from '@/api/admin/b2b-project'
import { downloadBastPdf, parseBastItems } from '@/helper/b2bPdf'
import { formatDateToYMD } from '@/helper/date'

const props = defineProps<{
  projectId: string
  project: any
  workOrders: B2BWorkOrder[]
  basts: B2BBast[]
}>()

const emit = defineEmits<{ (e: 'changed'): void }>()

const toast = useCustomToast()

type Tab = 'wo' | 'bast'
const subTab = ref<Tab>('wo')

const showWoForm = ref(false)
const isSavingWo = ref(false)
const busyId = ref('')

const woForm = reactive({
  title: '',
  description: '',
  scheduled_date: '',
  assignee_name: '',
})

const statusMeta: Record<string, { label: string; color: 'gray' | 'blue' | 'green' | 'red' }> = {
  open: { label: 'Terbuka', color: 'gray' },
  in_progress: { label: 'Dikerjakan', color: 'blue' },
  completed: { label: 'Selesai', color: 'green' },
  cancelled: { label: 'Dibatalkan', color: 'red' },
}

// --- BAST form --------------------------------------------------------------
type BastLine = { name: string; qty: number; unit: string; note: string }

const showBastForm = ref(false)
const isSavingBast = ref(false)

const bastHead = reactive({
  work_order_id: '',
  signed_by_client: '',
  signed_by_vendor: '',
  signed_date: '',
  notes: '',
})

const bastLines = ref<BastLine[]>([])

const makeBastLine = (): BastLine => ({ name: '', qty: 1, unit: 'unit', note: '' })

// Prefill the checklist from the latest approved RAB so the technician only
// has to tick/adjust what was actually installed.
async function prefillFromQuotation() {
  try {
    const res = await b2bProjectAdminApi().listQuotations(props.projectId)
    const list = res?.data || []
    const approved = list.find((q: any) => q.status === 'approved') || list[0]
    if (!approved) {
      bastLines.value = [makeBastLine()]
      return
    }
    const full = await b2bProjectAdminApi().getQuotation(approved.id)
    const items = full?.data?.items || []
    bastLines.value = items.length
      ? items.map((i: any) => ({
          name: i.name,
          qty: Number(i.qty) || 1,
          unit: i.unit || 'unit',
          note: '',
        }))
      : [makeBastLine()]
  } catch {
    bastLines.value = [makeBastLine()]
  }
}

async function openBastForm() {
  showBastForm.value = true
  bastHead.signed_date = new Date().toISOString().slice(0, 10)
  bastHead.signed_by_client = props.project?.pic_name || ''
  bastHead.signed_by_vendor = ''
  bastHead.notes = ''
  bastHead.work_order_id = ''
  await prefillFromQuotation()
}

function addBastLine() {
  bastLines.value.push(makeBastLine())
}

function removeBastLine(index: number) {
  if (bastLines.value.length === 1) return
  bastLines.value.splice(index, 1)
}

// --- Actions ----------------------------------------------------------------

async function createWo() {
  if (!woForm.title.trim()) {
    toast.error('Judul WO wajib diisi')
    return
  }
  isSavingWo.value = true
  try {
    await b2bProjectAdminApi().createWorkOrder(props.projectId, { ...woForm })
    toast.success('Work order dibuat')
    showWoForm.value = false
    Object.assign(woForm, { title: '', description: '', scheduled_date: '', assignee_name: '' })
    emit('changed')
  } catch (error: any) {
    toast.error('Gagal membuat WO', error?.message)
  } finally {
    isSavingWo.value = false
  }
}

async function setWoStatus(wo: B2BWorkOrder, status: string) {
  busyId.value = wo.id
  try {
    await b2bProjectAdminApi().updateWorkOrder(wo.id, { status })
    toast.success('Status WO diperbarui', statusMeta[status]?.label || status)
    emit('changed')
  } catch (error: any) {
    toast.error('Gagal mengubah status', error?.message)
  } finally {
    busyId.value = ''
  }
}

async function submitBast() {
  const valid = bastLines.value.filter((l) => l.name.trim() && Number(l.qty) > 0)
  if (!valid.length) {
    toast.error('Daftar perangkat kosong', 'Tambahkan minimal satu baris.')
    return
  }

  isSavingBast.value = true
  try {
    const res = await b2bProjectAdminApi().generateBast(props.projectId, {
      work_order_id: bastHead.work_order_id || undefined,
      signed_by_client: bastHead.signed_by_client,
      signed_by_vendor: bastHead.signed_by_vendor,
      signed_date: bastHead.signed_date,
      notes: bastHead.notes,
      items: valid.map((l) => ({
        name: l.name,
        qty: Number(l.qty),
        unit: l.unit,
        note: l.note,
      })),
    })
    toast.success('BAST dibuat', res?.data?.number || '')
    showBastForm.value = false
    emit('changed')
  } catch (error: any) {
    toast.error('Gagal membuat BAST', error?.message)
  } finally {
    isSavingBast.value = false
  }
}

async function printBast(bast: B2BBast) {
  busyId.value = bast.id
  try {
    await downloadBastPdf(
      {
        code: props.project.code,
        title: props.project.title,
        client_name: props.project.client_name,
        pic_name: props.project.pic_name,
        location: props.project.location,
      },
      {
        number: bast.number,
        signed_by_client: bast.signed_by_client,
        signed_by_vendor: bast.signed_by_vendor,
        signed_date: bast.signed_date,
        notes: bast.notes,
        items: parseBastItems(bast.items_snapshot),
      },
      props.project.company || {}
    )
  } catch (error: any) {
    toast.error('Gagal membuat PDF BAST', error?.message)
  } finally {
    busyId.value = ''
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Sub tabs -->
    <div class="flex gap-1 border-b border-gray-200">
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium border-b-2"
        :class="subTab === 'wo' ? 'border-primary text-primary' : 'border-transparent text-gray-500'"
        @click="subTab = 'wo'"
      >
        Work Order
      </button>
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium border-b-2"
        :class="subTab === 'bast' ? 'border-primary text-primary' : 'border-transparent text-gray-500'"
        @click="subTab = 'bast'"
      >
        BAST
      </button>
    </div>

    <!-- ================= Work Order ================= -->
    <template v-if="subTab === 'wo'">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 class="text-sm font-bold text-gray-900">Work Order Proyek</h2>
          <p class="text-xs text-gray-500">
            WO terhubung ke ID proyek; membuat WO memindahkan proyek ke tahap Pengerjaan.
          </p>
        </div>
        <UButton size="sm" @click="showWoForm = !showWoForm">
          <LucideIcon name="plus" :size="15" class="mr-1" />
          WO Baru
        </UButton>
      </div>

      <div v-if="showWoForm" class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <UFormGroup label="Judul Pekerjaan" required>
          <UInput v-model="woForm.title" placeholder="Instalasi kabel backbone lantai 2" />
        </UFormGroup>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <UFormGroup label="Jadwal">
            <UInput v-model="woForm.scheduled_date" type="date" />
          </UFormGroup>
          <UFormGroup label="Teknisi / Pelaksana">
            <UInput v-model="woForm.assignee_name" />
          </UFormGroup>
        </div>
        <UFormGroup label="Instruksi">
          <UTextarea v-model="woForm.description" :rows="3" />
        </UFormGroup>
        <div class="flex justify-end gap-2">
          <UButton color="gray" variant="ghost" @click="showWoForm = false">Batal</UButton>
          <UButton :loading="isSavingWo" @click="createWo">Simpan WO</UButton>
        </div>
      </div>

      <div v-if="!workOrders.length" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p class="text-sm text-gray-500">Belum ada work order.</p>
      </div>

      <div v-else class="space-y-2.5">
        <div v-for="wo in workOrders" :key="wo.id" class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono text-gray-500">{{ wo.number }}</span>
                <UBadge
                  size="sm"
                  :color="statusMeta[wo.status]?.color || 'gray'"
                  :label="statusMeta[wo.status]?.label || wo.status"
                />
              </div>
              <p class="text-sm font-semibold text-gray-900 mt-0.5">{{ wo.title }}</p>
              <p class="text-xs text-gray-500 mt-0.5">
                Jadwal {{ wo.scheduled_date ? formatDateToYMD(wo.scheduled_date) : '-' }}
                <span v-if="wo.assignee_name"> · {{ wo.assignee_name }}</span>
              </p>
              <p v-if="wo.description" class="text-xs text-gray-600 mt-1">{{ wo.description }}</p>
            </div>

            <div class="flex items-center gap-1.5">
              <UButton
                v-if="wo.status === 'open'"
                size="2xs"
                color="blue"
                variant="outline"
                :loading="busyId === wo.id"
                @click="setWoStatus(wo, 'in_progress')"
              >
                Mulai
              </UButton>
              <UButton
                v-if="wo.status !== 'completed' && wo.status !== 'cancelled'"
                size="2xs"
                color="green"
                :loading="busyId === wo.id"
                @click="setWoStatus(wo, 'completed')"
              >
                Selesaikan
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ================= BAST ================= -->
    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 class="text-sm font-bold text-gray-900">Berita Acara Serah Terima</h2>
          <p class="text-xs text-gray-500">
            Menandatangani BAST otomatis menyelesaikan WO terkait dan memindahkan proyek ke Serah Terima.
          </p>
        </div>
        <UButton size="sm" @click="showBastForm ? (showBastForm = false) : openBastForm()">
          <LucideIcon name="plus" :size="15" class="mr-1" />
          Generate BAST
        </UButton>
      </div>

      <!-- BAST form -->
      <div v-if="showBastForm" class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <UFormGroup label="Work Order Terkait">
            <USelect
              v-model="bastHead.work_order_id"
              :options="[
                { label: 'Tanpa WO', value: '' },
                ...workOrders.map((w) => ({ label: `${w.number} — ${w.title}`, value: w.id })),
              ]"
            />
          </UFormGroup>
          <UFormGroup label="Tanggal Tanda Tangan">
            <UInput v-model="bastHead.signed_date" type="date" />
          </UFormGroup>
          <UFormGroup label="Disetujui Oleh (Klien)">
            <UInput v-model="bastHead.signed_by_client" />
          </UFormGroup>
        </div>

        <UFormGroup label="Diserahkan Oleh (Pelaksana)">
          <UInput v-model="bastHead.signed_by_vendor" placeholder="Nama penanggung jawab" />
        </UFormGroup>

        <!-- Installed items -->
        <div>
          <p class="text-xs font-semibold text-gray-700 mb-2">
            Daftar Perangkat / Pekerjaan Terpasang
          </p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-gray-500 border-b border-gray-200">
                  <th class="py-2 pr-2">Nama</th>
                  <th class="py-2 pr-2 w-20">Qty</th>
                  <th class="py-2 pr-2 w-24">Satuan</th>
                  <th class="py-2 pr-2">Keterangan</th>
                  <th class="py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(line, index) in bastLines" :key="index" class="border-b border-gray-50">
                  <td class="py-1.5 pr-2"><UInput v-model="line.name" size="sm" /></td>
                  <td class="py-1.5 pr-2"><UInput v-model.number="line.qty" type="number" min="0" size="sm" /></td>
                  <td class="py-1.5 pr-2"><UInput v-model="line.unit" size="sm" /></td>
                  <td class="py-1.5 pr-2"><UInput v-model="line.note" size="sm" /></td>
                  <td class="py-1.5">
                    <UButton
                      size="2xs"
                      color="red"
                      variant="ghost"
                      :disabled="bastLines.length === 1"
                      @click="removeBastLine(index)"
                    >
                      <LucideIcon name="x" :size="14" />
                    </UButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <UButton size="xs" variant="outline" color="gray" class="mt-2" @click="addBastLine">
            <LucideIcon name="plus" :size="14" class="mr-1" />
            Tambah Baris
          </UButton>
        </div>

        <UFormGroup label="Catatan">
          <UTextarea v-model="bastHead.notes" :rows="2" />
        </UFormGroup>

        <div class="flex justify-end gap-2">
          <UButton color="gray" variant="ghost" @click="showBastForm = false">Batal</UButton>
          <UButton :loading="isSavingBast" @click="submitBast">Simpan BAST</UButton>
        </div>
      </div>

      <!-- BAST list -->
      <div v-if="!basts.length" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p class="text-sm text-gray-500">Belum ada BAST. Generate setelah pekerjaan selesai.</p>
      </div>

      <div v-else class="space-y-2.5">
        <div v-for="b in basts" :key="b.id" class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-bold text-gray-900">{{ b.number }}</p>
              <p class="text-xs text-gray-500 mt-0.5">
                Ditandatangani {{ b.signed_date ? formatDateToYMD(b.signed_date) : '-' }}
                · {{ parseBastItems(b.items_snapshot).length }} item
              </p>
              <p class="text-xs text-gray-500">
                Klien: {{ b.signed_by_client || '-' }}
                <span v-if="b.signed_by_vendor"> · Pelaksana: {{ b.signed_by_vendor }}</span>
              </p>
            </div>
            <UButton size="xs" variant="outline" color="gray" :loading="busyId === b.id" @click="printBast(b)">
              <LucideIcon name="download" :size="14" class="mr-1" />
              Cetak PDF
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
