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
            <UButton @click="navigateTo('/dashboard/report/customer-installation')" 
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
        <div class="hidden sm:block overflow-x-auto">
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
                    <UIcon name="refresh-cw" class="animate-spin text-2xl" />
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
    <UModal :model-value="showDeleteModal" @update:model-value="showDeleteModal = $event" :ui="{ width: 'w-full sm:max-w-lg' }">
      <UCard class="bg-white dark:bg-gray-800">
        <template #header>
          <div class="flex items-center justify-between bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-4 -m-4 mb-4 rounded-t-lg">
            <h3 class="text-xl font-bold text-red-700 dark:text-red-300 flex items-center">
              <div class="bg-red-500 p-3 rounded-xl mr-4 shadow-lg">
                <UIcon name="trash-2" class="w-6 h-6 text-white" />
              </div>
              Delete Installation Report
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="x"
              @click="closeDeleteModal"
              :disabled="deleting"
              class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            />
          </div>
        </template>

        <div class="space-y-6">
          <!-- Customer Information -->
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border-2 border-blue-200 dark:border-blue-700">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <UIcon name="user" class="text-white text-2xl" />
              </div>
              <div>
                <h4 class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ selectedReport?.customer_name || 'Unknown Customer' }}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-1">
                  ID: {{ selectedReport?.installation_id || 'N/A' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Warning Message -->
          <div class="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border-2 border-red-300 dark:border-red-600 rounded-xl p-6 shadow-lg">
            <div class="flex items-start">
              <div class="bg-red-500 p-3 rounded-full mr-4 flex-shrink-0 shadow-lg">
                <UIcon name="alert-triangle" class="text-white text-2xl" />
              </div>
              <div class="flex-1">
                <h5 class="text-xl font-bold text-red-800 dark:text-red-200 mb-3">⚠️ CRITICAL WARNING</h5>
                <p class="text-red-700 dark:text-red-300 text-base leading-relaxed mb-4 font-medium">
                  You are about to <strong class="text-red-900 dark:text-red-100">PERMANENTLY DELETE</strong> this installation report and all associated data.
                </p>
                <div class="bg-white dark:bg-gray-800 border-2 border-red-400 dark:border-red-500 rounded-lg p-4 shadow-inner">
                  <p class="text-red-800 dark:text-red-200 text-base font-bold mb-3 flex items-center">
                    <UIcon name="list-bullet" class="w-5 h-5 mr-2" />
                    This action will:
                  </p>
                  <ul class="text-red-700 dark:text-red-300 text-sm list-disc list-inside space-y-2 font-medium">
                    <li class="flex items-start">
                      <UIcon name="trash-2" class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <strong>Delete the installation report and clean up all Mikrotik RouterOS configurations</strong>
                    </li>
                    <li class="flex items-start">
                      <UIcon name="refresh-cw" class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <strong>Update the MAC address status back to "in_stock"</strong>
                    </li>
                    <li class="flex items-start">
                      <UIcon name="user-group" class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <strong>Remove all related technician assignments and asset transactions</strong>
                    </li>
                    <li class="flex items-start">
                      <UIcon name="cpu-chip" class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <strong>Delete all associated network devices, cables, and images</strong>
                    </li>
                    <li class="flex items-start">
                      <UIcon name="refresh-cw" class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <strong>Delete all associated recurring invoices</strong>
                    </li>
                    <li class="flex items-start">
                      <UIcon name="settings-6-tooth" class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <strong>Remove Mikrotik configurations: queue rules, hotspot bindings, netwatch entries, schedulers, scripts, and DHCP leases</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Impact Summary -->
          <div class="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-700 dark:to-slate-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-5 shadow-lg">
            <h6 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
              <div class="bg-gray-500 p-2 rounded-lg mr-3">
                <UIcon name="info" class="w-5 h-5 text-white" />
              </div>
              Impact Summary
            </h6>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                <span class="text-sm font-semibold text-gray-600 dark:text-gray-400 block">Customer:</span>
                <span class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ selectedReport?.customer_name || 'Unknown' }}</span>
              </div>
              <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                <span class="text-sm font-semibold text-gray-600 dark:text-gray-400 block">Status:</span>
                <span class="px-3 py-1 rounded-full text-sm font-bold" :class="getStatusColor(selectedReport?.installation_status)">
                  {{ selectedReport?.installation_status || 'Unknown' }}
                </span>
              </div>
              <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                <span class="text-sm font-semibold text-gray-600 dark:text-gray-400 block">Report ID:</span>
                <span class="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200">{{ selectedReport?.installation_id || 'N/A' }}</span>
              </div>
              <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                <span class="text-sm font-semibold text-gray-600 dark:text-gray-400 block">MAC Address:</span>
                <span class="font-mono text-sm bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-blue-800 dark:text-blue-200">{{ selectedReport?.mac_address || 'Not available' }}</span>
              </div>
            </div>
          </div>

          <!-- Confirmation Checkbox -->
          <div class="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-600 rounded-xl p-5 shadow-lg">
            <label class="flex items-start cursor-pointer group">
              <UCheckbox 
                v-model="deleteConfirmationChecked" 
                class="mt-1 scale-125"
                :disabled="deleting"
                color="red"
              />
              <div class="ml-4 flex-1">
                <p class="text-base text-gray-800 dark:text-gray-200 leading-relaxed">
                  I understand that this action will 
                  <span class="inline-flex items-center px-2 py-1 rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 font-bold mx-1">
                    PERMANENTLY DELETE
                  </span>
                  the installation report for 
                  <strong class="text-blue-600 dark:text-blue-400">"{{ selectedReport?.customer_name || 'Unknown Customer' }}"</strong> 
                  and all associated data.
                </p>
                <p class="text-sm text-red-600 dark:text-red-400 font-semibold mt-2 flex items-center">
                  <UIcon name="alert-triangle" class="w-4 h-4 mr-1" />
                  This action CANNOT be undone!
                </p>
              </div>
            </label>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row justify-end gap-4 pt-4">
            <UButton
              @click="closeDeleteModal"
              color="gray"
              variant="outline"
              size="xl"
              :disabled="deleting"
              class="w-full sm:w-auto border-2 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold"
            >
              <UIcon name="x" class="mr-2" />
              Cancel
            </UButton>
            <UButton
              @click="confirmDelete"
              color="red"
              variant="solid"
              size="xl"
              :loading="deleting"
              :disabled="!deleteConfirmationChecked"
              class="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border-2 border-red-500 shadow-lg font-bold"
            >
              <UIcon name="trash-2" class="mr-2" />
              {{ deleting ? 'Deleting...' : 'Delete Installation Report' }}
            </UButton>
          </div>
        </div>
      </UCard>
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

// Apply auth middleware
definePageMeta({
  middleware: 'auth'
})

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

/* Search input dark background styling */
.search-input-dark :deep(input),
.search-input-dark :deep([class*="input"]),
.search-input-dark :deep([role="textbox"]) {
  background-color: #1e293b !important;
  background: #1e293b !important;
  border-color: #334155 !important;
  color: white !important;
}

.search-input-dark :deep(input:focus),
.search-input-dark :deep([class*="input"]:focus),
.search-input-dark :deep([role="textbox"]:focus) {
  background-color: #1e293b !important;
  background: #1e293b !important;
  border-color: #475569 !important;
  outline: none !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

.search-input-dark :deep(input::placeholder) {
  color: rgba(255, 255, 255, 0.7) !important;
}

/* Search icon color - ensure white icon */
.search-icon-white,
.search-input-dark :deep([class*="leading"] svg),
.search-input-dark :deep([class*="leading"] path),
.search-input-dark :deep(svg) {
  color: #FFFFFF !important;
  stroke: #FFFFFF !important;
  fill: none !important;
}

/* Ensure the input wrapper itself has dark background */
.search-input-dark :deep([class*="ui-input"]),
.search-input-dark :deep([class*="UInput"]) {
  background-color: #1e293b !important;
  background: #1e293b !important;
}
</style>
