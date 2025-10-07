<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
    <div class="container mx-auto p-4 sm:p-6">
      <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <!-- Header Section -->
        <div class="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 sm:px-8 py-4 sm:py-6">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div class="flex items-center space-x-3 sm:space-x-4">
              <div class="bg-white/20 p-2 sm:p-3 rounded-xl">
                <UIcon name="i-heroicons-wrench-screwdriver" class="text-white text-xl sm:text-2xl" />
              </div>
              <div>
                <h1 class="text-lg sm:text-2xl font-bold text-white">Edit Installation Report</h1>
                <p class="text-emerald-100 text-xs sm:text-sm mt-1">Update installation details and configuration</p>
              </div>
            </div>
            <UButton @click="$router.back()" variant="outline" color="white" 
                     class="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto">
              <UIcon name="i-heroicons-arrow-left" class="mr-2" />
              Back
            </UButton>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center py-12 sm:py-16">
          <div class="text-center">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-3xl sm:text-4xl text-emerald-500 mb-4" />
            <p class="text-gray-600 text-sm sm:text-base">Loading installation report...</p>
          </div>
        </div>

        <!-- Form Content -->
        <UForm v-else :schema="schema" :state="state" @submit="onSubmit" class="p-4 sm:p-8 space-y-6 sm:space-y-8">
          <!-- Basic Installation Information -->
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl border border-blue-100">
            <div class="flex items-center mb-4 sm:mb-6">
              <div class="bg-blue-500 p-2 rounded-lg mr-2 sm:mr-3">
                <UIcon name="i-heroicons-information-circle" class="text-white text-sm sm:text-lg" />
              </div>
              <h2 class="text-lg sm:text-xl font-bold text-gray-800">Basic Installation Information</h2>
            </div>
          
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <UFormGroup label="Customer" name="customer_id" required>
                <USelect
                  v-model="state.customer_id"
                  :options="customerOptions"
                  option-attribute="name"
                  value-attribute="id"
                  placeholder="Select Customer"
                  @change="onCustomerChange"
                  class="custom-select"
                />
              </UFormGroup>

              <UFormGroup label="Tgl. Permintaan PSB" name="tgl_permintaan_psb">
                <UInput
                  v-model="selectedCustomerPSBDate"
                  type="date"
                  readonly
                  placeholder="Select customer first"
                  class="bg-gray-50 border-gray-200"
                />
              </UFormGroup>

              <UFormGroup label="Technician" name="technician_id" required>
                <USelect
                  v-model="state.technician_id"
                  :options="technicianOptions"
                  option-attribute="name"
                  value-attribute="id"
                  placeholder="Select Technician"
                  class="custom-select"
                />
              </UFormGroup>

              <UFormGroup label="Installation Type" name="installation_type">
                <USelect
                  v-model="state.installation_type"
                  :options="installationTypeOptions"
                  placeholder="Select Installation Type"
                  class="custom-select"
                />
              </UFormGroup>

              <UFormGroup label="Status" name="status">
                <USelect
                  v-model="state.status"
                  :options="statusOptions"
                  placeholder="Select Status"
                  class="custom-select"
                />
              </UFormGroup>

              <UFormGroup label="Tgl. On Air" name="on_air_date">
                <UInput
                  v-model="state.on_air_date"
                  type="date"
                  placeholder="Select On Air Date"
                  class="custom-input"
                />
              </UFormGroup>

              <UFormGroup label="Tgl. Batas Percobaan" name="trial_end_date">
                <UInput
                  v-model="state.trial_end_date"
                  type="date"
                  placeholder="Select Trial End Date"
                  class="custom-input"
                />
              </UFormGroup>

              <UFormGroup label="Tgl. Siap Layanan" name="service_ready_date">
                <UInput
                  v-model="state.service_ready_date"
                  type="date"
                  placeholder="Select Service Ready Date"
                  class="custom-input"
                />
              </UFormGroup>

              <UFormGroup label="Installation Completed At" name="installation_completed_at">
                <UInput
                  v-model="state.installation_completed_at"
                  type="datetime-local"
                  placeholder="Select Completion Date"
                  class="custom-input"
                />
              </UFormGroup>
            </div>

            <UFormGroup label="Notes" name="notes" class="mt-6">
              <UTextarea
                v-model="state.notes"
                placeholder="Enter installation notes..."
                :rows="4"
                class="custom-textarea"
              />
            </UFormGroup>
          </div>

          <!-- Installation Team Information -->
          <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
            <div class="flex items-center mb-6">
              <div class="bg-purple-500 p-2 rounded-lg mr-3">
                <UIcon name="i-heroicons-users" class="text-white text-lg" />
              </div>
              <h2 class="text-xl font-bold text-gray-800">Installation Team Information</h2>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UFormGroup label="Nama Anggota Tim Install" name="installation_team_name">
                <UInput
                  v-model="state.installation_team_name"
                  placeholder="Enter installation team member name"
                  class="custom-input"
                />
              </UFormGroup>

              <UFormGroup label="No.HP Tim Install" name="installation_team_phone">
                <UInput
                  v-model="state.installation_team_phone"
                  placeholder="Enter installation team phone number"
                  class="custom-input"
                />
              </UFormGroup>
            </div>
          </div>

          <!-- Document Information -->
          <div class="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-100">
            <div class="flex items-center mb-6">
              <div class="bg-orange-500 p-2 rounded-lg mr-3">
                <UIcon name="i-heroicons-document-text" class="text-white text-lg" />
              </div>
              <h2 class="text-xl font-bold text-gray-800">Document Information</h2>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UFormGroup label="Tipe Dokumen" name="document_type">
                <USelect
                  v-model="state.document_type"
                  :options="documentTypeOptions"
                  placeholder="Select Document Type"
                  class="custom-select"
                />
              </UFormGroup>

              <UFormGroup label="Foto Dokumen" name="document_photo">
                <div v-if="state.document_photo" class="mb-4">
                  <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <img :src="state.document_photo" alt="Current document" class="w-32 h-32 object-cover rounded-lg border" />
                    <p class="text-sm text-gray-600 mt-2 font-medium">Current document photo</p>
                  </div>
                </div>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-400 transition-colors">
                  <UInput
                    type="file"
                    accept="image/*"
                    @change="handleDocumentPhotoUpload"
                    placeholder="Upload new document photo"
                    class="custom-input"
                  />
                  <p class="text-sm text-gray-500 mt-2">Click to upload new document photo</p>
                </div>
              </UFormGroup>
            </div>
          </div>

          <!-- Network Device Configuration -->
          <div class="bg-gradient-to-r from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-100">
            <div class="flex items-center mb-6">
              <div class="bg-cyan-500 p-2 rounded-lg mr-3">
                <UIcon name="i-heroicons-cpu-chip" class="text-white text-lg" />
              </div>
              <h2 class="text-xl font-bold text-gray-800">Network Device Configuration</h2>
            </div>
            
            <div class="mb-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-700">Network Devices</h3>
                <UButton @click="addNetworkDevice" size="sm" color="cyan" class="shadow-md">
                  <UIcon name="i-heroicons-plus" class="mr-1" />
                  Add Device
                </UButton>
              </div>
            
              <div v-for="(device, index) in state.network_devices" :key="index" class="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
                <div class="flex justify-between items-center mb-4">
                  <h4 class="text-lg font-semibold text-gray-700 flex items-center">
                    <UIcon name="i-heroicons-cpu-chip" class="mr-2 text-cyan-500" />
                    Network Device {{ index + 1 }}
                  </h4>
                  <UButton @click="removeNetworkDevice(index)" size="sm" color="red" variant="outline" class="hover:bg-red-50">
                    <UIcon name="i-heroicons-trash" />
                  </UButton>
                </div>
              
                <!-- Router Information -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <USelect
                    v-model="device.assets_id"
                    :options="assetOptions"
                    option-attribute="name"
                    value-attribute="id"
                    placeholder="Select Router Asset"
                    class="custom-select"
                    @change="onAssetChange(device.assets_id, index)"
                  />
                  <UInput
                    v-model="device.router_brand"
                    placeholder="Router Brand"
                    class="custom-input"
                  />
                  <UInput
                    v-model="device.router_type"
                    placeholder="Type/Series"
                    class="custom-input"
                  />
                </div>
                
                <!-- Network Configuration -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <UInput
                    v-model="device.switch_id"
                    placeholder="Switch ID"
                    class="custom-input"
                  />
                  <UInput
                    v-model="device.port_number"
                    placeholder="Port Number"
                    class="custom-input"
                  />
                  <UInput
                    v-model="device.remote_port"
                    placeholder="RemotePort"
                    class="custom-input"
                  />
                  <UInput
                    v-model="device.eth_port"
                    placeholder="EthPort"
                    class="custom-input"
                  />
                </div>
                
                <!-- Device Information -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <USelect
                      v-model="device.asset_item_id"
                      :options="availableAssetItems[device.assets_id] || []"
                      :placeholder="!device.assets_id ? 'Select an asset first' : 'Select MAC Address'"
                      :disabled="!device.assets_id || (availableAssetItems[device.assets_id] && availableAssetItems[device.assets_id].length === 0)"
                      @change="onMacAddressChange(device.asset_item_id, index)"
                      class="custom-select"
                    />
                    <div v-if="device.assets_id && availableAssetItems[device.assets_id] && availableAssetItems[device.assets_id].length === 0" class="text-xs text-red-500 mt-1 flex items-center">
                      <UIcon name="i-heroicons-exclamation-triangle" class="w-3 h-3 mr-1" />
                      No available devices for this asset
                    </div>
                    <div v-else-if="device.assets_id && availableAssetItems[device.assets_id] && availableAssetItems[device.assets_id].length > 0" class="text-xs text-green-600 mt-1">
                      {{ availableAssetItems[device.assets_id].length }} device(s) available
                    </div>
                  </div>
                  <UInput
                    v-model="device.ip_static"
                    placeholder="IPAddr"
                    class="custom-input"
                  />
                  <USelect
                    v-model="device.kepemilikan_perangkat"
                    :options="kepemilikanOptions"
                    placeholder="Kepemilikan Perangkat"
                    class="custom-select"
                  />
                </div>
                
                <!-- Status Information -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <USelect
                    v-model="device.status_perangkat"
                    :options="statusPerangkatOptions"
                    placeholder="Status Perangkat"
                    class="custom-select"
                  />
                  <USelect
                    v-model="device.last_ping_status"
                    :options="pingStatusOptions"
                    placeholder="Ping"
                    class="custom-select"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Customer Services -->
          <div class="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
            <div class="flex items-center mb-6">
              <div class="bg-green-500 p-2 rounded-lg mr-3">
                <UIcon name="i-heroicons-wifi" class="text-white text-lg" />
              </div>
              <h2 class="text-xl font-bold text-gray-800">Customer Services</h2>
            </div>
            
            <div class="mb-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-700">Customer Services</h3>
                <UButton @click="addCustomerService" size="sm" color="green" class="shadow-md">
                  <UIcon name="i-heroicons-plus" class="mr-1" />
                  Add Service
                </UButton>
              </div>
            
              <div v-for="(service, index) in state.customer_services" :key="index" class="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
                <div class="flex justify-between items-center mb-4">
                  <h4 class="text-lg font-semibold text-gray-700 flex items-center">
                    <UIcon name="i-heroicons-wifi" class="mr-2 text-green-500" />
                    Customer Service {{ index + 1 }}
                  </h4>
                  <UButton @click="removeCustomerService(index)" size="sm" color="red" variant="outline" class="hover:bg-red-50">
                    <UIcon name="i-heroicons-trash" />
                  </UButton>
                </div>
                
                <!-- User Information -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <UInput
                    v-model="service.user_login"
                    placeholder="UserLogin"
                    class="custom-input"
                  />
                  <UInput
                    v-model="service.password"
                    placeholder="Password"
                    class="custom-input"
                  />
                  <USelect
                    v-model="service.user_status"
                    :options="userStatusOptions"
                    placeholder="Status User"
                    class="custom-select"
                  />
                </div>
                
                <!-- Cable and Port Information -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <UInput
                    v-model="service.cable_type"
                    placeholder="Cable Type"
                    class="custom-input"
                  />
                  <UInput
                    v-model="service.cable_length"
                    type="number"
                    placeholder="Length (meters)"
                    class="custom-input"
                  />
                  <UInput
                    v-model="service.end_port_type"
                    placeholder="End Port Type"
                    class="custom-input"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Cables -->
          <div class="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-100">
            <div class="flex items-center mb-6">
              <div class="bg-yellow-500 p-2 rounded-lg mr-3">
                <UIcon name="i-heroicons-cable" class="text-white text-lg" />
              </div>
              <h2 class="text-xl font-bold text-gray-800">Cables</h2>
            </div>
            
            <div class="mb-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-700">Cables</h3>
                <UButton @click="addCable" size="sm" color="yellow" class="shadow-md">
                  <UIcon name="i-heroicons-plus" class="mr-1" />
                  Add Cable
                </UButton>
              </div>
              
              <div v-for="(cable, index) in state.cables" :key="index" class="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
                <div class="flex justify-between items-center mb-4">
                  <h4 class="text-lg font-semibold text-gray-700 flex items-center">
                    <UIcon name="i-heroicons-cable" class="mr-2 text-yellow-500" />
                    Cable {{ index + 1 }}
                  </h4>
                  <UButton @click="removeCable(index)" size="sm" color="red" variant="outline" class="hover:bg-red-50">
                    <UIcon name="i-heroicons-trash" />
                  </UButton>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <UInput
                    v-model="cable.name"
                    placeholder="Cable Name"
                    class="custom-input"
                  />
                  <UInput
                    v-model="cable.type"
                    placeholder="Cable Type"
                    class="custom-input"
                  />
                  <UInput
                    v-model.number="cable.length"
                    type="number"
                    placeholder="Length (m)"
                    class="custom-input"
                  />
                  <USelect
                    v-model="cable.status"
                    :options="cableStatusOptions"
                    placeholder="Status"
                    class="custom-select"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Images -->
          <div class="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
            <div class="flex items-center mb-6">
              <div class="bg-indigo-500 p-2 rounded-lg mr-3">
                <UIcon name="i-heroicons-photo" class="text-white text-lg" />
              </div>
              <h2 class="text-xl font-bold text-gray-800">Installation Images</h2>
            </div>
            
            <UFormGroup label="Upload Images" name="image_ids" required>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                  v-for="(preview, index) in state.previews"
                  :key="index"
                  class="relative group cursor-pointer bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                  @click="state.selectedImage = preview; state.showModal = true"
                >
                  <img
                    :src="preview"
                    :alt="`Preview ${index + 1}`"
                    class="w-full h-32 object-cover"
                  />
                  <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                    <UIcon name="i-heroicons-eye" class="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xl" />
                  </div>
                  <UButton
                    @click.stop="removeImage(index)"
                    size="xs"
                    color="red"
                    variant="solid"
                    class="absolute -top-2 -right-2 shadow-lg"
                  >
                    <UIcon name="i-heroicons-x-mark" />
                  </UButton>
                </div>
                
                <div
                  v-if="state.previews.length < 10"
                  class="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 bg-white"
                  @click="triggerFileUpload"
                >
                  <div class="text-center">
                    <UIcon name="i-heroicons-plus" class="text-gray-400 text-3xl mb-2" />
                    <p class="text-sm text-gray-500 font-medium">Add Image</p>
                  </div>
                </div>
              </div>
              
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                multiple
                class="hidden"
                @change="handleFileUpload"
              />
            </UFormGroup>
          </div>

          <!-- Submit Button -->
          <div class="bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-200">
            <div class="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <UButton @click="$router.back()" variant="outline" color="gray" size="sm" 
                       class="w-full sm:w-auto px-6 sm:px-8">
                <UIcon name="i-heroicons-x-mark" class="mr-2" />
                Cancel
              </UButton>
              <UButton type="submit" :loading="isSubmitting" color="emerald" size="sm" 
                       class="w-full sm:w-auto px-6 sm:px-8 shadow-lg">
                <UIcon name="i-heroicons-check" class="mr-2" />
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
              <UIcon name="i-heroicons-x-mark" />
            </UButton>
          </div>
        </template>
        
        <div class="text-center">
          <img
            :src="state.selectedImage"
            alt="Full size preview"
            class="max-w-full max-h-96 mx-auto rounded-lg"
          />
        </div>
      </UCard>
    </UModal>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { object, string } from 'yup'
import type { FormSubmitEvent } from '#ui/types'
import { customerAdminApi } from '@/api/admin/customer'
import { assetAdminApi } from '@/api/admin/asset'
import { assetItemAdminApi } from '@/api/admin/asset-item'
import { userManagementAdminApi } from '@/api/admin/user-management'
import { uploadFileAdminApi } from '@/api/admin/file-upload'
import type { CreateCompleteInstallationReportRequest } from '@/types/requests/installation-report'

// Apply auth middleware
definePageMeta({
  middleware: 'auth'
})

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
  installation_team_name: string().optional(),
  installation_team_phone: string().optional(),
  document_type: string().optional(),
  document_photo: string().optional(),
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
  
  // Installation Team
  installation_team_name: "",
  installation_team_phone: "",
  
  // Network Devices
  network_devices: [] as any[],
  
  // Customer Services
  customer_services: [] as any[],
  
  // Cables
  cables: [] as any[],
  
  // Images
  image_ids: [] as string[],
  previews: [] as string[],
  selectedImage: "",
  showModal: false,
});

const loading = ref(true);
const isSubmitting = ref(false);
const fileInput = ref<HTMLInputElement>();

// Options for dropdowns
const customerOptions = ref<any[]>([]);
const technicianOptions = ref<any[]>([]);
const assetOptions = ref<any[]>([]);

// Available asset items for MAC address selection
const availableAssetItems = ref<{[assetId: string]: any[]}>({});

// PSB Request Date from selected customer
const selectedCustomerPSBDate = ref("");

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

const cableStatusOptions = [
  { label: "Available", value: "available" },
  { label: "In Use", value: "in_use" },
  { label: "Damaged", value: "damaged" },
  { label: "Retired", value: "retired" },
];

// Load initial data
onMounted(async () => {
  await Promise.all([
    loadCustomers(),
    loadTechnicians(),
    loadAssets(),
    loadInstallationReport()
  ]);
});

async function loadInstallationReport() {
  try {
    const response = await customerAdminApi().getCompleteInstallationReport(installationId);
    const report = response.data;
    
    if (report) {
      // Populate form with existing data
      state.customer_id = report.customer_id || "";
      state.technician_id = report.technician_id || "";
      state.status = report.installation_status || "pending";
      state.notes = report.notes || "";
      state.document_type = report.document_type || "";
      state.document_photo = report.document_photo || "";
      state.installation_type = report.installation_type || "new_installation";
      state.on_air_date = report.on_air_date ? report.on_air_date.split('T')[0] : "";
      state.trial_end_date = report.trial_end_date ? report.trial_end_date.split('T')[0] : "";
      state.service_ready_date = report.service_ready_date ? report.service_ready_date.split('T')[0] : "";
      state.installation_completed_at = report.installation_completed_at ? report.installation_completed_at.replace('Z', '') : "";
      
      // Installation Team
      state.installation_team_name = report.installation_team_name || "";
      state.installation_team_phone = report.installation_team_phone || "";
      
      // Network Devices
      state.network_devices = report.network_devices || [];
      
      // Customer Services
      state.customer_services = report.customer_services || [];
      
      // Cables
      state.cables = report.cables || [];
      
      // Images
      state.image_ids = report.image_ids || [];
      state.previews = report.images ? report.images.map((img: any) => img.full_path || img.file) : [];
      
      // Set PSB date if available
      if (report.tgl_permintaan_psb) {
        selectedCustomerPSBDate.value = report.tgl_permintaan_psb.split('T')[0];
      }
    }
  } catch (error) {
    console.error("Failed to load installation report:", error);
    useToast().add({
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
        serial_number: asset.serial_number
      }));
    }
  } catch (error) {
    console.error("Failed to load assets:", error);
  }
}

// Load available asset items when an asset is selected
async function onAssetChange(assetId: string, deviceIndex: number) {
  // Always clear the MAC address selection when asset changes
  state.network_devices[deviceIndex].mac_address = "";
  state.network_devices[deviceIndex].asset_item_id = "";
  
  if (!assetId) {
    return;
  }

  try {
    // Always reload asset items for the selected asset (don't cache to ensure fresh data)
    const response = await assetItemAdminApi().getAvailableAssetItems(assetId);
    if (response.success) {
      availableAssetItems.value[assetId] = response.data.map((item: any) => ({
        value: item.id, // Use item ID as value for better tracking
        label: `${item.mac_address} (${item.status})`,
        id: item.id,
        mac_address: item.mac_address,
        status: item.status
      }));
    } else {
      availableAssetItems.value[assetId] = [];
    }
  } catch (error) {
    console.error("Failed to load available asset items:", error);
    availableAssetItems.value[assetId] = [];
    useToast().add({
      title: "Error",
      description: "Failed to load available MAC addresses",
      color: "red",
    });
  }
}

// Handle MAC address selection
function onMacAddressChange(assetItemId: string, deviceIndex: number) {
  if (!assetItemId) {
    state.network_devices[deviceIndex].asset_item_id = "";
    state.network_devices[deviceIndex].mac_address = "";
    return;
  }

  // Find the selected asset item and update both fields
  const assetId = state.network_devices[deviceIndex].assets_id;
  const selectedItem = availableAssetItems.value[assetId]?.find(item => item.id === assetItemId);
  
  if (selectedItem) {
    state.network_devices[deviceIndex].asset_item_id = selectedItem.id;
    state.network_devices[deviceIndex].mac_address = selectedItem.mac_address;
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
    cable_id: "",
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
function addCable() {
  state.cables.push({
    name: "",
    type: "",
    length: 0,
    status: "available",
  });
}

function removeCable(index: number) {
  state.cables.splice(index, 1);
}

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
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", `installation_${Date.now()}_${file.name}`);
        formData.append("path", `installations/${state.technician_id}/${state.customer_id}`);
        
        const response = await uploadFileAdminApi().createUploadFile({
          name: `installation_${Date.now()}_${file.name}`,
          path: `installations/${state.technician_id}/${state.customer_id}`,
          file: file,
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
      
      const response = await uploadFileAdminApi().createUploadFile({
        name: `document_${Date.now()}`,
        path: path,
        file: file,
      });
      
      console.log("Document photo upload response:", response);
      
      if (response.data?.full_path) {
        state.document_photo = response.data.full_path;
        console.log("Document photo path set to:", state.document_photo);
        
        useToast().add({
          title: "Success",
          description: "Document photo uploaded successfully",
          color: "green",
        });
      } else {
        console.error("No full_path in response:", response);
        useToast().add({
          title: "Error",
          description: "Failed to upload document photo",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Error uploading document photo:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      useToast().add({
        title: "Error",
        description: "Failed to upload document photo: " + errorMessage,
        color: "red",
      });
    }
  } else {
    useToast().add({
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

// Form submission
type Schema = typeof schema;

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true;
  
  try {
    const submitData: CreateCompleteInstallationReportRequest = {
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
      network_devices: state.network_devices,
      customer_services: state.customer_services.map(service => ({
        ...service,
        installation_team_name: state.installation_team_name,
        installation_team_phone: state.installation_team_phone,
      })),
      cables: state.cables,
      image_ids: state.image_ids,
    };
    
    console.log("Updating installation report:", submitData);
    console.log("Network devices data:", submitData.network_devices);
    console.log("Customer services data:", submitData.customer_services);
    
    const response = await customerAdminApi().updateCompleteInstallationReport(installationId, submitData);
    console.log("API response:", response);
    
    useToast().add({
      title: "Success",
      description: "Installation report updated successfully",
      color: "green",
    });
    
    await navigateTo('/dashboard/report/customer-installation/reports');
    
  } catch (error: any) {
    console.error("Failed to update installation report:", error);
    useToast().add({
      title: "Error",
      description: error.message || "Failed to update installation report",
      color: "red",
    });
  } finally {
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
