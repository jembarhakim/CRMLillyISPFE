<template>
  <UModal :model-value="isOpen" @update:model-value="$emit('update:isOpen', $event)" :ui="{ width: 'w-full sm:max-w-md' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-white">Delete Customer</h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="closeModal"
          />
        </div>
      </template>

      <div v-if="loading" class="text-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl mx-auto mb-4" />
        <p class="text-gray-600">Loading customer data...</p>
      </div>

      <div v-else-if="error" class="text-center py-8">
        <UIcon name="i-heroicons-exclamation-triangle" class="text-red-500 text-2xl mx-auto mb-4" />
        <p class="text-red-600 mb-4">{{ error }}</p>
        <UButton @click="closeModal" color="gray">Close</UButton>
      </div>

      <div v-else>
        <!-- Customer Information -->
        <div class="mb-6">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <UIcon name="i-heroicons-user" class="text-red-600 text-2xl" />
            </div>
            <div>
              <h4 class="text-lg font-semibold text-white">{{ customerName }}</h4>
              <p class="text-sm text-white">{{ customerPhone }}</p>
            </div>
          </div>
        </div>

        <!-- Warning Message -->
        <div class="bg-red-50 border border-red-200 rounded-lg p-5 mb-6">
          <div class="flex items-start">
            <UIcon name="i-heroicons-exclamation-triangle" class="text-red-500 text-xl mr-3 mt-0.5" />
            <div>
              <h5 class="text-red-800 font-semibold mb-2">Warning: This action cannot be undone!</h5>
              <p class="text-red-900 text-sm leading-relaxed">
                You are about to permanently delete this customer and all associated data.
                This action will remove all related records including installations, invoices, and other data.
              </p>
            </div>
          </div>
        </div>

        <!-- Related Records Summary -->
        <div v-if="relatedRecords && Object.keys(relatedRecords).length > 0" class="mb-6">
          <h5 class="text-sm font-semibold text-gray-900 mb-3">Related Records That Will Be Deleted:</h5>
          <div class="grid grid-cols-2 gap-3">
            <div v-if="relatedRecords.invoices > 0" class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div class="flex items-center">
                <UIcon name="i-heroicons-document-text" class="text-red-500 mr-2" />
                <span class="text-sm font-medium text-gray-900">Invoices</span>
              </div>
              <span class="text-sm font-bold text-red-600">{{ relatedRecords.invoices }}</span>
            </div>
            
            <div v-if="relatedRecords.installations > 0" class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div class="flex items-center">
                <UIcon name="i-heroicons-wrench-screwdriver" class="text-red-500 mr-2" />
                <span class="text-sm font-medium text-gray-900">Installations</span>
              </div>
              <span class="text-sm font-bold text-red-600">{{ relatedRecords.installations }}</span>
            </div>
            
            <div v-if="relatedRecords.network_devices > 0" class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div class="flex items-center">
                <UIcon name="i-heroicons-cpu-chip" class="text-red-500 mr-2" />
                <span class="text-sm font-medium text-gray-900">Network Devices</span>
              </div>
              <span class="text-sm font-bold text-red-600">{{ relatedRecords.network_devices }}</span>
            </div>
            
            <div v-if="relatedRecords.customer_services > 0" class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div class="flex items-center">
                <UIcon name="i-heroicons-cog-6-tooth" class="text-red-500 mr-2" />
                <span class="text-sm font-medium text-gray-900">Services</span>
              </div>
              <span class="text-sm font-bold text-red-600">{{ relatedRecords.customer_services }}</span>
            </div>
            
            <div v-if="relatedRecords.asset_transactions > 0" class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div class="flex items-center">
                <UIcon name="i-heroicons-currency-dollar" class="text-red-500 mr-2" />
                <span class="text-sm font-medium text-gray-900">Asset Transactions</span>
              </div>
              <span class="text-sm font-bold text-red-600">{{ relatedRecords.asset_transactions }}</span>
            </div>
            
            <div v-if="relatedRecords.cables > 0" class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div class="flex items-center">
                <UIcon name="i-heroicons-cable" class="text-red-500 mr-2" />
                <span class="text-sm font-medium text-gray-900">Cables</span>
              </div>
              <span class="text-sm font-bold text-red-600">{{ relatedRecords.cables }}</span>
            </div>
            
            <div v-if="relatedRecords.images > 0" class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div class="flex items-center">
                <UIcon name="i-heroicons-photo" class="text-red-500 mr-2" />
                <span class="text-sm font-medium text-gray-900">Images</span>
              </div>
              <span class="text-sm font-bold text-red-600">{{ relatedRecords.images }}</span>
            </div>
          </div>
        </div>

        <!-- Confirmation Checkbox -->
        <div class="mb-6">
          <label class="flex items-start">
            <UCheckbox v-model="confirmationChecked" class="mt-1" />
            <span class="ml-3 text-sm text-white leading-relaxed">
              I understand that this action will permanently delete the customer and all associated data.
              This action cannot be undone.
            </span>
          </label>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-4">
          <UButton
            @click="closeModal"
            color="gray"
            variant="outline"
            :disabled="deleting"
          >
            Cancel
          </UButton>
          <UButton
            @click="confirmDelete"
            color="red"
            :loading="deleting"
            :disabled="!confirmationChecked"
          >
            <UIcon name="i-heroicons-trash" class="mr-2" />
            Delete Customer
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
  customerId: string | null
  customerName: string
  customerPhone: string
}

interface Emits {
  (e: 'close'): void
  (e: 'deleted'): void
  (e: 'update:isOpen', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const loading = ref(false)
const error = ref<string | null>(null)
const relatedRecords = ref<Record<string, number> | null>(null)
const confirmationChecked = ref(false)
const deleting = ref(false)

// Watch for modal open to load related records
watch(() => props.isOpen, async (newValue) => {
  if (newValue && props.customerId) {
    await loadRelatedRecords()
  } else {
    // Reset state when modal closes
    confirmationChecked.value = false
    relatedRecords.value = null
    error.value = null
  }
})

async function loadRelatedRecords() {
  if (!props.customerId) return
  
  loading.value = true
  error.value = null
  
  try {
    const response = await customerAdminApi().getCustomerRelatedRecords(props.customerId)
    relatedRecords.value = response.data
  } catch (err: any) {
    error.value = err.message || 'Failed to load customer data'
  } finally {
    loading.value = false
  }
}

function closeModal() {
  emit('close')
}

async function confirmDelete() {
  if (!props.customerId || !confirmationChecked.value) return
  
  deleting.value = true
  
  try {
    await customerAdminApi().deleteCustomerWithRelated(props.customerId)
    
    useToast().add({
      title: 'Success',
      description: 'Customer and all related records have been deleted successfully',
      color: 'green'
    })
    
    emit('deleted')
    closeModal()
  } catch (err: any) {
    useToast().add({
      title: 'Error',
      description: err.message || 'Failed to delete customer',
      color: 'red'
    })
  } finally {
    deleting.value = false
  }
}
</script>
