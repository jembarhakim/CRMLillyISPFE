<script setup lang="ts">
import { b2bProjectAdminApi, type B2BMilestone } from '@/api/admin/b2b-project'
import { formatIDR } from '@/helper/currency'
import { formatDateToYMD } from '@/helper/date'

const props = defineProps<{
  projectId: string
  milestones: B2BMilestone[]
  contractValue: number
}>()

const emit = defineEmits<{ (e: 'changed'): void }>()

const toast = useCustomToast()

const showGenerate = ref(false)
const isGenerating = ref(false)
const busyId = ref('')

const preset = ref('dp_50_100')
const base = ref('contract')

const presets = [
  { label: 'DP 50% + Pelunasan 50%', value: 'dp_50_100' },
  { label: 'DP 30% + Progress 50% + Pelunasan 20%', value: 'dp_30_50_20' },
  { label: 'DP 50% + Pelunasan 50% (2 termin)', value: 'dp_50_50' },
]

const statusMeta: Record<string, { label: string; color: 'gray' | 'blue' | 'green' }> = {
  pending: { label: 'Belum Diterbitkan', color: 'gray' },
  invoiced: { label: 'Sudah Ditagihkan', color: 'blue' },
  paid: { label: 'Lunas', color: 'green' },
}

const totalScheduled = computed(() => props.milestones.reduce((sum, m) => sum + m.amount, 0))
const totalPaid = computed(() =>
  props.milestones.filter((m) => m.status === 'paid').reduce((sum, m) => sum + m.amount, 0)
)
const paidPercent = computed(() =>
  totalScheduled.value > 0 ? Math.round((totalPaid.value / totalScheduled.value) * 100) : 0
)

// A schedule may only be regenerated while nothing has been invoiced yet.
const canRegenerate = computed(() => props.milestones.every((m) => m.status === 'pending'))

async function generate() {
  isGenerating.value = true
  try {
    const res = await b2bProjectAdminApi().generateMilestones(props.projectId, {
      preset: preset.value,
      base: base.value,
    })
    toast.success('Jadwal termin dibuat', `${res?.data?.length || 0} termin`)
    showGenerate.value = false
    emit('changed')
  } catch (error: any) {
    toast.error('Gagal membuat termin', error?.message)
  } finally {
    isGenerating.value = false
  }
}

async function issue(milestone: B2BMilestone) {
  busyId.value = milestone.id
  try {
    const res = await b2bProjectAdminApi().issueMilestone(milestone.id)
    toast.success('Invoice diterbitkan', res?.data?.invoice_number || '')
    emit('changed')
  } catch (error: any) {
    toast.error('Gagal menerbitkan invoice', error?.message)
  } finally {
    busyId.value = ''
  }
}

async function pay(milestone: B2BMilestone) {
  busyId.value = milestone.id
  try {
    await b2bProjectAdminApi().payMilestone(milestone.id)
    toast.success('Termin ditandai lunas', milestone.name)
    emit('changed')
  } catch (error: any) {
    toast.error('Gagal menandai lunas', error?.message)
  } finally {
    busyId.value = ''
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Summary -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Nilai Kontrak</p>
        <p class="text-lg font-bold text-gray-900 mt-1">{{ formatIDR(contractValue) }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Total Termin</p>
        <p class="text-lg font-bold text-gray-900 mt-1">{{ formatIDR(totalScheduled) }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Sudah Lunas ({{ paidPercent }}%)</p>
        <p class="text-lg font-bold text-green-600 mt-1">{{ formatIDR(totalPaid) }}</p>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-sm font-bold text-gray-900">Termin Pembayaran</h2>
        <p class="text-xs text-gray-500">
          Terbitkan invoice per termin; status proyek menjadi Pelunasan saat semua termin lunas.
        </p>
      </div>
      <UButton v-if="canRegenerate" size="sm" @click="showGenerate = !showGenerate">
        <LucideIcon name="plus" :size="15" class="mr-1" />
        {{ milestones.length ? 'Buat Ulang Jadwal' : 'Buat Jadwal Termin' }}
      </UButton>
    </div>

    <!-- Generate form -->
    <div v-if="showGenerate" class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <UFormGroup label="Skema Termin">
          <USelect v-model="preset" :options="presets" />
        </UFormGroup>
        <UFormGroup label="Dasar Nilai">
          <USelect
            v-model="base"
            :options="[
              { label: 'Nilai Kontrak Proyek', value: 'contract' },
              { label: 'Grand Total Penawaran Disetujui', value: 'quotation' },
            ]"
          />
        </UFormGroup>
      </div>
      <p class="text-xs text-gray-500">
        Total persentase harus 100%. Nominal dihitung otomatis dari dasar nilai yang dipilih.
      </p>
      <div class="flex justify-end gap-2">
        <UButton color="gray" variant="ghost" @click="showGenerate = false">Batal</UButton>
        <UButton :loading="isGenerating" @click="generate">Buat Termin</UButton>
      </div>
    </div>

    <!-- Table -->
    <div v-if="!milestones.length" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <p class="text-sm text-gray-500">Belum ada jadwal termin.</p>
    </div>

    <div v-else class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs text-gray-500 border-b border-gray-200 bg-gray-50">
            <th class="px-3 py-2.5">Termin</th>
            <th class="px-3 py-2.5 w-16 text-center">%</th>
            <th class="px-3 py-2.5 text-right">Nominal</th>
            <th class="px-3 py-2.5">Jatuh Tempo</th>
            <th class="px-3 py-2.5">Status</th>
            <th class="px-3 py-2.5">No. Invoice</th>
            <th class="px-3 py-2.5 w-44"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in milestones" :key="m.id" class="border-b border-gray-50">
            <td class="px-3 py-2.5 font-medium text-gray-800">{{ m.name }}</td>
            <td class="px-3 py-2.5 text-center text-gray-600">{{ m.percentage }}%</td>
            <td class="px-3 py-2.5 text-right font-semibold text-gray-900">{{ formatIDR(m.amount) }}</td>
            <td class="px-3 py-2.5 text-gray-600">
              {{ m.due_date ? formatDateToYMD(m.due_date) : '-' }}
            </td>
            <td class="px-3 py-2.5">
              <UBadge
                size="sm"
                :color="statusMeta[m.status]?.color || 'gray'"
                :label="statusMeta[m.status]?.label || m.status"
              />
            </td>
            <td class="px-3 py-2.5 text-xs text-gray-500 font-mono">{{ m.invoice_number || '-' }}</td>
            <td class="px-3 py-2.5">
              <div class="flex items-center gap-1.5 justify-end">
                <UButton
                  v-if="m.status === 'pending'"
                  size="2xs"
                  :loading="busyId === m.id"
                  @click="issue(m)"
                >
                  Terbitkan Invoice
                </UButton>
                <UButton
                  v-if="m.status !== 'paid'"
                  size="2xs"
                  color="green"
                  variant="outline"
                  :loading="busyId === m.id"
                  @click="pay(m)"
                >
                  Tandai Lunas
                </UButton>
                <span v-else class="text-xs text-green-600 font-medium">Selesai</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
