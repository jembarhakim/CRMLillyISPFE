# Broadcast Feature Usage Guide

## Option 1: Using the BroadcastFeature Component

The component is located at `components/BroadcastFeature.vue` and can be used in any page.

### Example Usage in Your Page

```vue
<script setup lang="ts">
// Your existing code...
const relatedCustomers = ref([
  { name: 'John Doe', phone: '12345' },
  { name: 'Jane Smith', phone: '67890' }
])
// ... rest of your code
</script>

<template>
  <div>
    <!-- Your existing page content -->
    
    <!-- Add the Broadcast Feature -->
    <BroadcastFeature :related-customers="relatedCustomers" />
  </div>
</template>
```

## Option 2: Inline Code (Add Directly to Your Page)

If you prefer to add the code directly to your page component (e.g., `pages/management/area/[id].vue`), you can copy the script and template sections from `components/BroadcastFeature.vue` and adapt them:

### Script Section (add to your `<script setup>`)

```typescript
// Broadcast feature - add these to your existing script setup
import { ref, watch } from 'vue'

// Modal state
const isModalOpen = ref(false)

// Toast notification system
const toast = useToast()

// Broadcast history data
const broadcastHistory = ref<any[]>([])
const historyLoading = ref(false)

// Form state
const state = ref({
  target: 'customers',
  template: '',
  message: ''
})

// Broadcast templates with placeholders
const broadcastTemplates = {
  'template_outage': "⚠️ INFO GANGGUAN LAYANAN ⚠️\n\nHalo {{1}} [Nama Pelanggan],\n\nKami informasikan bahwa saat ini sedang terjadi gangguan layanan {{2}} [Jenis Layanan] di area {{3}} [Lokasi Terdampak].\n\nTim teknis kami sedang bekerja untuk menyelesaikannya. Mohon maaf atas ketidaknyamanan ini.",
  'template_restored': "✅ INFO PEMULIHAN LAYANAN ✅\n\nHalo {{1}} [Nama Pelanggan],\n\nKabar baik! Gangguan layanan {{2}} [Jenis Layanan] di area {{3}} [Lokasi Terdampak] telah BERHASIL DITANGANI.\n\nSilakan restart perangkat Anda jika masih mengalami kendala. Terima kasih atas kesabaran Anda.",
  'template_reminder': "🔔 PENGINGAT TAGIHAN 🔔\n\nHalo {{1}} [Nama Pelanggan],\n\nIni adalah pengingat bahwa tagihan Anda untuk layanan {{2}} [Nama Layanan] (Inv: {{3}}) akan jatuh tempo pada {{4}}.\n\nTotal Tagihan: {{5}}\n\nMohon segera lakukan pembayaran. Terima kasih.",
  'template_overdue': "⚠️ Peringatan Keterlambatan Pembayaran ⚠️\n\nYth. {{1}} [Nama Pelanggan],\n\nTagihan Anda No. Invoice {{2}} telah MELEWATI JATUH TEMPO pada {{3}}.\n\nTotal Tagihan: {{4}}\n\nMohon segera lakukan pembayaran sebelum {{5}} untuk menghindari penangguhan layanan.",
  'template_suspended': "🔒 Pemberitahuan Penangguhan Layanan 🔒\n\nYth. {{1}} [Nama Pelanggan],\n\nLayanan {{2}} Anda telah dinonaktifkan sementara per hari ini, {{3}}, dikarenakan tagihan No. Invoice {{4}} yang masih tertunggak.\n\nMohon segera lakukan pembayaran agar layanan dapat segera digunakan kembali.",
  'template_paid': "✅ Pembayaran Diterima ✅\n\nHalo {{1}} [Nama Pelanggan],\n\nTerima kasih! Kami telah menerima pembayaran Anda untuk No. Invoice {{2}} sebesar {{3}}.\n\nTagihan Anda untuk periode {{4}} telah LUNAS. Terima kasih."
}

// Template options for select
const templateOptions = [
  { label: 'Info Gangguan', value: 'template_outage' },
  { label: 'Layanan Pulih', value: 'template_restored' },
  { label: 'Reminder Pembayaran', value: 'template_reminder' },
  { label: 'Lewat Jatuh Tempo', value: 'template_overdue' },
  { label: 'Layanan Ditangguhkan', value: 'template_suspended' },
  { label: 'Pembayaran Lunas', value: 'template_paid' }
]

// Target options
const targetOptions = [
  { label: 'Related Customers', value: 'customers' },
  { label: 'Internal Team', value: 'team' }
]

// Watch for template changes to auto-populate message
watch(() => state.value.template, (newTemplateKey) => {
  if (newTemplateKey && broadcastTemplates[newTemplateKey as keyof typeof broadcastTemplates]) {
    state.value.message = broadcastTemplates[newTemplateKey as keyof typeof broadcastTemplates]
  } else if (!newTemplateKey) {
    state.value.message = ''
  }
})

// Fetch broadcast history
async function fetchBroadcastHistory() {
  historyLoading.value = true
  try {
    const { data } = await useFetch<any[]>('/api/broadcast/history', {
      method: 'GET'
    })
    broadcastHistory.value = (data.value as any[]) || []
  } catch (error: any) {
    console.error('Error fetching broadcast history:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to load broadcast history',
      color: 'red'
    })
  } finally {
    historyLoading.value = false
  }
}

// Open modal and fetch history
function openModal() {
  isModalOpen.value = true
  fetchBroadcastHistory()
}

// Close modal
function closeModal() {
  isModalOpen.value = false
  // Reset form
  state.value = {
    target: 'customers',
    template: '',
    message: ''
  }
}

// Submit broadcast
async function onSubmit() {
  try {
    const requestBody: any = {
      target: state.value.target,
      message: state.value.message,
      template_key: state.value.template
    }

    // If target is customers, collect phone numbers from relatedCustomers
    if (state.value.target === 'customers') {
      // Access relatedCustomers from your page scope
      // If it's a ref, use: relatedCustomers.value
      // If it's a computed, use: relatedCustomers.value
      const customers = relatedCustomers.value || []
      
      if (!customers || customers.length === 0) {
        toast.add({
          title: 'Warning',
          description: 'No customers found to send broadcast to',
          color: 'yellow'
        })
        return
      }

      const phones = customers.map((c: any) => c.phone).filter((phone: string) => phone)
      
      if (phones.length === 0) {
        toast.add({
          title: 'Warning',
          description: 'No valid phone numbers found',
          color: 'yellow'
        })
        return
      }

      requestBody.phones = phones
    }

    // Send broadcast
    await $fetch('/api/broadcast/send', {
      method: 'POST',
      body: requestBody
    })

    // Success notification
    toast.add({
      title: 'Broadcast sent!',
      color: 'green'
    })
    
    // Close modal and refresh history
    closeModal()
    fetchBroadcastHistory()
  } catch (error: any) {
    console.error('Error sending broadcast:', error)
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to send broadcast',
      color: 'red'
    })
  }
}

// Format date helper
function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'Invalid Date'
  }
}

// Table columns for history
const historyColumns = [
  { key: 'message', label: 'Message' },
  { key: 'target_group', label: 'Target Group' },
  { key: 'status', label: 'Status' },
  { key: 'sent_at', label: 'Sent At' }
]
```

### Template Section (add to your `<template>`)

```vue
<!-- Send Broadcast Button -->
<UButton 
  @click="openModal"
  icon="i-heroicons-paper-airplane"
  color="primary"
>
  Send Broadcast
</UButton>

<!-- Broadcast Modal -->
<UModal v-model="isModalOpen" :ui="{ width: 'w-full sm:max-w-4xl' }">
  <UCard>
    <template #header>
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold">Broadcast Management</h2>
        <UButton 
          @click="closeModal" 
          variant="ghost" 
          size="sm"
          icon="i-heroicons-x-mark"
        />
      </div>
    </template>

    <div class="space-y-6">
      <!-- Broadcast History Section -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Broadcast History</h3>
        <div v-if="historyLoading" class="flex justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
        </div>
        <UTable 
          v-else
          :rows="broadcastHistory" 
          :columns="historyColumns"
          class="w-full"
        >
          <template #message-data="{ row }">
            <div class="max-w-xs truncate" :title="row.message">
              {{ row.message }}
            </div>
          </template>
          <template #status-data="{ row }">
            <UBadge 
              :color="row.status === 'Sent' ? 'green' : 'red'"
              variant="subtle"
            >
              {{ row.status }}
            </UBadge>
          </template>
          <template #sent_at-data="{ row }">
            {{ formatDate(row.sent_at) }}
          </template>
        </UTable>
        <div v-if="!historyLoading && broadcastHistory.length === 0" class="text-center py-8 text-gray-500">
          No broadcast history found
        </div>
      </div>

      <!-- Divider -->
      <UDivider />

      <!-- New Broadcast Form Section -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Send New Broadcast</h3>
        <UForm :state="state" @submit="onSubmit" class="space-y-4">
          <!-- Target Audience -->
          <UFormGroup label="Target Audience" name="target" required>
            <USelectMenu
              v-model="state.target"
              :options="targetOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="Select target audience..."
            />
          </UFormGroup>

          <!-- Message Template -->
          <UFormGroup label="Message Template" name="template">
            <USelectMenu
              v-model="state.template"
              :options="templateOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="Pilih template..."
            />
          </UFormGroup>

          <!-- Message Body -->
          <UFormGroup label="Message Body" name="message" required>
            <UTextarea
              v-model="state.message"
              :rows="10"
              placeholder="Message will be auto-populated when you select a template. You can edit placeholders like {{1}}, {{2}}, etc."
            />
          </UFormGroup>

          <!-- Submit Button -->
          <div class="flex justify-end gap-2">
            <UButton 
              variant="ghost" 
              @click="closeModal"
            >
              Cancel
            </UButton>
            <UButton 
              type="submit"
              icon="i-heroicons-paper-airplane"
              color="primary"
            >
              Send Now
            </UButton>
          </div>
        </UForm>
      </div>
    </div>
  </UCard>
</UModal>
```

## Backend Requirements (Golang)

The POST `/api/broadcast/send` endpoint must handle the following:

1. **If request body has `target == "team"`:**
   - Query the `users` table from database to get list of team phone numbers
   - Send the message to all team members

2. **If request body has `target == "customers"`:**
   - Use the `phones` array directly from the request body
   - Send the message to all phone numbers in the array

3. **Message Handling:**
   - The handler will receive the final, edited message from the frontend
   - Send that exact message (no template processing needed on backend)

### Request Body Structure

**For customers:**
```json
{
  "target": "customers",
  "phones": ["123", "456"],
  "message": "...",
  "template_key": "template_outage"
}
```

**For team:**
```json
{
  "target": "team",
  "message": "...",
  "template_key": "template_outage"
}
```

### GET `/api/broadcast/history` Response

Should return an array of broadcast history objects:
```json
[
  {
    "message": "Broadcast message text",
    "target_group": "Customers",
    "status": "Sent",
    "sent_at": "2024-01-15T10:30:00Z"
  }
]
```

