<script setup lang="ts">
import { object, string, number, array, type InferType } from "yup";
import type { FormSubmitEvent } from "#ui/types";
import { customerAdminApi } from "@/api/admin/customer";
import { recurringInvoiceAdminApi } from "@/api/admin/recurring-invoice";
import { networkDeviceAdminApi } from "@/api/admin/network-device";
import type { RecurringInvoiceItem } from "@/api/admin/recurring-invoice";

const props = defineProps({
  isEdit: {
    type: Boolean,
    required: false,
  },
  data: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["success"]);

// Form validation schema
const schema = object({
  customer_id: string().required("Customer is required"),
  amount: number().required("Amount is required").min(1, "Amount must be greater than 0"),
  invoice_date: string().required("Invoice date is required"),
  due_date: string().required("Due date is required"),
  frequency: string().required("Frequency is required").oneOf(["monthly", "quarterly", "yearly"]),
  description: string().optional(),
  invoice_items: array().min(1, "At least one invoice item is required"),
});

type Schema = InferType<typeof schema>;

// Form state
const state = reactive({
  customer_id: "",
  amount: 0,
  invoice_date: "",
  due_date: "",
  frequency: "monthly" as "monthly" | "quarterly" | "yearly",
  description: "",
  invoice_items: [
    {
      name: "",
      qty: 1,
      price: 0,
      total: 0,
    },
  ] as RecurringInvoiceItem[],
});

// Data
const customers = ref<any[]>([]);
const loading = ref(false);
const submitting = ref(false);
const loadingNetworkDevices = ref(false);

// Fetch customers
async function getCustomers() {
  loading.value = true;
  try {
    const response = await customerAdminApi().getAllCustomers();
    customers.value = response.data.map((customer: any) => ({
      label: customer.name,
      value: customer.id,
      email: customer.email,
      phone: customer.phone,
    }));
  } catch (error) {
    console.error("Error fetching customers:", error);
  } finally {
    loading.value = false;
  }
}

// Auto-populate invoice items based on customer's network devices
async function populateInvoiceItemsFromNetworkDevices(customerId: string) {
  if (!customerId) return;
  
  loadingNetworkDevices.value = true;
  try {
    const response = await networkDeviceAdminApi().getNetworkDevicesByCustomer(customerId);
    const networkDevices = response.data || [];
    
    // Filter devices that have products assigned
    const devicesWithProducts = networkDevices.filter((device: any) => device.product_id && device.product);
    
    if (devicesWithProducts.length > 0) {
      // Clear existing items and populate with network device products
      state.invoice_items = devicesWithProducts.map((device: any) => ({
        name: `${device.product.name} - ${device.mac_address || 'Device'}`,
        qty: 1,
        price: device.product.price,
        total: device.product.price,
      }));
      
      // Update total amount
      calculateTotal();
      
      // Update description to include device information
      if (!state.description) {
        state.description = `Recurring invoice for ${devicesWithProducts.length} network device(s)`;
      }
    } else {
      // If no devices with products, show a default item
      state.invoice_items = [{
        name: "Internet Service",
        qty: 1,
        price: 0,
        total: 0,
      }];
      calculateTotal();
    }
  } catch (error) {
    console.error("Error fetching network devices:", error);
    // Keep existing items if there's an error
  } finally {
    loadingNetworkDevices.value = false;
  }
}

// Invoice item functions
function addItem() {
  state.invoice_items.push({
    name: "",
    qty: 1,
    price: 0,
    total: 0,
  });
}

function removeItem(index: number) {
  if (state.invoice_items.length > 1) {
    state.invoice_items.splice(index, 1);
    calculateTotal();
  }
}

function updateItem(index: number, field: keyof RecurringInvoiceItem, value: string | number) {
  (state.invoice_items[index] as any)[field] = value;
  
  if (field === "qty" || field === "price") {
    const item = state.invoice_items[index];
    item.total = item.qty * item.price;
    calculateTotal();
  }
}

function calculateTotal() {
  state.amount = state.invoice_items.reduce((acc, item) => acc + item.total, 0);
}

// Calculate next invoice date based on frequency
function clampToMonth(base: Date, addMonths: number, preferredDay: number): Date {
  const y = base.getFullYear();
  const m = base.getMonth();
  const target = new Date(y, m + addMonths, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const d = Math.min(preferredDay, lastDay);
  target.setDate(d);
  target.setHours(base.getHours(), base.getMinutes(), base.getSeconds(), base.getMilliseconds());
  return target;
}

function calculateNextInvoiceDate() {
  if (!state.invoice_date) return;

  const invoiceDate = new Date(state.invoice_date);
  // Always preserve the original day as preferred, even if it's 31
  const originalDay = invoiceDate.getDate();
  
  // For end-of-month behavior: if the source day is near the month end (>=30),
  // request day 31 so clampToMonth yields the last valid day of the target month
  const preferredDay = originalDay >= 30 ? 31 : originalDay;

  let monthsToAdd = 1;
  switch (state.frequency) {
    case "quarterly":
      monthsToAdd = 3; break;
    case "yearly":
      monthsToAdd = 12; break;
    default:
      monthsToAdd = 1;
  }

  const nextDate = clampToMonth(invoiceDate, monthsToAdd, preferredDay);
  return nextDate.toISOString().split('T')[0];
}

function calculateDueDate() {
  // Due date should be the same as the next invoice date
  return calculateNextInvoiceDate();
}

// Watch for changes to calculate next invoice date
const nextInvoiceDate = computed(() => calculateNextInvoiceDate());

// Watch for changes to calculate due date (same as next invoice date)
const calculatedDueDate = computed(() => calculateDueDate());

// Watch for customer selection changes to auto-populate invoice items
watch(
  () => state.customer_id,
  (newCustomerId) => {
    if (newCustomerId && !props.isEdit) {
      populateInvoiceItemsFromNetworkDevices(newCustomerId);
    }
  }
);

// Watch for invoice date and frequency changes to auto-populate due date
watch(
  [() => state.invoice_date, () => state.frequency],
  () => {
    if (state.invoice_date && !props.isEdit) {
      state.due_date = calculatedDueDate.value || '';
    }
  }
);

// Form submission
async function onSubmit(event: FormSubmitEvent<Schema>) {
  submitting.value = true;
  try {
    const formData = {
      ...event.data,
      invoice_items: state.invoice_items,
    };

    if (props.isEdit) {
      // Convert date strings to ISO format for backend
      const submitData = {
        id: props.data.id,
        ...formData,
        frequency: formData.frequency as "monthly" | "quarterly" | "yearly",
        invoice_date: new Date(formData.invoice_date + 'T00:00:00.000Z').toISOString(),
        due_date: new Date(formData.due_date + 'T00:00:00.000Z').toISOString(),
      };
      await recurringInvoiceAdminApi().updateRecurringInvoice(submitData);
    } else {
      // Convert date strings to ISO format for backend
      const submitData = {
        ...formData,
        frequency: formData.frequency as "monthly" | "quarterly" | "yearly",
        invoice_date: new Date(formData.invoice_date + 'T00:00:00.000Z').toISOString(),
        due_date: new Date(formData.due_date + 'T00:00:00.000Z').toISOString(),
      };
      await recurringInvoiceAdminApi().createRecurringInvoice(submitData);
    }

    emit("success");
  } catch (error) {
    console.error("Error submitting form:", error);
  } finally {
    submitting.value = false;
  }
}

// Initialize form data for edit mode
watch(
  () => props.isEdit,
  (newValue) => {
    if (newValue && props.data) {
      state.customer_id = props.data.customer_id || "";
      state.amount = props.data.amount || 0;
      state.invoice_date = props.data.invoice_date ? new Date(props.data.invoice_date).toISOString().split('T')[0] : "";
      state.due_date = props.data.due_date ? new Date(props.data.due_date).toISOString().split('T')[0] : "";
      state.frequency = props.data.frequency || "monthly";
      state.description = props.data.description || "";
      state.invoice_items = props.data.invoice_items || [
        {
          name: "",
          qty: 1,
          price: 0,
          total: 0,
        },
      ];
    }
  },
  { immediate: true }
);

// Initialize
onMounted(() => {
  getCustomers();
});
</script>

<template>
  <UModal>
    <div class="w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-center">
          {{ props.isEdit ? "Edit" : "Add New" }} Recurring Invoice
        </h1>
      </div>

      <UForm :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
        <!-- Customer Selection -->
        <UFormGroup label="Customer" name="customer_id" required>
          <USelectMenu 
            v-model="state.customer_id" 
            :options="customers" 
            value-attribute="value"
            option-attribute="label"
            placeholder="Select customer..."
            :loading="loading"
          />
        </UFormGroup>

        <!-- Invoice Details -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UFormGroup label="Invoice Date" name="invoice_date" required>
            <UInput 
              v-model="state.invoice_date" 
              type="date"
              placeholder="Select invoice date..."
            />
          </UFormGroup>

          <UFormGroup label="Due Date" name="due_date" required>
            <UInput 
              v-model="state.due_date" 
              type="date"
              placeholder="Select due date..."
              :disabled="!props.isEdit"
            />
            <template #help>
              <span v-if="!props.isEdit" class="text-sm text-blue-600">
                Automatically set to the same as the next invoice date
              </span>
            </template>
          </UFormGroup>

          <UFormGroup label="Frequency" name="frequency" required>
            <USelectMenu 
              v-model="state.frequency"
              :options="[
                { label: 'Monthly', value: 'monthly' },
                { label: 'Quarterly', value: 'quarterly' },
                { label: 'Yearly', value: 'yearly' }
              ]"
              option-attribute="label"
              value-attribute="value"
              placeholder="Select frequency..."
            />
          </UFormGroup>
        </div>

        <!-- Next Invoice Date Display -->
        <div v-if="nextInvoiceDate" class="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div class="text-sm text-blue-800">
            <span class="font-medium">Next Invoice Date:</span> 
            {{ new Date(nextInvoiceDate).toLocaleDateString() }}
          </div>
        </div>

        <!-- Description -->
        <UFormGroup label="Description" name="description">
          <UTextarea 
            v-model="state.description"
            placeholder="Enter description (optional)..."
            :rows="3"
          />
        </UFormGroup>

        <!-- Invoice Items -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Invoice Items</h3>
            <div class="flex gap-2">
              <UButton 
                v-if="state.customer_id"
                type="button"
                @click="populateInvoiceItemsFromNetworkDevices(state.customer_id)"
                color="green"
                variant="outline"
                size="sm"
                :loading="loadingNetworkDevices"
              >
                {{ loadingNetworkDevices ? 'Loading...' : 'Auto-fill from Devices' }}
              </UButton>
              <UButton 
                type="button"
                @click="addItem"
                color="blue"
                variant="outline"
                size="sm"
              >
                Add Item
              </UButton>
            </div>
          </div>

          <div class="space-y-4">
            <div 
              v-for="(item, index) in state.invoice_items" 
              :key="index"
              class="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-gray-200 rounded-lg"
            >
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <UInput 
                  :model-value="item.name"
                  @update:model-value="updateItem(index, 'name', $event)"
                  placeholder="Enter item name..."
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <UInput 
                  :model-value="item.qty"
                  @update:model-value="updateItem(index, 'qty', Number($event))"
                  type="number"
                  min="1"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <UInput 
                  :model-value="item.price"
                  @update:model-value="updateItem(index, 'price', Number($event))"
                  type="number"
                  min="0"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Total</label>
                <UInput 
                  :model-value="item.total"
                  readonly
                  class="bg-gray-50"
                />
              </div>

              <div class="flex items-end">
                <UButton 
                  v-if="state.invoice_items.length > 1"
                  type="button"
                  @click="removeItem(index)"
                  color="red"
                  variant="outline"
                  size="sm"
                  icon="i-heroicons-trash"
                />
              </div>
            </div>
          </div>

          <!-- Total Amount -->
          <div class="mt-4 p-4 bg-gray-50 rounded-lg">
            <div class="flex justify-between items-center">
              <span class="text-lg font-medium text-gray-900">Total Amount:</span>
              <span class="text-xl font-bold text-blue-600">
                {{ new Intl.NumberFormat('id-ID', { 
                  style: 'currency', 
                  currency: 'IDR' 
                }).format(state.amount) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-3 pt-6 border-t">
          <UButton 
            type="button"
            color="gray" 
            variant="outline"
            @click="$emit('success')"
          >
            Cancel
          </UButton>
          <UButton 
            type="submit"
            color="blue"
            :loading="submitting"
            :disabled="submitting"
          >
            {{ submitting ? "Saving..." : (props.isEdit ? "Update" : "Create") }} Recurring Invoice
          </UButton>
        </div>
      </UForm>
    </div>
  </UModal>
</template>
