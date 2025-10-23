 on<template>
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
              <UButton @click="handleBackNavigation" 
                       color="white" variant="outline" size="sm" 
                       class="backdrop-blur-sm bg-white/10 border-white/20 text-white hover:bg-white/20 w-full sm:w-auto">
                <LucideIcon name="arrow-left" :size="16" class="mr-2" />
                {{ backNavigationLabel }}
              </UButton>
              <UButton @click="printReport" color="white" variant="solid" size="sm"
                       class="bg-white/20 backdrop-blur-sm hover:bg-white/30 w-full sm:w-auto">
                <LucideIcon name="printer" :size="16" class="mr-2" />
                Print Report
              </UButton>
              <UButton @click="deleteInstallationReport" color="white" variant="solid" size="sm"
                       class="bg-red-500/80 backdrop-blur-sm hover:bg-red-600/80 w-full sm:w-auto"
                       :loading="deleting">
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
        <div class="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full mb-4 sm:mb-6">
          <LucideIcon name="file-text" :size="32" class="text-gray-400" />
        </div>
        <h3 class="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Report Not Found</h3>
        <p class="text-gray-500 text-sm sm:text-base">The installation report you're looking for doesn't exist or has been removed.</p>
      </div>

      <!-- Report Content -->
      <div v-else class="space-y-6 sm:space-y-8">
        <!-- Status Overview Card -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div class="bg-gradient-to-r from-green-500 to-emerald-500 px-4 sm:px-8 py-4 sm:py-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div class="text-white">
                <h2 class="text-lg sm:text-2xl font-bold mb-1">{{ report.customer_name || 'Unknown Customer' }}</h2>
                <p class="text-green-100 text-sm sm:text-base">Installation Report #{{ report.installation_id?.slice(-8) || 'N/A' }}</p>
              </div>
              <div class="text-center sm:text-right">
                <span :class="getStatusColor(report.installation_status)" 
                      class="px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-white shadow-lg">
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
                    <UIcon name="flag" class="text-white text-lg" />
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
        </div>

        <!-- Basic Information -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <h3 class="text-xl font-bold text-white flex items-center">
              <UIcon name="info" class="mr-3 text-xl" />
              Basic Installation Information
            </h3>
          </div>
          <div class="p-8">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <!-- Customer Information -->
              <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="user" class="text-white text-lg" />
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
                    <UIcon name="user-group" class="text-white text-lg" />
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
                            <UIcon name="star" class="w-2 h-2 mr-0.5" />
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
                            <UIcon name="phone" class="w-3 h-3 mr-1" />
                            {{ technician.technician_phone || '-' }}
                          </div>
                          <div class="flex items-center">
                            <UIcon name="mail" class="w-3 h-3 mr-1" />
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
                  <UIcon name="user-group" class="w-12 h-12 text-amber-300 mx-auto mb-2" />
                  <p class="text-gray-600 text-sm">No technician information available</p>
                </div>
              </div>

              <!-- Installation Details -->
              <div class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="settings-6-tooth" class="text-white text-lg" />
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
            </div>
            
            <!-- Installation Notes -->
            <div v-if="report.installation_notes" class="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <div class="flex items-center mb-3">
                <UIcon name="file-text" class="text-gray-600 mr-2" />
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
              <UIcon name="file-text" class="mr-3 text-xl" />
              Document Information
            </h3>
          </div>
          <div class="p-8">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- Document Type -->
              <div class="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="file" class="text-white text-lg" />
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
                    <UIcon name="photo" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-amber-800">Document Photo</h4>
                </div>
                <div v-if="report.document_photo" class="text-center">
                  <div class="relative inline-block">
                    <img
                      :src="getDocumentPhotoUrl(report?.document_photo)"
                      alt="Document Photo"
                      class="w-64 h-40 object-cover rounded-xl border-2 border-amber-200 cursor-pointer hover:scale-105 transition-transform duration-200 shadow-lg"
                      @click="openDocumentPhotoModal"
                      @error="handleImageError"
                    />
                    <div class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 rounded-xl transition-all duration-200 flex items-center justify-center pointer-events-none">
                      <UIcon name="search-plus" class="text-white text-2xl opacity-0 hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <p class="text-sm text-amber-600 mt-3 font-medium">Click to view full size</p>
                </div>
                <div v-else class="text-center py-8">
                  <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UIcon name="photo" class="text-amber-500 text-2xl" />
                  </div>
                  <p class="text-amber-600 font-medium">No document photo uploaded</p>
                  <p class="text-amber-500 text-sm mt-1">Document photo will appear here when uploaded</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Technician Photo Documentation -->
        <div v-if="technicianPhotos.length > 0 || report.technician_photos_notes" class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div class="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4">
            <h3 class="text-xl font-bold text-white flex items-center">
              <UIcon name="camera" class="mr-3 text-xl" />
              Technician Photo Documentation
            </h3>
          </div>
          <div class="p-8">
            <!-- Technician Photos Notes -->
            <div v-if="report.technician_photos_notes" class="mb-6">
              <div class="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="file-text" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-amber-800">Progress Notes</h4>
                </div>
                <p class="text-gray-700 leading-relaxed">{{ report.technician_photos_notes }}</p>
              </div>
            </div>

            <!-- Technician Photos Grid -->
            <div v-if="technicianPhotos.length > 0" class="mb-6">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-lg font-semibold text-gray-800 flex items-center">
                  <UIcon name="photo" class="mr-2 text-amber-600" />
                  Progress Photos ({{ technicianPhotos.length }})
                </h4>
                <div class="text-sm text-gray-500">
                  Uploaded: {{ formatDate(technicianPhotos[0]?.created_at) }}
                </div>
              </div>
              
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div
                  v-for="(photo, index) in technicianPhotos"
                  :key="index"
                  class="relative group cursor-pointer bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                  @click="openTechnicianPhotoModal(photo.file || photo.full_path, index)"
                >
                  <img
                    :src="getTechnicianPhotoUrl(photo.file || photo.full_path)"
                    :alt="`Technician Photo ${index + 1}`"
                    class="w-full h-32 object-cover"
                    @error="handleTechnicianPhotoError"
                  />
                  <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                    <UIcon name="eye" class="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xl" />
                  </div>
                  <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2">
                    <div class="flex justify-between items-center">
                      <span>Photo {{ index + 1 }}</span>
                      <UIcon name="arrow-top-right-on-square" class="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Photos State -->
            <div v-else class="text-center py-8">
              <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UIcon name="camera" class="text-amber-500 text-2xl" />
              </div>
              <p class="text-amber-600 font-medium">No technician photos uploaded</p>
              <p class="text-amber-500 text-sm mt-1">Technician progress photos will appear here when uploaded</p>
            </div>
          </div>
        </div>

        <!-- Product Information -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div class="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4">
            <h3 class="text-xl font-bold text-white flex items-center">
              <UIcon name="shopping-bag" class="mr-3 text-xl" />
              Product Package Information
            </h3>
          </div>
          <div class="p-8">
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <!-- Product Details -->
              <div class="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="shopping-bag" class="text-white text-lg" />
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
                    <UIcon name="bolt" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-blue-800">Speed Configuration</h4>
                </div>
                <div class="space-y-3">
                  <div>
                    <label class="text-sm font-medium text-blue-600">Download Speed</label>
                    <p class="text-lg font-semibold text-gray-800">
                      {{ report.product_download_speed_mbps ? `${report.product_download_speed_mbps} Mbps` : '-' }}
                    </p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-blue-600">Upload Speed</label>
                    <p class="text-lg font-semibold text-gray-800">
                      {{ report.product_upload_speed_mbps ? `${report.product_upload_speed_mbps} Mbps` : '-' }}
                    </p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-blue-600">Total Speed</label>
                    <p class="text-lg font-semibold text-gray-800">
                      {{ report.product_download_speed_mbps && report.product_upload_speed_mbps ? 
                          `${report.product_download_speed_mbps}/${report.product_upload_speed_mbps} Mbps` : '-' }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Package Summary -->
              <div class="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="file-text" class="text-white text-lg" />
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
                      {{ report.product_download_speed_mbps && report.product_upload_speed_mbps ? 
                          `${report.product_download_speed_mbps}/${report.product_upload_speed_mbps} Mbps` : 'Not specified' }}
                    </p>
                  </div>
                  <div class="bg-white p-4 rounded-lg border border-purple-200">
                    <p class="text-sm text-purple-600 font-medium">Monthly Cost:</p>
                    <p class="text-lg font-bold text-gray-800">
                      {{ report.product_price ? `Rp ${report.product_price.toLocaleString('id-ID')}` : 'Not specified' }}
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
              <UIcon name="cpu-chip" class="mr-3 text-xl" />
              Network Device Information
            </h3>
          </div>
          <div class="p-8">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <!-- Router Information -->
              <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="cpu-chip" class="text-white text-lg" />
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
                    <UIcon name="wifi" class="text-white text-lg" />
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
                    <UIcon name="globe-alt" class="text-white text-lg" />
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
                    <UIcon name="signal" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-orange-800">Device Status</h4>
                </div>
                <div class="space-y-3">
                  <div>
                    <label class="text-sm font-medium text-orange-600">Real-time Connection Status</label>
                    <div class="flex items-center space-x-2">
                      <div :class="[
                        'w-3 h-3 rounded-full',
                        getDeviceConnectionStatus(report) === 'up' ? 'bg-green-500' :
                          getDeviceConnectionStatus(report) === 'down' ? 'bg-red-500' : 'bg-gray-500'
                      ]"></div>
                      <span :class="getDeviceConnectionStatusColor(getDeviceConnectionStatus(report))" class="px-3 py-1 rounded-full text-sm font-medium">
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
              <UIcon name="wrench" class="mr-3 text-xl" />
              Customer Service Information
            </h3>
          </div>
          <div class="p-8">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <!-- User Account -->
              <div class="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="user-circle" class="text-white text-lg" />
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
                    <p class="text-lg font-mono text-gray-800 bg-gray-100 px-3 py-1 rounded">{{ report.password || '-' }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-orange-600">Status</label>
                    <span :class="getUserStatusColor(report.user_status)" class="px-3 py-1 rounded-full text-sm font-medium">
                      {{ report.user_status || 'Unknown' }}
                    </span>
                  </div>
                  
                  <!-- Remote Router Access Button -->
                  <div class="pt-3 border-t border-orange-200">
                    <UButton 
                      @click="openRemoteRouter" 
                      color="orange" 
                      variant="solid" 
                      size="sm"
                      class="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg"
                      :disabled="!report.ip_static"
                    >
                      <UIcon name="computer-desktop" class="mr-2" />
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
                    <UIcon name="cable" class="text-white text-lg" />
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
                    <UIcon name="file-text" class="text-white text-lg" />
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
              <UIcon name="users" class="mr-3 text-xl" />
              Installation Team Information
            </h3>
          </div>
          <div class="p-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="user-group" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-indigo-800">Team Name</h4>
                </div>
                <p class="text-lg font-semibold text-gray-800">{{ report.installation_team_name || '-' }}</p>
              </div>
              <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="phone" class="text-white text-lg" />
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
              <UIcon name="clock" class="mr-3 text-xl" />
              Timestamps
            </h3>
          </div>
          <div class="p-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="calendar-days" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-gray-800">Created At</h4>
                </div>
                <p class="text-lg font-semibold text-gray-700">{{ formatDateTime(report?.installation_created_at) }}</p>
              </div>
              <div class="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                <div class="flex items-center mb-4">
                  <div class="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                    <UIcon name="pencil-square" class="text-white text-lg" />
                  </div>
                  <h4 class="text-lg font-semibold text-gray-800">Last Updated</h4>
                </div>
                <p class="text-lg font-semibold text-gray-700">{{ formatDateTime(report?.installation_updated_at) }}</p>
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
                <UIcon name="photo" class="mr-3 text-xl" />
                Document Photo - {{ report?.document_type || 'Document' }}
              </h3>
              <UButton
                color="white"
                variant="ghost"
                icon="x"
                @click="() => { console.log('Modal close button clicked'); showDocumentModal = false; }"
                class="text-white hover:bg-white/20"
              />
            </div>
          </div>
        </template>
        
        <div class="modal-content flex justify-center p-4">
          <div class="relative">
            <div v-if="!selectedDocumentPhoto" class="text-center p-8">
              <p class="text-gray-500">No document photo selected</p>
            </div>

            <img
              v-if="selectedDocumentPhoto && modalImageLoaded"
              :src="getDocumentPhotoUrl(selectedDocumentPhoto)"
              alt="Document Photo"
              class="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl border border-gray-200"
              @error="handleImageError"
              @load="handleImageLoad"
            />
            <div v-if="selectedDocumentPhoto" class="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {{ report?.document_type || 'Document' }}
            </div>

            <!-- Show error message if image failed to load -->
            <div v-if="!modalImageLoaded && selectedDocumentPhoto" class="image-error-message-modal text-center p-8 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
              <div class="text-gray-500 mb-4">
                <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <p class="text-lg text-gray-600 mb-2">Document photo could not be loaded</p>
              <p class="text-sm text-gray-500">The image may be corrupted or the path may be incorrect.</p>
            </div>

            <!-- Debug info -->
            <div class="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
              <p>selectedDocumentPhoto: {{ selectedDocumentPhoto || 'null' }}</p>
              <p>modalImageLoaded: {{ modalImageLoaded }}</p>
              <p>showDocumentModal: {{ showDocumentModal }}</p>
              <p>report.document_photo: {{ report?.document_photo || 'null' }}</p>
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
              <UIcon name="x" class="mr-2" />
              Close
            </UButton>
            <UButton
              color="blue"
              @click="downloadDocumentPhoto"
              size="lg"
            >
              <UIcon name="download" class="mr-2" />
              Download
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Technician Photo Modal -->
    <UModal v-model="showTechnicianPhotoModal">
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">Technician Photo {{ selectedTechnicianPhotoIndex + 1 }}</h3>
            <UButton @click="showTechnicianPhotoModal = false" variant="ghost" size="sm">
              <UIcon name="x" />
            </UButton>
          </div>
        </template>
        
        <div class="text-center">
          <img
            v-if="selectedTechnicianPhoto && technicianPhotoModalLoaded"
            :src="getTechnicianPhotoUrl(selectedTechnicianPhoto)"
            alt="Technician photo"
            class="max-w-full max-h-96 mx-auto rounded-lg"
            @load="handleTechnicianPhotoModalLoad"
            @error="handleTechnicianPhotoModalError"
          />
          
          <!-- Loading state -->
          <div v-if="!technicianPhotoModalLoaded && selectedTechnicianPhoto" class="text-center p-8">
            <UIcon name="refresh-cw" class="animate-spin text-2xl text-amber-600 mx-auto mb-4" />
            <p class="text-gray-600">Loading photo...</p>
          </div>
          
          <!-- Error state -->
          <div v-if="technicianPhotoModalError" class="text-center p-8 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
            <UIcon name="alert-triangle" class="text-2xl text-red-500 mx-auto mb-4" />
            <p class="text-lg text-gray-600 mb-2">Photo could not be loaded</p>
            <p class="text-sm text-gray-500">The image may be corrupted or the path may be incorrect.</p>
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-end space-x-3 bg-gray-50 -m-6 mt-6 p-6">
            <UButton
              color="gray"
              variant="outline"
              @click="showTechnicianPhotoModal = false"
              size="lg"
            >
              <UIcon name="x" class="mr-2" />
              Close
            </UButton>
            <UButton
              color="blue"
              @click="downloadTechnicianPhoto"
              size="lg"
              :disabled="!selectedTechnicianPhoto"
            >
              <UIcon name="download" class="mr-2" />
              Download
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

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
                 <h4 class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ report?.customer_name || 'Unknown Customer' }}</h4>
                 <p class="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-1">
                   ID: {{ installationId }}
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
                 <span class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ report?.customer_name || 'Unknown' }}</span>
               </div>
               <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                 <span class="text-sm font-semibold text-gray-600 dark:text-gray-400 block">Status:</span>
                 <span class="px-3 py-1 rounded-full text-sm font-bold" :class="getStatusColor(report?.installation_status)">
                   {{ report?.installation_status || 'Unknown' }}
                 </span>
               </div>
               <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                 <span class="text-sm font-semibold text-gray-600 dark:text-gray-400 block">Report ID:</span>
                 <span class="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200">{{ installationId }}</span>
               </div>
               <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                 <span class="text-sm font-semibold text-gray-600 dark:text-gray-400 block">MAC Address:</span>
                 <span class="font-mono text-sm bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-blue-800 dark:text-blue-200">{{ report?.mac_address || 'Not available' }}</span>
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
                   <strong class="text-blue-600 dark:text-blue-400">"{{ report?.customer_name || 'Unknown Customer' }}"</strong> 
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
import { ref, watch, onMounted, computed } from 'vue';
import { customerAdminApi } from "@/api/admin/customer";
import type { CompleteInstallationReportWithTechnicianPhotosResponse, InstallationTechnicianTeamResponse } from "@/types/requests/installation-report";
import { useNavigationContext } from "@/composables/useNavigationContext";
import LucideIcon from '@/components/LucideIcon.vue';

// Apply auth middleware
definePageMeta({
  middleware: 'auth'
})

const route = useRoute();
const installationId = route.params.id as string;

const loading = ref(false);
const deleting = ref(false);
const report = ref<CompleteInstallationReportWithTechnicianPhotosResponse | null>(null);
const technicianTeam = ref<InstallationTechnicianTeamResponse[]>([]);
const showDocumentModal = ref(false);
const showDeleteModal = ref(false);
const deleteConfirmationChecked = ref(false);

// Navigation context management
const { getBackNavigation, clearNavigationContext } = useNavigationContext();

// Computed property for back navigation
const backNavigation = computed(() => getBackNavigation());
const backNavigationLabel = computed(() => backNavigation.value.returnLabel);

// Handle back navigation
function handleBackNavigation() {
  const navigation = backNavigation.value;
  navigateTo(navigation.returnUrl);
  // Clear the navigation context after use
  clearNavigationContext();
}
const selectedDocumentPhoto = ref<string | undefined>(undefined);
const modalImageLoaded = ref(true); // Start as true, set to false on error

// Technician photo variables
const showTechnicianPhotoModal = ref(false);
const selectedTechnicianPhoto = ref<string | undefined>(undefined);
const selectedTechnicianPhotoIndex = ref(0);
const technicianPhotoModalLoaded = ref(true);
const technicianPhotoModalError = ref(false);

// Function to refresh device status
async function refreshDeviceStatus() {
  if (!report.value?.ip_static) return
  
  try {
    const device = { ip_static: report.value.ip_static }
    await fetchRealTimeDeviceStatus(device)
    console.log('Device status refreshed for IP:', report.value.ip_static)
  } catch (error) {
    console.error('Failed to refresh device status:', error)
  }
}

onMounted(async () => {
  // Clear any lingering modal states from other pages
  clearGlobalModalStates();
  await loadReport();
});

// Function to clear global modal states
function clearGlobalModalStates() {
  // Force close any lingering modals by dispatching a custom event
  window.dispatchEvent(new CustomEvent('clear-all-modals'));
  
  // Also try to close any UModal components that might be open
  const openModals = document.querySelectorAll('[data-modal-open="true"]');
  openModals.forEach(modal => {
    const closeButton = modal.querySelector('[data-modal-close]');
    if (closeButton) {
      (closeButton as HTMLElement).click();
    }
  });
}

// Watch for modal state changes
watch(showDocumentModal, (newVal: boolean, oldVal: boolean) => {
  console.log('🔍 Modal state changed:', oldVal, '→', newVal);
  if (newVal) {
    console.log('✅ Modal should be opening now');
  } else {
    console.log('❌ Modal should be closing now');
  }
});

watch(selectedDocumentPhoto, (newVal: string | undefined, oldVal: string | undefined) => {
  console.log('🔍 selectedDocumentPhoto changed:', oldVal, '→', newVal);
});

watch(modalImageLoaded, (newVal: boolean, oldVal: boolean) => {
  console.log('🔍 modalImageLoaded changed:', oldVal, '→', newVal);
});

async function loadReport() {
  loading.value = true;
  try {
    // Use the endpoint that preloads Images relationship for technician photos
    const [reportResponse, technicianResponse] = await Promise.all([
      customerAdminApi().getInstallationReportCompleteWithTechnicianPhotos(installationId),
      customerAdminApi().getInstallationTechnicianTeam(installationId)
    ]);
    
    report.value = reportResponse.data || null;
    technicianTeam.value = technicianResponse.data || [];
    
    console.log("Loaded report data:", report.value);
    console.log("Images relationship:", report.value?.images);
    
    // Debug PSB fields specifically
    if (report.value) {
      console.log("🔍 PSB Debug Info:");
      console.log("- tgl_permintaan_psb:", report.value.tgl_permintaan_psb);
      console.log("- durasi_psb:", report.value.durasi_psb);
      console.log("- status_psb:", report.value.status_psb);
      console.log("- installation_completed_at:", report.value.installation_completed_at);
    }
    
    // Debug: Check if technician photos are properly computed from Images relationship
    if (report.value) {
      console.log("Report images:", report.value.images);
      console.log("Report images count:", report.value.images?.length || 0);
      
      // Ensure images is an array (handle null/undefined cases)
      const images = report.value.images || [];
      console.log("Images array (normalized):", images);
      
      // Filter technician photos from images (where archive_installation_id is set)
      const technicianPhotos = images.filter((img: any) => img.archive_installation_id);
      console.log("Technician photos from images:", technicianPhotos);
      console.log("Technician photos count:", technicianPhotos.length);
      
      // Refresh device status after report is loaded
      if (report.value.ip_static) {
        await refreshDeviceStatus();
      }
    }
  } catch (error) {
    console.error("Failed to load report:", error);
    report.value = null;
    technicianTeam.value = [];
    
    // Show user-friendly error message
    useToast().add({
      title: "Error",
      description: "Failed to load installation report. Please try again.",
      color: "red",
    });
  } finally {
    loading.value = false;
  }
}

function printReport() {
  window.print();
}

function deleteInstallationReport() {
  showDeleteModal.value = true;
}

// function onDeleteConfirmed() {
//   // Navigate back to reports list after successful deletion
//   navigateTo('/dashboard/report/customer-installation/reports');
// }

function closeDeleteModal() {
  showDeleteModal.value = false;
  deleteConfirmationChecked.value = false;
}

// TypeScript: Delete confirmation handler
const confirmDelete = async () => {
  if (!installationId || !deleteConfirmationChecked.value || deleting.value) return
  
  deleting.value = true
  
  try {
    await customerAdminApi().deleteInstallationReport(installationId)
    
    // Show success notification
    useToast().add({
      title: 'Success!',
      description: `Installation report for "${report.value?.customer_name || 'Unknown Customer'}" deleted successfully. MAC address status updated to "in_stock".`,
      color: 'green',
    })
    
    closeDeleteModal();
    await navigateTo('/dashboard/report/customer-installation/reports');
  } catch (err: any) {
    console.error("Error deleting installation report:", err)
    
    // Show error notification
    useToast().add({
      title: 'Error',
      description: err.message || 'Failed to delete installation report',
      color: 'red',
    })
  } finally {
    deleting.value = false
  }
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
  if (!documentPhoto) {
    console.log('getDocumentPhotoUrl: No document photo provided');
    return '';
  }

  console.log('getDocumentPhotoUrl: Processing path:', documentPhoto);

  // If it's already a full URL, return as is
  if (documentPhoto.startsWith('http')) {
    console.log('getDocumentPhotoUrl: Already a full URL:', documentPhoto);
    return documentPhoto;
  }

  // Get the API host from environment
  const apiHost = useApiHost();

  // Normalize the path by removing any duplicated upload directories
  let normalizedPath = normalizeDocumentPhotoPath(documentPhoto);
  console.log('getDocumentPhotoUrl: Normalized path:', documentPhoto, '->', normalizedPath);

  // If it starts with uploads/, add the backend base URL
  if (normalizedPath.startsWith('uploads/')) {
    const url = `${apiHost}/${normalizedPath}`;
    console.log('getDocumentPhotoUrl: Generated URL:', url);
    return url;
  }

  // If it's just a filename, assume it's in uploads/installations/documents/
  if (!normalizedPath.includes('/')) {
    const url = `${apiHost}/uploads/installations/documents/${normalizedPath}`;
    console.log('getDocumentPhotoUrl: Generated URL for filename:', url);
    return url;
  }

  // Default: prepend backend URL
  const url = `${apiHost}/${normalizedPath}`;
  console.log('getDocumentPhotoUrl: Generated default URL:', url);
  return url;
}

// Normalize document photo path by removing duplicated upload directories
function normalizeDocumentPhotoPath(path: string): string {
  // Handle various path formats found in database:
  // 1. uploads\installations\documents\filename (Windows paths with backslashes)
  // 2. uploads/installations/documents/uploads/installations/documents/filename (duplicated)
  // 3. uploads/installations/documents/filename (correct)
  // 4. uploads/documents/filename (incorrect structure)

  // First, convert Windows backslashes to forward slashes for web URLs
  let normalized = path.replace(/\\/g, '/');

  // Handle triple duplication: uploads/installations/documents/uploads/installations/documents/
  while (normalized.includes('uploads/installations/documents/uploads/installations/documents/')) {
    normalized = normalized.replace('uploads/installations/documents/uploads/installations/documents/', 'uploads/installations/documents/');
  }

  // Handle double duplication: uploads/installations/documents/uploads/installations/
  while (normalized.includes('uploads/installations/documents/uploads/installations/')) {
    normalized = normalized.replace('uploads/installations/documents/uploads/installations/', 'uploads/installations/documents/');
  }

  // Handle single duplication: uploads/installations/documents/uploads/
  while (normalized.includes('uploads/installations/documents/uploads/') && !normalized.includes('uploads/installations/documents/uploads/installations/')) {
    normalized = normalized.replace('uploads/installations/documents/uploads/', 'uploads/installations/documents/');
  }

  // Handle incorrect structure: uploads/documents/ -> uploads/installations/documents/
  if (normalized.startsWith('uploads/documents/')) {
    normalized = normalized.replace('uploads/documents/', 'uploads/installations/documents/');
  }

  // Handle paths that are just filenames
  if (!normalized.includes('/') && normalized.endsWith('.jpg')) {
    normalized = 'uploads/installations/documents/' + normalized;
  }

  return normalized;
}

function openDocumentPhoto(documentPhoto: string | undefined) {
  console.log('=== MODAL DEBUG START ===');
  console.log('openDocumentPhoto called with:', documentPhoto);
  const reportData = report.value;
  console.log('report.document_photo value:', reportData?.document_photo);

  if (!documentPhoto) {
    console.log('❌ No document photo provided, aborting');
    return;
  }

  console.log('✅ Document photo provided, proceeding...');
  console.log('Setting selectedDocumentPhoto to:', documentPhoto);
  selectedDocumentPhoto.value = documentPhoto;

  console.log('Setting modalImageLoaded to true');
  modalImageLoaded.value = true;

  console.log('Setting showDocumentModal to true');
  showDocumentModal.value = true;

  console.log('Current modal state after setting:');
  console.log('- selectedDocumentPhoto:', selectedDocumentPhoto.value);
  console.log('- modalImageLoaded:', modalImageLoaded.value);
  console.log('- showDocumentModal:', showDocumentModal.value);

  // Debug: Check what URL will be generated
  const testUrl = getDocumentPhotoUrl(documentPhoto);
  console.log('Generated URL for modal:', testUrl);

  console.log('=== MODAL DEBUG END ===');
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  console.log('Image failed to load:', img.src);

  // Check if this is the modal image or the thumbnail image
  const isModalImage = img.closest('.modal-content') !== null;

  if (isModalImage) {
    // For modal images, set the loaded state to false
    modalImageLoaded.value = false;
    console.log('Modal image failed to load, showing error message');
  } else {
    // For thumbnail images, hide the image and show error message
    img.style.display = 'none';

    const parentDiv = img.parentElement;
    if (parentDiv && !parentDiv.querySelector('.image-error-message')) {
      const errorMsg = document.createElement('div');
      errorMsg.className = 'image-error-message text-center p-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300';
      errorMsg.innerHTML = `
        <div class="text-gray-500 mb-2">
          <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </div>
        <p class="text-sm text-gray-600">Document photo could not be loaded</p>
      `;
      parentDiv.appendChild(errorMsg);
    }
  }
}

function handleImageLoad() {
  console.log('Modal image loaded successfully');
  modalImageLoaded.value = true;
}

function openDocumentPhotoModal() {
  console.log('🖱️ THUMBNAIL CLICKED!');
  console.log('Current showDocumentModal:', showDocumentModal.value);
  console.log('Current selectedDocumentPhoto:', selectedDocumentPhoto.value);
  console.log('Report document_photo:', report.value?.document_photo);
  
  showDocumentModal.value = true;
  selectedDocumentPhoto.value = report.value?.document_photo;
  modalImageLoaded.value = true;
  
  console.log('After setting - showDocumentModal:', showDocumentModal.value);
  console.log('After setting - selectedDocumentPhoto:', selectedDocumentPhoto.value);
}

function downloadDocumentPhoto() {
  if (!selectedDocumentPhoto.value) return;

  const photoUrl = getDocumentPhotoUrl(selectedDocumentPhoto.value);
  const link = document.createElement('a');
  link.href = photoUrl;

  // Get the current report data
  const currentReport = report.value;
  if (!currentReport) {
    console.warn('downloadDocumentPhoto: report is null');
    return;
  }

  // Use optional chaining and nullish coalescing for safety
  const customerName = currentReport.customer_name || 'installation';
  const docType = currentReport.document_type || 'document';

  link.download = `document_${customerName}_${docType}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Computed property for technician photos - now using Images relationship
const technicianPhotos = computed(() => {
  if (!report.value) return [];
  
  try {
    // Ensure images is an array (handle null/undefined cases)
    const images = report.value.images || [];
    
    // Filter images where archive_installation_id is set (technician photos)
    return images.filter((img: any) => img.archive_installation_id);
  } catch (error) {
    console.error('Error filtering technician photos from images:', error);
    return [];
  }
});

// Technician photo functions
function getTechnicianPhotoUrl(photoPath: string) {
  if (!photoPath) return '';
  
  // If it's already a full URL, return as is
  if (photoPath.startsWith('http')) {
    return photoPath;
  }
  
  // Get the API host from environment
  const apiHost = useApiHost();
  return `${apiHost}/${photoPath}`;
}

function openTechnicianPhotoModal(photo: string, index: number) {
  selectedTechnicianPhoto.value = photo;
  selectedTechnicianPhotoIndex.value = index;
  technicianPhotoModalLoaded.value = true;
  technicianPhotoModalError.value = false;
  showTechnicianPhotoModal.value = true;
}

function handleTechnicianPhotoError(event: Event) {
  const img = event.target as HTMLImageElement;
  console.log('Technician photo failed to load:', img.src);
  img.style.display = 'none';
  
  const parentDiv = img.parentElement;
  if (parentDiv && !parentDiv.querySelector('.technician-photo-error')) {
    const errorMsg = document.createElement('div');
    errorMsg.className = 'technician-photo-error text-center p-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300';
    errorMsg.innerHTML = `
      <div class="text-gray-500 mb-2">
        <UIcon name="alert-triangle" class="w-8 h-8 mx-auto mb-2" />
      </div>
      <p class="text-sm text-gray-600">Photo could not be loaded</p>
    `;
    parentDiv.appendChild(errorMsg);
  }
}

function handleTechnicianPhotoModalLoad() {
  technicianPhotoModalLoaded.value = true;
  technicianPhotoModalError.value = false;
}

function handleTechnicianPhotoModalError() {
  technicianPhotoModalLoaded.value = false;
  technicianPhotoModalError.value = true;
}

function downloadTechnicianPhoto() {
  if (!selectedTechnicianPhoto.value) return;
  
  const photoUrl = getTechnicianPhotoUrl(selectedTechnicianPhoto.value);
  const link = document.createElement('a');
  link.href = photoUrl;
  link.download = `technician_photo_${selectedTechnicianPhotoIndex.value + 1}_${report.value?.customer_name || 'customer'}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function openRemoteRouter() {
  if (!report.value?.ip_static) {
    useToast().add({
      title: 'Error',
      description: 'IP address not available for remote access',
      color: 'red',
    });
    return;
  }

  const routerUrl = `http://${report.value.ip_static}:8080`;
  
  // Open in new tab
  window.open(routerUrl, '_blank');
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

// Real-time device status cache
const deviceStatusCache = ref<Map<string, { status: string; timestamp: number }>>(new Map())

// Get device connection status (now using real-time Mikrotik data)
function getDeviceConnectionStatus(device: any) {
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

  // For now, return 'unknown' to indicate we need to fetch real-time data
  // TODO: Implement actual Mikrotik API call here
  const status = 'unknown'
  
  // Cache the result
  deviceStatusCache.value.set(cacheKey, { status, timestamp: now })
  
  return status
}

// Function to fetch real-time status from Mikrotik (placeholder for future implementation)
async function fetchRealTimeDeviceStatus(device: any) {
  if (!device?.ip_static) return 'off'
  
  try {
    // TODO: Implement actual Mikrotik API call
    // const response = await mikrotikAdminApi().getDeviceStatus(device.ip_static)
    // return response.status || 'unknown'
    
    // For now, return a mock status based on IP
    const mockStatus = device.ip_static.includes('10.10.20') ? 'up' : 'down'
    
    // Update cache
    deviceStatusCache.value.set(device.ip_static, { 
      status: mockStatus, 
      timestamp: Date.now() 
    })
    
    return mockStatus
  } catch (error) {
    console.error('Failed to fetch device status:', error)
    return 'unknown'
  }
}

// Get device connection status color for real-time status
function getDeviceConnectionStatusColor(status: string) {
  switch (status) {
    case 'up':
      return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md';
    case 'down':
      return 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md';
    case 'off':
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

// Helper functions for technician team display
function getRoleColor(role: string) {
  switch (role.toLowerCase()) {
    case 'senior':
      return 'bg-blue-100 text-blue-800';
    case 'junior':
      return 'bg-green-100 text-green-800';
    case 'helper':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getRoleDisplayName(role: string) {
  switch (role.toLowerCase()) {
    case 'senior':
      return '👨‍🔧 Senior';
    case 'junior':
      return '👷 Junior';
    case 'helper':
      return '🔧 Helper';
    default:
      return role;
  }
}
</script>
