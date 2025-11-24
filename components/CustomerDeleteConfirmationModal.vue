<template>
  <UModal :model-value="isOpen" @update:model-value="$emit('update:isOpen', $event)" :ui="{ width: 'w-full sm:max-w-md' }">
    <UCard 
      class="delete-customer-modal"
      :ui="{ 
        background: 'bg-white', 
        body: { background: 'bg-white' }, 
        header: { background: 'bg-white' },
        base: 'bg-white'
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-black">Delete Customer</h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="x"
            @click="closeModal"
          />
        </div>
      </template>

      <div v-if="loading" class="text-center py-8">
        <UIcon name="refresh-cw" class="animate-spin text-2xl mx-auto mb-4 text-black" />
        <p class="text-black">Loading customer data...</p>
      </div>

      <div v-else-if="error" class="text-center py-8">
        <UIcon name="alert-triangle" class="text-red-500 text-2xl mx-auto mb-4" />
        <p class="text-red-600 mb-4">{{ error }}</p>
        <UButton @click="closeModal" color="gray">Close</UButton>
      </div>

      <div v-else>
        <!-- Customer Information -->
        <div class="mb-6">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <User class="text-red-600" :size="32" />
            </div>
            <div>
              <h4 class="text-lg font-semibold text-black">{{ customerName }}</h4>
              <p class="text-sm text-black">{{ customerPhone }}</p>
            </div>
          </div>
        </div>

        <!-- Warning Message -->
        <div class="warning-text bg-red-50 border border-red-200 rounded-lg p-5 mb-6">
          <div class="flex items-start">
            <UIcon name="alert-triangle" class="text-red-500 text-xl mr-3 mt-0.5" />
            <div>
              <h5 class="warning-text font-semibold mb-2">Warning: This action cannot be undone!</h5>
              <p class="warning-text text-sm leading-relaxed">
                You are about to permanently delete this customer and all associated data.
                This action will remove all related records including installations, invoices, and other data.
              </p>
            </div>
          </div>
        </div>

        <!-- Installation Reports Warning -->
        <div v-if="relatedRecords && relatedRecords.installations > 0" class="mb-6">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex items-start">
              <UIcon name="x-circle" class="text-red-500 text-xl mr-3 mt-0.5" />
              <div>
                <h5 class="warning-text font-semibold mb-2">🚫 Cannot Delete Customer</h5>
                <p class="warning-text text-sm leading-relaxed mb-3">
                  This customer has <strong>{{ relatedRecords.installations }} installation report(s)</strong> that must be deleted first.
                  <strong>Customer deletion is blocked</strong> to prevent data loss.
                </p>
                <div class="bg-red-100 border border-red-300 rounded-lg p-3 mt-3">
                  <p class="warning-text text-sm font-semibold mb-2">Required Action:</p>
                  <ol class="warning-text text-sm list-decimal list-inside space-y-1">
                    <li>Go to the "Installation Reports" page</li>
                    <li>Delete all installation reports for this customer</li>
                    <li>Return here to delete the customer</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Related Records Summary -->
        <div v-if="relatedRecords && Object.keys(relatedRecords).length > 0" class="mb-6">
          <h5 class="text-sm font-semibold text-black mb-3">Related Records That Will Be Deleted:</h5>
          <div class="grid grid-cols-2 gap-3">
            <div v-if="relatedRecords.invoices > 0" class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div class="flex items-center">
                <UIcon name="file-text" class="text-red-500 mr-2" />
                <span class="text-sm font-medium text-black">Invoices</span>
              </div>
              <span class="text-sm font-bold text-red-600">{{ relatedRecords.invoices }}</span>
            </div>
            
            <div v-if="relatedRecords.installations > 0" class="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div class="flex items-center">
                <UIcon name="wrench-screwdriver" class="text-orange-500 mr-2" />
                <span class="text-sm font-medium text-black">Installation Reports</span>
              </div>
              <span class="text-sm font-bold text-orange-600">{{ relatedRecords.installations }}</span>
            </div>
            
            <div v-if="relatedRecords.network_devices > 0" class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div class="flex items-center">
                <UIcon name="cpu-chip" class="text-red-500 mr-2" />
                <span class="text-sm font-medium text-black">Network Devices</span>
              </div>
              <span class="text-sm font-bold text-red-600">{{ relatedRecords.network_devices }}</span>
            </div>
            
            <div v-if="relatedRecords.customer_services > 0" class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div class="flex items-center">
                <UIcon name="settings-6-tooth" class="text-red-500 mr-2" />
                <span class="text-sm font-medium text-black">Services</span>
              </div>
              <span class="text-sm font-bold text-red-600">{{ relatedRecords.customer_services }}</span>
            </div>
            
            <div v-if="relatedRecords.asset_transactions > 0" class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div class="flex items-center">
                <UIcon name="dollar-sign" class="text-red-500 mr-2" />
                <span class="text-sm font-medium text-black">Asset Transactions</span>
              </div>
              <span class="text-sm font-bold text-red-600">{{ relatedRecords.asset_transactions }}</span>
            </div>
            
            <div v-if="relatedRecords.cables > 0" class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div class="flex items-center">
                <UIcon name="cable" class="text-red-500 mr-2" />
                <span class="text-sm font-medium text-black">Cables</span>
              </div>
              <span class="text-sm font-bold text-red-600">{{ relatedRecords.cables }}</span>
            </div>
            
            <div v-if="relatedRecords.images > 0" class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div class="flex items-center">
                <UIcon name="photo" class="text-red-500 mr-2" />
                <span class="text-sm font-medium text-black">Images</span>
              </div>
              <span class="text-sm font-bold text-red-600">{{ relatedRecords.images }}</span>
            </div>
          </div>
        </div>

        <!-- Confirmation Checkbox -->
        <div class="mb-6">
          <label class="flex items-start">
            <UCheckbox 
              v-model="confirmationChecked" 
              class="mt-1 custom-checkbox" 
              :disabled="!!(relatedRecords && relatedRecords.installations > 0)"
            />
            <span class="ml-3 text-sm text-black leading-relaxed" :class="(!!(relatedRecords && relatedRecords.installations > 0)) && 'opacity-50'">
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
            class="cancel-btn"
          >
            Cancel
          </UButton>
          <UButton
            @click="confirmDelete"
            color="red"
            :loading="deleting"
            :disabled="!confirmationChecked || !!(relatedRecords && relatedRecords.installations > 0)"
            class="delete-btn"
          >
            <Trash class="mr-2" :size="18" />
            {{ (relatedRecords && relatedRecords.installations > 0) ? 'Blocked (Installation Reports)' : 'Delete Customer' }}
          </UButton>
        </div>
      </div>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { customerAdminApi } from '@/api/admin/customer'
import { User, Trash } from 'lucide-vue-next'

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
    
    useAppToast().add({
      title: 'Success',
      description: 'Customer and all related records have been deleted successfully',
      color: 'green'
    })
    
    emit('deleted')
    closeModal()
  } catch (err: any) {
    useAppToast().add({
      title: 'Error',
      description: err.message || 'Failed to delete customer',
      color: 'red'
    })
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.delete-customer-modal {
  background-color: #ffffff !important;
  color: #000000 !important;
}

/* Ensure UCard component has white background */
.delete-customer-modal :deep([class*="bg-"]:not([class*="bg-red"]):not([class*="bg-orange"])) {
  background-color: #ffffff !important;
}

/* Ensure UCard header and body sections have white background */
.delete-customer-modal :deep(header),
.delete-customer-modal :deep([role="dialog"]),
.delete-customer-modal :deep(.bg-white),
.delete-customer-modal :deep(.bg-gray-50),
.delete-customer-modal :deep(.bg-gray-100),
.delete-customer-modal :deep(.bg-gray-200),
.delete-customer-modal :deep(.bg-dark),
.delete-customer-modal :deep(.bg-gray-800),
.delete-customer-modal :deep(.bg-gray-900) {
  background-color: #ffffff !important;
}

/* Preserve red and orange warning backgrounds */
.delete-customer-modal :deep(.bg-red-50),
.delete-customer-modal :deep(.bg-red-100),
.delete-customer-modal :deep(.bg-orange-50) {
  background-color: inherit !important;
}

/* All text elements should be black */
.delete-customer-modal h3,
.delete-customer-modal h4,
.delete-customer-modal h5,
.delete-customer-modal p,
.delete-customer-modal label {
  color: #000000 !important;
}

.delete-customer-modal span:not(.warning-text):not([class*="text-red"]):not([class*="text-orange"]) {
  color: #000000 !important;
}

/* Warning text stays red */
.delete-customer-modal .warning-text {
  color: #d32f2f !important;
}

.delete-customer-modal .warning-text strong {
  color: #d32f2f !important;
}

/* Button styling */
.delete-customer-modal .cancel-btn {
  background-color: #e0e0e0 !important;
  color: #000000 !important;
  transition: all 0.2s ease-in-out !important;
}

.delete-customer-modal .cancel-btn:hover:not(:disabled) {
  background-color: #d0d0d0 !important;
  color: #000000 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

.delete-customer-modal .cancel-btn:active:not(:disabled) {
  transform: translateY(0) !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
}

.delete-customer-modal .delete-btn {
  background-color: #d32f2f !important;
  color: #ffffff !important;
  transition: all 0.2s ease-in-out !important;
}

.delete-customer-modal .delete-btn:hover:not(:disabled) {
  background-color: #b91c1c !important;
  color: #ffffff !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(211, 47, 47, 0.3) !important;
}

.delete-customer-modal .delete-btn:active:not(:disabled) {
  transform: translateY(0) !important;
  box-shadow: 0 2px 4px rgba(211, 47, 47, 0.3) !important;
  background-color: #991b1b !important;
}

/* Ensure all gray and white text variants are black */
.delete-customer-modal :deep(.text-gray-900),
.delete-customer-modal :deep(.text-gray-800),
.delete-customer-modal :deep(.text-gray-700),
.delete-customer-modal :deep(.text-gray-600),
.delete-customer-modal :deep(.text-gray-500),
.delete-customer-modal :deep(.text-white) {
  color: #000000 !important;
}

/* Preserve red and orange text colors for icons and counts */
.delete-customer-modal :deep(.text-red-500),
.delete-customer-modal :deep(.text-red-600),
.delete-customer-modal :deep(.text-orange-500),
.delete-customer-modal :deep(.text-orange-600) {
  color: inherit !important;
}

/* Custom Checkbox Styling */
/* Target the actual input checkbox element */
.delete-customer-modal .custom-checkbox :deep(input[type="checkbox"]) {
  border-color: #000000 !important;
  border-width: 2px !important;
  background-color: #ffffff !important;
  accent-color: #dc2626 !important;
}

.delete-customer-modal .custom-checkbox :deep(input[type="checkbox"]:checked) {
  background-color: #dc2626 !important;
  border-color: #dc2626 !important;
  accent-color: #dc2626 !important;
}

/* For Nuxt UI Checkbox wrapper and checkmark */
.delete-customer-modal .custom-checkbox :deep([class*="ui-checkbox"]),
.delete-customer-modal .custom-checkbox :deep([class*="UCheckbox"]) {
  border-color: #000000 !important;
}

.delete-customer-modal .custom-checkbox :deep([class*="ui-checkbox"] input:checked),
.delete-customer-modal .custom-checkbox :deep([class*="UCheckbox"] input:checked) {
  background-color: #dc2626 !important;
  border-color: #dc2626 !important;
}

/* Target checkmark SVG icon - Nuxt UI uses SVG for checkmark */
.delete-customer-modal .custom-checkbox :deep(svg),
.delete-customer-modal .custom-checkbox :deep([class*="ui-checkbox"] svg),
.delete-customer-modal .custom-checkbox :deep([class*="UCheckbox"] svg) {
  color: #ffffff !important;
  stroke: #ffffff !important;
  fill: #ffffff !important;
}

.delete-customer-modal .custom-checkbox :deep(input[type="checkbox"]:checked ~ svg),
.delete-customer-modal .custom-checkbox :deep(input[type="checkbox"]:checked + svg),
.delete-customer-modal .custom-checkbox :deep([class*="ui-checkbox"] input:checked ~ svg),
.delete-customer-modal .custom-checkbox :deep([class*="UCheckbox"] input:checked ~ svg) {
  color: #ffffff !important;
  stroke: #ffffff !important;
  fill: #ffffff !important;
}

/* Target checkmark using ::before and ::after pseudo-elements */
.delete-customer-modal .custom-checkbox :deep(input[type="checkbox"]:checked::before),
.delete-customer-modal .custom-checkbox :deep(input[type="checkbox"]:checked::after) {
  color: #ffffff !important;
  border-color: #ffffff !important;
}

/* Alternative: Target any element that represents the checkmark */
.delete-customer-modal .custom-checkbox :deep([class*="checkmark"]),
.delete-customer-modal .custom-checkbox :deep([class*="icon-check"]) {
  color: #ffffff !important;
  stroke: #ffffff !important;
  fill: #ffffff !important;
}

/* Ensure checkbox wrapper has proper styling */
.delete-customer-modal .custom-checkbox :deep(div[class*="checkbox"]),
.delete-customer-modal .custom-checkbox :deep(span[class*="checkbox"]) {
  border-color: #000000 !important;
}

.delete-customer-modal .custom-checkbox :deep(div[class*="checkbox"] input:checked),
.delete-customer-modal .custom-checkbox :deep(span[class*="checkbox"] input:checked) {
  background-color: #dc2626 !important;
  border-color: #dc2626 !important;
}

/* Ensure checkbox is visible when disabled */
.delete-customer-modal .custom-checkbox :deep(input[type="checkbox"]:disabled) {
  opacity: 0.5 !important;
  border-color: #666666 !important;
  background-color: #f5f5f5 !important;
}

.delete-customer-modal .custom-checkbox :deep(input[type="checkbox"]:disabled:checked) {
  background-color: #dc2626 !important;
  border-color: #dc2626 !important;
  opacity: 0.5 !important;
}

.delete-customer-modal .custom-checkbox :deep(input[type="checkbox"]:disabled:checked ~ svg),
.delete-customer-modal .custom-checkbox :deep(input[type="checkbox"]:disabled:checked + svg) {
  color: #ffffff !important;
  stroke: #ffffff !important;
  fill: #ffffff !important;
  opacity: 0.5 !important;
}

/* Additional aggressive styling for checkmark visibility */
.delete-customer-modal .custom-checkbox :deep(*[class*="checked"] svg),
.delete-customer-modal .custom-checkbox :deep(*[data-checked="true"] svg),
.delete-customer-modal .custom-checkbox :deep(*[aria-checked="true"] svg) {
  color: #ffffff !important;
  stroke: #ffffff !important;
  fill: #ffffff !important;
}

/* Force white checkmark on any checked state */
.delete-customer-modal .custom-checkbox :deep(input:checked) ~ * svg,
.delete-customer-modal .custom-checkbox :deep(input:checked) + * svg,
.delete-customer-modal .custom-checkbox :deep(input:checked) ~ svg,
.delete-customer-modal .custom-checkbox :deep(input:checked) + svg {
  color: #ffffff !important;
  stroke: #ffffff !important;
  fill: #ffffff !important;
}

/* Ensure all paths and lines in SVG checkmark are white when checked */
.delete-customer-modal .custom-checkbox :deep(input[type="checkbox"]:checked ~ svg path),
.delete-customer-modal .custom-checkbox :deep(input[type="checkbox"]:checked + svg path),
.delete-customer-modal .custom-checkbox :deep(input[type="checkbox"]:checked ~ svg line),
.delete-customer-modal .custom-checkbox :deep(input[type="checkbox"]:checked + svg line),
.delete-customer-modal .custom-checkbox :deep(input[type="checkbox"]:checked ~ svg polyline),
.delete-customer-modal .custom-checkbox :deep(input[type="checkbox"]:checked + svg polyline),
.delete-customer-modal .custom-checkbox :deep([class*="ui-checkbox"] input:checked ~ svg path),
.delete-customer-modal .custom-checkbox :deep([class*="UCheckbox"] input:checked ~ svg path) {
  stroke: #ffffff !important;
  fill: #ffffff !important;
}

/* When checkbox is checked, ensure all child SVG elements show white checkmark */
.delete-customer-modal .custom-checkbox :deep(input[type="checkbox"]:checked ~ svg *),
.delete-customer-modal .custom-checkbox :deep(input[type="checkbox"]:checked + svg *),
.delete-customer-modal .custom-checkbox :deep([class*="ui-checkbox"] input:checked ~ svg *),
.delete-customer-modal .custom-checkbox :deep([class*="UCheckbox"] input:checked ~ svg *) {
  stroke: #ffffff !important;
  fill: #ffffff !important;
  color: #ffffff !important;
}
</style>
