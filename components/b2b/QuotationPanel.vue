<script setup lang="ts">
import { b2bProjectAdminApi, type B2BQuotation } from '@/api/admin/b2b-project'
import { formatIDR } from '@/helper/currency'
import { downloadQuotationPdf } from '@/helper/b2bPdf'

const props = defineProps<{
  projectId: string
  project: any
  quotations: B2BQuotation[]
}>()

const emit = defineEmits<{ (e: 'changed'): void }>()

const toast = useCustomToast()

const showForm = ref(false)
const isSaving = ref(false)
const busyId = ref('')

// RAB form state -------------------------------------------------------------
type Line = { category: string; name: string; unit: string; qty: number; unit_price: number; note: string }

const makeLine = (): Line => ({
  category: 'perangkat', name: '', unit: 'unit', qty: 1, unit_price: 0, note: '',
})

const head = reactive({
  subject: '',
  notes: '',
  terms: 'Harga belum termasuk biaya pengiriman di luar area.\nPembayaran sesuai termin yang disepakati.',
  tax_percent: 11,
  valid_until: '',
})

const lines = ref<Line[]>([makeLine()])

const subtotal = computed(() =>
  lines.value.reduce((sum, l) => sum + (Number(l.qty) || 0) * (Number(l.unit_price) || 0), 0)
)
const taxAmount = computed(() => Math.round(subtotal.value * (Number(head.tax_percent) || 0) / 100))
const grandTotal = computed(() => subtotal.value + taxAmount.value)

const nextVersion = computed(() =>
  props.quotations.reduce((max, q) => Math.max(max, q.version), 0) + 1
)

const statusMeta: Record<string, { label: string; color: 'gray' | 'blue' | 'green' | 'red' }> = {
  draft: { label: 'Draft', color: 'gray' },
  sent: { label: 'Terkirim', color: 'blue' },
  approved: { label: 'Disetujui', color: 'green' },
  rejected: { label: 'Ditolak', color: 'red' },
  superseded: { label: 'Digantikan', color: 'gray' },
}

function addLine() {
  lines.value.push(makeLine())
}

function removeLine(index: number) {
  if (lines.value.length === 1) return
  lines.value.splice(index, 1)
}

function resetForm() {
  head.subject = ''
  head.notes = ''
  head.valid_until = ''
  head.tax_percent = 11
  lines.value = [makeLine()]
}

async function submit() {
  const valid = lines.value.filter((l) => l.name.trim() && Number(l.qty) > 0)
  if (!valid.length) {
    toast.error('RAB kosong', 'Tambahkan minimal satu item dengan nama dan qty.')
    return
  }

  isSaving.value = true
  try {
    await b2bProjectAdminApi().createQuotation(props.projectId, {
      subject: head.subject,
      notes: head.notes,
      terms: head.terms,
      tax_percent: Number(head.tax_percent) || 0,
      valid_until: head.valid_until,
      items: valid.map((l) => ({
        category: l.category,
        name: l.name,
        unit: l.unit,
        qty: Number(l.qty),
        unit_price: Number(l.unit_price),
        note: l.note,
      })),
    })
    toast.success('Penawaran dibuat', `Revisi ke-${nextVersion.value - 1}`)
    showForm.value = false
    resetForm()
    emit('changed')
  } catch (error: any) {
    toast.error('Gagal menyimpan penawaran', error?.message)
  } finally {
    isSaving.value = false
  }
}

async function setStatus(quotation: B2BQuotation, status: string) {
  busyId.value = quotation.id
  try {
    await b2bProjectAdminApi().setQuotationStatus(quotation.id, status)
    toast.success('Status penawaran diperbarui', statusMeta[status]?.label || status)
    emit('changed')
  } catch (error: any) {
    toast.error('Gagal mengubah status', error?.message)
  } finally {
    busyId.value = ''
  }
}

async function removeQuotation(quotation: B2BQuotation) {
  busyId.value = quotation.id
  try {
    await b2bProjectAdminApi().deleteQuotation(quotation.id)
    toast.success('Revisi dihapus', `Rev ${quotation.version}`)
    emit('changed')
  } catch (error: any) {
    toast.error('Gagal menghapus', error?.message)
  } finally {
    busyId.value = ''
  }
}

// PDF needs the full revision with its items.
async function printPdf(quotation: B2BQuotation) {
  busyId.value = quotation.id
  try {
    const res = await b2bProjectAdminApi().getQuotation(quotation.id)
    const full = res.data
    await downloadQuotationPdf(
      {
        code: props.project.code,
        title: props.project.title,
        client_name: props.project.client_name,
        pic_name: props.project.pic_name,
        pic_phone: props.project.pic_phone,
        location: props.project.location,
      },
      {
        version: full.version,
        subject: full.subject,
        notes: full.notes,
        terms: full.terms,
        subtotal: full.subtotal,
        tax_percent: full.tax_percent,
        tax_amount: full.tax_amount,
        grand_total: full.grand_total,
        valid_until: full.valid_until,
        created_at: full.created_at,
        items: (full.items || []) as any,
      },
      props.project.company || {}
    )
  } catch (error: any) {
    toast.error('Gagal membuat PDF', error?.message)
  } finally {
    busyId.value = ''
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-sm font-bold text-gray-900">Penawaran Harga (RAB)</h2>
        <p class="text-xs text-gray-500">
          Setiap penyimpanan membuat revisi baru; revisi lama tersimpan sebagai riwayat negosiasi.
        </p>
      </div>
      <UButton size="sm" @click="showForm = !showForm">
        <LucideIcon name="plus" :size="15" class="mr-1" />
        {{ showForm ? 'Tutup Form' : `Revisi Baru (Rev ${nextVersion})` }}
      </UButton>
    </div>

    <!-- Create form -->
    <div v-if="showForm" class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <UFormGroup label="Perihal" class="sm:col-span-2">
          <UInput v-model="head.subject" placeholder="Penawaran instalasi jaringan kantor" />
        </UFormGroup>
        <UFormGroup label="Berlaku s/d">
          <UInput v-model="head.valid_until" type="date" />
        </UFormGroup>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-gray-500 border-b border-gray-200">
              <th class="py-2 pr-2">Kategori</th>
              <th class="py-2 pr-2">Uraian</th>
              <th class="py-2 pr-2 w-20">Qty</th>
              <th class="py-2 pr-2 w-24">Satuan</th>
              <th class="py-2 pr-2 w-32">Harga</th>
              <th class="py-2 pr-2 w-32 text-right">Jumlah</th>
              <th class="py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(line, index) in lines" :key="index" class="border-b border-gray-50">
              <td class="py-1.5 pr-2">
                <USelect
                  v-model="line.category"
                  :options="[
                    { label: 'Perangkat', value: 'perangkat' },
                    { label: 'Kabel', value: 'kabel' },
                    { label: 'Jasa', value: 'jasa' },
                    { label: 'Lainnya', value: 'lainnya' },
                  ]"
                  size="sm"
                />
              </td>
              <td class="py-1.5 pr-2"><UInput v-model="line.name" size="sm" placeholder="Nama barang/jasa" /></td>
              <td class="py-1.5 pr-2"><UInput v-model.number="line.qty" type="number" min="0" size="sm" /></td>
              <td class="py-1.5 pr-2"><UInput v-model="line.unit" size="sm" /></td>
              <td class="py-1.5 pr-2"><UInput v-model.number="line.unit_price" type="number" min="0" size="sm" /></td>
              <td class="py-1.5 pr-2 text-right font-medium whitespace-nowrap">
                {{ formatIDR((Number(line.qty) || 0) * (Number(line.unit_price) || 0)) }}
              </td>
              <td class="py-1.5">
                <UButton size="2xs" color="red" variant="ghost" :disabled="lines.length === 1" @click="removeLine(index)">
                  <LucideIcon name="x" :size="14" />
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <UButton size="xs" variant="outline" color="gray" @click="addLine">
        <LucideIcon name="plus" :size="14" class="mr-1" />
        Tambah Item
      </UButton>

      <div class="flex flex-col sm:flex-row sm:justify-end gap-4 pt-3 border-t border-gray-100">
        <div class="sm:w-72 space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500">Subtotal</span>
            <span class="font-medium">{{ formatIDR(subtotal) }}</span>
          </div>
          <div class="flex items-center justify-between gap-2">
            <span class="text-gray-500">PPN (%)</span>
            <UInput v-model.number="head.tax_percent" type="number" min="0" max="100" size="xs" class="w-20" />
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Nilai PPN</span>
            <span class="font-medium">{{ formatIDR(taxAmount) }}</span>
          </div>
          <div class="flex justify-between border-t border-gray-200 pt-1">
            <span class="font-bold">Grand Total</span>
            <span class="font-bold">{{ formatIDR(grandTotal) }}</span>
          </div>
        </div>
      </div>

      <UFormGroup label="Syarat & Ketentuan">
        <UTextarea v-model="head.terms" :rows="3" />
      </UFormGroup>

      <div class="flex justify-end gap-2">
        <UButton color="gray" variant="ghost" @click="showForm = false; resetForm()">Batal</UButton>
        <UButton :loading="isSaving" @click="submit">Simpan Revisi</UButton>
      </div>
    </div>

    <!-- Revisions -->
    <div v-if="!quotations.length" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <p class="text-sm text-gray-500">Belum ada penawaran untuk proyek ini.</p>
    </div>

    <div v-else class="space-y-3">
      <div v-for="q in quotations" :key="q.id" class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-gray-900">Revisi {{ q.version }}</span>
              <UBadge
                size="sm"
                :color="statusMeta[q.status]?.color || 'gray'"
                :label="statusMeta[q.status]?.label || q.status"
              />
            </div>
            <p class="text-xs text-gray-500 mt-0.5">{{ q.subject || 'Tanpa perihal' }}</p>
            <p class="text-xs text-gray-400 mt-0.5">
              Dibuat {{ q.created_at?.slice(0, 10) }}
              <span v-if="q.valid_until"> · berlaku s/d {{ q.valid_until?.slice(0, 10) }}</span>
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm font-bold text-gray-900">{{ formatIDR(q.grand_total) }}</p>
            <p class="text-[11px] text-gray-500">
              Subtotal {{ formatIDR(q.subtotal) }} + PPN {{ q.tax_percent }}%
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <UButton size="xs" variant="outline" color="gray" :loading="busyId === q.id" @click="printPdf(q)">
            <LucideIcon name="download" :size="14" class="mr-1" />
            Cetak PDF
          </UButton>
          <UButton
            v-if="q.status !== 'approved'"
            size="xs"
            color="green"
            :loading="busyId === q.id"
            @click="setStatus(q, 'approved')"
          >
            Setujui
          </UButton>
          <UButton
            v-if="q.status !== 'rejected' && q.status !== 'approved'"
            size="xs"
            color="red"
            variant="outline"
            :loading="busyId === q.id"
            @click="setStatus(q, 'rejected')"
          >
            Tolak
          </UButton>
          <UButton
            v-if="q.status === 'draft'"
            size="xs"
            variant="ghost"
            color="gray"
            :loading="busyId === q.id"
            @click="setStatus(q, 'sent')"
          >
            Tandai Terkirim
          </UButton>
          <UButton
            v-if="q.status !== 'approved'"
            size="xs"
            variant="ghost"
            color="red"
            :loading="busyId === q.id"
            @click="removeQuotation(q)"
          >
            Hapus
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
