<template>
  <div class="technician-checklist">
    <div class="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <div v-if="jobCompletedLocal" class="mb-4 p-4 rounded border border-green-200 bg-green-50 text-green-800">
        Ticket marked as finished. You can safely close this task.
      </div>
      <!-- Team Assignment (read-only shows disabled controls) -->
      <div class="mb-6 p-4 border border-gray-200 rounded-lg">
        <h4 class="font-medium text-gray-900 mb-3">Assign Technician Team</h4>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-sm text-gray-700 mb-1">Senior</label>
            <select v-model="team.senior" class="w-full border border-gray-300 rounded px-3 py-2" :disabled="readOnly">
              <option value="">Select technician...</option>
              <option v-for="t in technicians" :key="t.id" :value="t.id">{{ t.name }} ({{ t.email || 'tech' }})</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-700 mb-1">Junior</label>
            <select v-model="team.junior" class="w-full border border-gray-300 rounded px-3 py-2" :disabled="readOnly">
              <option value="">Select technician...</option>
              <option v-for="t in technicians" :key="t.id + '-j'" :value="t.id">{{ t.name }} ({{ t.email || 'tech' }})</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-700 mb-1">Helper</label>
            <select v-model="team.helper" class="w-full border border-gray-300 rounded px-3 py-2" :disabled="readOnly">
              <option value="">Select technician...</option>
              <option v-for="t in technicians" :key="t.id + '-h'" :value="t.id">{{ t.name }} ({{ t.email || 'tech' }})</option>
            </select>
          </div>
        </div>
        <div class="mt-3 text-right" v-if="!readOnly">
          <button @click="saveTeam" :disabled="savingTeam"
            class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">
            {{ savingTeam ? 'Saving...' : 'Save Team' }}
          </button>
        </div>
      </div>

      <!-- Header with Progress -->
      <div class="mb-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg sm:text-xl font-semibold text-gray-900">Technician Checklist</h3>
          <div class="text-sm text-gray-600">
            {{ currentStepIndex + 1 }} of {{ checklist.length }}
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div class="bg-blue-600 h-3 rounded-full transition-all duration-300"
            :style="{ width: `${progressPercentage}%` }"></div>
        </div>
        <div class="text-sm text-gray-600 text-center">
          Progress: {{ progressPercentage }}%
        </div>
      </div>

      <!-- Network Architecture Selection (read-only shows disabled buttons) -->
      <div v-if="!networkArchitecture" class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 class="font-medium text-yellow-800 mb-2">Select Network Architecture</h4>
        <p class="text-sm text-yellow-700 mb-4">Please select the network architecture type before proceeding with the
          checklist.</p>
        <div class="flex flex-col sm:flex-row gap-3">
          <button @click="selectArchitecture('FTTH')" :disabled="readOnly"
            class="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            FTTH (Fiber to the Home)
          </button>
          <button @click="selectArchitecture('HTB')" :disabled="readOnly"
            class="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            HTB (High-speed Terminal Box)
          </button>
        </div>
      </div>

      <!-- Current Step Display -->
      <div v-if="networkArchitecture && currentStep" class="mb-6">
        <div class="border border-gray-200 rounded-lg p-4 sm:p-6" :class="{
          'bg-green-50 border-green-200': currentStep.status === 'done',
          'bg-yellow-50 border-yellow-200': currentStep.status === 'needs_spare_parts',
          'bg-red-50 border-red-200': currentStep.status === 'not_applicable',
          'bg-gray-50': currentStep.status === 'pending'
        }">
          <!-- Step Header -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-500">Step {{ currentStep.step_order }}</span>
              <span class="px-3 py-1 text-xs font-medium rounded-full" :class="getStatusClass(currentStep.status)">
                {{ getStatusText(currentStep.status) }}
              </span>
            </div>
            <h4 class="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{{ currentStep.title }}</h4>
            <p class="text-sm text-gray-600">{{ currentStep.description }}</p>
          </div>

          <!-- Step Details -->
          <div class="space-y-4 text-sm">
            <div>
              <h5 class="font-medium text-gray-700 mb-1">Tools Required:</h5>
              <p class="text-gray-600">{{ currentStep.tools }}</p>
            </div>
            <div>
              <h5 class="font-medium text-gray-700 mb-1">Spare Parts:</h5>
              <p class="text-gray-600">{{ currentStep.spare_parts }}</p>
            </div>
            <div>
              <h5 class="font-medium text-gray-700 mb-1">Procedure:</h5>
              <p class="text-gray-600 whitespace-pre-line">{{ currentStep.procedure }}</p>
            </div>
            <div>
              <h5 class="font-medium text-gray-700 mb-1">Solution:</h5>
              <p class="text-gray-600 whitespace-pre-line">{{ currentStep.solution }}</p>
            </div>
          </div>

          <!-- Progress Notes -->
          <div v-if="currentStep.notes" class="mt-4 p-3 bg-blue-50 rounded">
            <h6 class="font-medium text-blue-800 mb-1">Notes:</h6>
            <p class="text-blue-700">{{ currentStep.notes }}</p>
          </div>

          <!-- Existing Images -->
          <div v-if="currentStepImages.length" class="mt-4">
            <h6 class="font-medium text-gray-700 mb-2">Previous Uploads:</h6>
            <div class="flex flex-wrap gap-2">
              <img v-for="(url, i) in currentStepImages" :key="i" :src="url" class="w-20 h-20 object-cover rounded border cursor-zoom-in hover:opacity-80"
                   @click="openImage(url)" />
            </div>
          </div>

          <!-- Spare Parts Used -->
          <div v-if="currentStep.spare_parts_used" class="mt-4 p-3 bg-orange-50 rounded">
            <h6 class="font-medium text-orange-800 mb-1">Spare Parts Used:</h6>
            <p class="text-orange-700">{{ currentStep.spare_parts_used }}</p>
          </div>

          <!-- Prerequisite notice and Action Button -->
          <div class="mt-6" v-if="!readOnly">
            <div v-if="!canAccessStep(currentStepIndex)" class="mb-3 p-3 rounded border border-amber-200 bg-amber-50 text-amber-800 text-sm">
              Please complete all previous steps (Done or Not Applicable) before updating this step.
            </div>
            <button @click="openStepModal(currentStep)" :disabled="!canAccessStep(currentStepIndex)"
              class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              Update Step Status
            </button>
          </div>
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div v-if="networkArchitecture && checklist.length > 0" class="flex justify-between items-center mb-6">
        <button @click="previousStep" :disabled="currentStepIndex === 0"
          class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
          ← Previous
        </button>

        <div class="flex space-x-2">
          <button v-for="(step, index) in checklist" :key="step.step_id" @click="goToStep(index)"
            class="w-3 h-3 rounded-full" :class="{
              'bg-green-500': step.status === 'done',
              'bg-yellow-500': step.status === 'needs_spare_parts',
              'bg-red-500': step.status === 'not_applicable',
              'bg-gray-300': step.status === 'pending',
              'ring-2 ring-blue-500': index === currentStepIndex
            }"></button>
        </div>

        <button @click="nextStep" :disabled="currentStepIndex === checklist.length - 1"
          class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
          Next →
        </button>
      </div>

      <!-- Complete Job Button -->
      <div v-if="!readOnly && networkArchitecture && allStepsCompleted" class="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div class="text-center">
          <h4 class="font-medium text-green-800 mb-2">All Steps Completed!</h4>
          <p class="text-sm text-green-700 mb-4">You can now mark this job as completed.</p>
          <button @click="completeJob" :disabled="completing"
            class="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium">
            {{ completing ? 'Completing...' : 'Complete Job' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Step Update Modal -->
    <div v-if="showStepModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
        <h3 class="text-lg font-semibold mb-4">Update Step: {{ selectedStep?.title }}</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select v-model="stepUpdate.status" class="w-full border border-gray-300 rounded px-3 py-2">
              <option value="done">Done</option>
              <option value="fix">Fix</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea v-model="stepUpdate.notes" rows="3" class="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Add any notes about this step..."></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Progress Images <span class="text-gray-500">(Fix requires 2 images)</span></label>
            <input type="file" multiple accept="image/*" @change="handleImageUpload"
              class="w-full border border-gray-300 rounded px-3 py-2" />
            <p class="text-xs text-gray-500 mt-1">Upload images showing your progress on this step</p>
            <div v-if="stepUpdate.images && stepUpdate.images.length > 0" class="mt-2">
              <div v-for="(img, index) in stepUpdate.images" :key="index" class="inline-block mr-2 mb-2">
                <img :src="img.preview" class="w-16 h-16 object-cover rounded border" />
                <button @click="removeImage(index)" class="text-red-500 text-xs">Remove</button>
              </div>
            </div>
          </div>

          <div v-if="stepUpdate.status === 'needs_spare_parts'">
            <label class="block text-sm font-medium text-gray-700 mb-2">Spare Parts Used</label>
            <select v-model="stepUpdate.sparePartsUsed" class="w-full border border-gray-300 rounded px-3 py-2">
              <option value="">Select spare parts...</option>
              <option v-for="part in spareParts" :key="part.id" :value="part.name">
                {{ part.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-6">
          <button @click="closeStepModal"
            class="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
            Cancel
          </button>
          <button @click="updateStep" :disabled="updating"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
            {{ updating ? 'Updating...' : 'Update Step' }}
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Image Viewer Modal -->
  <div v-if="showImageModal" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/80" @click="closeImage"></div>
    <div class="relative w-full max-w-4xl mx-4">
      <img :src="viewedImageUrl" class="max-h-[85vh] w-full object-contain rounded" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ticketsApi } from '@/api/tickets'
import { useApiHost } from '@/composables/useApiHost'

interface ChecklistStep {
  step_id: number
  step_order: number
  title: string
  description: string
  tools: string
  spare_parts: string
  procedure: string
  solution: string
  status: string
  notes?: string
  spare_parts_used?: string
  completed_at?: string
  image_paths?: string | string[] | null
}

interface SparePart {
  id: number
  name: string
  description?: string
  category: string
}

const props = defineProps<{
  ticketId: number
  technicianId: string
  readOnly?: boolean
}>()

const readOnly = computed(() => !!props.readOnly)

const emit = defineEmits<{
  jobCompleted: []
}>()

// Simple notification system
const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  // Simple alert for now - you can replace with your preferred notification system
  if (type === 'error') {
    alert(`Error: ${message}`)
  } else {
    alert(`Success: ${message}`)
  }
}

// State
const checklist = ref<ChecklistStep[]>([])
const spareParts = ref<SparePart[]>([])
  const technicians = ref<any[]>([])
const networkArchitecture = ref<string>('')
  const team = ref<{ senior: string; junior: string; helper: string }>({ senior: '', junior: '', helper: '' })
const showStepModal = ref(false)
const selectedStep = ref<ChecklistStep | null>(null)
const stepUpdate = ref({
  status: 'pending',
  notes: '',
  sparePartsUsed: '',
  images: [] as { file: File; preview: string }[]
})
const updating = ref(false)
const completing = ref(false)
const jobCompletedLocal = ref(false)
  const savingTeam = ref(false)
const currentStepIndex = ref(0)

// Computed
const progressPercentage = computed(() => {
  if (checklist.value.length === 0) return 0
  const completed = checklist.value.filter(step => step.status === 'done' || step.status === 'needs_spare_parts').length
  return Math.round((completed / checklist.value.length) * 100)
})

const allStepsCompleted = computed(() => {
  return checklist.value.length > 0 && checklist.value.every(step => step.status === 'done' || step.status === 'needs_spare_parts')
})

const currentStep = computed(() => {
  if (checklist.value.length === 0) return null
  return checklist.value[currentStepIndex.value] || null
})

// Build absolute URLs for saved images of the current step
const apiBase = useApiHost()
const currentStepImages = computed<string[]>(() => {
  const step = currentStep.value as any
  if (!step) return []
  let paths: any = step.image_paths
  if (!paths) return []
  if (typeof paths === 'string') {
    try {
      const parsed = JSON.parse(paths)
      if (Array.isArray(parsed)) paths = parsed
    } catch (_) {
      // it's a single filename string
    }
  }
  if (Array.isArray(paths)) {
    return paths.map((p: string) => `${apiBase}/uploads/technician-progress/${p}`)
  }
  if (typeof paths === 'string') {
    return [`${apiBase}/uploads/technician-progress/${paths}`]
  }
  return []
})

// Methods
const loadChecklist = async () => {
  try {
    // Keep current step so UI doesn't jump after refresh
    const prevStepId = currentStep.value?.step_id

    const resp = await ticketsApi().getTechnicianChecklist(props.ticketId, props.technicianId) as any
    if (Array.isArray(resp.data)) {
      checklist.value = resp.data
    } else {
      checklist.value = resp.data?.checklist || []
      networkArchitecture.value = resp.data?.network_architecture || ''
    }

    if (prevStepId) {
      const idx = checklist.value.findIndex(s => s.step_id === prevStepId)
      if (idx >= 0) currentStepIndex.value = idx
    }
  } catch (error: any) {
    showNotification(error.message, 'error')
  }
}

const loadSpareParts = async () => {
  try {
    const data = await ticketsApi().getSpareParts() as any
    spareParts.value = data.data || []
  } catch (error: any) {
    console.error('Failed to load spare parts:', error)
  }
}

const loadTechnicians = async () => {
  try {
    const data = await ticketsApi().listTechnicians() as any
    technicians.value = data.data || []
  } catch (e: any) {
    console.error('Failed to load technicians', e)
  }
}

// Load existing saved team and reflect into selects
const loadTeamMembers = async () => {
  try {
    const resp = await ticketsApi().getTeamMembers(props.ticketId) as any
    const members = (resp?.data || []) as Array<{ user_id: string; role: string }>
    const map: Record<string, string> = {}
    for (const m of members) map[m.role] = m.user_id
    team.value.senior = map['senior'] || ''
    team.value.junior = map['junior'] || ''
    team.value.helper = map['helper'] || ''
  } catch (_) {
    // no-op
  }
}

const saveTeam = async () => {
  try {
    // Build members list and validate uniqueness
    const members: { user_id: string; role: 'senior' | 'junior' | 'helper' }[] = []
    if (team.value.senior) members.push({ user_id: team.value.senior, role: 'senior' })
    if (team.value.junior) members.push({ user_id: team.value.junior, role: 'junior' })
    if (team.value.helper) members.push({ user_id: team.value.helper, role: 'helper' })

    if (members.length === 0) {
      showNotification('Assign at least one technician', 'error')
      return
    }
    const ids = members.map(m => m.user_id)
    const setIds = new Set(ids)
    if (setIds.size !== ids.length) {
      showNotification('One technician cannot occupy multiple roles', 'error')
      return
    }

    savingTeam.value = true
    await ticketsApi().setTeam(props.ticketId, members)
    showNotification('Team saved', 'success')
    await loadTeamMembers()
  } catch (e: any) {
    showNotification(e.message || 'Failed to save team', 'error')
  } finally {
    savingTeam.value = false
  }
}

const selectArchitecture = async (architecture: string) => {
  try {
    await ticketsApi().setNetworkArchitecture(props.ticketId, architecture)
    networkArchitecture.value = architecture
    showNotification(`Network architecture set to ${architecture}`, 'success')
  } catch (error: any) {
    showNotification(error.message, 'error')
  }
}

const openStepModal = (step: ChecklistStep) => {
  selectedStep.value = step
  stepUpdate.value = {
    status: step.status === 'needs_spare_parts' ? 'fix' : (step.status === 'done' ? 'done' : 'fix'),
    notes: step.notes || '',
    sparePartsUsed: step.spare_parts_used || '',
    images: [] as { file: File; preview: string }[]
  }
  showStepModal.value = true
}

const closeStepModal = () => {
  showStepModal.value = false
  selectedStep.value = null
  stepUpdate.value = {
    status: 'pending',
    notes: '',
    sparePartsUsed: '',
    images: []
  }
}

const updateStep = async () => {
  if (!selectedStep.value) return

  // Validate that images are uploaded for non-pending status
  // Image requirements
  const savedCount = Array.isArray(selectedStep.value.image_paths)
    ? selectedStep.value.image_paths.length
    : (selectedStep.value.image_paths ? 1 : 0)
  const newCount = stepUpdate.value.images.length

  // Always require at least one image overall
  if (savedCount + newCount < 1) {
    showNotification('Please upload at least 1 image for this step', 'error')
    return
  }

  // If Fix, require at least 2 total images (before and after)
  const isFix = stepUpdate.value.status === 'fix'
  if (isFix && (savedCount + newCount) < 2) {
    showNotification('Fix requires 2 images (before and after)', 'error')
    return
  }

  updating.value = true
  try {
    const imageFiles = stepUpdate.value.images.map(img => img.file)

    const apiStatus = stepUpdate.value.status === 'fix' ? 'needs_spare_parts' : 'done'

    await ticketsApi().updateTechnicianStepWithImages(
      props.ticketId,
      selectedStep.value.step_id,
      props.technicianId,
      apiStatus,
      stepUpdate.value.notes || undefined,
      stepUpdate.value.sparePartsUsed || undefined,
      imageFiles.length > 0 ? imageFiles : undefined
    )

    await loadChecklist()
    closeStepModal()
    showNotification('Step updated successfully', 'success')
  } catch (error: any) {
    showNotification(error.message, 'error')
  } finally {
    updating.value = false
  }
}

const completeJob = async () => {
  completing.value = true
  try {
    await ticketsApi().markTechnicianJobCompleted(props.ticketId)
    showNotification('Job completed successfully', 'success')
    emit('jobCompleted')
    jobCompletedLocal.value = true
  } catch (error: any) {
    showNotification(error.message, 'error')
  } finally {
    completing.value = false
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'done': return 'bg-green-100 text-green-800'
    case 'needs_spare_parts': return 'bg-red-100 text-red-800'
    case 'not_applicable': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'done': return 'Done'
    case 'needs_spare_parts': return 'Fix'
    case 'not_applicable': return 'N/A'
    default: return 'Pending'
  }
}

const viewStepDetails = (step: ChecklistStep) => {
  // Implementation for viewing step details
  console.log('View step details:', step)
}

// Navigation methods
const nextStep = () => {
  if (currentStepIndex.value < checklist.value.length - 1) {
    currentStepIndex.value++
  }
}

const previousStep = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--
  }
}

const goToStep = (index: number) => {
  if (index >= 0 && index < checklist.value.length) {
    if (!canAccessStep(index)) {
      showNotification('Please complete previous steps first', 'error')
      return
    }
    currentStepIndex.value = index
  }
}

// Image handling functions
const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files) return

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        stepUpdate.value.images.push({
          file: file,
          preview: e.target?.result as string
        })
      }
      reader.readAsDataURL(file)
    }
  }
}

const removeImage = (index: number) => {
  stepUpdate.value.images.splice(index, 1)
}

// Check if step can be accessed (sequential completion)
const canAccessStep = (stepIndex: number) => {
  if (stepIndex === 0) return true // First step is always accessible

  // Check if all previous steps are completed
  for (let i = 0; i < stepIndex; i++) {
    const step = checklist.value[i]
    if (step.status !== 'done' && step.status !== 'not_applicable' && step.status !== 'needs_spare_parts') {
      return false
    }
  }
  return true
}

// Lifecycle
onMounted(() => {
  loadChecklist()
  loadSpareParts()
  loadTechnicians()
  loadTeamMembers()
})

// Simple image viewer modal
const showImageModal = ref(false)
const viewedImageUrl = ref('')
const openImage = (url: string) => { viewedImageUrl.value = url; showImageModal.value = true }
const closeImage = () => { showImageModal.value = false; viewedImageUrl.value = '' }
</script>
