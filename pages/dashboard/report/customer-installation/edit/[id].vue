<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
    <div class="container mx-auto p-4 sm:p-6">
      <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <!-- Header Section -->
        <div class="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 sm:px-8 py-4 sm:py-6">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div class="flex items-center space-x-3 sm:space-x-4">
              <div class="bg-white/20 p-2 sm:p-3 rounded-xl">
                <LucideIcon name="wrench" :size="24" class="text-white" />
              </div>
              <div>
                <h1 class="text-lg sm:text-2xl font-bold text-white">Edit Installation Report</h1>
                <p class="text-emerald-100 text-xs sm:text-sm mt-1">Update installation details and configuration</p>
              </div>
            </div>
            <UButton @click="$router.back()" variant="outline" color="white"
              class="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto">
              <LucideIcon name="arrow-left" :size="16" class="mr-2" />
              Back
            </UButton>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center py-12 sm:py-16">
          <div class="text-center">
            <LucideIcon name="rotate-ccw" :size="32" class="animate-spin text-emerald-500 mb-4" />
            <p class="text-gray-600 text-sm sm:text-base">Loading installation report...</p>
          </div>
        </div>

        <!-- Form Content -->
        <UForm v-else :schema="schema" :state="state" @submit="onSubmit" class="p-4 sm:p-8 space-y-6 sm:space-y-8">
          <!-- Basic Installation Information -->
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl border border-blue-100">
            <div class="flex items-center mb-4 sm:mb-6">
              <div class="bg-blue-500 p-2 rounded-lg mr-2 sm:mr-3">
                <LucideIcon name="info" :size="16" class="text-white" />
              </div>
              <h2 class="text-lg sm:text-xl font-bold text-gray-800">Basic Installation Information</h2>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <UFormGroup label="Customer" name="customer_id" required>
                <USelect v-model="state.customer_id" :options="customerOptions" option-attribute="name"
                  value-attribute="id" placeholder="Select Customer" @change="onCustomerChange" class="custom-select" />
              </UFormGroup>

              <UFormGroup label="Tgl. Permintaan PSB" name="tgl_permintaan_psb">
                <UInput v-model="selectedCustomerPSBDate" type="date" readonly placeholder="Select customer first"
                  class="bg-gray-50 border-gray-200" />
              </UFormGroup>

              <UFormGroup label="Leader Technician (Senior)" name="technician_id" required>
                <USelect v-model="state.technician_id" :options="technicianOptions" option-attribute="name"
                  value-attribute="id" placeholder="Select Technician" class="custom-select" />
              </UFormGroup>

              <UFormGroup label="Installation Type" name="installation_type">
                <USelect v-model="state.installation_type" :options="installationTypeOptions"
                  placeholder="Select Installation Type" class="custom-select" />
              </UFormGroup>

              <UFormGroup label="Status" name="status">
                <USelect v-model="state.status" :options="statusOptions" placeholder="Select Status"
                  class="custom-select" />
              </UFormGroup>

              <UFormGroup label="Tgl. On Air" name="on_air_date">
                <UInput v-model="state.on_air_date" type="date" placeholder="Select On Air Date" class="custom-input" />
              </UFormGroup>

              <UFormGroup label="Tgl. Batas Percobaan" name="trial_end_date">
                <UInput v-model="state.trial_end_date" type="date" placeholder="Select Trial End Date"
                  class="custom-input" />
              </UFormGroup>

              <UFormGroup label="Tgl. Siap Layanan" name="service_ready_date">
                <UInput v-model="state.service_ready_date" type="date" placeholder="Select Service Ready Date"
                  class="custom-input" />
              </UFormGroup>

              <UFormGroup label="Installation Completed At" name="installation_completed_at">
                <UInput v-model="state.installation_completed_at" type="datetime-local"
                  placeholder="Select Completion Date" class="custom-input" />
              </UFormGroup>

              <!-- Installation Location -->
              <UFormGroup label="Latitude" name="latitude">
                <UInput v-model="state.latitude" type="number" step="any" placeholder="e.g., -6.2088"
                  class="custom-input" />
              </UFormGroup>

              <UFormGroup label="Longitude" name="longitude">
                <UInput v-model="state.longitude" type="number" step="any" placeholder="e.g., 106.8456"
                  class="custom-input" />
              </UFormGroup>
            </div>

            <!-- Location Preview -->
            <div v-if="state.latitude && state.longitude" class="mt-4 p-4 bg-rose-50 rounded-lg border border-rose-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-rose-800">Installation Location</p>
                  <p class="text-xs text-rose-600 font-mono">{{ state.latitude }}, {{ state.longitude }}</p>
                </div>
                <UButton @click="openGoogleMaps(state.latitude!, state.longitude!)" color="rose" variant="outline"
                  size="xs">
                  <template #leading>
                    <LucideIcon name="external-link" :size="14" />
                  </template>
                  Open in Maps
                </UButton>
              </div>
            </div>
          </div>

          <!-- Terminal Installation Section -->
          <div
            class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl border border-blue-100 mt-4 sm:mt-6">
            <div class="flex items-center mb-4 sm:mb-6">
              <div class="bg-blue-500 p-2 rounded-lg mr-2 sm:mr-3">
                <LucideIcon name="server" :size="16" class="text-white" />
              </div>
              <h2 class="text-lg sm:text-xl font-bold text-gray-800">Terminal Installation</h2>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <!-- Terminal Installation Checkbox -->
              <div class="sm:col-span-2">
                <div class="flex items-center p-4 bg-blue-50 rounded-lg border-2 border-blue-300 shadow-sm">
                  <input type="checkbox" :checked="state.is_terminal === 'yes'"
                    @change="state.is_terminal = ($event.target as HTMLInputElement).checked ? 'yes' : 'no'"
                    id="is_terminal"
                    class="w-5 h-5 text-blue-600 bg-white border-2 border-gray-400 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer" />
                  <label for="is_terminal" class="ml-3 flex-1 cursor-pointer">
                    <div class="flex items-center gap-2 mb-1">
                      <LucideIcon name="server" :size="18" class="text-blue-600 flex-shrink-0" />
                      <span class="text-base font-semibold text-gray-900">Terminal Installation</span>
                    </div>
                    <p class="text-xs text-gray-700 mt-1 font-normal">
                      Check this if this installation is for a terminal (HTB) that will serve multiple customers
                    </p>
                  </label>
                </div>
              </div>

              <!-- Terminal Customer Selection (always available) -->
              <UFormGroup name="terminal_customer_installation_id" class="sm:col-span-2">
                <template #label>
                  <div class="flex items-center gap-2">
                    <LucideIcon name="server" :size="16" class="text-gray-600" />
                    <span class="text-gray-900 font-semibold">Select Terminal Installation</span>
                    <span class="text-gray-500 text-xs font-normal">(Optional)</span>
                  </div>
                </template>
                <div class="bg-white rounded-lg p-2 border-2 border-gray-300 shadow-sm terminal-customer-wrapper">
                  <USelectMenu v-model="state.terminal_customer_installation_id" :options="terminalInstallationOptions"
                    placeholder="Select terminal installation (HTB)" searchable
                    searchable-placeholder="Search by customer name or installation ID" option-attribute="display"
                    value-attribute="id" :search-attributes="['customer_name', 'installation_id']"
                    class="terminal-customer-select" />
                </div>
                <p class="text-xs text-gray-600 mt-1">
                  <LucideIcon name="info" :size="14" class="inline mr-1" />
                  Select the terminal installation (HTB) that this installation is connected to. Only installations with
                  is_terminal = 'yes' are shown.
                </p>
                <p v-if="terminalInstallationOptions.length === 0 && !loading" class="text-xs text-orange-600 mt-1">
                  <LucideIcon name="alert-triangle" :size="14" class="inline mr-1" />
                  No terminal installations found. Please create a terminal installation first.
                </p>
              </UFormGroup>
            </div>

            <UFormGroup label="Notes" name="notes" class="mt-6">
              <UTextarea v-model="state.notes" placeholder="Enter installation notes..." :rows="4"
                class="custom-textarea" />
            </UFormGroup>
          </div>

          <!-- Installation Team Information -->
          <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
            <div class="flex items-center mb-6">
              <div class="bg-purple-500 p-2 rounded-lg mr-3">
                <LucideIcon name="users" class="text-white text-lg" />
              </div>
              <h2 class="text-xl font-bold text-gray-800">Installation Team Information</h2>
            </div>

            <div v-if="installationTeam.length > 0" class="space-y-4">
              <div v-for="(member, index) in installationTeam" :key="index"
                class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div class="flex justify-between items-center mb-2">
                  <h4 class="text-lg font-semibold text-gray-700 flex items-center">
                    <LucideIcon name="user" class="mr-2 text-purple-500" />
                    {{ member.technician?.name || 'Unknown Technician' }}
                    <span v-if="member.is_primary"
                      class="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      Lead
                    </span>
                  </h4>
                  <span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full capitalize">
                    {{ member.role }}
                  </span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div v-if="member.technician?.phone">
                    <span class="font-medium">Phone:</span> {{ member.technician.phone }}
                  </div>
                  <div v-if="member.technician?.email">
                    <span class="font-medium">Email:</span> {{ member.technician.email }}
                  </div>
                </div>
                <div v-if="member.notes" class="mt-2 text-sm text-gray-600">
                  <span class="font-medium">Notes:</span> {{ member.notes }}
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 text-gray-500">
              <LucideIcon name="users" class="text-4xl mb-2" />
              <p>No installation team members assigned</p>
            </div>
          </div>

          <!-- Document Information -->
          <div class="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-100">
            <div class="flex items-center mb-6">
              <div class="bg-orange-500 p-2 rounded-lg mr-3">
                <LucideIcon name="file-text" class="text-white text-lg" />
              </div>
              <h2 class="text-xl font-bold text-gray-800">Document Information</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UFormGroup label="Tipe Dokumen" name="document_type">
                <USelect v-model="state.document_type" :options="documentTypeOptions" placeholder="Select Document Type"
                  class="custom-select" />
              </UFormGroup>

              <UFormGroup label="Foto Dokumen" name="document_photo">
                <div v-if="state.document_photo" class="mb-4">
                  <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <img :src="getFullImageUrl(state.document_photo)" alt="Current document"
                      class="w-32 h-32 object-cover rounded-lg border" />
                    <p class="text-sm text-gray-600 mt-2 font-medium">Current document photo</p>
                  </div>
                </div>
                <div
                  class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-400 transition-colors">
                  <UInput type="file" accept="image/*" @change="handleDocumentPhotoUpload"
                    placeholder="Upload new document photo" class="custom-input" />
                  <p class="text-sm text-gray-500 mt-2">Click to upload new document photo</p>
                </div>
                <div v-if="state.documentPreview" class="mt-2">
                  <img :src="state.documentPreview" alt="Document Preview"
                    class="w-32 h-20 object-cover rounded border" />
                </div>
              </UFormGroup>
            </div>
          </div>

          <!-- Network Device Configuration -->
          <div class="bg-gradient-to-r from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-100">
            <div class="flex items-center mb-6">
              <div class="bg-cyan-500 p-2 rounded-lg mr-3">
                <LucideIcon name="cpu-chip" class="text-white text-lg" />
              </div>
              <h2 class="text-xl font-bold text-gray-800">Network Device Configuration</h2>
            </div>

            <div class="mb-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-700">Network Devices</h3>
              </div>

              <div v-for="(device, index) in state.network_devices" :key="index"
                class="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
                <div class="flex justify-between items-center mb-4">
                  <h4 class="text-lg font-semibold text-gray-700 flex items-center">
                    <LucideIcon name="cpu-chip" class="mr-2 text-cyan-500" />
                  </h4>
                  <UButton @click="removeNetworkDevice(index)" size="sm" color="red" variant="outline"
                    class="hover:bg-red-50">
                    <LucideIcon name="trash-2" />
                  </UButton>
                </div>

                <!-- Router Information -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <USelect v-model="device.assets_id" :options="assetOptions" option-attribute="name"
                    value-attribute="id" placeholder="Select Router Asset" class="custom-select"
                    @change="onAssetChange(device.assets_id, index)" />
                  <div v-if="device.assets_id" class="flex items-center text-sm text-gray-600">
                    <LucideIcon name="info" class="mr-2 text-cyan-500" />
                    <span>
                      {{ getAssetDisplayName(device.assets_id) }}
                    </span>
                  </div>
                </div>

                <!-- Network Configuration -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <UInput v-model="device.switch_id" placeholder="Switch ID" class="custom-input" />
                  <UInput v-model="device.port_number" placeholder="Port Number" class="custom-input" />
                  <UInput v-model="device.remote_port" placeholder="RemotePort" class="custom-input" />
                  <UInput v-model="device.eth_port" placeholder="EthPort" class="custom-input" />
                </div>

                <!-- Device Information -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <USelect v-model="device.asset_item_id" :options="availableAssetItems[device.assets_id] || []"
                      :placeholder="!device.assets_id ? 'Select an asset first' : 'Select MAC Address'"
                      :disabled="!device.assets_id || (availableAssetItems[device.assets_id] && availableAssetItems[device.assets_id].length === 0)"
                      @update:model-value="value => onMacAddressChange(value, index)" class="custom-select" />
                    <div
                      v-if="device.assets_id && availableAssetItems[device.assets_id] && availableAssetItems[device.assets_id].length === 0"
                      class="text-xs text-red-500 mt-1 flex items-center">
                      <LucideIcon name="alert-triangle" class="w-3 h-3 mr-1" />
                      No available devices for this asset
                    </div>
                    <div
                      v-else-if="device.assets_id && availableAssetItems[device.assets_id] && availableAssetItems[device.assets_id].length > 0"
                      class="text-xs text-green-600 mt-1">
                      {{ availableAssetItems[device.assets_id].length }} device(s) available
                    </div>
                  </div>
                  <UInput v-model="device.ip_static" placeholder="IPAddr" class="custom-input" />
                  <USelect v-model="device.kepemilikan_perangkat" :options="kepemilikanOptions"
                    placeholder="Kepemilikan Perangkat" class="custom-select" />
                </div>

                <!-- Status Information -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <USelect v-model="device.status_perangkat" :options="statusPerangkatOptions"
                    placeholder="Status Perangkat" class="custom-select" />
                  <USelect v-model="device.last_ping_status" :options="pingStatusOptions" placeholder="Ping"
                    class="custom-select" />
                </div>
              </div>
            </div>
          </div>

          <!-- Customer Services -->
          <div class="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
            <div class="flex items-center mb-6">
              <div class="bg-green-500 p-2 rounded-lg mr-3">
                <LucideIcon name="wifi" class="text-white text-lg" />
              </div>
              <h2 class="text-xl font-bold text-gray-800">Customer Services</h2>
            </div>

            <div class="mb-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-700">Customer Services</h3>
                <UButton @click="addCustomerService" size="sm" color="green" class="shadow-md">
                  <LucideIcon name="plus" class="mr-1" />
                  Add Service
                </UButton>
              </div>

              <div v-for="(service, index) in state.customer_services" :key="index"
                class="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
                <div class="flex justify-between items-center mb-4">
                  <h4 class="text-lg font-semibold text-gray-700 flex items-center">
                    <LucideIcon name="wifi" class="mr-2 text-green-500" />
                    Customer Service {{ index + 1 }}
                  </h4>
                  <UButton @click="removeCustomerService(index)" size="sm" color="red" variant="outline"
                    class="hover:bg-red-50">
                    <LucideIcon name="trash-2" />
                  </UButton>
                </div>

                <!-- User Information -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <UInput v-model="service.user_login" placeholder="UserLogin" class="custom-input" />
                  <UInput v-model="service.password" placeholder="Password" class="custom-input" />
                  <USelect v-model="service.user_status" :options="userStatusOptions" placeholder="Status User"
                    class="custom-select" />
                </div>

                <!-- Cable and Port Information -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <UInput v-model="service.cable_length" type="number" placeholder="Cable Length (m)"
                    class="custom-input" />
                  <UInput v-model="service.end_port_type" placeholder="End Port Type" class="custom-input" />
                  <UInput v-model="service.installation_notes" placeholder="Installation Notes" class="custom-input" />
                </div>
              </div>
            </div>
          </div>



          <!-- Technician Photo Documentation -->
          <div class="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-100">
            <div class="flex items-center mb-6">
              <div class="bg-amber-500 p-2 rounded-lg mr-3">
                <LucideIcon name="camera" class="text-white text-lg" />
              </div>
              <h2 class="text-xl font-bold text-gray-800">Technician Photo Documentation</h2>
            </div>

            <div class="mb-4">
              <p class="text-sm text-gray-600 mb-4">
                Document your PSB progress with photos (maximum 10 images). Images will be automatically compressed to
                reduce file
                size.
              </p>

              <UFormGroup label="Progress Notes" name="technician_photos_notes">
                <UTextarea v-model="state.technician_photos_notes"
                  placeholder="Add notes about the installation progress and photos..." :rows="3"
                  class="custom-textarea" />
              </UFormGroup>
            </div>

            <UFormGroup label="Upload Progress Photos" name="technician_photos">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div v-for="(preview, index) in state.technician_photo_previews" :key="index"
                  class="relative group cursor-pointer bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                  @click="state.selectedTechnicianImage = preview; state.showTechnicianModal = true">
                  <img :src="preview" :alt="`Technician Photo ${index + 1}`" class="w-full h-32 object-cover" />
                  <div
                    class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                    <LucideIcon name="eye"
                      class="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xl" />
                  </div>
                  <UButton @click.stop="removeTechnicianPhoto(index)" size="xs" color="red" variant="solid"
                    class="absolute -top-2 -right-2 shadow-lg">
                    <LucideIcon name="x" />
                  </UButton>
                  <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2">
                    <div class="flex justify-between items-center">
                      <span>Photo {{ index + 1 }}</span>
                      <span v-if="technicianPhotoSizes[index]" class="text-xs opacity-75">
                        {{ formatFileSize(technicianPhotoSizes[index]) }}
                      </span>
                    </div>
                  </div>
                </div>

                <div v-if="state.technician_photo_previews.length < 10"
                  class="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all duration-200 bg-white"
                  @click="triggerTechnicianPhotoUpload">
                  <div class="text-center">
                    <LucideIcon name="plus" class="text-gray-400 text-3xl mb-2" />
                    <p class="text-sm text-gray-500 font-medium">Add Photo</p>
                    <p class="text-xs text-gray-400">{{ state.technician_photo_previews.length }}/10</p>
                  </div>
                </div>
              </div>

              <input ref="technicianPhotoInput" type="file" accept="image/*" multiple class="hidden"
                @change="handleTechnicianPhotoUpload" />

              <div v-if="state.technician_photo_previews.length > 0"
                class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div class="flex items-center text-sm text-amber-800">
                  <LucideIcon name="info" class="mr-2" />
                  <span>
                    {{ state.technician_photo_previews.length }} photo(s) uploaded.
                    Total size: {{ formatFileSize(totalTechnicianPhotoSize) }}
                  </span>
                </div>
              </div>
            </UFormGroup>
          </div>



          <!-- Submit Button -->
          <div class="bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-200">
            <div class="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <UButton @click="$router.back()" variant="outline" color="gray" size="sm"
                class="w-full sm:w-auto px-6 sm:px-8">
                <LucideIcon name="x" class="mr-2" />
                Cancel
              </UButton>
              <UButton type="submit" :loading="isSubmitting" color="emerald" size="sm"
                class="w-full sm:w-auto px-6 sm:px-8 shadow-lg">
                <LucideIcon name="check" class="mr-2" />
                Update Installation Report
              </UButton>
            </div>
          </div>
        </UForm>
      </div>
    </div>
  </div>

  <!-- Image Modal -->
  <UModal v-model="state.showModal">
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">Image Preview</h3>
          <UButton @click="state.showModal = false" variant="ghost" size="sm">
            <LucideIcon name="x" />
          </UButton>
        </div>
      </template>

      <div class="text-center">
        <img :src="state.selectedImage" alt="Full size preview" class="max-w-full max-h-96 mx-auto rounded-lg" />
      </div>
    </UCard>
  </UModal>

  <!-- Technician Photo Modal -->
  <UModal v-model="state.showTechnicianModal">
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">Technician Photo Preview</h3>
          <UButton @click="state.showTechnicianModal = false" variant="ghost" size="sm">
            <LucideIcon name="x" />
          </UButton>
        </div>
      </template>

      <div class="text-center">
        <img :src="state.selectedTechnicianImage" alt="Technician photo preview"
          class="max-w-full max-h-96 mx-auto rounded-lg" />
      </div>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { object, string, number } from 'yup'
import type { FormSubmitEvent } from '#ui/types'
import { customerAdminApi } from '@/api/admin/customer'
import { assetAdminApi } from '@/api/admin/asset'
import { assetItemAdminApi } from '@/api/admin/asset-item'
import { userManagementAdminApi } from '@/api/admin/user-management'
import { uploadFileAdminApi } from '@/api/admin/file-upload'
import type { UpdateCompleteInstallationReportRequest } from '@/types/requests/installation-report'
import LucideIcon from '@/components/LucideIcon.vue'
import { useCustomToast } from '@/composables/useCustomToast'
import { useRuntimeConfig } from 'nuxt/app'
// Remove the custom compression import - we'll use the existing compression function

// Apply auth middleware
definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore();

// Get installation ID from route params
const route = useRoute()
const installationId = route.params.id as string

// Schema validation
const schema = object({
  customer_id: string().required('Customer is required'),
  technician_id: string().required('Technician is required'),
  installation_type: string().optional(),
  status: string().optional(),
  on_air_date: string().optional(),
  trial_end_date: string().optional(),
  service_ready_date: string().optional(),
  installation_completed_at: string().optional(),
  notes: string().optional(),
  document_type: string().optional(),
  document_photo: string().optional(),
  latitude: number().optional(),
  longitude: number().optional(),
})

// Form state
const state = reactive({
  customer_id: "",
  technician_id: "",
  status: "pending",
  notes: "",
  document_type: "",
  document_photo: "",
  installation_type: "new_installation",
  on_air_date: "",
  trial_end_date: "",
  service_ready_date: "",
  installation_completed_at: "",
  is_terminal: "no", // Whether this is a terminal installation ('yes' or 'no')
  terminal_customer_installation_id: "", // Installation ID of the terminal installation (from customer_installations table)
  terminalInstallations: [] as any[], // List of terminal installations (from customer_installations where is_terminal = 'yes')
  // Installation location
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined,

  // Network Devices
  network_devices: [] as any[],

  // Customer Services
  customer_services: [] as any[],

  documentPreview: "",
  document_photo: "", // Path to existing document photo
  documentPhotoFile: null as File | null, // New file to upload

  // Images
  image_ids: [] as string[],
  previews: [] as string[],
  selectedImage: "",
  showModal: false,

  // Technician Photos
  technician_photos: [] as string[],
  technician_photo_ids: [] as string[], // Track image IDs from database
  technician_photos_notes: "",
  technician_photo_previews: [] as string[],
  selectedTechnicianImage: "",
  showTechnicianModal: false,
});

// Installation team data
const installationTeam = ref<any[]>([]);

const loading = ref(true);
const isSubmitting = ref(false);
const fileInput = ref<HTMLInputElement>();
const technicianPhotoInput = ref<HTMLInputElement>();

// Use the existing compression function from tickets page
async function compressImageFile(file: File, maxBytes: number): Promise<File> {
  try {
    // Skip compression for non-images
    if (!file.type.startsWith('image/')) return file
    // Already small enough
    if (file.size <= maxBytes) return file

    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    // Scale down if image is huge; keep aspect ratio
    const maxDim = 2000 // cap the longest side to limit memory
    let { width, height } = bitmap
    const ratio = Math.min(1, maxDim / Math.max(width, height))
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
    canvas.width = width
    canvas.height = height
    ctx.drawImage(bitmap, 0, 0, width, height)

    // Binary search quality to fit under maxBytes
    let low = 0.5, high = 0.92, bestBlob: Blob | null = null
    for (let i = 0; i < 6; i++) {
      const q = (low + high) / 2
      const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b || new Blob()), 'image/jpeg', q))
      if (blob.size > 0 && blob.size <= maxBytes) { bestBlob = blob; high = q } else { low = q }
    }
    const out = bestBlob || await new Promise<Blob>(res => canvas.toBlob(b => res(b || new Blob()), 'image/jpeg', 0.85))
    // If still larger, accept and let backend reject
    if (out.size >= file.size) return file
    return new File([out], file.name.replace(/\.(png|jpeg|jpg|webp)$/i, '.jpg'), { type: 'image/jpeg' })
  } catch {
    return file
  }
}

// File validation function (reused from tickets)
function validateFile(file: File): { isValid: boolean; message: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

  if (file.size > maxSize) {
    return { isValid: false, message: 'File size exceeds 10MB limit' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, message: 'File type not supported. Please use JPG, PNG, or GIF' };
  }

  return { isValid: true, message: 'File is valid' };
}

// File size formatting utility
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Technician photo tracking
const technicianPhotoSizes = ref<number[]>([]);
const isCompressing = ref(false);
// Options for dropdowns
const customerOptions = ref<any[]>([]);
const technicianOptions = ref<any[]>([]);
const assetOptions = ref<any[]>([]);
const terminalInstallationOptions = ref<any[]>([]);
const technicianPhotos = ref<any[]>([]); // Store photos from API

// Fetch technician photos using the same API as detail view
// Simplified fetchTechnicianPhotos: reload installation report to refresh technician photos
async function fetchTechnicianPhotos(installId: string) {
  try {
    console.log('[fetchTechnicianPhotos] Reloading installation report to refresh technician photos');
    await loadInstallationReport();
  } catch (error) {
    console.error('[fetchTechnicianPhotos] Error reloading installation report:', error);
    technicianPhotos.value = [];
  }
}

// Available asset items for MAC address selection
const availableAssetItems = ref<{ [assetId: string]: any[] }>({});

// PSB Request Date from selected customer
const selectedCustomerPSBDate = ref("");

// Computed properties
const totalTechnicianPhotoSize = computed(() => {
  return technicianPhotoSizes.value.reduce((total, size) => total + size, 0);
});

const installationTypeOptions = [
  { label: "New Installation", value: "new_installation" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Upgrade", value: "upgrade" },
  { label: "Downgrade", value: "downgrade" },
];

const statusOptions = [
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const documentTypeOptions = [
  { label: "KTP", value: "KTP" },
  { label: "SIM", value: "SIM" },
  { label: "Paspor", value: "Paspor" },
];

const userStatusOptions = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
  { label: "Suspended", value: "Suspended" },
  { label: "Pending", value: "Pending" },
];

const kepemilikanOptions = [
  { label: "Owned", value: "owned" },
  { label: "Leased", value: "leased" },
  { label: "Customer", value: "customer" },
];

const statusPerangkatOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Faulty", value: "faulty" },
];

const pingStatusOptions = [
  { label: "Up", value: "up" },
  { label: "Down", value: "down" },
  { label: "Unknown", value: "unknown" },
];



// Helper function to get full image URL
// Open Google Maps with coordinates
function openGoogleMaps(latitude: number, longitude: number) {
  const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
  window.open(url, '_blank');
}

function getFullImageUrl(imagePath: string): string {
  if (!imagePath) return '';

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Get the API host from environment
  const apiHost = useApiHost();

  // Normalize path separators (handle both / and \)
  let normalizedPath = imagePath.replace(/\\/g, '/');

  // Remove leading slash if present to avoid double slashes
  if (normalizedPath.startsWith('/')) {
    normalizedPath = normalizedPath.substring(1);
  }

  // If path already starts with uploads/, use it directly
  if (normalizedPath.startsWith('uploads/')) {
    return `${apiHost}/${normalizedPath}`;
  }

  // If it's just a filename (document photo), construct the full path
  if (!normalizedPath.includes('/')) {
    return `${apiHost}/uploads/installations/documents/${normalizedPath}`;
  }

  // If it's a relative path, prepend the API host
  return `${apiHost}/${normalizedPath}`;
}

// Load initial data
onMounted(async () => {
  await Promise.all([
    loadCustomers(),
    loadTechnicians(),
    loadAssets(),
    loadTerminalCustomers(),
    loadInstallationReport()
  ]);

  // Load technician photos separately with error handling
  try {
    console.log('[onMounted] Loading technician photos for installation:', installationId);
    await fetchTechnicianPhotos(installationId);
  } catch (error) {
    console.error('[onMounted] Failed to load technician photos:', error);
    // Don't break the page if photos fail to load
  }
});

async function loadInstallationReport() {
  try {
    const response = await customerAdminApi().getCompleteInstallationReport(installationId);
    const report = response.data;

    console.log('[loadInstallationReport] Full report data:', report);

    if (report) {
      // Populate form with existing data
      state.customer_id = report.customer_id || "";
      state.technician_id = report.technician_id || "";
      state.status = report.installation_status || report.status || "pending";
      state.notes = report.notes || report.installation_notes || "";
      state.document_type = report.document_type || "";
      state.document_photo = report.document_photo || "";
      state.installation_type = report.installation_type || "new_installation";
      state.on_air_date = report.on_air_date ? report.on_air_date.split('T')[0] : "";
      state.trial_end_date = report.trial_end_date ? report.trial_end_date.split('T')[0] : "";
      state.service_ready_date = report.service_ready_date ? report.service_ready_date.split('T')[0] : "";
      state.is_terminal = report.is_terminal || "no";
      state.terminal_customer_installation_id = report.terminal_customer_installation_id || "";
      state.latitude = report.latitude;
      state.longitude = report.longitude;

      // Handle installation_completed_at - handle various date formats
      if (report.installation_completed_at) {
        let dateStr = report.installation_completed_at;
        // Remove timezone indicators
        dateStr = dateStr.replace('Z', '').replace(/\+.*$/, '');
        // If it's a full datetime string, convert to datetime-local format (YYYY-MM-DDTHH:mm)
        if (dateStr.includes('T')) {
          // Truncate to datetime-local format (remove seconds/milliseconds if present)
          dateStr = dateStr.substring(0, 16);
        }
        state.installation_completed_at = dateStr;
        console.log('[loadInstallationReport] installation_completed_at:', {
          original: report.installation_completed_at,
          processed: state.installation_completed_at
        });
      } else {
        state.installation_completed_at = "";
      }

      // Installation Team - Load from installation_technicians relationship
      installationTeam.value = report.installation_technicians || [];

      // Network Devices - Load with proper asset item mapping
      const networkDevicesData = report.network_devices || [];
      state.network_devices = [];

      // Process each network device sequentially to load asset items
      for (let i = 0; i < networkDevicesData.length; i++) {
        const device = networkDevicesData[i];
        console.log('[loadInstallationReport] Processing network device:', device);

        // Get assets_id from device - handle GORM String type or direct string
        let assetsId = "";
        if (device.assets_id) {
          // Handle GORM String type (object with String property) or direct string
          if (typeof device.assets_id === 'object' && device.assets_id.String !== undefined) {
            assetsId = device.assets_id.String;
          } else if (typeof device.assets_id === 'string') {
            assetsId = device.assets_id;
          } else {
            assetsId = String(device.assets_id);
          }
        } else if (device.asset?.id) {
          assetsId = device.asset.id;
        } else if (device.assets?.id) {
          assetsId = device.assets.id;
        }

        console.log('[loadInstallationReport] Extracted assets_id:', assetsId);

        // Get asset_item_id if it exists in the device (from asset_item relationship)
        let assetItemId = "";
        if (device.asset_item_id) {
          // Handle GORM String type or direct string
          if (typeof device.asset_item_id === 'object' && device.asset_item_id.String !== undefined) {
            assetItemId = device.asset_item_id.String;
          } else if (typeof device.asset_item_id === 'string') {
            assetItemId = device.asset_item_id;
          } else {
            assetItemId = String(device.asset_item_id);
          }
        } else if (device.asset_item?.id) {
          assetItemId = device.asset_item.id;
        }

        console.log('[loadInstallationReport] Extracted asset_item_id:', assetItemId);

        // If assets_id exists, load asset items for this asset to populate dropdown
        if (assetsId) {
          try {
            // Load available asset items (status=in_stock)
            const assetItemsResponse = await assetItemAdminApi().getAvailableAssetItems(assetsId);
            const availableItems: any[] = [];

            if (assetItemsResponse.success && assetItemsResponse.data) {
              availableItems.push(...assetItemsResponse.data.map((item: any) => ({
                value: item.id,
                label: `${item.mac_address} (${item.status})`,
                id: item.id,
                mac_address: item.mac_address,
                status: item.status,
                asset_id: item.asset_id
              })));
            }

            // If asset_item_id exists, also load that specific item (even if it's in_use)
            // This ensures the currently assigned device appears in the dropdown
            if (assetItemId) {
              try {
                const assignedItemResponse = await assetItemAdminApi().getAssetItem(assetItemId);
                if (assignedItemResponse.success && assignedItemResponse.data) {
                  const assignedItem = assignedItemResponse.data;
                  // Check if this item belongs to the same asset
                  const assignedAssetId = assignedItem.asset_id || assignedItem.asset?.id || "";
                  if (assignedAssetId === assetsId) {
                    // Add to list if not already present
                    const exists = availableItems.find((item: any) => item.id === assetItemId);
                    if (!exists) {
                      availableItems.push({
                        value: assignedItem.id,
                        label: `${assignedItem.mac_address} (${assignedItem.status || 'in_use'})`,
                        id: assignedItem.id,
                        mac_address: assignedItem.mac_address,
                        status: assignedItem.status || 'in_use',
                        asset_id: assignedAssetId
                      });
                    }
                    // Set MAC address from assigned item
                    device.mac_address = assignedItem.mac_address || device.mac_address;
                  }
                }
              } catch (error) {
                console.error(`Failed to load assigned asset item ${assetItemId}:`, error);
              }
            } else if (device.mac_address) {
               // Try to find asset item by MAC address if we don't have the ID
               try {
                 // We fetch ALL items for this asset to find the one with the matching MAC
                 // This is necessary because we don't have the ID, and the item might be 'in_use'
                 const allItemsResponse = await assetItemAdminApi().getAssetItems({ asset_id: assetsId });
                 if (allItemsResponse.success && allItemsResponse.data) {
                   const foundItem = allItemsResponse.data.find((item: any) => 
                     item.mac_address && 
                     item.mac_address.toLowerCase() === device.mac_address.toLowerCase()
                   );
                   
                   if (foundItem) {
                     assetItemId = foundItem.id; // Update the ID so it binds correctly
                     console.log(`[loadInstallationReport] Found asset item by MAC ${device.mac_address}: ${assetItemId}`);
                     
                     // Add to list if not already present
                     const exists = availableItems.find((item: any) => item.id === foundItem.id);
                     if (!exists) {
                       availableItems.push({
                         value: foundItem.id,
                         label: `${foundItem.mac_address} (${foundItem.status || 'in_use'})`,
                         id: foundItem.id,
                         mac_address: foundItem.mac_address,
                         status: foundItem.status || 'in_use',
                         asset_id: assetsId
                       });
                     }
                   } else {
                     console.warn(`[loadInstallationReport] Could not find asset item for MAC ${device.mac_address}`);
                   }
                 }
               } catch (error) {
                 console.error(`Failed to find asset item by MAC ${device.mac_address}:`, error);
               }
            }

            // Store all items (both available and assigned)
            availableAssetItems.value[assetsId] = availableItems;

            console.log(`[loadInstallationReport] Loaded ${availableItems.length} asset items for asset ${assetsId}`, {
              available: assetItemsResponse.success ? assetItemsResponse.data?.length || 0 : 0,
              assigned: assetItemId ? 1 : 0
            });
          } catch (error) {
            console.error(`Failed to load asset items for asset ${assetsId}:`, error);
            availableAssetItems.value[assetsId] = [];
          }
        }

        // Add device to state
        state.network_devices.push({
          id: device.id,
          assets_id: assetsId,
          asset_item_id: assetItemId || "",
          switch_id: device.switch_id || "",
          port_number: device.port_number || "",
          remote_port: device.remote_port || "",
          eth_port: device.eth_port || "",
          mac_address: device.mac_address || "",
          ip_static: device.ip_static || "",
          kepemilikan_perangkat: device.kepemilikan_perangkat || "owned",
          status_perangkat: device.status_perangkat || "active",
          last_ping_status: device.last_ping_status || "unknown",
          product_id: device.product_id || "",
        });
      }

      // Customer Services
      state.customer_services = report.customer_services || [];


      // Images - filter out technician photos (they're handled separately)
      const installationImages = (report.images || []).filter((img: any) => {
        const path = (img.file || img.full_path || '').toLowerCase();
        return path && !path.includes('technician_photos');
      });

      state.image_ids = installationImages.map((img: any) => img.id).filter(Boolean);
      state.previews = installationImages.map((img: any) => getFullImageUrl(img.full_path || img.file));

      // Technician Photos - extract from images array (filter by technician_photos path)
      const technicianPhotosFromImages = (report.images || []).filter((img: any) => {
        const path = (img.file || img.full_path || '').toLowerCase();
        return path && path.includes('technician_photos');
      });

      console.log('[loadInstallationReport] Found technician photos in images:', technicianPhotosFromImages.length);

      if (technicianPhotosFromImages.length > 0) {
        // Store image IDs for potential deletion
        state.technician_photo_ids = technicianPhotosFromImages.map((img: any) => img.id);

        // Extract file paths from technician photo images
        state.technician_photos = technicianPhotosFromImages.map((img: any) => {
          const path = img.full_path || img.file || '';
          // Normalize path separators
          return path.replace(/\\/g, '/');
        });

        // Create previews with full URLs
        state.technician_photo_previews = state.technician_photos.map((photo: string) => getFullImageUrl(photo));

        console.log('[loadInstallationReport] Loaded technician photos:', {
          count: state.technician_photos.length,
          ids: state.technician_photo_ids,
          paths: state.technician_photos
        });
      } else {
        state.technician_photos = [];
        state.technician_photo_previews = [];
        state.technician_photo_ids = [];
        console.log('[loadInstallationReport] No technician photos found');
      }

      state.technician_photos_notes = report.technician_photos_notes || "";

      // Set PSB date if available
      if (report.tgl_permintaan_psb) {
        selectedCustomerPSBDate.value = report.tgl_permintaan_psb.split('T')[0];
      }
    }
  } catch (error) {
    console.error("Failed to load installation report:", error);
    useCustomToast().add({
      title: "Error",
      description: "Failed to load installation report",
      color: "red",
    });
  } finally {
    loading.value = false;
  }
}

async function loadCustomers() {
  try {
    const response = await customerAdminApi().getAllCustomers();
    customerOptions.value = response.data || [];
  } catch (error) {
    console.error("Failed to load customers:", error);
  }
}

async function loadTechnicians() {
  try {
    const response = await userManagementAdminApi().getAllUsers({});
    technicianOptions.value = (response.data || []).filter((user: any) =>
      user.role?.name === 'TECHNICIAN'
    );
  } catch (error) {
    console.error("Failed to load technicians:", error);
  }
}

async function loadAssets() {
  try {
    const response = await assetAdminApi().getAllAssets();
    if (response.success) {
      assetOptions.value = response.data.map((asset: any) => ({
        id: asset.id,
        name: `${asset.brand} ${asset.model} (${asset.serial_number})`,
        brand: asset.brand,
        model: asset.model,
        type: asset.type || "",
        serial_number: asset.serial_number
      }));
      console.log('[loadAssets] Loaded assets:', assetOptions.value.length);
    }
  } catch (error) {
    console.error("Failed to load assets:", error);
  }
}

async function loadTerminalCustomers() {
  console.log('[loadTerminalCustomers] Loading terminal installations...');
  try {
    // Use the API endpoint to get terminal installations
    const api = useApiHost();
    const url = `${api}/api/admin/customer-installation?is_terminal=yes`;
    console.log('[loadTerminalCustomers] Fetching from URL:', url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${useCookie("token").value}`,
      },
    });

    console.log('[loadTerminalCustomers] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[loadTerminalCustomers] Response error:', errorText);
      throw new Error(`Failed to fetch terminal installations: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[loadTerminalCustomers] Raw API response:', data);

    // Handle both response formats: {success: true, data: [...]} or direct array
    const installations = data.success ? (data.data || []) : (data.data || data || []);
    console.log('[loadTerminalCustomers] Extracted installations:', installations.length, installations);

    if (installations && installations.length > 0) {
      // Backend should already filter by is_terminal=yes, but double-check for safety and skip soft-deleted
      const terminalInstallations = installations.filter((inst: any) => {
        // Soft delete check
        const deletedAt = inst.deleted_at ?? inst.deletedAt;
        let isDeleted = false;

        if (deletedAt) {
          if (typeof deletedAt === 'string') {
            const lower = deletedAt.trim().toLowerCase();
            isDeleted = lower !== '' && lower !== 'null' && lower !== '0000-00-00 00:00:00';
          } else if (typeof deletedAt === 'object') {
            isDeleted = deletedAt.Valid === true;
          } else {
            isDeleted = true;
          }
        }

        if (isDeleted) return false;

        const isTerminal = inst.is_terminal === 'yes' || inst.is_terminal === 'Yes' || inst.is_terminal === true;
        console.log('[loadTerminalCustomers] Installation:', inst.id, 'is_terminal:', inst.is_terminal, 'matches:', isTerminal, 'isDeleted:', isDeleted);
        return isTerminal;
      });

      console.log('[loadTerminalCustomers] Terminal installations after filter:', terminalInstallations.length);

      // Map installations to options with installation ID as value and customer info as display
      terminalInstallationOptions.value = terminalInstallations.map((inst: any) => {
        // Get customer name from relationship or customer_id
        let customerName = 'Unknown Customer';
        let customerPhone = '';

        if (inst.customer && inst.customer.name) {
          customerName = inst.customer.name;
          customerPhone = inst.customer.phone || '';
        } else if (inst.Customer && inst.Customer.name) {
          customerName = inst.Customer.name;
          customerPhone = inst.Customer.phone || '';
        }

        // Format installation date if available
        const installDate = inst.installation_completed_at || inst.createdAt || '';
        const dateStr = installDate ? new Date(installDate).toLocaleDateString() : '';

        // Create display string: "Customer Name - Installation ID (Date)"
        const display = `${customerName} - ${inst.id.substring(0, 8)}${dateStr ? ' (' + dateStr + ')' : ''}`;

        console.log('[loadTerminalCustomers] Mapped installation:', {
          id: inst.id,
          customer_name: customerName,
          display: display
        });

        return {
          id: inst.id, // Installation ID as value
          installation_id: inst.id,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_id: inst.customer_id || inst.CustomerID,
          display: display
        };
      });

      console.log('[loadTerminalCustomers] Terminal installations loaded:', terminalInstallationOptions.value.length, terminalInstallationOptions.value);
    } else {
      console.warn('[loadTerminalCustomers] No installations returned from API');
      terminalInstallationOptions.value = [];
    }
  } catch (error) {
    console.error('[loadTerminalCustomers] Failed to load terminal installations:', error);
    terminalInstallationOptions.value = [];
  }
}



// Helper function to get asset display name (brand + model + type)
function getAssetDisplayName(assetId: string): string {
  if (!assetId) return "";
  const asset = assetOptions.value.find((a: any) => a.id === assetId);
  if (!asset) return "";

  // Try to get brand, model, type from asset object
  const brand = asset.brand || "";
  const model = asset.model || "";
  const type = asset.type || "";

  // Construct display name: "Brand Model Type" or "Brand Model" if type not available
  if (brand && model && type) {
    return `${brand} ${model} ${type}`;
  } else if (brand && model) {
    return `${brand} ${model}`;
  } else if (asset.name) {
    return asset.name;
  }
  return "";
}

// Load available asset items when an asset is selected
async function onAssetChange(assetId: string, deviceIndex: number) {
  // Always clear the MAC address selection when asset changes (unless there's an existing assignment)
  const currentDevice = deviceIndex >= 0 && deviceIndex < state.network_devices.length
    ? state.network_devices[deviceIndex]
    : null;

  // Don't clear if we're just reloading (user might have selected a different asset type)
  if (currentDevice && currentDevice.assets_id !== assetId) {
    currentDevice.mac_address = "";
    currentDevice.asset_item_id = "";
  }

  if (!assetId) {
    availableAssetItems.value[assetId] = [];
    return;
  }

  try {
    // Load available asset items (status=in_stock)
    const response = await assetItemAdminApi().getAvailableAssetItems(assetId);
    const availableItems: any[] = [];

    if (response.success && response.data) {
      availableItems.push(...response.data.map((item: any) => ({
        value: item.id,
        label: `${item.mac_address} (${item.status})`,
        id: item.id,
        mac_address: item.mac_address,
        status: item.status,
        asset_id: item.asset_id
      })));
    }

    // If there's a currently assigned asset_item_id, also load it (even if in_use)
    if (currentDevice && currentDevice.asset_item_id) {
      try {
        const assignedItemResponse = await assetItemAdminApi().getAssetItem(currentDevice.asset_item_id);
        if (assignedItemResponse.success && assignedItemResponse.data) {
          const assignedItem = assignedItemResponse.data;
          const assignedAssetId = assignedItem.asset_id || assignedItem.asset?.id || "";
          // Only add if it belongs to the selected asset
          if (assignedAssetId === assetId) {
            const exists = availableItems.find((item: any) => item.id === currentDevice.asset_item_id);
            if (!exists) {
              availableItems.push({
                value: assignedItem.id,
                label: `${assignedItem.mac_address} (${assignedItem.status || 'in_use'})`,
                id: assignedItem.id,
                mac_address: assignedItem.mac_address,
                status: assignedItem.status || 'in_use',
                asset_id: assignedAssetId
              });
            }
          }
        }
      } catch (error) {
        console.error(`Failed to load assigned asset item:`, error);
      }
    }

    availableAssetItems.value[assetId] = availableItems;

    console.log(`[onAssetChange] Loaded ${availableItems.length} asset items for asset ${assetId}`, {
      available: response.success ? response.data?.length || 0 : 0,
      assigned: currentDevice?.asset_item_id ? 1 : 0
    });

    if (availableItems.length === 0) {
      console.warn(`[onAssetChange] No asset items found for asset ${assetId}. This could mean:
        1. No asset items have been created for this asset type
        2. All asset items are in use (status=in_use) and none are in_stock
        3. The asset_id might be incorrect`);
    }
  } catch (error) {
    console.error("Failed to load available asset items:", error);
    availableAssetItems.value[assetId] = [];
    useCustomToast().add({
      title: "Error",
      description: "Failed to load available MAC addresses",
      color: "red",
    });
  }
}

// Handle MAC address selection
function onMacAddressChange(assetItemId: string, deviceIndex: number) {
  const device = state.network_devices[deviceIndex];
  if (!device) return;

  if (!assetItemId) {
    device.asset_item_id = "";
    device.mac_address = "";
    return;
  }

  const assetId = device.assets_id;
  if (!assetId) return;

  const options = availableAssetItems.value[assetId] || [];

  // Find the selected item by value or id
  const selected = options.find(
    (item: any) => item.value === assetItemId || item.id === assetItemId
  );

  if (selected) {
    device.asset_item_id = selected.id;
    device.mac_address = selected.mac_address;
    console.log(`[onMacAddressChange] Updated device ${deviceIndex} MAC to ${selected.mac_address}`);
  } else {
    console.warn("[onMacAddressChange] Selected asset item not found", {
      assetId,
      assetItemId,
      optionsCount: options.length
    });
    device.mac_address = "";
  }
}

// Helper to sync MAC address from asset item ID (useful for initial load or manual sync)
function syncMacFromAssetItem(deviceIndex: number) {
  const device = state.network_devices[deviceIndex];
  if (!device || !device.assets_id || !device.asset_item_id) return;

  const options = availableAssetItems.value[device.assets_id] || [];
  const selected = options.find(
    (item: any) =>
      item.id === device.asset_item_id || item.value === device.asset_item_id
  );

  if (selected) {
    device.mac_address = selected.mac_address;
  }
}

// Handle customer selection change
function onCustomerChange() {
  if (state.customer_id) {
    const selectedCustomer = customerOptions.value.find((customer: any) => customer.id === state.customer_id);
    if (selectedCustomer && selectedCustomer.service_request_date) {
      selectedCustomerPSBDate.value = selectedCustomer.service_request_date;
    } else {
      selectedCustomerPSBDate.value = "";
    }
  } else {
    selectedCustomerPSBDate.value = "";
  }
}

// Network Device methods
function addNetworkDevice() {
  state.network_devices.push({
    assets_id: "",
    asset_item_id: "", // Track the specific asset item selected
    router_brand: "",
    router_type: "",
    switch_id: "",
    port_number: "",
    remote_port: "",
    eth_port: "",
    mac_address: "",
    ip_static: "",
    kepemilikan_perangkat: "owned",
    status_perangkat: "active",
    last_ping_status: "unknown",
    product_id: "",
  });
}

function removeNetworkDevice(index: number) {
  state.network_devices.splice(index, 1);
}

// Customer Service methods
function addCustomerService() {
  state.customer_services.push({
    device_id: "",
    cable_type: "",
    cable_length: 0,
    end_port_type: "",
    user_login: "",
    password: "",
    user_status: "Active",
    installation_notes: "",
    installation_team_phone: "",
    installation_team_name: "",
    service_activation_date: "",
  });
}

function removeCustomerService(index: number) {
  state.customer_services.splice(index, 1);
}

// Cable methods




// File upload methods
function triggerFileUpload() {
  fileInput.value?.click();
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files;

  if (!files) return;

  for (const file of Array.from(files)) {
    if (file.type.startsWith("image/")) {
      try {
        const response = await uploadFileAdminApi().createUploadFile({
          name: `installation_${Date.now()}_${file.name}`,
          path: `installations/${state.technician_id}/${state.customer_id}`,
          file: file,
          archive_installation_id: installationId, // Pass installation ID for edit mode
        });

        if (response.data?.id) {
          state.image_ids.push(response.data.id);
          state.previews.push(response.data.full_path || response.data.file);
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  }

  // Reset input
  input.value = "";
}

async function handleDocumentPhotoUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (file && file.type.startsWith("image/")) {
    try {
      // Use a more generic path if customer/technician not selected yet
      const path = state.customer_id && state.technician_id
        ? `documents/${state.technician_id}/${state.customer_id}`
        : `documents/temp/${Date.now()}`;

      console.log("Uploading document photo with path:", path);
      // Prevent the input from being cleared
      if (input && file) {
        console.log('Preserving file input value');
      }

      if (!file) {
        console.log('❌ No file selected');
        state.document_photo = null;
        state.documentPreview = '';
        // Don't clear the input value - this might be causing the issue
        return;
      }

      // Prevent the input from being cleared
      if (input && file) {
        console.log('Preserving file input value');
      }

      console.log('✅ File selected:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // First, create preview directly from the file to test
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        state.documentPreview = result;
        console.log('✅ Document preview created successfully (direct):', {
          previewLength: result?.length || 0,
          previewType: typeof result,
          previewStart: result?.substring(0, 50) + '...'
        });
      };
      reader.onerror = (e) => {
        console.error('❌ FileReader error:', e);
        state.documentPreview = '';
      };
      reader.readAsDataURL(file);

      const response = await uploadFileAdminApi().createUploadFile({
        name: `document_${Date.now()}`,
        path: path,
        file: file,
      });

      console.log("Document photo upload response:", response);

      if (response.data?.file) {
        // Store only the filename, not the full path
        state.document_photo = response.data.file;
        console.log("Document photo filename set to:", state.document_photo);

        useCustomToast().add({
          title: "Success",
          description: "Document photo uploaded successfully",
          color: "green",
        });
      } else {
        console.error("No full_path in response:", response);
        useCustomToast().add({
          title: "Error",
          description: "Failed to upload document photo",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Error uploading document photo:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      useCustomToast().add({
        title: "Error",
        description: "Failed to upload document photo: " + errorMessage,
        color: "red",
      });
    }
  } else {
    useCustomToast().add({
      title: "Error",
      description: "Please select a valid image file",
      color: "red",
    });
  }
}

function removeImage(index: number) {
  state.previews.splice(index, 1);
  state.image_ids.splice(index, 1);
}

// Technician photo functions
function triggerTechnicianPhotoUpload() {
  technicianPhotoInput.value?.click();
}

async function handleTechnicianPhotoUpload(event: Event) {
  console.log('[TechnicianPhotos] Starting photo upload process');

  const input = event.target as HTMLInputElement;
  const files = input.files;

  if (!files) {
    console.log('[TechnicianPhotos] No files selected');
    return;
  }

  console.log('[TechnicianPhotos] Files selected:', {
    count: files.length,
    files: Array.from(files).map(f => ({ name: f.name, size: f.size, type: f.type }))
  });

  // Check if adding these files would exceed the limit
  const currentCount = state.technician_photo_previews.length;
  const newFilesCount = files.length;

  console.log('[TechnicianPhotos] Photo count check:', {
    currentCount,
    newFilesCount,
    total: currentCount + newFilesCount,
    limit: 10
  });

  if (currentCount + newFilesCount > 10) {
    console.log('[TechnicianPhotos] ERROR: Photo limit exceeded');
    useCustomToast().add({
      title: "Error",
      description: `Maximum 10 photos allowed. You currently have ${currentCount} photos and are trying to add ${newFilesCount} more.`,
      color: "red",
    });
    return;
  }

  console.log('[TechnicianPhotos] Starting compression process');
  isCompressing.value = true;

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`[TechnicianPhotos] Processing file ${i + 1}/${files.length}:`, {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        console.log(`[TechnicianPhotos] Validation failed for ${file.name}:`, validation.message);
        useCustomToast().add({
          title: "Error",
          description: validation.message,
          color: "red",
        });
        continue;
      }

      console.log(`[TechnicianPhotos] Validation passed for ${file.name}, starting compression`);

      // Compress image using existing compression function (2MB limit)
      const originalSize = file.size;
      const compressedFile = await compressImageFile(file, 2 * 1024 * 1024);
      const compressedSize = compressedFile.size;
      const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

      console.log(`[TechnicianPhotos] Compression completed for ${file.name}:`, {
        originalSize,
        compressedSize,
        compressionRatio: compressionRatio.toFixed(1) + '%'
      });

      // Upload compressed image
      const fileName = `technician_photo_${Date.now()}_${file.name}`;
      const uploadPath = `installations/technician_photos/${state.technician_id}/${state.customer_id}`;

      console.log(`[TechnicianPhotos] Uploading ${file.name} to:`, {
        fileName,
        uploadPath,
        technicianId: state.technician_id,
        customerId: state.customer_id
      });

      const response = await uploadFileAdminApi().createUploadFile({
        name: fileName,
        path: uploadPath,
        file: compressedFile,
        archive_installation_id: installationId,
      });

      console.log(`[TechnicianPhotos] Upload response for ${file.name}:`, response);

      if (response.data?.id) {
        const photoPath = response.data.full_path || response.data.file;
        console.log(`[TechnicianPhotos] Upload successful for ${file.name}:`, {
          fileId: response.data.id,
          photoPath: response.data.full_path || response.data.file,
          fullResponse: response.data
        });

        // Create preview for the compressed file
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          state.technician_photo_previews.push(dataUrl);
        };
        reader.readAsDataURL(compressedFile);

        state.technician_photos.push(photoPath);
        technicianPhotoSizes.value.push(compressedSize);

        console.log(`[TechnicianPhotos] State updated:`, {
          photosCount: state.technician_photos.length,
          previewsCount: state.technician_photo_previews.length,
          sizesCount: technicianPhotoSizes.value.length
        });

        useCustomToast().add({
          title: "Success",
          description: `Photo uploaded successfully. Compressed from ${formatFileSize(originalSize)} to ${formatFileSize(compressedSize)} (${compressionRatio.toFixed(1)}% reduction)`,
          color: "green",
        });
      } else {
        console.log(`[TechnicianPhotos] ERROR: Upload failed for ${file.name}:`, response);
      }
    }
  } catch (error) {
    console.error("Error uploading technician photos:", error);
    useCustomToast().add({
      title: "Error",
      description: "Failed to upload technician photos",
      color: "red",
    });
  } finally {
    isCompressing.value = false;
    // Reset input
    input.value = "";

    // Reload technician photos from database using dedicated API
    console.log('[TechnicianPhotos] Reloading photos from database');
    await fetchTechnicianPhotos(installationId);
  }
}

function removeTechnicianPhoto(index: number) {
  state.technician_photos.splice(index, 1);
  state.technician_photo_previews.splice(index, 1);
  technicianPhotoSizes.value.splice(index, 1);
}

// Form submission
type Schema = typeof schema;

async function onSubmit(event: FormSubmitEvent<Schema>) {
  console.log('[FormSubmission] Starting form submission');
  isSubmitting.value = true;

  try {
    // Avoid FK constraint errors: drop empty device_id before sending
    const validDeviceIds = new Set(
      state.network_devices
        .map((device: any) => device.id)
        .filter((id: string | undefined) => !!id)
    );

    const sanitizedCustomerServices = state.customer_services.map((service) => {
      const copy = { ...service };
      if (!copy.device_id || (copy.device_id && !validDeviceIds.has(copy.device_id))) {
        delete copy.device_id;
      }
      return copy;
    });

    const submitData: UpdateCompleteInstallationReportRequest = {
      customer_id: state.customer_id,
      technician_id: state.technician_id,
      status: state.status,
      notes: state.notes,
      document_type: state.document_type,
      document_photo: state.document_photo,
      installation_type: state.installation_type,
      on_air_date: state.on_air_date,
      trial_end_date: state.trial_end_date,
      service_ready_date: state.service_ready_date,
      installation_completed_at: state.installation_completed_at,
      is_terminal: state.is_terminal,
      terminal_customer_installation_id: state.terminal_customer_installation_id || undefined,
      latitude: state.latitude,
      longitude: state.longitude,
      network_devices: state.network_devices,
      customer_services: sanitizedCustomerServices,
      image_ids: state.image_ids,
      technician_photos: state.technician_photos,
      technician_photos_notes: state.technician_photos_notes,
    };

    console.log('[FormSubmission] Submit data prepared:', {
      customer_id: submitData.customer_id,
      technician_id: submitData.technician_id,
      technician_photos_count: submitData.technician_photos?.length || 0,
      technician_photos: submitData.technician_photos,
      technician_photos_notes: submitData.technician_photos_notes,
      network_devices_count: submitData.network_devices?.length || 0,
      customer_services_count: submitData.customer_services?.length || 0,
      image_ids_count: submitData.image_ids?.length || 0
    });

    console.log('[FormSubmission] Full submit data:', submitData);

    console.log('[FormSubmission] Calling API to update installation report');
    const response = await customerAdminApi().updateCompleteInstallationReport(installationId, submitData);
    console.log('[FormSubmission] API response received:', response);

    if (response.success) {
      console.log('[FormSubmission] Update successful');
      useCustomToast().add({
        title: "Success",
        description: "Installation report updated successfully",
        color: "green",
      });

      console.log('[FormSubmission] Navigating to reports page');
      await navigateTo('/dashboard/report/customer-installation/reports');
    } else {
      console.log('[FormSubmission] API returned success=false:', response);
      useCustomToast().add({
        title: "Error",
        description: response.message || "Failed to update installation report",
        color: "red",
      });
    }

  } catch (error: any) {
    console.error('[FormSubmission] ERROR: Failed to update installation report:', error);
    console.error('[FormSubmission] Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    useCustomToast().add({
      title: "Error",
      description: error.message || "Failed to update installation report",
      color: "red",
    });
  } finally {
    console.log('[FormSubmission] Form submission completed');
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
/* Custom input styles */
:deep(.custom-input) {
  @apply bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:ring-emerald-500;
}

:deep(.custom-input input) {
  @apply bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:ring-emerald-500;
}

:deep(.custom-select) {
  @apply bg-white border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500;
}

:deep(.custom-select select) {
  @apply bg-white border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500;
}

:deep(.custom-select .usm-container) {
  @apply bg-white border-gray-300 text-gray-900;
}

:deep(.custom-select .usm-menu) {
  @apply bg-white border-gray-300 text-gray-900;
}

/* Force white background for terminal customer select - comprehensive styling */
.terminal-customer-wrapper {
  background-color: white !important;
}

:deep(.terminal-customer-wrapper) {
  background-color: white !important;
}

:deep(.terminal-customer-wrapper *) {
  background-color: white !important;
  color: #111827 !important;
}

:deep(.terminal-customer-select) {
  background-color: white !important;
  color: #111827 !important;
}

:deep(.terminal-customer-select *) {
  background-color: white !important;
  color: #111827 !important;
}

:deep(.terminal-customer-select .usm-container) {
  background-color: white !important;
  border-color: #d1d5db !important;
  color: #111827 !important;
}

:deep(.terminal-customer-select .usm-menu) {
  background-color: white !important;
  border-color: #d1d5db !important;
  color: #111827 !important;
}

:deep(.terminal-customer-select input) {
  background-color: white !important;
  color: #111827 !important;
  border-color: #d1d5db !important;
}

:deep(.terminal-customer-select button) {
  background-color: white !important;
  color: #111827 !important;
  border-color: #d1d5db !important;
}

:deep(.terminal-customer-select [role="button"]) {
  background-color: white !important;
  color: #111827 !important;
  border-color: #d1d5db !important;
}

:deep(.terminal-customer-select [role="option"]) {
  background-color: white !important;
  color: #111827 !important;
}

:deep(.terminal-customer-select [role="option"]:hover) {
  background-color: #f3f4f6 !important;
  color: #111827 !important;
}

:deep(.terminal-customer-select ul) {
  background-color: white !important;
  color: #111827 !important;
}

:deep(.terminal-customer-select li) {
  background-color: white !important;
  color: #111827 !important;
}

:deep(.terminal-customer-select li:hover) {
  background-color: #f3f4f6 !important;
  color: #111827 !important;
}

:deep(.terminal-customer-select div) {
  background-color: white !important;
  color: #111827 !important;
}

:deep(.terminal-customer-select span) {
  color: #111827 !important;
}

:deep(.terminal-customer-select p) {
  color: #111827 !important;
}

/* Target dropdown menu specifically */
:deep(.terminal-customer-wrapper [role="listbox"]) {
  background-color: white !important;
  color: #111827 !important;
  border-color: #d1d5db !important;
}

:deep(.terminal-customer-wrapper [role="listbox"] [role="option"]) {
  background-color: white !important;
  color: #111827 !important;
}

:deep(.terminal-customer-wrapper [role="listbox"] [role="option"]:hover) {
  background-color: #f3f4f6 !important;
  color: #111827 !important;
}

/* Override any dark mode classes */
:deep(.terminal-customer-wrapper .dark) {
  background-color: white !important;
  color: #111827 !important;
}

:deep(.terminal-customer-select .dark) {
  background-color: white !important;
  color: #111827 !important;
}

:deep(.custom-textarea) {
  @apply bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:ring-emerald-500;
}

:deep(.custom-textarea textarea) {
  @apply bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:ring-emerald-500;
}

/* Form group label styling */
:deep(.u-form-group label) {
  @apply text-black font-semibold text-sm mb-2;
}

/* Ensure all form labels are black and clear */
:deep(label) {
  @apply text-black font-semibold;
}

/* Specific styling for form group labels */
:deep(.u-form-group .label) {
  @apply text-black font-semibold;
}

/* Make sure all text above inputs is black */
:deep([class*="form-group"] label),
:deep([class*="form-group"] .label) {
  @apply text-black font-semibold;
}

/* Force all labels to be black with important */
:deep(.u-form-group label),
:deep(.u-form-group .label),
:deep(label),
:deep(.label) {
  color: #000000 !important;
  font-weight: 600 !important;
}

/* Button hover effects */
:deep(.u-button) {
  @apply transition-all duration-200;
}

/* Card hover effects */
.hover-card {
  @apply transition-all duration-200 hover:shadow-lg hover:-translate-y-1;
}

/* Gradient text */
.gradient-text {
  background: linear-gradient(135deg, #10b981, #059669);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Custom scrollbar */
:deep(.scrollbar-thin) {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;
}

:deep(.scrollbar-thin::-webkit-scrollbar) {
  width: 6px;
}

:deep(.scrollbar-thin::-webkit-scrollbar-track) {
  background: #f3f4f6;
  border-radius: 3px;
}

:deep(.scrollbar-thin::-webkit-scrollbar-thumb) {
  background: #d1d5db;
  border-radius: 3px;
}

:deep(.scrollbar-thin::-webkit-scrollbar-thumb:hover) {
  background: #9ca3af;
}
</style>
