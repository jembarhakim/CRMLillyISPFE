<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { object, string, type InferType } from "yup";
import type { FormSubmitEvent } from "#ui/types";
import { customerAdminApi } from "@/api/admin/customer";
import { invoiceAdminApi } from "@/api/admin/invoice";
import { internetPackageAdminApi } from "@/api/admin/internet-package";
import { useNotification } from '@/composables/useNotification';

const props = defineProps({
  isEdit: {
    type: Boolean,
    required: false,
  },
  data: {
    type: Object,
    default: () => ({
      customer_id: {
        type: String,
        default: "",
      },
      amount: {
        type: String,
        default: "",
      },
    }),
  },
});
const notification = useNotification();
const loadingProduct = ref(false);

const schema = object({
  customer_id: string().required("Customer is required"),
  amount: string().required("Amount is required"),
});

type Schema = InferType<typeof schema>;

const state = reactive({
  customer_id: "",
  amount: 0,
  invoice_items: [
    {
      name: "",
      qty: 1,
      price: 0,
      total: 0,
    },
  ],
});

type InvoiceItem = {
  name: string;
  qty: number;
  price: number;
  total: number;
};

function addItem() {
  state.invoice_items.push({
    name: "",
    qty: 1,
    price: 0,
    total: 0,
  });
  // Recalculate total amount when adding new item
  state.amount = state.invoice_items.reduce((acc: number, item: InvoiceItem) => acc + item.total, 0);
}
function removeItem(index: number) {
  state.invoice_items.splice(index, 1);
  // Recalculate total amount when removing item
  state.amount = state.invoice_items.reduce((acc: number, item: InvoiceItem) => acc + item.total, 0);
}
function updateTotal(index: number) {
  const item = state.invoice_items[index];
  state.invoice_items[index] = {
    ...item,
    total: item.qty * item.price,
  };

  // Always recalculate the total amount from all items
  state.amount = state.invoice_items.reduce((acc: number, item: InvoiceItem) => acc + item.total, 0);
  console.log(`Item ${index + 1} total:`, state.invoice_items[index].total);
  console.log('Total amount:', state.amount);
}

watch(
  () => props.isEdit,
  (newValue: boolean) => {
    if (newValue) {
      state.customer_id = props.data.customer_id || "";
      state.amount = props.data.amount || 0;
    }
  },
  { immediate: true }
);
const emit = defineEmits(["success"]);

function onSuccess() {
  emit("success");
}

const isSubmitting = ref(false);
const lastSubmitTime = ref(0);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  console.log('🚀 onSubmit called, isSubmitting:', isSubmitting.value);
  
  // Prevent double submission
  if (isSubmitting.value) {
    console.log('❌ Already submitting, preventing double submission');
    return;
  }
  
  // Prevent rapid successive submissions (within 2 seconds)
  const now = Date.now();
  if (now - lastSubmitTime.value < 2000) {
    console.log('❌ Too soon since last submission, preventing rapid submission');
    return;
  }
  
  isSubmitting.value = true;
  lastSubmitTime.value = now;
  console.log('✅ Set isSubmitting to true, proceeding with submission');
  
  try {
    // Validate required fields
    if (!state.customer_id) {
      throw new Error("Customer is required");
    }
    if (!state.invoice_items || state.invoice_items.length === 0) {
      throw new Error("At least one invoice item is required");
    }
    
    // Validate invoice items
    for (let i = 0; i < state.invoice_items.length; i++) {
      const item = state.invoice_items[i];
      if (!item.name || !item.price || !item.qty) {
        throw new Error(`Item ${i + 1} is missing required fields (name, price, or quantity)`);
      }
      
      // For collaborator customers, validate that custom product names are not empty
      if (customerFilter.value === 'collaborator' && (!item.name || item.name.trim() === '')) {
        throw new Error(`Item ${i + 1} product name cannot be empty for collaborator customers`);
      }
    }
    
    // Prepare data for API
    const submitData = {
      customer_id: state.customer_id,
      amount: state.amount,
      invoice_items: state.invoice_items.map((item: InvoiceItem) => ({
        name: item.name,
        price: item.price,
        qty: item.qty,
        total: item.total
      }))
    };
    
    console.log("Submitting invoice data:", submitData);
    
    if (props.isEdit) {
      console.log('📝 Editing invoice...');
      const response = await invoiceAdminApi().editInvoice(props.data.id, submitData);
      if (!response?.success) {
        console.log('❌ Edit failed:', response?.message);
        useToast().add({ title: 'MikroTik Error', description: response?.message || 'Scheduler update failed', color: 'red' })
        return
      }
      console.log('✅ Edit successful:', response.message);
      useToast().add({ title: 'Success', description: response.message || 'Invoice updated successfully', color: 'green' })
    } else {
      console.log('🆕 Creating invoice...');
      const response = await invoiceAdminApi().createInvoice(submitData);
      if (!response?.success) {
        console.log('❌ Create failed:', response?.message);
        useToast().add({ title: 'MikroTik Error', description: response?.message || 'Scheduler update failed', color: 'red' })
        return
      }
      console.log('✅ Create successful:', response.message);
      useToast().add({ title: 'Success', description: response.message || 'Invoice created successfully', color: 'green' })
    }
    
    console.log('🎉 Calling onSuccess()');
    onSuccess();
  } catch (error: any) {
    console.error("❌ Invoice submission error:", error);
    notification.error('Error', error.message || 'Failed to save invoice');
  } finally {
    console.log('🔄 Resetting isSubmitting to false');
    isSubmitting.value = false;
  }
}

type CustomerOption = {
  label: string;
  value: string;
  customerData: any;
};

const customer = ref<CustomerOption[]>([]);
const searchOptions = ref<string[]>([]);
const productOptions = ref<string[]>([]);
const productOptionsD = ref<Array<{ id: string; label: string; value: string; price: number }>>([]);
const selectedCustomerDetail = ref<any>(null);
const customerFilter = ref<'all' | 'internet' | 'collaborator'>('collaborator');

async function getDataOptions() {
  try {
    let response;
    if (customerFilter.value === 'internet') {
      response = await customerAdminApi().getAllCustomersWithFilter('yes', '');
    } else if (customerFilter.value === 'collaborator') {
      response = await customerAdminApi().getAllCustomersWithFilter('', 'yes');
    } else {
      response = await customerAdminApi().getAllCustomers();
    }
    
    // Handle null data response
    const customerData = response.data || [];
    console.log('Customer API response:', response);
    console.log('Customer data:', customerData);
    console.log('Customer filter:', customerFilter.value);
    console.log('Is collaborator filter:', customerFilter.value === 'collaborator');
    
    customer.value = customerData.map((value: any, index: number) => ({
      label: value.name,
      value: value.id,
      customerData: value // Store full customer data for reference
    }));
  } catch (error) {
    console.error('Error fetching customers:', error);
    notification.error('Error', 'Failed to load customers');
  }
}

function search(q: string): string[] {
  const data = productOptions.value.filter((option: string) =>
    option.toLowerCase().includes(q.toLowerCase())
  );
  if (data.length > 0) {
    return data;
  }

  return [q];
}

internetPackageAdminApi()
  .getAllInternetPacket()
  .then((response) => {
    productOptions.value = response.data.map((value: any, index: number) => value.name);
    productOptionsD.value = response.data.map((value: any, index: number) => ({
      id: value.id,
      label: value.name,
      value: value.name,
      price: value.price,
    }));
  })
  .finally(() => {
    loadingProduct.value = false;
  });
getDataOptions();

function checkProductIsExist(name: string, index: number): void {
  const product = productOptionsD.value.find((option: { id: string; label: string; value: string; price: number }) => option.label === name);
  if (product) {
    const item = state.invoice_items[index];
    state.invoice_items[index] = {
      ...item,
      price: product.price,
    };
  }
}

function handleFilterChange(filter: 'all' | 'internet' | 'collaborator') {
  customerFilter.value = filter;
  
  // If internet customers are selected, redirect to recurring invoice
  if (filter === 'internet') {
    notification.info('Redirecting', 'Internet customers should use recurring invoice. Redirecting to recurring invoice page...');
    
    // Close the notification and redirect after a short delay
    setTimeout(() => {
      // Emit success to close the modal first
      emit('success');
      
      // Then navigate to recurring invoice page
      navigateTo('/dashboard/recurring-invoice');
    }, 2000); // 2 second delay to let user see the message
    return;
  }
  
  // Reset customer selection when filter changes
  state.customer_id = '';
  selectedCustomerDetail.value = null;
  
  // Reset invoice items and amount for new filter
  state.invoice_items = [{
    name: "",
    price: 0,
    qty: 1,
    total: 0
  }];
  state.amount = 0;
  
  getDataOptions();
}

// Watch for customer selection changes
watch(
  () => state.customer_id,
  async (newCustomerId: string) => {
    if (newCustomerId) {
      try {
        // Get customer detail with product information
        const response = await customerAdminApi().getCustomerDetail(newCustomerId);
        selectedCustomerDetail.value = response.data;
        
        // For collaborator customers, allow custom product names
        if (customerFilter.value === 'collaborator') {
          // Reset invoice items to allow custom input
          state.invoice_items = [{
            name: "",
            price: 0,
            qty: 1,
            total: 0
          }];
          state.amount = 0;
          
          notification.info('Info', 'For collaborator customers, you can enter custom product names');
        } else {
          // For internet customers, auto-fill product name and price for the first item
          if (selectedCustomerDetail.value.customer.product) {
            const product = selectedCustomerDetail.value.customer.product;
            
            // Reset invoice items to only have one item
            state.invoice_items = [{
              name: product.name,
              price: product.price,
              qty: 1,
              total: product.price
            }];
            
            // Update total amount
            state.amount = state.invoice_items.reduce((acc: number, item: InvoiceItem) => acc + item.total, 0);
            
            // Show success message
            notification.success('Success', `Product "${product.name}" auto-filled from customer's package`);
          } else {
            // If customer has no product, reset to empty
            state.invoice_items = [{
              name: "",
              price: 0,
              qty: 1,
              total: 0
            }];
            state.amount = 0;
            
            notification.warning('Warning', 'Customer has no product package assigned');
          }
        }
      } catch (error) {
        console.error('Failed to fetch customer detail:', error);
        notification.error('Error', 'Failed to load customer product information');
      }
    } else {
      // Reset when no customer is selected
      selectedCustomerDetail.value = null;
      state.invoice_items = [{
        name: "",
        price: 0,
        qty: 1,
        total: 0
      }];
      state.amount = 0;
    }
  }
);
</script>

<template>
  <UModal>
    <div class="w-full p-4">
      <div class="p-2 mb-4 text-2xl font-bold text-center">
        <h1>{{ props.isEdit ? "Edit" : "Add New" }} Invoice</h1>
      </div>
      
      <!-- Customer Filter Buttons -->
      <div class="mb-6">
        <div class="text-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Customer Type Selection</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Choose the type of customer for this invoice
          </p>
        </div>
        
        <div class="flex justify-center space-x-4">          
          <UButton 
            :color="customerFilter === 'internet' ? 'primary' : 'gray'" 
            :variant="customerFilter === 'internet' ? 'solid' : 'outline'"
            @click="handleFilterChange('internet')"
            class="px-6 py-2"
          >
            <UIcon name="wifi" class="w-4 h-4 mr-2" />
            INTERNET
            <UIcon name="arrow-right" class="w-4 h-4 ml-2" />
          </UButton>
          <UButton 
            :color="customerFilter === 'collaborator' ? 'primary' : 'gray'" 
            :variant="customerFilter === 'collaborator' ? 'solid' : 'outline'"
            @click="handleFilterChange('collaborator')"
            class="px-6 py-2"
          >
            <UIcon name="handshake" class="w-4 h-4 mr-2" />
            COLLABORATOR
          </UButton>
        </div>
        
        <!-- Info Panel -->
        <div class="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div class="flex items-start gap-2">
            <UIcon name="info" class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div class="text-sm text-blue-800 dark:text-blue-200">
              <p class="font-medium mb-1">Invoice Type Guidelines:</p>
              <ul class="space-y-1 text-xs">
                <li>• <strong>INTERNET customers:</strong> Use recurring invoice for subscription-based billing</li>
                <li>• <strong>COLLABORATOR customers:</strong> Use regular invoice for one-time or project-based billing</li>
                <li>• Clicking "INTERNET" will redirect you to the recurring invoice page</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormGroup label="Customer" name="customer_id">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">
                {{ customerFilter === 'all' ? 'All Customers' : customerFilter === 'internet' ? 'Internet Customers (Redirects to Recurring Invoice)' : 'Collaborator Customers Only' }}
              </span>
              <span class="text-xs text-gray-500">
                {{ customer.length }} customer{{ customer.length !== 1 ? 's' : '' }}
              </span>
            </div>
            <USelectMenu v-model="state.customer_id" :options="customer" value-attribute="value"
              option-attribute="label" />
          </div>
        </UFormGroup>
        
        <!-- Customer Product Information -->
        <div v-if="selectedCustomerDetail" class="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 class="text-lg font-medium text-blue-900 mb-3">Customer Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-blue-700">Customer Name</label>
              <p class="mt-1 text-sm text-blue-900">{{ selectedCustomerDetail.customer.name }}</p>
            </div>
            <div v-if="customerFilter === 'collaborator'">
              <label class="block text-sm font-medium text-blue-700">Customer Type</label>
              <p class="mt-1 text-sm text-blue-900">Collaborator (Custom Products)</p>
            </div>
            <div v-else>
              <label class="block text-sm font-medium text-blue-700">Product Package</label>
              <p class="mt-1 text-sm text-blue-900">{{ selectedCustomerDetail.customer.product?.name || 'No product assigned' }}</p>
            </div>
            <div v-if="customerFilter !== 'collaborator'">
              <label class="block text-sm font-medium text-blue-700">Package Price</label>
               <p class="mt-1 text-sm text-blue-900">{{ selectedCustomerDetail.customer.product_name ? `Rp ${selectedCustomerDetail.customer.product_name.toLocaleString()}` : 'No price' }}</p>
            </div>
            <div v-if="customerFilter !== 'collaborator'">
              <label class="block text-sm font-medium text-blue-700">Installation Date</label>
              <p class="mt-1 text-sm text-blue-900">{{ selectedCustomerDetail.customer.installation_date ? new Date(selectedCustomerDetail.customer.installation_date).toLocaleDateString() : 'Not installed' }}</p>
            </div>
          </div>
        </div>
        <UFormGroup label="Amount" name="amount">
          <UInput v-model="state.amount" type="number" readonly class="bg-gray-100 cursor-not-allowed" />
          <template #help>
            <span class="text-xs text-gray-500">Amount is automatically calculated from line items</span>
          </template>
        </UFormGroup>
        <div v-for="(item, index) in state.invoice_items" :key="index" class="space-y-4">
           <UFormGroup :label="`Product ${index + 1} Name`" :name="`item-name-${index}`">
            <div class="relative">
              <!-- For collaborator customers, always show as free text input -->
              <UInput 
                v-if="customerFilter === 'collaborator'"
                v-model="item.name" 
                placeholder="Enter custom product name (e.g., Hadiah hasil pkl)"
                class="w-full"
              />
              <!-- For internet customers, show as read-only input when customer is selected -->
              <UInput 
                v-else-if="index === 0 && selectedCustomerDetail?.customer?.product" 
                v-model="item.name" 
                readonly 
                class="bg-gray-100 cursor-not-allowed"
                placeholder="Product name will be auto-filled when customer is selected"
              />
              <!-- For additional items or when no customer selected, show dropdown -->
              <UInputMenu 
                v-else
                v-model="item.name" 
                :loading="loadingProduct" 
                by="id" 
                :options="productOptions"
                @change="(name: string) => checkProductIsExist(name, index)" 
                :search="search" 
              />
              <div v-if="customerFilter === 'collaborator'" class="mt-1">
                <p class="text-xs text-blue-600">
                  ✓ Custom product name for collaborator customer
                </p>
              </div>
              <div v-else-if="index === 0 && selectedCustomerDetail?.customer?.product" class="mt-1">
                <p class="text-xs text-green-600">
                  ✓ Auto-filled from customer's package: {{ selectedCustomerDetail.customer.product_name || 'No product assigned' }}
                </p>
              </div>
              <div v-else-if="index === 0 && !selectedCustomerDetail" class="mt-1">
                <p class="text-xs text-gray-500">
                  Select a customer to auto-fill product information
                </p>
              </div>
            </div>
          </UFormGroup>

          <div class="flex space-x-4">
            <UFormGroup label="Quantity">
              <UInput v-model.number="item.qty" type="number" min="1" @update:modelValue="() => { if (item.qty < 1) item.qty = 1; updateTotal(index) }" />
            </UFormGroup>
            <UFormGroup label="Price">
              <UInput v-model.number="item.price" type="number" @update:modelValue="() => updateTotal(index)" />
            </UFormGroup>
            <UFormGroup label="Total">
              <UInput v-model.number="item.total" type="number" disabled />
            </UFormGroup>
          </div>

          <UButton color="red" variant="soft" @click="removeItem(index)" v-if="state.invoice_items.length > 1">
            Hapus Item
          </UButton>
        </div>
        <UFormGroup>
          <UButton @click="addItem" variant="outline">Tambah Item</UButton>
        </UFormGroup>
        <UButton 
          type="submit" 
          :loading="isSubmitting" 
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Submitting...' : 'Submit' }}
        </UButton>
      </UForm>
    </div>
  </UModal>
</template>