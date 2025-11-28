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
    toast.add({ title: 'Error', description: 'Failed to load recurring invoice', color: 'red', timeout: 3000 })
  } finally {
    loading.value = false
  }
}

async function generateNow() {
  if (!id.value) return
  try {
    const resp = await recurringInvoiceAdminApi().generateInvoiceFromRecurring({ id: id.value })
    toast.add({ title: 'Generated', description: 'Invoice created', color: 'green', timeout: 3000 })
    await load()
    if (resp?.data?.id) {
      router.push(`/invoice/${resp.data.id}`)
    }
  } catch (e) {
    toast.add({ title: 'Error', description: 'Failed to generate invoice', color: 'red', timeout: 3000 })
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Recurring Invoice Detail</h1>
        <p class="text-gray-600">#{{ id }}</p>
      </div>
      <div class="flex gap-2">
        <UButton color="blue" :loading="loading" @click="load">Refresh</UButton>
        <UButton color="green" @click="generateNow">Generate Invoice</UButton>
        <UButton color="gray" variant="outline" @click="router.back()">Back</UButton>
      </div>
    </div>

    <UCard :ui="{ body: { padding: 'p-4' } }">
      <template #header>
        <div class="font-semibold">Information</div>
      </template>
      <div v-if="invoice" class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <div class="text-gray-600 font-medium">Customer</div>
          <div class="font-semibold text-gray-900">{{ invoice.customer?.name }}</div>
        </div>
        <div>
          <div class="text-gray-600 font-medium">Amount</div>
          <div class="font-semibold text-gray-900">Rp {{ (invoice.amount || 0).toLocaleString() }}</div>
        </div>
        <div>
          <div class="text-gray-600 font-medium">Frequency</div>
          <div class="font-semibold text-gray-900">{{ invoice.frequency }}</div>
        </div>
        <div>
          <div class="text-gray-600 font-medium">Status</div>
          <div class="font-semibold text-gray-900 capitalize">{{ invoice.status }}</div>
        </div>
        <div>
          <div class="text-gray-600 font-medium">Invoice Date</div>
          <div class="font-semibold text-gray-900">{{ new Date(invoice.invoice_date).toLocaleDateString() }}</div>
        </div>
        <div>
          <div class="text-gray-600 font-medium">Due Date</div>
          <div class="font-semibold text-gray-900">{{ new Date(invoice.due_date).toLocaleDateString() }}</div>
        </div>
        <div>
          <div class="text-gray-600 font-medium">Next Invoice</div>
          <div class="font-semibold text-blue-700">{{ new Date(invoice.next_invoice_date).toLocaleDateString() }}</div>
        </div>
        <div v-if="invoice.description">
          <div class="text-gray-600 font-medium">Description</div>
          <div class="font-semibold text-gray-900">{{ invoice.description }}</div>
        </div>
      </div>
      <div v-else class="text-gray-500">Loading...</div>
    </UCard>

    <UCard :ui="{ body: { padding: 'p-0' } }">
      <template #header>
        <div class="font-semibold">History</div>
      </template>
      <div class="divide-y">
        <div v-if="history.length === 0" class="p-4 text-gray-500 text-sm">No history yet.</div>
        <div v-for="h in history" :key="h.id" class="p-4 flex items-center justify-between hover:bg-gray-50">
          <div>
            <div class="font-semibold text-gray-900">Invoice: {{ h.generated_invoice_id }}</div>
            <div class="text-sm text-gray-600 font-medium">Generated: {{ new Date(h.generated_at).toLocaleString() }}</div>
            <div class="text-sm text-gray-600 font-medium">Invoice Date: {{ new Date(h.invoice_date).toLocaleDateString() }} • Due: {{ new Date(h.due_date).toLocaleDateString() }}</div>
          </div>
          <div class="flex gap-2">
            <UButton 
              size="sm" 
              color="blue" 
              variant="solid" 
              @click="router.push(`/invoice/${h.generated_invoice_id}`)"
              class="shadow-sm"
            >
              Open
            </UButton>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>


