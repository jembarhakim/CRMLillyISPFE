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
import TechnicianChecklist from '@/components/TechnicianChecklist.vue'

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
import { areaAdminApi } from '@/api/admin/area'
import { useAuthStore } from '@/stores/auth'
import { useRolePermissions } from '@/composables/useRolePermissions'
import { useNotification } from '@/composables/useNotification'
import TechnicianChecklist from '@/components/TechnicianChecklist.vue'

const authStore = useAuthStore()
const { userRole, isAdmin, isCustomerService, isNOC, isTechnician } = useRolePermissions()
const notification = useNotification()

// Set page title
useHead({
  title: 'Trouble Tickets - CRM System'
})

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

// Loading states for action buttons
const actionLoading = ref<{ [key: string]: boolean }>({})
const createTicketSubmitting = ref(false)
const deleteTicketSubmitting = ref(false)

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
const allCustomers = ref<any[]>([])
const areas = ref<any[]>([])
const selectedAreaId = ref('')
const troubleTypes = ref<any[]>([])
const loadingLookups = ref(true)
const showNewType = ref(false)
const newTypeName = ref('')
const showNOCNoteModal = ref(false)
const showTechnicianNoteModal = ref(false)
const selectedTicket = ref<any | null>(null)
const showResolveModal = ref(false)
// Removed duplicate declarations - these are declared later
const nocNote = ref('')
const nocAccumulation = ref<number>(1)
const technicianNote = ref('')
const resolveNote = ref('')
const nocActionSubmitting = ref(false)
const technicianNoteSubmitting = ref(false)
const resolveSubmitting = ref(false)
const nocSelectedType = ref<string>('')
const imgTechBfFile = ref<File | null>(null)
const imgTechAfFile = ref<File | null>(null)

// Location detail modal state
const showLocationModal = ref(false)
const selectedLocation = ref<{
  customer_name?: string
  customer_id?: string
  customer_address?: string | null
  customer_phone?: string | null
  lat?: number | null
  lng?: number | null
} | null>(null)

async function openLocationDetail(ticket: any) {
  selectedLocation.value = {
    customer_name: ticket.customer_name,
    customer_id: ticket.customer_id,
    customer_address: ticket.customer_address ?? null,
    customer_phone: ticket.customer_phone ?? null,
    lat: ticket.gps_lat ?? null,
    lng: ticket.gps_lng ?? null,
  }
  showLocationModal.value = true

  // Fallback: if any detail missing, fetch from customer API by id
  const needsFetch = !selectedLocation.value.customer_address || !selectedLocation.value.customer_phone || selectedLocation.value.lat == null || selectedLocation.value.lng == null
  if (needsFetch && ticket.customer_id) {
    try {
      const resp: any = await customerAdminApi().getCustomer(ticket.customer_id)
      const data = resp?.data || resp
      if (data) {
        selectedLocation.value = {
          customer_name: data.name ?? selectedLocation.value.customer_name,
          customer_id: data.id ?? selectedLocation.value.customer_id,
          customer_address: data.address ?? selectedLocation.value.customer_address,
          customer_phone: data.phone ?? selectedLocation.value.customer_phone,
          lat: (data.latitude ?? selectedLocation.value.lat) as any,
          lng: (data.longitude ?? selectedLocation.value.lng) as any,
        }
      }
    } catch (e) {
      console.error('Failed to fetch customer details', e)
    }
  }
}

const googleMapsUrl = computed(() => {
  if (!selectedLocation.value?.lat || !selectedLocation.value?.lng) return ''
  const q = `${selectedLocation.value.lat},${selectedLocation.value.lng}`
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}`
})

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

// Technician workflow state
const showAcceptConfirm = ref(false)
const showTeamModal = ref(false)
const showStepModal = ref(false)
const showNetworkArchModal = ref(false)
const teamMembers = ref<Array<{ user_id: string; role: 'senior' | 'junior' | 'helper' }>>([])
const teamSubmitting = ref(false)
const stepDescription = ref('')
const stepImages = ref<File[]>([])
const stepSubmitting = ref(false)
const networkArchitecture = ref('')
const networkArchSubmitting = ref(false)

function openAccept(ticketId: number) {
  selectedId.value = ticketId
  showAcceptConfirm.value = true
}

async function acceptTicket() {
  if (!selectedId.value) return
  try {
    await ticketsApi().accept(selectedId.value)
    showAcceptConfirm.value = false
    useToast().add({ title: 'Accepted', description: 'Ticket accepted.', color: 'primary', timeout: 2500 })
    await refresh()
  } catch (e: any) {
    useToast().add({ title: 'Failed', description: String(e?.data?.message || e?.message || 'Failed to accept'), color: 'red' })
  }
}

function openTeam(ticketId: number) {
  selectedId.value = ticketId
  if (teamMembers.value.length === 0) teamMembers.value = []
  showTeamModal.value = true
}

function addTeamMember() {
  teamMembers.value.push({ user_id: '', role: 'junior' })
}
function removeTeamMember(idx: number) {
  teamMembers.value.splice(idx, 1)
}

async function saveTeam() {
  if (!selectedId.value) return
  try {
    teamSubmitting.value = true
    await ticketsApi().setTeam(selectedId.value, teamMembers.value)
    showTeamModal.value = false
    useToast().add({ title: 'Team saved', description: 'Technician team updated.', color: 'primary', timeout: 2500 })
  } catch (e: any) {
    useToast().add({ title: 'Failed', description: String(e?.data?.message || e?.message || 'Failed to save team'), color: 'red' })
  } finally { teamSubmitting.value = false }
}

function openStep(ticketId: number) {
  selectedId.value = ticketId
  stepDescription.value = ''
  stepImages.value = []
  showStepModal.value = true
}

function onSelectStepImages(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (!files) return
  stepImages.value = Array.from(files)
}

async function saveStep() {
  if (!selectedId.value) return
  try {
    stepSubmitting.value = true
    await ticketsApi().addStep(selectedId.value, stepDescription.value, stepImages.value)
    showStepModal.value = false
    useToast().add({ title: 'Step added', description: 'Troubleshooting step saved.', color: 'primary', timeout: 2500 })
    await refresh()
  } catch (e: any) {
    useToast().add({ title: 'Failed', description: String(e?.data?.message || e?.message || 'Failed to add step'), color: 'red' })
  } finally { stepSubmitting.value = false }
}

async function verifyClose(id?: number) {
  const tid = id || selectedId.value
  if (!tid) return
  try {
    await ticketsApi().verifyClose(tid)
    useToast().add({ title: 'Closed', description: 'Ticket verified & closed by CS.', color: 'primary', timeout: 2500 })
    await refresh()
  } catch (e: any) {
    useToast().add({ title: 'Failed', description: String(e?.data?.message || e?.message || 'Failed to verify & close'), color: 'red' })
  }
}

// New function for technician to mark work as completed
async function markTechnicianCompleted(id?: number) {
  const tid = id || selectedId.value
  if (!tid) return
  try {
    // This will be implemented in the backend
    await ticketsApi().markTechnicianJobCompleted(tid)
    useToast().add({ title: 'Work Completed', description: 'Technician work has been marked as completed.', color: 'green', timeout: 3000 })
    await refresh()
  } catch (e: any) {
    useToast().add({ title: 'Failed', description: String(e?.data?.message || e?.message || 'Failed to mark work as completed'), color: 'red' })
  }
}

// Network architecture selection
function openNetworkArch(ticketId: number) {
  selectedId.value = ticketId
  networkArchitecture.value = ''
  showNetworkArchModal.value = true
}

// Technician checklist
const showTechnicianChecklist = ref(false)
const selectedTicketForChecklist = ref<number | null>(null)
const selectedTechnicianForChecklist = ref<string>('')
const selectedChecklistReadOnly = ref(false)

async function saveNetworkArchitecture() {
  if (!selectedId.value || !networkArchitecture.value) return
  try {
    networkArchSubmitting.value = true
    await ticketsApi().setNetworkArchitecture(selectedId.value, networkArchitecture.value)
    showNetworkArchModal.value = false
    useToast().add({ title: 'Architecture Set', description: 'Network architecture selected successfully.', color: 'primary', timeout: 2500 })
    await refresh()
  } catch (e: any) {
    useToast().add({ title: 'Failed', description: String(e?.data?.message || e?.message || 'Failed to set architecture'), color: 'red' })
  } finally {
    networkArchSubmitting.value = false
  }
}

// Filtered tickets based on search query
const filteredRows = computed(() => {
  // Ensure rows.value is always an array
  const safeRows = Array.isArray(rows.value) ? rows.value : []
  
  if (!searchQuery.value.trim()) {
    return safeRows
  }

  const query = searchQuery.value.toLowerCase().trim()
  return safeRows.filter(ticket => {
    // Add null checks for ticket object
    if (!ticket) return false
    
    return (
      ticket.id?.toString().includes(query) ||
      ticket.customer_name?.toLowerCase().includes(query) ||
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
  
  // Find and set the selected ticket
  const ticket = rows.value.find(t => t.id === id)
  selectedTicket.value = ticket
  
  nocNote.value = '';
  nocSelectedType.value = troubleTypes.value[0]?.id || ''
  nocImageFile.value = null;
  nocImagePreview.value = '';
  showNewType.value = false; // Reset new type form
  newTypeName.value = ''; // Clear new type name
  
  // Initialize accumulation with current ticket value
  nocAccumulation.value = ticket?.accumulation || 1
  
  showNOCNoteModal.value = true
  console.log('showNOCNoteModal set to:', showNOCNoteModal.value)
  console.log('selectedTicket set to:', selectedTicket.value)
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

function actPrepareTechnicianNote(ticket: any) {
  selectedTicket.value = ticket;
  selectedId.value = ticket.id;
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

async function sendToNOC() {
  if (!selectedId.value) return;
  const actionKey = `tonoc_${selectedId.value}`
  if (actionLoading.value[actionKey]) return; // Prevent duplicate requests

  try {
    actionLoading.value[actionKey] = true
    await ticketsApi().sendToNOC(selectedId.value, note.value);
    await refresh()
  } catch (e: any) {
    console.error('sendToNOC error:', e)
    try {
      const toast = useToast();
      const msg = e?.data?.message || e?.message || 'Failed to send to NOC'
      toast.add({ title: 'Action failed', description: String(msg), color: 'red', icon: 'i-heroicons-exclamation-triangle', timeout: 5000 })
    } catch { }
  } finally {
    actionLoading.value[actionKey] = false
  }
}

// Open the same modal and reuse note + image inputs to send to NOC
async function sendToNOCFromModal() {
  if (!selectedId.value) return;
  try {
    nocActionSubmitting.value = true
    await ticketsApi().sendToNOC(selectedId.value, nocNote.value, nocImageFile.value || undefined)
    showNOCNoteModal.value = false
    notification.success('Sent to NOC', 'Ticket sent to NOC.', 3000)
    await refresh()
  } catch (e: any) {
    console.error('sendToNOC error:', e)
    const msg = e?.data?.message || e?.message || 'Failed to send to NOC'
    notification.error('Action failed', String(msg), 5000)
  } finally {
    nocActionSubmitting.value = false
  }
}
async function nocSolved() {
  if (!selectedId.value) return;
  const actionKey = `nocsolved_${selectedId.value}`
  if (actionLoading.value[actionKey]) return; // Prevent duplicate requests

  try {
    actionLoading.value[actionKey] = true
    await ticketsApi().nocSolved(selectedId.value, note.value);
    await refresh()
  } catch (e: any) {
    console.error('nocSolved error:', e)
    const msg = e?.data?.message || e?.message || 'Failed to mark as NOC solved'
    notification.error('Action failed', String(msg), 5000)
  } finally {
    actionLoading.value[actionKey] = false
  }
}
async function nocPhysical() {
  if (!selectedId.value) return;
  const actionKey = `nocphysical_${selectedId.value}`
  if (actionLoading.value[actionKey]) return; // Prevent duplicate requests

  try {
    actionLoading.value[actionKey] = true
    await ticketsApi().nocPhysical(selectedId.value, note.value);
    await refresh()
  } catch (e: any) {
    console.error('nocPhysical error:', e)
    const msg = e?.data?.message || e?.message || 'Failed to mark as physical'
    notification.error('Action failed', String(msg), 5000)
  } finally {
    actionLoading.value[actionKey] = false
  }
}
async function assignTechnician() {
  if (!selectedId.value) return;
  const actionKey = `assigntech_${selectedId.value}`
  if (actionLoading.value[actionKey]) return; // Prevent duplicate requests

  try {
    actionLoading.value[actionKey] = true
    await ticketsApi().assignTechnician(selectedId.value);
    notification.success('Assigned to Technician', 'Ticket assigned to technician role.', 3000)
    await refresh()
  } catch (e: any) {
    console.error('assignTechnician error:', e)
    const msg = e?.data?.message || e?.message || 'Failed to assign technician'
    notification.error('Action failed', String(msg), 5000)
  } finally {
    actionLoading.value[actionKey] = false
  }
}

async function nocSolvedFromModal() {
  if (!selectedId.value) return;
  if (nocActionSubmitting.value) return; // Prevent duplicate requests

  try {
    nocActionSubmitting.value = true
    await ticketsApi().nocSolved(selectedId.value, nocNote.value);
    showNOCNoteModal.value = false;
    await refresh()
  } catch (e: any) {
    console.error('nocSolvedFromModal error:', e)
    const msg = e?.data?.message || e?.message || 'Failed to mark as NOC solved'
    notification.error('Action failed', String(msg), 5000)
  } finally {
    nocActionSubmitting.value = false
  }
}

async function nocPhysicalFromModal() {
  if (!selectedId.value) return;
  if (nocActionSubmitting.value) return; // Prevent duplicate requests

  try {
    nocActionSubmitting.value = true
    await ticketsApi().nocPhysical(selectedId.value, nocNote.value);
    showNOCNoteModal.value = false;
    await refresh()
  } catch (e: any) {
    console.error('nocPhysicalFromModal error:', e)
    const msg = e?.data?.message || e?.message || 'Failed to mark as physical'
    notification.error('Action failed', String(msg), 5000)
  } finally {
    nocActionSubmitting.value = false
  }
}

// Update accumulation from NOC modal
async function updateAccumulationFromModal() {
  if (!selectedTicket.value || nocAccumulation.value === null || nocAccumulation.value === undefined || nocAccumulation.value < 1) {
    notification.error('Invalid Input', 'Please enter a valid accumulation number (1 or more)', 3000)
    return
  }

  try {
    nocActionSubmitting.value = true
    await ticketsApi().updateAccumulation([selectedTicket.value.id], nocAccumulation.value)
    
    // Update the ticket in the local data
    const ticketIndex = rows.value.findIndex(t => t.id === selectedTicket.value.id)
    if (ticketIndex !== -1) {
      rows.value[ticketIndex].accumulation = nocAccumulation.value
    }
    
    notification.success('Success', `Accumulation updated to ${nocAccumulation.value} customers`, 3000)
  } catch (error: any) {
    console.error('updateAccumulationFromModal error:', error)
    notification.error('Update failed', `Failed to update accumulation: ${error?.data?.message || error?.message || 'Unknown error'}`, 3000)
  } finally {
    nocActionSubmitting.value = false
  }
}

// Compress an image file to target max size using canvas
async function compressImageFile(file: File, maxBytes: number): Promise<File> {
  try {
    // Skip compression for non-images
    if (!file.type.startsWith('image/')) return file
    // Already small enough
    if (file.size <= maxBytes) return file

    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    // Scale down if image is huge; keep aspect ratio
    const maxDim = 2000 // cap the longest side to limit memory
    let { width, height } = bitmap
    const ratio = Math.min(1, maxDim / Math.max(width, height))
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
    canvas.width = width
    canvas.height = height
    ctx.drawImage(bitmap, 0, 0, width, height)

    // Binary search quality to fit under maxBytes
    let low = 0.5, high = 0.92, bestBlob: Blob | null = null
    for (let i = 0; i < 6; i++) {
      const q = (low + high) / 2
      const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b || new Blob()), 'image/jpeg', q))
      if (blob.size > 0 && blob.size <= maxBytes) { bestBlob = blob; high = q } else { low = q }
    }
    const out = bestBlob || await new Promise<Blob>(res => canvas.toBlob(b => res(b || new Blob()), 'image/jpeg', 0.85))
    // If still larger, accept and let backend reject
    if (out.size >= file.size) return file
    return new File([out], file.name.replace(/\.(png|jpeg|jpg|webp)$/i, '.jpg'), { type: 'image/jpeg' })
  } catch {
    return file
  }
}

async function sendTechnicianNoteFromModal() {
  if (!selectedId.value) return;
  try {
    technicianNoteSubmitting.value = true
    // Compress files to <= 9.5MB to stay below backend 10MB/file
    const limit = 9.5 * 1024 * 1024
    const bf = imgTechBfFile.value ? await compressImageFile(imgTechBfFile.value, limit) : undefined
    const af = imgTechAfFile.value ? await compressImageFile(imgTechAfFile.value, limit) : undefined

    await ticketsApi().addTechnicianNote(selectedId.value, technicianNote.value, bf, af)
    showTechnicianNoteModal.value = false
    // feedback
    notification.success('Technician Note Added', 'Note has been added successfully.', 3000)
    await refresh()
  } catch (e: any) {
    console.error('sendTechnicianNote error:', e)
    const msg = e?.data?.message || e?.message || 'Failed to add technician note'
    notification.error('Action failed', String(msg), 5000)
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
    notification.success('Sent to CS', 'Ticket returned to Customer Service.', 3000)
    await refresh()
  } catch (e: any) {
    console.error('sendToCS error:', e)
    const msg = e?.data?.message || e?.message || 'Failed to send to CS'
    notification.error('Action failed', String(msg), 5000)
  } finally {
    nocActionSubmitting.value = false
  }
}
async function resolve() {
  if (!selectedId.value) return;
  const actionKey = `resolve_${selectedId.value}`
  if (actionLoading.value[actionKey]) return; // Prevent duplicate requests

  try {
    actionLoading.value[actionKey] = true
    await ticketsApi().resolve(selectedId.value, note.value);
    await refresh()
  } catch (e: any) {
    console.error('resolve error:', e)
    const msg = e?.data?.message || e?.message || 'Failed to resolve ticket'
    notification.error('Action failed', String(msg), 5000)
  } finally {
    actionLoading.value[actionKey] = false
  }
}

async function resolveFromModal() {
  if (!selectedId.value) return;
  try {
    resolveSubmitting.value = true
    await ticketsApi().resolve(selectedId.value, resolveNote.value)
    showResolveModal.value = false
    notification.success('Ticket Resolved', 'Ticket has been marked as resolved.', 3000)
    await refresh()
  } catch (e: any) {
    console.error('resolve error:', e)
    const msg = e?.data?.message || e?.message || 'Failed to resolve ticket'
    notification.error('Action failed', String(msg), 5000)
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
  console.log('Ticket assigned_to:', ticket.assigned_to)
  console.log('Current user ID:', authStore.user?.user_id)
  console.log('Current user ID (alt):', authStore.user?.user_id)
  console.log('Is technician:', isTechnician.value)
  console.log('Full ticket object:', ticket)

  const actions: Array<{
    label: string
    color: string
    action: () => void
    show: boolean
    tooltip?: string
  }> = []

  // Finished tickets: allow read-only progress view ONLY if it's a real trouble ticket.
  // If classification indicates Information (verified_by_cs true/1 or classification === 'info'),
  // then hide the View Progress button because no technician workflow exists.
  if (ticket.status === 'finished') {
    const isInformation = ticket.verified_by_cs === true || ticket.verified_by_cs === 1 || ticket.classification === 'info'
    if (!isInformation) {
      if ((isAdmin.value || isCustomerService.value) && ticket.assigned_to) {
        actions.push({
          label: 'View Progress (Finished)',
          color: 'bg-emerald-700',
          action: () => openTechnicianChecklist(ticket.id, ticket.assigned_to, true),
          show: true,
          tooltip: 'View technician progress (ticket finished)'
        })
      }
    }
    return actions
  }

  // Stage 1: CS creates ticket OR ticket is ongoing but no NOC action yet → Show NOC Action only
  // Enforce: NOC must act BEFORE assigning a technician
  const nocActionRecorded = !!(ticket.noc_note || ticket.img_noc)
  const isCSLikeAssignee = (ticket.current_assignee_name === 'CUSTOMER SERVICE' || ticket.current_assignee_name === 'CUSTOMER_SERVICE' || ticket.current_assignee_name === 'ADMIN')

  if ((ticket.status === 'unfinished' || (ticket.status === 'ongoing' && isCSLikeAssignee && !nocActionRecorded)) &&
    isCSLikeAssignee) {

    if (isAdmin.value || isCustomerService.value) {
      actions.push({
        label: 'NOC Action',
        color: 'bg-blue-600',
        action: () => { actPrepareNOC(ticket.id) },
        show: true,
        tooltip: 'Send ticket to Network Operations Center'
      })
    }
  }

  // Stage 2: After NOC action (noc_note/img_noc present) → Show Assign Technician
  else if (ticket.status === 'ongoing' && isCSLikeAssignee && nocActionRecorded) {

    if (isAdmin.value || isCustomerService.value) {
      actions.push({
        label: 'Assign Technician',
        color: 'bg-cyan-600',
        action: () => { actPrepare(ticket.id); assignTechnician() },
        show: true,
        tooltip: 'Assign ticket to a technician'
      })
    }
  }

  // Stage 3: Technician workflow
  else if (ticket.current_assignee_name === 'TECHNICIAN') {

    // Technician can accept ticket (if not already assigned to someone)
    if (isTechnician.value && (!ticket.assigned_to || ticket.assigned_to === '' || ticket.assigned_to === null)) {
      actions.push({
        label: 'Accept',
        color: 'bg-blue-700',
        action: () => { openAccept(ticket.id) },
        show: true,
        tooltip: 'Accept and lock this ticket to you'
      })
    }

    // If ticket is assigned to current technician, show all technician actions
    // Only show workflow buttons if ticket is actually assigned to current technician
    console.log('Checking technician workflow conditions:')
    console.log('- isTechnician:', isTechnician.value)
    console.log('- ticket.assigned_to:', ticket.assigned_to)
    console.log('- authStore.user?.user_id:', authStore.user?.user_id)
    console.log('- authStore.user?.user_id:', authStore.user?.user_id)
    console.log('- user_id match:', ticket.assigned_to === authStore.user?.user_id)
    console.log('- id match:', ticket.assigned_to === authStore.user?.user_id)

    // Try to get actual user ID from JWT token
    let actualUserID = null
    if (process.client && authStore.token) {
      try {
        const tokenParts = authStore.token.split('.')
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]))
          actualUserID = payload.sub || payload.user_id || payload.id
          console.log('- JWT payload:', payload)
          console.log('- actualUserID from JWT:', actualUserID)
        }
      } catch (e) {
        console.log('- Error decoding JWT:', e)
      }
    }

    if (isTechnician.value && ticket.assigned_to && (
      ticket.assigned_to === authStore.user?.user_id ||
      ticket.assigned_to === authStore.user?.user_id ||
      ticket.assigned_to === actualUserID
    )) {        

      // For technicians who are assigned to the ticket
      if (ticket.assigned_to && (ticket.assigned_to === actualUserID)) {
        actions.push({
          label: 'Technician Checklist',
          color: 'bg-blue-600',
          action: () => openTechnicianChecklist(ticket.id, actualUserID || authStore.user?.user_id || ''),
          show: true,
          tooltip: 'Open technician checklist'
        })
      }
    }
    if ((isAdmin.value || isCustomerService.value) && ticket.assigned_to) {
      actions.push({
        label: 'View Progress (Ongoing)',
        color: 'bg-gray-700',
        action: () => openTechnicianChecklist(ticket.id, ticket.assigned_to, true),
        show: true,
        tooltip: 'View technician progress (ticket ongoing)'
      })
    }

    // Always show customer details for technicians
    if (isTechnician.value) {
      actions.push({
        label: 'Customer Details',
        color: 'bg-sky-600',
        action: () => { openLocationDetail(ticket) },
        show: true,
        tooltip: 'View customer details and location coordinates'
      })
    }
  }

  // Stage 4: After technician completes work → Show Resolve for CS
  else if (ticket.status === 'ongoing' &&
    (ticket.current_assignee_name === 'CUSTOMER SERVICE' || ticket.current_assignee_name === 'CUSTOMER_SERVICE' || ticket.current_assignee_name === 'ADMIN') &&
    ticket.technician_completed) {

    if (isAdmin.value || isCustomerService.value) {
      actions.push({
        label: 'Resolve Ticket',
        color: 'bg-emerald-600',
        action: () => { actPrepareResolve(ticket.id) },
        show: true,
        tooltip: 'Resolve the ticket (final step)'
      })
    }
  }

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

function openTechnicianChecklist(ticketId: number, technicianId?: string, readOnly?: boolean) {
  selectedTicketForChecklist.value = ticketId
  selectedTechnicianForChecklist.value = technicianId || ''
  selectedChecklistReadOnly.value = !!readOnly
  showTechnicianChecklist.value = true
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
  if (deleteTicketSubmitting.value) return; // Prevent duplicate requests

  try {
    deleteTicketSubmitting.value = true
    await ticketsApi().delete(id)
    notification.success('Success!', 'Ticket deleted successfully', 3000)
    showDeleteModal.value = false
    ticketToDelete.value = null
    await refresh()
  } catch (error: any) {
    console.error('Error deleting ticket:', error)
    const msg = error?.data?.message || error?.message || 'Failed to delete ticket'
    notification.error('Delete failed', String(msg), 5000)
  } finally {
    deleteTicketSubmitting.value = false
  }
}

const showAdd = ref(false)
const form = ref({ customer_id: '', title: '', description: '', img_cs: '', classification: 'gangguan' })

// Keyword-based trouble type classification
const classifyTroubleType = (text: string): string => {
  const lowerText = text.toLowerCase()

  // Define keywords for each trouble type (using new database IDs)
  const keywords = {
    '1': ['kabel', 'terputus', 'putus', 'cable', 'broken', 'cut', 'terpotong', 'damage'],
    '2': ['listrik', 'mati', 'power', 'electric', 'elektrik', 'mati listrik', 'blackout', 'outage', 'gangguan listrik'],
    '3': ['dhcp', 'restart', 'reboot', 'router', 'modem', 'koneksi', 'connection', 'ip', 'network', 'masalah dhcp'],
    '4': ['perangkat', 'device', 'tidak berfungsi', 'rusak', 'broken', 'mati', 'offline', 'perangkat tidak berfungsi'],
    '5': ['server', 'konfigurasi', 'config', 'setting', 'setup', 'configuration', 'koneksi server'],
    '6': ['batas', 'limit', 'terlampaui', 'exceeded', 'over', 'quota', 'bandwidth', 'pengguna terlampaui']
  }

  // Check for keyword matches
  for (const [troubleType, keywordList] of Object.entries(keywords)) {
    for (const keyword of keywordList) {
      if (lowerText.includes(keyword)) {
        return troubleType
      }
    }
  }

  return '1' // Default fallback to 'Kabel Terputus'
}


// Filter customers based on selected area
const filteredCustomers = computed(() => {
  if (!selectedAreaId.value) {
    return customers.value
  }
  return customers.value.filter(customer => {
    // Check if customer has area and if it matches selected area
    if (!customer.area) return false
    // Try different possible area ID properties
    return (customer.area as any)?.id === selectedAreaId.value ||
      (customer as any).area_id === selectedAreaId.value ||
      (customer as any).areaId === selectedAreaId.value
  })
})

async function loadLookups() {
  try {
    const cust: any = await customerAdminApi().getAllCustomers()
    const customerData = (cust.data || cust) || []
    customers.value = customerData
    allCustomers.value = customerData
  } catch (e) { console.error('load customers', e) }

  try {
    const areaRes: any = await areaAdminApi().getAllAreas()
    areas.value = (areaRes.data || areaRes) || []
  } catch (e) { console.error('load areas', e) }

  try {
    const tt: any = await ticketsApi().troubleTypes()
    troubleTypes.value = tt.data || tt || []
  } catch (e) { console.error('load trouble types', e) }

  if (!form.value.customer_id && filteredCustomers.value.length) form.value.customer_id = filteredCustomers.value[0].id
  loadingLookups.value = false
}
function generateTypeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID()
  }
  return 'tt_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

const saveNewType = async () => {
  try {
    const id = generateTypeId()
    await ticketsApi().createTroubleType(id, newTypeName.value || undefined)
    const tt: any = await ticketsApi().troubleTypes()
    troubleTypes.value = tt.data || tt || []
    // Set the newly created type as selected
    nocSelectedType.value = id
    newTypeName.value = ''
    showNewType.value = false

    // Show success message
    notification.success('Success!', 'New trouble type created successfully', 3000)
  } catch (error: any) {
    console.error('Error creating trouble type:', error)
    const msg = error?.data?.message || error?.message || 'Failed to create trouble type'
    notification.error('Create failed', String(msg), 5000)
  }
}

let selectedCSFile: File | undefined

async function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    try {
      selectedCSFile = file
      // Upload file using existing API
      const uploadData = {
        name: `ticket_cs_${Date.now()}`,
        path: 'cs-images',
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
  if (createTicketSubmitting.value) return; // Prevent duplicate requests

  try {
    createTicketSubmitting.value = true
    console.log('Auth store token:', authStore.getToken) // Debug log
    console.log('Creating ticket with data:', form.value) // Debug log

    // Auto-classify trouble type based on title/description
    const textToAnalyze = form.value.title || form.value.description || ''
    let classifiedType = ''

    if (textToAnalyze.trim()) {
      classifiedType = classifyTroubleType(textToAnalyze)
    }

    // Fallback to first available trouble type if classification failed or no text provided
    if (!classifiedType && troubleTypes.value.length > 0) {
      classifiedType = troubleTypes.value[0].id
    }

    // Final fallback to default type '1' if no trouble types are available
    if (!classifiedType) {
      classifiedType = '1'
    }

    // Only include img_cs if there's actually an image
    const ticketData: any = {
      customer_id: String(form.value.customer_id),
      title: form.value.title,
      description: form.value.description,
      type: classifiedType,
      classification: form.value.classification,
    }

    // Only add img_cs if there's a valid image filename
    if (form.value.img_cs && form.value.img_cs.trim() !== '') {
      ticketData.img_cs = form.value.img_cs
    }

    const created: any = await ticketsApi().create(ticketData)

    // Immediately send to NOC with description as note and attached image file
    try {
      const newId = created?.data?.id || created?.id
      if (newId) {
        await ticketsApi().sendToNOC(Number(newId), form.value.description || form.value.title || '', selectedCSFile)
      }
    } catch (e) {
      console.warn('sendToNOC after create failed:', e)
    }
    showAdd.value = false
    form.value = { customer_id: customers.value[0]?.id || '', title: '', description: '', img_cs: '', classification: '' }
    notification.success('Success!', 'Ticket created successfully', 3000)
    await refresh()
  } catch (error: any) {
    console.error('Error creating ticket:', error) // Debug log
    const msg = error?.data?.message || error?.message || 'Failed to create ticket'
    notification.error('Create failed', String(msg), 5000)
  } finally {
    createTicketSubmitting.value = false
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
      
      // Check if data is an array and not null/undefined
      if (Array.isArray(data)) {
        data.forEach((t: any, idx: number) => {
          t.number = idx + 1
        })
        rows.value = data
      } else {
        // If data is not an array, set empty array
        console.warn('Tickets data is not an array:', data)
        rows.value = []
      }
    })
    .catch((err: any) => {
      console.error('Error fetching tickets:', err)
      // Set empty array on error
      rows.value = []
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
            <button v-if="isAdmin || isCustomerService"
              class="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700" @click="showAdd = true">Add
              Ticket</button>
          </div>
          <div class="flex items-center gap-2">
            <div class="relative">
              <input v-model="searchQuery" type="text" placeholder="Search tickets..."
                class="pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-64 text-gray-900 bg-white " />
              <svg class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
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
              <colgroup>
                <col class="w-16">
                <col class="w-32">
                <col class="w-64">
                <col class="w-24">
                <col class="w-24">
                <col class="w-24">
                <col class="w-32">
                <col class="w-64">
                <col class="w-32">
                <col class="w-32">
              </colgroup>
              <thead class="bg-gray-100">
                <tr class="text-left border-b border-gray-200 uppercase text-xs tracking-wide text-gray-800">
                  <th class="p-2 w-16">ID</th>
                  <th class="p-2 w-32">Customer</th>
                  <th class="p-2 w-64">Title</th>
                  <th class="p-2 w-64">Description</th>
                  <th class="p-2 w-24">Type</th>
                  <th class="p-2 w-24">Classification</th>
                  <th class="p-2 w-24">Status</th>
                  <th class="p-2 w-32">Assignee</th>
                  <th class="p-2 w-32">Notes</th>
                  <th class="p-2 w-32">Network</th>
                  <th class="p-2 w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(r, index) in filteredRows" :key="r?.id || index">
                  <tr v-if="r" class="border-b border-gray-100 odd:bg-white even:bg-gray-50 hover:bg-gray-100/70 transition-colors">
                  <td class="p-2">{{ r.id }}</td>
                  <td class="p-2 font-medium text-blue-600">{{ r.customer_name || 'Unknown Customer' }}</td>
                  <td class="p-2">{{ r.title }}</td>
                  <td class="p-2 text-gray-700 max-w-xs truncate" :title="r.description || ''">{{ r.description || '-'
                  }}</td>
                  <td class="p-2 capitalize">{{ r.type_name || r.type }}</td>
                  <td class="p-2">
                    <span v-if="r.verified_by_cs === true || r.verified_by_cs === 1"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Information
                    </span>
                    <span v-else
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Trouble
                    </span>
                  </td>
                  <td class="p-2">
                    <span v-if="r.status === 'finished'"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Finished
                    </span>
                    <span v-else-if="r.status === 'ongoing'"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Ongoing
                    </span>
                    <span v-else
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 capitalize">
                      {{ r.status || 'unknown' }}
                    </span>
                  </td>
                  <td class="p-2 capitalize">{{ r.current_assignee_name || r.current_assignee_role }}</td>
                  <td class="p-2 max-w-xs">
                    <div class="flex flex-col gap-1 max-w-xs">
                      <div v-if="r.customer_note" class="text-xs">
                        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">CS:</span>
                        <span class="ml-1 text-gray-700 break-words">{{ r.customer_note }}</span>
                      </div>
                      <div v-if="r.technician_note" class="text-xs">
                        <span class="bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">Tech:</span>
                        <span class="ml-1 text-gray-700 break-words">{{ r.technician_note }}</span>
                      </div>
                      <div v-if="r.noc_note" class="text-xs">
                        <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">NOC:</span>
                        <span class="ml-1 text-gray-700 break-words">{{ r.noc_note }}</span>
                      </div>
                      <span v-if="!r.customer_note && !r.technician_note && !r.noc_note"
                        class="text-gray-400 text-xs">No notes</span>
                    </div>
                  </td>
                  <td class="p-2">
                    <span v-if="r.network_architecture"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {{ r.network_architecture }}
                    </span>
                    <span v-else class="text-gray-400 text-xs">-</span>
                  </td>
                  <td class="p-2">
                    <div class="flex flex-col gap-1 min-w-[120px]">
                      <button v-for="action in getTicketActions(r)" :key="action.label"
                        :class="['px-3 py-1.5 text-white rounded text-xs font-medium hover:opacity-80 transition-opacity w-full text-center flex items-center justify-center gap-2', action.color]"
                        @click="action.action" :title="action.tooltip"
                        :disabled="actionLoading[`${action.label.toLowerCase().replace(/\s+/g, '')}_${r.id}`] || nocActionSubmitting || technicianNoteSubmitting || resolveSubmitting">
                        <svg
                          v-if="actionLoading[`${action.label.toLowerCase().replace(/\s+/g, '')}_${r.id}`] || nocActionSubmitting || technicianNoteSubmitting || resolveSubmitting"
                          class="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                          </circle>
                          <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                          </path>
                        </svg>
                        {{ actionLoading[`${action.label.toLowerCase().replace(/\s+/g, '')}_${r.id}`] ||
                          nocActionSubmitting || technicianNoteSubmitting || resolveSubmitting ? 'Loading...' :
                          action.label }}
                      </button>
                      <span v-if="getTicketActions(r).length === 0" class="text-gray-400 text-xs text-center py-1">
                        No actions available
                      </span>
                    </div>
                  </td>
                </tr>
                </template>
              </tbody>
            </table>
          </div>
          <div class="table-scroll-footer">
            <span class="scroll-hint">↔ Scroll horizontally to see more columns | ↕ Scroll vertically for more
              rows</span>
          </div>
        </div>
      </div>

      <!-- Modal Detail Lokasi -->
      <div v-if="showLocationModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" @click="showLocationModal = false"></div>
        <div class="relative w-full max-w-md mx-4 rounded-xl shadow-xl bg-white p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Detail Lokasi</h2>
            <button class="text-gray-400 hover:text-gray-600" @click="showLocationModal = false">✕</button>
          </div>
          <div class="space-y-2 text-gray-900">
            <div class="text-sm"><span class="font-medium">Customer:</span> {{ selectedLocation?.customer_name || '-' }}
            </div>
            <div class="text-sm"><span class="font-medium">Customer ID:</span> {{ selectedLocation?.customer_id || '-'
            }}</div>
            <div class="text-sm"><span class="font-medium">Address:</span> {{ selectedLocation?.customer_address || '-'
            }}</div>
            <div class="text-sm"><span class="font-medium">Phone:</span> {{ selectedLocation?.customer_phone || '-' }}
            </div>
            <div class="text-sm"><span class="font-medium">Latitude:</span> {{ selectedLocation?.lat ?? '-' }}</div>
            <div class="text-sm"><span class="font-medium">Longitude:</span> {{ selectedLocation?.lng ?? '-' }}</div>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <a v-if="googleMapsUrl" :href="googleMapsUrl" target="_blank" rel="noopener"
              class="px-4 py-2 rounded bg-sky-600 text-white hover:bg-sky-700">Buka di Google Maps</a>
            <button class="px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400"
              @click="showLocationModal = false">Tutup</button>
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
              <label class="block text-sm text-slate-300 mb-1">Area</label>
              <select v-model="selectedAreaId"
                class="w-full rounded px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none">
                <option value="">All Areas</option>
                <option v-for="area in areas" :key="area.id" :value="area.id">
                  {{ area.name_city }} - {{ area.name_subdistrict }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm text-slate-300 mb-1">Customer</label>
              <select v-model="form.customer_id"
                class="w-full rounded px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none">
                <option v-for="c in filteredCustomers" :key="c.id" :value="c.id">
                  {{ c.name }}
                </option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm text-slate-300 mb-1">Title</label>
              <input v-model="form.title"
                class="w-full rounded px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none"
                placeholder="Enter trouble description..." />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm text-slate-300 mb-1">Description</label>
              <textarea v-model="form.description"
                class="w-full rounded px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none"></textarea>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm text-slate-300 mb-1">Classification</label>
              <select v-model="form.classification"
                class="w-full rounded px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none">
                <option value="gangguan">Gangguan (Trouble)</option>
                <option value="info">Info (Information)</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm text-slate-300 mb-1">Upload Image (CS)</label>
              <input type="file" @change="handleImageUpload" accept="image/*"
                class="w-full rounded px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none" />
              <div v-if="form.img_cs" class="mt-2">
                <img :src="`${useApiHost()}/uploads/cs-images/${form.img_cs}`" alt="Preview"
                  class="w-32 h-32 object-cover rounded border" />
              </div>
            </div>
          </div>
          <div v-else class="text-slate-300">Loading options...</div>
          <div class="mt-4 flex justify-end gap-2">
            <button class="px-4 py-2 rounded bg-gray-600 text-white" @click="showAdd = false"
              :disabled="createTicketSubmitting">Cancel</button>
            <button class="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50" @click="createTicket"
              :disabled="createTicketSubmitting">
              {{ createTicketSubmitting ? 'Creating...' : 'Submit' }}
            </button>
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
              <div class="flex gap-2" v-if="!showNewType">
                <select v-model="nocSelectedType"
                  class="w-full rounded px-3 py-2 border border-gray-300 focus:outline.none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900">
                  <option value="" class="text-gray-500">-- Select trouble type (optional) --</option>
                  <option v-for="t in troubleTypes" :key="t.id" :value="t.id" class="text-gray-900 bg-white">{{ t.name
                    || t.id }}</option>
                </select>
                <button type="button" class="px-3 py-2 rounded bg-blue-600 text-white text-sm"
                  @click="showNewType = true">Add New Type</button>
              </div>
              <div v-else class="space-y-2">
                <input v-model="newTypeName" placeholder="Display Name (optional)"
                  class="w-full rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900" />
                <div class="flex gap-2">
                  <button type="button" class="px-3 py-2 bg-emerald-600 text-white rounded text-sm"
                    @click="saveNewType">Save Type</button>
                  <button type="button" class="px-3 py-2 bg-gray-300 text-gray-700 rounded text-sm"
                    @click="showNewType = false">Cancel</button>
                </div>
              </div>
            </div>
            <div v-if="isAdmin || isCustomerService">
              <label class="block text-sm font-medium text-gray-700 mb-1">Accumulation (Customers Affected)</label>
              <div class="flex items-center space-x-2">
                <input 
                  v-model.number="nocAccumulation" 
                  type="number" 
                  min="1" 
                  placeholder="Enter number of customers affected"
                  class="flex-1 rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
                <button 
                  @click="updateAccumulationFromModal"
                  class="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  :disabled="nocAccumulation === null || nocAccumulation === undefined || nocAccumulation < 1"
                >
                  Update
                </button>
              </div>
              <p class="text-xs text-gray-500 mt-1">
                Current: {{ selectedTicket?.accumulation || 1 }} customers affected
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Upload Image (Optional)</label>
              <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div class="space-y-1 text-center">
                  <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <div class="flex text-sm text-gray-600">
                    <label for="noc-image-upload"
                      class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline.none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <span>Upload a file</span>
                      <input id="noc-image-upload" name="noc-image-upload" type="file" class="sr-only" accept="image/*"
                        @change="handleNOCImageUpload" />
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
            <button class="px-4 py-2 rounded bg-gray-300 text-gray-700" @click="showNOCNoteModal = false"
              :disabled="nocActionSubmitting">Cancel</button>
            <button class="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50" @click="sendToNOCFromModal"
              v-if="isAdmin || isCustomerService" :disabled="nocActionSubmitting">
              {{ nocActionSubmitting ? 'Sending...' : 'To NOC' }}
            </button>
            <button class="px-4 py-2 rounded bg-purple-600 text-white disabled:opacity-50" @click="sendToCSFromModal"
              v-if="isAdmin || isCustomerService" :disabled="nocActionSubmitting">
              {{ nocActionSubmitting ? 'Sending...' : 'To CS' }}
            </button>
            <button class="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50" @click="nocSolvedFromModal"
              v-if="isAdmin || isCustomerService" :disabled="nocActionSubmitting">
              {{ nocActionSubmitting ? 'Processing...' : 'NOC Solved' }}
            </button>
            <button class="px-4 py-2 rounded bg-amber-600 text-white disabled:opacity-50" @click="nocPhysicalFromModal"
              v-if="isAdmin || isCustomerService" :disabled="nocActionSubmitting">
              {{ nocActionSubmitting ? 'Processing...' : 'Physical' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Technician Note -->
      <div v-if="showTechnicianNoteModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" @click="showTechnicianNoteModal = false"></div>
        <div class="relative w-full max-w-lg mx-4 rounded-xl shadow-xl bg-white p-0 max-h-[90vh] overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b">
            <h2 class="text-xl font-semibold text-gray-900">Add Technician Note & Images</h2>
            <button class="text-gray-400 hover:text-gray-600" @click="showTechnicianNoteModal = false">✕</button>
          </div>
          <div class="space-y-4 px-6 py-4 overflow-y-auto" style="max-height: calc(90vh - 120px)">
            <div class="p-3 rounded bg-gray-50 border">
              <div class="text-sm text-gray-700"><span class="font-medium">Customer:</span> {{
                selectedTicket?.customer_name || '-' }}</div>
              <div class="text-xs text-gray-600 mt-1">
                <span class="font-medium">GPS:</span>
                <span>
                  {{ (selectedTicket?.gps_lat ?? '-') }} , {{ (selectedTicket?.gps_lng ?? '-') }}
                </span>
              </div>
              <div class="mt-2">
                <button class="px-3 py-1.5 rounded bg-sky-600 text-white text-xs hover:bg-sky-700 disabled:opacity-50"
                  :disabled="!(selectedTicket?.gps_lat && selectedTicket?.gps_lng)"
                  @click="openLocationDetail(selectedTicket)">Detail Lokasi</button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Technician Note <span
                  class="text-red-500">*</span></label>
              <textarea v-model="technicianNote" placeholder="Enter your technician note..."
                class="w-full rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none text-gray-900 bg-white"></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Before Image (Optional)</label>
              <input type="file" @change="handleBeforeImageChange" accept="image/*"
                class="w-full rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p class="text-xs text-gray-500 mt-1">Max size: 10MB. Supported: JPG, PNG, GIF</p>
              <!-- Preview Before Image -->
              <div v-if="imgTechBfFile" class="mt-2 p-2 border border-gray-200 rounded bg-gray-50">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">{{ imgTechBfFile.name }}</span>
                  <button @click="imgTechBfFile = null" class="text-red-500 hover:text-red-700 text-sm">✕</button>
                </div>
                <div class="mt-2">
                  <img v-if="beforeImageUrl" :src="beforeImageUrl" alt="Before Preview"
                    class="w-20 h-20 object-cover rounded border" />
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">After Image (Optional)</label>
              <input type="file" @change="handleAfterImageChange" accept="image/*"
                class="w-full rounded px-3 py-2 border border-gray-300 focus:outline.none focus:ring-2 focus:ring-blue-500" />
              <p class="text-xs text-gray-500 mt-1">Max size: 10MB. Supported: JPG, PNG, GIF</p>
              <!-- Preview After Image -->
              <div v-if="imgTechAfFile" class="mt-2 p-2 border border-gray-200 rounded bg-gray-50">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">{{ imgTechAfFile.name }}</span>
                  <button @click="imgTechAfFile = null" class="text-red-500 hover:text-red-700 text-sm">✕</button>
                </div>
                <div class="mt-2">
                  <img v-if="afterImageUrl" :src="afterImageUrl" alt="After Preview"
                    class="w-20 h-20 object-cover rounded border" />
                </div>
              </div>
            </div>
          </div>
          <div class="px-6 py-4 border-t flex justify-end gap-2">
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
            <button class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              @click="deleteTicket(ticketToDelete?.id)" :disabled="deleteTicketSubmitting">
              {{ deleteTicketSubmitting ? 'Deleting...' : 'Delete Ticket' }}
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
              <p class="text-xs text-gray-500 mt-1">This note will be saved as customer_note and the ticket status will
                be set to finished.</p>
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

      <!-- Modal Accept Ticket -->
      <div v-if="showAcceptConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" @click="showAcceptConfirm = false"></div>
        <div class="relative w-full max-w-md mx-4 rounded-xl shadow-xl bg-white p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Accept Ticket</h2>
            <button class="text-gray-400 hover:text-gray-600" @click="showAcceptConfirm = false">✕</button>
          </div>
          <p class="text-gray-700 mb-4">This will assign the ticket to you.</p>
          <div class="flex justify-end gap-2">
            <button class="px-4 py-2 rounded bg-gray-300 text-gray-700"
              @click="showAcceptConfirm = false">Cancel</button>
            <button class="px-4 py-2 rounded bg-blue-700 text-white" @click="acceptTicket">Accept</button>
          </div>
        </div>
      </div>

      <!-- Modal Set Team -->
      <div v-if="showTeamModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" @click="showTeamModal = false"></div>
        <div class="relative w-full max-w-lg mx-4 rounded-xl shadow-xl bg-white p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Set Technician Team</h2>
            <button class="text-gray-400 hover:text-gray-600" @click="showTeamModal = false">✕</button>
          </div>
          <div class="space-y-3">
            <div v-for="(m, idx) in teamMembers" :key="idx" class="flex items-center gap-2">
              <select v-model="m.role" class="border rounded px-2 py-1 text-gray-900 bg-white">
                <option value="senior">Senior</option>
                <option value="junior">Junior</option>
                <option value="helper">Helper</option>
              </select>
              <input v-model="m.user_id" placeholder="Technician user_id"
                class="flex-1 border rounded px-2 py-1 text-gray-900 bg-white" />
              <button class="text-red-600 text-sm" @click="removeTeamMember(idx)">Remove</button>
            </div>
            <button class="px-3 py-1.5 rounded bg-gray-200 text-gray-800 text-sm" @click="addTeamMember">Add
              Member</button>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button class="px-4 py-2 rounded bg-gray-300 text-gray-700" @click="showTeamModal = false">Cancel</button>
            <button class="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50" @click="saveTeam"
              :disabled="teamSubmitting">{{ teamSubmitting ? 'Saving...' : 'Save Team' }}</button>
          </div>
        </div>
      </div>

      <!-- Modal Add Step -->
      <div v-if="showStepModal" class="fixed inset-0 z-50 flex items-center justify.center">
        <div class="absolute inset-0 bg-black/60" @click="showStepModal = false"></div>
        <div class="relative w-full max-w-lg mx-4 rounded-xl shadow-xl bg-white p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Add Troubleshooting Step</h2>
            <button class="text-gray-400 hover:text-gray-600" @click="showStepModal = false">✕</button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea v-model="stepDescription" rows="3"
                class="w-full border rounded px-3 py-2 text-gray-900 bg-white"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Images (multiple)</label>
              <input type="file" multiple accept="image/*" @change="onSelectStepImages"
                class="w-full border rounded px-3 py-2 text-gray-900 bg-white" />
              <div v-if="stepImages.length" class="mt-2 text-xs text-gray-600">{{ stepImages.length }} file(s) selected
              </div>
            </div>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button class="px-4 py-2 rounded bg-gray-300 text-gray-700" @click="showStepModal = false">Cancel</button>
            <button class="px-4 py-2 rounded bg-amber-600 text-white disabled:opacity-50" @click="saveStep"
              :disabled="stepSubmitting || !stepDescription.trim()">{{ stepSubmitting ? 'Saving...' : 'Save Step'
              }}</button>
          </div>
        </div>
      </div>

      <!-- Image Modal -->
      <div v-if="showImageModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/80" @click="showImageModal = false"></div>
        <div class="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
          <div class="flex items-center justify-between p-4 border-b">
            <h3 class="text-lg font-semibold">Image Preview</h3>
            <button class="text-gray-400 hover.text-gray-600" @click="showImageModal = false">✕</button>
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
    <!-- Technician Checklist Modal -->
    <div v-if="showTechnicianChecklist"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold">Technician Checklist</h3>
            <button @click="showTechnicianChecklist = false" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <TechnicianChecklist v-if="selectedTicketForChecklist" :ticket-id="selectedTicketForChecklist"
            :technician-id="selectedTechnicianForChecklist"
            :read-only="selectedChecklistReadOnly || !(isTechnician)"
            @job-completed="() => { showTechnicianChecklist = false; refresh() }" />
        </div>
      </div>
    </div>
  </div>
</template>