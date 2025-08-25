import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const byTypeChartData = computed(() => {
  return {
    labels: byTypeRows.value.map(r => r.name),
    datasets: [
      {
        label: 'Ticket Count',
        data: byTypeRows.value.map(r => r.count),
        backgroundColor: '#4F46E5', // biru indigo
      },
    ],
  }
})

const byTypeChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
}

<script setup lang="ts">
import { onMounted, ref, watch, defineAsyncComponent, computed } from 'vue'
import { ticketsApi } from '@/api/tickets'
import { customerAdminApi } from '@/api/admin/customer'
import { userManagementAdminApi } from '@/api/admin/user-management'
import { uploadFileAdminApi } from '@/api/admin/file-upload'
import { useAuthStore } from '@/stores/auth'
import { useRolePermissions } from '@/composables/useRolePermissions'

const authStore = useAuthStore()
const { userRole, isAdmin, isCustomerService, isNOC, isTechnician } = useRolePermissions()

// Debug logging for role detection
console.log('Auth store user role:', authStore.user?.role)
console.log('Normalized user role:', userRole.value)
console.log('isAdmin:', isAdmin.value)
console.log('isCustomerService:', isCustomerService.value)
console.log('isNOC:', isNOC.value)
console.log('isTechnician:', isTechnician.value)

const rows = ref<any[]>([])
const byTypeRows = ref<any[]>([])
const loading = ref(true)
const note = ref('')

const selectedId = ref<number | null>(null)
const activeTab = ref(0)
const isLoading = ref(true)

// Realtime notifications (simple polling)
const lastCheckedAt = ref<string>(new Date().toISOString())
const newUpdates = ref<any[]>([])
const showUpdatesBanner = ref(false)
let pollTimer: any = null

async function pollUpdates() {
  try {
    const res: any = await ticketsApi().updates(lastCheckedAt.value)
    const items = res.data || res || []
    if (items.length > 0) {
      newUpdates.value = items
      showUpdatesBanner.value = true
      // refresh table so user sees the latest entries
      await refresh()
    }
    lastCheckedAt.value = new Date().toISOString()
  } catch (e) {
    // silent
  }
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(pollUpdates, 15000) // 15s
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = null
}

// Lookups for modal and table rendering
const customers = ref<any[]>([])
const troubleTypes = ref<any[]>([])
const loadingLookups = ref(true)
const showNewType = ref(false)
const newTypeName = ref('')
const showNOCNoteModal = ref(false)
const showTechnicianNoteModal = ref(false)
const showResolveModal = ref(false)
// Removed duplicate declarations - these are declared later
const nocNote = ref('')
const technicianNote = ref('')
const resolveNote = ref('')
const nocActionSubmitting = ref(false)
const technicianNoteSubmitting = ref(false)
const resolveSubmitting = ref(false)
const nocSelectedType = ref<string>('')
const imgTechBfFile = ref<File | null>(null)
const imgTechAfFile = ref<File | null>(null)

// Search functionality
const searchQuery = ref('')

// Computed properties for image preview URLs
const beforeImageUrl = computed(() => {
  if (imgTechBfFile.value) {
    return URL.createObjectURL(imgTechBfFile.value)
  }
  return undefined
})

const afterImageUrl = computed(() => {
  if (imgTechAfFile.value) {
    return URL.createObjectURL(imgTechAfFile.value)
  }
  return undefined
})

// Filtered tickets based on search query
const filteredRows = computed(() => {
  if (!searchQuery.value.trim()) {
    return rows.value
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  return rows.value.filter(ticket => {
    return (
      ticket.id?.toString().includes(query) ||
      ticket.title?.toLowerCase().includes(query) ||
      ticket.type?.toLowerCase().includes(query) ||
      ticket.type_name?.toLowerCase().includes(query) ||
      ticket.status?.toLowerCase().includes(query) ||
      ticket.current_assignee_name?.toLowerCase().includes(query) ||
      ticket.current_assignee_role?.toLowerCase().includes(query) ||
      ticket.customer_note?.toLowerCase().includes(query) ||
      ticket.technician_note?.toLowerCase().includes(query) ||
      ticket.noc_note?.toLowerCase().includes(query)
    )
  })
})

const nocImageFile = ref<File | null>(null)
const nocImagePreview = ref<string>('')
const showImageModal = ref(false)
const selectedImageUrl = ref('')
const typeNameMap = computed(() => {
  const map: Record<string, string> = {}
  for (const t of troubleTypes.value) map[t.id] = t.name || t.id
  return map
})

// Delete confirmation modal
const showDeleteModal = ref(false)
const ticketToDelete = ref<any>(null)

// hotspots state
const hotspots = ref<any[]>([])
async function loadHotspots() {
  try {
    const res: any = await ticketsApi().hotspots()
    hotspots.value = res.data || res || []
  } catch (e) { console.error('load hotspots', e) }
}

async function refresh() {
  try {
    console.log('Fetching tickets...')
    console.log('Auth token:', authStore.getToken)
    console.log('User role:', authStore.user?.role)

    const res: any = await ticketsApi().list()
    console.log('Tickets API response:', res)

    rows.value = res.data || res
    console.log('Processed tickets:', rows.value)

    loading.value = false
    isLoading.value = false
  } catch (error) {
    console.error('Error fetching tickets:', error)
    loading.value = false
    isLoading.value = false
  }
}

onMounted(async () => {
  // Test role extraction first
  try {
    const debugResponse = await ticketsApi().debugRole()
    console.log('Debug role response:', debugResponse)
  } catch (error) {
    console.error('Debug role error:', error)
  }

  await refresh();
  await loadLookups()
  startPolling()
})

function dismissUpdates() {
  showUpdatesBanner.value = false
  newUpdates.value = []
}

async function refreshUpdates() {
  await refresh()
  showUpdatesBanner.value = false
  newUpdates.value = []
}

function actPrepare(id: number) { selectedId.value = id; note.value = '' }

function actPrepareResolve(id: number) {
  selectedId.value = id;
  resolveNote.value = '';
  showResolveModal.value = true;
}

function actPrepareNOC(id: number) {
  console.log('actPrepareNOC called with id:', id)
  selectedId.value = id;
  nocNote.value = '';
  nocSelectedType.value = troubleTypes.value[0]?.id || ''
  nocImageFile.value = null;
  nocImagePreview.value = '';
  showNOCNoteModal.value = true
  console.log('showNOCNoteModal set to:', showNOCNoteModal.value)
}

function handleNOCImageUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }
    
    nocImageFile.value = file;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      nocImagePreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}

function removeNOCImage() {
  nocImageFile.value = null;
  nocImagePreview.value = '';
  // Reset the file input
  const fileInput = document.getElementById('noc-image-upload') as HTMLInputElement;
  if (fileInput) {
    fileInput.value = '';
  }
}

// This function is already declared later, removing duplicate

function actPrepareTechnicianNote(id: number) {
  selectedId.value = id;
  technicianNote.value = '';
  imgTechBfFile.value = null;
  imgTechAfFile.value = null;
  showTechnicianNoteModal.value = true
}

// File validation function
function validateFile(file: File): { isValid: boolean; message: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  
  if (file.size > maxSize) {
    return { isValid: false, message: 'File size exceeds 10MB limit' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, message: 'File type not supported. Please use JPG, PNG, or GIF' };
  }
  
  return { isValid: true, message: 'File is valid' };
}

// File change handlers with validation
function handleBeforeImageChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (file) {
    const validation = validateFile(file);
    if (validation.isValid) {
      imgTechBfFile.value = file;
    } else {
      // Show error and reset input
      alert(validation.message);
      target.value = '';
      imgTechBfFile.value = null;
    }
  }
}

function handleAfterImageChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (file) {
    const validation = validateFile(file);
    if (validation.isValid) {
      imgTechAfFile.value = file;
    } else {
      // Show error and reset input
      alert(validation.message);
      target.value = '';
      imgTechAfFile.value = null;
    }
  }
}

async function sendToNOC() { if (!selectedId.value) return; await ticketsApi().sendToNOC(selectedId.value, note.value); await refresh() }

// Open the same modal and reuse note + image inputs to send to NOC
async function sendToNOCFromModal() {
  if (!selectedId.value) return;
  try {
    nocActionSubmitting.value = true
    await ticketsApi().sendToNOC(selectedId.value, nocNote.value, nocImageFile.value || undefined)
    showNOCNoteModal.value = false
    try { const toast = useToast(); toast.add({ title: 'Sent to NOC', description: 'Ticket sent to NOC.', color: 'primary', timeout: 3000 }) } catch {}
    await refresh()
  } catch (e:any) {
    console.error('sendToNOC error:', e)
    try {
      const toast = useToast();
      const msg = e?.data?.message || e?.message || 'Failed to send to NOC'
      toast.add({ title: 'Action failed', description: String(msg), color: 'red', icon: 'i-heroicons-exclamation-triangle', timeout: 5000 })
    } catch {}
  } finally {
    nocActionSubmitting.value = false
  }
}
async function nocSolved() { if (!selectedId.value) return; await ticketsApi().nocSolved(selectedId.value, note.value); await refresh() }
async function nocPhysical() { if (!selectedId.value) return; await ticketsApi().nocPhysical(selectedId.value, note.value); await refresh() }
async function assignTechnician() { 
  if (!selectedId.value) return; 
  try {
    await ticketsApi().assignTechnician(selectedId.value);
    try { const toast = useToast(); toast.add({ title: 'Assigned to Technician', description: 'Ticket assigned to technician role.', color: 'primary', timeout: 3000 }) } catch {}
    await refresh()
  } catch (e: any) {
    console.error('assignTechnician error:', e)
    try {
      const toast = useToast();
      const msg = e?.data?.message || e?.message || 'Failed to assign technician'
      toast.add({ title: 'Action failed', description: String(msg), color: 'red', icon: 'i-heroicons-exclamation-triangle', timeout: 5000 })
    } catch {}
  }
}

async function nocSolvedFromModal() {
  if (!selectedId.value) return;
  await ticketsApi().nocSolved(selectedId.value, nocNote.value);
  showNOCNoteModal.value = false;
  await refresh()
}

async function nocPhysicalFromModal() {
  if (!selectedId.value) return;
  await ticketsApi().nocPhysical(selectedId.value, nocNote.value);
  showNOCNoteModal.value = false;
  await refresh()
}

async function sendTechnicianNoteFromModal() {
  if (!selectedId.value) return;
  try {
    technicianNoteSubmitting.value = true
    await ticketsApi().addTechnicianNote(selectedId.value, technicianNote.value, imgTechBfFile.value || undefined, imgTechAfFile.value || undefined)
    showTechnicianNoteModal.value = false
    // feedback
    try { const toast = useToast(); toast.add({ title: 'Technician Note Added', description: 'Note has been added successfully.', color: 'primary', timeout: 3000 }) } catch {}
    await refresh()
  } catch (e:any) {
    console.error('sendTechnicianNote error:', e)
    try {
      const toast = useToast();
      const msg = e?.data?.message || e?.message || 'Failed to add technician note'
      toast.add({ title: 'Action failed', description: String(msg), color: 'red', icon: 'i-heroicons-exclamation-triangle', timeout: 5000 })
    } catch {}
  } finally {
    technicianNoteSubmitting.value = false
  }
}

async function sendToCSFromModal() {
  if (!selectedId.value) return;
  try {
    nocActionSubmitting.value = true
    
    await ticketsApi().sendToCS(selectedId.value, nocNote.value, nocSelectedType.value || undefined, nocImageFile.value || undefined)
    showNOCNoteModal.value = false
    // feedback
    try { const toast = useToast(); toast.add({ title: 'Sent to CS', description: 'Ticket returned to Customer Service.', color: 'primary', timeout: 3000 }) } catch {}
    await refresh()
  } catch (e:any) {
    console.error('sendToCS error:', e)
    try {
      const toast = useToast();
      const msg = e?.data?.message || e?.message || 'Failed to send to CS'
      toast.add({ title: 'Action failed', description: String(msg), color: 'red', icon: 'i-heroicons-exclamation-triangle', timeout: 5000 })
    } catch {}
  } finally {
    nocActionSubmitting.value = false
  }
}
async function resolve() { if (!selectedId.value) return; await ticketsApi().resolve(selectedId.value, note.value); await refresh() }

async function resolveFromModal() {
  if (!selectedId.value) return;
  try {
    resolveSubmitting.value = true
    await ticketsApi().resolve(selectedId.value, resolveNote.value)
    showResolveModal.value = false
    try { const toast = useToast(); toast.add({ title: 'Ticket Resolved', description: 'Ticket has been marked as resolved.', color: 'primary', timeout: 3000 }) } catch {}
    await refresh()
  } catch (e: any) {
    console.error('resolve error:', e)
    try {
      const toast = useToast();
      const msg = e?.data?.message || e?.message || 'Failed to resolve ticket'
      toast.add({ title: 'Action failed', description: String(msg), color: 'red', icon: 'i-heroicons-exclamation-triangle', timeout: 5000 })
    } catch {}
  } finally {
    resolveSubmitting.value = false
  }
}

// Role-based action buttons with workflow awareness
const getTicketActions = (ticket: any) => {
  console.log('getTicketActions called for ticket:', ticket.id)
  console.log('Current user role:', userRole.value)
  console.log('Ticket assignee:', ticket.current_assignee_name)
  console.log('Ticket status:', ticket.status)
  
  const actions: Array<{
    label: string
    color: string
    action: () => void
    show: boolean
    tooltip?: string
  }> = [
      {
        label: 'To NOC',
        color: 'bg-blue-600',
        action: () => { actPrepareNOC(ticket.id) },
        show: (isAdmin.value || isCustomerService.value) &&
          (ticket.current_assignee_name === 'CUSTOMER SERVICE' || ticket.current_assignee_name === 'CUSTOMER_SERVICE' || ticket.current_assignee_name === 'ADMIN') &&
          ticket.status !== 'finished',
        tooltip: 'Send ticket to Network Operations Center'
      },
      {
        label: 'To CS',
        color: 'bg-purple-600',
        action: () => { actPrepareNOC(ticket.id) },
        show: (isAdmin.value || isNOC.value) &&
          ticket.current_assignee_name === 'NOC' &&
          ticket.status !== 'finished',
        tooltip: 'Return ticket to Customer Service'
      },
      {
        label: 'Assign Tech',
        color: 'bg-cyan-600',
        action: () => { actPrepare(ticket.id); assignTechnician() },
        show: (isAdmin.value || isCustomerService.value) &&
          (ticket.current_assignee_name === 'CUSTOMER SERVICE' || ticket.current_assignee_name === 'CUSTOMER_SERVICE' || ticket.current_assignee_name === 'ADMIN') &&
          ticket.status !== 'finished',
        tooltip: 'Assign to technician role (all technicians can see it)'
      },
      {
        label: 'Add Tech Note & Img',
        color: 'bg-orange-600',
        action: () => { actPrepareTechnicianNote(ticket.id) },
        show: isTechnician.value && 
          (ticket.current_assignee_name === 'TECHNICIAN' || ticket.current_assignee_name === authStore.user?.user_id) &&
          ticket.status !== 'finished',
        tooltip: 'Add technician note and upload before/after images'
      },
      {
        label: 'Resolve',
        color: 'bg-emerald-600',
        action: () => { actPrepareResolve(ticket.id) },
        show: (isAdmin.value || isCustomerService.value) &&
          (ticket.current_assignee_name === 'CUSTOMER SERVICE' || ticket.current_assignee_name === 'CUSTOMER_SERVICE' || ticket.current_assignee_name === 'ADMIN') &&
          ticket.status !== 'finished',
        tooltip: 'Mark ticket as resolved with customer note'
      }
    ]

  const filteredActions = actions.filter(action => action.show)
  console.log('Filtered actions:', filteredActions.map(a => a.label))
  return filteredActions
}

// Dropdown items for ticket actions (similar to customer page)
const items = (row: any) => {
  const workflowActions = getTicketActions(row).map(action => ({
    label: action.label,
    icon: getActionIcon(action.label),
    click: action.action
  }))
  
  const actions = [workflowActions]
  
  // Add delete action (for admin and CS)
  if (isAdmin.value || isCustomerService.value) {
    actions.push([{
      label: 'Delete',
      icon: 'i-heroicons-trash-20-solid',
      click: () => showDeleteConfirmation(row)
    }])
  }
  
  return actions
}

// Helper function to get icon for action
function getActionIcon(actionLabel: string): string {
  switch (actionLabel) {
    case 'To NOC': return 'i-heroicons-arrow-right-20-solid'
    case 'To CS': return 'i-heroicons-arrow-left-20-solid'
    case 'Assign Tech': return 'i-heroicons-user-plus-20-solid'
    case 'Add Tech Note': return 'i-heroicons-document-text-20-solid'
    case 'Resolve': return 'i-heroicons-check-circle-20-solid'
    default: return 'i-heroicons-cog-6-tooth-20-solid'
  }
}

// Add sendToCS function for NOC users
async function sendToCS() {
  if (!selectedId.value) return;
  // For now, we'll use the same API endpoint but with different logic
  // In a real implementation, you'd have a separate sendToCS endpoint
  await ticketsApi().sendToNOC(selectedId.value, note.value);
  await refresh()
}

// Show delete confirmation modal
function showDeleteConfirmation(ticket: any) {
  ticketToDelete.value = ticket
  showDeleteModal.value = true
}

// Delete ticket function
async function deleteTicket(id: number) {
  try {
    await ticketsApi().delete(id)
    useToast().add({ 
      title: 'Success!', 
      description: 'Ticket deleted successfully', 
      color: 'green', 
      timeout: 3000 
    })
    showDeleteModal.value = false
    ticketToDelete.value = null
    await refresh()
  } catch (error: any) {
    console.error('Error deleting ticket:', error)
    const msg = error?.data?.message || error?.message || 'Failed to delete ticket'
    useToast().add({ 
      title: 'Delete failed', 
      description: String(msg), 
      color: 'red', 
      icon: 'i-heroicons-exclamation-triangle', 
      timeout: 5000 
    })
  }
}

const showAdd = ref(false)
const form = ref({ customer_id: '', title: '', description: '', type: '', img_cs: '' })
async function loadLookups() {
  try {
    const cust: any = await customerAdminApi().getAllCustomers()
    customers.value = (cust.data || cust) || []
  } catch (e) { console.error('load customers', e) }
  try {
    const tt: any = await ticketsApi().troubleTypes()
    troubleTypes.value = tt.data || tt || []
  } catch (e) { console.error('load trouble types', e) }

  if (!form.value.customer_id && customers.value.length) form.value.customer_id = customers.value[0].id
  if (!form.value.type && troubleTypes.value.length) form.value.type = troubleTypes.value[0].id
  showNewType.value = troubleTypes.value.length === 0
  loadingLookups.value = false
}
function generateTypeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID()
  }
  return 'tt_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

const saveNewType = async () => {
  const id = generateTypeId()
  await ticketsApi().createTroubleType(id, newTypeName.value || undefined)
  const tt: any = await ticketsApi().troubleTypes()
  troubleTypes.value = tt.data || tt || []
  form.value.type = id
  newTypeName.value = ''
  showNewType.value = false
}

// derived GPS for modal
const modalGpsLat = computed(() => {
  const c = customers.value.find(c => c.id === form.value.customer_id)
  return c?.latitude
})
const modalGpsLng = computed(() => {
  const c = customers.value.find(c => c.id === form.value.customer_id)
  return c?.longitude
})
async function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    try {
      // Upload file using existing API
      const uploadData = {
        name: `ticket_cs_${Date.now()}`,
        path: 'tickets/cs',
        file: file
      }
      
      const response = await uploadFileAdminApi().createUploadFile(uploadData)
      if (response.data) {
        // Store filename only, URL will be constructed in backend
        const fileName = response.data.file || response.data.full_path?.split('/').pop()
        form.value.img_cs = fileName
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      // Fallback to base64 for preview
      const fallbackReader = new FileReader()
      fallbackReader.onload = (e) => {
        form.value.img_cs = e.target?.result as string
      }
      fallbackReader.readAsDataURL(file)
    }
  }
}

function openImageModal(imageSrc: string) {
  selectedImageUrl.value = imageSrc
  showImageModal.value = true
}

async function createTicket() {
  try {
    console.log('Auth store token:', authStore.getToken) // Debug log
    console.log('Creating ticket with data:', form.value) // Debug log
    await ticketsApi().create({
      customer_id: String(form.value.customer_id),
      title: form.value.title,
      description: form.value.description,
      type: String(form.value.type),
      img_cs: form.value.img_cs,
    })
    showAdd.value = false
    form.value = { customer_id: customers.value[0]?.id || '', title: '', description: '', type: troubleTypes.value[0]?.id || '', img_cs: '' }
    useToast().add({ 
      title: 'Success!', 
      description: 'Ticket created successfully', 
      color: 'green', 
      timeout: 3000 
    })
    await refresh()
  } catch (error: any) {
    console.error('Error creating ticket:', error) // Debug log
    const msg = error?.data?.message || error?.message || 'Failed to create ticket'
    useToast().add({ 
      title: 'Create failed', 
      description: String(msg), 
      color: 'red', 
      icon: 'i-heroicons-exclamation-triangle', 
      timeout: 5000 
    })
  }
}
// Fetchers similar to transaction page
async function fetchAllTickets(params: any) {
  // params is kept for parity; current API does not filter server-side
  isLoading.value = true
  await ticketsApi()
    .list()
    .then((response: any) => {
      const data = response.data || response
      data.forEach((t: any, idx: number) => {
        t.number = idx + 1
      })
      rows.value = data
    })
    .catch((err: any) => {
      console.error('Error fetching tickets:', err)
    })
    .finally(() => {
      isLoading.value = false
    })
}

const tab_items = [
  { label: 'Tickets', value: 'tickets' },
  { label: 'Trouble Reports', value: 'trouble' },
]

async function fetchTicket() { await fetchAllTickets({}) }
async function fetchTrouble() { /* rendered component fetches itself */ }

watch(activeTab, (idx) => { if (idx === 0) fetchTicket(); else fetchTrouble() }, { immediate: true })

// Use alias consistent with tsconfig paths
const TroubleReport = defineAsyncComponent(() => import('@/pages/dashboard/report/trouble/index.vue'))
</script>
<template>
  <div class="space-y-4 text-gray-900">
    <UTabs :items="tab_items" class="w-full" v-model="activeTab" />

    <div v-if="activeTab === 0" class="space-y-4">
      <h1 class="text-2xl font-semibold text-gray-900">Trouble Tickets</h1>

      <div v-if="showUpdatesBanner"
        class="p-3 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 flex items-center justify-between">
        <div>
          New updates available ({{ newUpdates.length }}). Some tickets may have been assigned to your role.
        </div>
        <div class="space-x-2">
          <button class="px-2 py-1 rounded bg-yellow-600 text-white" @click="dismissUpdates">Dismiss</button>
          <button class="px-2 py-1 rounded bg-yellow-700 text-white" @click="refreshUpdates">Refresh</button>
        </div>
      </div>

      <div class="p-4 bg-white rounded-lg shadow border border-gray-100">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-4">
            <button v-if="isAdmin || isCustomerService" class="px-3 py-2 bg-emerald-600 text-white rounded" @click="showAdd = true">Add Ticket</button>
          </div>
          <div class="flex items-center gap-2">
            <div class="relative">
              <input 
                v-model="searchQuery"
                type="text" 
                placeholder="Search tickets..." 
                class="pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-64"
              />
              <svg class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <span v-if="searchQuery" class="text-sm text-gray-500">
              {{ filteredRows.length }} of {{ rows.length }} tickets
            </span>
          </div>
        </div>
        <div class="table-scroll-container">
          <div class="table-scroll-content">
            <table class="min-w-full text-sm text-gray-900">
                             <thead class="bg-gray-100">
                 <tr class="text-left border-b border-gray-200 uppercase text-xs tracking-wide text-gray-800">
                   <th class="p-2">ID</th>
                   <th class="p-2">Title</th>
                   <th class="p-2">Type</th>
                   <th class="p-2">Status</th>
                   <th class="p-2">Assignee</th>
                   <th class="p-2">Notes</th>
                   <th class="p-2">Images</th>
                   <th class="p-2 w-16">Actions</th>
                 </tr>
               </thead>
              <tbody>
                <tr v-for="r in filteredRows" :key="r.id" class="border-b border-gray-100 odd:bg-white even:bg-gray-50 hover:bg-gray-100/70">
                  <td class="p-2">{{ r.id }}</td>
                  <td class="p-2">{{ r.title }}</td>
                  <td class="p-2 capitalize">{{ r.type_name || r.type }}</td>
                  <td class="p-2 capitalize">{{ r.status }}</td>
                  <td class="p-2 capitalize">{{ r.current_assignee_name || r.current_assignee_role }}</td>
                  <td class="p-2">
                    <div class="flex flex-wrap gap-1 max-w-xs">
                      <div v-if="r.customer_note" class="text-xs">
                        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">CS:</span>
                        <span class="ml-1 text-gray-700 truncate">{{ r.customer_note.length > 30 ? r.customer_note.substring(0, 30) + '...' : r.customer_note }}</span>
                      </div>
                      <div v-if="r.technician_note" class="text-xs">
                        <span class="bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">Tech:</span>
                        <span class="ml-1 text-gray-700 truncate">{{ r.technician_note.length > 30 ? r.technician_note.substring(0, 30) + '...' : r.technician_note }}</span>
                      </div>
                      <div v-if="r.noc_note" class="text-xs">
                        <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">NOC:</span>
                        <span class="ml-1 text-gray-700 truncate">{{ r.noc_note.length > 30 ? r.noc_note.substring(0, 30) + '...' : r.noc_note }}</span>
                      </div>
                      <span v-if="!r.customer_note && !r.technician_note && !r.noc_note" class="text-gray-400 text-xs">No notes</span>
                    </div>
                  </td>
                  <td class="p-2">
                    <div class="flex flex-wrap gap-1">
                      <div v-if="r.img_cs" class="flex items-center gap-1">
                        <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">CS</span>
                        <img :src="`${useApiHost()}/uploads/cs-images/${r.img_cs}`" alt="CS Image" class="w-8 h-8 object-cover rounded cursor-pointer" @click="openImageModal(`${useApiHost()}/uploads/cs-images/${r.img_cs}`)" />
                      </div>
                      <div v-if="r.img_noc" class="flex items-center gap-1">
                        <span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">NOC</span>
                        <img :src="`${useApiHost()}/uploads/noc-images/${r.img_noc}`" alt="NOC Image" class="w-8 h-8 object-cover rounded cursor-pointer" @click="openImageModal(`${useApiHost()}/uploads/noc-images/${r.img_noc}`)" />
                      </div>
                      <div v-if="r.img_tech_bf" class="flex items-center gap-1">
                        <span class="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Tech BF</span>
                        <img :src="`${useApiHost()}/uploads/technician-images/${r.img_tech_bf}`" alt="Tech Before" class="w-8 h-8 object-cover rounded cursor-pointer" @click="openImageModal(`${useApiHost()}/uploads/technician-images/${r.img_tech_bf}`)" />
                      </div>
                      <div v-if="r.img_tech_af" class="flex items-center gap-1">
                        <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Tech AF</span>
                        <img :src="`${useApiHost()}/uploads/technician-images/${r.img_tech_af}`" alt="Tech After" class="w-8 h-8 object-cover rounded cursor-pointer" @click="openImageModal(`${useApiHost()}/uploads/technician-images/${r.img_tech_af}`)" />
                      </div>
                      <span v-if="!r.img_cs && !r.img_noc && !r.img_tech_bf && !r.img_tech_af" class="text-gray-400 text-xs">No images</span>
                    </div>
                  </td>
                  <td class="p-2 space-x-2">
                    <button v-for="action in getTicketActions(r)" :key="action.label"
                      :class="['px-2 py-1 text-white rounded hover:opacity-80 transition-opacity', action.color]"
                      @click="action.action" :title="action.tooltip">
                      {{ action.label }}
                    </button>
                    <span v-if="getTicketActions(r).length === 0" class="text-gray-400 text-xs">
                      No actions available
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="table-scroll-footer">
            <span class="scroll-hint">↔ Scroll horizontally to see more columns | ↕ Scroll vertically for more rows</span>
          </div>
        </div>
      </div>

      <!-- Modal Add Ticket -->
      <div v-if="showAdd" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" @click="showAdd = false"></div>
        <div class="relative w-full max-w-2xl mx-4 rounded-xl shadow-xl bg-slate-900 text-slate-100 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold">Add New Ticket</h2>
            <button class="text-slate-300 hover:text-white" @click="showAdd = false">✕</button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4" v-if="!loadingLookups">
            <div>
              <label class="block text-sm text-slate-300 mb-1">Customer</label>
              <select v-model="form.customer_id"
                class="w-full rounded px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none">
                <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }} ({{ c.id }})</option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-slate-300 mb-1">Type</label>
              <div class="flex gap-2" v-if="!showNewType">
                <select v-model="form.type"
                  class="w-full rounded px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none">
                  <option v-for="t in troubleTypes" :key="t.id" :value="t.id">{{ t.name || t.id }}</option>
                </select>
                <button type="button" class="px-3 py-2 rounded bg-slate-700" @click="showNewType = true">New</button>
              </div>
              <div v-else class="space-y-2">
                <input v-model="newTypeName" placeholder="Display Name (optional)"
                  class="w-full rounded px-3 py-2 bg-slate-800 border border-slate-700" />
                <div class="flex gap-2">
                  <button type="button" class="px-3 py-2 bg-emerald-600 rounded" @click="saveNewType">Save Type</button>
                  <button type="button" class="px-3 py-2 bg-slate-700 rounded"
                    @click="showNewType = false">Cancel</button>
                </div>
              </div>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm text-slate-300 mb-1">Title</label>
              <input v-model="form.title"
                class="w-full rounded px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm text-slate-300 mb-1">Description</label>
              <textarea v-model="form.description"
                class="w-full rounded px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none"></textarea>
            </div>
            <div>
              <label class="block text-sm text-slate-300 mb-1">GPS Lat (from customer)</label>
              <input :value="modalGpsLat ?? ''" disabled
                class="w-full rounded px-3 py-2 bg-slate-800/50 border border-slate-700" />
            </div>
            <div>
              <label class="block text-sm text-slate-300 mb-1">GPS Lng (from customer)</label>
              <input :value="modalGpsLng ?? ''" disabled
                class="w-full rounded px-3 py-2 bg-slate-800/50 border border-slate-700" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm text-slate-300 mb-1">Upload Image (CS)</label>
              <input type="file" @change="handleImageUpload" accept="image/*"
                class="w-full rounded px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none" />
                             <div v-if="form.img_cs" class="mt-2">
                 <img :src="`${useApiHost()}/uploads/tickets/cs/${form.img_cs}`" alt="Preview" class="w-32 h-32 object-cover rounded border" />
               </div>
            </div>
          </div>
          <div v-else class="text-slate-300">Loading options...</div>
          <div class="mt-4 flex justify-end gap-2">
            <button class="px-4 py-2 rounded bg-gray-600 text-white" @click="showAdd = false">Cancel</button>
            <button class="px-4 py-2 rounded bg-emerald-600 text-white" @click="createTicket">Submit</button>
          </div>
        </div>
      </div>

      



      <!-- Modal NOC Note -->
      <div v-if="showNOCNoteModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" @click="showNOCNoteModal = false"></div>
        <div class="relative w-full max-w-md mx-4 rounded-xl shadow-xl bg-white p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900">NOC Action</h2>
            <button class="text-gray-400 hover:text-gray-600" @click="showNOCNoteModal = false">✕</button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <textarea v-model="nocNote" placeholder="Enter any notes about this action..."
                class="w-full rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none text-gray-900 bg-white"></textarea>
            </div>
            <div v-if="isNOC || isAdmin">
              <label class="block text-sm font-medium text-gray-700 mb-1">Diagnosed Trouble Type</label>
              <select v-model="nocSelectedType" class="w-full rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900">
                <option value="" class="text-gray-500">-- Select trouble type (optional) --</option>
                <option v-for="t in troubleTypes" :key="t.id" :value="t.id" class="text-gray-900 bg-white">{{ t.name || t.id }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Upload Image (Optional)</label>
              <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div class="space-y-1 text-center">
                  <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <div class="flex text-sm text-gray-600">
                    <label for="noc-image-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <span>Upload a file</span>
                      <input id="noc-image-upload" name="noc-image-upload" type="file" class="sr-only" accept="image/*" @change="handleNOCImageUpload" />
                    </label>
                    <p class="pl-1">or drag and drop</p>
                  </div>
                  <p class="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
              <div v-if="nocImageFile" class="mt-2">
                <div class="flex items-center space-x-2">
                  <img :src="nocImagePreview" alt="Preview" class="h-16 w-16 object-cover rounded" />
                  <div>
                    <p class="text-sm text-gray-600">{{ nocImageFile.name }}</p>
                    <button @click="removeNOCImage" class="text-sm text-red-600 hover:text-red-800">Remove</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button class="px-4 py-2 rounded bg-gray-300 text-gray-700"
              @click="showNOCNoteModal = false">Cancel</button>
            <button class="px-4 py-2 rounded bg-blue-600 text-white" @click="sendToNOCFromModal"
              v-if="isAdmin || isCustomerService">
              To NOC
            </button>
            <button class="px-4 py-2 rounded bg-purple-600 text-white" @click="sendToCSFromModal">
              To CS
            </button>
            <button class="px-4 py-2 rounded bg-green-600 text-white" @click="nocSolvedFromModal">
              NOC Solved
            </button>
            <button class="px-4 py-2 rounded bg-amber-600 text-white" @click="nocPhysicalFromModal">
              Physical
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Technician Note -->
      <div v-if="showTechnicianNoteModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" @click="showTechnicianNoteModal = false"></div>
        <div class="relative w-full max-w-lg mx-4 rounded-xl shadow-xl bg-white p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Add Technician Note & Images</h2>
            <button class="text-gray-400 hover:text-gray-600" @click="showTechnicianNoteModal = false">✕</button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Technician Note <span class="text-red-500">*</span></label>
              <textarea v-model="technicianNote" placeholder="Enter your technician note..."
                class="w-full rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none text-gray-900 bg-white"></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Before Image (Optional)</label>
              <input type="file" @change="handleBeforeImageChange" 
                accept="image/*" class="w-full rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p class="text-xs text-gray-500 mt-1">Max size: 10MB. Supported: JPG, PNG, GIF</p>
              <!-- Preview Before Image -->
              <div v-if="imgTechBfFile" class="mt-2 p-2 border border-gray-200 rounded bg-gray-50">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">{{ imgTechBfFile.name }}</span>
                  <button @click="imgTechBfFile = null" class="text-red-500 hover:text-red-700 text-sm">✕</button>
                </div>
                <div class="mt-2">
                  <img v-if="beforeImageUrl" :src="beforeImageUrl" alt="Before Preview" class="w-20 h-20 object-cover rounded border" />
                </div>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">After Image (Optional)</label>
              <input type="file" @change="handleAfterImageChange" 
                accept="image/*" class="w-full rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p class="text-xs text-gray-500 mt-1">Max size: 10MB. Supported: JPG, PNG, GIF</p>
              <!-- Preview After Image -->
              <div v-if="imgTechAfFile" class="mt-2 p-2 border border-gray-200 rounded bg-gray-50">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">{{ imgTechAfFile.name }}</span>
                  <button @click="imgTechAfFile = null" class="text-red-500 hover:text-red-700 text-sm">✕</button>
                </div>
                <div class="mt-2">
                  <img v-if="afterImageUrl" :src="afterImageUrl" alt="After Preview" class="w-20 h-20 object-cover rounded border" />
                </div>
              </div>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button class="px-4 py-2 rounded bg-gray-300 text-gray-700"
              @click="showTechnicianNoteModal = false">Cancel</button>
            <button class="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
              @click="sendTechnicianNoteFromModal" :disabled="technicianNoteSubmitting || !technicianNote.trim()">
              {{ technicianNoteSubmitting ? 'Sending...' : 'Add Note & Images' }}
            </button>
          </div>
        </div>
      </div>

             <!-- Modal Image Viewer -->
       <div v-if="showImageModal" class="fixed inset-0 z-50 flex items-center justify-center">
         <div class="absolute inset-0 bg-black/80" @click="showImageModal = false"></div>
         <div class="relative w-full max-w-4xl mx-4 rounded-xl shadow-xl bg-white p-6">
           <div class="flex items-center justify-between mb-4">
             <h2 class="text-xl font-semibold text-gray-900">CS Image</h2>
             <button class="text-gray-400 hover:text-gray-600" @click="showImageModal = false">✕</button>
           </div>
           <div class="flex justify-center">
             <img :src="selectedImageUrl" alt="CS Image" class="max-w-full max-h-96 object-contain rounded" />
           </div>
           <div class="mt-4 flex justify-end">
             <button class="px-4 py-2 rounded bg-gray-300 text-gray-700" @click="showImageModal = false">
               Close
             </button>
           </div>
         </div>
       </div>

      <!-- Modal Delete Confirmation -->
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" @click="showDeleteModal = false"></div>
        <div class="relative w-full max-w-md mx-4 rounded-xl shadow-xl bg-white p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-red-600">Confirm Delete</h2>
            <button class="text-gray-400 hover:text-gray-600" @click="showDeleteModal = false">✕</button>
          </div>
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <i class="i-heroicons-exclamation-triangle text-red-600 text-xl"></i>
                </div>
              </div>
              <div>
                <h3 class="text-lg font-medium text-gray-900">Delete Ticket?</h3>
                <p class="text-sm text-gray-600">
                  Are you sure you want to delete ticket <strong>#{{ ticketToDelete?.id }}</strong>?
                </p>
                <p class="text-sm text-gray-500 mt-1">
                  Title: "{{ ticketToDelete?.title }}"
                </p>
                <p class="text-xs text-red-600 mt-2">
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button class="px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400"
              @click="showDeleteModal = false">
              Cancel
            </button>
            <button class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              @click="deleteTicket(ticketToDelete?.id)">
              Delete Ticket
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Resolve Ticket -->
      <div v-if="showResolveModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" @click="showResolveModal = false"></div>
        <div class="relative w-full max-w-md mx-4 rounded-xl shadow-xl bg-white p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Resolve Ticket</h2>
            <button class="text-gray-400 hover:text-gray-600" @click="showResolveModal = false">✕</button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Customer Note</label>
              <textarea v-model="resolveNote" 
                placeholder="Add a note about the resolution to communicate with the customer..."
                class="w-full rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 bg-white"
                rows="4"></textarea>
              <p class="text-xs text-gray-500 mt-1">This note will be saved as customer_note and the ticket status will be set to finished.</p>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button class="px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400"
              @click="showResolveModal = false">Cancel</button>
            <button class="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              @click="resolveFromModal" :disabled="resolveSubmitting">
              {{ resolveSubmitting ? 'Resolving...' : 'Resolve Ticket' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Image Modal -->
      <div v-if="showImageModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/80" @click="showImageModal = false"></div>
        <div class="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
          <div class="flex items-center justify-between p-4 border-b">
            <h3 class="text-lg font-semibold">Image Preview</h3>
            <button class="text-gray-400 hover:text-gray-600" @click="showImageModal = false">✕</button>
          </div>
          <div class="p-4">
            <img :src="selectedImageUrl" alt="Preview" class="max-w-full max-h-[70vh] object-contain mx-auto" />
          </div>
        </div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <ClientOnly>
        <component :is="TroubleReport" />
      </ClientOnly>
    </div>
  </div>
</template>