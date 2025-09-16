<script setup lang="ts">
// Define props
const props = defineProps<{
  customers: any[];
  onSelect: (customer: any) => void;
  onClose: () => void;
}>();

const searchQuery = ref('');
const selectedCustomer = ref<any>(null);

// Filter customers based on search query
const filteredCustomers = computed(() => {
  if (!searchQuery.value) {
    return props.customers;
  }
  
  return props.customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    customer.phone.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Handle customer selection
function selectCustomer(customer: any) {
  selectedCustomer.value = customer;
  props.onSelect(customer);
}

// Handle modal close
function closeModal() {
  props.onClose();
}
</script>

<template>
  <UModal>
    <div class="p-6 max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Select Customer for Installation
        </h2>
        <UButton 
          color="gray" 
          variant="ghost" 
          icon="i-heroicons-x-mark"
          @click="closeModal"
        />
      </div>

      <!-- Search -->
      <div class="mb-4">
        <UInput 
          v-model="searchQuery" 
          placeholder="Search customers by name, email, or phone..."
          icon="i-heroicons-magnifying-glass"
          class="w-full"
        />
      </div>

      <!-- Customer List -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="filteredCustomers.length === 0" class="text-center py-8">
          <div class="text-gray-500 dark:text-gray-400">
            <UIcon name="i-heroicons-user-group" class="w-12 h-12 mx-auto mb-4" />
            <p>No customers found</p>
            <p class="text-sm">Try adjusting your search criteria</p>
          </div>
        </div>

        <div v-else class="grid gap-3">
          <div 
            v-for="customer in filteredCustomers" 
            :key="customer.id"
            class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            @click="selectCustomer(customer)"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
                  {{ customer.name }}
                </h3>
                <div class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div class="flex items-center">
                    <UIcon name="i-heroicons-envelope" class="w-4 h-4 mr-2" />
                    {{ customer.email }}
                  </div>
                  <div class="flex items-center">
                    <UIcon name="i-heroicons-phone" class="w-4 h-4 mr-2" />
                    {{ customer.phone }}
                  </div>
                  <div class="flex items-center">
                    <UIcon name="i-heroicons-map-pin" class="w-4 h-4 mr-2" />
                    {{ customer.address }}
                  </div>
                  <div v-if="customer.product" class="flex items-center">
                    <UIcon name="i-heroicons-wifi" class="w-4 h-4 mr-2" />
                    {{ customer.product.name }} - {{ customer.product.price ? `Rp ${customer.product.price.toLocaleString()}` : 'N/A' }}
                  </div>
                </div>
              </div>
              <div class="ml-4">
                <UButton 
                  color="green" 
                  size="sm"
                  icon="i-heroicons-plus"
                >
                  Select
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <UButton 
          color="gray" 
          variant="outline"
          @click="closeModal"
        >
          Cancel
        </UButton>
      </div>
    </div>
  </UModal>
</template>
