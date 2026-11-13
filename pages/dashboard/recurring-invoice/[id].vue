<script setup lang="ts">
import { recurringInvoiceAdminApi, type RecurringInvoice, type RecurringInvoiceHistory } from '@/api/admin/recurring-invoice'
import { useCustomToast } from '@/composables/useCustomToast'

const route = useRoute()
const router = useRouter()
const toast = useCustomToast()

const id = computed(() => String(route.params.id || ''))
const loading = ref(false)
const invoice = ref<RecurringInvoice | null>(null)
const history = ref<RecurringInvoiceHistory[]>([])

async function load() {
  if (!id.value) return
  loading.value = true
  try {
    const [rec, his] = await Promise.all([
      recurringInvoiceAdminApi().getRecurringInvoiceById(id.value),
      recurringInvoiceAdminApi().getRecurringInvoiceHistory(id.value)
    ])
    invoice.value = rec.data
    history.value = his.data || []
  } catch (e) {
    toast.add({ title: 'Gagal', description: 'Gagal memuat tagihan berulang', color: 'red', timeout: 3000 })
  } finally {
    loading.value = false
  }
}

async function generateNow() {
  if (!id.value) return
  try {
    const resp = await recurringInvoiceAdminApi().generateInvoiceFromRecurring({ id: id.value })
    toast.add({ title: 'Berhasil', description: 'Tagihan berhasil dibuat', color: 'green', timeout: 3000 })
    await load()
    if (resp?.data?.id) {
      router.push(`/invoice/${resp.data.id}`)
    }
  } catch (e) {
    toast.add({ title: 'Gagal', description: 'Gagal membuat tagihan', color: 'red', timeout: 3000 })
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Detail Tagihan Berulang</h1>
        <p class="text-gray-600">#{{ id }}</p>
      </div>
      <div class="flex gap-2">
        <UButton color="blue" :loading="loading" @click="load">Muat Ulang</UButton>
        <UButton color="green" @click="generateNow">Buat Tagihan</UButton>
        <UButton color="gray" variant="outline" @click="router.back()">Kembali</UButton>
      </div>
    </div>

    <UCard :ui="{ body: { padding: 'p-4' } }">
      <template #header>
        <div class="font-semibold">Informasi</div>
      </template>
      <div v-if="invoice" class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <div class="text-gray-600 font-medium">Pelanggan</div>
          <div class="font-semibold text-gray-900">{{ invoice.customer?.name }}</div>
        </div>
        <div>
          <div class="text-gray-600 font-medium">Jumlah</div>
          <div class="font-semibold text-gray-900">Rp {{ (invoice.amount || 0).toLocaleString() }}</div>
        </div>
        <div>
          <div class="text-gray-600 font-medium">Frekuensi</div>
          <div class="font-semibold text-gray-900">{{ invoice.frequency }}</div>
        </div>
        <div>
          <div class="text-gray-600 font-medium">Status</div>
          <div class="font-semibold text-gray-900 capitalize">{{ invoice.status }}</div>
        </div>
        <div>
          <div class="text-gray-600 font-medium">Tanggal Tagihan</div>
          <div class="font-semibold text-gray-900">{{ new Date(invoice.invoice_date).toLocaleDateString('id-ID') }}</div>
        </div>
        <div>
          <div class="text-gray-600 font-medium">Tanggal Jatuh Tempo</div>
          <div class="font-semibold text-gray-900">{{ new Date(invoice.due_date).toLocaleDateString('id-ID') }}</div>
        </div>
        <div>
          <div class="text-gray-600 font-medium">Tagihan Berikutnya</div>
          <div class="font-semibold text-blue-700">{{ new Date(invoice.next_invoice_date).toLocaleDateString('id-ID') }}</div>
        </div>
        <div v-if="invoice.description">
          <div class="text-gray-600 font-medium">Deskripsi</div>
          <div class="font-semibold text-gray-900">{{ invoice.description }}</div>
        </div>
      </div>
      <div v-else class="text-gray-500">Memuat...</div>
    </UCard>

    <UCard :ui="{ body: { padding: 'p-0' } }">
      <template #header>
        <div class="font-semibold">Riwayat</div>
      </template>
      <div class="divide-y">
        <div v-if="history.length === 0" class="p-4 text-gray-500 text-sm">Belum ada riwayat.</div>
        <div v-for="h in history" :key="h.id" class="p-4 flex items-center justify-between hover:bg-gray-50">
          <div>
            <div class="font-semibold text-gray-900">Tagihan: {{ h.generated_invoice_id }}</div>
            <div class="text-sm text-gray-600 font-medium">Dibuat: {{ new Date(h.generated_at).toLocaleString('id-ID') }}</div>
            <div class="text-sm text-gray-600 font-medium">Tanggal Tagihan: {{ new Date(h.invoice_date).toLocaleDateString('id-ID') }} • Jatuh Tempo: {{ new Date(h.due_date).toLocaleDateString('id-ID') }}</div>
          </div>
          <div class="flex gap-2">
            <UButton 
              size="sm" 
              color="blue" 
              variant="solid" 
              @click="router.push(`/invoice/${h.generated_invoice_id}`)"
              class="shadow-sm"
            >
              Buka
            </UButton>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>


