<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { customerAdminApi } from '@/api/admin/customer'
import { areaAdminApi } from '@/api/admin/area'
import { invoiceAdminApi } from '@/api/admin/invoice'
import { ticketsApi } from '@/api/tickets'
import { WhatsappApi } from '@/api/admin/wa'
import { userManagementAdminApi } from '@/api/admin/user-management'
import { broadcastAdminApi } from '@/api/admin/broadcast'
import LucideIcon from '@/components/LucideIcon.vue'
import { useCustomToast } from '@/composables/useCustomToast'

// Props: relatedCustomers must be passed from parent component
const props = defineProps<{
  relatedCustomers: Array<{ name: string; phone: string; is_internet?: string; is_collaborator?: string }>
}>()

// Modal state
const isModalOpen = ref(false)

// Toast notification system
const toast = useCustomToast()

// Broadcast history data
const broadcastHistory = ref<any[]>([])
const historyLoading = ref(false)

// Form state
const state = ref({
  target: 'customers',
  template: '',
  message: '',
  selectedCustomers: [] as string[], // Array of phone numbers
  placeholderValues: {} as Record<string, any>, // Store placeholder values: {{1}}, {{2}}, etc.
  customerTypeFilter: 'both', // 'both', 'internet', 'collaborator'
  selectedArea: '' // Area ID for filtering customers
})

// Data for dropdowns
const allCustomers = ref<any[]>([])
const allAreas = ref<any[]>([])
const allTroubleTypes = ref<any[]>([])
const allInvoices = ref<any[]>([])
const loadingData = ref(false)

// Broadcast templates with placeholders
const broadcastTemplates = {
  // Customer templates
  'template_outage': "⚠️ INFO GANGGUAN LAYANAN ⚠️\n\nHalo {{1}} [Nama Pelanggan],\n\nKami informasikan bahwa saat ini sedang terjadi gangguan layanan {{2}} [Gangguan Layanan] di area {{3}} [Lokasi Terdampak].\n\nTim teknis kami sedang bekerja untuk menyelesaikannya. Mohon maaf atas ketidaknyamanan ini.",
  'template_restored': "✅ INFO PEMULIHAN LAYANAN ✅\n\nHalo {{1}} [Nama Pelanggan],\n\nKabar baik! Gangguan layanan {{2}} [Jenis Layanan] di area {{3}} [Lokasi Terdampak] telah BERHASIL DITANGANI.\n\nSilakan restart perangkat Anda jika masih mengalami kendala. Terima kasih atas kesabaran Anda.",
  'template_reminder': "🔔 PENGINGAT TAGIHAN 🔔\n\nHalo {{1}} [Nama Pelanggan],\n\nIni adalah pengingat bahwa tagihan Anda untuk layanan Internet (Inv: {{3}}) akan jatuh tempo pada {{4}}.\n\nTotal Tagihan: {{5}}\n\nMohon segera lakukan pembayaran. Terima kasih.",
  'template_overdue': "⚠️ Peringatan Keterlambatan Pembayaran ⚠️\n\nYth. {{1}} [Nama Pelanggan],\n\nTagihan Anda No. Invoice {{2}} telah MELEWATI JATUH TEMPO pada {{3}}.\n\nTotal Tagihan: {{4}}\n\nMohon segera lakukan pembayaran sebelum {{5}} untuk menghindari penangguhan layanan.",
  'template_suspended': "🔒 Pemberitahuan Penangguhan Layanan 🔒\n\nYth. {{1}} [Nama Pelanggan],\n\nLayanan Internet Anda telah dinonaktifkan sementara per hari ini, {{2}}, dikarenakan tagihan No. Invoice {{3}} yang masih tertunggak.\n\nMohon segera lakukan pembayaran agar layanan dapat segera digunakan kembali.",
  'template_paid': "✅ Pembayaran Diterima ✅\n\nHalo {{1}} [Nama Pelanggan],\n\nTerima kasih! Kami telah menerima pembayaran Anda untuk No. Invoice {{2}} sebesar {{3}}.\n\nTagihan Anda untuk periode {{4}} telah LUNAS. Terima kasih.",
  // Team templates
  'template_meeting': "📅 UNDANGAN RAPAT 📅\n\nHalo Tim,\n\nKami mengundang Anda untuk menghadiri rapat dengan topik:\n\nTopik: {{1}} [Topik Rapat]\nTanggal: {{2}} [Tanggal Rapat]\nWaktu: {{3}} [Waktu Rapat]\nLokasi: {{4}} [Lokasi Rapat]\n\nAgenda: {{5}} [Agenda Rapat]\n\nMohon konfirmasi kehadiran Anda. Terima kasih.",
  'template_announcement': "📢 PENGUMUMAN INTERNAL 📢\n\nHalo Tim,\n\n{{1}} [Isi Pengumuman]\n\n{{2}} [Detail Tambahan]\n\nTerima kasih atas perhatiannya.",
}

// Template options for customers
const customerTemplateOptions = [
  { label: 'Custom Message (Tulis Manual)', value: 'custom' },
  { label: 'Info Gangguan', value: 'template_outage' },
  { label: 'Layanan Pulih', value: 'template_restored' },
  { label: 'Reminder Pembayaran', value: 'template_reminder' },
  { label: 'Lewat Jatuh Tempo', value: 'template_overdue' },
  { label: 'Layanan Ditangguhkan', value: 'template_suspended' },
  { label: 'Pembayaran Lunas', value: 'template_paid' }
]

// Template options for team
const teamTemplateOptions = [
  { label: 'Custom Message (Tulis Manual)', value: 'custom' },
  { label: 'Undangan Rapat', value: 'template_meeting' },
  { label: 'Pengumuman Internal', value: 'template_announcement' },
]

// Computed template options based on target
const templateOptions = computed(() => {
  if (state.value.target === 'team') {
    return teamTemplateOptions
  }
  return customerTemplateOptions
})

// Target options
const targetOptions = [
  { label: 'Related Customers', value: 'customers' },
  { label: 'Internal Team', value: 'team' }
]

// Customer type filter options
const customerTypeFilterOptions = [
  { label: 'Both (Internet + Collaborator)', value: 'both' },
  { label: 'Internet Only', value: 'internet' },
  { label: 'Collaborator Only', value: 'collaborator' }
]

// Area options for filtering
const areaOptions = computed(() => {
  return [
    { label: 'All Areas', value: '' },
    ...allAreas.value.map((area: any) => ({
      label: area.fullName || `${area.name_city} - ${area.name_subdistrict} - ${area.name_village}`,
      value: area.id
    }))
  ]
})
// Select all customers function
function selectAllCustomers() {
  const allPhoneNumbers = customerOptions.value.map(opt => opt.value)
  state.value.selectedCustomers = [...new Set([...state.value.selectedCustomers, ...allPhoneNumbers])]
}
// Customer options for multi-select (format: { label: "Name - Phone", value: "phone" })
// Filter based on selected customer type filter and area
const customerOptions = computed(() => {
  // Use allCustomers as source of truth since it's fetched from API
  // Fall back to props.relatedCustomers if allCustomers is empty
  const customersToFilter = allCustomers.value.length > 0 ? allCustomers.value : props.relatedCustomers
  
  return customersToFilter
    .filter((customer) => {
      // Filter by customer type (internet/collaborator)
      let passesTypeFilter = false
      if (state.value.customerTypeFilter === 'internet') {
        passesTypeFilter = customer.is_internet === 'yes'
      } else if (state.value.customerTypeFilter === 'collaborator') {
        passesTypeFilter = customer.is_collaborator === 'yes'
      } else {
        // 'both' - show internet or collaborator customers
        passesTypeFilter = customer.is_internet === 'yes' || customer.is_collaborator === 'yes'
      }
      
      if (!passesTypeFilter) return false
      
      // Filter by area if selected
      if (state.value.selectedArea) {
        // Check if customer's area matches selected area
        const customerAreaId = customer.area_id || 
                               (customer.area as any)?.id || 
                               (customer as any).areaId
        
        if (customerAreaId !== state.value.selectedArea) return false
      }
      
      return true
    })
    .map((customer) => {
      // Get area info for display
      const areaInfo = customer.area 
        ? `${customer.area.name_city} - ${customer.area.name_subdistrict}`
        : ''
      
      return {
        label: areaInfo 
          ? `${customer.name} - ${customer.phone} (${areaInfo})`
          : `${customer.name} - ${customer.phone}`,
        value: customer.phone
      }
    })
})



// Clear all customers function
function clearAllCustomers() {
  state.value.selectedCustomers = []
}

// Placeholder field definitions for each template
const placeholderFields: Record<string, Record<number, { label: string; type: string; source: string }>> = {
  // Customer templates
  'template_outage': {
    1: { label: 'Nama Pelanggan', type: 'customer', source: 'customers' },
    2: { label: 'Gangguan Layanan', type: 'trouble_type', source: 'trouble_types' },
    3: { label: 'Lokasi Terdampak', type: 'area', source: 'areas' }
  },
  'template_restored': {
    1: { label: 'Nama Pelanggan', type: 'customer', source: 'customers' },
    2: { label: 'Jenis Layanan', type: 'trouble_type', source: 'trouble_types' },
    3: { label: 'Lokasi Terdampak', type: 'area', source: 'areas' }
  },
  'template_reminder': {
    1: { label: 'Nama Pelanggan', type: 'customer', source: 'customers' },
    3: { label: 'Nomor Invoice', type: 'invoice', source: 'invoices' },
    4: { label: 'Tanggal Jatuh Tempo', type: 'invoice_date', source: 'invoices' },
    5: { label: 'Total Tagihan', type: 'invoice_amount', source: 'invoices' }
  },
  'template_overdue': {
    1: { label: 'Nama Pelanggan', type: 'customer', source: 'customers' },
    2: { label: 'Nomor Invoice', type: 'invoice', source: 'invoices' },
    3: { label: 'Tanggal Jatuh Tempo', type: 'invoice_date', source: 'invoices' },
    4: { label: 'Total Tagihan', type: 'invoice_amount', source: 'invoices' },
    5: { label: 'Batas Pembayaran', type: 'date', source: 'manual' }
  },
  'template_suspended': {
    1: { label: 'Nama Pelanggan', type: 'customer', source: 'customers' },
    2: { label: 'Tanggal', type: 'invoice_date', source: 'invoices' },
    3: { label: 'Nomor Invoice', type: 'invoice', source: 'invoices' }
  },
  'template_paid': {
    1: { label: 'Nama Pelanggan', type: 'customer', source: 'customers' },
    2: { label: 'Nomor Invoice', type: 'invoice', source: 'invoices' },
    3: { label: 'Jumlah Pembayaran', type: 'invoice_amount', source: 'invoices' },
    4: { label: 'Periode', type: 'text', source: 'manual' }
  },
  // Team templates (all manual input)
  'template_meeting': {
    1: { label: 'Topik Rapat', type: 'text', source: 'manual' },
    2: { label: 'Tanggal Rapat', type: 'date', source: 'manual' },
    3: { label: 'Waktu Rapat', type: 'text', source: 'manual' },
    4: { label: 'Lokasi Rapat', type: 'text', source: 'manual' },
    5: { label: 'Agenda Rapat', type: 'textarea', source: 'manual' }
  },
  'template_announcement': {
    1: { label: 'Isi Pengumuman', type: 'textarea', source: 'manual' },
    2: { label: 'Detail Tambahan', type: 'textarea', source: 'manual' }
  },
  'template_task': {
    1: { label: 'Deskripsi Tugas', type: 'textarea', source: 'manual' },
    2: { label: 'Batas Waktu', type: 'date', source: 'manual' },
    3: { label: 'Prioritas', type: 'text', source: 'manual' },
    4: { label: 'Catatan Tambahan', type: 'textarea', source: 'manual' }
  }
}

// Extract placeholders from template text
function extractPlaceholders(template: string): number[] {
  const matches = template.match(/\{\{(\d+)\}\}/g)
  if (!matches) return []
  return matches.map(m => parseInt(m.replace(/\{\{|\}\}/g, ''))).sort((a, b) => a - b)
}

// Get placeholder fields for current template
const currentPlaceholderFields = computed(() => {
  if (!state.value.template) return []
  const fields = placeholderFields[state.value.template] || {}
  const placeholders = extractPlaceholders(state.value.message)
  const hasSelectedCustomers = state.value.target === 'customers' && 
                               state.value.selectedCustomers && 
                               state.value.selectedCustomers.length > 0
  
  return placeholders
    .map(num => ({
      number: num,
      ...fields[num] || { label: `Value ${num}`, type: 'text', source: 'manual' }
    }))
    // Filter out customer fields if customers are already selected (will be auto-filled)
    .filter(field => {
      if (field.type === 'customer' && hasSelectedCustomers) {
        return false // Hide customer field when customers are already selected
      }
      return true
    })
})

// Fetch all data for dropdowns
async function fetchAllData() {
  loadingData.value = true
  try {
    // Fetch customers
    const customersResponse = await customerAdminApi().getAllCustomers()
    allCustomers.value = customersResponse.data || []

    // Fetch areas
    const areasResponse = await areaAdminApi().getAllAreas()
    allAreas.value = (areasResponse.data || []).map((area: any) => ({
      ...area,
      fullName: `${area.name_city} - ${area.name_subdistrict} - ${area.name_village}`
    }))

    // Fetch trouble types
    const troubleTypesResponse: any = await ticketsApi().troubleTypes()
    allTroubleTypes.value = troubleTypesResponse?.data || troubleTypesResponse || []

    // Fetch invoices
    const invoicesResponse = await invoiceAdminApi().getAllInvoices()
    allInvoices.value = invoicesResponse.data || []
  } catch (error: any) {
    console.error('Error fetching data:', error)
    toast.add({
      title: 'Warning',
      description: 'Failed to load some data. Some fields may not be available.',
      color: 'yellow'
    })
  } finally {
    loadingData.value = false
  }
}

// Get options for a placeholder field
function getFieldOptions(field: any) {
  if (field.type === 'customer') {
    // If customers are already selected, only show those customers
    if (state.value.selectedCustomers && state.value.selectedCustomers.length > 0) {
      return allCustomers.value
        .filter((c: any) => state.value.selectedCustomers.includes(c.phone))
        .map((c: any) => ({
          label: c.name,
          value: c.name,
          phone: c.phone
        }))
    }
    // Otherwise show all customers
    return allCustomers.value.map((c: any) => ({
      label: c.name,
      value: c.name,
      phone: c.phone
    }))
  } else if (field.type === 'area') {
    return allAreas.value.map((a: any) => ({
      label: a.fullName,
      value: a.fullName
    }))
  } else if (field.type === 'trouble_type') {
    return allTroubleTypes.value.map((t: any) => ({
      label: t.name,
      value: t.name
    }))
  } else if (field.type === 'invoice') {
    // Filter invoices based on selected customers
    let invoicesToShow = allInvoices.value
    
    if (state.value.target === 'customers' && state.value.selectedCustomers && state.value.selectedCustomers.length > 0) {
      // Get the selected customer objects
      const selectedCustomerObjects = allCustomers.value.filter((c: any) => 
        state.value.selectedCustomers.includes(c.phone)
      )
      
      // Filter invoices that belong to selected customers
      invoicesToShow = allInvoices.value.filter((inv: any) => {
        // Check if invoice customer_id matches any selected customer's id
        return selectedCustomerObjects.some((customer: any) => 
          customer.id === inv.customer_id || customer.phone === inv.phone
        )
      })
    }
    
    return invoicesToShow.map((inv: any) => ({
      label: `Invoice ${inv.number || inv.id}`,
      value: inv.number || inv.id,
      invoice: inv
    }))
  } else if (field.type === 'invoice_date') {
    // Auto-filled from invoice, return empty array (handled by watch)
    return []
  } else if (field.type === 'invoice_amount') {
    // Auto-filled from invoice, return empty array (handled by watch)
    return []
  }
  return []
}

// Watch for target changes to reset template and message
watch(() => state.value.target, (newTarget) => {
  // Reset template and message when switching between customers and team
  state.value.template = ''
  state.value.message = ''
  state.value.placeholderValues = {}
})

// Watch for template changes to auto-populate message and reset placeholder values
watch(() => state.value.template, (newTemplateKey, oldTemplateKey) => {
  if (newTemplateKey === 'custom') {
    // Custom message - allow direct editing
    // Only clear message if switching from a template (preserve user input)
    if (oldTemplateKey && oldTemplateKey !== 'custom' && !state.value.message) {
      state.value.message = '' // Start with empty message for custom
    }
    // Clear placeholder values when switching to custom
    if (oldTemplateKey && oldTemplateKey !== 'custom') {
      state.value.placeholderValues = {}
    }
  } else if (newTemplateKey && broadcastTemplates[newTemplateKey as keyof typeof broadcastTemplates]) {
    // Set message to template
    const newTemplate = broadcastTemplates[newTemplateKey as keyof typeof broadcastTemplates]
    state.value.message = newTemplate
    // Only reset placeholder values if switching from a different template
    // (This allows users to switch between similar templates without losing data)
    if (oldTemplateKey && oldTemplateKey !== newTemplateKey) {
      state.value.placeholderValues = {}
    }
  } else if (!newTemplateKey) {
    // No template selected - clear everything
    state.value.message = ''
    state.value.placeholderValues = {}
  }
})

// Watch for invoice selection to auto-fill related fields
watch(() => state.value.placeholderValues, (newValues) => {
  // Auto-fill invoice date and amount when invoice is selected
  const currentTemplate = state.value.template
  if (currentTemplate === 'template_reminder' && newValues['{{3}}']) {
    const inv = allInvoices.value.find((i: any) => (i.number || i.id) === newValues['{{3}}'])
    if (inv) {
      if (inv.due_date) {
        const date = new Date(inv.due_date)
        state.value.placeholderValues['{{4}}'] = date.toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
      if (inv.amount) {
        state.value.placeholderValues['{{5}}'] = `Rp ${inv.amount.toLocaleString('id-ID')}`
      }
    }
  } else if (currentTemplate === 'template_overdue' && newValues['{{2}}']) {
    const inv = allInvoices.value.find((i: any) => (i.number || i.id) === newValues['{{2}}'])
    if (inv) {
      if (inv.due_date) {
        const date = new Date(inv.due_date)
        state.value.placeholderValues['{{3}}'] = date.toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
      if (inv.amount) {
        state.value.placeholderValues['{{4}}'] = `Rp ${inv.amount.toLocaleString('id-ID')}`
      }
    }
  } else if (currentTemplate === 'template_paid' && newValues['{{2}}']) {
    const inv = allInvoices.value.find((i: any) => (i.number || i.id) === newValues['{{2}}'])
    if (inv) {
      if (inv.amount) {
        state.value.placeholderValues['{{3}}'] = `Rp ${inv.amount.toLocaleString('id-ID')}`
      }
    }
  }
}, { deep: true })

// Replace placeholders in message with actual values
function replacePlaceholders(message: string): string {
  let result = message
  Object.keys(state.value.placeholderValues).forEach(placeholder => {
    const value = state.value.placeholderValues[placeholder]
    if (value !== undefined && value !== null && value !== '') {
      // Replace placeholder with value, and also remove the [description] text that follows
      // Pattern: {{1}} [Description] -> value
      const placeholderPattern = placeholder.replace(/[{}]/g, '\\$&')
      const pattern = new RegExp(placeholderPattern + '\\s*\\[.*?\\]', 'g')
      result = result.replace(pattern, String(value))
      // Also handle cases where placeholder might not have description
      result = result.replace(new RegExp(placeholderPattern, 'g'), String(value))
    }
  })
  // Clean up any remaining [description] patterns that weren't part of placeholders
  result = result.replace(/\s*\[.*?\]/g, '')
  return result
}

// Computed preview message that updates in real-time
const previewMessage = computed(() => {
  if (!state.value.message) return ''
  
  // If customers are selected and template has customer placeholder, show preview for first customer
  const hasSelectedCustomers = state.value.target === 'customers' && 
                               state.value.selectedCustomers && 
                               state.value.selectedCustomers.length > 0
  
  if (hasSelectedCustomers) {
    const templateFields = placeholderFields[state.value.template] || {}
    const customerPlaceholderNumber = Object.keys(templateFields).find(key => {
      const field = templateFields[parseInt(key)]
      return field && field.type === 'customer'
    })
    
    if (customerPlaceholderNumber) {
      // Get first selected customer for preview
      const firstCustomer = allCustomers.value.find((c: any) => 
        state.value.selectedCustomers.includes(c.phone)
      )
      
      if (firstCustomer) {
        // Create preview with first customer's name
        const previewValues = { ...state.value.placeholderValues }
        previewValues[`{{${customerPlaceholderNumber}}}`] = firstCustomer.name
        let preview = state.value.message
        Object.keys(previewValues).forEach(placeholder => {
          const value = previewValues[placeholder]
          if (value !== undefined && value !== null && value !== '') {
            // Replace placeholder with value and remove [description] text
            const placeholderPattern = placeholder.replace(/[{}]/g, '\\$&')
            const pattern = new RegExp(placeholderPattern + '\\s*\\[.*?\\]', 'g')
            preview = preview.replace(pattern, String(value))
            // Also handle cases where placeholder might not have description
            preview = preview.replace(new RegExp(placeholderPattern, 'g'), String(value))
          }
        })
        // Clean up any remaining [description] patterns
        preview = preview.replace(/\s*\[.*?\]/g, '')
        return preview
      }
    }
  }
  
  // Regular preview with filled values
  return replacePlaceholders(state.value.message)
})

// Watch for target changes to clear selected customers when switching to team
watch(() => state.value.target, (newTarget) => {
  if (newTarget === 'team') {
    state.value.selectedCustomers = []
  }
})

// Watch for customer type filter changes to clear selected customers
watch(() => state.value.customerTypeFilter, () => {
  // Clear selected customers when filter changes to avoid invalid selections
  state.value.selectedCustomers = []
})

// Watch for area filter changes to clear selected customers
watch(() => state.value.selectedArea, () => {
  // Clear selected customers when area filter changes to avoid invalid selections
  state.value.selectedCustomers = []
})

// Fetch broadcast history
async function fetchBroadcastHistory() {
  historyLoading.value = true
  try {
    const response = await broadcastAdminApi().getBroadcastHistory()
    const rawHistory = response || []
    
    // Group by sent_at datetime (same second) to combine entries
    const groupedHistory = new Map<string, any[]>()
    
    rawHistory.forEach((item: any) => {
      // Use sent_at as key, rounded to the second
      const sentAtKey = new Date(item.sent_at).toISOString().slice(0, 19) // YYYY-MM-DDTHH:mm:ss
      
      if (!groupedHistory.has(sentAtKey)) {
        groupedHistory.set(sentAtKey, [])
      }
      groupedHistory.get(sentAtKey)!.push(item)
    })
    
    // Convert grouped map to array of combined entries
    broadcastHistory.value = Array.from(groupedHistory.entries()).map(([sentAt, items]) => {
      // Extract all unique phone numbers from all items
      const allPhones = Array.from(new Set(items.reduce((phones: string[], item: any) => {
        // Try multiple field names (snake_case and camelCase)
        const recipientPhones = item.recipient_phones || item.recipientPhones || item.RecipientPhones
        
        // If item has recipient_phones, extract them
        if (recipientPhones && Array.isArray(recipientPhones) && recipientPhones.length > 0) {
          return [...phones, ...recipientPhones]
        }
        return phones
      }, [] as string[]))) // Remove duplicates using Set
      
      // Debug: Log what we found
      if (process.env.NODE_ENV === 'development') {
        console.log('[BROADCAST HISTORY] Items structure check:', items.map((item: any) => ({
          id: item.id,
          has_recipient_phones: !!item.recipient_phones,
          has_recipientPhones: !!item.recipientPhones,
          recipient_phones: item.recipient_phones,
          recipientPhones: item.recipientPhones,
          keys: Object.keys(item)
        })))
      }
      
      // Debug logging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('[BROADCAST HISTORY] Processing items:', items)
        console.log('[BROADCAST HISTORY] Extracted phones:', allPhones)
        console.log('[BROADCAST HISTORY] First item structure:', items[0])
      }
      
      // Combine all items with same sent_at
      const combined = {
        id: items[0].id, // Use first item's ID
        message: items[0].message, // Use first item's message (or could combine)
        target_group: items[0].target_group || items[0].targetGroup, // Handle both cases
        status: items.every((i: any) => i.status === 'Sent' || i.status === 'sent') ? 'Sent' : 'Failed', // All must be sent
        sent_at: items[0].sent_at || items[0].sentAt, // Handle both cases
        created_by: items[0].created_by || items[0].createdBy,
        user_name: items[0].user_name || items[0].userName,
        recipient_count: items.reduce((sum: number, item: any) => sum + (item.recipient_count || item.recipientCount || 1), 0),
        // Store all original items for customer selection
        original_items: items,
        // Extract all unique phone numbers from all items
        all_phones: allPhones
      }
      
      // Debug log the combined result
      if (process.env.NODE_ENV === 'development') {
        console.log('[BROADCAST HISTORY] Combined result:', combined)
      }
      
      return combined
    }).sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()) // Sort by newest first
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
async function openModal() {
  isModalOpen.value = true
  await fetchAllData() // Fetch all data when modal opens
  fetchBroadcastHistory()
}

// Close modal
function closeModal() {
  isModalOpen.value = false
  // Reset form
  state.value = {
    target: 'customers',
    template: '',
    message: '',
    selectedCustomers: [],
    placeholderValues: {},
    customerTypeFilter: 'both',
    selectedArea: ''
  }
}

// Submit broadcast
async function onSubmit() {
  try {
    // Validate all placeholders are filled (skip for custom messages)
    // Skip customer placeholder validation if customers are already selected (will personalize per customer)
    if (state.value.template && state.value.template !== 'custom' && currentPlaceholderFields.value.length > 0) {
      const missingFields: string[] = []
      const customerPlaceholder = currentPlaceholderFields.value.find(f => f.type === 'customer')
      const hasSelectedCustomers = state.value.target === 'customers' && 
                                   state.value.selectedCustomers && 
                                   state.value.selectedCustomers.length > 0
      
      currentPlaceholderFields.value.forEach(field => {
        // Skip customer field validation if customers are already selected (will be personalized)
        if (field.type === 'customer' && hasSelectedCustomers) {
          return
        }
        
        const placeholder = `{{${field.number}}}`
        if (!state.value.placeholderValues[placeholder] || state.value.placeholderValues[placeholder] === '') {
          missingFields.push(field.label)
        }
      })
      
      if (missingFields.length > 0) {
        toast.add({
          title: 'Warning',
          description: `Please fill all template fields: ${missingFields.join(', ')}`,
          color: 'yellow'
        })
        return
      }
    }

    // Validate target is set
    if (!state.value.target || (state.value.target !== 'customers' && state.value.target !== 'team')) {
      toast.add({
        title: 'Warning',
        description: 'Please select a target (customers or team)',
        color: 'yellow'
      })
      return
    }

    // Validate message is not empty
    if (!state.value.message || state.value.message.trim() === '') {
      toast.add({
        title: 'Warning',
        description: 'Please enter a message or select a template',
        color: 'yellow'
      })
      return
    }

    // Validate target and customers
    if (state.value.target === 'customers') {
      if (!state.value.selectedCustomers || state.value.selectedCustomers.length === 0) {
        toast.add({
          title: 'Warning',
          description: 'Please select at least one customer',
          color: 'yellow'
        })
        return
      }

      // Validate phone numbers
      const validPhones = state.value.selectedCustomers.filter((phone: string) => phone && phone.trim() !== '')
      
      if (validPhones.length === 0) {
        toast.add({
          title: 'Warning',
          description: 'No valid phone numbers selected',
          color: 'yellow'
        })
        return
      }
    }

    // If target is customers and we have selected customers, send personalized messages
    if (state.value.target === 'customers' && state.value.selectedCustomers.length > 0) {
      // Get selected customer objects
      const selectedCustomerObjects = allCustomers.value.filter((c: any) => 
        state.value.selectedCustomers.includes(c.phone)
      )
      
      // Check if template has customer placeholder (even if filtered out from display)
      // Skip for custom messages
      const templateFields = state.value.template && state.value.template !== 'custom' 
        ? (placeholderFields[state.value.template] || {})
        : {}
      const customerPlaceholderNumber = Object.keys(templateFields).find(key => {
        const field = templateFields[parseInt(key)]
        return field && field.type === 'customer'
      })
      
      // For custom messages or templates without customer placeholder, send same message to all
      if (!customerPlaceholderNumber || state.value.template === 'custom') {
        // Send same message to all customers (non-personalized)
        const finalMessage = state.value.template === 'custom' 
          ? state.value.message 
          : replacePlaceholders(state.value.message)
        
        try {
          const broadcastData = {
            target: 'customers',
            phones: state.value.selectedCustomers,
            message: finalMessage,
            template_key: state.value.template !== 'custom' ? state.value.template : undefined
          }
          console.log('[BROADCAST] Sending non-personalized message:', broadcastData)
          const response = await broadcastAdminApi().sendBroadcast(broadcastData)
          
          // Check response for failures
          if (response.failed_count && response.failed_count > 0) {
            if (response.success_count === 0) {
              toast.add({
                title: 'Broadcast Failed',
                description: 'All messages failed to send. Please check your configuration.',
                color: 'red'
              })
              return
            } else {
              const failedPhones = response.failed_phones?.slice(0, 5).join(', ') || ''
              const moreFailed = response.failed_phones && response.failed_phones.length > 5 
                ? ` and ${response.failed_phones.length - 5} more` 
                : ''
              
              toast.add({
                title: 'Broadcast Partially Failed',
                description: `${response.success_count} sent, ${response.failed_count} failed. ${failedPhones}${moreFailed}`,
                color: 'yellow'
              })
            }
          }
        } catch (error: any) {
          console.error('[BROADCAST] Failed to send broadcast:', error)
          toast.add({
            title: 'Broadcast Failed',
            description: error.message || 'Failed to send broadcast',
            color: 'red'
          })
          return
        }
      } else if (customerPlaceholderNumber) {
        // Send personalized broadcast to all customers in ONE API call
        // This creates ONE record with all recipients
        const personalizedMessages = selectedCustomerObjects.map((customer: any) => {
          // Create a personalized message for this customer
          const personalizedValues = { ...state.value.placeholderValues }
          personalizedValues[`{{${customerPlaceholderNumber}}}`] = customer.name
          
          // Replace placeholders with personalized values
          let personalizedMessage = state.value.message
          Object.keys(personalizedValues).forEach(placeholder => {
            const value = personalizedValues[placeholder]
            if (value !== undefined && value !== null && value !== '') {
              // Replace placeholder with value and remove [description] text
              const placeholderPattern = placeholder.replace(/[{}]/g, '\\$&')
              const pattern = new RegExp(placeholderPattern + '\\s*\\[.*?\\]', 'g')
              personalizedMessage = personalizedMessage.replace(pattern, String(value))
              // Also handle cases where placeholder might not have description
              personalizedMessage = personalizedMessage.replace(
                new RegExp(placeholderPattern, 'g'), 
                String(value)
              )
            }
          })
          // Clean up any remaining [description] patterns
          personalizedMessage = personalizedMessage.replace(/\s*\[.*?\]/g, '')
          
          return {
            phone: customer.phone,
            message: personalizedMessage
          }
        })
        
        // Validate all messages are complete
        const incompleteMessages = personalizedMessages.filter(pm => pm.message.match(/\{\{\d+\}\}/))
        if (incompleteMessages.length > 0) {
          toast.add({
            title: 'Warning',
            description: 'Some placeholders are not filled. Please check all fields.',
            color: 'yellow'
          })
          return
        }
        
        // Send all personalized messages in ONE API call
        try {
          const broadcastData = {
            target: 'customers',
            personalized_messages: personalizedMessages,
            template_key: state.value.template || undefined
          } as any
          console.log('[BROADCAST] Sending personalized messages:', {
            target: broadcastData.target,
            personalized_messages_count: broadcastData.personalized_messages?.length,
            template_key: broadcastData.template_key
          })
          const response = await broadcastAdminApi().sendBroadcast(broadcastData)
          
          // Check response for failures
          if (response.failed_count && response.failed_count > 0) {
            if (response.success_count === 0) {
              toast.add({
                title: 'Broadcast Failed',
                description: 'All messages failed to send. Please check your configuration.',
                color: 'red'
              })
              return
            } else {
              const failedPhones = response.failed_phones?.slice(0, 5).join(', ') || ''
              const moreFailed = response.failed_phones && response.failed_phones.length > 5 
                ? ` and ${response.failed_phones.length - 5} more` 
                : ''
              
              toast.add({
                title: 'Broadcast Partially Failed',
                description: `${response.success_count} sent, ${response.failed_count} failed. ${failedPhones}${moreFailed}`,
                color: 'yellow'
              })
            }
          }
        } catch (error: any) {
          console.error('[BROADCAST] Failed to send broadcast:', error)
          toast.add({
            title: 'Broadcast Failed',
            description: error.message || 'Failed to send broadcast',
            color: 'red'
          })
          return
        }
      } else {
        // No customer placeholder, send same message to all customers
        const finalMessage = replacePlaceholders(state.value.message)
        
        // Check if there are still unreplaced placeholders
        if (finalMessage.match(/\{\{\d+\}\}/)) {
          toast.add({
            title: 'Warning',
            description: 'Some placeholders are not filled. Please check all fields.',
            color: 'yellow'
          })
          return
        }
        
        // Send to all selected customers using backend API (saves to database)
        try {
          const response = await broadcastAdminApi().sendBroadcast({
            target: 'customers',
            phones: state.value.selectedCustomers,
            message: finalMessage,
            template_key: state.value.template || undefined
          })
          
          // Check response for failures
          if (response.failed_count && response.failed_count > 0) {
            if (response.success_count === 0) {
              // All failed
              toast.add({
                title: 'Broadcast Failed',
                description: 'All messages failed to send. Please check your configuration.',
                color: 'red'
              })
              return
            } else {
              // Partial failure
              const failedPhones = response.failed_phones?.slice(0, 5).join(', ') || ''
              const moreFailed = response.failed_phones && response.failed_phones.length > 5 
                ? ` and ${response.failed_phones.length - 5} more` 
                : ''
              
              toast.add({
                title: 'Broadcast Partially Failed',
                description: `${response.success_count} sent, ${response.failed_count} failed. ${failedPhones}${moreFailed}`,
                color: 'yellow'
              })
            }
          }
        } catch (error: any) {
          console.error('[BROADCAST] Failed to send broadcast:', error)
          toast.add({
            title: 'Broadcast Failed',
            description: error.message || 'Failed to send broadcast',
            color: 'red'
          })
          return
        }
      }
    } else {
      // For team broadcasts, backend API will fetch team members automatically
      if (state.value.target === 'team') {
        const finalMessage = state.value.template === 'custom'
          ? state.value.message
          : replacePlaceholders(state.value.message)
        
        // Check if there are still unreplaced placeholders (only for templates, not custom)
        if (state.value.template !== 'custom' && finalMessage.match(/\{\{\d+\}\}/)) {
          toast.add({
            title: 'Warning',
            description: 'Some placeholders are not filled. Please check all fields.',
            color: 'yellow'
          })
          return
        }
        
        // Send to team using backend API (saves to database)
        // Backend will automatically fetch all team members with phone numbers
        try {
          const response = await broadcastAdminApi().sendBroadcast({
            target: 'team',
            message: finalMessage,
            template_key: state.value.template !== 'custom' ? state.value.template : undefined
          })
          
          // Check response for failures
          if (response.failed_count && response.failed_count > 0) {
            if (response.success_count === 0) {
              // All failed
              toast.add({
                title: 'Broadcast Failed',
                description: 'All messages failed to send. Please check your configuration.',
                color: 'red'
              })
              return
            } else {
              // Partial failure
              toast.add({
                title: 'Broadcast Partially Failed',
                description: `${response.success_count} sent, ${response.failed_count} failed.`,
                color: 'yellow'
              })
            }
          }
        } catch (error: any) {
          console.error('[BROADCAST] Failed to send broadcast:', error)
          toast.add({
            title: 'Broadcast Failed',
            description: error.message || 'Failed to send broadcast',
            color: 'red'
          })
          return
        }
      } else {
        // Fallback for other cases
        const finalMessage = replacePlaceholders(state.value.message)
        
        if (finalMessage.match(/\{\{\d+\}\}/)) {
          toast.add({
            title: 'Warning',
            description: 'Some placeholders are not filled. Please check all fields.',
            color: 'yellow'
          })
          return
        }
      }
    }

    // Success notification - only show if we got here without errors
    // (Errors would have returned early or shown error notifications)
    toast.add({
      title: 'Broadcast sent!',
      description: 'All messages sent successfully',
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
  { key: 'recipient_count', label: 'Recipients' },
  { key: 'status', label: 'Status' },
  { key: 'sent_at', label: 'Sent At' },
  { key: 'actions', label: 'Actions' }
]

// Loading state for resend
const resendingToCustomers = ref<string | null>(null)

// Function to resend to customers from history
async function resendToCustomers(historyItem: any) {
  resendingToCustomers.value = historyItem.id
  
  try {
    console.log('[RESEND] History item:', historyItem)
    console.log('[RESEND] All phones:', historyItem.all_phones)
    console.log('[RESEND] Original items:', historyItem.original_items)
    
    // Try to get phones from all_phones first, then fallback to original_items
    let phonesToUse: string[] = []
    
    if (historyItem.all_phones && historyItem.all_phones.length > 0) {
      phonesToUse = historyItem.all_phones
      console.log('[RESEND] Using phones from all_phones:', phonesToUse)
    } else if (historyItem.original_items && historyItem.original_items.length > 0) {
      // Fallback: extract phones from original_items (try multiple field names)
      phonesToUse = Array.from(new Set(historyItem.original_items.reduce((phones: string[], item: any) => {
        const recipientPhones = item.recipient_phones || item.recipientPhones || item.RecipientPhones
        if (recipientPhones && Array.isArray(recipientPhones) && recipientPhones.length > 0) {
          return [...phones, ...recipientPhones]
        }
        return phones
      }, [] as string[])))
      
      console.log('[RESEND] Extracted phones from original_items:', phonesToUse)
    }
    
    // If still no phones, try to fetch from backend using the broadcast IDs from original_items
    if (phonesToUse.length === 0 && historyItem.original_items && historyItem.original_items.length > 0) {
      toast.add({
        title: 'Loading...',
        description: 'Fetching customer phone numbers from backend...',
        color: 'blue',
        timeout: 2000
      })
      
      try {
        const apiBase = useApiHost()
        const token = useCookie('token').value
        
        // Fetch phones from all original items
        const phonePromises = historyItem.original_items.map(async (item: any) => {
          try {
            const response = await fetch(`${apiBase}/api/broadcast/${item.id}/recipients`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
            
            if (response.ok) {
              const data = await response.json()
              const phones = data.recipient_phones || []
              console.log(`[RESEND] Fetched phones for ${item.id}:`, phones)
              return phones
            }
          } catch (error) {
            console.warn(`[RESEND] Failed to fetch phones for broadcast ${item.id}:`, error)
          }
          return []
        })
        
        const phoneArrays = await Promise.all(phonePromises)
        phonesToUse = Array.from(new Set(phoneArrays.flat()))
        console.log('[RESEND] Fetched phones from backend endpoints:', phonesToUse)
      } catch (error) {
        console.warn('[RESEND] Failed to fetch phones from backend:', error)
      }
    }
  
  if (phonesToUse.length === 0) {
    toast.add({
      title: 'Warning',
      description: 'No customer phone numbers found in this broadcast history. Please select customers manually.',
      color: 'yellow'
    })
    return
  }
  
  // Find customers by phone numbers
  const customersToSelect = allCustomers.value.filter((c: any) => 
    phonesToUse.includes(c.phone)
  )
  
  if (customersToSelect.length === 0) {
    toast.add({
      title: 'Warning',
      description: `No matching customers found for ${phonesToUse.length} phone number(s) in this broadcast. They may have been removed from the system.`,
      color: 'yellow'
    })
    return
  }
  
  // Set target to customers (required for validation)
  state.value.target = 'customers'
  
  // Set selected customers
  state.value.selectedCustomers = customersToSelect.map((c: any) => c.phone)
  
  // Set message from history (if available)
  // Check if message contains placeholders to determine if it's a template
  if (historyItem.message) {
    const hasPlaceholders = historyItem.message.match(/\{\{\d+\}\}/)
    
    if (hasPlaceholders) {
      // Message has placeholders, try to find matching template
      const templateKey = Object.keys(broadcastTemplates).find(key => {
        const template = broadcastTemplates[key as keyof typeof broadcastTemplates]
        // Check if template structure matches (same placeholder numbers)
        const templatePlaceholders = extractPlaceholders(template)
        const messagePlaceholders = extractPlaceholders(historyItem.message)
        return JSON.stringify(templatePlaceholders) === JSON.stringify(messagePlaceholders)
      })
      
      if (templateKey) {
        state.value.template = templateKey
        state.value.message = broadcastTemplates[templateKey as keyof typeof broadcastTemplates]
        // Note: placeholderValues will need to be filled manually
      } else {
        // No matching template found, use as custom message
        state.value.message = historyItem.message
        state.value.template = 'custom'
      }
    } else {
      // No placeholders, use as custom message
      state.value.message = historyItem.message
      state.value.template = 'custom'
    }
  }
  
  toast.add({
    title: 'Customers Selected',
    description: `${customersToSelect.length} customer(s) from broadcast history have been selected. You can now edit the message and send again.`,
    color: 'green'
  })
  
  // Scroll to message template section
  setTimeout(() => {
    const templateSection = document.querySelector('[name="template"]')
    if (templateSection) {
      templateSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 100)
  } finally {
    resendingToCustomers.value = null
  }
}
</script>

<template>
  <div>
    <!-- Send Broadcast Button -->
    <UButton 
      @click="openModal"
      color="primary"
      v-bind="$attrs"
    >
      <template #leading>
        <slot name="leading">
          <LucideIcon name="send" :size="16" />
        </slot>
      </template>
      Send Broadcast
    </UButton>

    <!-- Broadcast Modal -->
    <UModal v-model="isModalOpen" :ui="{ width: 'w-[95vw]', height: 'h-auto max-h-[95vh] overflow-y-auto', background: 'bg-white' }" class="broadcast-modal">
      <div class="w-full max-w-none mx-auto p-4 lg:p-8 overflow-y-auto max-h-[95vh] broadcast-form-content bg-white">
        <!-- Modal Header -->
        <div class="flex items-center justify-between mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
          <h1 class="text-xl font-bold text-black">Broadcast Management</h1>
          <UButton
            @click="closeModal"
            variant="outline"
            color="gray"
            size="md"
            class="close-button"
          >
            <LucideIcon name="x" :size="22" />
          </UButton>
        </div>

        <!-- Desktop: Two-column layout, Mobile: Single column -->
        <div class="flex flex-col md:flex-row gap-6">
          <!-- Left Column: Broadcast Configuration -->
          <div class="flex-1 space-y-6">
            <!-- Broadcast Configuration Section -->
            <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 class="text-xl font-bold text-black mb-3 flex items-center gap-2">
                <LucideIcon name="send" :size="20" class="text-blue-600" />
                Broadcast Configuration
              </h3>

              <UForm :state="state" @submit="onSubmit" class="space-y-4">
                <!-- Target Audience -->
                <UFormGroup name="target">
                  <template #label>
                    <div class="flex items-center gap-2">
                      <LucideIcon name="users" :size="16" class="text-gray-600" />
                      <span class="text-black font-medium">Target Audience</span>
                    </div>
                  </template>
                  <USelectMenu
                    v-model="state.target"
                    :options="targetOptions"
                    value-attribute="value"
                    option-attribute="label"
                    placeholder="Select target audience..."
                    class="w-full broadcast-select"
                  />
                </UFormGroup>

                <!-- Message Template Type -->
                <UFormGroup name="template">
                  <template #label>
                    <div class="flex items-center gap-2">
                      <LucideIcon name="file-text" :size="16" class="text-gray-600" />
                      <span class="text-black font-medium">Template Type</span>
                    </div>
                  </template>
                  <USelectMenu
                    v-model="state.template"
                    :options="templateOptions"
                    value-attribute="value"
                    option-attribute="label"
                    placeholder="Choose template or custom message..."
                    class="w-full broadcast-select"
                  />
                </UFormGroup>

                <!-- Customer Selection (only shown when target is customers) -->
                <template v-if="state.target === 'customers'">
                  <!-- Area Filter -->
                  <UFormGroup name="selectedArea">
                    <template #label>
                      <div class="flex items-center gap-2">
                        <LucideIcon name="map" :size="16" class="text-gray-600" />
                        <span class="text-black font-medium">Filter by Area</span>
                      </div>
                    </template>
                    <USelectMenu
                      v-model="state.selectedArea"
                      :options="areaOptions"
                      value-attribute="value"
                      option-attribute="label"
                      placeholder="Select area to filter customers..."
                      :clearable="true"
                      searchable
                      class="w-full broadcast-select"
                    />
                  </UFormGroup>

                  <!-- Customer Type Filter -->
                  <UFormGroup name="customerTypeFilter">
                    <template #label>
                      <div class="flex items-center gap-2">
                        <LucideIcon name="tag" :size="16" class="text-gray-600" />
                        <span class="text-black font-medium">Customer Type Filter</span>
                      </div>
                    </template>
                    <USelectMenu
                      v-model="state.customerTypeFilter"
                      :options="customerTypeFilterOptions"
                      value-attribute="value"
                      option-attribute="label"
                      placeholder="Select customer type..."
                      class="w-full broadcast-select"
                    />
                  </UFormGroup>

                  <!-- Customer Selection -->
                  <UFormGroup name="selectedCustomers" required>
                    <template #label>
                      <div class="flex items-center gap-2">
                        <LucideIcon name="user-check" :size="16" class="text-gray-600" />
                        <span class="text-black font-medium">Select Customers</span>
                      </div>
                    </template>
                    <!-- Action Buttons Row -->
                    <div class="flex gap-2 mb-2">
                      <UButton
                        size="sm"
                        variant="solid"
                        color="primary"
                        @click="selectAllCustomers"
                        :disabled="state.selectedCustomers.length === customerOptions.length || customerOptions.length === 0"
                        class="flex-1"
                      >
                        Select All
                      </UButton>
                      <UButton
                        size="sm"
                        variant="solid"
                        color="red"
                        @click="clearAllCustomers"
                        :disabled="state.selectedCustomers.length === 0"
                        class="flex-1"
                      >
                        Clear
                      </UButton>
                    </div>

                    <!-- Customer Selection Dropdown -->
                    <USelectMenu
                      v-model="state.selectedCustomers"
                      :options="customerOptions"
                      value-attribute="value"
                      option-attribute="label"
                      :placeholder="`Select customers (${customerOptions.length} available)`"
                      multiple
                      searchable
                      class="w-full broadcast-select"
                    />
                    <template #description>
                      <span class="text-sm text-gray-600">{{ state.selectedCustomers.length }} customer(s) selected</span>
                    </template>
                  </UFormGroup>
                </template>
              </UForm>
            </div>

            <!-- Message Template Section -->
            <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 class="text-xl font-bold text-black mb-3 flex items-center gap-2">
                <LucideIcon name="message-square" :size="20" class="text-green-600" />
                Message Template
              </h3>

              <UForm :state="state" @submit="onSubmit" class="space-y-4">
                <!-- Custom Message Editor (when template is 'custom') -->
                <UFormGroup v-if="state.template === 'custom'" name="customMessage" required>
                  <template #label>
                    <div class="flex items-center gap-2">
                      <LucideIcon name="edit" :size="16" class="text-gray-600" />
                      <span class="text-black font-medium">Custom Message</span>
                    </div>
                  </template>
                  <UTextarea
                    v-model="state.message"
                    :rows="8"
                    placeholder="Write your message here..."
                    class="w-full broadcast-input"
                  />
                  <template #description>
                    <span class="text-sm text-gray-600">Write a direct message without templates. This message will be sent to all selected recipients.</span>
                  </template>
                </UFormGroup>

                <!-- Dynamic Placeholder Fields -->
                <div v-if="state.template && state.template !== 'custom' && currentPlaceholderFields.length > 0"
                     class="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 class="text-lg font-semibold text-black mb-3 flex items-center gap-2">
                    <LucideIcon name="settings" :size="18" class="text-gray-600" />
                    Fill Template Data
                  </h4>

                  <div v-if="state.target === 'customers' && state.selectedCustomers.length > 0"
                       class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 font-medium">
                    <LucideIcon name="info" :size="16" class="inline mr-2" />
                    Customer names will be automatically filled for each selected customer. Each customer will receive a personalized message.
                  </div>

                  <div v-if="state.target === 'team'"
                       class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 font-medium">
                    <LucideIcon name="users" :size="16" class="inline mr-2" />
                    Internal team templates require manual input. Please fill all required fields.
                  </div>

                  <div v-for="field in currentPlaceholderFields" :key="field.number" class="space-y-2">
                    <UFormGroup :label="field.label"
                                :name="`placeholder-${field.number}`"
                                required
                                class="text-black font-medium">
                      <!-- Customer Select -->
                      <USelectMenu
                        v-if="field.type === 'customer'"
                        v-model="state.placeholderValues[`{{${field.number}}}`]"
                        :options="getFieldOptions(field)"
                        value-attribute="value"
                        option-attribute="label"
                        :placeholder="`Select ${field.label}`"
                        searchable
                        class="text-black w-full broadcast-select"
                      />

                      <!-- Area Select -->
                      <USelectMenu
                        v-else-if="field.type === 'area'"
                        v-model="state.placeholderValues[`{{${field.number}}}`]"
                        :options="getFieldOptions(field)"
                        value-attribute="value"
                        option-attribute="label"
                        :placeholder="`Select ${field.label}`"
                        searchable
                        class="text-black w-full broadcast-select"
                      />

                      <!-- Trouble Type Select -->
                      <USelectMenu
                        v-else-if="field.type === 'trouble_type'"
                        v-model="state.placeholderValues[`{{${field.number}}}`]"
                        :options="getFieldOptions(field)"
                        value-attribute="value"
                        option-attribute="label"
                        :placeholder="`Select ${field.label}`"
                        searchable
                        class="text-black w-full broadcast-select"
                      />

                      <!-- Invoice Select -->
                      <USelectMenu
                        v-else-if="field.type === 'invoice'"
                        v-model="state.placeholderValues[`{{${field.number}}}`]"
                        :options="getFieldOptions(field)"
                        value-attribute="value"
                        option-attribute="label"
                        :placeholder="`Select ${field.label}`"
                        searchable
                        class="text-black w-full broadcast-select"
                      />

                      <!-- Invoice Date (auto-filled, read-only) -->
                      <UInput
                        v-else-if="field.type === 'invoice_date'"
                        v-model="state.placeholderValues[`{{${field.number}}}`]"
                        :placeholder="`${field.label} (auto-filled from invoice)`"
                        readonly
                        :disabled="!state.placeholderValues['{{3}}'] && !state.placeholderValues['{{2}}']"
                        class="w-full broadcast-input"
                      />

                      <!-- Invoice Amount (auto-filled, read-only) -->
                      <UInput
                        v-else-if="field.type === 'invoice_amount'"
                        v-model="state.placeholderValues[`{{${field.number}}}`]"
                        :placeholder="`${field.label} (auto-filled from invoice)`"
                        readonly
                        :disabled="!state.placeholderValues['{{3}}'] && !state.placeholderValues['{{2}}']"
                        class="w-full broadcast-input"
                      />

                      <!-- Date Input -->
                      <UInput
                        v-else-if="field.type === 'date'"
                        v-model="state.placeholderValues[`{{${field.number}}}`]"
                        type="date"
                        :placeholder="`Select ${field.label}`"
                        class="w-full broadcast-input"
                      />

                      <!-- Textarea Input (for team templates) -->
                      <UTextarea
                        v-else-if="field.type === 'textarea'"
                        v-model="state.placeholderValues[`{{${field.number}}}`]"
                        :placeholder="`Enter ${field.label}`"
                        :rows="3"
                        class="w-full broadcast-input"
                      />

                      <!-- Text Input -->
                      <UInput
                        v-else
                        v-model="state.placeholderValues[`{{${field.number}}}`]"
                        :placeholder="`Enter ${field.label}`"
                        class="w-full broadcast-input"
                      />
                    </UFormGroup>
                  </div>
                </div>

                <!-- Message Preview - Real-time reactive (only show for templates, not custom) -->
                <UFormGroup v-if="state.template && state.template !== 'custom'" name="message" required>
                  <template #label>
                    <div class="flex items-center gap-2">
                      <LucideIcon name="eye" :size="16" class="text-gray-600" />
                      <span class="text-black font-medium">Message Preview</span>
                    </div>
                  </template>
                  <UTextarea
                    :model-value="previewMessage"
                    :rows="8"
                    readonly
                    class="w-full bg-gray-50 font-mono text-sm broadcast-preview"
                    placeholder="Choose template and fill data to see preview..."
                  />
                  <template #description>
                    <span class="text-sm text-gray-600">Preview of message after placeholders are replaced (updates automatically)</span>
                  </template>
                </UFormGroup>
              </UForm>
            </div>
          </div>

          <!-- Right Column: History & Send -->
          <div class="flex-1 space-y-6">
            <!-- Broadcast History Section -->
            <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 class="text-xl font-bold text-black mb-3 flex items-center gap-2">
                <LucideIcon name="history" :size="20" class="text-orange-600" />
                Broadcast History
              </h3>

              <div v-if="historyLoading" class="flex justify-center py-8">
                <LucideIcon name="loader-2" :size="24" class="animate-spin" />
              </div>
              <div v-else-if="broadcastHistory.length === 0" class="text-center py-8 text-gray-500">
                <LucideIcon name="inbox" :size="48" class="mx-auto mb-4 opacity-50" />
                <p>No broadcast history found</p>
              </div>
              <div v-else class="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                <UTable
                  :rows="broadcastHistory"
                  :columns="historyColumns"
                  class="w-full"
                >
                  <template #message-data="{ row }">
                    <div class="max-w-xs truncate" :title="row.message">
                      {{ row.message }}
                    </div>
                  </template>
                  <template #target_group-data="{ row }">
                    <UBadge
                      :color="row.target_group === 'team' ? 'blue' : 'purple'"
                      variant="subtle"
                    >
                      {{ row.target_group === 'team' ? 'Team' : 'Customers' }}
                    </UBadge>
                  </template>
                  <template #recipient_count-data="{ row }">
                    <span class="font-medium">{{ row.recipient_count }}</span>
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
                  <template #actions-data="{ row }">
                    <UButton
                      v-if="(row.target_group === 'customers' || row.target_group === 'Customers') && row.recipient_count > 0"
                      size="xs"
                      color="primary"
                      variant="ghost"
                      :loading="resendingToCustomers === row.id"
                      :disabled="resendingToCustomers !== null"
                      @click="resendToCustomers(row)"
                      title="Select these customers to send message again"
                    >
                      <template #leading>
                        <LucideIcon v-if="!resendingToCustomers || resendingToCustomers !== row.id" name="refresh-cw" :size="14" />
                      </template>
                      {{ resendingToCustomers === row.id ? 'Loading...' : 'Resend' }}
                    </UButton>
                    <span v-else-if="row.target_group === 'team' || row.target_group === 'Team'" class="text-gray-400 text-xs">N/A</span>
                    <span v-else class="text-gray-400 text-xs">-</span>
                  </template>
                </UTable>
              </div>
            </div>

            <!-- Send Section -->
            <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 class="text-xl font-bold text-black mb-3 flex items-center gap-2">
                <LucideIcon name="send" :size="20" class="text-red-600" />
                Send Broadcast
              </h3>

              <div class="space-y-4">
                <div class="text-sm text-gray-700 flex items-center gap-1">
                  <LucideIcon name="info" :size="16" />
                  <span>Review your broadcast settings and send when ready</span>
                </div>

                <!-- Send Buttons -->
                <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div class="text-sm text-gray-600 flex items-center gap-1">
                    <LucideIcon name="alert-triangle" :size="16" class="text-yellow-600" />
                    <span>All required fields must be filled</span>
                  </div>
                  <div class="flex gap-3 w-full sm:w-auto">
                    <UButton
                      type="button"
                      @click="closeModal"
                      variant="outline"
                      color="gray"
                      size="lg"
                      class="flex-1 sm:flex-initial border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <template #leading>
                        <LucideIcon name="x" :size="16" />
                      </template>
                      Cancel
                    </UButton>
                    <UButton
                      type="submit"
                      @click="onSubmit"
                      color="primary"
                      size="lg"
                      class="flex-1 sm:flex-initial"
                      :disabled="!state.message || (state.target === 'customers' && state.selectedCustomers.length === 0)"
                    >
                      <template #leading>
                        <LucideIcon name="send" :size="16" />
                      </template>
                      Send Now
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UModal>

    <!-- 
      BACKEND (Golang) REQUIREMENT:
      
      The POST /api/broadcast/send endpoint must handle the following:
      
      1. If request body has target == "team":
         - Query the users table from database to get ALL team phone numbers
         - Send the message to every team member (all users in users table)
         - Store in broadcast_history with target_group='team' and phones=NULL
      
      2. If request body has target == "customers":
         - Use the phones array directly from the request body (selected customers)
         - Send the message to only the selected phone numbers in the array
         - Store in broadcast_history with target_group='customers' and phones=JSON array
      
      3. The handler will receive the final, edited message from the frontend
         and should send that exact message (no template processing needed).
      
      4. After sending, save to broadcast_history table:
         - id: UUID()
         - message: the message sent
         - target_group: 'customers' or 'team'
         - status: 'Sent' or 'Failed'
         - template_key: the template key from request
         - phones: JSON array for customers (NULL for team)
         - phone_count: number of recipients
         - sent_at: current timestamp
      
      Request body structure:
      - For customers: { "target": "customers", "phones": ["123", "456"], "message": "...", "template_key": "..." }
      - For team: { "target": "team", "message": "...", "template_key": "..." }
      
      Database: See database/broadcast_history.sql for table schema
    -->
  </div>
</template>

<style scoped>
/* CRITICAL: Override HeadlessUI dialog panel max-width (32rem from sm:max-w-lg) */
/* ONLY target HeadlessUI dialog panels that are ancestors of this broadcast modal */
.broadcast-modal :deep([id^="headlessui-dialog-panel"]),
:deep(.broadcast-modal ~ [id^="headlessui-dialog-panel"]) {
  max-width: none !important;
  width: 95vw !important;
}

/* Specifically override the sm:max-w-lg Tailwind class that sets max-width: 32rem */
/* Only for this modal's dialog panel */
@media (min-width: 640px) {
  .broadcast-modal :deep([id^="headlessui-dialog-panel"].sm\:max-w-lg),
  .broadcast-modal :deep([id^="headlessui-dialog-panel"][class*="max-w-lg"]),
  :deep(.broadcast-modal ~ [id^="headlessui-dialog-panel"].sm\:max-w-lg),
  :deep(.broadcast-modal ~ [id^="headlessui-dialog-panel"][class*="max-w-lg"]) {
    max-width: none !important;
    width: 95vw !important;
  }
}

/* Alternative: Target any dialog panel that contains our broadcast form content */
:deep([id^="headlessui-dialog-panel"]:has(.broadcast-form-content)) {
  max-width: none !important;
  width: 95vw !important;
}

@media (min-width: 640px) {
  :deep([id^="headlessui-dialog-panel"]:has(.broadcast-form-content).sm\:max-w-lg),
  :deep([id^="headlessui-dialog-panel"]:has(.broadcast-form-content)[class*="max-w-lg"]) {
    max-width: none !important;
    width: 95vw !important;
  }
}

/* Force modal to be wider - override UModal defaults */
:deep(.ui-modal),
:deep([class*="ui-modal"]) {
  max-width: 95vw !important;
  width: 95vw !important;
}

:deep(.ui-modal > div),
:deep(.ui-modal > .ui-card) {
  max-width: 95vw !important;
  width: 95vw !important;
}

/* Ensure modal content container is full width */
:deep(.ui-modal .max-w-\[95vw\]) {
  max-width: 95vw !important;
  width: 95vw !important;
}

/* Responsive optimizations - modal uses max-w-[95vw] from template */
@media (max-width: 640px) {
  /* Improve touch targets */
  .grid-cols-1 > * {
    min-height: 44px; /* iOS recommended touch target size */
  }

  /* Optimize map for mobile */
  .leaflet-container {
    touch-action: manipulation;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  /* Smooth scrolling */
  .overflow-y-auto {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }

  /* Prevent zoom on input focus (iOS) */
  input[type="text"],
  input[type="tel"],
  input[type="number"],
  input[type="date"],
  select {
    font-size: 16px;
  }

  /* Mobile-specific map height */
  .leaflet-container {
    height: 250px !important;
  }
}

/* Desktop optimizations */
@media (min-width: 1024px) {
  /* Larger map for desktop */
  .leaflet-container {
    height: 450px !important;
  }

  /* Better spacing for desktop */
  .space-y-6 > * + * {
    margin-top: 1.5rem;
  }

  /* Desktop form spacing */
  .gap-6 {
    gap: 1.5rem;
  }
}

/* Tablet and desktop - UModal handles width via template props */

/* Performance optimizations */
.leaflet-container {
  will-change: transform;
  transform: translateZ(0);
}

/* Smooth animations */
.transition-all {
  transition: all 0.2s ease-in-out;
}

/* Better focus states for accessibility */
button:focus,
input:focus,
select:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Loading states */
.loading {
  opacity: 0.7;
  pointer-events: none;
}

/* Responsive typography */
@media (max-width: 640px) {
  .text-lg {
    font-size: 1rem;
  }

  .text-2xl {
    font-size: 1.25rem;
  }
}

/* Card shadows and borders for better visual hierarchy - soft shadows */
.bg-white {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.04);
}

/* Ensure modal background is white */
.broadcast-modal :deep(.ui-modal),
.broadcast-modal :deep([class*="ui-modal"]) {
  background-color: #FFFFFF !important;
}

.broadcast-modal :deep(.ui-modal > div),
.broadcast-modal :deep(.ui-modal > .ui-card) {
  background-color: #FFFFFF !important;
}

/* Perfect column alignment */
.grid-cols-1.md\\:grid-cols-2 > div {
  display: flex;
  flex-direction: column;
}

/* Consistent label spacing */
.space-y-1 > label {
  margin-bottom: 0.25rem;
  font-weight: 500;
  line-height: 1.5;
}

/* Ensure all form elements have consistent height */
.space-y-1 input,
.space-y-1 select,
.space-y-1 [role="combobox"] {
  min-height: 42px;
}

/* Perfect grid alignment */
.grid.grid-cols-1.md\\:grid-cols-2 {
  align-items: start;
}

/* Consistent spacing for form groups */
.space-y-1 {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

/* Single column layout spacing */
.space-y-4 > * + * {
  margin-top: 1rem;
}

/* Ensure proper spacing between form sections */
.space-y-4 {
  display: flex;
  flex-direction: column;
}

/* Custom input styling - white background, clean borders */
:deep(.broadcast-input input),
:deep(.broadcast-input) {
  background-color: #F9FAFB !important;
  border-color: #D1D5DB !important;
  color: #000000 !important;
}

:deep(.broadcast-input input:focus),
:deep(.broadcast-input:focus-within) {
  border-color: #2563EB !important;
  outline: none !important;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
}

:deep(.broadcast-input input::placeholder) {
  color: #6B7280 !important;
}

/* Date input calendar icon styling - make it black and visible */
/* For Chrome, Safari, Edge (WebKit browsers) */
:deep(.broadcast-input input[type="date"]::-webkit-calendar-picker-indicator) {
  filter: brightness(0) !important;
  opacity: 1 !important;
  cursor: pointer !important;
  background-color: transparent !important;
  width: 20px !important;
  height: 20px !important;
  padding: 2px !important;
  margin-right: 5px !important;
}

:deep(.broadcast-input input[type="date"]::-webkit-calendar-picker-indicator:hover) {
  opacity: 0.8 !important;
  filter: brightness(0) opacity(0.8) !important;
}

/* For Firefox */
:deep(.broadcast-input input[type="date"]) {
  color-scheme: light !important;
}

:deep(.broadcast-input input[type="date"]::-moz-calendar-picker-indicator) {
  filter: brightness(0) saturate(100%) !important;
  opacity: 1 !important;
  cursor: pointer !important;
}

/* Ensure date input text is black */
:deep(.broadcast-input input[type="date"]) {
  color: #000000 !important;
}

/* Make date input clickable and ensure calendar opens */
:deep(.broadcast-input input[type="date"]) {
  cursor: pointer !important;
  pointer-events: auto !important;
}

/* Custom select menu styling - clean white background */
:deep(.broadcast-select button),
:deep(.broadcast-select [role="combobox"]) {
  background-color: #FFFFFF !important;
  border-color: #D1D5DB !important;
  color: #000000 !important;
}

/* AGGRESSIVE: Force all text to be black with multiple selectors */
:deep(.broadcast-select button span),
:deep(.broadcast-select [role="combobox"] span),
:deep(.broadcast-select button div),
:deep(.broadcast-select [role="combobox"] div),
:deep(.broadcast-select button *),
:deep(.broadcast-select [role="combobox"] *) {
  color: #000000 !important;
  fill: #000000 !important;
}

/* Override Tailwind's text-gray classes inside buttons */
:deep(.broadcast-select button [class*="text-gray"]),
:deep(.broadcast-select [role="combobox"] [class*="text-gray"]) {
  color: #000000 !important;
}

/* Target the actual text nodes */
:deep(.broadcast-select button span:not([class*="icon"])),
:deep(.broadcast-select [role="combobox"] span:not([class*="icon"])) {
  color: #000000 !important;
}

:deep(.broadcast-select button:focus),
:deep(.broadcast-select [role="combobox"]:focus),
:deep(.broadcast-select:focus-within button) {
  border-color: #2563EB !important;
  outline: none !important;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
}

/* Force black text - override ANY text color that might be applied */
:deep(.broadcast-select button .text-gray-500),
:deep(.broadcast-select button .text-gray-400),
:deep(.broadcast-select button .text-gray-300),
:deep(.broadcast-select [role="combobox"] .text-gray-500),
:deep(.broadcast-select [role="combobox"] .text-gray-400),
:deep(.broadcast-select [role="combobox"] .text-gray-300) {
  color: #000000 !important;
}

/* Catch all text-color classes and override */
:deep(.broadcast-select) [class*="text-gray"] {
  color: #000000 !important;
}
:deep(.broadcast-select) [class*="text-opacity"] {
  color: #000000 !important;
}

/* Force black text on ALL labels in broadcast form */
:deep(label[class*="text-gray"]),
:deep(label.text-gray-700),
:deep(label.dark\:text-gray-200) {
  color: #000000 !important;
}

/* Override dark mode text colors for labels */
:deep(.broadcast-form-content label[class*="dark"]) {
  color: #000000 !important;
}

/* Force black on form group labels */
:deep(.broadcast-form-content) label {
  color: #000000 !important;
}

/* Select menu dropdown container/popover - white background */
:deep(.broadcast-select [role="listbox"]),
:deep(.broadcast-select [role="menu"]),
:deep(.broadcast-select [data-headlessui-state]),
:deep(.broadcast-select [class*="ui-menu"]),
:deep(.broadcast-select [class*="ui-popover"]),
:deep(.broadcast-select [class*="popover"]),
:deep(.broadcast-select [class*="menu"]),
:deep(.broadcast-select > div > div),
:deep(.broadcast-select ul),
:deep(.broadcast-select [id*="headlessui-popover"]),
:deep(.broadcast-select [id*="headlessui-menu"]) {
  background-color: #FFFFFF !important;
  border-color: #D1D5DB !important;
  color: #000000 !important;
}

/* Select menu dropdown items */
:deep(.broadcast-select [role="option"]) {
  color: #000000 !important;
  background-color: #FFFFFF !important;
}

:deep(.broadcast-select [role="option"]:hover),
:deep(.broadcast-select [role="option"][data-headlessui-state="active"]) {
  background-color: #F9FAFB !important;
  color: #000000 !important;
}

/* Ensure all nested elements in dropdown are white */
:deep(.broadcast-select [role="listbox"] *),
:deep(.broadcast-select [role="menu"] *),
:deep(.broadcast-select [class*="ui-menu"] *),
:deep(.broadcast-select [class*="ui-popover"] *) {
  background-color: transparent !important;
}

/* Override any dark theme classes that might be applied */
:deep(.broadcast-select [class*="dark"]),
:deep(.broadcast-select [class*="bg-gray-900"]),
:deep(.broadcast-select [class*="bg-black"]) {
  background-color: #FFFFFF !important;
}

/* Form labels - ensure high contrast */
label {
  color: #000000 !important;
}

/* Ensure all text is readable on white background */
.broadcast-form-content {
  color: #000000 !important;
}

/* UFormGroup label styling */
:deep(.broadcast-form-content [class*="UFormGroup"] label),
:deep(.broadcast-form-content [class*="form-group"] label) {
  color: #000000 !important;
  font-weight: 500 !important;
}

/* Message preview styling */
:deep(.broadcast-preview) {
  background-color: #F9FAFB !important;
  color: #374151 !important;
  font-family: 'Courier New', monospace !important;
}

/* Close button styling - make it more visible */
.close-button {
  border: 2px solid #D1D5DB !important;
  background-color: #FFFFFF !important;
  color: #374151 !important;
  min-width: 40px !important;
  min-height: 40px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 8px !important;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
  transition: all 0.2s ease-in-out !important;
}

.close-button:hover {
  background-color: #FEF2F2 !important;
  border-color: #F87171 !important;
  color: #DC2626 !important;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1) !important;
  transform: scale(1.05) !important;
}

.close-button:active {
  transform: scale(0.95) !important;
}

.close-button:focus {
  outline: 2px solid #2563EB !important;
  outline-offset: 2px !important;
}
</style>

<style>
/* Global styles for HeadlessUI dialog panel - ONLY affects broadcast modal */
/* Target dialog panel with data-broadcast-form-modal attribute (added via JavaScript) */
[id^="headlessui-dialog-panel"][data-broadcast-form-modal="true"] {
  max-width: none !important;
  width: 95vw !important;
}

/* Override sm:max-w-lg class specifically (removes 32rem constraint) */
/* ONLY for broadcast modal */
@media (min-width: 640px) {
  [id^="headlessui-dialog-panel"][data-broadcast-form-modal="true"].sm\:max-w-lg,
  [id^="headlessui-dialog-panel"][data-broadcast-form-modal="true"][class*="max-w-lg"] {
    max-width: none !important;
    width: 95vw !important;
  }
}

/* Alternative: Target dialog panel by containing broadcast-form-content class */
@media (min-width: 640px) {
  [id^="headlessui-dialog-panel"]:has(.broadcast-form-content) {
    max-width: none !important;
    width: 95vw !important;
  }

  [id^="headlessui-dialog-panel"]:has(.broadcast-form-content).sm\:max-w-lg,
  [id^="headlessui-dialog-panel"]:has(.broadcast-form-content)[class*="max-w-lg"] {
    max-width: none !important;
    width: 95vw !important;
  }
}

/* Global styles for USelectMenu dropdowns in broadcast form - target portalled elements */
/* These styles target dropdown menus that are portalled to body */
[id^="headlessui-dialog-panel"][data-broadcast-form-modal="true"] ~ [id^="headlessui-popover"],
[id^="headlessui-dialog-panel"][data-broadcast-form-modal="true"] ~ [id^="headlessui-menu"],
body > [id^="headlessui-popover"]:has([role="option"]),
body > [id^="headlessui-menu"]:has([role="option"]),
body.broadcast-modal-open [id^="headlessui-popover"],
body.broadcast-modal-open [id^="headlessui-menu"],
[id^="headlessui-popover"][data-broadcast-form-dropdown="true"],
[id^="headlessui-menu"][data-broadcast-form-dropdown="true"] {
  background-color: #FFFFFF !important;
  border-color: #D1D5DB !important;
  color: #000000 !important;
}

/* Target all popover/menu containers that might contain broadcast form dropdowns */
body.broadcast-modal-open [id^="headlessui-popover"] [role="listbox"],
body.broadcast-modal-open [id^="headlessui-popover"] [role="menu"],
body.broadcast-modal-open [id^="headlessui-menu"] [role="listbox"],
body.broadcast-modal-open [id^="headlessui-menu"] [role="menu"],
[id^="headlessui-popover"][data-broadcast-form-dropdown="true"] [role="listbox"],
[id^="headlessui-popover"][data-broadcast-form-dropdown="true"] [role="menu"],
[id^="headlessui-menu"][data-broadcast-form-dropdown="true"] [role="listbox"],
[id^="headlessui-menu"][data-broadcast-form-dropdown="true"] [role="menu"],
body.broadcast-modal-open [id^="headlessui-popover"] ul,
body.broadcast-modal-open [id^="headlessui-menu"] ul,
[id^="headlessui-popover"][data-broadcast-form-dropdown="true"] ul,
[id^="headlessui-menu"][data-broadcast-form-dropdown="true"] ul,
body.broadcast-modal-open [id^="headlessui-popover"] [class*="ui-menu"],
body.broadcast-modal-open [id^="headlessui-menu"] [class*="ui-menu"],
[id^="headlessui-popover"][data-broadcast-form-dropdown="true"] [class*="ui-menu"],
[id^="headlessui-menu"][data-broadcast-form-dropdown="true"] [class*="ui-menu"] {
  background-color: #FFFFFF !important;
  border-color: #D1D5DB !important;
  color: #000000 !important;
}

/* Target dropdown options */
body.broadcast-modal-open [id^="headlessui-popover"] [role="option"],
body.broadcast-modal-open [id^="headlessui-menu"] [role="option"],
[id^="headlessui-popover"][data-broadcast-form-dropdown="true"] [role="option"],
[id^="headlessui-menu"][data-broadcast-form-dropdown="true"] [role="option"],
body.broadcast-modal-open [id^="headlessui-popover"] li,
body.broadcast-modal-open [id^="headlessui-menu"] li,
[id^="headlessui-popover"][data-broadcast-form-dropdown="true"] li,
[id^="headlessui-menu"][data-broadcast-form-dropdown="true"] li {
  background-color: #FFFFFF !important;
  color: #000000 !important;
}

body.broadcast-modal-open [id^="headlessui-popover"] [role="option"]:hover,
body.broadcast-modal-open [id^="headlessui-menu"] [role="option"]:hover,
[id^="headlessui-popover"][data-broadcast-form-dropdown="true"] [role="option"]:hover,
[id^="headlessui-menu"][data-broadcast-form-dropdown="true"] [role="option"]:hover,
body.broadcast-modal-open [id^="headlessui-popover"] [role="option"][data-headlessui-state="active"],
body.broadcast-modal-open [id^="headlessui-menu"] [role="option"][data-headlessui-state="active"],
[id^="headlessui-popover"][data-broadcast-form-dropdown="true"] [role="option"][data-headlessui-state="active"],
[id^="headlessui-menu"][data-broadcast-form-dropdown="true"] [role="option"][data-headlessui-state="active"],
body.broadcast-modal-open [id^="headlessui-popover"] li:hover,
body.broadcast-modal-open [id^="headlessui-menu"] li:hover,
[id^="headlessui-popover"][data-broadcast-form-dropdown="true"] li:hover,
[id^="headlessui-menu"][data-broadcast-form-dropdown="true"] li:hover {
  background-color: #F9FAFB !important;
  color: #000000 !important;
}

/* Override any dark theme classes in dropdowns */
body.broadcast-modal-open [id^="headlessui-popover"] [class*="dark"],
body.broadcast-modal-open [id^="headlessui-popover"] [class*="bg-gray-900"],
body.broadcast-modal-open [id^="headlessui-popover"] [class*="bg-black"],
body.broadcast-modal-open [id^="headlessui-menu"] [class*="dark"],
body.broadcast-modal-open [id^="headlessui-menu"] [class*="bg-gray-900"],
body.broadcast-modal-open [id^="headlessui-menu"] [class*="bg-black"],
[id^="headlessui-popover"][data-broadcast-form-dropdown="true"] [class*="dark"],
[id^="headlessui-popover"][data-broadcast-form-dropdown="true"] [class*="bg-gray-900"],
[id^="headlessui-popover"][data-broadcast-form-dropdown="true"] [class*="bg-black"],
[id^="headlessui-menu"][data-broadcast-form-dropdown="true"] [class*="dark"],
[id^="headlessui-menu"][data-broadcast-form-dropdown="true"] [class*="bg-gray-900"],
[id^="headlessui-menu"][data-broadcast-form-dropdown="true"] [class*="bg-black"] {
  background-color: #FFFFFF !important;
}
</style>
