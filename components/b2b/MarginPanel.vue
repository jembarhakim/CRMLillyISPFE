<script setup lang="ts">
import { b2bProjectAdminApi, type B2BExpense, type MarginSummary } from '@/api/admin/b2b-project'
import { accountAdminApi } from '@/api/admin/account'
import { formatIDR } from '@/helper/currency'
import { formatDateToYMD } from '@/helper/date'

const props = defineProps<{
  projectId: string
  margin: MarginSummary
  expenses: B2BExpense[]
}>()

const emit = defineEmits<{ (e: 'changed'): void }>()

const toast = useCustomToast()

const showForm = ref(false)
const isSaving = ref(false)
const busyId = ref('')
const accounts = ref<{ label: string; value: string }[]>([])

const form = reactive({
  category: 'material',
  description: '',
  amount: 0,
  expense_date: '',
  account_id: '',
})

const categoryMeta: Record<string, { label: string; color: 'blue' | 'orange' | 'green' | 'gray' }> = {
  material: { label: 'Material', color: 'blue' },
  transport: { label: 'Transport', color: 'orange' },
  wage: { label: 'Upah', color: 'green' },
  other: { label: 'Lainnya', color: 'gray' },
}

// Budget usage bar: green under 80%, amber under 100%, red when over.
const usageColor = computed(() => {
  if (props.margin.is_over_budget) return 'bg-red-500'
  if (props.margin.usage_percent >= 80) return 'bg-amber-500'
  return 'bg-green-500'
})

const barWidth = computed(() => `${Math.min(100, Math.max(0, props.margin.usage_percent))}%`)

async function loadAccounts() {
  try {
    const res = await accountAdminApi().getAllAccount()
    const list = res?.data || []
    accounts.value = list.map((a: any) => ({
      label: a.name || a.account_name || a.id,
      value: a.id,
    }))
  } catch {
    // Account list is optional: expenses can still be recorded without cash link.
    accounts.value = []
  }
}

function resetForm() {
  Object.assign(form, {
    category: 'material', description: '', amount: 0, expense_date: '', account_id: '',
  })
}

async function submit() {
  if (!form.description.trim() || !(Number(form.amount) > 0)) {
    toast.error('Data belum lengkap', 'Deskripsi dan nominal wajib diisi.')
    return
  }

  isSaving.value = true
  try {
    await b2bProjectAdminApi().createExpense(props.projectId, {
      ...form,
      amount: Number(form.amount),
    })
    toast.success('Pengeluaran dicatat', 'Tersinkron ke kas keluar.')
    showForm.value = false
    resetForm()
    emit('changed')
  } catch (error: any) {
    toast.error('Gagal mencatat pengeluaran', error?.message)
  } finally {
    isSaving.value = false
  }
}

async function remove(expense: B2BExpense) {
  busyId.value = expense.id
  try {
    await b2bProjectAdminApi().deleteExpense(expense.id)
    toast.success('Pengeluaran dihapus', expense.description)
    emit('changed')
  } catch (error: any) {
    toast.error('Gagal menghapus', error?.message)
  } finally {
    busyId.value = ''
  }
}

onMounted(loadAccounts)
</script>

<template>
  <div class="space-y-4">
    <!-- Over-budget alert (BPRJ-01 requirement) -->
    <div
      v-if="margin.is_over_budget"
      class="rounded-xl border border-red-300 bg-red-50 p-4 flex items-start gap-2"
    >
      <LucideIcon name="alert-triangle" :size="18" class="text-red-600 mt-0.5 shrink-0" />
      <div>
        <p class="text-sm font-bold text-red-800">Pengeluaran melebihi anggaran!</p>
        <p class="text-xs text-red-700 mt-0.5">
          Realisasi {{ formatIDR(margin.actual) }} melampaui anggaran
          {{ formatIDR(margin.budget) }} sebesar
          {{ formatIDR(Math.abs(margin.remaining)) }} ({{ margin.usage_percent }}%).
        </p>
      </div>
    </div>

    <!-- Budget vs actual -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-sm font-bold text-gray-900">Anggaran vs Realisasi</h2>
          <p class="text-xs text-gray-500">
            Dasar anggaran:
            {{ margin.budget_source === 'quotation' ? 'Penawaran disetujui' : 'Nilai kontrak' }}
          </p>
        </div>
        <UBadge
          size="sm"
          :color="margin.is_over_budget ? 'red' : 'green'"
          :label="margin.is_over_budget ? 'Over Budget' : 'Dalam Anggaran'"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">
        <div>
          <p class="text-xs text-gray-500">Anggaran</p>
          <p class="text-base font-bold text-gray-900">{{ formatIDR(margin.budget) }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Realisasi</p>
          <p class="text-base font-bold" :class="margin.is_over_budget ? 'text-red-600' : 'text-gray-900'">
            {{ formatIDR(margin.actual) }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Sisa Anggaran</p>
          <p class="text-base font-bold" :class="margin.remaining < 0 ? 'text-red-600' : 'text-green-600'">
            {{ formatIDR(margin.remaining) }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Margin</p>
          <p class="text-base font-bold" :class="margin.margin_amount < 0 ? 'text-red-600' : 'text-green-600'">
            {{ formatIDR(margin.margin_amount) }}
            <span class="text-xs font-normal text-gray-500">({{ margin.margin_percent }}%)</span>
          </p>
        </div>
      </div>

      <div class="mt-4">
        <div class="flex justify-between text-xs text-gray-500 mb-1">
          <span>Pemakaian anggaran</span>
          <span>{{ margin.usage_percent }}%</span>
        </div>
        <div class="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full transition-all" :class="usageColor" :style="{ width: barWidth }"></div>
        </div>
      </div>

      <div
        v-if="margin.by_category?.length"
        class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100"
      >
        <div v-for="cat in margin.by_category" :key="cat.category">
          <p class="text-xs text-gray-500">{{ cat.label }}</p>
          <p class="text-sm font-semibold text-gray-900">{{ formatIDR(cat.amount) }}</p>
          <p class="text-[11px] text-gray-400">{{ cat.percent }}% dari realisasi</p>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-sm font-bold text-gray-900">Pengeluaran Lapangan</h2>
        <p class="text-xs text-gray-500">
          Setiap pengeluaran otomatis tercatat di kas keluar perusahaan.
        </p>
      </div>
      <UButton size="sm" @click="showForm = !showForm">
        <LucideIcon name="plus" :size="15" class="mr-1" />
        Catat Pengeluaran
      </UButton>
    </div>

    <!-- Expense form -->
    <div v-if="showForm" class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <UFormGroup label="Kategori">
          <USelect
            v-model="form.category"
            :options="[
              { label: 'Material', value: 'material' },
              { label: 'Transport', value: 'transport' },
              { label: 'Upah Harian', value: 'wage' },
              { label: 'Lainnya', value: 'other' },
            ]"
          />
        </UFormGroup>
        <UFormGroup label="Tanggal">
          <UInput v-model="form.expense_date" type="date" />
        </UFormGroup>
      </div>

      <UFormGroup label="Deskripsi" required>
        <UInput v-model="form.description" placeholder="Contoh: Kabel UTP 300m" />
      </UFormGroup>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <UFormGroup label="Nominal (Rp)" required>
          <UInput v-model.number="form.amount" type="number" min="0" />
        </UFormGroup>
        <UFormGroup label="Sumber Kas (opsional)">
          <USelect
            v-model="form.account_id"
            :options="[{ label: 'Tanpa link kas', value: '' }, ...accounts]"
          />
        </UFormGroup>
      </div>

      <p class="text-xs text-gray-500">
        Pilih sumber kas agar pengeluaran ikut tercatat pada laporan kas keluar.
      </p>

      <div class="flex justify-end gap-2">
        <UButton color="gray" variant="ghost" @click="showForm = false; resetForm()">Batal</UButton>
        <UButton :loading="isSaving" @click="submit">Simpan</UButton>
      </div>
    </div>

    <!-- Expense list -->
    <div v-if="!expenses.length" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <p class="text-sm text-gray-500">Belum ada pengeluaran tercatat.</p>
    </div>

    <div v-else class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs text-gray-500 border-b border-gray-200 bg-gray-50">
            <th class="px-3 py-2.5">Tanggal</th>
            <th class="px-3 py-2.5">Kategori</th>
            <th class="px-3 py-2.5">Deskripsi</th>
            <th class="px-3 py-2.5 text-right">Nominal</th>
            <th class="px-3 py-2.5">Kas</th>
            <th class="px-3 py-2.5 w-12"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in expenses" :key="e.id" class="border-b border-gray-50">
            <td class="px-3 py-2.5 text-gray-600">
              {{ e.expense_date ? formatDateToYMD(e.expense_date) : '-' }}
            </td>
            <td class="px-3 py-2.5">
              <UBadge
                size="sm"
                :color="categoryMeta[e.category]?.color || 'gray'"
                :label="categoryMeta[e.category]?.label || e.category"
              />
            </td>
            <td class="px-3 py-2.5 text-gray-800">{{ e.description }}</td>
            <td class="px-3 py-2.5 text-right font-semibold text-gray-900">{{ formatIDR(e.amount) }}</td>
            <td class="px-3 py-2.5 text-xs">
              <span v-if="e.transaction_id" class="text-green-600">Tercatat</span>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="px-3 py-2.5 text-right">
              <UButton size="2xs" color="red" variant="ghost" :loading="busyId === e.id" @click="remove(e)">
                <LucideIcon name="trash" :size="13" />
              </UButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
