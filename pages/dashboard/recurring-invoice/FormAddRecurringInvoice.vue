<script setup lang="ts">
import { object, string, number, array, type InferType } from "yup";
import type { FormSubmitEvent } from "#ui/types";
import { customerAdminApi } from "@/api/admin/customer";
import { recurringInvoiceAdminApi } from "@/api/admin/recurring-invoice";
import { networkDeviceAdminApi } from "@/api/admin/network-device";
import type { RecurringInvoiceItem } from "@/api/admin/recurring-invoice";
import { internetPackageAdminApi } from "@/api/admin/internet-package";
import { onMounted, onUnmounted, nextTick, computed, ref, reactive, watch } from 'vue';
import { formatIDR } from "@/helper/currency";

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
const productOptions = ref<any[]>([]);
const loadingProducts = ref(false);

// Fetch customers
async function getCustomers() {
  loading.value = true;
  try {
    const response = await customerAdminApi().getAllCustomers();
    // Only include customers with is_internet=='yes'
    customers.value = (response.data || [])
      .filter((customer: any) => customer.is_internet === 'yes')
      .map((customer: any) => ({
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
      state.invoice_items = devicesWithProducts.map((device: any, index: number) => {
        const price = device.product.price || 0;
        // Initialize formatted values
        quantityInputs.value[index] = "1";
        formattedPrices.value[index] = price > 0 ? price.toLocaleString("id-ID") : "";
        return {
          name: `${device.product.name} - ${device.mac_address || 'Device'}`,
          qty: 1,
          price: price,
          total: price,
        };
      });
      
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
      quantityInputs.value = { 0: "1" };
      formattedPrices.value = { 0: "" };
      calculateTotal();
    }
  } catch (error) {
    console.error("Error fetching network devices:", error);
    // Keep existing items if there's an error
  } finally {
    loadingNetworkDevices.value = false;
  }
}

// Fetch product options for dropdown
async function getProducts() {
  loadingProducts.value = true;
  try {
    const response = await internetPackageAdminApi().getAllInternetPacket();
    const data = response.data || [];
    productOptions.value = data.map((p: any) => ({
      id: p.id,
      label: p.name,
      value: p.name,
      price: p.price,
    }));
  } catch (e) {
    console.error("Error fetching products:", e);
  } finally {
    loadingProducts.value = false;
  }
}

// Invoice item functions
function addItem() {
  const newIndex = state.invoice_items.length;
  state.invoice_items.push({
    name: "",
    qty: 1,
    price: 0,
    total: 0,
  });
  // Initialize quantity input state and price format
  quantityInputs.value[newIndex] = "1";
  formattedPrices.value[newIndex] = "";
}

function removeItem(index: number) {
  if (state.invoice_items.length > 1) {
    state.invoice_items.splice(index, 1);
    calculateTotal();
  }
}

// Keep updateItem for backward compatibility but use new handlers
function updateItem(index: number, field: keyof RecurringInvoiceItem, value: string | number) {
  if (field === "qty") {
    handleQuantityInput(index, value.toString());
    handleQuantityBlur(index);
  } else if (field === "price") {
    handlePriceInput(index, value.toString());
    handlePriceBlur(index);
  } else {
    (state.invoice_items[index] as any)[field] = value;
  }
}

// When selecting a product from dropdown, set name and price
function setItemProduct(index: number, selectedLabel: string) {
  const item = state.invoice_items[index];
  item.name = selectedLabel || "";
  const product = productOptions.value.find((o: any) => o.label === selectedLabel);
  if (product) {
    item.price = Number(product.price) || 0;
    item.total = item.qty * item.price;
    calculateTotal();
  }
}

function calculateTotal() {
  state.amount = state.invoice_items.reduce((acc, item) => acc + item.total, 0);
}

// Number formatting utilities - using same pattern as FormDeposit.vue
function parseNumber(value: string): number {
  if (!value) return 0;
  const cleaned = value.toString().replace(/[^\d]/g, '');
  return cleaned ? parseFloat(cleaned) : 0;
}

// Computed property untuk menampilkan format mata uang (Amount field)
const formattedAmount = computed({
  get: () => {
    // Format dengan separator ribuan
    const numericAmount = state.amount || 0;
    return numericAmount > 0 ? numericAmount.toLocaleString("id-ID") : "";
  },
  set: (value) => {
    // Remove non-numeric characters
    const numericValue = value.toString().replace(/[^\d]/g, "");
    state.amount = numericValue ? parseFloat(numericValue) : 0;
  },
});

// Function untuk format display
const displayAmount = computed(() => {
  const numericAmount = state.amount || 0;
  return numericAmount > 0 ? formatIDR(numericAmount) : "Rp 0,00";
});

// Computed properties for price and quantity inputs (per item)
const formattedPrices = ref<Record<number, string>>({});
const quantityInputs = ref<Record<number, string>>({});

// Handle price input with formatting
function handlePriceInput(index: number, value: string) {
  // Store formatted value for display
  const numericValue = parseNumber(value);
  formattedPrices.value[index] = numericValue > 0 ? numericValue.toLocaleString("id-ID") : "";
  
  // Update actual price value
  state.invoice_items[index].price = numericValue;
  const item = state.invoice_items[index];
  item.total = item.qty * item.price;
  calculateTotal();
}

// Handle price blur - finalize the value
function handlePriceBlur(index: number) {
  const item = state.invoice_items[index];
  formattedPrices.value[index] = item.price > 0 ? item.price.toLocaleString("id-ID") : "";
  calculateTotal();
}

// Handle quantity input - allow free typing, validate on blur
function handleQuantityInput(index: number, value: string) {
  // Store raw input value for display
  quantityInputs.value[index] = value;
  
  // Only update state if it's a valid number, but don't enforce min yet
  const numValue = parseNumber(value);
  if (!isNaN(numValue) && numValue >= 0) {
    state.invoice_items[index].qty = Math.max(1, Math.floor(numValue));
    const item = state.invoice_items[index];
    item.total = item.qty * item.price;
    calculateTotal();
  }
}

// Handle quantity blur - finalize the value
function handleQuantityBlur(index: number) {
  const value = quantityInputs.value[index] || state.invoice_items[index].qty.toString();
  const numValue = parseNumber(value);
  const qty = Math.max(1, Math.floor(numValue)); // Ensure minimum 1 and integer
  state.invoice_items[index].qty = qty;
  quantityInputs.value[index] = qty.toString(); // Update display value
  const item = state.invoice_items[index];
  item.total = item.qty * item.price;
  calculateTotal();
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
      // Initialize formatted values for edit mode
      state.invoice_items.forEach((item, index) => {
        quantityInputs.value[index] = item.qty.toString();
        formattedPrices.value[index] = item.price > 0 ? item.price.toLocaleString("id-ID") : "";
      });
    }
  },
  { immediate: true }
);

// Initialize quantity inputs and price formats on mount
onMounted(() => {
  // Initialize formatted values for existing items
  state.invoice_items.forEach((item, index) => {
    quantityInputs.value[index] = item.qty.toString();
    formattedPrices.value[index] = item.price > 0 ? item.price.toLocaleString("id-ID") : "";
  });
  
  nextTick(() => {
    // Observe DOM to tag the correct HeadlessUI panel even when portalled or re-rendered
    const observer = new MutationObserver(() => {
      const dialogPanels = document.querySelectorAll('[id^="headlessui-dialog-panel"]');
      dialogPanels.forEach((panel) => {
        if (panel.querySelector('.recurring-invoice-panel-content')) {
          panel.setAttribute('data-recurring-invoice-modal', 'true');
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Immediate pass
    const dialogPanels = document.querySelectorAll('[id^="headlessui-dialog-panel"]');
    dialogPanels.forEach((panel) => {
      if (panel.querySelector('.recurring-invoice-panel-content')) {
        panel.setAttribute('data-recurring-invoice-modal', 'true');
      }
    });

    onUnmounted(() => {
      observer.disconnect();
    });
  });
  getCustomers();
  getProducts();
});
</script>

<template>
  <UModal :ui="{ width: 'w-full sm:max-w-max' }">
    <div class="w-full max-w-full p-6 max-h-[90vh] overflow-y-auto recurring-invoice-panel-content">
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
                <USelectMenu 
                  :model-value="item.name"
                  @update:model-value="(val) => setItemProduct(index, val)"
                  :options="productOptions"
                  option-attribute="label"
                  value-attribute="label"
                  placeholder="Select product..."
                  :loading="loadingProducts"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <UInput 
                  :model-value="quantityInputs[index] ?? item.qty.toString()" 
                  type="text"
                  inputmode="numeric"
                  class="text-center font-medium"
                  @update:modelValue="(val: string) => handleQuantityInput(index, val)"
                  @blur="handleQuantityBlur(index)"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <div class="relative">
                  <UInput 
                    :model-value="formattedPrices[index] ?? (item.price > 0 ? item.price.toLocaleString('id-ID') : '')" 
                    type="text"
                    inputmode="numeric"
                    class="font-semibold text-gray-900 pr-12"
                    placeholder="0"
                    @update:modelValue="(val: string) => handlePriceInput(index, val)"
                    @blur="handlePriceBlur(index)"
                  />
                  <div class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                    Rp
                  </div>
                </div>
                <div class="text-xs text-gray-600 mt-1">
                  Value: {{ item.price > 0 ? formatIDR(item.price) : 'Rp 0,00' }}
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Total</label>
                <div class="relative">
                  <UInput 
                    :model-value="item.total > 0 ? item.total.toLocaleString('id-ID') : '0'" 
                    readonly
                    class="bg-gray-50 cursor-not-allowed font-bold text-lg text-gray-900 pr-12"
                  />
                  <div class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    Rp
                  </div>
                </div>
                <div class="text-xs text-gray-600 mt-1">
                  Value: {{ item.total > 0 ? formatIDR(item.total) : 'Rp 0,00' }}
                </div>
              </div>

              <div class="flex items-end">
                <UButton 
                  v-if="state.invoice_items.length > 1"
                  type="button"
                  @click="removeItem(index)"
                  color="red"
                  variant="outline"
                  size="sm"
                  icon="trash-2"
                />
              </div>
            </div>
          </div>

          <!-- Total Amount -->
          <div class="mt-4 p-4 bg-gray-50 rounded-lg">
            <div class="flex justify-between items-center">
              <span class="text-lg font-medium text-gray-900">Total Amount:</span>
              <span class="text-xl font-bold text-blue-600">
                {{ displayAmount }}
              </span>
            </div>
            <div class="text-sm text-gray-600 mt-1">
              Formatted: {{ formattedAmount || '0' }}
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

<style>
/* CRITICAL: Override HeadlessUI dialog panel max-width (32rem from sm:max-w-lg) */
/* Target the specific HeadlessUI dialog panel that contains this recurring invoice form */
:deep([id^="headlessui-dialog-panel"][data-recurring-invoice-modal]),
:deep([id*="headlessui-dialog-panel"][data-recurring-invoice-modal]) {
  max-width: fit-content !important;
  width: 100% !important;
}

@media (min-width: 640px) {
  :deep([id^="headlessui-dialog-panel"][data-recurring-invoice-modal].sm\:max-w-lg),
  :deep([id^="headlessui-dialog-panel"][data-recurring-invoice-modal][class*="max-w-lg"]) {
    max-width: fit-content !important;
    width: 100% !important;
  }
}
</style>
