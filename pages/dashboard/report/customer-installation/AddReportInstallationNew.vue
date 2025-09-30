<template>
  <div class="container mx-auto p-6">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Add Report Installation</h1>
        <UButton @click="$router.back()" variant="outline" color="gray">
          <UIcon name="i-heroicons-arrow-left" class="mr-2" />
          Back
        </UButton>
      </div>

      <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-6">
        <!-- Basic Installation Information -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Basic Installation Information</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup label="Customer" name="customer_id" required>
              <USelect
                v-model="state.customer_id"
                :options="customerOptions"
                option-attribute="name"
                value-attribute="id"
                placeholder="Select Customer"
                @change="onCustomerChange"
              />
            </UFormGroup>

            <UFormGroup label="Tgl. Permintaan PSB" name="tgl_permintaan_psb">
              <UInput
                v-model="selectedCustomerPSBDate"
                type="date"
                readonly
                placeholder="Select customer first"
                class="bg-gray-100"
              />
            </UFormGroup>

            <UFormGroup label="Technician" name="technician_id" required>
              <USelect
                v-model="state.technician_id"
                :options="technicianOptions"
                option-attribute="name"
                value-attribute="id"
                placeholder="Select Technician"
              />
            </UFormGroup>

            <UFormGroup label="Installation Type" name="installation_type">
              <USelect
                v-model="state.installation_type"
                :options="installationTypeOptions"
                placeholder="Select Installation Type"
              />
            </UFormGroup>

            <UFormGroup label="Status" name="status">
              <USelect
                v-model="state.status"
                :options="statusOptions"
                placeholder="Select Status"
              />
            </UFormGroup>

            <UFormGroup label="Tgl. On Air" name="on_air_date">
              <UInput
                v-model="state.on_air_date"
                type="date"
                placeholder="Select On Air Date"
              />
            </UFormGroup>

            <UFormGroup label="Tgl. Batas Percobaan" name="trial_end_date">
              <UInput
                v-model="state.trial_end_date"
                type="date"
                placeholder="Select Trial End Date"
              />
            </UFormGroup>

            <UFormGroup label="Tgl. Siap Layanan" name="service_ready_date">
              <UInput
                v-model="state.service_ready_date"
                type="date"
                placeholder="Select Service Ready Date"
              />
            </UFormGroup>

            <UFormGroup label="Installation Completed At" name="installation_completed_at">
              <UInput
                v-model="state.installation_completed_at"
                type="datetime-local"
                placeholder="Select Completion Date"
              />
            </UFormGroup>
          </div>

          <UFormGroup label="Notes" name="notes" class="mt-4">
            <UTextarea
              v-model="state.notes"
              placeholder="Enter installation notes"
              :rows="3"
            />
          </UFormGroup>
        </div>

        <!-- Installation Team Information -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Installation Team Information</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup label="Nama Anggota Tim Install" name="installation_team_name">
              <UInput
                v-model="state.installation_team_name"
                placeholder="Enter installation team member name"
              />
            </UFormGroup>

            <UFormGroup label="No.HP Tim Install" name="installation_team_phone">
              <UInput
                v-model="state.installation_team_phone"
                placeholder="Enter installation team phone number"
              />
            </UFormGroup>
          </div>
        </div>

        <!-- Document Information -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Document Information</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup label="Tipe Dokumen" name="document_type">
              <USelect
                v-model="state.document_type"
                :options="documentTypeOptions"
                placeholder="Select Document Type"
              />
            </UFormGroup>

            <UFormGroup label="Foto Dokumen" name="document_photo">
              <UInput
                type="file"
                accept="image/*"
                @change="handleDocumentPhotoUpload"
                placeholder="Upload document photo"
              />
            </UFormGroup>
          </div>
        </div>

        <!-- Network Device Configuration -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Network Device Configuration</h2>
          
          <div class="mb-4">
            <div class="flex justify-between items-center mb-2">
              <h3 class="text-md font-medium text-gray-700">Network Devices</h3>
              <UButton @click="addNetworkDevice" size="sm" color="blue">
                <UIcon name="i-heroicons-plus" class="mr-1" />
                Add Device
              </UButton>
            </div>
            
            <div v-for="(device, index) in state.network_devices" :key="index" class="border rounded-lg p-3 mb-2">
              <div class="flex justify-between items-center mb-2">
                <h4 class="text-sm font-medium text-gray-600">Network Device {{ index + 1 }}</h4>
                <UButton @click="removeNetworkDevice(index)" size="sm" color="red" variant="outline">
                  <UIcon name="i-heroicons-trash" />
                </UButton>
              </div>
              
              <!-- Router Information -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                <USelect
                  v-model="device.assets_id"
                  :options="assetOptions"
                  option-attribute="name"
                  value-attribute="id"
                  placeholder="Select Router Asset"
                />
                <UInput
                  v-model="device.router_brand"
                  placeholder="Router Brand"
                />
                <UInput
                  v-model="device.router_type"
                  placeholder="Type/Series"
                />
              </div>
              
              <!-- Network Configuration -->
              <div class="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                <UInput
                  v-model="device.switch_id"
                  placeholder="Switch ID"
                />
                <UInput
                  v-model="device.port_number"
                  placeholder="Port Number"
                />
                <UInput
                  v-model="device.remote_port"
                  placeholder="RemotePort"
                />
                <UInput
                  v-model="device.eth_port"
                  placeholder="EthPort"
                />
              </div>
              
              <!-- Device Information -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                <UInput
                  v-model="device.mac_address"
                  placeholder="MacAddr"
                />
                <UInput
                  v-model="device.ip_static"
                  placeholder="IPAddr"
                />
                <USelect
                  v-model="device.kepemilikan_perangkat"
                  :options="kepemilikanOptions"
                  placeholder="Kepemilikan Perangkat"
                />
              </div>
              
              <!-- Status Information -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <USelect
                  v-model="device.status_perangkat"
                  :options="statusPerangkatOptions"
                  placeholder="Status Perangkat"
                />
                <USelect
                  v-model="device.last_ping_status"
                  :options="pingStatusOptions"
                  placeholder="Ping"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Customer Services -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Customer Services</h2>
          
          <div class="mb-4">
            <div class="flex justify-between items-center mb-2">
              <h3 class="text-md font-medium text-gray-700">Customer Services</h3>
              <UButton @click="addCustomerService" size="sm" color="blue">
                <UIcon name="i-heroicons-plus" class="mr-1" />
                Add Service
              </UButton>
            </div>
            
            <div v-for="(service, index) in state.customer_services" :key="index" class="border rounded-lg p-3 mb-2">
              <div class="flex justify-between items-center mb-2">
                <h4 class="text-sm font-medium text-gray-600">Customer Service {{ index + 1 }}</h4>
                <UButton @click="removeCustomerService(index)" size="sm" color="red" variant="outline">
                  <UIcon name="i-heroicons-trash" />
                </UButton>
              </div>
              
              <!-- User Information -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                <UInput
                  v-model="service.user_login"
                  placeholder="UserLogin"
                />
                <UInput
                  v-model="service.password"
                  placeholder="Password"
                />
                <USelect
                  v-model="service.user_status"
                  :options="userStatusOptions"
                  placeholder="Status User"
                />
              </div>
              
              <!-- Cable and Port Information -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                <UInput
                  v-model="service.cable_type"
                  placeholder="Cable Type"
                />
                <UInput
                  v-model="service.cable_length"
                  type="number"
                  placeholder="Length (meters)"
                />
                <UInput
                  v-model="service.end_port_type"
                  placeholder="End Port Type"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Cables -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Cables</h2>
          
          <div class="mb-4">
            <div class="flex justify-between items-center mb-2">
              <h3 class="text-md font-medium text-gray-700">Cables</h3>
              <UButton @click="addCable" size="sm" color="blue">
                <UIcon name="i-heroicons-plus" class="mr-1" />
                Add Cable
              </UButton>
            </div>
            
            <div v-for="(cable, index) in state.cables" :key="index" class="border rounded-lg p-3 mb-2">
              <div class="flex justify-between items-center mb-2">
                <h4 class="text-sm font-medium text-gray-600">Cable {{ index + 1 }}</h4>
                <UButton @click="removeCable(index)" size="sm" color="red" variant="outline">
                  <UIcon name="i-heroicons-trash" />
                </UButton>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
                <UInput
                  v-model="cable.name"
                  placeholder="Cable Name"
                />
                <UInput
                  v-model="cable.type"
                  placeholder="Cable Type"
                />
                <UInput
                  v-model.number="cable.length"
                  type="number"
                  placeholder="Length (m)"
                />
                <USelect
                  v-model="cable.status"
                  :options="cableStatusOptions"
                  placeholder="Status"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Images -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Installation Images</h2>
          
          <UFormGroup label="Upload Images" name="image_ids" required>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                v-for="(preview, index) in state.previews"
                :key="index"
                class="relative group cursor-pointer"
                @click="state.selectedImage = preview; state.showModal = true"
              >
                <img
                  :src="preview"
                  :alt="`Preview ${index + 1}`"
                  class="w-full h-24 object-cover rounded-lg border"
                />
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <UIcon name="i-heroicons-eye" class="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
                <UButton
                  @click.stop="removeImage(index)"
                  size="xs"
                  color="red"
                  variant="solid"
                  class="absolute -top-2 -right-2"
                >
                  <UIcon name="i-heroicons-x-mark" />
                </UButton>
              </div>
              
              <div
                v-if="state.previews.length < 10"
                class="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                @click="triggerFileUpload"
              >
                <div class="text-center">
                  <UIcon name="i-heroicons-plus" class="text-gray-400 text-2xl mb-1" />
                  <p class="text-xs text-gray-500">Add Image</p>
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
        <div class="flex justify-end space-x-3">
          <UButton @click="$router.back()" variant="outline" color="gray">
            Cancel
          </UButton>
          <UButton type="submit" :loading="isSubmitting" color="blue">
            <UIcon name="i-heroicons-check" class="mr-2" />
            Create Installation Report
          </UButton>
        </div>
      </UForm>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { object, string } from 'yup'
import type { FormSubmitEvent } from '#ui/types'
import { customerAdminApi } from '@/api/admin/customer'
import { userManagementAdminApi } from '@/api/admin/user-management'
import { uploadFileAdminApi } from '@/api/admin/file-upload'
import type { CreateCompleteInstallationReportRequest } from '@/types/requests/installation-report'

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

const isSubmitting = ref(false);
const fileInput = ref<HTMLInputElement>();

// Options for dropdowns
const customerOptions = ref<any[]>([]);
const technicianOptions = ref<any[]>([]);
const assetOptions = ref<any[]>([]);

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
  await loadCustomers();
  await loadTechnicians();
  await loadAssets();
});

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
    // For now, we'll use an empty array since getAllAssets doesn't exist
    // You can implement this API endpoint later if needed
    assetOptions.value = [];
  } catch (error) {
    console.error("Failed to load assets:", error);
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
    
    console.log("Submitting complete installation report:", submitData);
    console.log("Document photo being sent:", submitData.document_photo);
    console.log("Document type being sent:", submitData.document_type);
    
    const response = await customerAdminApi().createCompleteInstallationReport(submitData);
    console.log("API response:", response);
    
    useToast().add({
      title: "Success",
      description: "Installation report created successfully",
      color: "green",
    });
    
    await navigateTo('/dashboard/report/customer-installation');
    
  } catch (error: any) {
    console.error("Failed to create installation report:", error);
    useToast().add({
      title: "Error",
      description: error.message || "Failed to create installation report",
      color: "red",
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>
