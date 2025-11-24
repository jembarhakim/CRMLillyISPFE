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
label: 'Jumlah Tiket',
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
import { useApiHost } from '@/composables/useApiHost'
import TechnicianChecklist from '@/components/TechnicianChecklist.vue'
import CustomerDetailModal from '@/pages/dashboard/customer/CustomerDetailModal.vue'
import { useCustomToast } from '@/composables/useCustomToast'

const authStore = useAuthStore()
const { userRole, isAdmin, isCustomerService, isNOC, isTechnician } = useRolePermissions()
const notification = useNotification()

// Set page title
useHead({
  title: 'Tiket Gangguan - CRM System'
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

// New classification system state
// Empty string means "All" classifications
const selectedClassification = ref<string>('') // Default to "All" classifications
const dateFilter = ref<string>('1day') // '1day', '7days', '30days', 'all'
const showHistory = ref(false)

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

// Customer detail modal state
const showCustomerDetailModal = ref(false)
const selectedCustomerId = ref<string | null>(null)

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

function openCustomerDetailModal(customerId: string) {
  selectedCustomerId.value = customerId
  showCustomerDetailModal.value = true
}

function closeCustomerDetailModal() {
  showCustomerDetailModal.value = false
  selectedCustomerId.value = null
}

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
    useCustomToast().add({ title: 'Diterima', description: 'Tiket diterima.', color: 'primary', timeout: 2500 })
    await refresh()
  } catch (e: any) {
    useCustomToast().add({ title: 'Gagal', description: String(e?.data?.message || e?.message || 'Gagal menerima'), color: 'red' })
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
    useCustomToast().add({ title: 'Tim tersimpan', description: 'Tim teknisi diperbarui.', color: 'primary', timeout: 2500 })
  } catch (e: any) {
    useCustomToast().add({ title: 'Gagal', description: String(e?.data?.message || e?.message || 'Gagal menyimpan tim'), color: 'red' })
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
    useCustomToast().add({ title: 'Langkah ditambahkan', description: 'Langkah troubleshooting disimpan.', color: 'primary', timeout: 2500 })
    await refresh()
  } catch (e: any) {
    useCustomToast().add({ title: 'Gagal', description: String(e?.data?.message || e?.message || 'Gagal menambahkan langkah'), color: 'red' })
  } finally { stepSubmitting.value = false }
}

async function verifyClose(id?: number) {
  const tid = id || selectedId.value
  if (!tid) return
  try {
    await ticketsApi().verifyClose(tid)
    useCustomToast().add({ title: 'Ditutup', description: 'Tiket diverifikasi & ditutup oleh CS.', color: 'primary', timeout: 2500 })
    await refresh()
  } catch (e: any) {
    useCustomToast().add({ title: 'Gagal', description: String(e?.data?.message || e?.message || 'Gagal memverifikasi & menutup'), color: 'red' })
  }
}

// New function for technician to mark work as completed
async function markTechnicianCompleted(id?: number) {
  const tid = id || selectedId.value
  if (!tid) return
  try {
    // This will be implemented in the backend
    await ticketsApi().markTechnicianJobCompleted(tid)
    useCustomToast().add({ title: 'Pekerjaan Selesai', description: 'Pekerjaan teknisi telah ditandai sebagai selesai.', color: 'green', timeout: 3000 })
    await refresh()
  } catch (e: any) {
    useCustomToast().add({ title: 'Gagal', description: String(e?.data?.message || e?.message || 'Gagal menandai pekerjaan sebagai selesai'), color: 'red' })
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
    useCustomToast().add({ title: 'Arsitektur Diatur', description: 'Arsitektur jaringan berhasil dipilih.', color: 'primary', timeout: 2500 })
    await refresh()
  } catch (e: any) {
    useCustomToast().add({ title: 'Gagal', description: String(e?.data?.message || e?.message || 'Gagal mengatur arsitektur'), color: 'red' })
  } finally {
    networkArchSubmitting.value = false
  }
}

// Helper function to filter tickets by date
const getDateFilteredTickets = (tickets: any[]) => {
  // Only bypass date filtering when "All Time" is selected
  // Even in history mode, 7 days and 30 days filters should still apply
  if (dateFilter.value === 'all') {
    return tickets
  }

  const now = new Date()
  const filterDate = new Date()

  switch (dateFilter.value) {
    case '1day':
      filterDate.setDate(now.getDate() - 1)
      break
    case '7days':
      filterDate.setDate(now.getDate() - 7)
      break
    case '30days':
      filterDate.setDate(now.getDate() - 30)
      break
  }

  // Set time to start of day (00:00:00) to include all tickets from the filterDate day
  filterDate.setHours(0, 0, 0, 0)

  return tickets.filter(ticket => {
    if (!ticket || !ticket.created_at) return false
    const ticketDate = new Date(ticket.created_at)
    // Set ticket date to start of day for comparison
    ticketDate.setHours(0, 0, 0, 0)
    return ticketDate >= filterDate
  })
}

// Get count of unfinished and ongoing tickets for each classification
// IMPORTANT: Count from filteredRows to match what's actually shown in the table
const getClassificationCounts = computed(() => {
  // Use filteredRows instead of rows.value - this ensures cards match table display
  // filteredRows already includes: classification filter, date filter, status filter, and search filter
  const ticketsToCount = filteredRows.value
  
  const counts: Record<string, { unfinished: number; ongoing: number }> = {
    gangguan: { unfinished: 0, ongoing: 0 },
    psb: { unfinished: 0, ongoing: 0 },
    dismantle: { unfinished: 0, ongoing: 0 },
    lainnya: { unfinished: 0, ongoing: 0 }
  }

  // Count tickets that are actually displayed in the table
  ticketsToCount.forEach(ticket => {
    if (!ticket) return
    
    const classification = ticket.classification_id || ticket.classification || 'gangguan'
    
    // Count based on status - no additional filtering needed since filteredRows already has all filters applied
    if (ticket.status === 'unfinished' && counts.hasOwnProperty(classification)) {
      counts[classification].unfinished++
    } else if (ticket.status === 'ongoing' && counts.hasOwnProperty(classification)) {
      counts[classification].ongoing++
    }
  })

  return counts
})

// Filtered tickets based on classification, date filter, and search query
const filteredRows = computed(() => {
  // Ensure rows.value is always an array
  const safeRows = Array.isArray(rows.value) ? rows.value : []

  let filtered = safeRows

  // Filter by classification (empty string means "All")
  if (selectedClassification.value && selectedClassification.value !== '') {
    filtered = filtered.filter(ticket => {
      if (!ticket) return false
      return ticket.classification_id === selectedClassification.value ||
        ticket.classification === selectedClassification.value
    })
  }

  // Apply date filter
  filtered = getDateFilteredTickets(filtered)

  // Filter by status: Only show unfinished/ongoing tickets when not in history mode
  // Note: Backend already filters tickets for technicians (assigned_to IS NULL OR assigned_to = technician_id)
  // Customer_service and admin need to see all tickets (including finished) to monitor technician progress
  if (!showHistory.value) {
    filtered = filtered.filter(ticket => {
      if (!ticket) return false
      
      // Customer_service and admin can see all tickets (including finished) to monitor progress
      if (isAdmin.value || isCustomerService.value) {
        return true // Show all tickets for admin and customer_service
      }
      
      // For other roles, only show unfinished or ongoing tickets in current view
      // Backend already handles technician filtering, so we just filter by status
      return ticket.status === 'unfinished' || ticket.status === 'ongoing'
    })
  }
  // When showHistory is true, show all tickets (no status filtering)

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(ticket => {
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
  }

  return filtered
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
      alert('Pilih file gambar');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file harus kurang dari 10MB');
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
    return { isValid: false, message: 'Ukuran file melebihi batas 10MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, message: 'Tipe file tidak didukung. Gunakan JPG, PNG, atau GIF' };
  }

  return { isValid: true, message: 'File valid' };
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
      const toast = useCustomToast();
      const msg = e?.data?.message || e?.message || 'Gagal mengirim ke NOC'
      toast.add({ title: 'Aksi gagal', description: String(msg), color: 'red', icon: 'alert-triangle', timeout: 5000 })
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
    notification.success('Dikirim ke NOC', 'Tiket dikirim ke NOC.', 3000)
    await refresh()
  } catch (e: any) {
    console.error('sendToNOC error:', e)
    const msg = e?.data?.message || e?.message || 'Gagal mengirim ke NOC'
    notification.error('Aksi gagal', String(msg), 5000)
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
    const msg = e?.data?.message || e?.message || 'Gagal menandai sebagai diselesaikan NOC'
    notification.error('Aksi gagal', String(msg), 5000)
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
    const msg = e?.data?.message || e?.message || 'Gagal menandai sebagai fisik'
    notification.error('Aksi gagal', String(msg), 5000)
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
    notification.success('Ditugaskan ke Teknisi', 'Tiket ditugaskan ke peran teknisi.', 3000)
    await refresh()
  } catch (e: any) {
    console.error('assignTechnician error:', e)
    const msg = e?.data?.message || e?.message || 'Gagal menugaskan teknisi'
    notification.error('Aksi gagal', String(msg), 5000)
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
    const msg = e?.data?.message || e?.message || 'Gagal menandai sebagai diselesaikan NOC'
    notification.error('Aksi gagal', String(msg), 5000)
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
    const msg = e?.data?.message || e?.message || 'Gagal menandai sebagai fisik'
    notification.error('Aksi gagal', String(msg), 5000)
  } finally {
    nocActionSubmitting.value = false
  }
}

// Update accumulation from NOC modal
async function updateAccumulationFromModal() {
  if (!selectedTicket.value || nocAccumulation.value === null || nocAccumulation.value === undefined || nocAccumulation.value < 1) {
    notification.error('Input Tidak Valid', 'Masukkan angka akumulasi yang valid (1 atau lebih)', 3000)
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

    notification.success('Berhasil', `Akumulasi diperbarui menjadi ${nocAccumulation.value} pelanggan`, 3000)
  } catch (error: any) {
    console.error('updateAccumulationFromModal error:', error)
    notification.error('Pembaruan gagal', `Gagal memperbarui akumulasi: ${error?.data?.message || error?.message || 'Error tidak diketahui'}`, 3000)
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
    notification.success('Catatan Teknisi Ditambahkan', 'Catatan berhasil ditambahkan.', 3000)
    await refresh()
  } catch (e: any) {
    console.error('sendTechnicianNote error:', e)
    const msg = e?.data?.message || e?.message || 'Gagal menambahkan catatan teknisi'
    notification.error('Aksi gagal', String(msg), 5000)
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
    notification.success('Dikirim ke CS', 'Tiket dikembalikan ke Customer Service.', 3000)
    await refresh()
  } catch (e: any) {
    console.error('sendToCS error:', e)
    const msg = e?.data?.message || e?.message || 'Gagal mengirim ke CS'
    notification.error('Aksi gagal', String(msg), 5000)
  } finally {
    nocActionSubmitting.value = false
  }
}

// New function: Send to CS and automatically assign technician
async function sendToCSWithAutoAssign() {
  if (!selectedId.value) return;
  try {
    nocActionSubmitting.value = true

    // First, send to CS
    await ticketsApi().sendToCS(selectedId.value, nocNote.value, nocSelectedType.value || undefined, nocImageFile.value || undefined)

    // Then automatically assign technician (since it's always a technician problem when pressing "To CS")
    try {
      await ticketsApi().assignTechnician(selectedId.value)
      notification.success('Dikirim ke CS & Ditugaskan ke Teknisi', 'Tiket dikirim ke CS dan otomatis ditugaskan ke teknisi.', 3000)
    } catch (assignError: any) {
      console.warn('Auto-assign technician failed:', assignError)
      notification.success('Dikirim ke CS', 'Tiket dikirim ke CS. Catatan: Penugasan otomatis teknisi gagal.', 3000)
    }

    showNOCNoteModal.value = false
    await refresh()
  } catch (e: any) {
    console.error('sendToCSWithAutoAssign error:', e)
    const msg = e?.data?.message || e?.message || 'Gagal mengirim ke CS'
    notification.error('Aksi gagal', String(msg), 5000)
  } finally {
    nocActionSubmitting.value = false
  }
}

// Classification management functions
// Toggle behavior: clicking the same classification shows "All"
function selectClassification(classification: string) {
  // If clicking the same classification, toggle to "All" (empty string)
  if (selectedClassification.value === classification) {
    selectedClassification.value = ''
  } else {
    selectedClassification.value = classification
  }
  showHistory.value = false
  // Don't reset dateFilter - keep the user's selected date filter
}

function resetFilters() {
  selectedClassification.value = '' // Reset to "All" classifications
  dateFilter.value = '1day' // Keep 1 day filter
  showHistory.value = false
  searchQuery.value = ''
}

function toggleHistory() {
  // History button is a shortcut: toggle dateFilter between 'all' and '1day'
  // The watcher will automatically sync showHistory based on dateFilter
  if (showHistory.value) {
    // Currently in history mode - switch to current mode (1 day)
    dateFilter.value = '1day'
  } else {
    // Currently in current mode - switch to history mode (all time)
    dateFilter.value = 'all'
  }
  // Refetch tickets when switching - will be triggered by dateFilter watcher
}

// Get classification display name
function getClassificationName(classificationId: string): string {
  if (!classificationId || classificationId === '') {
    return 'Semua'
  }
  const names: Record<string, string> = {
    'gangguan': 'Gangguan',
    'psb': 'PSB',
    'lainnya': 'Lainnya',
    'dismantle': 'Dismantle'
  }
  return names[classificationId] || classificationId
}

// Format date for display
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    // Check if date is valid
    if (isNaN(date.getTime())) return '-'
    // Format as: DD/MM/YYYY HH:mm
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch (e) {
    return '-'
  }
}

// Check if NOC action should be shown for classification
function shouldShowNOCAction(classificationId: string): boolean {
  // Only show NOC action for "Gangguan" classification
  // Hide for: psb, lainnya, dismantle
  return classificationId === 'gangguan'
}

// Check if ticket should be shown in dashboard cards
function shouldShowInCards(classificationId: string): boolean {
  // Show in cards: gangguan, psb, dismantle, lainnya
  // All classifications show in cards now
  return true
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
    const msg = e?.data?.message || e?.message || 'Gagal menyelesaikan tiket'
    notification.error('Aksi gagal', String(msg), 5000)
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
    notification.success('Tiket Diselesaikan', 'Tiket telah ditandai sebagai selesai.', 3000)
    await refresh()
  } catch (e: any) {
    console.error('resolve error:', e)
    const msg = e?.data?.message || e?.message || 'Gagal menyelesaikan tiket'
    notification.error('Aksi gagal', String(msg), 5000)
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
      // Allow technician to view their completed checklist for finished tickets
      if (isTechnician.value && ticket.assigned_to) {
        let actualUserID = null
        if (process.client && authStore.token) {
          try {
            const tokenParts = authStore.token.split('.')
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]))
              actualUserID = payload.sub || payload.user_id || payload.id
            }
          } catch (e) {
            // ignore
          }
        }
        
        if (ticket.assigned_to === actualUserID || ticket.assigned_to === authStore.user?.user_id) {
          actions.push({
            label: 'Lihat Checklist',
            color: 'bg-gray-600',
            action: () => openTechnicianChecklist(ticket.id, actualUserID || authStore.user?.user_id || '', true),
            show: true,
            tooltip: 'Lihat checklist yang telah diselesaikan (hanya baca)'
          })
        }
      }
      
      if ((isAdmin.value || isCustomerService.value) && ticket.assigned_to) {
        actions.push({
          label: 'Lihat Progress (Selesai)',
          color: 'bg-emerald-700',
          action: () => openTechnicianChecklist(ticket.id, ticket.assigned_to, true),
          show: true,
          tooltip: 'Lihat progress teknisi (tiket selesai)'
        })
      }
    }
    return actions
  }

  // Stage 1: CS creates ticket OR ticket is ongoing but no NOC action yet → Show NOC Action only
  // Enforce: NOC must act BEFORE assigning a technician
  const nocActionRecorded = !!(ticket.noc_note || ticket.img_noc)
  const isCSLikeAssignee = (ticket.current_assignee_name === 'CUSTOMER SERVICE' || ticket.current_assignee_name === 'CUSTOMER_SERVICE')
  const classificationId = ticket.classification_id || ticket.classification || 'gangguan'

  if ((ticket.status === 'unfinished' || (ticket.status === 'ongoing' && isCSLikeAssignee && !nocActionRecorded)) &&
    isCSLikeAssignee) {

    if (isAdmin.value || isCustomerService.value) {
      // Only show NOC action if classification allows it
      if (shouldShowNOCAction(classificationId)) {
        actions.push({
          label: 'Aksi Tiket',
          color: 'bg-blue-600',
          action: () => { actPrepareNOC(ticket.id) },
          show: true,
          tooltip: 'Ambil tindakan pada tiket (Ke CS atau Diselesaikan NOC)'
        })
      }
    }
  }

  // Stage 2: After NOC action (noc_note/img_noc present) → Show Assign Technician
  else if (ticket.status === 'ongoing' && isCSLikeAssignee && nocActionRecorded) {

    if (isAdmin.value || isCustomerService.value) {
      actions.push({
        label: 'Tugaskan Teknisi',
        color: 'bg-cyan-600',
        action: () => { actPrepare(ticket.id); assignTechnician() },
        show: true,
        tooltip: 'Tugaskan tiket ke teknisi'
      })
    }
  }

  // Stage 3: Technician workflow
  else if (ticket.current_assignee_name === 'TECHNICIAN') {

    // Technician can accept ticket (if not already assigned to someone)
    if (isTechnician.value && (!ticket.assigned_to || ticket.assigned_to === '' || ticket.assigned_to === null)) {
      actions.push({
        label: 'Terima',
        color: 'bg-blue-700',
        action: () => { openAccept(ticket.id) },
        show: true,
        tooltip: 'Terima dan kunci tiket ini untuk Anda'
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
        // If ticket is completed, show "View Checklist" button (read-only)
        if (ticket.technician_completed) {
          actions.push({
            label: 'Lihat Checklist',
            color: 'bg-gray-600',
            action: () => openTechnicianChecklist(ticket.id, actualUserID || authStore.user?.user_id || '', true),
            show: true,
            tooltip: 'Lihat checklist yang telah diselesaikan (hanya baca)'
          })
        } else {
          // If ticket is not completed, show editable "Checklist Teknisi" button
          actions.push({
            label: 'Checklist Teknisi',
            color: 'bg-blue-600',
            action: () => openTechnicianChecklist(ticket.id, actualUserID || authStore.user?.user_id || '', false),
            show: true,
            tooltip: 'Buka checklist teknisi'
          })
        }
      }
    }
    if ((isAdmin.value || isCustomerService.value) && ticket.assigned_to) {
      actions.push({
        label: 'Lihat Progress (Berlangsung)',
        color: 'bg-gray-700',
        action: () => openTechnicianChecklist(ticket.id, ticket.assigned_to, true),
        show: true,
        tooltip: 'Lihat progress teknisi (tiket berlangsung)'
      })
    }

    // Always show customer details for technicians
    if (isTechnician.value) {
      actions.push({
        label: 'Detail Pelanggan',
        color: 'bg-sky-600',
        action: () => { openLocationDetail(ticket) },
        show: true,
        tooltip: 'Lihat detail pelanggan dan koordinat lokasi'
      })
    }
  }

  // Stage 4: After technician completes work → Show Resolve for CS
  else if (ticket.status === 'ongoing' &&
    (ticket.current_assignee_name === 'CUSTOMER SERVICE' || ticket.current_assignee_name === 'CUSTOMER_SERVICE') &&
    ticket.technician_completed) {

    // Allow technician to view their completed checklist even when ticket is with CS
    if (isTechnician.value && ticket.assigned_to) {
      let actualUserID = null
      if (process.client && authStore.token) {
        try {
          const tokenParts = authStore.token.split('.')
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]))
            actualUserID = payload.sub || payload.user_id || payload.id
          }
        } catch (e) {
          // ignore
        }
      }
      
      if (ticket.assigned_to === actualUserID || ticket.assigned_to === authStore.user?.user_id) {
        actions.push({
          label: 'Lihat Checklist',
          color: 'bg-gray-600',
          action: () => openTechnicianChecklist(ticket.id, actualUserID || authStore.user?.user_id || '', true),
          show: true,
          tooltip: 'Lihat checklist yang telah diselesaikan (hanya baca)'
        })
      }
    }

    if (isAdmin.value || isCustomerService.value) {
      actions.push({
        label: 'Selesaikan Tiket',
        color: 'bg-emerald-600',
        action: () => { actPrepareResolve(ticket.id) },
        show: true,
        tooltip: 'Selesaikan tiket (langkah akhir)'
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
      label: 'Hapus',
      icon: 'trash-2-20-solid',
      click: () => showDeleteConfirmation(row)
    }])
  }

  return actions
}

// Helper function to get icon for action
function getActionIcon(actionLabel: string): string {
  switch (actionLabel) {
    case 'To NOC': return 'arrow-right-20-solid'
    case 'To CS': return 'arrow-left-20-solid'
    case 'Assign Tech': return 'user-plus-20-solid'
    case 'Add Tech Note': return 'file-text-20-solid'
    case 'Resolve': return 'check-circle-20-solid'
    default: return 'settings-6-tooth-20-solid'
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
    notification.success('Berhasil!', 'Tiket berhasil dihapus', 3000)
    showDeleteModal.value = false
    ticketToDelete.value = null
    await refresh()
  } catch (error: any) {
    console.error('Error deleting ticket:', error)
    const msg = error?.data?.message || error?.message || 'Gagal menghapus tiket'
    notification.error('Penghapusan gagal', String(msg), 5000)
  } finally {
    deleteTicketSubmitting.value = false
  }
}

const showAdd = ref(false)
const form = ref({ customer_id: '', title: '', description: '', img_cs: '', classification: 'gangguan' })

function openAddModal() {
  showAdd.value = true
}

function closeAddModal() {
  showAdd.value = false
  form.value = { customer_id: customers.value[0]?.id || '', title: '', description: '', img_cs: '', classification: 'gangguan' }
  selectedCSFile = undefined
  csImagePreview.value = ''
}

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

// Computed properties for select options
const areaOptions = computed(() => [
  { label: 'Semua Area', value: '' },
  ...areas.value.map(area => ({
    label: `${area.name_city} - ${area.name_subdistrict}`,
    value: area.id
  }))
])

const customerOptions = computed(() => 
  filteredCustomers.value.map(customer => ({
    label: customer.name,
    value: customer.id
  }))
)

const classificationOptions = computed(() => [
  { label: 'Gangguan', value: 'gangguan' },
  { label: 'PSB (Pasang Baru)', value: 'psb' },
  { label: 'Dismantle', value: 'dismantle' },
  { label: 'Lainnya', value: 'lainnya' }
])

// Helper functions for image URLs
const getCSImageUrl = (ticketId: number, filename: string | null | undefined) => {
  if (!filename) return ''
  const apiHost = useApiHost()
  // The filename is already the complete filename (e.g., "ticket_cs_1756262705972.png")
  return `${apiHost}/uploads/cs-images/${filename}`
}

const getNOCImageUrl = (ticketId: number, filename: string | null | undefined) => {
  if (!filename) return ''
  const apiHost = useApiHost()
  // The filename is already the complete filename (e.g., "ticket_noc_1756262705972.png")
  return `${apiHost}/uploads/noc-images/${filename}`
}


// Helper function to handle image error
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  if (target) {
    target.style.display = 'none'
  }
}

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
    notification.success('Berhasil!', 'Jenis gangguan baru berhasil dibuat', 3000)
  } catch (error: any) {
    console.error('Error creating trouble type:', error)
    const msg = error?.data?.message || error?.message || 'Gagal membuat jenis gangguan'
    notification.error('Pembuatan gagal', String(msg), 5000)
  }
}

let selectedCSFile: File | undefined
let csImagePreview = ref('')

async function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target?.files?.[0]
  
  if (!file) {
    console.log('No file selected')
    return
  }
  
  if (file) {
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      notification.error('File terlalu besar', 'Gambar harus kurang dari 10MB', 3000)
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      notification.error('Tipe file tidak valid', 'Pilih file gambar', 3000)
      return
    }

    try {
      selectedCSFile = file

      // Create image preview immediately
      const reader = new FileReader()
      reader.onload = (e) => {
        csImagePreview.value = e.target?.result as string
      }
      reader.readAsDataURL(file)

      // Upload file using existing API
      const uploadData = {
        name: `ticket_cs_${Date.now()}`,
        path: 'cs-images',
        file: file
      }

      const response = await uploadFileAdminApi().createUploadFile(uploadData)
      if (response.data && response.data.filename) {
        // Store only the filename (should be under 60 characters)
        const fileName = response.data.filename
        if (fileName.length > 60) {
          throw new Error('Generated filename is too long')
        }
        form.value.img_cs = fileName
        notification.success('Gambar diunggah', 'Gambar berhasil diunggah', 2000)
      } else {
        throw new Error('Invalid response from upload API')
      }
    } catch (error: any) {
      console.error('Error uploading image:', error)
      notification.error('Unggah gagal', `Gagal mengunggah gambar: ${error?.message || 'Error tidak diketahui'}`, 5000)

      // Clear the form field and file input
      form.value.img_cs = ''
      selectedCSFile = undefined
      csImagePreview.value = ''
      if (target) {
        target.value = ''
      }
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

    // Only include img_cs if there's actually an image filename (not base64)
    const ticketData: any = {
      customer_id: String(form.value.customer_id),
      title: form.value.title,
      description: form.value.description,
      type: classifiedType,
      classification_id: form.value.classification,
    }

    // Only add img_cs if there's a valid image filename (not base64 data)
    if (form.value.img_cs && form.value.img_cs.trim() !== '' && !form.value.img_cs.startsWith('data:')) {
      // Ensure filename is not too long for database
      if (form.value.img_cs.length <= 60) {
        ticketData.img_cs = form.value.img_cs
      } else {
        console.warn('Image filename too long, skipping:', form.value.img_cs.length)
      }
    }

    const created: any = await ticketsApi().create(ticketData)

    // Immediately send to NOC with description as note and attached image file
    try {
      const newId = created?.data?.id || created?.id
      if (newId && selectedCSFile) {
        await ticketsApi().sendToNOC(Number(newId), form.value.description || form.value.title || '', selectedCSFile)
      }
    } catch (e) {
      console.warn('sendToNOC after create failed:', e)
    }
    showAdd.value = false
    form.value = { customer_id: customers.value[0]?.id || '', title: '', description: '', img_cs: '', classification: 'gangguan' }
    selectedCSFile = undefined // Clear the selected file
    csImagePreview.value = '' // Clear the image preview
    notification.success('Berhasil!', 'Tiket berhasil dibuat', 3000)
    await refresh()
  } catch (error: any) {
    console.error('Error creating ticket:', error) // Debug log
    const msg = error?.data?.message || error?.message || 'Gagal membuat tiket'
    notification.error('Pembuatan gagal', String(msg), 5000)
  } finally {
    createTicketSubmitting.value = false
  }
}


// Fetchers similar to transaction page
async function fetchAllTickets(params: any) {
  // params is kept for parity; current API does not filter server-side
  isLoading.value = true
  await ticketsApi()
    .list(showHistory.value)
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
  { label: 'Tiket', value: 'tickets' },
  { label: 'Laporan Gangguan', value: 'trouble' },
]

async function fetchTicket() { await fetchAllTickets({}) }
async function fetchTrouble() { /* rendered component fetches itself */ }

watch(activeTab, (idx) => { if (idx === 0) fetchTicket(); else fetchTrouble() }, { immediate: true })

// Automatically sync showHistory with dateFilter: history mode is active for 'all', '7days', '30days'
// Only '1day' turns off history mode (which is not available in history mode dropdown anyway)
watch(dateFilter, (newValue) => {
  // History mode stays active when selecting: all, 7days, or 30days
  // History mode turns off only when selecting 1day
  showHistory.value = newValue !== '1day'
  // Refetch tickets when date filter changes
  fetchAllTickets({})
})

// Use alias consistent with tsconfig paths
const TroubleReport = defineAsyncComponent(() => import('@/pages/dashboard/report/trouble/index.vue'))

const visibleAndSortedTickets = computed(() => {
  if (!isTechnician.value) {
    return filteredRows.value
  }
  
  // For technicians: backend already filters tickets (assigned_to IS NULL OR assigned_to = technician_id)
  // So we just need to sort them here, no additional filtering needed
  const currentUserId = authStore.user?.user_id
  
  return filteredRows.value
    .sort((a, b) => {
      // Sort: assigned to me first, then by creation date (newest first)
      const aMine = a.assigned_to === currentUserId
      const bMine = b.assigned_to === currentUserId
      if (aMine && !bMine) return -1
      if (!aMine && bMine) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
})
</script>
<template>
  <div class="space-y-4 text-gray-900">
    <UTabs :items="tab_items" class="w-full" v-model="activeTab" />

    <div v-if="activeTab === 0" class="space-y-4">
      <h1 class="text-2xl font-semibold text-gray-900">Tiket Gangguan</h1>

      <!-- New Classification System UI -->
      <div class="bg-white rounded-lg shadow border border-gray-100 p-4">
        <!-- Responsive Classification Buttons -->
        <div class="space-y-3">
          <!-- Desktop Classification Cards -->
          <div class="hidden md:grid grid-cols-4 gap-4 mb-4">
            <button v-for="classification in ['gangguan', 'psb', 'dismantle', 'lainnya']" :key="classification"
              @click="selectClassification(classification)" :class="[
                'p-6 rounded-lg transition-all duration-200 hover:shadow-lg relative overflow-hidden',
                selectedClassification === classification
                  ? 'shadow-xl transform scale-105'
                  : 'shadow-md hover:shadow-lg'
              ]">
              <!-- Background Gradient -->
              <div :class="[
                'absolute inset-0 rounded-lg',
                classification === 'gangguan' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                classification === 'psb' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                classification === 'dismantle' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                'bg-gradient-to-r from-gray-500 to-gray-600'
              ]"></div>
              
              <!-- Content -->
              <div class="relative z-10 text-white">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-xs font-medium uppercase tracking-wide opacity-90">
                    {{ getClassificationName(classification) }}
                  </div>
                </div>
                
                <!-- Split into two sections -->
                <div class="grid grid-cols-2 gap-2">
                  <!-- Unfinished Section -->
                  <div class="text-center">
                    <div class="text-lg font-bold">
                      {{ getClassificationCounts[classification].unfinished }}
                    </div>
                    <div class="text-xs opacity-75">
                      Belum Selesai
                    </div>
                  </div>
                  
                  <!-- Ongoing Section -->
                  <div class="text-center">
                    <div class="text-lg font-bold">
                      {{ getClassificationCounts[classification].ongoing }}
                    </div>
                    <div class="text-xs opacity-75">
                      Berlangsung
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </div>
          
          <!-- Desktop Action Buttons -->
          <div class="hidden md:flex gap-3 justify-end">
            <button @click="resetFilters"
              class="px-4 py-2 rounded-lg font-medium bg-gray-500 text-white hover:bg-gray-600 transition-colors flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Atur Ulang
            </button>
            <button @click="toggleHistory" :class="[
              'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
              showHistory
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {{ showHistory ? 'Saat Ini' : 'Histori' }}
            </button>
          </div>

          <!-- Mobile Classification Cards -->
          <div class="md:hidden space-y-3">
            <!-- Classification Cards - 2x2 Grid on Mobile -->
            <div class="grid grid-cols-2 gap-3">
              <button v-for="classification in ['gangguan', 'psb', 'dismantle', 'lainnya']" :key="classification"
                @click="selectClassification(classification)" :class="[
                  'p-4 rounded-lg transition-all duration-200 hover:shadow-lg relative overflow-hidden',
                  selectedClassification === classification
                    ? 'shadow-xl transform scale-105'
                    : 'shadow-md hover:shadow-lg'
                ]">
                <!-- Background Gradient -->
                <div :class="[
                  'absolute inset-0 rounded-lg',
                  classification === 'gangguan' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                  classification === 'psb' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                  classification === 'dismantle' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                  'bg-gradient-to-r from-gray-500 to-gray-600'
                ]"></div>
                
                <!-- Content -->
                <div class="relative z-10 text-white">
                  <div class="flex items-center justify-between mb-2">
                    <div class="text-xs font-medium uppercase tracking-wide opacity-90">
                      {{ getClassificationName(classification) }}
                    </div>
                  </div>
                  
                  <!-- Split into two sections -->
                  <div class="grid grid-cols-2 gap-2">
                    <!-- Unfinished Section -->
                    <div class="text-center">
                      <div class="text-xl font-bold">
                        {{ getClassificationCounts[classification].unfinished }}
                      </div>
                      <div class="text-xs opacity-75">
                        Unfinished
                      </div>
                    </div>
                    
                    <!-- Ongoing Section -->
                    <div class="text-center">
                      <div class="text-xl font-bold">
                        {{ getClassificationCounts[classification].ongoing }}
                      </div>
                      <div class="text-xs opacity-75">
                        Ongoing
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <!-- Reset and Histori buttons - Full Width on Mobile -->
            <div class="grid grid-cols-2 gap-3">
              <button @click="resetFilters"
                class="px-4 py-3 rounded-lg font-medium bg-gray-500 text-white hover:bg-gray-600 active:bg-gray-700 transition-colors text-center flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Atur Ulang
              </button>
              <button @click="toggleHistory" :class="[
                'px-4 py-3 rounded-lg font-medium transition-colors text-center flex items-center justify-center gap-2',
                showHistory
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
              ]">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {{ showHistory ? 'Saat Ini' : 'Histori' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Responsive Date Filter - Only show when history mode is active -->
        <div v-if="showHistory" class="space-y-3">
          <!-- Desktop Date Filter -->
          <div class="hidden md:flex items-center gap-4">
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-gray-700">Filter Tanggal:</label>
              <select v-model="dateFilter"
                class="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900">
                <!-- Hide 1 day option in history mode - users should disable history to see 1 day filter -->
                <option value="7days">7 Hari Terakhir</option>
                <option value="30days">30 Hari Terakhir</option>
                <option value="all">Semua Waktu</option>
              </select>
            </div>
            <div class="text-sm text-gray-600">
              Menampilkan: {{ getClassificationName(selectedClassification) }}
              {{ showHistory ? '(All Time)' : `(${dateFilter === '1day' ? 'Last 1 Day' : dateFilter === '7days' ? 'Last 7 Days' : dateFilter === '30days' ? 'Last 30 Days' : 'All Time'})` }}
            </div>
          </div>

          <!-- Mobile Date Filter -->
          <div class="md:hidden space-y-3">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700">Filter Tanggal:</label>
              <select v-model="dateFilter"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900">
                <!-- Hide 1 day option in history mode - users should disable history to see 1 day filter -->
                <option value="7days">7 Hari Terakhir</option>
                <option value="30days">30 Hari Terakhir</option>
                <option value="all">Semua Waktu</option>
              </select>
            </div>
            <div class="text-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <span class="font-medium">Menampilkan:</span> {{ getClassificationName(selectedClassification) }}
              {{ showHistory ? '(All Time)' : `(${dateFilter === '1day' ? 'Last 1 Day' : dateFilter === '7days' ? 'Last 7 Days' : dateFilter === '30days' ? 'Last 30 Days' : 'All Time'})` }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="showUpdatesBanner"
        class="p-3 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 flex items-center justify-between">
        <div>
          Pembaruan baru tersedia ({{ newUpdates.length }}). Beberapa tiket mungkin telah ditugaskan ke peran Anda.
        </div>
        <div class="space-x-2">
          <button class="px-2 py-1 rounded bg-yellow-600 text-white" @click="dismissUpdates">Tutup</button>
          <button class="px-2 py-1 rounded bg-yellow-700 text-white" @click="refreshUpdates">Muat Ulang</button>
        </div>
      </div>

      <!-- Responsive Ticket Display -->
      <div class="space-y-4">
        <!-- Desktop Header with Actions -->
        <div class="hidden md:block bg-white rounded-lg shadow border border-gray-100 p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-4">
              <button v-if="isAdmin || isCustomerService"
                class="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700" @click="openAddModal">Tambah
                Tiket</button>
            </div>
            <div class="flex items-center gap-2">
              <div class="relative">
                <input v-model="searchQuery" type="text" placeholder="Cari tiket..."
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
        </div>

        <!-- Mobile Header with Actions -->
        <div class="md:hidden bg-white rounded-lg shadow border border-gray-100 p-4">
          <div class="flex flex-col gap-3">
            <!-- Add Ticket Button - Full Width on Mobile -->
            <button v-if="isAdmin || isCustomerService"
              class="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              @click="openAddModal">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Tambah Tiket Baru
            </button>

            <!-- Search Bar - Full Width on Mobile -->
            <div class="relative">
              <input v-model="searchQuery" type="text"
                placeholder="Cari tiket berdasarkan pelanggan, judul, atau deskripsi..."
                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white" />
              <svg class="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>

            <!-- Results Counter -->
            <div v-if="searchQuery" class="text-sm text-gray-600 text-center">
              Menampilkan {{ filteredRows.length }} dari {{ rows.length }} tiket
            </div>
          </div>
        </div>

        <!-- Desktop Table View -->
        <div class="hidden md:block bg-white rounded-lg shadow border border-gray-100">
          <!-- Current Filter Indicator -->
          <div v-if="!showHistory" class="px-4 py-2 bg-blue-50 border-b border-blue-200">
            <div class="flex items-center gap-2 text-sm text-blue-800">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="font-medium">Tampilan Saat Ini:</span>
              <span>Menampilkan {{ dateFilter === '1day' ? '1 Hari Terakhir' : dateFilter === '7days' ? '7 Hari Terakhir' : dateFilter === '30days' ? '30 Hari Terakhir' : 'Semua Waktu' }} - Tiket Belum Selesai & Berlangsung</span>
            </div>
          </div>
          <div class="table-scroll-container">
            <div class="table-scroll-content">
              <table class="min-w-full text-sm text-gray-900">
                <colgroup>
                  <col class="w-16">
                  <col class="w-32">
                  <col class="w-40">
                  <col class="w-64">
                  <col class="w-64">
                  <col class="w-24">
                  <col class="w-24">
                  <col class="w-24">
                  <col class="w-32">
                  <col class="w-32">
                  <col class="w-64">
                  <col class="w-32">
                  <col class="w-32">
                </colgroup>
                <thead class="bg-gray-100">
                  <tr class="text-left border-b border-gray-200 uppercase text-xs tracking-wide text-gray-800">
                    <th class="p-2 w-16">ID</th>
                    <th class="p-2 w-32">Pelanggan</th>
                    <th class="p-2 w-40">Tanggal</th>
                    <th class="p-2 w-64">Judul</th>
                    <th class="p-2 w-64">Deskripsi</th>
                    <th class="p-2 w-24">Tipe</th>
                    <th class="p-2 w-24">Klasifikasi</th>
                    <th class="p-2 w-24">Status</th>
                    <th class="p-2 w-32">Peran Penerima</th>
                    <th class="p-2 w-32">Ditugaskan Ke</th>
                    <th class="p-2 w-32">Catatan</th>
                    <th class="p-2 w-32">Jaringan</th>
                    <th class="p-2 w-32">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="(r, index) in (isTechnician ? visibleAndSortedTickets : filteredRows)" :key="r?.id || index">
                    <tr v-if="r"
                      class="border-b border-gray-100 odd:bg-white even:bg-gray-50 hover:bg-gray-100/70 transition-colors">
                      <td class="p-2">{{ r.id }}</td>
                      <td class="p-2 font-medium text-blue-600">{{ r.customer_name || 'Pelanggan Tidak Dikenal' }}</td>
                      <td class="p-2 text-xs text-gray-600 whitespace-nowrap">{{ formatDate(r.created_at) }}</td>
                      <td class="p-2">{{ r.title }}</td>
                      <td class="p-2 text-gray-700 max-w-xs truncate" :title="r.description || ''">{{ r.description ||
                        '-'
                        }}</td>
                      <td class="p-2 capitalize">{{ r.type_name || r.type }}</td>
                      <td class="p-2">
                        <span :class="[
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                          (r.classification_id === 'gangguan' || r.classification === 'gangguan') ? 'bg-red-100 text-red-800' :
                            (r.classification_id === 'psb' || r.classification === 'psb') ? 'bg-blue-100 text-blue-800' :
                              (r.classification_id === 'dismantle' || r.classification === 'dismantle') ? 'bg-orange-100 text-orange-800' :
                                (r.classification_id === 'lainnya' || r.classification === 'lainnya') ? 'bg-gray-100 text-gray-800' :
                                  'bg-gray-100 text-gray-800'
                        ]">
                          {{ getClassificationName(r.classification_id || r.classification || 'gangguan') }}
                        </span>
                      </td>
                    <td class="p-2">
                      <span v-if="r.status === 'finished'"
                        class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-bold bg-green-600 text-white shadow-lg border-2 border-green-700">
                        ✅ Selesai
                      </span>
                      <span v-else-if="r.status === 'ongoing'"
                        class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-bold bg-orange-600 text-white shadow-lg border-2 border-orange-700 animate-pulse">
                        🔄 Berlangsung
                      </span>
                      <span v-else
                        class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-bold bg-red-600 text-white shadow-lg border-2 border-red-700 animate-pulse">
                        ⚠️ Belum Selesai
                      </span>
                    </td>
                      <td class="p-2 capitalize">{{ r.current_assignee_name || r.current_assignee_role || '-' }}</td>
                      <td class="p-2 text-sm">
                        <span v-if="r.assignee_name" class="text-blue-600 font-medium">{{ r.assignee_name }}</span>
                        <span v-else class="text-gray-400 italic">Belum Ditugaskan</span>
                      </td>
                      <td class="p-2 max-w-xs">
                        <div class="flex flex-col gap-2 max-w-xs">
                          <!-- CS Note with Image -->
                          <div v-if="r.customer_note || r.img_cs" class="text-xs">
                            <div class="flex items-center gap-1 mb-1">
                              <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">CS:</span>
                              <span v-if="r.customer_note" class="text-gray-700 break-words">{{ r.customer_note }}</span>
                            </div>
                            <div v-if="r.img_cs" class="mt-1">
                              <img :src="getCSImageUrl(r.id, r.img_cs)" 
                                :alt="`CS Image for ticket ${r.id}`"
                                class="w-16 h-16 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                                @click="openImageModal(getCSImageUrl(r.id, r.img_cs))"
                                @error="handleImageError" />
                            </div>
                          </div>
                          
                          <!-- Technician Note -->
                          <div v-if="r.technician_note" class="text-xs">
                            <div class="flex items-center gap-1 mb-1">
                              <span class="bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">Tech:</span>
                              <span class="text-gray-700 break-words">{{ r.technician_note }}</span>
                            </div>
                          </div>
                          
                          <!-- NOC Note with Image -->
                          <div v-if="r.noc_note || r.img_noc" class="text-xs">
                            <div class="flex items-center gap-1 mb-1">
                              <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">NOC:</span>
                              <span v-if="r.noc_note" class="text-gray-700 break-words">{{ r.noc_note }}</span>
                            </div>
                            <div v-if="r.img_noc" class="mt-1">
                              <img :src="getNOCImageUrl(r.id, r.img_noc)" 
                                :alt="`NOC Image for ticket ${r.id}`"
                                class="w-16 h-16 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                                @click="openImageModal(getNOCImageUrl(r.id, r.img_noc))"
                                @error="handleImageError" />
                            </div>
                          </div>
                          
                          <span v-if="!r.customer_note && !r.technician_note && !r.noc_note && !r.img_cs && !r.img_noc"
                            class="text-gray-400 text-xs">Tidak ada catatan</span>
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
                              nocActionSubmitting || technicianNoteSubmitting || resolveSubmitting ? 'Memuat...' :
                              action.label }}
                          </button>
                          <span v-if="getTicketActions(r).length === 0" class="text-gray-400 text-xs text-center py-1">
                            Tidak ada aksi tersedia
                          </span>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
            <div class="table-scroll-footer">
              <span class="scroll-hint">↔ Gulir horizontal untuk melihat lebih banyak kolom | ↕ Gulir vertikal untuk lebih banyak
                baris</span>
            </div>
          </div>
        </div>

        <!-- Mobile Card View -->
        <div class="md:hidden space-y-3">
          <!-- Current Filter Indicator - Mobile -->
          <div v-if="!showHistory" class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div class="flex items-center gap-2 text-sm text-blue-800">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div class="flex-1">
                <span class="font-medium">Tampilan Saat Ini:</span>
                <span class="ml-1">{{ dateFilter === '1day' ? '1 Hari Terakhir' : dateFilter === '7days' ? '7 Hari Terakhir' : dateFilter === '30days' ? '30 Hari Terakhir' : 'Semua Waktu' }} - Tiket Belum Selesai & Berlangsung</span>
              </div>
            </div>
          </div>
          <template v-for="(r, index) in (isTechnician ? visibleAndSortedTickets : filteredRows)" :key="r?.id || index">
            <div v-if="r"
              class="bg-white rounded-lg shadow border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <!-- Card Header -->
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-lg font-bold text-gray-900">#{{ r.id }}</span>
                    <span class="text-xs text-gray-500">{{ formatDate(r.created_at) }}</span>
                    <span :class="[
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                      (r.classification_id === 'gangguan' || r.classification === 'gangguan') ? 'bg-red-100 text-red-800' :
                        (r.classification_id === 'psb' || r.classification === 'psb') ? 'bg-blue-100 text-blue-800' :
                          (r.classification_id === 'dismantle' || r.classification === 'dismantle') ? 'bg-orange-100 text-orange-800' :
                            (r.classification_id === 'lainnya' || r.classification === 'lainnya') ? 'bg-gray-100 text-gray-800' :
                              'bg-gray-100 text-gray-800'
                    ]">
                      {{ getClassificationName(r.classification_id || r.classification || 'gangguan') }}
                    </span>
                    <span v-if="r.status === 'finished'"
                      class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-bold bg-green-600 text-white shadow-lg border-2 border-green-700">
                      ✅ Finished
                    </span>
                    <span v-else-if="r.status === 'ongoing'"
                      class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-bold bg-orange-600 text-white shadow-lg border-2 border-orange-700 animate-pulse">
                      🔄 Ongoing
                    </span>
                    <span v-else
                      class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-bold bg-red-600 text-white shadow-lg border-2 border-red-700 animate-pulse">
                      ⚠️ Unfinished
                    </span>
                  </div>
                  <h3 class="font-semibold text-gray-900 text-base leading-tight">{{ r.title }}</h3>
                  <p class="text-sm text-blue-600 font-medium mt-1">{{ r.customer_name || 'Unknown Customer' }}</p>
                </div>
              </div>

              <!-- Card Content -->
              <div class="space-y-3">
                <!-- Description -->
                <div v-if="r.description">
                  <p class="text-sm text-gray-700 leading-relaxed">{{ r.description }}</p>
                </div>

                <!-- Type and Assignee -->
                <div class="flex flex-wrap gap-2 text-xs">
                  <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    Tipe: {{ r.type_name || r.type || 'Tidak Dikenal' }}
                  </span>
                  <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    Peran: {{ r.current_assignee_name || r.current_assignee_role || '-' }}
                  </span>
                  <span class="bg-blue-100 text-gray-700 px-2 py-1 rounded">
                    Ditugaskan Ke: {{ r.assignee_name || 'Belum Ditugaskan' }}
                  </span>
                  <span v-if="r.network_architecture" class="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    Jaringan: {{ r.network_architecture }}
                  </span>
                </div>

                <!-- Notes Section -->
                <div v-if="r.customer_note || r.technician_note || r.noc_note || r.img_cs || r.img_noc" class="space-y-2">
                  <!-- CS Note with Image -->
                  <div v-if="r.customer_note || r.img_cs" class="bg-blue-50 p-2 rounded text-xs">
                    <span class="font-medium text-blue-800">CS Note:</span>
                    <p v-if="r.customer_note" class="text-blue-700 mt-1">{{ r.customer_note }}</p>
                    <div v-if="r.img_cs" class="mt-2">
                      <img :src="getCSImageUrl(r.id, r.img_cs)" 
                        :alt="`CS Image for ticket ${r.id}`"
                        class="w-20 h-20 object-cover rounded border border-blue-300 cursor-pointer hover:opacity-80 transition-opacity"
                        @click="openImageModal(getCSImageUrl(r.id, r.img_cs))"
                        @error="handleImageError" />
                    </div>
                  </div>
                  
                  <!-- Technician Note -->
                  <div v-if="r.technician_note" class="bg-orange-50 p-2 rounded text-xs">
                    <span class="font-medium text-orange-800">Tech Note:</span>
                    <p class="text-orange-700 mt-1">{{ r.technician_note }}</p>
                  </div>
                  
                  <!-- NOC Note with Image -->
                  <div v-if="r.noc_note || r.img_noc" class="bg-purple-50 p-2 rounded text-xs">
                    <span class="font-medium text-purple-800">NOC Note:</span>
                    <p v-if="r.noc_note" class="text-purple-700 mt-1">{{ r.noc_note }}</p>
                    <div v-if="r.img_noc" class="mt-2">
                      <img :src="getNOCImageUrl(r.id, r.img_noc)" 
                        :alt="`NOC Image for ticket ${r.id}`"
                        class="w-20 h-20 object-cover rounded border border-purple-300 cursor-pointer hover:opacity-80 transition-opacity"
                        @click="openImageModal(getNOCImageUrl(r.id, r.img_noc))"
                        @error="handleImageError" />
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="pt-3 border-t border-gray-100">
                  <div class="flex flex-col gap-2">
                    <button v-for="action in getTicketActions(r)" :key="action.label"
                      :class="['w-full px-4 py-3 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2', action.color]"
                      @click="action.action" :title="action.tooltip"
                      :disabled="actionLoading[`${action.label.toLowerCase().replace(/\s+/g, '')}_${r.id}`] || nocActionSubmitting || technicianNoteSubmitting || resolveSubmitting">
                      <svg
                        v-if="actionLoading[`${action.label.toLowerCase().replace(/\s+/g, '')}_${r.id}`] || nocActionSubmitting || technicianNoteSubmitting || resolveSubmitting"
                        class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        </path>
                      </svg>
                      {{ actionLoading[`${action.label.toLowerCase().replace(/\s+/g, '')}_${r.id}`] ||
                        nocActionSubmitting || technicianNoteSubmitting || resolveSubmitting ? 'Memuat...' : action.label
                      }}
                    </button>
                    <div v-if="getTicketActions(r).length === 0" class="text-center py-2 text-gray-500 text-sm">
                      Tidak ada aksi tersedia
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Empty State -->
          <div v-if="filteredRows.length === 0" class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
              </path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No tickets found</h3>
            <p class="mt-1 text-sm text-gray-500">
              {{ searchQuery ? 'Try adjusting your search criteria.' : 'No tickets match the current filters.' }}
            </p>
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
            <div class="text-sm"><span class="font-medium">Pelanggan:</span> {{ selectedLocation?.customer_name || '-' }}
            </div>
            <div class="text-sm"><span class="font-medium">ID Pelanggan:</span> {{ selectedLocation?.customer_id || '-'
              }}</div>
            <div class="text-sm"><span class="font-medium">Alamat:</span> {{ selectedLocation?.customer_address || '-'
              }}</div>
            <div class="text-sm"><span class="font-medium">Telepon:</span> {{ selectedLocation?.customer_phone || '-' }}
            </div>
            <div class="text-sm"><span class="font-medium">Lintang:</span> {{ selectedLocation?.lat ?? '-' }}</div>
            <div class="text-sm"><span class="font-medium">Bujur:</span> {{ selectedLocation?.lng ?? '-' }}</div>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button v-if="selectedLocation?.customer_id" 
              @click="openCustomerDetailModal(selectedLocation.customer_id); showLocationModal = false"
              class="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">
              Detail Pelanggan
            </button>
            <a v-if="googleMapsUrl" :href="googleMapsUrl" target="_blank" rel="noopener"
              class="px-4 py-2 rounded bg-sky-600 text-white hover:bg-sky-700">Buka di Google Maps</a>
            <button class="px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400"
              @click="showLocationModal = false">Tutup</button>
          </div>
        </div>
      </div>

      <!-- Add New Ticket Modal -->
      <UModal v-model="showAdd" :prevent-close="false">
        <UCard class="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 text-white">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-xl font-semibold">Tambah Tiket Baru</h3>
              <UButton @click="closeAddModal" variant="ghost" size="sm">
                <UIcon name="x" />
              </UButton>
            </div>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4" v-if="!loadingLookups">
            <div>
              <label class="block text-sm font-medium text-white mb-1">Area</label>
              <USelect v-model="selectedAreaId" :options="areaOptions" placeholder="Semua Area" />
            </div>
            <div>
              <label class="block text-sm font-medium text-white mb-1">Pelanggan</label>
              <USelect v-model="form.customer_id" :options="customerOptions" placeholder="Pilih pelanggan" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-white mb-1">Judul</label>
              <UInput v-model="form.title" placeholder="Masukkan deskripsi gangguan..." />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-white mb-1">Deskripsi</label>
              <UTextarea v-model="form.description" placeholder="Masukkan deskripsi detail..." />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-white mb-1">Klasifikasi</label>
              <USelect v-model="form.classification" :options="classificationOptions" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-white mb-1">Unggah Gambar (CS) - Opsional</label>
              <input type="file" @change="handleImageUpload" accept="image/*" 
                class="w-full rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900" />
              <!-- Image Preview - Show when file is selected -->
              <div v-if="csImagePreview" class="mt-2">
                <UAlert color="green" variant="soft" class="mb-2">
                  <template #title>Gambar dipilih</template>
                  <template #actions>
                    <UButton @click="form.img_cs = ''; selectedCSFile = undefined; csImagePreview = ''" 
                      variant="ghost" size="xs" color="red">Hapus</UButton>
                  </template>
                </UAlert>
                <!-- Image Preview -->
                <div class="mt-3">
                  <img :src="csImagePreview" alt="Pratinjau Gambar CS" 
                    class="w-32 h-32 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                    @click="openImageModal(csImagePreview)" />
                  <p class="text-xs text-gray-300 mt-1">Klik untuk melihat ukuran penuh</p>
                </div>
              </div>
              <div v-else-if="form.img_cs && form.img_cs.startsWith('data:')" class="mt-2">
                <UAlert color="yellow" variant="soft" class="mb-2">
                  <template #title>Unggah gambar gagal - hanya menggunakan pratinjau</template>
                  <template #actions>
                    <UButton @click="form.img_cs = ''; selectedCSFile = undefined; csImagePreview = ''" 
                      variant="ghost" size="xs" color="red">Hapus</UButton>
                  </template>
                </UAlert>
              </div>
              <p class="text-xs text-gray-300 mt-1">PNG, JPG, GIF hingga 10MB</p>
            </div>
          </div>
          <div v-else class="text-gray-300">Memuat opsi...</div>
          
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton @click="closeAddModal" :disabled="createTicketSubmitting">Batal</UButton>
              <UButton @click="createTicket" color="green" :disabled="createTicketSubmitting" :loading="createTicketSubmitting">
                {{ createTicketSubmitting ? 'Membuat...' : 'Kirim' }}
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>





      <!-- Modal NOC Note -->
      <div v-if="showNOCNoteModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" @click="showNOCNoteModal = false"></div>
        <div class="relative w-full max-w-md mx-4 rounded-xl shadow-xl bg-white p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Aksi Tiket</h2>
            <button class="text-gray-400 hover:text-gray-600" @click="showNOCNoteModal = false">✕</button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
              <textarea v-model="nocNote" placeholder="Masukkan catatan tentang aksi ini..."
                class="w-full rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none text-gray-900 bg-white"></textarea>
            </div>
            <div v-if="isNOC || isAdmin">
              <label class="block text-sm font-medium text-gray-700 mb-1">Tipe Gangguan yang Didiagnosis</label>
              <div class="flex gap-2" v-if="!showNewType">
                <select v-model="nocSelectedType"
                  class="w-full rounded px-3 py-2 border border-gray-300 focus:outline.none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900">
                  <option value="" class="text-gray-500">-- Pilih tipe gangguan (opsional) --</option>
                  <option v-for="t in troubleTypes" :key="t.id" :value="t.id" class="text-gray-900 bg-white">{{ t.name
                    || t.id }}</option>
                </select>
                <button type="button" class="px-3 py-2 rounded bg-blue-600 text-white text-sm"
                  @click="showNewType = true">Tambah
                  Tipe Baru</button>
              </div>
              <div v-else class="space-y-2">
                <input v-model="newTypeName" placeholder="Nama Tampilan (opsional)"
                  class="w-full rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900" />
                <div class="flex gap-2">
                  <button type="button" class="px-3 py-2 bg-emerald-600 text-white rounded text-sm"
                    @click="saveNewType">Simpan
                    Tipe</button>
                  <button type="button" class="px-3 py-2 bg-gray-300 text-gray-700 rounded text-sm"
                    @click="showNewType = false">Batal</button>
                </div>
              </div>
            </div>
            <div v-if="isAdmin || isCustomerService">
              <label class="block text-sm font-medium text-gray-700 mb-1">Akumulasi (Pelanggan Terpengaruh)</label>
              <div class="flex items-center space-x-2">
                <input v-model.number="nocAccumulation" type="number" min="1"
                  placeholder="Masukkan jumlah pelanggan yang terpengaruh"
                  class="flex-1 rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900" />
                <button @click="updateAccumulationFromModal"
                  class="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  :disabled="nocAccumulation === null || nocAccumulation === undefined || nocAccumulation < 1">
                  Perbarui
                </button>
              </div>
              <p class="text-xs text-gray-500 mt-1">
                Saat Ini: {{ selectedTicket?.accumulation || 1 }} pelanggan terpengaruh
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Unggah Gambar (Opsional)</label>
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
                      <span>Unggah file</span>
                      <input id="noc-image-upload" name="noc-image-upload" type="file" class="sr-only" accept="image/*"
                        @change="handleNOCImageUpload" />
                    </label>
                    <p class="pl-1">atau seret dan lepas</p>
                  </div>
                  <p class="text-xs text-gray-500">PNG, JPG, GIF hingga 10MB</p>
                </div>
              </div>
              <div v-if="nocImageFile" class="mt-2">
                <div class="flex items-center space-x-2">
                  <img :src="nocImagePreview" alt="Pratinjau" class="h-16 w-16 object-cover rounded" />
                  <div>
                    <p class="text-sm text-gray-600">{{ nocImageFile.name }}</p>
                    <button @click="removeNOCImage" class="text-sm text-red-600 hover:text-red-800">Hapus</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button class="px-4 py-2 rounded bg-gray-300 text-gray-700" @click="showNOCNoteModal = false"
              :disabled="nocActionSubmitting">Batal</button>
            <button class="px-4 py-2 rounded bg-purple-600 text-white disabled:opacity-50"
              @click="sendToCSWithAutoAssign" v-if="isAdmin || isCustomerService" :disabled="nocActionSubmitting">
              {{ nocActionSubmitting ? 'Mengirim...' : 'Ke CS' }}
            </button>
            <button class="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50" @click="nocSolvedFromModal"
              v-if="isAdmin || isCustomerService" :disabled="nocActionSubmitting">
              {{ nocActionSubmitting ? 'Memproses...' : 'NOC Selesai' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Technician Note -->
      <div v-if="showTechnicianNoteModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" @click="showTechnicianNoteModal = false"></div>
        <div class="relative w-full max-w-lg mx-4 rounded-xl shadow-xl bg-white p-0 max-h-[90vh] overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b">
            <h2 class="text-xl font-semibold text-gray-900">Tambah Catatan Teknisi & Gambar</h2>
            <button class="text-gray-400 hover:text-gray-600" @click="showTechnicianNoteModal = false">✕</button>
          </div>
          <div class="space-y-4 px-6 py-4 overflow-y-auto" style="max-height: calc(90vh - 120px)">
            <div class="p-3 rounded bg-gray-50 border">
              <div class="text-sm text-gray-700"><span class="font-medium">Pelanggan:</span> {{
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
              <label class="block text-sm font-medium text-gray-700 mb-1">Catatan Teknisi <span
                  class="text-red-500">*</span></label>
              <textarea v-model="technicianNote" placeholder="Masukkan catatan teknisi Anda..."
                class="w-full rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none text-gray-900 bg-white"></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Gambar Sebelum (Opsional)</label>
              <input type="file" @change="handleBeforeImageChange" accept="image/*"
                class="w-full rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p class="text-xs text-gray-500 mt-1">Ukuran maks: 10MB. Didukung: JPG, PNG, GIF</p>
              <!-- Preview Before Image -->
              <div v-if="imgTechBfFile" class="mt-2 p-2 border border-gray-200 rounded bg-gray-50">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">{{ imgTechBfFile.name }}</span>
                  <button @click="imgTechBfFile = null" class="text-red-500 hover:text-red-700 text-sm">✕</button>
                </div>
                <div class="mt-2">
                  <img v-if="beforeImageUrl" :src="beforeImageUrl" alt="Pratinjau Sebelum"
                    class="w-20 h-20 object-cover rounded border" />
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Gambar Sesudah (Opsional)</label>
              <input type="file" @change="handleAfterImageChange" accept="image/*"
                class="w-full rounded px-3 py-2 border border-gray-300 focus:outline.none focus:ring-2 focus:ring-blue-500" />
              <p class="text-xs text-gray-500 mt-1">Ukuran maks: 10MB. Didukung: JPG, PNG, GIF</p>
              <!-- Preview After Image -->
              <div v-if="imgTechAfFile" class="mt-2 p-2 border border-gray-200 rounded bg-gray-50">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">{{ imgTechAfFile.name }}</span>
                  <button @click="imgTechAfFile = null" class="text-red-500 hover:text-red-700 text-sm">✕</button>
                </div>
                <div class="mt-2">
                  <img v-if="afterImageUrl" :src="afterImageUrl" alt="Pratinjau Sesudah"
                    class="w-20 h-20 object-cover rounded border" />
                </div>
              </div>
            </div>
          </div>
          <div class="px-6 py-4 border-t flex justify-end gap-2">
            <button class="px-4 py-2 rounded bg-gray-300 text-gray-700"
              @click="showTechnicianNoteModal = false">Batal</button>
            <button class="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
              @click="sendTechnicianNoteFromModal" :disabled="technicianNoteSubmitting || !technicianNote.trim()">
              {{ technicianNoteSubmitting ? 'Mengirim...' : 'Tambah Catatan & Gambar' }}
            </button>
          </div>
        </div>
      </div>


      <!-- Modal Delete Confirmation -->
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" @click="showDeleteModal = false"></div>
        <div class="relative w-full max-w-md mx-4 rounded-xl shadow-xl bg-white p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-red-600">Konfirmasi Hapus</h2>
            <button class="text-gray-400 hover:text-gray-600" @click="showDeleteModal = false">✕</button>
          </div>
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <i class="alert-triangle text-red-600 text-xl"></i>
                </div>
              </div>
              <div>
                <h3 class="text-lg font-medium text-gray-900">Hapus Tiket?</h3>
                <p class="text-sm text-gray-600">
                  Apakah Anda yakin ingin menghapus tiket <strong>#{{ ticketToDelete?.id }}</strong>?
                </p>
                <p class="text-sm text-gray-500 mt-1">
                  Judul: "{{ ticketToDelete?.title }}"
                </p>
                <p class="text-xs text-red-600 mt-2">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button class="px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400"
              @click="showDeleteModal = false">
              Batal
            </button>
            <button class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              @click="deleteTicket(ticketToDelete?.id)" :disabled="deleteTicketSubmitting">
              {{ deleteTicketSubmitting ? 'Menghapus...' : 'Hapus Tiket' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Resolve Ticket -->
      <div v-if="showResolveModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" @click="showResolveModal = false"></div>
        <div class="relative w-full max-w-md mx-4 rounded-xl shadow-xl bg-white p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Selesaikan Tiket</h2>
            <button class="text-gray-400 hover:text-gray-600" @click="showResolveModal = false">✕</button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Catatan Pelanggan</label>
              <textarea v-model="resolveNote"
                placeholder="Tambahkan catatan tentang resolusi untuk berkomunikasi dengan pelanggan..."
                class="w-full rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 bg-white"
                rows="4"></textarea>
              <p class="text-xs text-gray-500 mt-1">Catatan ini akan disimpan sebagai customer_note dan status tiket akan
                diatur menjadi selesai.</p>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button class="px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400"
              @click="showResolveModal = false">Batal</button>
            <button class="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              @click="resolveFromModal" :disabled="resolveSubmitting">
              {{ resolveSubmitting ? 'Menyelesaikan...' : 'Selesaikan Tiket' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Accept Ticket -->
      <div v-if="showAcceptConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" @click="showAcceptConfirm = false"></div>
        <div class="relative w-full max-w-md mx-4 rounded-xl shadow-xl bg-white p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Terima Tiket</h2>
            <button class="text-gray-400 hover:text-gray-600" @click="showAcceptConfirm = false">✕</button>
          </div>
          <p class="text-gray-700 mb-4">Ini akan menugaskan tiket kepada Anda.</p>
          <div class="flex justify-end gap-2">
            <button class="px-4 py-2 rounded bg-gray-300 text-gray-700"
              @click="showAcceptConfirm = false">Batal</button>
            <button class="px-4 py-2 rounded bg-blue-700 text-white" @click="acceptTicket">Terima</button>
          </div>
        </div>
      </div>

      <!-- Modal Set Team -->
      <div v-if="showTeamModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60" @click="showTeamModal = false"></div>
        <div class="relative w-full max-w-lg mx-4 rounded-xl shadow-xl bg-white p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Atur Tim Teknisi</h2>
            <button class="text-gray-400 hover:text-gray-600" @click="showTeamModal = false">✕</button>
          </div>
          <div class="space-y-3">
            <div v-for="(m, idx) in teamMembers" :key="idx" class="flex items-center gap-2">
              <select v-model="m.role" class="border rounded px-2 py-1 text-gray-900 bg-white">
                <option value="senior">Senior</option>
                <option value="junior">Junior</option>
                <option value="helper">Helper</option>
              </select>
              <input v-model="m.user_id" placeholder="ID pengguna teknisi"
                class="flex-1 border rounded px-2 py-1 text-gray-900 bg-white" />
              <button class="text-red-600 text-sm" @click="removeTeamMember(idx)">Hapus</button>
            </div>
            <button class="px-3 py-1.5 rounded bg-gray-200 text-gray-800 text-sm" @click="addTeamMember">Tambah
              Anggota</button>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button class="px-4 py-2 rounded bg-gray-300 text-gray-700" @click="showTeamModal = false">Batal</button>
            <button class="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50" @click="saveTeam"
              :disabled="teamSubmitting">{{ teamSubmitting ? 'Menyimpan...' : 'Simpan Tim' }}</button>
          </div>
        </div>
      </div>

      <!-- Modal Add Step -->
      <div v-if="showStepModal" class="fixed inset-0 z-50 flex items-center justify.center">
        <div class="absolute inset-0 bg-black/60" @click="showStepModal = false"></div>
        <div class="relative w-full max-w-lg mx-4 rounded-xl shadow-xl bg-white p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Tambah Langkah Troubleshooting</h2>
            <button class="text-gray-400 hover:text-gray-600" @click="showStepModal = false">✕</button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <textarea v-model="stepDescription" rows="3"
                class="w-full border rounded px-3 py-2 text-gray-900 bg-white"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Gambar (multiple)</label>
              <input type="file" multiple accept="image/*" @change="onSelectStepImages"
                class="w-full border rounded px-3 py-2 text-gray-900 bg-white" />
              <div v-if="stepImages.length" class="mt-2 text-xs text-gray-600">{{ stepImages.length }} file dipilih
              </div>
            </div>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button class="px-4 py-2 rounded bg-gray-300 text-gray-700" @click="showStepModal = false">Batal</button>
            <button class="px-4 py-2 rounded bg-amber-600 text-white disabled:opacity-50" @click="saveStep"
              :disabled="stepSubmitting || !stepDescription.trim()">{{ stepSubmitting ? 'Menyimpan...' : 'Simpan Langkah'
              }}</button>
          </div>
        </div>
      </div>

      <!-- Image Modal -->
      <div v-if="showImageModal" class="fixed inset-0 z-[99999] flex items-center justify-center">
        <div class="absolute inset-0 bg-black/80" @click="showImageModal = false"></div>
        <div class="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
          <div class="flex items-center justify-between p-4 border-b">
            <h3 class="text-lg font-semibold">Pratinjau Gambar</h3>
            <button class="text-gray-400 hover.text-gray-600" @click="showImageModal = false">✕</button>
          </div>
          <div class="p-4">
            <img :src="selectedImageUrl" alt="Pratinjau" class="max-w-full max-h-[70vh] object-contain mx-auto" />
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
          <div class="flex justify-end items-center mb-4">
            <button @click="showTechnicianChecklist = false" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <TechnicianChecklist v-if="selectedTicketForChecklist" :ticket-id="selectedTicketForChecklist"
            :technician-id="selectedTechnicianForChecklist" :read-only="selectedChecklistReadOnly || !(isTechnician)"
            @job-completed="() => { showTechnicianChecklist = false; refresh() }" />
        </div>
      </div>
    </div>

    <!-- Customer Detail Modal -->
    <CustomerDetailModal
      v-if="showCustomerDetailModal && selectedCustomerId"
      :customer-id="selectedCustomerId"
      @close="closeCustomerDetailModal"
    />
  </div>
</template>