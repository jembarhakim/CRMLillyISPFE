<template>
  <div class="container mx-auto p-6">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Installation Reports</h1>
        <div class="flex space-x-3">
          <UButton @click="navigateTo('/dashboard/report/customer-installation')" color="gray" variant="outline">
            <UIcon name="i-heroicons-arrow-left" class="mr-2" />
            Back to Dashboard
          </UButton>
          <UButton @click="exportReports" color="green" variant="outline">
            <UIcon name="i-heroicons-document-arrow-down" class="mr-2" />
            Export Reports
          </UButton>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-blue-800 flex items-center">
            <UIcon name="i-heroicons-funnel" class="mr-2" />
            Filters
          </h3>
          <div class="flex space-x-2">
            <UButton @click="clearFilters" color="gray" variant="outline" size="sm">
              <UIcon name="i-heroicons-x-mark" class="mr-1" />
              Clear All
            </UButton>
            <UButton @click="applyFilters" color="blue" size="sm">
              <UIcon name="i-heroicons-magnifying-glass" class="mr-1" />
              Apply Filters
            </UButton>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <UFormGroup class="mb-4">
            <template #label>
              <span class="text-black font-bold text-sm">Search</span>
            </template>
            <UInput 
              v-model="filters.search"
              placeholder="Search customer, technician..."
              @input="onFilterChange"
              class="w-full"
            >
              <template #leading>
                <UIcon name="i-heroicons-magnifying-glass" />
              </template>
            </UInput>
          </UFormGroup>
          
          <UFormGroup class="mb-4">
            <template #label>
              <span class="text-black font-bold text-sm">Status</span>
            </template>
            <USelectMenu
              v-model="filters.status"
              :options="statusOptions"
              placeholder="All Status"
              value-attribute="value"
              option-attribute="label"
              @change="onFilterChange"
              class="w-full"
            />
          </UFormGroup>
          
          <UFormGroup class="mb-4">
            <template #label>
              <span class="text-black font-bold text-sm">Installation Type</span>
            </template>
            <USelectMenu
              v-model="filters.installation_type"
              :options="installationTypeOptions"
              placeholder="All Types"
              value-attribute="value"
              option-attribute="label"
              @change="onFilterChange"
              class="w-full"
            />
          </UFormGroup>
          
          <UFormGroup class="mb-4">
            <template #label>
              <span class="text-black font-bold text-sm">Date From</span>
            </template>
            <UInput 
              v-model="filters.date_from" 
              type="date" 
              @change="onFilterChange"
              class="w-full"
            />
          </UFormGroup>
          
          <UFormGroup class="mb-4">
            <template #label>
              <span class="text-black font-bold text-sm">Date To</span>
            </template>
            <UInput 
              v-model="filters.date_to" 
              type="date" 
              @change="onFilterChange"
              class="w-full"
            />
          </UFormGroup>
        </div>
        
        <!-- Active Filters Display -->
        <div v-if="hasActiveFilters" class="mt-4 pt-4 border-t border-blue-200">
          <div class="flex items-center flex-wrap gap-2">
            <span class="text-sm font-medium text-blue-700">Active Filters:</span>
            <span v-if="filters.search" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              Search: "{{ filters.search }}"
              <button @click="clearFilter('search')" class="ml-1 hover:text-indigo-600">
                <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
              </button>
            </span>
            <span v-if="filters.status" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Status: {{ getStatusLabel(filters.status) }}
              <button @click="clearFilter('status')" class="ml-1 hover:text-blue-600">
                <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
              </button>
            </span>
            <span v-if="filters.installation_type" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Type: {{ getInstallationTypeLabel(filters.installation_type) }}
              <button @click="clearFilter('installation_type')" class="ml-1 hover:text-green-600">
                <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
              </button>
            </span>
            <span v-if="filters.date_from" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              From: {{ formatFilterDate(filters.date_from) }}
              <button @click="clearFilter('date_from')" class="ml-1 hover:text-purple-600">
                <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
              </button>
            </span>
            <span v-if="filters.date_to" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              To: {{ formatFilterDate(filters.date_to) }}
              <button @click="clearFilter('date_to')" class="ml-1 hover:text-purple-600">
                <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
              </button>
            </span>
          </div>
        </div>
      </div>

      <!-- Reports Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Technician
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tgl. Permintaan PSB
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tgl. Selesai Instalasi
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durasi PSB
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status PSB
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assets
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="loading" class="text-center">
              <td colspan="10" class="px-6 py-4">
                <div class="flex justify-center">
                  <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
                </div>
              </td>
            </tr>
            <tr v-else-if="filteredReports.length === 0" class="text-center">
              <td colspan="10" class="px-6 py-4 text-gray-500">
                No installation reports found
              </td>
            </tr>
            <tr v-else v-for="report in paginatedReports" :key="report.installation_id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900">{{ report.customer_name || 'Unknown' }}</div>
                  <div class="text-sm text-gray-500">{{ report.customer_phone || '-' }}</div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900">{{ report.technician_name || 'Unknown' }}</div>
                  <div class="text-sm text-gray-500">{{ report.technician_phone || '-' }}</div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {{ report.installation_type || 'Unknown' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getStatusColor(report.installation_status)" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                  {{ report.installation_status || 'Unknown' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(report.tgl_permintaan_psb) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(report.installation_completed_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span v-if="report.durasi_psb !== null && report.durasi_psb !== undefined" class="font-medium">
                  {{ report.durasi_psb }} hari
                </span>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span v-if="report.status_psb" 
                      :class="report.status_psb === 'Tepat Waktu' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                      class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                  {{ report.status_psb }}
                </span>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ report.router_brand || '-' }} {{ report.router_model || '' }}</div>
                <div class="text-sm text-gray-500">{{ report.mac_address || '-' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                  <UButton @click="viewReport(report.installation_id)" size="sm" color="blue" variant="outline">
                    View
                  </UButton>
                  <UButton @click="editReport(report.installation_id)" size="sm" color="green" variant="outline">
                    Edit
                  </UButton>
                  <UButton @click="deleteReport(report.installation_id)" size="sm" color="red" variant="outline">
                    Delete
                  </UButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-6">
        <div class="text-sm text-gray-700">
          Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, totalItems) }} of {{ totalItems }} results
        </div>
        <div class="flex space-x-2">
          <UButton 
            @click="previousPage" 
            :disabled="currentPage === 1"
            size="sm" 
            variant="outline"
          >
            Previous
          </UButton>
          <UButton 
            @click="nextPage" 
            :disabled="currentPage >= totalPages"
            size="sm" 
            variant="outline"
          >
            Next
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { customerAdminApi } from "@/api/admin/customer";
import type { InstallationReportCompleteResponse } from "@/types/requests/installation-report";

// Apply auth middleware
definePageMeta({
  middleware: 'auth'
})

const loading = ref(false);
const reports = ref<InstallationReportCompleteResponse[]>([]);
const filteredReports = ref<InstallationReportCompleteResponse[]>([]);

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(10);
const totalItems = computed(() => filteredReports.value.length);
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value));

// Paginated reports
const paginatedReports = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredReports.value.slice(start, end);
});

// Filters
const filters = reactive({
  search: '',
  status: '',
  installation_type: '',
  date_from: '',
  date_to: ''
} as {
  search: string;
  status: string;
  installation_type: string;
  date_from: string;
  date_to: string;
  [key: string]: string;
});

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return filters.search || filters.status || filters.installation_type || filters.date_from || filters.date_to;
});

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const installationTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'new_installation', label: 'New Installation' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'upgrade', label: 'Upgrade' },
  { value: 'downgrade', label: 'Downgrade' }
];

onMounted(async () => {
  await loadReports();
});

async function loadReports() {
  loading.value = true;
  try {
    const response = await customerAdminApi().getInstallationReportComplete();
    console.log("API Response:", response);
    
    // Check if response has data property and it's an array
    if (response && response.data && Array.isArray(response.data)) {
      reports.value = response.data;
      filteredReports.value = [...response.data];
    } else if (response && Array.isArray(response)) {
      // If response is directly an array
      reports.value = response;
      filteredReports.value = [...response];
    } else {
      console.warn("Unexpected response format:", response);
      reports.value = [];
      filteredReports.value = [];
    }
  } catch (error) {
    console.error("Failed to load reports:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    reports.value = [];
    filteredReports.value = [];
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  let filtered = [...reports.value];

  // Search filter
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(report => 
      (report.customer_name && report.customer_name.toLowerCase().includes(searchTerm)) ||
      (report.customer_phone && report.customer_phone.toLowerCase().includes(searchTerm)) ||
      (report.technician_name && report.technician_name.toLowerCase().includes(searchTerm)) ||
      (report.technician_phone && report.technician_phone.toLowerCase().includes(searchTerm)) ||
      (report.router_brand && report.router_brand.toLowerCase().includes(searchTerm)) ||
      (report.router_model && report.router_model.toLowerCase().includes(searchTerm)) ||
      (report.mac_address && report.mac_address.toLowerCase().includes(searchTerm))
    );
  }

  // Status filter
  if (filters.status) {
    filtered = filtered.filter(report => report.installation_status === filters.status);
  }

  // Installation type filter
  if (filters.installation_type) {
    filtered = filtered.filter(report => report.installation_type === filters.installation_type);
  }

  // Date from filter
  if (filters.date_from) {
    filtered = filtered.filter(report => {
      if (!report.on_air_date) return false;
      return new Date(report.on_air_date) >= new Date(filters.date_from);
    });
  }

  // Date to filter
  if (filters.date_to) {
    filtered = filtered.filter(report => {
      if (!report.on_air_date) return false;
      return new Date(report.on_air_date) <= new Date(filters.date_to);
    });
  }

  filteredReports.value = filtered;
  currentPage.value = 1; // Reset to first page when filtering
}

// Debounced search function
let searchTimeout: NodeJS.Timeout | null = null;

// Real-time filtering when filter values change
function onFilterChange(event?: Event) {
  // For search input, add debounce
  if (event && (event.target as HTMLInputElement)?.type === 'text') {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
      applyFilters();
    }, 300); // 300ms delay
  } else {
    // For other filters (select, date), apply immediately
    applyFilters();
  }
}

// Clear all filters
function clearFilters() {
  filters.search = '';
  filters.status = '';
  filters.installation_type = '';
  filters.date_from = '';
  filters.date_to = '';
  applyFilters();
}

// Clear individual filter
function clearFilter(filterName: string) {
  filters[filterName] = '';
  applyFilters();
}

// Get label for status filter
function getStatusLabel(value: string) {
  const option = statusOptions.find(opt => opt.value === value);
  return option ? option.label : value;
}

// Get label for installation type filter
function getInstallationTypeLabel(value: string) {
  const option = installationTypeOptions.find(opt => opt.value === value);
  return option ? option.label : value;
}

// Format date for filter display
function formatFilterDate(dateString: string) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function viewReport(installationId: string) {
  navigateTo(`/dashboard/report/customer-installation/detail/${installationId}`);
}

function editReport(installationId: string) {
  // Navigate to edit page or open edit modal
  navigateTo(`/dashboard/report/customer-installation/edit/${installationId}`);
}

async function deleteReport(installationId: string) {
  try {
    await customerAdminApi().deleteInstallationReport(installationId);
    
    // Show success notification
    useToast().add({
      title: "Success!",
      description: "Installation report deleted successfully",
      color: "green",
    });
    
    // Reload reports to reflect the changes
    await loadReports();
  } catch (error) {
    console.error("Error deleting installation report:", error);
    
    // Show error notification
    useToast().add({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to delete installation report",
      color: "red",
    });
  }
}

function exportReports() {
  try {
    // Create CSV content
    const headers = ['Customer Name', 'Customer Phone', 'Technician Name', 'Technician Phone', 'Installation Type', 'Status', 'On Air Date', 'Router Brand', 'Router Model', 'MAC Address'];
    const csvContent = [
      headers.join(','),
      ...filteredReports.value.map(report => [
        `"${report.customer_name || ''}"`,
        `"${report.customer_phone || ''}"`,
        `"${report.technician_name || ''}"`,
        `"${report.technician_phone || ''}"`,
        `"${report.installation_type || ''}"`,
        `"${report.installation_status || ''}"`,
        `"${formatDate(report.on_air_date)}"`,
        `"${report.router_brand || ''}"`,
        `"${report.router_model || ''}"`,
        `"${report.mac_address || ''}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `installation_reports_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Export failed:", error);
  }
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function getStatusColor(status: string | undefined) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function formatDate(dateString: string | undefined) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
</script>

<style scoped>
/* Deep selector untuk mengoverride UFormGroup label */
:deep(.filter-label),
:deep(.filter-label *),
:deep([class*="filter-label"]),
:deep([class*="filter-label"] *) {
  color: #000000 !important;
  font-weight: 700 !important;
  font-size: 14px !important;
}

/* Fallback dengan selector yang lebih spesifik */
:deep(.form-group label),
:deep(.form-group .label),
:deep(.u-form-group label),
:deep(.u-form-group .label) {
  color: #000000 !important;
  font-weight: 700 !important;
  font-size: 14px !important;
}

/* Global override untuk semua label di komponen ini */
:deep(label) {
  color: #000000 !important;
  font-weight: 700 !important;
  font-size: 14px !important;
}
</style>
