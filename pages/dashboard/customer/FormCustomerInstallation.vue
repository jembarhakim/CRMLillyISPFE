<script setup lang="ts">
import { object, string, type InferType } from "yup";
import type { FormSubmitEvent } from "#ui/types";
import { userManagementAdminApi } from "@/api/admin/user-management";
import { customerAdminApi } from "@/api/admin/customer";
import { useNotificationStore } from "@/stores/notification";

const notification = useNotificationStore();

const props = defineProps({
  isEdit: {
    type: Boolean,
    required: false,
  },
  data: {
    type: Object,
    default: () => ({
      id: {
        type: string,
        default: "",
      },
      technician_id: {
        type: string,
        default: "",
      },
    }),
  },
});

const schema = object({
  customer_id: string().required("Customer is required"),
  technician_id: string().required("Technician is required"),
  assets_id: string().required("Asset is required"),
});

const state = reactive({
  // Basic Installation Information
  customer_id: "",
  technician_id: "",
  status: "pending",
  notes: "",
  document_type: "KTP",
  document_photo: null as File | null,
  installation_type: "new_installation",
  on_air_date: "",
  trial_end_date: "",
  service_ready_date: "",
  installation_completed_at: "",

  // Network Device Information
  assets_id: "",
  switch_id: "",
  port_number: "",
  remote_port: "",
  eth_port: "",
  mac_address: "",
  ip_static: "",
  kepemilikan_perangkat: "owned",
  status_perangkat: "active",
  last_ping_status: "unknown",

  // Customer Service Information
  cable_type: "UTP Cat6",
  cable_length: 0,
  end_port_type: "RJ45",
  user_login: "",
  password: "",
  user_status: "Active",
  installation_notes: "",


  // UI State
  loading: false,
  customers: [] as any[],
  technicians: [] as any[],
  assets: [] as any[],
  documentPreview: "",
});

// Set default dates
const today = new Date();
state.on_air_date = today.toISOString().split('T')[0];
state.trial_end_date = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
state.service_ready_date = today.toISOString().split('T')[0];
state.installation_completed_at = today.toISOString().slice(0, 16);

watch(
  () => props.isEdit,
  (newValue) => {
    if (newValue) {
      state.customer_id = props.data.id;
    }
  },
  { immediate: true }
);

type Schema = InferType<typeof schema>;

async function onSubmit(event: FormSubmitEvent<Schema>) {
  state.loading = true;
  
  try {
    // Create FormData for multipart form submission
    const formData = new FormData();
    
    // Append all form fields
    formData.append('customer_id', state.customer_id);
    formData.append('technician_id', state.technician_id);
    formData.append('assets_id', state.assets_id);
    formData.append('status', state.status);
    formData.append('notes', state.notes);
    formData.append('document_type', state.document_type);
    formData.append('installation_type', state.installation_type);
    formData.append('on_air_date', state.on_air_date);
    formData.append('trial_end_date', state.trial_end_date);
    formData.append('service_ready_date', state.service_ready_date);
    formData.append('installation_completed_at', state.installation_completed_at);
    
    // Network device fields
    formData.append('switch_id', state.switch_id);
    formData.append('port_number', state.port_number);
    formData.append('remote_port', state.remote_port);
    formData.append('eth_port', state.eth_port);
    formData.append('mac_address', state.mac_address);
    formData.append('ip_static', state.ip_static);
    formData.append('kepemilikan_perangkat', state.kepemilikan_perangkat);
    formData.append('status_perangkat', state.status_perangkat);
    formData.append('last_ping_status', state.last_ping_status);
    
    // Customer service fields
    formData.append('cable_type', state.cable_type);
    formData.append('cable_length', state.cable_length.toString());
    formData.append('end_port_type', state.end_port_type);
    formData.append('user_login', state.user_login);
    formData.append('password', state.password);
    formData.append('user_status', state.user_status);
    formData.append('installation_notes', state.installation_notes);
    
    
    // Append document photo if selected
    if (state.document_photo) {
      formData.append('document_photo', state.document_photo);
    }

    // Validate IP address format before submitting
    if (state.ip_static && state.ip_static.trim() !== '') {
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(state.ip_static.trim())) {
        notification.error('Invalid IP Address', 'Please enter a valid IP address format (e.g., 192.168.1.1)');
        return;
      }
    }

    // Submit using the new API endpoint
    const response = await customerAdminApi().createReportInstallation(formData);
    
    console.log("Success creating installation report", response);
    
    // Show success notification
    notification.success('Success', 'Installation report created successfully');
    
    onSuccess();
    
  } catch (error: any) {
    console.error("Error creating installation report:", error);
    
    // Show user-friendly error notification
    const errorMessage = error.message || 'Failed to create installation report';
    
    // Check if it's an IP address format error
    if (errorMessage.includes('IP address format') || errorMessage.includes('Invalid IP')) {
      notification.error('Invalid IP Address', 'Please enter a valid IP address format (e.g., 192.168.1.1)');
    } else {
      notification.error('Error', errorMessage);
    }
  } finally {
    state.loading = false;
  }
}

const emit = defineEmits(["success", "close"]);

function onSuccess() {
  emit("success");
  // Dispatch event to refresh installation list
  window.dispatchEvent(new CustomEvent('installation-created'));
}

// Handle document photo upload
const handleDocumentPhotoUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input && input.files && input.files[0]) {
    const file = input.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG)');
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    
    state.document_photo = file;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      state.documentPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

// Load data functions
async function loadCustomers() {
  try {
    const response = await customerAdminApi().getAllCustomers();
    state.customers = response.data || [];
  } catch (error) {
    console.error("Failed to load customers:", error);
  }
}

async function loadTechnicians() {
  try {
    const response = await userManagementAdminApi().getAllUsers({ query: { role: "TECHNICIAN" } });
    state.technicians = response.data || [];
  } catch (error) {
    console.error("Failed to load technicians:", error);
  }
}

async function loadAssets() {
  try {
    // Use real assets from database
    state.assets = [
      { id: "5ca1606b-66b3-4958-b7af-f48d4cda800a", brand: "TP-Link", type: "Router Edit", model: "RBG128", status_in_out: "in", display: "TP-Link Router RBG128" },
      { id: "842a48a4-6380-4280-96e1-a734f61a7d5b", brand: "ads", type: "asdzxc", model: "asd", status_in_out: "out", display: "ads asdzxc" },
      { id: "ac9e147a-4a75-4d39-9068-83e28ea0288b", brand: "TP-Link", type: "Router Update2", model: "RBG128", status_in_out: "in", display: "TP-Link Router Update2" },
      { id: "f2061760-b41b-420b-9f70-4e96e46f2f57", brand: "ads", type: "asd", model: "asd", status_in_out: "out", display: "ads asd" },
    ];
  } catch (error) {
    console.error("Failed to load assets:", error);
  }
}

// Close modal function
function closeModal() {
  // Close modal directly without confirmation
  useModal().close();
}

// Load data on component mount
onMounted(async () => {
  await Promise.all([
    loadCustomers(),
    loadTechnicians(),
    loadAssets()
  ]);
});
</script>

<template>
  <UModal :prevent-close="true">
    <div class="p-6 max-w-6xl max-h-[90vh] overflow-y-auto relative">
      <!-- Close Button -->
      <button 
        @click="closeModal"
        class="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
        title="Close modal"
      >
        <UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
      </button>
      
      <div class="p-2 mb-6 text-2xl font-bold text-center">
        <h1>Add Report Installation</h1>
        <p class="text-sm font-normal text-gray-600 mt-2">Complete installation report with all technical details</p>
      </div>
      
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <!-- Basic Installation Information -->
        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4 flex items-center">
            <UIcon name="i-heroicons-information-circle" class="mr-2" />
            Basic Installation Information
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup label="Customer *" name="customer_id">
              <USelectMenu
                v-model="state.customer_id"
                :options="state.customers"
                placeholder="Select customer"
                searchable
                searchable-placeholder="Search by customer name"
                option-attribute="name"
                value-attribute="id"
                :search-attributes="['name', 'phone']"
              />
            </UFormGroup>
            
            <UFormGroup label="Technician *" name="technician_id">
              <USelectMenu
                v-model="state.technician_id"
                :options="state.technicians"
                placeholder="Select technician"
                searchable
                searchable-placeholder="Search by technician name"
                option-attribute="name"
                value-attribute="id"
                :search-attributes="['name']"
              />
            </UFormGroup>
            
            <UFormGroup label="Status" name="status">
              <USelectMenu
                v-model="state.status"
                :options="[
                  { value: 'pending', label: 'Pending' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'failed', label: 'Failed' },
                  { value: 'cancelled', label: 'Cancelled' }
                ]"
                value-attribute="value"
                option-attribute="label"
                placeholder="Select status"
              />
            </UFormGroup>
            
            <UFormGroup label="Installation Type" name="installation_type">
              <USelectMenu
                v-model="state.installation_type"
                :options="[
                  { value: 'new_installation', label: 'New Installation' },
                  { value: 'maintenance', label: 'Maintenance' },
                  { value: 'upgrade', label: 'Upgrade' },
                  { value: 'downgrade', label: 'Downgrade' }
                ]"
                value-attribute="value"
                option-attribute="label"
                placeholder="Select installation type"
              />
            </UFormGroup>
            
            <UFormGroup label="On Air Date" name="on_air_date">
              <UInput v-model="state.on_air_date" type="date" />
            </UFormGroup>
            
            <UFormGroup label="Trial End Date" name="trial_end_date">
              <UInput v-model="state.trial_end_date" type="date" />
            </UFormGroup>
            
            <UFormGroup label="Service Ready Date" name="service_ready_date">
              <UInput v-model="state.service_ready_date" type="date" />
            </UFormGroup>
            
            <UFormGroup label="Installation Completed At" name="installation_completed_at">
              <UInput v-model="state.installation_completed_at" type="datetime-local" />
            </UFormGroup>
          </div>
          
          <UFormGroup label="Notes" name="notes">
            <UTextarea 
              v-model="state.notes" 
              placeholder="Additional notes about the installation"
              :rows="3"
            />
          </UFormGroup>
        </div>

        <!-- Document Information -->
        <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center">
            <UIcon name="i-heroicons-document-text" class="mr-2" />
            Document Information
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup label="Document Type" name="document_type">
              <USelectMenu
                v-model="state.document_type"
                :options="[
                  { value: 'KTP', label: 'KTP' },
                  { value: 'SIM', label: 'SIM' },
                  { value: 'Paspor', label: 'Paspor' }
                ]"
                value-attribute="value"
                option-attribute="label"
                placeholder="Select document type"
              />
            </UFormGroup>
            
            <UFormGroup label="Document Photo" name="document_photo">
              <UInput
                type="file"
                accept="image/*"
                @change="handleDocumentPhotoUpload"
                placeholder="Upload document photo"
              /> 
              <div v-if="state.documentPreview" class="mt-2">
                <img :src="state.documentPreview" alt="Document Preview" class="w-32 h-20 object-cover rounded border" />
              </div>
            </UFormGroup>
          </div>
        </div>

        <!-- Network Device Information -->
        <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-4 flex items-center">
            <UIcon name="i-heroicons-cpu-chip" class="mr-2" />
            Network Device Information
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup label="Asset *" name="assets_id">
              <USelectMenu
                v-model="state.assets_id"
                :options="state.assets"
                placeholder="Select asset"
                searchable
                searchable-placeholder="Search by brand/model"
                option-attribute="display"
                value-attribute="id"
                :search-attributes="['brand', 'type', 'model']"
              />
            </UFormGroup>
            
            <UFormGroup label="Switch ID" name="switch_id">
              <UInput v-model="state.switch_id" placeholder="Enter switch ID" />
            </UFormGroup>
            
            <UFormGroup label="Port Number" name="port_number">
              <UInput v-model="state.port_number" placeholder="Enter port number" />
            </UFormGroup>
            
            <UFormGroup label="Remote Port" name="remote_port">
              <UInput v-model="state.remote_port" placeholder="Enter remote port" />
            </UFormGroup>
            
            <UFormGroup label="ETH Port" name="eth_port">
              <UInput v-model="state.eth_port" placeholder="Enter ETH port" />
            </UFormGroup>
            
            <UFormGroup label="MAC Address" name="mac_address">
              <UInput v-model="state.mac_address" placeholder="XX:XX:XX:XX:XX:XX" />
            </UFormGroup>
            
            <UFormGroup label="IP Static" name="ip_static">
              <UInput v-model="state.ip_static" placeholder="192.168.1.100" />
            </UFormGroup>
            
            <UFormGroup label="Device Ownership" name="kepemilikan_perangkat">
              <USelectMenu
                v-model="state.kepemilikan_perangkat"
                :options="[
                  { value: 'owned', label: 'Owned' },
                  { value: 'leased', label: 'Leased' },
                  { value: 'customer', label: 'Customer' }
                ]"
                value-attribute="value"
                option-attribute="label"
                placeholder="Select ownership"
              />
            </UFormGroup>
            
            <UFormGroup label="Device Status" name="status_perangkat">
              <USelectMenu
                v-model="state.status_perangkat"
                :options="[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'maintenance', label: 'Maintenance' },
                  { value: 'faulty', label: 'Faulty' }
                ]"
                value-attribute="value"
                option-attribute="label"
                placeholder="Select device status"
              />
            </UFormGroup>
            
            <UFormGroup label="Last Ping Status" name="last_ping_status">
              <USelectMenu
                v-model="state.last_ping_status"
                :options="[
                  { value: 'up', label: 'Up' },
                  { value: 'down', label: 'Down' },
                  { value: 'unknown', label: 'Unknown' }
                ]"
                value-attribute="value"
                option-attribute="label"
                placeholder="Select ping status"
              />
            </UFormGroup>
          </div>
        </div>

        <!-- Customer Service Information -->
        <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-4 flex items-center">
            <UIcon name="i-heroicons-wrench-screwdriver" class="mr-2" />
            Customer Service Information
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup label="Cable Type" name="cable_type">
              <USelectMenu
                v-model="state.cable_type"
                :options="[
                  { value: 'UTP Cat5e', label: 'UTP Cat5e' },
                  { value: 'UTP Cat6', label: 'UTP Cat6' },
                  { value: 'Single Mode Fiber', label: 'Single Mode Fiber' },
                  { value: 'Multi Mode Fiber', label: 'Multi Mode Fiber' }
                ]"
                value-attribute="value"
                option-attribute="label"
                placeholder="Select cable type"
              />
            </UFormGroup>
            
            <UFormGroup label="Cable Length (meters)" name="cable_length">
              <UInput v-model="state.cable_length" type="number" placeholder="Enter cable length" />
            </UFormGroup>
            
            <UFormGroup label="End Port Type" name="end_port_type">
              <USelectMenu
                v-model="state.end_port_type"
                :options="[
                  { value: 'RJ45', label: 'RJ45' },
                  { value: 'Fiber', label: 'Fiber' },
                  { value: 'SC', label: 'SC' },
                  { value: 'LC', label: 'LC' }
                ]"
                value-attribute="value"
                option-attribute="label"
                placeholder="Select end port type"
              />
            </UFormGroup>
            
            <UFormGroup label="User Login" name="user_login">
              <UInput v-model="state.user_login" placeholder="Enter user login" />
            </UFormGroup>
            
            <UFormGroup label="Password" name="password">
              <UInput v-model="state.password" type="password" placeholder="Enter password" />
            </UFormGroup>
            
            <UFormGroup label="User Status" name="user_status">
              <USelectMenu
                v-model="state.user_status"
                :options="[
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                  { value: 'Suspended', label: 'Suspended' },
                  { value: 'Pending', label: 'Pending' }
                ]"
                value-attribute="value"
                option-attribute="label"
                placeholder="Select user status"
              />
            </UFormGroup>
          </div>
          
          <UFormGroup label="Installation Notes" name="installation_notes">
            <UTextarea 
              v-model="state.installation_notes" 
              placeholder="Additional notes about the installation process"
              :rows="3"
            />
          </UFormGroup>
        </div>


        <!-- Submit Button -->
        <div class="flex justify-end space-x-4 pt-6 border-t">
          <UButton 
            type="button" 
            color="gray" 
            variant="outline"
            @click="$emit('close')"
          >
            Cancel
          </UButton>
          <UButton 
            type="submit" 
            color="blue"
            :loading="state.loading"
            :disabled="!state.customer_id || !state.technician_id || !state.assets_id"
          >
            <UIcon name="i-heroicons-document-plus" class="mr-2" />
            Create Installation Report
          </UButton>
        </div>
      </UForm>
    </div>
  </UModal>
</template>
