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
  assets_id: string().required("Asset is required"),
});

const state = reactive({
  // Basic Installation Information
  customer_id: "",
  technician_id: "", // Legacy - kept for backward compatibility
  status: "pending",
  notes: "",
  document_type: "KTP",
  document_photo: null as File | null,
  installation_type: "new_installation",
  on_air_date: "",
  trial_end_date: "",
  service_ready_date: "",
  installation_completed_at: "",

  // Multiple Technicians with Roles
  technicians: [] as Array<{
    technician_id: string;
    role: 'senior' | 'junior' | 'helper';
    is_primary: boolean;
    notes: string;
  }>,

  // MikroTik Provisioning Fields
  mac_address: "",
  psb_date: "",
  psb_time: "",
  max_limit: "", // e.g., "10M/10M"
  auto_provision: false,
  dry_run: false,

  // Network Device Information
  assets_id: "",
  switch_id: "",
  port_number: "",
  remote_port: "",
  eth_port: "",
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
  availableTechnicians: [] as any[], // List of available technicians from DB
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
    // Validate at least one technician is assigned
    if (state.technicians.length === 0) {
      notification.error('Validation Error', 'Please assign at least one technician');
      return;
    }

    // Validate at least one senior technician
    const hasSenior = state.technicians.some(t => t.role === 'senior');
    if (!hasSenior) {
      notification.error('Validation Error', 'At least one senior technician is required');
      return;
    }

    // Create FormData for multipart form submission
    const formData = new FormData();
    
    // Append all form fields
    formData.append('customer_id', state.customer_id);
    formData.append('assets_id', state.assets_id);
    formData.append('status', state.status);
    formData.append('notes', state.notes);
    formData.append('document_type', state.document_type);
    formData.append('installation_type', state.installation_type);
    formData.append('on_air_date', state.on_air_date);
    formData.append('trial_end_date', state.trial_end_date);
    formData.append('service_ready_date', state.service_ready_date);
    formData.append('installation_completed_at', state.installation_completed_at);
    
    // Multiple technicians (send as JSON)
    formData.append('technicians', JSON.stringify(state.technicians));
    
    // MikroTik provisioning fields
    if (state.mac_address) formData.append('mac_address', state.mac_address);
    if (state.psb_date) formData.append('psb_date', state.psb_date);
    if (state.psb_time) formData.append('psb_time', state.psb_time);
    if (state.max_limit) formData.append('max_limit', state.max_limit);
    formData.append('auto_provision', state.auto_provision.toString());
    formData.append('dry_run', state.dry_run.toString());
    
    // Network device fields
    formData.append('switch_id', state.switch_id);
    formData.append('port_number', state.port_number);
    formData.append('remote_port', state.remote_port);
    formData.append('eth_port', state.eth_port);
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
    
    // Check if there's provisioning information in the response
    if (response.data?.provisioning) {
      const prov = response.data.provisioning;
      if (prov.status === 'success') {
        if (prov.dry_run) {
          notification.success('Installation Created & Provisioning Preview', 
            `Installation created. Dry-run completed with ${prov.commands?.length || 0} commands. Check console for details.`);
          console.log('Provisioning commands (dry-run):', prov.commands);
        } else {
          notification.success('Installation Created & Provisioned', 
            `Installation created and customer provisioned successfully! Code: ${prov.code_name || 'N/A'}`);
        }
      } else if (prov.status === 'failed') {
        notification.warning('Installation Created (Provisioning Failed)', 
          `Installation created but provisioning failed: ${prov.error || 'Unknown error'}`);
      } else {
        notification.success('Installation Created', 
          `Installation created. Provisioning ${prov.message || 'skipped'}.`);
      }
    } else {
      // Show success notification
      notification.success('Success', 'Installation report created successfully');
    }
    
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

// Load test data for debugging
const loadTestData = () => {
  // Get current date/time
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);
  const nextMonth = new Date(now.setMonth(now.getMonth() + 1)).toISOString().split('T')[0];
  
  // Basic Installation Information
  state.status = "pending";
  state.notes = "Test installation report - debugging";
  state.document_type = "KTP";
  state.installation_type = "new_installation";
  state.on_air_date = today;
  state.trial_end_date = nextMonth;
  state.service_ready_date = today;
  state.installation_completed_at = `${today}T${currentTime}`;
  
  // Clear and add test technicians if available
  if (state.availableTechnicians.length > 0) {
    state.technicians = [];
    // Add first available as senior primary
    if (state.availableTechnicians[0]) {
      state.technicians.push({
        technician_id: state.availableTechnicians[0].id,
        role: 'senior',
        is_primary: true,
        notes: 'Lead technician - test'
      });
    }
    // Add second available as junior if exists
    if (state.availableTechnicians.length > 1) {
      state.technicians.push({
        technician_id: state.availableTechnicians[1].id,
        role: 'junior',
        is_primary: false,
        notes: 'Assistant technician - test'
      });
    }
  }
  
  // MikroTik Provisioning Fields
  state.mac_address = "40:EE:15:7D:43:99";
  state.psb_date = today;
  state.psb_time = currentTime;
  state.max_limit = "10M/10M";
  state.auto_provision = true;
  state.dry_run = true; // Safe for testing
  
  // Network Device Information
  state.switch_id = "SW-TEST-001";
  state.port_number = "10";
  state.remote_port = "2000";
  state.eth_port = "eth0";
  state.ip_static = "192.168.1.100";
  state.kepemilikan_perangkat = "owned";
  state.status_perangkat = "active";
  state.last_ping_status = "up";
  
  // Customer Service Information
  state.cable_type = "UTP Cat6";
  state.cable_length = 20;
  state.end_port_type = "RJ45";
  state.user_login = "testuser@example.com";
  state.password = "testpassword123";
  state.user_status = "Active";
  state.installation_notes = "Test installation with all fields populated";
  
  notification.success('Test Data Loaded', 'All fields have been filled with test data. Select a customer and asset to complete.');
};

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
    state.availableTechnicians = response.data || [];
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

// Helper functions for managing technicians
function addTechnician() {
  state.technicians.push({
    technician_id: "",
    role: "junior",
    is_primary: state.technicians.length === 0, // First technician is primary by default
    notes: "",
  });
}

function removeTechnician(index: number) {
  const removedTech = state.technicians[index];
  state.technicians.splice(index, 1);
  
  // If we removed the primary, make the first senior primary
  if (removedTech.is_primary && state.technicians.length > 0) {
    const firstSenior = state.technicians.find(t => t.role === 'senior');
    if (firstSenior) {
      firstSenior.is_primary = true;
    } else if (state.technicians.length > 0) {
      state.technicians[0].is_primary = true;
    }
  }
}

function setPrimaryTechnician(index: number) {
  state.technicians.forEach((tech, i) => {
    tech.is_primary = i === index;
  });
}

// Load data on component mount
onMounted(async () => {
  await Promise.all([
    loadCustomers(),
    loadTechnicians(),
    loadAssets()
  ]);
  
  // Add one technician by default
  if (state.technicians.length === 0) {
    addTechnician();
  }
});
</script>

<template>
  <UModal :prevent-close="true">
    <div class="p-6 max-w-7xl max-h-[92vh] overflow-y-auto relative bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
      <!-- Close Button -->
      <button 
        @click="closeModal"
        class="absolute top-4 right-4 z-20 p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-200 shadow-md hover:shadow-lg"
        title="Close modal"
      >
        <UIcon name="i-heroicons-x-mark" class="w-7 h-7" />
      </button>
      
      <!-- Header -->
      <div class="mb-8 text-center pb-6 border-b-2 border-blue-200 dark:border-blue-800">
        <div class="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl mb-4 shadow-lg">
          <UIcon name="i-heroicons-document-plus" class="w-10 h-10 text-white" />
        </div>
        <h1 class="text-3xl font-black text-gray-900 dark:text-gray-100 mb-2">
          Add Installation Report
        </h1>
        <p class="text-base text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
          Complete installation documentation with team assignment and optional MikroTik auto-provisioning
        </p>
        
        <!-- Load Test Data Button for Debugging -->
        <div class="mt-4">
          <button
            type="button"
            @click="loadTestData"
            class="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            <UIcon name="i-heroicons-beaker" class="w-5 h-5" />
            Load Test Data (Debug)
          </button>
        </div>
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

        <!-- Technician Team Section -->
        <div class="bg-gradient-to-br from-indigo-50 to-purple-50 dark:bg-gradient-to-br dark:from-indigo-900/30 dark:to-purple-900/30 p-6 rounded-xl border-2 border-indigo-100 dark:border-indigo-800 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
            <div>
              <h3 class="text-xl font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                <div class="bg-indigo-500 p-2 rounded-lg">
                  <UIcon name="i-heroicons-user-group" class="text-white w-5 h-5" />
                </div>
                Installation Team
                <span class="text-red-500">*</span>
              </h3>
              <p class="text-sm text-indigo-700 dark:text-indigo-300 mt-1">Assign technicians with their roles and responsibilities</p>
            </div>
            <UButton @click="addTechnician" size="lg" color="indigo">
              <UIcon name="i-heroicons-plus-circle" class="mr-2 w-5 h-5" />
              Add Technician
            </UButton>
          </div>
          
          <div v-if="state.technicians.length === 0" class="text-center py-8 px-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-indigo-200 dark:border-indigo-700">
            <UIcon name="i-heroicons-user-group" class="w-16 h-16 text-indigo-300 dark:text-indigo-600 mx-auto mb-3" />
            <p class="text-gray-600 dark:text-gray-300 font-medium">No technicians assigned yet</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Click "Add Technician" to assign your installation team</p>
          </div>
          
          <div v-else class="space-y-3">
            <div v-for="(tech, index) in state.technicians" :key="index" 
              class="bg-white dark:bg-gray-800 rounded-lg border-2 border-indigo-200 dark:border-indigo-700 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                <!-- Technician Number Badge -->
                <div class="md:col-span-12 flex items-center gap-2 mb-2">
                  <div class="bg-indigo-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">
                    {{ index + 1 }}
                  </div>
                  <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">Technician {{ index + 1 }}</span>
                  <div v-if="tech.is_primary" class="ml-auto flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs font-bold">
                    <UIcon name="i-heroicons-star-solid" class="w-4 h-4" />
                    PRIMARY
                  </div>
                </div>
                
                <!-- Technician Select -->
                <div class="md:col-span-5">
                  <label class="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Select Technician <span class="text-red-500">*</span>
                  </label>
                  <USelectMenu
                    v-model="tech.technician_id"
                    :options="state.availableTechnicians"
                    placeholder="Choose a technician"
                    searchable
                    searchable-placeholder="Search by name"
                    option-attribute="name"
                    value-attribute="id"
                    :search-attributes="['name']"
                    size="lg"
                  />
                </div>
                
                <!-- Role Select -->
                <div class="md:col-span-3">
                  <label class="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Role <span class="text-red-500">*</span>
                  </label>
                  <USelectMenu
                    v-model="tech.role"
                    :options="[
                      { value: 'senior', label: '👨‍🔧 Senior', description: 'Lead technician' },
                      { value: 'junior', label: '👷 Junior', description: 'Supporting role' },
                      { value: 'helper', label: '🔧 Helper', description: 'Assistant' }
                    ]"
                    value-attribute="value"
                    option-attribute="label"
                    size="lg"
                  />
                </div>
                
                <!-- Action Buttons -->
                <div class="md:col-span-4 flex flex-col gap-2">
                  <label class="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Actions</label>
                  <div class="flex gap-2">
                    <UButton 
                      @click="setPrimaryTechnician(index)"
                      :color="tech.is_primary ? 'green' : 'gray'"
                      :variant="tech.is_primary ? 'solid' : 'outline'"
                      size="lg"
                      class="flex-1"
                      :disabled="tech.is_primary"
                    >
                      <UIcon :name="tech.is_primary ? 'i-heroicons-star-solid' : 'i-heroicons-star'" class="mr-1 w-4 h-4" />
                      <span class="hidden sm:inline">{{ tech.is_primary ? 'Primary' : 'Set Primary' }}</span>
                      <span class="sm:hidden">Primary</span>
                    </UButton>
                    <UButton 
                      @click="removeTechnician(index)"
                      color="red"
                      variant="outline"
                      size="lg"
                      :disabled="state.technicians.length === 1"
                    >
                      <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                    </UButton>
                  </div>
                </div>
                
                <!-- Notes -->
                <div class="md:col-span-12">
                  <label class="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Notes <span class="text-gray-500 text-xs font-normal">(optional)</span>
                  </label>
                  <UInput 
                    v-model="tech.notes" 
                    placeholder="e.g., Responsible for fiber splicing, familiar with this area, etc."
                    size="lg"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div class="mt-4 p-4 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg border border-indigo-200 dark:border-indigo-700">
            <div class="flex items-start gap-2">
              <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <div class="text-sm text-indigo-900 dark:text-indigo-100">
                <p class="font-semibold mb-1">Team Requirements:</p>
                <ul class="list-disc list-inside space-y-1 text-indigo-800 dark:text-indigo-200">
                  <li>At least one <strong>Senior</strong> technician is required</li>
                  <li>Primary technician will be the main point of contact</li>
                  <li>You can assign multiple technicians for complex installations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- MikroTik Provisioning Section -->
        <div class="bg-gradient-to-br from-cyan-50 to-blue-50 dark:bg-gradient-to-br dark:from-cyan-900/30 dark:to-blue-900/30 p-6 rounded-xl border-2 border-cyan-100 dark:border-cyan-800 shadow-sm">
          <div class="mb-5">
            <h3 class="text-xl font-bold text-cyan-900 dark:text-cyan-100 flex items-center gap-2">
              <div class="bg-cyan-500 p-2 rounded-lg">
                <UIcon name="i-heroicons-server-stack" class="text-white w-5 h-5" />
              </div>
              MikroTik Auto-Provisioning
              <span class="text-xs font-normal text-gray-600 dark:text-gray-400 ml-2">(Optional)</span>
            </h3>
            <p class="text-sm text-cyan-700 dark:text-cyan-300 mt-1">Automatically configure customer on RouterOS/Winbox</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                MAC Address
              </label>
              <UInput 
                v-model="state.mac_address" 
                placeholder="AA:BB:CC:DD:EE:FF"
                size="lg"
                icon="i-heroicons-signal"
              />
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Customer device MAC address for provisioning</p>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                Max Bandwidth Limit
              </label>
              <UInput 
                v-model="state.max_limit" 
                placeholder="10M/10M"
                size="lg"
                icon="i-heroicons-arrow-trending-up"
              />
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Format: Download/Upload (e.g., 10M/10M, 50M/50M)</p>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                PSB Date
              </label>
              <UInput 
                v-model="state.psb_date" 
                type="date"
                size="lg"
              />
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Provisioning service begin date</p>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                PSB Time
              </label>
              <UInput 
                v-model="state.psb_time" 
                type="time"
                size="lg"
              />
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Service activation time</p>
            </div>
            
            <!-- Provisioning Toggle Switches -->
            <div class="md:col-span-2 space-y-3 mt-2">
              <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-cyan-200 dark:border-cyan-700">
                <div class="flex items-center gap-3">
                  <div class="bg-cyan-100 dark:bg-cyan-900/50 p-2 rounded-lg">
                    <UIcon name="i-heroicons-bolt" class="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <label for="auto_provision" class="text-sm font-bold text-gray-900 dark:text-gray-100 cursor-pointer">
                      Enable Auto-Provisioning
                    </label>
                    <p class="text-xs text-gray-600 dark:text-gray-400">Automatically configure customer on MikroTik after creation</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  v-model="state.auto_provision" 
                  id="auto_provision"
                  class="w-6 h-6 text-cyan-600 bg-gray-100 border-2 border-gray-300 rounded focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                />
              </div>
              
              <div 
                class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border-2 transition-all"
                :class="state.auto_provision ? 'border-orange-200 dark:border-orange-700' : 'border-gray-200 dark:border-gray-700 opacity-50'"
              >
                <div class="flex items-center gap-3">
                  <div class="bg-orange-100 dark:bg-orange-900/50 p-2 rounded-lg">
                    <UIcon name="i-heroicons-eye" class="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <label for="dry_run" class="text-sm font-bold text-gray-900 dark:text-gray-100 cursor-pointer" :class="!state.auto_provision && 'opacity-50'">
                      Dry Run Mode
                    </label>
                    <p class="text-xs text-gray-600 dark:text-gray-400" :class="!state.auto_provision && 'opacity-50'">
                      Preview commands without executing (test mode)
                    </p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  v-model="state.dry_run" 
                  id="dry_run"
                  class="w-6 h-6 text-orange-600 bg-gray-100 border-2 border-gray-300 rounded focus:ring-2 focus:ring-orange-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="!state.auto_provision"
                />
              </div>
            </div>
            
            <!-- Status Alert -->
            <div v-if="state.auto_provision" class="md:col-span-2 mt-2">
              <div 
                class="p-4 rounded-lg border-2 flex items-start gap-3"
                :class="state.dry_run 
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700' 
                  : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'"
              >
                <UIcon 
                  :name="state.dry_run ? 'i-heroicons-eye' : 'i-heroicons-check-badge'" 
                  class="w-6 h-6 flex-shrink-0"
                  :class="state.dry_run ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'"
                />
                <div>
                  <p class="font-bold text-sm" :class="state.dry_run ? 'text-orange-900 dark:text-orange-100' : 'text-green-900 dark:text-green-100'">
                    {{ state.dry_run ? '🔍 Dry Run Mode Active' : '⚡ Live Provisioning Mode' }}
                  </p>
                  <p class="text-sm mt-1" :class="state.dry_run ? 'text-orange-800 dark:text-orange-200' : 'text-green-800 dark:text-green-200'">
                    <span v-if="state.dry_run">
                      Commands will be <strong>generated and displayed</strong> in the browser console but <strong>not executed</strong> on MikroTik. Use this to preview what will happen.
                    </span>
                    <span v-else>
                      Customer will be <strong>automatically provisioned</strong> on MikroTik RouterOS immediately after installation creation. Queue rules and IP bindings will be created.
                    </span>
                  </p>
                </div>
              </div>
            </div>
            
            <div v-else class="md:col-span-2 mt-2">
              <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 flex items-start gap-3">
                <UIcon name="i-heroicons-power" class="w-6 h-6 text-gray-400 flex-shrink-0" />
                <div>
                  <p class="font-bold text-sm text-gray-900 dark:text-gray-100">
                    Auto-Provisioning Disabled
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Enable auto-provisioning to automatically configure this customer on MikroTik RouterOS. Manual provisioning will be required otherwise.
                  </p>
                </div>
              </div>
            </div>
          </div>
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
        <div class="sticky bottom-0 -mx-6 -mb-6 p-6 bg-gradient-to-r from-white to-blue-50 dark:from-gray-800 dark:to-blue-950 border-t-2 border-blue-200 dark:border-blue-800 shadow-lg">
          <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
            <!-- Requirements Check -->
            <div class="text-sm text-gray-700 dark:text-gray-300">
              <div class="flex items-center gap-2">
                <div v-if="!state.customer_id || state.technicians.length === 0 || !state.assets_id" class="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
                  <span class="font-semibold">Please complete required fields</span>
                </div>
                <div v-else class="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5" />
                  <span class="font-semibold">Ready to submit</span>
                </div>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex gap-3 w-full sm:w-auto">
              <UButton 
                type="button" 
                color="gray" 
                variant="outline"
                size="xl"
                @click="$emit('close')"
                class="flex-1 sm:flex-initial"
              >
                <UIcon name="i-heroicons-x-circle" class="mr-2 w-5 h-5" />
                Cancel
              </UButton>
              <UButton 
                type="submit" 
                color="blue"
                size="xl"
                :loading="state.loading"
                :disabled="!state.customer_id || state.technicians.length === 0 || !state.assets_id"
                class="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <UIcon name="i-heroicons-document-check" class="mr-2 w-5 h-5" />
                <span class="font-bold">Create Installation Report</span>
              </UButton>
            </div>
          </div>
        </div>
      </UForm>
    </div>
  </UModal>
</template>
