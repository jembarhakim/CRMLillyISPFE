<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
    <div class="container mx-auto p-6">
      <!-- Header Section -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
          <div class="flex justify-between items-center">
            <div class="text-white">
              <h1 class="text-3xl font-bold mb-2">Installation Report Detail</h1>
              <p class="text-blue-100 text-lg">Complete installation report information</p>
            </div>
            <div class="flex space-x-3">
              <UButton @click="navigateTo('/dashboard/report/customer-installation/reports')" 
                       color="white" variant="outline" size="lg"
                       class="backdrop-blur-sm bg-white/10 border-white/20 text-white hover:bg-white/20">
                <UIcon name="i-heroicons-arrow-left" class="mr-2" />
                Back to Reports
              </UButton>
              <UButton @click="printReport" color="white" variant="solid" size="lg"
                       class="bg-white/20 backdrop-blur-sm hover:bg-white/30">
                <UIcon name="i-heroicons-printer" class="mr-2" />
                Print Report
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-16">
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-blue-600" />
          </div>
          <p class="text-gray-600 text-lg">Loading installation report...</p>
        </div>
      </div>

      <!-- Not Found State -->
      <div v-else-if="!report" class="text-center py-16">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
          <UIcon name="i-heroicons-document-text" class="text-3xl text-gray-400" />
        </div>
        <h3 class="text-xl font-semibold text-gray-700 mb-2">Report Not Found</h3>
        <p class="text-gray-500">The installation report you're looking for doesn't exist or has been removed.</p>
      </div>

      <!-- Report Content -->
      <div v-else class="space-y-8">
        <!-- Status Overview Card -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div class="bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-6">
            <div class="flex items-center justify-between">
              <div class="text-white">
                <h2 class="text-2xl font-bold mb-1">{{ report.customer_name || 'Unknown Customer' }}</h2>
                <p class="text-green-100">Installation Report #{{ report.installation_id?.slice(-8) || 'N/A' }}</p>
              </div>
              <div class="text-right">
                <span :class="getStatusColor(report.installation_status)" 
                      class="px-4 py-2 rounded-full text-sm font-semibold text-white shadow-lg">
                  {{ report.installation_status || 'Unknown' }}
                </span>
                <p class="text-green-100 text-sm mt-2">{{ formatDate(report.installation_created_at) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Basic Information -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-4">
            <h3 class="text-xl font-bold text-white flex items-center">
              <UIcon name="i-heroicons-information-circle" class="mr-3 text-xl" />
              Basic Installation Information
            </h3>
          </div>
          <div class="p-8">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <!-- Customer Information -->
              <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="i-heroicons-user" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-blue-800">Customer Information</h4>
                </div>
                <div class="space-y-3">
                  <div>
                    <label class="text-sm font-medium text-blue-600">Customer Name</label>
                    <p class="text-lg font-semibold text-gray-800">{{ report.customer_name || '-' }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-blue-600">Phone Number</label>
                    <p class="text-lg text-gray-700">{{ report.customer_phone || '-' }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-blue-600">Address</label>
                    <p class="text-sm text-gray-600 leading-relaxed">{{ report.customer_address || '-' }}</p>
                  </div>
                </div>
              </div>

              <!-- Technician Information -->
              <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="i-heroicons-wrench-screwdriver" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-purple-800">Technician Information</h4>
                </div>
                <div class="space-y-3">
                  <div>
                    <label class="text-sm font-medium text-purple-600">Technician Name</label>
                    <p class="text-lg font-semibold text-gray-800">{{ report.technician_name || '-' }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-purple-600">Phone Number</label>
                    <p class="text-lg text-gray-700">{{ report.technician_phone || '-' }}</p>
                  </div>
                </div>
              </div>

              <!-- Installation Details -->
              <div class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="i-heroicons-cog-6-tooth" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-green-800">Installation Details</h4>
                </div>
                <div class="space-y-3">
                  <div>
                    <label class="text-sm font-medium text-green-600">Installation Type</label>
                    <p class="text-lg font-semibold text-gray-800">{{ report.installation_type || '-' }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-green-600">On Air Date</label>
                    <p class="text-lg text-gray-700">{{ formatDate(report.on_air_date) }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-green-600">Trial End Date</label>
                    <p class="text-lg text-gray-700">{{ formatDate(report.trial_end_date) }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-green-600">Service Ready Date</label>
                    <p class="text-lg text-gray-700">{{ formatDate(report.service_ready_date) }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-green-600">Completed At</label>
                    <p class="text-lg text-gray-700">{{ formatDateTime(report.installation_completed_at) }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-green-600">Total Assets</label>
                    <p class="text-lg font-semibold text-gray-800">{{ report.total_assets_out || 0 }} assets</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Installation Notes -->
            <div v-if="report.installation_notes" class="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <div class="flex items-center mb-3">
                <UIcon name="i-heroicons-document-text" class="text-gray-600 mr-2" />
                <label class="text-sm font-medium text-gray-600">Installation Notes</label>
              </div>
              <p class="text-gray-700 leading-relaxed">{{ report.installation_notes }}</p>
            </div>
          </div>
        </div>

        <!-- Document Information -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div class="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4">
            <h3 class="text-xl font-bold text-white flex items-center">
              <UIcon name="i-heroicons-document-text" class="mr-3 text-xl" />
              Document Information
            </h3>
          </div>
          <div class="p-8">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- Document Type -->
              <div class="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="i-heroicons-document" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-emerald-800">Document Type</h4>
                </div>
                <div class="flex items-center">
                  <span class="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full font-semibold text-lg">
                    {{ report.document_type || 'Not Specified' }}
                  </span>
                </div>
              </div>

              <!-- Document Photo -->
              <div class="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="i-heroicons-photo" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-amber-800">Document Photo</h4>
                </div>
                <div v-if="report.document_photo" class="text-center">
                  <div class="relative inline-block">
                    <img 
                      :src="getDocumentPhotoUrl(report.document_photo)" 
                      alt="Document Photo" 
                      class="w-64 h-40 object-cover rounded-xl border-2 border-amber-200 cursor-pointer hover:scale-105 transition-transform duration-200 shadow-lg"
                      @click="openDocumentPhoto(report.document_photo)"
                      @error="handleImageError"
                    />
                    <div class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 rounded-xl transition-all duration-200 flex items-center justify-center">
                      <UIcon name="i-heroicons-magnifying-glass-plus" class="text-white text-2xl opacity-0 hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <p class="text-sm text-amber-600 mt-3 font-medium">Click to view full size</p>
                </div>
                <div v-else class="text-center py-8">
                  <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UIcon name="i-heroicons-photo" class="text-amber-500 text-2xl" />
                  </div>
                  <p class="text-amber-600 font-medium">No document photo uploaded</p>
                  <p class="text-amber-500 text-sm mt-1">Document photo will appear here when uploaded</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Network Device Information -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div class="bg-gradient-to-r from-purple-500 to-indigo-500 px-8 py-4">
            <h3 class="text-xl font-bold text-white flex items-center">
              <UIcon name="i-heroicons-cpu-chip" class="mr-3 text-xl" />
              Network Device Information
            </h3>
          </div>
          <div class="p-8">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <!-- Router Information -->
              <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="i-heroicons-cpu-chip" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-purple-800">Router Information</h4>
                </div>
                <div class="space-y-3">
                  <div>
                    <label class="text-sm font-medium text-purple-600">Brand</label>
                    <p class="text-lg font-semibold text-gray-800">{{ report.router_brand || '-' }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-purple-600">Type</label>
                    <p class="text-lg text-gray-700">{{ report.router_type || '-' }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-purple-600">Model</label>
                    <p class="text-lg text-gray-700">{{ report.router_model || '-' }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-purple-600">Serial Number</label>
                    <p class="text-lg font-mono text-gray-700">{{ report.router_serial || '-' }}</p>
                  </div>
                </div>
              </div>

              <!-- Network Configuration -->
              <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="i-heroicons-wifi" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-indigo-800">Network Configuration</h4>
                </div>
                <div class="space-y-3">
                  <div>
                    <label class="text-sm font-medium text-indigo-600">Switch ID</label>
                    <p class="text-lg font-semibold text-gray-800">{{ report.switch_id || '-' }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-indigo-600">Port Number</label>
                    <p class="text-lg text-gray-700">{{ report.port_number || '-' }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-indigo-600">Remote Port</label>
                    <p class="text-lg text-gray-700">{{ report.remote_port || '-' }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-indigo-600">ETH Port</label>
                    <p class="text-lg text-gray-700">{{ report.eth_port || '-' }}</p>
                  </div>
                </div>
              </div>

              <!-- Network Addresses -->
              <div class="bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 rounded-xl border border-cyan-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="i-heroicons-globe-alt" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-cyan-800">Network Addresses</h4>
                </div>
                <div class="space-y-3">
                  <div>
                    <label class="text-sm font-medium text-cyan-600">MAC Address</label>
                    <p class="text-lg font-mono text-gray-800 bg-gray-100 px-3 py-1 rounded">{{ report.mac_address || '-' }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-cyan-600">Static IP</label>
                    <p class="text-lg font-mono text-gray-800 bg-gray-100 px-3 py-1 rounded">{{ report.ip_static || '-' }}</p>
                  </div>
                </div>
              </div>

              <!-- Device Status -->
              <div class="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="i-heroicons-signal" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-orange-800">Device Status</h4>
                </div>
                <div class="space-y-3">
                  <div>
                    <label class="text-sm font-medium text-orange-600">Device Status</label>
                    <span :class="getDeviceStatusColor(report.status_perangkat)" class="px-3 py-1 rounded-full text-sm font-medium">
                      {{ report.status_perangkat || 'Unknown' }}
                    </span>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-orange-600">Ownership</label>
                    <p class="text-lg text-gray-700">{{ report.kepemilikan_perangkat || '-' }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-orange-600">Ping Status</label>
                    <span :class="getPingStatusColor(report.last_ping_status)" class="px-3 py-1 rounded-full text-sm font-medium">
                      {{ report.last_ping_status || 'Unknown' }}
                    </span>
                  </div>
                  <div v-if="report.last_ping_timestamp">
                    <label class="text-sm font-medium text-orange-600">Last Ping</label>
                    <p class="text-sm text-gray-600">{{ formatDateTime(report.last_ping_timestamp) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Customer Service Information -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div class="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-4">
            <h3 class="text-xl font-bold text-white flex items-center">
              <UIcon name="i-heroicons-wrench-screwdriver" class="mr-3 text-xl" />
              Customer Service Information
            </h3>
          </div>
          <div class="p-8">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <!-- User Account -->
              <div class="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="i-heroicons-user-circle" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-orange-800">User Account</h4>
                </div>
                <div class="space-y-3">
                  <div>
                    <label class="text-sm font-medium text-orange-600">Login</label>
                    <p class="text-lg font-mono text-gray-800 bg-gray-100 px-3 py-1 rounded">{{ report.user_login || '-' }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-orange-600">Password</label>
                    <p class="text-lg font-mono text-gray-800 bg-gray-100 px-3 py-1 rounded">{{ report.password ? '••••••••' : '-' }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-orange-600">Status</label>
                    <span :class="getUserStatusColor(report.user_status)" class="px-3 py-1 rounded-full text-sm font-medium">
                      {{ report.user_status || 'Unknown' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Cable Information -->
              <div class="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="i-heroicons-cable" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-red-800">Cable Information</h4>
                </div>
                <div class="space-y-3">
                  <div>
                    <label class="text-sm font-medium text-red-600">Cable Type</label>
                    <p class="text-lg font-semibold text-gray-800">{{ report.cable_type || '-' }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-red-600">Length</label>
                    <p class="text-lg text-gray-700">{{ report.cable_length ? `${report.cable_length} meters` : '-' }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-red-600">End Port Type</label>
                    <p class="text-lg text-gray-700">{{ report.end_port_type || '-' }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-red-600">Status</label>
                    <span :class="getCableStatusColor(report.cable_status)" class="px-3 py-1 rounded-full text-sm font-medium">
                      {{ report.cable_status || 'Unknown' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Service Notes -->
              <div v-if="report.service_notes" class="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-xl border border-pink-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="i-heroicons-document-text" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-pink-800">Service Notes</h4>
                </div>
                <p class="text-gray-700 leading-relaxed">{{ report.service_notes }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Installation Team Information -->
        <div v-if="report.installation_team_name || report.installation_team_phone" class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div class="bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-4">
            <h3 class="text-xl font-bold text-white flex items-center">
              <UIcon name="i-heroicons-users" class="mr-3 text-xl" />
              Installation Team Information
            </h3>
          </div>
          <div class="p-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="i-heroicons-user-group" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-indigo-800">Team Name</h4>
                </div>
                <p class="text-lg font-semibold text-gray-800">{{ report.installation_team_name || '-' }}</p>
              </div>
              <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="i-heroicons-phone" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-purple-800">Team Phone</h4>
                </div>
                <p class="text-lg font-semibold text-gray-800">{{ report.installation_team_phone || '-' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Timestamps -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div class="bg-gradient-to-r from-gray-600 to-gray-700 px-8 py-4">
            <h3 class="text-xl font-bold text-white flex items-center">
              <UIcon name="i-heroicons-clock" class="mr-3 text-xl" />
              Timestamps
            </h3>
          </div>
          <div class="p-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="i-heroicons-calendar-days" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-gray-800">Created At</h4>
                </div>
                <p class="text-lg font-semibold text-gray-700">{{ formatDateTime(report.installation_created_at) }}</p>
              </div>
              <div class="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="i-heroicons-pencil-square" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-gray-800">Last Updated</h4>
                </div>
                <p class="text-lg font-semibold text-gray-700">{{ formatDateTime(report.installation_updated_at) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Document Photo Modal -->
    <UModal v-model="showDocumentModal" :ui="{ width: 'w-full max-w-5xl' }">
      <UCard class="overflow-hidden">
        <template #header>
          <div class="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 -m-6 mb-6">
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-bold text-white flex items-center">
                <UIcon name="i-heroicons-photo" class="mr-3 text-xl" />
                Document Photo - {{ report?.document_type || 'Document' }}
              </h3>
              <UButton
                color="white"
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="showDocumentModal = false"
                class="text-white hover:bg-white/20"
              />
            </div>
          </div>
        </template>
        
        <div class="flex justify-center p-4">
          <div class="relative">
            <img 
              v-if="selectedDocumentPhoto"
              :src="getDocumentPhotoUrl(selectedDocumentPhoto)" 
              alt="Document Photo" 
              class="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl border border-gray-200"
              @error="handleImageError"
            />
            <div class="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {{ report?.document_type || 'Document' }}
            </div>
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-end space-x-3 bg-gray-50 -m-6 mt-6 p-6">
            <UButton
              color="gray"
              variant="outline"
              @click="showDocumentModal = false"
              size="lg"
            >
              <UIcon name="i-heroicons-x-mark" class="mr-2" />
              Close
            </UButton>
            <UButton
              color="blue"
              @click="downloadDocumentPhoto"
              size="lg"
            >
              <UIcon name="i-heroicons-arrow-down-tray" class="mr-2" />
              Download
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { customerAdminApi } from "@/api/admin/customer";
import type { InstallationReportCompleteResponse } from "@/types/requests/installation-report";

// Apply auth middleware
definePageMeta({
  middleware: 'auth'
})

const route = useRoute();
const installationId = route.params.id as string;

const loading = ref(false);
const report = ref<InstallationReportCompleteResponse | null>(null);
const showDocumentModal = ref(false);
const selectedDocumentPhoto = ref<string | undefined>(undefined);

onMounted(async () => {
  await loadReport();
});

async function loadReport() {
  loading.value = true;
  try {
    // This would need to be implemented in the API
    // For now, we'll use a mock response
    const response = await customerAdminApi().getInstallationReportComplete();
    const reports = response.data || [];
    report.value = reports.find((r: any) => r.installation_id === installationId) || null;
  } catch (error) {
    console.error("Failed to load report:", error);
    report.value = null;
  } finally {
    loading.value = false;
  }
}

function printReport() {
  window.print();
}

function getStatusColor(status: string | undefined) {
  switch (status) {
    case 'completed':
      return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg';
    case 'pending':
      return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg';
    case 'in_progress':
      return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg';
    case 'failed':
      return 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg';
    case 'cancelled':
      return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg';
    default:
      return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg';
  }
}

function getDeviceStatusColor(status: string | undefined) {
  switch (status) {
    case 'active':
      return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md';
    case 'inactive':
      return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md';
    case 'maintenance':
      return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md';
    case 'faulty':
      return 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md';
    default:
      return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md';
  }
}

// Document photo functions
function getDocumentPhotoUrl(documentPhoto: string | undefined) {
  if (!documentPhoto) return '';
  
  // If it's already a full URL, return as is
  if (documentPhoto.startsWith('http')) {
    return documentPhoto;
  }
  
  // If it starts with uploads/, add the backend base URL
  if (documentPhoto.startsWith('uploads/')) {
    return `http://localhost:8080/${documentPhoto}`;
  }
  
  // If it's just a filename, assume it's in uploads/installations/documents/
  if (!documentPhoto.includes('/')) {
    return `http://localhost:8080/uploads/installations/documents/${documentPhoto}`;
  }
  
  // Default: prepend backend URL
  return `http://localhost:8080/${documentPhoto}`;
}

function openDocumentPhoto(documentPhoto: string | undefined) {
  if (!documentPhoto) return;
  
  selectedDocumentPhoto.value = documentPhoto;
  showDocumentModal.value = true;
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.src = '/placeholder-document.png'; // Fallback image
  img.alt = 'Document photo not available';
}

function downloadDocumentPhoto() {
  if (!selectedDocumentPhoto.value) return;
  
  const photoUrl = getDocumentPhotoUrl(selectedDocumentPhoto.value);
  const link = document.createElement('a');
  link.href = photoUrl;
  link.download = `document_${report.value?.customer_name || 'installation'}_${report.value?.document_type || 'document'}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function getPingStatusColor(status: string | undefined) {
  switch (status) {
    case 'up':
      return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md';
    case 'down':
      return 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md';
    case 'unknown':
      return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md';
    default:
      return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md';
  }
}

function getUserStatusColor(status: string | undefined) {
  switch (status) {
    case 'Active':
      return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md';
    case 'Inactive':
      return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md';
    case 'Suspended':
      return 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md';
    case 'Pending':
      return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md';
    default:
      return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md';
  }
}

function getCableStatusColor(status: string | undefined) {
  switch (status) {
    case 'available':
      return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md';
    case 'in_use':
      return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md';
    case 'damaged':
      return 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md';
    case 'retired':
      return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md';
    default:
      return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md';
  }
}

function formatDate(dateString: string | undefined) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatDateTime(dateString: string | undefined) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>
