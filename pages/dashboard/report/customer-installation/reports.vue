<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
    <div class="container mx-auto p-4 sm:p-6">
      <div class="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <!-- Header Section -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-gray-800">Installation Reports</h1>
            <p class="text-sm text-gray-600 mt-1">View and manage installation reports</p>
          </div>
          <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <UButton @click="goBackToDashboard" 
                     color="gray" variant="outline"
                     class="w-full sm:w-auto">
              <LucideIcon name="arrow-left" :size="16" class="mr-2" />
              Back to Dashboard
            </UButton>
            <UButton @click="exportReports" 
                     color="green" variant="outline"
                     class="w-full sm:w-auto">
              <LucideIcon name="download" :size="16" class="mr-2" />
              Export Reports
            </UButton>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl border border-blue-200 mb-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h3 class="text-base sm:text-lg font-semibold text-blue-800 flex items-center">
              <UIcon name="funnel" class="mr-2" />
              Filters
            </h3>
            <div class="flex flex-col sm:flex-row gap-2">
              <UButton @click="clearFilters" 
                       color="gray" variant="outline" size="sm"
                       class="w-full sm:w-auto">
                <LucideIcon name="x" :size="16" class="mr-1" />
                Clear All
              </UButton>
              <UButton @click="applyFilters" 
                       color="blue" size="sm"
                       class="w-full sm:w-auto">
                <LucideIcon name="search" :size="16" class="mr-1" />
                Apply Filters
              </UButton>
            </div>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            <UFormGroup class="mb-3 sm:mb-4">
              <template #label>
                <span class="text-black font-bold text-xs sm:text-sm">Search</span>
              </template>
              <UInput 
                v-model="filters.search"
                placeholder="Search customer, technician..."
                @input="onFilterChange"
                class="w-full search-input-dark"
              >
                <template #leading>
                  <LucideIcon name="search" :size="16" class="search-icon-white" />
                </template>
              </UInput>
            </UFormGroup>
            
            <UFormGroup class="mb-3 sm:mb-4">
              <template #label>
                <span class="text-black font-bold text-xs sm:text-sm">Status</span>
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
            
            <UFormGroup class="mb-3 sm:mb-4">
              <template #label>
                <span class="text-black font-bold text-xs sm:text-sm">Installation Type</span>
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
            
            <UFormGroup class="mb-3 sm:mb-4">
              <template #label>
                <span class="text-black font-bold text-xs sm:text-sm">Date From</span>
              </template>
              <UInput 
                v-model="filters.date_from" 
                type="date" 
                @change="onFilterChange"
                class="w-full"
              />
            </UFormGroup>
            
            <UFormGroup class="mb-3 sm:mb-4">
              <template #label>
                <span class="text-black font-bold text-xs sm:text-sm">Date To</span>
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
                <UIcon name="x" class="w-3 h-3" />
              </button>
            </span>
            <span v-if="filters.status" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Status: {{ getStatusLabel(filters.status) }}
              <button @click="clearFilter('status')" class="ml-1 hover:text-blue-600">
                <UIcon name="x" class="w-3 h-3" />
              </button>
            </span>
            <span v-if="filters.installation_type" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Type: {{ getInstallationTypeLabel(filters.installation_type) }}
              <button @click="clearFilter('installation_type')" class="ml-1 hover:text-green-600">
                <UIcon name="x" class="w-3 h-3" />
              </button>
            </span>
            <span v-if="filters.date_from" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              From: {{ formatFilterDate(filters.date_from) }}
              <button @click="clearFilter('date_from')" class="ml-1 hover:text-purple-600">
                <UIcon name="x" class="w-3 h-3" />
              </button>
            </span>
            <span v-if="filters.date_to" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              To: {{ formatFilterDate(filters.date_to) }}
              <button @click="clearFilter('date_to')" class="ml-1 hover:text-purple-600">
                <UIcon name="x" class="w-3 h-3" />
              </button>
            </span>
          </div>
        </div>
      </div>

        <!-- Mobile Card View -->
        <div class="block sm:hidden space-y-4">
          <div v-if="loading" class="text-center py-8">
            <UIcon name="refresh-cw" class="animate-spin text-2xl text-blue-600 mb-2" />
            <p class="text-gray-600">Loading reports...</p>
          </div>
          <div v-else-if="filteredReports.length === 0" class="text-center py-8 text-gray-500">
            <UIcon name="file-text" class="text-4xl mb-2" />
            <p>No installation reports found</p>
          </div>
          <div v-else v-for="report in paginatedReports" :key="report.installation_id" 
               class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <!-- Report Header -->
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 text-sm">{{ report.customer_name || 'Unknown' }}</h3>
                <p class="text-xs text-gray-500">{{ report.customer_phone || '-' }}</p>
              </div>
              <div class="flex flex-col gap-1">
                <span :class="getStatusColor(report.installation_status)" 
                      class="px-2 py-1 rounded-full text-xs font-medium">
                  {{ report.installation_status || 'Unknown' }}
                </span>
                <span class="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {{ report.installation_type || 'Unknown' }}
                </span>
              </div>
            </div>

            <!-- Report Details -->
            <div class="space-y-2 text-xs">
              <div class="flex items-center gap-2">
                <UIcon name="user" class="w-3 h-3 text-gray-400" />
                <span class="text-gray-600">Technician: {{ report.technician_name || 'Unknown' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <UIcon name="phone" class="w-3 h-3 text-gray-400" />
                <span class="text-gray-600">{{ report.technician_phone || '-' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <UIcon name="calendar" class="w-3 h-3 text-gray-400" />
                <span class="text-gray-600">PSB: {{ formatDate(report.tgl_permintaan_psb) }}</span>
              </div>
              <div class="flex items-center gap-2">
                <UIcon name="check-circle" class="w-3 h-3 text-gray-400" />
                <span class="text-gray-600">Completed: {{ formatDate(report.installation_completed_at) }}</span>
              </div>
              <div v-if="report.durasi_psb !== null && report.durasi_psb !== undefined" class="flex items-center gap-2">
                <UIcon name="clock" class="w-3 h-3 text-gray-400" />
                <span class="text-gray-600">Duration: {{ report.durasi_psb }} hari</span>
              </div>
              <div v-if="report.status_psb" class="flex items-center gap-2">
                <UIcon name="flag" class="w-3 h-3 text-gray-400" />
                <span :class="report.status_psb === 'Tepat Waktu' ? 'text-green-600' : 'text-red-600'" class="font-medium">
                  PSB: {{ report.status_psb }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <UIcon name="cube" class="w-3 h-3 text-gray-400" />
                <span class="text-gray-600">{{ report.router_brand || '-' }} {{ report.router_model || '' }}</span>
              </div>
              <div v-if="report.mac_address" class="flex items-center gap-2">
                <UIcon name="computer-desktop" class="w-3 h-3 text-gray-400" />
                <span class="text-gray-600 font-mono text-xs">{{ report.mac_address }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 mt-3">
              <UButton @click="viewReport(report.installation_id)" size="sm" color="blue" variant="outline" class="flex-1">
                View
              </UButton>
              <UButton @click="editReport(report.installation_id)" size="sm" color="green" variant="outline" class="flex-1">
                Edit
              </UButton>
              <UButton @click="deleteReport(report.installation_id)" size="sm" color="red" variant="outline" class="flex-1">
                Delete
              </UButton>
            </div>
          </div>
        </div>

        <!-- Desktop Table View -->
        <div class="hidden sm:block">
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <UTable :rows="paginatedReports" :columns="columns" class="w-full installation-reports-table">
              <template #customer-data="{ row }">
                <div class="table-cell-content">
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ row.customer_name || 'Unknown' }}</div>
                    <div class="text-sm text-gray-500">{{ row.customer_phone || '-' }}</div>
                  </div>
                </div>
              </template>

              <template #technician-data="{ row }">
                <div class="table-cell-content">
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ row.technician_name || 'Unknown' }}</div>
                    <div class="text-sm text-gray-500">{{ row.technician_phone || '-' }}</div>
                  </div>
                </div>
              </template>

              <template #type-data="{ row }">
                <div class="table-cell-content">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {{ row.installation_type || 'Unknown' }}
                  </span>
                </div>
              </template>

              <template #status-data="{ row }">
                <div class="table-cell-content">
                  <span :class="getStatusColor(row.installation_status)" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ row.installation_status || 'Unknown' }}
                  </span>
                </div>
              </template>

              <template #tgl_permintaan_psb-data="{ row }">
                <div class="table-cell-content">
                  <span class="text-sm text-gray-900 whitespace-nowrap">{{ formatDate(row.tgl_permintaan_psb) }}</span>
                </div>
              </template>

              <template #tgl_selesai_instalasi-data="{ row }">
                <div class="table-cell-content">
                  <span class="text-sm text-gray-900 whitespace-nowrap">{{ formatDate(row.installation_completed_at) }}</span>
                </div>
              </template>

              <template #durasi_psb-data="{ row }">
                <div class="table-cell-content">
                  <span v-if="row.durasi_psb !== null && row.durasi_psb !== undefined" class="text-sm font-medium text-gray-900 whitespace-nowrap">
                    {{ row.durasi_psb }} hari
                  </span>
                  <span v-else class="text-sm text-gray-400 whitespace-nowrap">-</span>
                </div>
              </template>

              <template #status_psb-data="{ row }">
                <div class="table-cell-content">
                  <span v-if="row.status_psb"
                        :class="row.status_psb === 'Tepat Waktu' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                        class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap">
                    {{ row.status_psb }}
                  </span>
                  <span v-else class="text-sm text-gray-400 whitespace-nowrap">-</span>
                </div>
              </template>

              <template #assets-data="{ row }">
                <div class="table-cell-content">
                  <div class="text-sm text-gray-900 truncate">{{ row.router_brand || '-' }} {{ row.router_model || '' }}</div>
                  <div class="text-sm text-gray-500 truncate">{{ row.mac_address || '-' }}</div>
                </div>
              </template>

              <template #actions-data="{ row }">
                <div class="table-cell-content">
                  <div class="flex justify-center">
                    <UDropdown :items="items(row)">
                      <UButton color="gray" size="sm">
                        <LucideIcon name="ellipsis-vertical" :size="16" />
                      </UButton>
                    </UDropdown>
                  </div>
                </div>
              </template>
            </UTable>
          </div>
        </div>

        <!-- Pagination -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
          <div class="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, totalItems) }} of {{ totalItems }} results
          </div>
          <div class="flex justify-center sm:justify-end gap-2">
            <UButton 
              @click="previousPage" 
              :disabled="currentPage === 1"
              size="sm" 
              variant="outline"
              class="w-full sm:w-auto"
            >
              Previous
            </UButton>
            <UButton 
              @click="nextPage" 
              :disabled="currentPage >= totalPages"
              size="sm" 
              variant="outline"
              class="w-full sm:w-auto"
            >
              Next
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <UModal
      :model-value="showDeleteModal"
      @update:model-value="showDeleteModal = $event"
      class="delete-modal"
      :ui="{ background: 'bg-white' }"
      teleport="body"
    >
      <div class="portrait-modal-panel" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
        <div class="portrait-modal-inner bg-white rounded-xl shadow-lg">
          <!-- Header -->
          <header class="portrait-modal-header p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 id="delete-modal-title" class="text-lg font-bold text-gray-900">Delete Installation Report</h2>
            <UButton
              @click="closeDeleteModal"
              variant="outline"
              color="gray"
              size="md"
              class="delete-close-button"
              aria-label="Close delete dialog"
            >
              <LucideIcon name="x" :size="20" />
            </UButton>
          </header>

          <!-- Scrollable content area -->
          <div class="portrait-modal-body overflow-y-auto p-4 space-y-4">
            <!-- Customer Information -->
            <section class="bg-white rounded-lg p-4 border border-gray-200">
              <h3 class="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <LucideIcon name="user" class="w-5 h-5 text-blue-600" />
                Customer Information
              </h3>
              <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md p-3 border border-blue-100">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white">
                    <LucideIcon name="user" class="w-5 h-5" />
                  </div>
                  <div class="truncate">
                    <div class="font-semibold text-gray-800 text-sm">{{ selectedReport?.customer_name || 'Unknown Customer' }}</div>
                    <div class="text-xs text-gray-500 font-mono mt-1">ID: {{ selectedReport?.installation_id || 'N/A' }}</div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Critical Warning -->
            <section class="bg-white rounded-lg p-4 border border-gray-200">
              <h3 class="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <LucideIcon name="alert-triangle" class="w-5 h-5 text-red-600" />
                Critical Warning
              </h3>
              <div class="bg-red-50 border border-red-200 rounded-md p-3">
                <div class="flex gap-3">
                  <div class="flex-shrink-0">
                    <div class="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white">
                      <LucideIcon name="alert-triangle" class="w-4 h-4" />
                    </div>
                  </div>
                  <div class="flex-1 text-sm text-red-800">
                    <strong class="block mb-2">⚠️ CRITICAL WARNING</strong>
                    <p class="mb-2">You are about to <span class="font-bold">PERMANENTLY DELETE</span> this installation report and all associated data.</p>
                    <ul class="list-disc list-inside text-red-700 space-y-1">
                      <li>Delete the installation report and clean up RouterOS configurations</li>
                      <li>Update MAC status to "in_stock"</li>
                      <li>Remove technician assignments and assets</li>
                      <li>Delete associated invoices and network items</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <!-- Impact Summary -->
            <section class="bg-white rounded-lg p-4 border border-gray-200">
              <h3 class="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <LucideIcon name="info" class="w-5 h-5 text-gray-600" />
                Impact Summary
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="p-3 bg-white rounded border">
                  <div class="text-xs text-gray-500">Customer</div>
                  <div class="font-semibold text-gray-900 text-sm">{{ selectedReport?.customer_name || 'Unknown' }}</div>
                </div>
                <div class="p-3 bg-white rounded border">
                  <div class="text-xs text-gray-500">Status</div>
                  <div class="font-semibold text-sm" :class="getStatusColor(selectedReport?.installation_status)">{{ selectedReport?.installation_status || 'Unknown' }}</div>
                </div>
                <div class="p-3 bg-white rounded border">
                  <div class="text-xs text-gray-500">Report ID</div>
                  <div class="font-mono text-sm text-gray-800">{{ selectedReport?.installation_id || 'N/A' }}</div>
                </div>
                <div class="p-3 bg-white rounded border">
                  <div class="text-xs text-gray-500">MAC Address</div>
                  <div class="font-mono text-sm text-blue-800">{{ selectedReport?.mac_address || 'Not available' }}</div>
                </div>
              </div>
            </section>
          </div>

          <!-- Footer: Delete Confirmation (fixed at bottom of modal panel) -->
          <footer class="portrait-modal-footer border-t border-gray-200 p-4 bg-white">
            <div class="space-y-3">
              <div class="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start gap-3">
                <UCheckbox v-model="deleteConfirmationChecked" :disabled="deleting" color="red" class="mt-1" />
                <div class="text-sm text-gray-800">
                  I understand that this action will <span class="font-bold text-red-700 mx-1">PERMANENTLY DELETE</span> the installation report for
                  <strong class="text-blue-600">"{{ selectedReport?.customer_name || 'Unknown' }}"</strong> and all associated data.
                  <div class="text-xs text-red-600 mt-1 flex items-center"><LucideIcon name="alert-triangle" class="w-4 h-4 mr-1" />This action CANNOT be undone!</div>
                </div>
              </div>

              <div class="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-3">
                <div class="text-xs text-gray-600 flex items-center gap-1">
                  <LucideIcon name="info" class="w-4 h-4 text-yellow-600" />
                  All warnings must be read
                </div>
                <div class="flex gap-3 w-full sm:w-auto">
                  <UButton
                    type="button"
                    @click="closeDeleteModal"
                    variant="outline"
                    color="gray"
                    size="lg"
                    :disabled="deleting"
                    class="flex-1 sm:flex-initial"
                  >
                    Cancel
                  </UButton>
                  <UButton
                    type="submit"
                    @click="confirmDelete"
                    color="red"
                    variant="solid"
                    size="lg"
                    :loading="deleting"
                    :disabled="!deleteConfirmationChecked"
                    class="flex-1 sm:flex-initial font-semibold shadow-sm"
                  >
                    <LucideIcon v-if="!deleting" name="trash-2" :size="18" class="mr-2" />
                    {{ deleting ? 'Deleting...' : 'Delete Report' }}
                  </UButton>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { customerAdminApi } from "@/api/admin/customer";
import type { InstallationReportCompleteResponse } from "@/types/requests/installation-report";
import { useNavigationContext } from "@/composables/useNavigationContext";
import LucideIcon from "@/components/LucideIcon.vue";

type DropdownItem = {
  label: string
  icon: string
  click: () => void
  disabled?: boolean
}

// Apply auth middleware
definePageMeta({
  middleware: 'auth'
})

// Table columns definition matching Customer table format
const columns = [
  {
    key: 'customer',
    label: 'Customer'
  },
  {
    key: 'technician',
    label: 'Technician'
  },
  {
    key: 'type',
    label: 'Type'
  },
  {
    key: 'status',
    label: 'Status'
  },
  {
    key: 'tgl_permintaan_psb',
    label: 'Tgl. Permintaan PSB'
  },
  {
    key: 'tgl_selesai_instalasi',
    label: 'Tgl. Selesai Instalasi'
  },
  {
    key: 'durasi_psb',
    label: 'Durasi PSB'
  },
  {
    key: 'status_psb',
    label: 'Status PSB'
  },
  {
    key: 'assets',
    label: 'Assets'
  },
  {
    key: 'actions',
    label: 'Actions'
  }
]

const loading = ref(false);
const reports = ref<InstallationReportCompleteResponse[]>([]);
const filteredReports = ref<InstallationReportCompleteResponse[]>([]);
const showDeleteModal = ref(false);
const deleteConfirmationChecked = ref(false);
const deleting = ref(false);
const selectedReport = ref<InstallationReportCompleteResponse | null>(null);

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(10);
const totalItems = computed(() => filteredReports.value.length);
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value));

// Paginated reports for mobile view
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
  
  // Check for customer_id in URL parameters
  const route = useRoute();
  const customerId = route.query.customer_id as string;
  if (customerId) {
    // Filter by customer ID
    filters.search = customerId;
    applyFilters();
  }
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
      (report.customer_id && report.customer_id.toLowerCase().includes(searchTerm)) ||
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
  // Set navigation context to indicate we came from reports page
  const { setNavigationContext } = useNavigationContext();
  setNavigationContext({
    from: 'reports',
    returnUrl: '/dashboard/report/customer-installation/reports',
    returnLabel: 'Back to Reports'
  });
  
  navigateTo(`/dashboard/report/customer-installation/detail/${installationId}`);
}

function editReport(installationId: string) {
  // Navigate to edit page or open edit modal
  navigateTo(`/dashboard/report/customer-installation/edit/${installationId}`);
}

// Navigation helper for template
function goBackToDashboard() {
  navigateTo('/dashboard/report/customer-installation')
}

function deleteReport(installationId: string) {
  // Find the report to populate modal
  const report = filteredReports.value.find((r: InstallationReportCompleteResponse) => r.installation_id === installationId);
  if (report) {
    selectedReport.value = report;
    showDeleteModal.value = true;
  }
}

function closeDeleteModal() {
  showDeleteModal.value = false;
  deleteConfirmationChecked.value = false;
  selectedReport.value = null;
}

async function confirmDelete() {
  if (!selectedReport.value || !deleteConfirmationChecked.value || deleting.value) return;
  
  const installationId = selectedReport.value.installation_id;
  const customerName = selectedReport.value.customer_name || 'Unknown Customer';
  
  deleting.value = true;
  
  try {
    await customerAdminApi().deleteInstallationReport(installationId);
    
    // Show success notification
    useToast().add({
      title: "Success!",
      description: `Installation report for "${customerName}" deleted successfully. MAC address status updated to "in_stock".`,
      color: "green",
    });
    
    closeDeleteModal();
    
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
  } finally {
    deleting.value = false;
  }
}

function exportReports() {
  try {
    // Create CSV content
    const headers = ['Customer Name', 'Customer Phone', 'Technician Name', 'Technician Phone', 'Installation Type', 'Status', 'On Air Date', 'Router Brand', 'Router Model', 'MAC Address'];
    const csvContent = [
      headers.join(','),
      ...filteredReports.value.map((report: InstallationReportCompleteResponse) => [
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

const items = (row: InstallationReportCompleteResponse) => {
  const baseItems: DropdownItem[][] = [
    [{
      label: 'View Report',
      icon: 'eye-20-solid',
      click: () => viewReport(row.installation_id)
    }, {
      label: 'Edit Report',
      icon: 'pencil-square-20-solid',
      click: () => editReport(row.installation_id)
    }],
    [{
      label: 'Delete Report',
      icon: 'trash-2-20-solid',
      click: () => deleteReport(row.installation_id)
    }]
  ]

  return baseItems
}
</script>

<style scoped>
/* ===== modal: keep footer INSIDE panel and sticky within modal ===== */
.delete-modal :deep([id^="headlessui-dialog-overlay"]) {
  position: fixed !important;
  inset: 0 !important;
  background-color: rgba(17,24,39,0.45) !important;
  z-index: 60 !important;
}

/* Panel wrapper: center & bounded height */
.portrait-modal-panel,
.delete-modal :deep([id^="headlessui-dialog-panel"]) {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  z-index: 70 !important;

  width: min(420px, 95vw) !important;
  max-width: 95vw !important;
  max-height: 90vh !important;

  display: flex !important;
  flex-direction: column !important;
  min-height: 0 !important;
  overflow: hidden !important; /* IMPORTANT: prevent children from escaping */
  border-radius: 12px !important;
  box-shadow: 0 12px 40px rgba(0,0,0,0.18) !important;
  -webkit-overflow-scrolling: touch !important;
}

/* Inner container: header fixed, body scrolls, footer sticky */
.portrait-modal-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

/* Header (non-scrolling) */
.portrait-modal-header {
  flex: 0 0 auto;
  padding: 1rem;
  border-bottom: 1px solid rgba(229,231,235,1);
}

/* Body: scrollable area inside panel */
.portrait-modal-body {
  flex: 1 1 auto;
  min-height: 0; /* VITAL for flex scrolling */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 1rem;
  box-sizing: border-box;

  /* Add extra bottom padding so content can scroll above the sticky footer */
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
}

/* Footer: sticky within the panel (NOT fixed to viewport) */
.portrait-modal-footer {
  position: sticky;       /* keeps footer at bottom of panel while body scrolls */
  bottom: 0;              /* relative to the panel */
  left: 0;
  z-index: 12;            /* above body content inside panel */
  width: 100%;
  flex: 0 0 auto;
  padding: 1rem;
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(229,231,235,1);
  background: linear-gradient(#ffffff, #ffffff); /* avoid transparency artifacts */
  box-shadow: 0 -6px 12px rgba(0,0,0,0.04);
  box-sizing: border-box;
}

/* Ensure action buttons are properly visible and don't overflow */
.portrait-modal-footer .flex.gap-3 {
  width: 100%;
}

/* Mobile: center buttons vertically, desktop: align to end */
@media (max-width: 640px) {
  .portrait-modal-footer .flex.gap-3 {
    justify-content: center;
  }
}

@media (min-width: 641px) {
  .portrait-modal-footer .flex.gap-3 {
    justify-content: flex-end;
  }
}

.portrait-modal-footer .flex.gap-3 > * {
  min-width: 0; /* allow buttons to shrink */
}

/* Mobile adjustments (panel near full height but contained) */
@media (max-width: 640px) {
  .portrait-modal-panel,
  .delete-modal :deep([id^="headlessui-dialog-panel"]) {
    top: 1rem !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: calc(100vw - 1.5rem) !important;
    max-height: calc(100vh - 2rem) !important;
  }
  .portrait-modal-body { padding-bottom: calc(0.75rem + env(safe-area-inset-bottom)); }
  .portrait-modal-footer { padding-bottom: calc(0.75rem + env(safe-area-inset-bottom)); }
}

/* Keep close button style unchanged but ensure it doesn't escape layout */
.delete-close-button {
  border: 2px solid #D1D5DB !important;
  background-color: #FFFFFF !important;
  color: #374151 !important;
  min-width: 36px !important;
  min-height: 36px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 8px !important;
}

.delete-close-button:hover {
  background-color: #FEF2F2 !important;
  border-color: #F87171 !important;
  color: #DC2626 !important;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1) !important;
  transform: scale(1.05) !important;
}

.delete-close-button:active {
  transform: scale(0.95) !important;
}

.delete-close-button:focus {
  outline: 2px solid #2563EB !important;
  outline-offset: 2px !important;
}
/* ===== end modal scroll fix ===== */
</style>
