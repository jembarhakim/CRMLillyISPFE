<template>
  <UModal :model-value="isOpen" @update:model-value="$emit('update:isOpen', $event)" :ui="{ width: 'w-full sm:max-w-lg' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-red-800 flex items-center">
            <div class="bg-red-100 p-2 rounded-lg mr-3">
              <UIcon name="i-lucide-trash-2" class="w-5 h-5 text-red-600" />
            </div>
            Delete Installation Report
          </h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-lucide-x"
            @click="closeModal"
            :disabled="deleting"
          />
        </div>
      </template>

      <div v-if="loading" class="text-center py-8">
        <UIcon name="i-lucide-refresh-cw" class="animate-spin text-2xl text-red-600 mx-auto mb-4" />
        <p class="text-gray-600">Loading report information...</p>
      </div>

      <div v-else>
        <!-- Customer Information -->
        <div class="mb-6">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <UIcon name="i-lucide-user" class="text-red-600 text-2xl" />
            </div>
            <div>
              <h4 class="text-lg font-semibold text-gray-900">{{ customerName }}</h4>
              <p class="text-sm text-gray-600">Installation Report ID: {{ installationId }}</p>
            </div>
          </div>
        </div>

        <!-- Warning Message -->
        <div class="bg-red-50 border border-red-200 rounded-lg p-5 mb-6">
          <div class="flex items-start">
            <UIcon name="i-lucide-alert-triangle" class="text-red-500 text-xl mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h5 class="text-red-800 font-semibold mb-2">⚠️ Warning: This action cannot be undone!</h5>
              <p class="text-red-900 text-sm leading-relaxed mb-3">
                You are about to permanently delete this installation report and all associated data.
              </p>
              <div class="bg-red-100 border border-red-300 rounded-lg p-3">
                <p class="text-red-900 text-sm font-semibold mb-2">This action will:</p>
                <ul class="text-red-900 text-sm list-disc list-inside space-y-1">
                  <li><strong>Delete the installation report permanently</strong></li>
                  <li><strong>Update the MAC address status back to "in_stock"</strong></li>
                  <li><strong>Remove all related technician assignments and asset transactions</strong></li>
                  <li><strong>Delete all associated network devices, cables, and images</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Impact Summary -->
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h6 class="text-sm font-semibold text-gray-800 mb-3 flex items-center">
            <UIcon name="i-lucide-info" class="w-4 h-4 mr-2 text-gray-600" />
            Impact Summary
          </h6>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Customer:</span>
              <span class="font-medium text-gray-900">{{ customerName }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Report ID:</span>
              <span class="font-mono text-xs bg-gray-200 px-2 py-1 rounded">{{ installationId }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Status:</span>
              <span class="px-2 py-1 rounded-full text-xs font-medium" :class="getStatusColor(reportStatus)">
                {{ reportStatus || 'Unknown' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-600">MAC Address:</span>
              <span class="font-mono text-xs">{{ macAddress || 'Not available' }}</span>
            </div>
          </div>
        </div>

        <!-- Confirmation Checkbox -->
        <div class="mb-6">
          <label class="flex items-start cursor-pointer">
            <UCheckbox 
              v-model="confirmationChecked" 
              class="mt-1"
              :disabled="deleting"
              color="red"
            />
            <span class="ml-3 text-sm text-gray-700 leading-relaxed">
              I understand that this action will <strong class="text-red-600">permanently delete</strong> the installation report for 
              <strong>"{{ customerName }}"</strong> and all associated data. This action <strong class="text-red-600">cannot be undone</strong>.
            </span>
          </label>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row justify-end gap-3">
          <UButton
            @click="closeModal"
            color="gray"
            variant="outline"
            size="lg"
            :disabled="deleting"
            class="w-full sm:w-auto"
          >
            <UIcon name="i-lucide-x" class="mr-2" />
            Cancel
          </UButton>
          <UButton
            @click="confirmDelete"
            color="red"
            variant="solid"
            size="lg"
            :loading="deleting"
            :disabled="!confirmationChecked"
            class="w-full sm:w-auto bg-red-600 hover:bg-red-700"
          >
            <UIcon name="i-lucide-trash-2" class="mr-2" />
            {{ deleting ? 'Deleting...' : 'Delete Installation Report' }}
          </UButton>
        </div>
      </div>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { customerAdminApi } from '@/api/admin/customer'

interface Props {
  isOpen: boolean
  installationId: string
  customerName: string
  reportStatus?: string
  macAddress?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'deleted'): void
  (e: 'update:isOpen', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const loading = ref(false)
const deleting = ref(false)
const confirmationChecked = ref(false)

// Watch for modal open to reset state
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    confirmationChecked.value = false
    deleting.value = false
    loading.value = false
  }
})

function closeModal() {
  emit('close')
}

async function confirmDelete() {
  if (!props.installationId || !confirmationChecked.value || deleting.value) return
  
  deleting.value = true
  
  try {
    await customerAdminApi().deleteInstallationReport(props.installationId)
    
    // Show success notification
    useToast().add({
      title: 'Success!',
      description: `Installation report for "${props.customerName}" deleted successfully. MAC address status updated to "in_stock".`,
      color: 'green',
    })
    
    emit('deleted')
    closeModal()
  } catch (err: any) {
    console.error("Error deleting installation report:", err)
    
    // Show error notification
    useToast().add({
      title: 'Error',
      description: err.message || 'Failed to delete installation report',
      color: 'red',
    })
  } finally {
    deleting.value = false
  }
}

function getStatusColor(status: string | undefined) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    case 'cancelled':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
</script>
