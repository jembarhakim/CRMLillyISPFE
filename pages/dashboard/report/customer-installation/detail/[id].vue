<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
    <div class="container mx-auto p-4 sm:p-6">
      <!-- Header Section -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6 sm:mb-8">
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-8 py-4 sm:py-6">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div class="text-white">
              <h1 class="text-xl sm:text-3xl font-bold mb-2">Installation Report Detail</h1>
              <p class="text-blue-100 text-sm sm:text-lg">Complete installation report information</p>
            </div>
            <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <UButton @click="handleBackNavigation" color="white" variant="outline" size="sm"
                class="backdrop-blur-sm bg-white/10 border-white/20 text-white hover:bg-white/20 w-full sm:w-auto">
                <LucideIcon name="arrow-left" :size="16" class="mr-2" />
                {{ backNavigationLabel }}
              </UButton>
              <!-- <UButton @click="printReport" color="white" variant="solid" size="sm"
                       class="bg-white/20 backdrop-blur-sm hover:bg-white/30 w-full sm:w-auto">
                <LucideIcon name="printer" :size="16" class="mr-2" />
                Print Report
              </UButton> -->
              <UButton @click="deleteInstallationReport" color="white" variant="solid" size="sm"
                class="bg-red-500/80 backdrop-blur-sm hover:bg-red-600/80 w-full sm:w-auto" :loading="deleting">
                <LucideIcon name="trash" :size="16" class="mr-2" />
                Delete Report
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12 sm:py-16">
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full mb-4">
            <LucideIcon name="rotate-ccw" :size="24" class="animate-spin text-blue-600" />
          </div>
          <p class="text-gray-600 text-sm sm:text-lg">Loading installation report...</p>
        </div>
      </div>

      <!-- Not Found State -->
      <div v-else-if="!report" class="text-center py-12 sm:py-16">
        <div
          class="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full mb-4 sm:mb-6">
          <LucideIcon name="file-text" :size="32" class="text-gray-400" />
        </div>
        <h3 class="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Report Not Found</h3>
        <p class="text-gray-500 text-sm sm:text-base">The installation report you're looking for doesn't exist or has
          been removed.</p>
      </div>

      <!-- Report Content -->
      <div v-else class="space-y-6 sm:space-y-8">
        <!-- Status Overview Card -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div class="bg-gradient-to-r from-green-500 to-emerald-500 px-4 sm:px-8 py-4 sm:py-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div class="text-white">
                <h2 class="text-lg sm:text-2xl font-bold mb-1">{{ report.customer_name || 'Unknown Customer' }}</h2>
                <p class="text-green-100 text-sm sm:text-base">Installation Report #{{ report.installation_id?.slice(-8)
                  || 'N/A' }}</p>
              </div>
              <div class="text-center sm:text-right">
                <span :class="getStatusColor(report.installation_status)"
                  class="px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                  {{ report.installation_status || 'Unknown' }}
                </span>
                <p class="text-green-100 text-xs sm:text-sm mt-2">{{ formatDate(report.installation_created_at) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- PSB Information -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div class="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6">
            <h3 class="text-xl font-bold text-white flex items-center">
              <LucideIcon name="calendar" :size="20" class="mr-3" />
              PSB (Pasang Baru) Information
            </h3>
          </div>
          <div class="p-8">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <!-- PSB Request Date -->
              <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                    <LucideIcon name="calendar" :size="18" class="text-white" />
                  </div>
                  <h4 class="text-lg font-semibold text-purple-800">PSB Request Date</h4>
                </div>
                <div>
                  <p class="text-2xl font-bold text-gray-800">{{ formatDate(report.tgl_permintaan_psb) }}</p>
                  <p class="text-sm text-purple-600 mt-1">Date when customer requested service</p>
                </div>
              </div>

              <!-- Installation Completion Date -->
              <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
                    <LucideIcon name="check-circle" :size="18" class="text-white" />
                  </div>
                  <h4 class="text-lg font-semibold text-indigo-800">Installation Completed</h4>
                </div>
                <div>
                  <p class="text-2xl font-bold text-gray-800">{{ formatDate(report.installation_completed_at) }}</p>
                  <p class="text-sm text-indigo-600 mt-1">Date when installation was completed</p>
                </div>
              </div>

              <!-- PSB Duration -->
              <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                    <LucideIcon name="clock" :size="18" class="text-white" />
                  </div>
                  <h4 class="text-lg font-semibold text-emerald-800">PSB Duration</h4>
                </div>
                <div>
                  <p class="text-2xl font-bold text-gray-800">
                    <span v-if="report.durasi_psb !== null && report.durasi_psb !== undefined">
                      {{ report.durasi_psb }} hari
                    </span>
                    <span v-else class="text-gray-400">-</span>
                  </p>
                  <p class="text-sm text-emerald-600 mt-1">Days from request to completion</p>
                </div>
              </div>

              <!-- PSB Status -->
              <div class="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                    <LucideIcon name="flag" :size="18" class="text-white" />
                  </div>
                  <h4 class="text-lg font-semibold text-orange-800">PSB Status</h4>
                </div>
                <div>
                  <span v-if="report.status_psb"
                    :class="report.status_psb === 'Tepat Waktu' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                    class="px-3 py-1 rounded-full text-sm font-semibold">
                    {{ report.status_psb }}
                  </span>
                  <span v-else class="text-gray-400 text-sm">-</span>
                  <p class="text-sm text-orange-600 mt-1">SLA: ≤3 days = Tepat Waktu</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Basic Information -->
          <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <h3 class="text-xl font-bold text-white flex items-center">
                <LucideIcon name="info" :size="20" class="mr-3" />
                Basic Installation Information
              </h3>
            </div>
            <div class="p-8">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Customer Information -->
                <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                  <div class="flex items-center mb-4">
                    <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <LucideIcon name="user" :size="18" class="text-white" />
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

                <!-- Installation Team Information -->
                <div class="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200">
                  <div class="flex items-center mb-4">
                    <div class="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center mr-3">
                      <LucideIcon name="user-group" :size="18" class="text-white" />
                    </div>
                    <h4 class="text-lg font-semibold text-amber-800">Installation Team</h4>
                  </div>

                  <!-- Team Members -->
                  <div v-if="technicianTeam.length > 0" class="space-y-3">
                    <div v-for="(technician, index) in technicianTeam" :key="technician.id"
                      class="bg-white rounded-lg p-3 border border-amber-200 shadow-sm">
                      <div class="flex items-start space-x-3">
                        <div class="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span class="text-amber-600 font-semibold text-xs">{{ index + 1 }}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center space-x-2 mb-1">
                            <h5 class="font-semibold text-gray-800 text-sm">{{ technician.technician_name }}</h5>
                            <span v-if="technician.is_primary"
                              class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <LucideIcon name="star" :size="12" class="mr-0.5" />
                              Primary
                            </span>
                          </div>
                          <div class="flex items-center space-x-2 mb-1">
                            <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium"
                              :class="getRoleColor(technician.role)">
                              {{ getRoleDisplayName(technician.role) }}
                            </span>
                          </div>
                          <div class="text-xs text-gray-600 space-y-1">
                            <div class="flex items-center">
                              <LucideIcon name="phone" :size="12" class="mr-1" />
                              {{ technician.technician_phone || '-' }}
                            </div>
                            <div class="flex items-center">
                              <LucideIcon name="mail" :size="12" class="mr-1" />
                              {{ technician.technician_email || '-' }}
                            </div>
                          </div>
                          <div v-if="technician.notes" class="mt-2">
                            <p class="text-xs text-gray-600 italic">"{{ technician.notes }}"</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Fallback for single technician (backward compatibility) -->
                  <div v-else-if="report.technician_name" class="space-y-3">
                    <div>
                      <label class="text-sm font-medium text-amber-600">Technician Name</label>
                      <p class="text-lg font-semibold text-gray-800">{{ report.technician_name }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-amber-600">Phone Number</label>
                      <p class="text-lg text-gray-700">{{ report.technician_phone || '-' }}</p>
                    </div>
                  </div>

                  <!-- No technicians found -->
                  <div v-else class="text-center py-4">
                    <LucideIcon name="user-group" :size="48" class="text-amber-300 mx-auto mb-2" />
                    <p class="text-gray-600 text-sm">No technician information available</p>
                  </div>
                </div>

                <!-- Installation Details -->
                <div class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                  <div class="flex items-center mb-4">
                    <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <LucideIcon name="settings-6-tooth" :size="18" class="text-white" />
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
                  </div>
                </div>

                <!-- Installation Location -->
                <div v-if="report.latitude && report.longitude"
                  class="bg-gradient-to-br from-rose-50 to-pink-100 p-6 rounded-xl border border-rose-200">
                  <div class="flex items-center mb-4">
                    <div class="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center mr-3">
                      <LucideIcon name="map-pin" :size="18" class="text-white" />
                    </div>
                    <h4 class="text-lg font-semibold text-rose-800">Installation Location</h4>
                  </div>
                  <div class="space-y-3">
                    <div>
                      <label class="text-sm font-medium text-rose-600">Coordinates</label>
                      <p class="text-lg font-mono text-gray-800 bg-gray-100 px-3 py-1 rounded">
                        {{ report.latitude }}, {{ report.longitude }}
                      </p>
                    </div>
                    <div>
                      <UButton @click="openGoogleMaps(report.latitude, report.longitude)" color="rose" variant="solid"
                        size="sm"
                        class="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold shadow-lg">
                        <template #leading>
                          <LucideIcon name="external-link" :size="16" />
                        </template>
                        Open in Google Maps
                      </UButton>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Installation Notes -->
              <div v-if="report.installation_notes" class="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <div class="flex items-center mb-3">
                  <LucideIcon name="file-text" :size="16" class="text-gray-600 mr-2" />
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
                <LucideIcon name="file-text" :size="20" class="mr-3" />
                Document Information
              </h3>
            </div>
            <div class="p-8">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Document Type -->
                <div class="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200">
                  <div class="flex items-center mb-4">
                    <div class="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                      <LucideIcon name="file" :size="18" class="text-white" />
                    </div>
                    <h4 class="text-lg font-semibold text-emerald-800">Document Type</h4>
                  </div>
                  <div class="flex items-center">
                    <span class="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full font-semibold text-lg">
                      {{ report.document_type || 'Not Specified' }}
                    </span>
                  </div>
                  <div v-if="report.document_photo" class="text-center">
                    <div class="relative inline-block">
                      <img :src="getDocumentPhotoUrl(report.document_photo)" alt="Document Photo"
                        class="w-64 h-40 object-cover rounded-xl border-2 border-amber-200 cursor-pointer hover:scale-105 transition-transform duration-200 shadow-lg"
                        @click="openDocumentPhotoModal" @error="handleDocumentImageError"
                        @load="handleDocumentImageLoad" />
                      <div
                        class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 rounded-xl transition-all duration-200 flex items-center justify-center pointer-events-none">
                        <LucideIcon name="search-plus" :size="24"
                          class="text-white opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <p class="text-sm text-amber-600 mt-3 font-medium">Click to view full size</p>
                  </div>
                  <div v-else class="text-center py-8">
                    <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <LucideIcon name="photo" :size="32" class="text-amber-500" />
                    </div>
                    <p class="text-amber-600 font-medium">No document photo uploaded</p>
                    <p class="text-amber-500 text-sm mt-1">Document photo will appear here when uploaded</p>
                  </div>
                </div>

                <!-- Technician Photos -->
                <div class="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                  <div class="flex items-center mb-4">
                    <div class="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center mr-3">
                      <LucideIcon name="photo" :size="18" class="text-white" />
                    </div>
                    <h4 class="text-lg font-semibold text-amber-800">Technician Photos</h4>
                  </div>
                  <!-- Technician Photos Grid -->
                  <div v-if="technicianPhotos.length > 0" class="mt-4">
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div v-for="(photo, index) in technicianPhotos" :key="photo.id || index"
                        class="relative group cursor-pointer bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                        @click="openTechnicianPhotoModal(photo.full_path || '', index)">
                        <img :src="getTechnicianPhotoUrl(photo.full_path || '')" :alt="`Technician Photo ${index + 1}`"
                          class="w-full h-24 object-cover" @error="handleTechnicianPhotoError" />
                        <div
                          class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                          <LucideIcon name="eye" :size="18"
                            class="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
                        <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1.5">
                          <div class="flex justify-between items-center">
                            <span>Photo {{ index + 1 }}</span>
                            <LucideIcon name="arrow-top-right-on-square" :size="12" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <p class="text-xs text-amber-600 mt-3 text-center">
                      {{ technicianPhotos.length }} photo(s) from installation progress
                    </p>
                  </div>

                  <!-- No Photos State -->
                  <div v-else class="text-center py-6">
                    <div class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <LucideIcon name="camera" :size="20" class="text-amber-500" />
                    </div>
                    <p class="text-amber-600 font-medium text-sm">No technician photos</p>
                    <p class="text-amber-500 text-xs mt-1">Photos will appear here when uploaded</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Product Information -->
          <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div class="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4">
              <h3 class="text-xl font-bold text-white flex items-center">
                <LucideIcon name="shopping-bag" :size="20" class="mr-3" />
                Product Package Information
              </h3>
            </div>
            <div class="p-8">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Product Details -->
                <div class="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200">
                  <div class="flex items-center mb-4">
                    <div class="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                      <LucideIcon name="shopping-bag" :size="18" class="text-white" />
                    </div>
                    <h4 class="text-lg font-semibold text-emerald-800">Package Details</h4>
                  </div>
                  <div class="space-y-3">
                    <div>
                      <label class="text-sm font-medium text-emerald-600">Package Name</label>
                      <p class="text-lg font-semibold text-gray-800">{{ report.product_name || '-' }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-emerald-600">Description</label>
                      <p class="text-sm text-gray-700">{{ report.product_description || '-' }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-emerald-600">Price</label>
                      <p class="text-lg font-semibold text-gray-800">
                        {{ report.product_price ? `Rp ${report.product_price.toLocaleString('id-ID')}` : '-' }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Speed Information -->
                <div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                  <div class="flex items-center mb-4">
                    <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <LucideIcon name="bolt" :size="18" class="text-white" />
                    </div>
                    <h4 class="text-lg font-semibold text-blue-800">Speed Configuration</h4>
                  </div>
                  <div class="space-y-3">
                    <div>
                      <label class="text-sm font-medium text-blue-600">Download Speed</label>
                      <p class="text-lg font-semibold text-gray-800">
                        {{ report.download_speed_mbps ? `${report.download_speed_mbps} Mbps` : '-' }}
                      </p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-blue-600">Upload Speed</label>
                      <p class="text-lg font-semibold text-gray-800">
                        {{ report.upload_speed_mbps ? `${report.upload_speed_mbps} Mbps` : '-' }}
                      </p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-blue-600">Total Speed</label>
                      <p class="text-lg font-semibold text-gray-800">
                        {{ report.download_speed_mbps && report.upload_speed_mbps ?
                          `${report.download_speed_mbps}/${report.upload_speed_mbps} Mbps` : '-' }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Package Summary -->
                <div class="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                  <div class="flex items-center mb-4">
                    <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                      <LucideIcon name="file-text" :size="18" class="text-white" />
                    </div>
                    <h4 class="text-lg font-semibold text-purple-800">Package Summary</h4>
                  </div>
                  <div class="space-y-3">
                    <div class="bg-white p-4 rounded-lg border border-purple-200">
                      <p class="text-sm text-purple-600 font-medium">Selected Package:</p>
                      <p class="text-lg font-bold text-gray-800">{{ report.product_name || 'No package selected' }}</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg border border-purple-200">
                      <p class="text-sm text-purple-600 font-medium">Bandwidth:</p>
                      <p class="text-lg font-bold text-gray-800">
                        {{ report.download_speed_mbps && report.upload_speed_mbps ?
                          `${report.download_speed_mbps}/${report.upload_speed_mbps} Mbps` : 'Not specified' }}
                      </p>
                    </div>
                    <div class="bg-white p-4 rounded-lg border border-purple-200">
                      <p class="text-sm text-purple-600 font-medium">Monthly Cost:</p>
                      <p class="text-lg font-bold text-gray-800">
                        {{ report.product_price ? `Rp ${report.product_price.toLocaleString('id-ID')}` : 'Not specified'
                        }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Network Device Information -->
          <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div class="bg-gradient-to-r from-purple-500 to-indigo-500 px-8 py-4">
              <h3 class="text-xl font-bold text-white flex items-center">
                <LucideIcon name="cpu-chip" :size="20" class="mr-3" />
                Network Device Information
              </h3>
            </div>
            <div class="p-8">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Router Information -->
                <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                  <div class="flex items-center mb-4">
                    <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                      <LucideIcon name="cpu-chip" :size="18" class="text-white" />
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
                      <LucideIcon name="wifi" :size="18" class="text-white" />
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
                      <LucideIcon name="globe-alt" :size="18" class="text-white" />
                    </div>
                    <h4 class="text-lg font-semibold text-cyan-800">Network Addresses</h4>
                  </div>
                  <div class="space-y-3">
                    <div>
                      <label class="text-sm font-medium text-cyan-600">MAC Address</label>
                      <p class="text-lg font-mono text-gray-800 bg-gray-100 px-3 py-1 rounded">{{ report.mac_address ||
                        '-' }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-cyan-600">Static IP</label>
                      <p class="text-lg font-mono text-gray-800 bg-gray-100 px-3 py-1 rounded">{{ report.ip_static ||
                        '-' }}</p>
                    </div>
                  </div>
                </div>

                <!-- Device Status -->
                <div class="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                  <div class="flex items-center mb-4">
                    <div class="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                      <LucideIcon name="signal" :size="18" class="text-white" />
                    </div>
                    <h4 class="text-lg font-semibold text-orange-800">Device Status</h4>
                  </div>
                  <div class="space-y-3">
                    <div>
                      <label class="text-sm font-medium text-orange-600">Real-time Connection Status</label>
                      <div class="flex items-center space-x-2">
                        <div :class="[
                          'w-3 h-3 rounded-full',
                          getDeviceConnectionStatus(report) === 'up' ? 'bg-green-500' : 'bg-gray-500'
                        ]"></div>
                        <span :class="getDeviceConnectionStatusColor(getDeviceConnectionStatus(report))"
                          class="px-3 py-1 rounded-full text-sm font-medium">
                          {{ getDeviceConnectionStatus(report).toUpperCase() }}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-orange-600">Ownership</label>
                      <p class="text-lg text-gray-700">{{ report.kepemilikan_perangkat || '-' }}</p>
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
                <LucideIcon name="wrench" :size="20" class="mr-3" />
                Customer Service Information
              </h3>
            </div>
            <div class="p-8">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- User Account -->
                <div class="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                  <div class="flex items-center mb-4">
                    <div class="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                      <LucideIcon name="user-circle" :size="18" class="text-white" />
                    </div>
                    <h4 class="text-lg font-semibold text-orange-800">User Account</h4>
                  </div>
                  <div class="space-y-3">
                    <div>
                      <label class="text-sm font-medium text-orange-600">Login</label>
                      <p class="text-lg font-mono text-gray-800 bg-gray-100 px-3 py-1 rounded">{{ report.user_login ||
                        '-' }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-orange-600">Password</label>
                      <p class="text-lg font-mono text-gray-800 bg-gray-100 px-3 py-1 rounded">{{ report.password || '-'
                      }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-orange-600">Status</label>
                      <span :class="getUserStatusColor(report.user_status)"
                        class="px-3 py-1 rounded-full text-sm font-medium">
                        {{ report.user_status || 'Unknown' }}
                      </span>
                    </div>

                    <!-- Remote Router Access Button -->
                    <div class="pt-3 border-t border-orange-200">
                      <UButton @click="openRemoteRouter" color="orange" variant="solid" size="sm"
                        class="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg"
                        :disabled="!report.ip_static">
                        <template #leading>
                          <LucideIcon name="computer-desktop" :size="16" />
                        </template>
                        Remote Router Access
                      </UButton>
                      <p class="text-xs text-orange-600 mt-1 text-center">
                        {{ report.ip_static ? `${report.ip_static}:8080` : 'IP address not available' }}
                      </p>
                    </div>
                  </div>
                </div>

              <!-- Cable Information -->
              <div class="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mr-3">
                    <LucideIcon name="cable" :size="18" class="text-white" />
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
                <div v-if="report.service_notes"
                  class="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-xl border border-pink-200">
                  <div class="flex items-center mb-4">
                    <div class="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center mr-3">
                      <LucideIcon name="file-text" :size="18" class="text-white" />
                    </div>
                    <h4 class="text-lg font-semibold text-pink-800">Service Notes</h4>
                  </div>
                  <p class="text-gray-700 leading-relaxed">{{ report.service_notes }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Terminal Information -->
          <div v-if="report.is_terminal === 'yes' || report.terminal_customer_installation_id"
            class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div class="bg-gradient-to-r from-cyan-500 to-teal-500 px-8 py-4">
              <h3 class="text-xl font-bold text-white flex items-center">
                <LucideIcon name="link" :size="20" class="mr-3" />
                Terminal Information
              </h3>
            </div>
            <div class="p-8">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Is Terminal Status -->
                <div
                  class="bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 rounded-xl border border-cyan-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div class="flex items-center mb-4">
                    <div class="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                      <LucideIcon name="server" :size="20" class="text-white" />
                    </div>
                    <div>
                      <h4 class="text-lg font-semibold text-cyan-800">Terminal Status</h4>
                      <p class="text-xs text-cyan-600">Installation type indication</p>
                    </div>
                  </div>

                  <!-- Main Status Indicator -->
                  <div class="flex items-center justify-center mb-4">
                    <div v-if="report.is_terminal === 'yes'" class="flex flex-col items-center space-y-2">
                      <div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <LucideIcon name="server" :size="24" class="text-white" />
                      </div>
                      <span
                        class="px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold text-sm border-2 border-green-200 flex items-center">
                        <LucideIcon name="check-circle" :size="16" class="mr-2" />
                        Terminal Installation
                      </span>
                    </div>
                    <div v-else class="flex flex-col items-center space-y-2">
                      <div class="w-16 h-16 bg-gray-500 rounded-full flex items-center justify-center shadow-lg">
                        <LucideIcon name="home" :size="24" class="text-white" />
                      </div>
                      <span
                        class="px-4 py-2 bg-gray-100 text-gray-800 rounded-full font-semibold text-sm border-2 border-gray-200 flex items-center">
                        <LucideIcon name="home" :size="16" class="mr-2" />
                        Regular Installation
                      </span>
                    </div>
                  </div>

                  <!-- Enhanced Field Display -->
                  <div class="bg-white/60 rounded-lg p-4 border border-cyan-300 shadow-inner">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-sm font-medium text-cyan-700 flex items-center">
                        <LucideIcon name="database" :size="14" class="mr-2" />
                        Database Value
                      </span>
                      <span
                        class="text-xs bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full font-mono border border-cyan-200">
                        is_terminal
                      </span>
                    </div>
                    <div class="bg-white rounded-md p-3 border-2 border-dashed border-cyan-300">
                      <p class="text-center font-mono font-semibold text-lg"
                        :class="report.is_terminal === 'yes' ? 'text-green-600' : 'text-gray-600'">
                        {{ report.is_terminal === 'yes' ? 'YES' : 'NO' }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Terminal Linked Installation -->
                <div v-if="report.terminal_customer_installation_id"
                  class="bg-gradient-to-br from-teal-50 to-cyan-100 p-6 rounded-xl border border-teal-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div class="flex items-center mb-4">
                    <div class="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                      <LucideIcon name="link-2" :size="20" class="text-white" />
                    </div>
                    <div>
                      <h4 class="text-lg font-semibold text-teal-800">Linked Terminal Installation</h4>
                      <p class="text-xs text-teal-600">Parent terminal installation reference</p>
                    </div>
                  </div>

                  <div class="bg-white rounded-lg p-4 border-l-4 border-teal-500 shadow-sm">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm font-medium text-teal-700 mb-1">Linked Customer:</p>
                        <p class="font-bold text-gray-800 text-lg mb-1">{{ terminalCustomerName || 'Loading...' }}</p>
                        <p class="text-xs text-gray-500 font-mono flex items-center" title="Installation ID">
                          <LucideIcon name="hash" :size="12" class="mr-1" />
                          {{ report.terminal_customer_installation_id }}
                        </p>
                      </div>
                      <UButton @click="navigateToTerminal(report.terminal_customer_installation_id)" color="white"
                        variant="soft" size="sm" class="ml-2">
                        <LucideIcon name="arrow-up-right" :size="16" class="mr-1" />
                        Open
                      </UButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Delete Confirmation Modal -->
    <DeleteInstallationReportModal v-model:isOpen="showDeleteModal" :installation-id="report?.installation_id || ''"
      :customer-name="report?.customer_name || 'Unknown Customer'" :report-status="report?.installation_status"
      :mac-address="report?.mac_address" @deleted="handleReportDeleted" />
  </div>
</template>

<script setup lang="ts">
console.log('🔴 [CRITICAL] Script setup is executing!');

import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

interface Report {
  installation_id?: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  installation_status?: string;
  installation_created_at?: string;
  installation_completed_at?: string;
  installation_updated_at?: string;
  tgl_permintaan_psb?: string;
  durasi_psb?: number | null;
  status_psb?: string;
  technician_id?: string;
  technician_name?: string;
  technician_phone?: string;
  installation_type?: string;
  on_air_date?: string;
  trial_end_date?: string;
  service_ready_date?: string;
  latitude?: number;
  longitude?: number;
  installation_notes?: string;
  network_device_id?: string;
  router_brand?: string;
  router_type?: string;
  router_model?: string;
  router_serial?: string;
  switch_id?: string;
  port_number?: string;
  remote_port?: string;
  eth_port?: string;
  gateway_ip?: string;
  dns_primary?: string;
  dns_secondary?: string;
  cable_type?: string;
  cable_length?: string;
  end_port_type?: string;
  service_notes?: string;
  is_terminal?: string;
  terminal_customer_installation_id?: string;
  product_id?: string;
  product_name?: string;
  download_speed_mbps?: number;
  upload_speed_mbps?: number;
  product_price?: number;
  product_description?: string;
  document_type?: string;
  document_photo?: string;
  mac_address?: string;
  ip_static?: string;
  kepemilikan_perangkat?: string;
  customer_service_id?: string;
  user_login?: string;
  password?: string;
  user_status?: string;
}

interface Technician {
  id: string;
  technician_name?: string;
  technician_phone?: string;
  technician_email?: string;
  role?: string;
  is_primary?: boolean;
  notes?: string;
}

interface Photo {
  id: string;
  photo_url?: string;
  full_path?: string;
}

const route = useRoute();
const router = useRouter();

const report = ref<Report | null>(null);
const loading = ref(true);
const deleting = ref(false);
const technicianTeam = ref<Technician[]>([]);
const technicianPhotos = ref<Photo[]>([]);
const terminalCustomerName = ref<string>('');
const navigationContext = ref<any>(null);

// Computed properties
const backNavigationLabel = computed(() => {
  return navigationContext.value?.returnLabel || 'Back';
});

onMounted(async () => {
  await fetchReport();
});

async function fetchReport() {
  try {
    loading.value = true;
    const installationId = route.params.id as string;

    if (!installationId) {
      console.error('Installation ID not found');
      return;
    }

    // Get token from auth store
    const authStore = useAuthStore();
    const token = authStore.getToken;

    if (!token) {
      console.error('No authentication token found');
      navigateTo('/login');
      return;
    }

    console.log('Fetching report with token:', token.substring(0, 10) + '...');

    // Fetch installation report from API
    const response: any = await $fetch(`/api/customer-installations/${installationId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).catch((err) => {
      console.error('Fetch report error:', err);
      return null;
    });

    // Extract data from the response wrapper
    report.value = response?.data || response || {};

    // Fetch technician team if needed
    if (report.value?.installation_id) {
      await fetchTechnicianTeam(report.value.installation_id);
    }

    // Fetch photos
    if (report.value?.installation_id) {
      await fetchTechnicianPhotos(report.value.installation_id);
    }

    // Fetch terminal customer name if linked
    if (report.value?.terminal_customer_installation_id) {
      fetchTerminalCustomerName(report.value.terminal_customer_installation_id);
    }
  } catch (error) {
    console.error('Error loading installation report:', error);
  } finally {
    loading.value = false;
  }
}

async function fetchTerminalCustomerName(terminalId: string) {
  try {
    const authStore = useAuthStore();
    const token = authStore.getToken;

    if (!token) return;

    const response: any = await $fetch(`/api/customer-installations/${terminalId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).catch(() => null);

    const data = response?.data || response || {};
    if (data.customer_name) {
      terminalCustomerName.value = data.customer_name;
    }
  } catch (error) {
    console.error('Error loading terminal customer name:', error);
  }
}

async function fetchTechnicianTeam(installationId: string) {
  try {
    const authStore = useAuthStore();
    const token = authStore.getToken;

    if (!token) {
      technicianTeam.value = [];
      return;
    }

    const response = await $fetch(`/api/customer-installations/${installationId}/technicians`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).catch(() => null);
    technicianTeam.value = Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error loading technician team:', error);
    technicianTeam.value = [];
  }
}

async function fetchTechnicianPhotos(installationId: string) {
  try {
    const authStore = useAuthStore();
    const token = authStore.getToken;

    if (!token) {
      technicianPhotos.value = [];
      return;
    }

    const response = await $fetch(`/api/customer-installations/${installationId}/photos`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).catch(() => null);
    technicianPhotos.value = Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error loading technician photos:', error);
    technicianPhotos.value = [];
  }
}

function handleBackNavigation() {
  if (navigationContext.value?.returnUrl) {
    router.push(navigationContext.value.returnUrl);
  } else {
    router.push('/dashboard/report/customer-installation');
  }
}

const showDeleteModal = ref(false);

async function deleteInstallationReport() {
  showDeleteModal.value = true;
}

function handleReportDeleted() {
  router.push('/dashboard/report/customer-installation');
}

function formatDate(dateString: string | undefined) {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

function formatDateTime(dateString: string | undefined) {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

function getStatusColor(status: string | undefined) {
  if (!status) return 'bg-gray-100 text-gray-800';

  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'completed':
    case 'done':
    case 'finished':
      return 'bg-green-100 text-green-800';
    case 'pending':
    case 'waiting':
      return 'bg-yellow-100 text-yellow-800';
    case 'in_progress':
    case 'in progress':
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
    case 'canceled':
      return 'bg-red-100 text-red-800';
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getRoleColor(role: string | undefined) {
  if (!role) return 'bg-gray-100 text-gray-800';

  const roleLower = role.toLowerCase();
  switch (roleLower) {
    case 'leader':
    case 'ketua':
      return 'bg-purple-100 text-purple-800';
    case 'technician':
    case 'teknisi':
      return 'bg-blue-100 text-blue-800';
    case 'helper':
    case 'pembantu':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getRoleDisplayName(role: string | undefined) {
  if (!role) return 'Unknown';

  const roleLower = role.toLowerCase();
  switch (roleLower) {
    case 'leader':
    case 'ketua':
      return 'Team Leader';
    case 'technician':
    case 'teknisi':
      return 'Technician';
    case 'helper':
    case 'pembantu':
      return 'Helper';
    default:
      return role;
  }
}

function getUserStatusColor(status: string | undefined) {
  if (!status) return 'bg-gray-100 text-gray-800';

  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'active':
    case 'aktif':
      return 'bg-green-100 text-green-800';
    case 'inactive':
    case 'tidak aktif':
      return 'bg-red-100 text-red-800';
    case 'suspended':
    case 'ditangguhkan':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Real-time device status cache
const deviceStatusCache = ref<Map<string, { status: DeviceConnectionStatus; timestamp: number }>>(new Map())


const getDeviceConnectionStatus = (device: any): DeviceConnectionStatus => {
  if (!device) return 'off'

  // Check if device has IP address for Mikrotik lookup
  if (!device.ip_static) {
    return 'off'
  }

  // Check cache first (cache for 30 seconds)
  const cacheKey = device.ip_static
  const cached = deviceStatusCache.value.get(cacheKey)
  const now = Date.now()
  
  if (cached && (now - cached.timestamp) < 30000) {
    return cached.status
  }

  // For now, use the same mock logic as fetchRealTimeDeviceStatus
  // TODO: Implement actual Mikrotik API call here
  const status: 'up' | 'down' = device.ip_static.includes('10.10.20') ? 'up' : 'down'
  
  // Cache the result
  deviceStatusCache.value.set(cacheKey, { status, timestamp: now })
  
  return status
}

function getDeviceConnectionStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'up':
      return 'bg-green-100 text-green-800';
    case 'down':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function openGoogleMaps(latitude: number | undefined, longitude: number | undefined) {
  if (!latitude || !longitude) return;
  const url = `https://www.google.com/maps/@${latitude},${longitude},15z`;
  window.open(url, '_blank');
}

function navigateToTerminal(terminalInstallationId: string | undefined) {
  if (!terminalInstallationId) return;
  router.push(`/dashboard/report/customer-installation/detail/${terminalInstallationId}`);
}

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgZmlsbD0iI2YzZjRmNiI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIC8+PHRleHQgeD0iNTAiIHk9IjUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';

function handleTechnicianPhotoError(e: Event) {
  const img = e.target as HTMLImageElement;
  if (img) {
    // Prevent infinite loop if placeholder also fails
    if (img.src !== PLACEHOLDER_IMAGE) {
      img.src = PLACEHOLDER_IMAGE;
    }
  }
}

function getDocumentPhotoUrl(photoPath: string | undefined) {
  if (!photoPath) return PLACEHOLDER_IMAGE;
  if (photoPath.startsWith('http')) return photoPath;

  // Replace backslashes with forward slashes for URL compatibility
  let normalizedPath = photoPath.replace(/\\/g, '/');

  // If path doesn't start with uploads/, assume it's just the filename and prepend the directory
  // Remove leading slash for check if present
  const checkPath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;

  if (!checkPath.startsWith('uploads/')) {
    normalizedPath = `uploads/installations/documents/${checkPath}`;
  }

  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;

  // Use the proxy endpoint to avoid CORS/ORB blocking
  return `/api/proxy-image?path=${encodeURIComponent(cleanPath)}`;
}

function getTechnicianPhotoUrl(photoPath: string | undefined) {
  if (!photoPath) return PLACEHOLDER_IMAGE;
  if (photoPath.startsWith('http')) return photoPath;

  // Replace backslashes with forward slashes for URL compatibility
  const normalizedPath = photoPath.replace(/\\/g, '/');
  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;

  // Use the proxy endpoint to avoid CORS/ORB blocking
  return `/api/proxy-image?path=${encodeURIComponent(cleanPath)}`;
}

function openDocumentPhotoModal() {
  // Implement modal logic
  console.log('Open document photo modal');
}

function openTechnicianPhotoModal(photoPath: string, index: number) {
  // Implement modal logic
  console.log('Open technician photo modal', photoPath, index);
}

function handleDocumentImageError(e: Event) {
  const img = e.target as HTMLImageElement;
  if (img) {
    // Prevent infinite loop if placeholder also fails
    if (img.src !== PLACEHOLDER_IMAGE) {
      img.src = PLACEHOLDER_IMAGE;
    }
  }
}

function handleDocumentImageLoad(e: Event) {
  // Implement image load logic if needed
  console.log('Document image loaded');
}
type DeviceConnectionStatus = 'off' | 'up' | 'down' | 'unknown'
function openRemoteRouter() {
  if (!report.value?.ip_static) return;
  const url = `http://${report.value.ip_static}:8080`;
  window.open(url, '_blank');
}
</script>
