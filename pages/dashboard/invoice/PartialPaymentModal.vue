<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')"></div>

      <!-- Modal panel -->
      <div class="inline-block overflow-hidden text-left align-bottom bg-white rounded-lg shadow-xl transition-all transform sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <!-- Header -->
        <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">Partial Payment</h3>
            <button
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="px-6 py-4">
          <!-- Invoice Information -->
          <div class="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 class="font-medium text-gray-900 mb-2">Invoice Details</h4>
            <div class="space-y-1 text-sm text-gray-600">
              <div class="flex justify-between">
                <span>Invoice ID:</span>
                <span class="font-mono">{{ invoice.id }}</span>
              </div>
              <div class="flex justify-between">
                <span>Total Amount:</span>
                <span class="font-medium">{{ formatIDR(invoice.amount) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Total Paid:</span>
                <span class="font-medium">{{ formatIDR(totalPaid) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Outstanding:</span>
                <span class="font-medium text-red-600">{{ formatIDR(outstandingAmount) }}</span>
              </div>
            </div>
          </div>

          <!-- Payment Form -->
          <form @submit.prevent="submitPayment">
            <div class="mb-4">
              <label for="amount" class="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                <input
                  id="amount"
                  v-model="paymentAmount"
                  type="number"
                  min="1"
                  :max="outstandingAmount"
                  class="block w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter payment amount"
                  required
                />
              </div>
              <p class="mt-1 text-xs text-gray-500">
                Maximum: {{ formatIDR(outstandingAmount) }}
              </p>
            </div>

            <!-- Error Message -->
            <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p class="text-sm text-red-600">{{ errorMessage }}</p>
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="$emit('close')"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="loading || !paymentAmount || paymentAmount > outstandingAmount"
                class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="loading">Processing...</span>
                <span v-else>Submit Payment</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatIDR } from '@/helper/currency'
import { invoiceAdminApi } from '@/api/admin/invoice'

interface Props {
  invoice: {
    id: string
    amount: number
    status: string
    transaction?: {
      amount: number
    }
  }
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'success'])

const paymentAmount = ref<number>()
const loading = ref(false)
const errorMessage = ref('')

// Calculate total paid from existing transactions
const totalPaid = computed(() => {
  // Backend provides a single transaction object with total amount
  return props.invoice.transaction?.amount || 0
})

// Calculate outstanding amount
const outstandingAmount = computed(() => {
  return props.invoice.amount - totalPaid.value
})

const submitPayment = async () => {
  if (!paymentAmount.value || paymentAmount.value <= 0) {
    errorMessage.value = 'Please enter a valid payment amount'
    return
  }

  if (paymentAmount.value > outstandingAmount.value) {
    errorMessage.value = 'Payment amount cannot exceed outstanding balance'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    await invoiceAdminApi().processPartialPayment(props.invoice.id, paymentAmount.value)
    
    // success kept silent here; parent refreshes and can notify if needed
    
    emit('success')
    emit('close')
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to process payment'
  } finally {
    loading.value = false
  }
}
</script>