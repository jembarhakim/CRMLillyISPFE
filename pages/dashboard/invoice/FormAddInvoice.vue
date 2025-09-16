<script setup lang="ts">
import { object, string, type InferType } from "yup";
import type { FormSubmitEvent } from "#ui/types";
import { customerAdminApi } from "@/api/admin/customer";
import { invoiceAdminApi } from "@/api/admin/invoice";
import { internetPackageAdminApi } from "@/api/admin/internet-package";

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
      qty: 0,
      price: 0,
      total: 0,
    },
  ],
});

function addItem() {
  state.invoice_items.push({
    name: "",
    qty: 0,
    price: 0,
    total: 0,
  });
}
function removeItem(index: number) {
  state.invoice_items.splice(index, 1);
}
function updateTotal(index: number) {
  const item = state.invoice_items[index];
  state.invoice_items[index] = {
    ...item,
    total: item.qty * item.price,
  };

  state.amount = state.invoice_items.reduce((acc, item) => acc + item.total, 0);
  console.log(state.invoice_items[index].total);
}

watch(
  () => props.isEdit,
  (newValue) => {
    if (newValue) {
      (state.customer_id = props.data.customer_id),
        (state.amount = props.data.amount);
    }
  },
  { immediate: true }
);

watch(
  () => props.isEdit,
  (newValue) => {
    if (newValue) {
      (state.customer_id = props.data.customer_id),
        (state.amount = props.data.amount);
    }
  },
  { immediate: true }
);
const emit = defineEmits(["success"]);

function onSuccess() {
  emit("success");
}

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (isSubmitting.value) {
    return; // Prevent double submission
  }
  
  isSubmitting.value = true;
  
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
    }
    
    // Prepare data for API
    const submitData = {
      customer_id: state.customer_id,
      amount: state.amount,
      invoice_items: state.invoice_items.map(item => ({
        name: item.name,
        price: item.price,
        qty: item.qty,
        total: item.total
      }))
    };
    
    console.log("Submitting invoice data:", submitData);
    
    if (props.isEdit) {
      const response = await invoiceAdminApi().editInvoice(props.data.id, submitData);
      useToast().add({ 
        title: "Success", 
        description: response.message || "Invoice updated successfully",
        color: "green"
      });
    } else {
      const response = await invoiceAdminApi().createInvoice(submitData);
      useToast().add({ 
        title: "Success", 
        description: response.message || "Invoice created successfully",
        color: "green"
      });
    }
    
    onSuccess();
  } catch (error: any) {
    console.error("Invoice submission error:", error);
    useToast().add({
      title: "Error",
      description: error.message || "Failed to save invoice",
      color: "red"
    });
  } finally {
    isSubmitting.value = false;
  }
}

const customer = ref([]);
const searchOptions = ref();
const productOptions = ref<any[]>([])
const productOptionsD = ref<any[]>([])
const selectedCustomerDetail = ref<any>(null)

async function getDataOptions() {
  customerAdminApi()
    .getAllCustomers()
    .then((response) => {
      customer.value = response.data.map((value: any, index: number) => ({
        label: value.name,
        value: value.id,
        customerData: value // Store full customer data for reference
      }));
    });
}

function search(q: any) {
  const data = productOptions.value.filter((option: any) =>
    option.toLowerCase().includes(q.toLowerCase())
  );
  if (data.length > 0) {
    return data
  }

  return [q]
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

function checkProductIsExist(name: string, index: number) {
  const product = productOptionsD.value.find((option: any) => option.label === name);
  if (product) {
    const item = state.invoice_items[index];
    state.invoice_items[index] = {
      ...item,
      price: product.price,
    };
  }
}

// Watch for customer selection changes
watch(
  () => state.customer_id,
  async (newCustomerId) => {
    if (newCustomerId) {
      try {
        // Get customer detail with product information
        const response = await customerAdminApi().getCustomerDetail(newCustomerId);
        selectedCustomerDetail.value = response.data;
        
        // Auto-fill product name and price for the first item
        if (selectedCustomerDetail.value.customer.product) {
          const product = selectedCustomerDetail.value.customer.product;
          
          // Reset invoice items to only have one item
          state.invoice_items = [{
            name: product.name,
            price: product.price,
            qty: 1, // Default quantity to 1
            total: product.price
          }];
          
          // Update total amount
          state.amount = state.invoice_items.reduce((acc, item) => acc + item.total, 0);
          
          // Show success message with timeout to prevent UI blocking
          useToast().add({
            title: 'Success',
            description: `Product "${product.name}" auto-filled from customer's package`,
            color: 'green',
            timeout: 3000
          });
        } else {
          // If customer has no product, reset to empty
          state.invoice_items = [{
            name: "",
            price: 0,
            qty: 0,
            total: 0
          }];
          state.amount = 0;
          
          useToast().add({
            title: 'Warning',
            description: 'Customer has no product package assigned',
            color: 'yellow',
            timeout: 3000
          });
        }
      } catch (error) {
        console.error('Failed to fetch customer detail:', error);
        useToast().add({
          title: 'Error',
          description: 'Failed to load customer product information',
          color: 'red',
          timeout: 3000
        });
      }
    } else {
      // Reset when no customer is selected
      selectedCustomerDetail.value = null;
      state.invoice_items = [{
        name: "",
        price: 0,
        qty: 0,
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
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormGroup label="Customer" name="customer_id">
          <USelectMenu v-model="state.customer_id" :options="customer" value-attribute="value"
            option-attribute="label" />
        </UFormGroup>
        
        <!-- Customer Product Information -->
        <div v-if="selectedCustomerDetail" class="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 class="text-lg font-medium text-blue-900 mb-3">Customer Product Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-blue-700">Customer Name</label>
              <p class="mt-1 text-sm text-blue-900">{{ selectedCustomerDetail.customer.name }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-blue-700">Product Package</label>
              <p class="mt-1 text-sm text-blue-900">{{ selectedCustomerDetail.customer.product?.name || 'No product assigned' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-blue-700">Package Price</label>
               <p class="mt-1 text-sm text-blue-900">{{ selectedCustomerDetail.customer.product?.price ? `Rp ${selectedCustomerDetail.customer.product.price.toLocaleString()}` : 'No price' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-blue-700">Installation Date</label>
              <p class="mt-1 text-sm text-blue-900">{{ selectedCustomerDetail.customer.installation_date ? new Date(selectedCustomerDetail.customer.installation_date).toLocaleDateString() : 'Not installed' }}</p>
            </div>
          </div>
        </div>
        <UFormGroup label="Amount" name="amount">
          <UInput v-model="state.amount" type="number" />
        </UFormGroup>
        <div v-for="(item, index) in state.invoice_items" :key="index" class="space-y-4">
           <UFormGroup :label="`Product ${index + 1} Name`" :name="`item-name-${index}`">
            <div class="relative">
              <!-- For first item (index 0), show as read-only input when customer is selected -->
              <UInput 
                v-if="index === 0 && selectedCustomerDetail?.customer?.product" 
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
                @change="(name) => checkProductIsExist(name, index)" 
                :search="search" 
              />
              <div v-if="index === 0 && selectedCustomerDetail?.customer?.product" class="mt-1">
                <p class="text-xs text-green-600">
                  ✓ Auto-filled from customer's package: {{ selectedCustomerDetail.customer.product.name }}
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
              <UInput v-model.number="item.qty" type="number" @update:modelValue="() => updateTotal(index)" />
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
        <UButton type="submit" :loading="isSubmitting" :disabled="isSubmitting">
          {{ isSubmitting ? 'Submitting...' : 'Submit' }}
        </UButton>
      </UForm>
    </div>
  </UModal>
</template>