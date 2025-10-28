<script setup lang="ts">
import { recurringInvoiceAdminApi } from "@/api/admin/recurring-invoice";
import FormAddRecurringInvoice from "./FormAddRecurringInvoice.vue";
import * as currency from "@/helper/currency";
import type { RecurringInvoice, UpdateRecurringInvoiceStatusRequest } from "@/api/admin/recurring-invoice";

// Set page title
useHead({
  title: 'Recurring Invoices - CRM System'
})

const router = useRouter();
const toast = useToast();
const modal = useModal();

// Data
const recurringInvoices = ref<RecurringInvoice[]>([]);
const loading = ref(false);
const deleting = ref(false);
const updatingStatus = ref(false);

// Filters
const q = ref("");
const statusFilter = ref("");
const frequencyFilter = ref("");
const dateFilter = ref("");

// Pagination
const page = ref(1);
const pageCount = ref(10);

// Table columns
const columns = [
  {
    key: "id",
    label: "#",
    sortable: true,
  },
  {
    key: "customer.name",
    label: "Account",
    sortable: true,
  },
  {
    key: "amount",
    label: "Amount",
    sortable: true,
  },
  {
    key: "invoice_date",
    label: "Invoice Date",
    sortable: true,
  },
  {
    key: "due_date",
    label: "Due Date",
    sortable: true,
  },
  {
    key: "next_invoice_date",
    label: "Next Invoice",
    sortable: true,
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
  },
  {
    key: "actions",
    label: "Manage",
  },
];

// Fetch data
async function getData() {
  loading.value = true;
  try {
    const response = await recurringInvoiceAdminApi().getAllRecurringInvoices();
    recurringInvoices.value = response.data;
  } catch (error) {
    console.error("Error fetching recurring invoices:", error);
    toast.add({
      title: "Error",
      description: "Failed to fetch recurring invoices",
      color: "red",
      timeout: 3000
    });
  } finally {
    loading.value = false;
  }
}

// Computed filtered data
const filteredRows = computed(() => {
  let filteredData = [...recurringInvoices.value];

  // Filter by search query
  if (q.value) {
    filteredData = filteredData.filter((invoice) => {
      return (
        invoice.customer.name.toLowerCase().includes(q.value.toLowerCase()) ||
        invoice.id.toLowerCase().includes(q.value.toLowerCase()) ||
        (invoice.description && invoice.description.toLowerCase().includes(q.value.toLowerCase()))
      );
    });
  }

  // Filter by date
  if (dateFilter.value) {
    filteredData = filteredData.filter((invoice) => {
      const invoiceDate = new Date(invoice.invoice_date).toISOString().split('T')[0];
      return invoiceDate === dateFilter.value;
    });
  }

  // Filter by status
  if (statusFilter.value) {
    filteredData = filteredData.filter((invoice) => {
      return invoice.status.toLowerCase() === statusFilter.value.toLowerCase();
    });
  }

  // Filter by frequency
  if (frequencyFilter.value) {
    filteredData = filteredData.filter((invoice) => {
      return invoice.frequency.toLowerCase() === frequencyFilter.value.toLowerCase();
    });
  }

  return filteredData.slice((page.value - 1) * pageCount.value, page.value * pageCount.value);
});

// Clear filters
function clearFilters() {
  q.value = "";
  statusFilter.value = "";
  frequencyFilter.value = "";
  dateFilter.value = "";
  page.value = 1;
}

// Status badge color
function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return "green";
    case "stopped":
      return "red";
    case "completed":
      return "blue";
    default:
      return "gray";
  }
}

// Frequency badge color
function getFrequencyColor(frequency: string) {
  switch (frequency.toLowerCase()) {
    case "monthly":
      return "blue";
    case "quarterly":
      return "yellow";
    case "yearly":
      return "purple";
    default:
      return "gray";
  }
}

// Actions
const items = (row: RecurringInvoice) => [
  [
    {
      label: "View",
      icon: "eye-20-solid",
      click: () => viewRecurringInvoice(row),
    },
    {
      label: "Edit",
      icon: "pencil-20-solid",
      click: () => openModalAddRecurringInvoice(true, row),
    },
    {
      label: "Generate Invoice",
      icon: "file-plus-20-solid",
      click: () => generateInvoice(row),
    },
  ],
  [
    {
      label: row.status === "active" ? "Stop Recurring" : "Resume",
      icon: row.status === "active" ? "stop-20-solid" : "play-20-solid",
      click: () => toggleRecurringStatus(row),
    },
    {
      label: "Delete",
      icon: "trash-2-20-solid",
      click: () => deleteRecurringInvoice(row.id),
    },
  ],
];

// Modal functions
function openModalAddRecurringInvoice(isEdit: boolean, data: any = null) {
  modal.open(FormAddRecurringInvoice, {
    isEdit,
    data,
    async onSuccess() {
      await getData();
      modal.close();
    },
  });
}

// View recurring invoice details
function viewRecurringInvoice(invoice: RecurringInvoice) {
  // Navigate to detail page or open modal
  router.push(`/dashboard/recurring-invoice/${invoice.id}`);
}

// Generate invoice from recurring
async function generateInvoice(invoice: RecurringInvoice) {
  try {
    // Compute invoice_date = next_invoice_date, due_date keeps original gap
    const baseInvoiceDate = new Date(invoice.next_invoice_date)
    const origInvoiceDate = new Date(invoice.invoice_date)
    const origDueDate = new Date(invoice.due_date)
    const msGap = origDueDate.getTime() - origInvoiceDate.getTime()
    const computedDueDate = new Date(baseInvoiceDate.getTime() + msGap)

    const response = await recurringInvoiceAdminApi().generateInvoiceFromRecurring({
      id: invoice.id,
      invoice_date: baseInvoiceDate.toISOString(),
      due_date: computedDueDate.toISOString()
    });
    
    toast.add({
      title: "Success",
      description: "Invoice generated successfully",
      color: "green",
      timeout: 3000
    });

    // Refresh list so next_invoice_date updates in UI
    await getData();

    // Navigate to the generated invoice if id present
    if (response?.data?.id) {
      router.push(`/invoice/${response.data.id}`);
    }
  } catch (error) {
    console.error("Error generating invoice:", error);
    toast.add({
      title: "Error",
      description: "Failed to generate invoice",
      color: "red",
      timeout: 3000
    });
  }
}

// Toggle recurring status
async function toggleRecurringStatus(invoice: RecurringInvoice) {
  updatingStatus.value = true;
  try {
    const newStatus = invoice.status === "active" ? "stopped" : "active";
    const request: UpdateRecurringInvoiceStatusRequest = {
      id: invoice.id,
      status: newStatus as "active" | "stopped" | "completed",
    };
    
    await recurringInvoiceAdminApi().updateRecurringInvoiceStatus(request);
    
    toast.add({
      title: "Success",
      description: `Recurring invoice ${newStatus === "active" ? "resumed" : "stopped"} successfully`,
      color: "green",
      timeout: 3000
    });
    
    await getData();
  } catch (error) {
    console.error("Error updating status:", error);
    toast.add({
      title: "Error",
      description: "Failed to update recurring invoice status",
      color: "red",
      timeout: 3000
    });
  } finally {
    updatingStatus.value = false;
  }
}

// Delete recurring invoice
async function deleteRecurringInvoice(id: string) {
  if (!confirm("Are you sure you want to delete this recurring invoice?")) {
    return;
  }
  
  deleting.value = true;
  try {
    await recurringInvoiceAdminApi().deleteRecurringInvoice(id);
    
    toast.add({
      title: "Success",
      description: "Recurring invoice deleted successfully",
      color: "green",
      timeout: 3000
    });
    
    await getData();
  } catch (error) {
    console.error("Error deleting recurring invoice:", error);
    toast.add({
      title: "Error",
      description: "Failed to delete recurring invoice",
      color: "red",
      timeout: 3000
    });
  } finally {
    deleting.value = false;
  }
}

// Initialize
onMounted(() => {
  getData();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Recurring Invoices</h1>
        <p class="text-gray-600">Manage recurring invoice templates</p>
      </div>
      <UButton 
        label="+ Add Recurring Invoice" 
        color="blue"
        @click="openModalAddRecurringInvoice(false, null)" 
      />
    </div>

    <!-- Filter Section -->
    <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <!-- Customer Search Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Filter Customer</label>
          <UInput v-model="q" placeholder="Search customer..." />
        </div>
        
        <!-- Date Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Date</label>
          <UInput v-model="dateFilter" type="date" placeholder="Select date..." />
        </div>
        
        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
          <USelectMenu 
            v-model="statusFilter" 
            :options="[
              { label: 'All Status', value: '' },
              { label: 'Active', value: 'active' },
              { label: 'Stopped', value: 'stopped' },
              { label: 'Completed', value: 'completed' }
            ]"
            option-attribute="label"
            value-attribute="value"
            placeholder="Select status..."
          />
        </div>

        <!-- Frequency Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Frequency</label>
          <USelectMenu 
            v-model="frequencyFilter" 
            :options="[
              { label: 'All Frequencies', value: '' },
              { label: 'Monthly', value: 'monthly' },
              { label: 'Quarterly', value: 'quarterly' },
              { label: 'Yearly', value: 'yearly' }
            ]"
            option-attribute="label"
            value-attribute="value"
            placeholder="Select frequency..."
          />
        </div>
        
        <!-- Clear Filters Button -->
        <div class="flex items-end">
          <UButton 
            @click="clearFilters" 
            color="gray" 
            variant="outline"
            class="w-full"
          >
            Clear Filters
          </UButton>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-lg shadow">
      <UTable 
        :rows="filteredRows" 
        :columns="columns"
        :loading="loading"
        :empty-state="{
          icon: 'file-text',
          label: 'No recurring invoices found'
        }"
      >
        <template #id-data="{ row }">
          <span class="font-mono text-sm">#{{ row.id.slice(-8) }}</span>
        </template>

        <template #customer.name-data="{ row }">
          <div>
            <div class="font-medium text-gray-900">{{ row.customer.name }}</div>
            <div class="text-sm text-gray-500">{{ row.customer.email }}</div>
          </div>
        </template>

        <template #amount-data="{ row }">
          <span class="font-medium">{{ currency.formatIDR(row.amount) }}</span>
        </template>

        <template #invoice_date-data="{ row }">
          {{ new Date(row.invoice_date).toLocaleDateString() }}
        </template>

        <template #due_date-data="{ row }">
          {{ new Date(row.due_date).toLocaleDateString() }}
        </template>

        <template #next_invoice_date-data="{ row }">
          <span class="font-medium">{{ new Date(row.next_invoice_date).toLocaleDateString() }}</span>
        </template>

        <template #status-data="{ row }">
          <UBadge 
            :color="getStatusColor(row.status)" 
            variant="subtle"
          >
            {{ row.status.charAt(0).toUpperCase() + row.status.slice(1) }}
          </UBadge>
        </template>

        <template #actions-data="{ row }">
          <UDropdown :items="items(row)">
            <UButton 
              color="gray" 
              variant="ghost" 
              icon="ellipsis-horizontal"
            />
          </UDropdown>
        </template>
      </UTable>

      <!-- Pagination -->
      <div class="px-4 py-3 border-t border-gray-200">
        <UPagination 
          v-model="page" 
          :page-count="pageCount"
          :total="recurringInvoices.length"
          show-last
          show-first
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Clean, visible table headers like the reference */
:deep(table thead th) {
  color: #374151 !important;
  font-weight: 500 !important;
  font-size: 0.875rem !important;
  background-color: #f9fafb !important;
  border-bottom: 1px solid #e5e7eb !important;
  padding: 12px 16px !important;
}

/* Ensure header text is visible */
:deep(table thead th *) {
  color: #374151 !important;
  opacity: 1 !important;
}

/* Override any UTable default header styling */
:deep(.table th) {
  color: #374151 !important;
  font-weight: 500 !important;
  background-color: #f9fafb !important;
}

/* Target UTable component headers specifically */
:deep(.u-table th),
:deep(.u-table thead th),
:deep([data-headlessui-state] th),
:deep(th) {
  color: #374151 !important;
  font-weight: 500 !important;
  font-size: 0.875rem !important;
  background-color: #f9fafb !important;
}

/* Force visibility on any header content */
:deep(th span),
:deep(th div),
:deep(th button) {
  color: #374151 !important;
  font-weight: 500 !important;
}
</style>