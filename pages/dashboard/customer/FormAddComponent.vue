<script setup lang="ts">
import { object, string, type InferType } from "yup";
import type { FormSubmitEvent } from "#ui/types";
import { customerAdminApi } from "@/api/admin/customer";
import { areaAdminApi } from "@/api/admin/area";
// Removed internet package and network device imports - handled during installation
import { userManagementAdminApi } from "@/api/admin/user-management";
import { companyAdminApi } from "@/api/admin/company";
import { useNotification } from '@/composables/useNotification';
import LucideIcon from '@/components/LucideIcon.vue';

const props = defineProps({
  isEdit: {
    type: Boolean,
    required: false
  },
  data: {
    type: Object,
    default: () => ({
      id: {
        type: String,
        default: "",
      },
      type_of_service: {
        type: String,
        default: ""
      },
      name: {
        type: String,
        default: ""
      },
      company_id: {
        type: String,
        default: ""
      },
      gender: {
        type: String,
        default: ""
      },
      card_identition: {
        type: String,
        default: ""
      },
      no_identition: {
        type: Number,
        default: 0
      },
      area_id: {
        type: String,
        default: ""
      },
      phone: {
        type: String,
        default: ""
      },
      address: {
        type: String,
        default: ""
      },
      latitude: {
        type: Number,
        default: 0,
      },
      longitude: {
        type: Number,
        default: 0
      },
      password: {
        type: String,
        default: ""
      },
      internet_package: {
        type: String,
        default: ""
      },

      job: {
        type: String,
        default: ""
      },

    })
  }
})



const schema = object({
  name: string().required(),
  alias: string().optional(),
  address: string().required(),
  area_id: string().required(),
  phone: string().required(),
  latitude: string().required(),
  longitude: string().required(),
  service_request_date: string().required(),
  sales_representative_id: string().optional(),
  company_id: string().optional(),
  is_internet: string().optional(),
  is_collaborator: string().optional(),
});

type Schema = InferType<typeof schema>;

const notification = useNotification();

const state = reactive({
  name: "",
  alias: "",
  address: "",
  area_id: "",
  phone: "",
  latitude: 0,
  longitude: 0,
  service_request_date: "",
  sales_representative_id: "",
  company_id: "",
  is_internet: "yes",
  is_collaborator: "no",
});

// Network device state removed - will be handled during installation report creation

watch(
  () => props.isEdit,
  async (newValue) => {
    if (newValue) {
      state.name = props.data.name,
        state.alias = props.data.alias || "",
        state.address = props.data.address,
        state.area_id = props.data.area_id,
        state.phone = props.data.phone,
        state.latitude = props.data.latitude,
        state.longitude = props.data.longitude,
        state.service_request_date = props.data.service_request_date || "",
        state.sales_representative_id = props.data.sales_representative_id || "",
        state.company_id = props.data.company_id || "",
        state.is_internet = props.data.is_internet || "yes",
        state.is_collaborator = props.data.is_collaborator || "no"
      
      // Network device data will be handled during installation report creation
    }
  },
  { immediate: true }
)
const emit = defineEmits(["success", "close"]);

function onSuccess() {
  emit("success");
}

// Close modal function
function closeModal() {
  // Close modal directly without confirmation
  useModal().close();
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  console.log("Form submitted with data:", state);
  // Do something with event.data
  if (props.isEdit) {
    try {
      const response = await customerAdminApi().editCustomer(props.data.id, state);
      notification.success('Success', response.message);
      onSuccess();
    } catch (error: any) {
      notification.error('Error', error.message || 'Failed to update customer');
    }
  } else {
    try {
      // Create customer - network device will be created during installation
      const customerResponse = await customerAdminApi().createCustomer(state);
      notification.success('Success', customerResponse.message);
      onSuccess();
    } catch (error: any) {
      notification.error('Error', error.message || 'Failed to create customer');
    }
  }

}

function onMarkerDrag(e: any) {
  const latlng = e.target.getLatLng();
  state.latitude = latlng.lat;
  state.longitude = latlng.lng;
  reverseGeocode(latlng.lat, latlng.lng);
}

async function reverseGeocode(lat: number, lng: number) {
  try {
    const api = useApiHost();
    const response = await fetch(
      `${api}/api/admin/geocoding/reverse-geocode?lat=${lat}&lng=${lng}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useCookie("token").value}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    if (result.success && result.data) {
      state.address = result.data.display_name || "Address not found";
    } else {
      state.address = "Address not found";
    }
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    state.address = "Error fetching address";
  }
}

async function moveToMyLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        state.latitude = latitude;
        state.longitude = longitude;
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        console.error("Error getting location:", error);
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
}


const areas = ref<{label: string, value: string}[]>([]);
const salesRepresentatives = ref<{label: string, value: string}[]>([]);
const companies = ref<{label: string, value: string}[]>([]);

async function getDataOptions() {
  areaAdminApi().getAllAreas().then((response) => {
    areas.value = response.data.map((value: any, index: number) => ({
      label: value.name_city + "-" + value.name_subdistrict + "-" + value.name_village,
      value: value.id
    }))
  })

  // Get sales representatives (users with SUPERADMIN role - ADMIN role no longer exists)
  userManagementAdminApi().getAllUsers({ query: { role: "SUPERADMIN" } }).then((response) => {
    salesRepresentatives.value = response.data.map((value: any, index: number) => ({
      label: value.name,
      value: value.id
    }))
  })

  // Get companies
  companyAdminApi().getAllCompanies().then((response) => {
    companies.value = response.data.map((value: any, index: number) => ({
      label: value.name,
      value: value.id
    }))
  })
}
await getDataOptions()

// Mark this modal's dialog panel with a unique identifier
onMounted(() => {
  nextTick(() => {
    // Find the HeadlessUI dialog panel that contains our customer form content
    const observer = new MutationObserver(() => {
      const dialogPanels = document.querySelectorAll('[id^="headlessui-dialog-panel"]')
      dialogPanels.forEach((panel) => {
        // Check if this panel contains our customer form content
        if (panel.querySelector('.customer-form-content')) {
          // Add unique attribute to identify this modal
          panel.setAttribute('data-customer-form-modal', 'true')
        }
      })
    })
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
    
    // Also check immediately
    const dialogPanels = document.querySelectorAll('[id^="headlessui-dialog-panel"]')
    dialogPanels.forEach((panel) => {
      if (panel.querySelector('.customer-form-content')) {
        panel.setAttribute('data-customer-form-modal', 'true')
      }
    })
    
    // Cleanup observer when component unmounts
    onUnmounted(() => {
      observer.disconnect()
    })
  })
})

</script>

<style scoped>
/* CRITICAL: Override HeadlessUI dialog panel max-width (32rem from sm:max-w-lg) */
/* ONLY target HeadlessUI dialog panels that are ancestors of this customer form modal */
.customer-form-modal :deep([id^="headlessui-dialog-panel"]),
:deep(.customer-form-modal ~ [id^="headlessui-dialog-panel"]) {
  max-width: none !important;
  width: 95vw !important;
}

/* Specifically override the sm:max-w-lg Tailwind class that sets max-width: 32rem */
/* Only for this modal's dialog panel */
@media (min-width: 640px) {
  .customer-form-modal :deep([id^="headlessui-dialog-panel"].sm\:max-w-lg),
  .customer-form-modal :deep([id^="headlessui-dialog-panel"][class*="max-w-lg"]),
  :deep(.customer-form-modal ~ [id^="headlessui-dialog-panel"].sm\:max-w-lg),
  :deep(.customer-form-modal ~ [id^="headlessui-dialog-panel"][class*="max-w-lg"]) {
    max-width: none !important;
    width: 95vw !important;
  }
}

/* Alternative: Target any dialog panel that contains our customer form content */
:deep([id^="headlessui-dialog-panel"]:has(.customer-form-content)) {
  max-width: none !important;
  width: 95vw !important;
}

@media (min-width: 640px) {
  :deep([id^="headlessui-dialog-panel"]:has(.customer-form-content).sm\:max-w-lg),
  :deep([id^="headlessui-dialog-panel"]:has(.customer-form-content)[class*="max-w-lg"]) {
    max-width: none !important;
    width: 95vw !important;
  }
}

/* Force modal to be wider - override UModal defaults */
:deep(.ui-modal),
:deep([class*="ui-modal"]) {
  max-width: 95vw !important;
  width: 95vw !important;
}

:deep(.ui-modal > div),
:deep(.ui-modal > .ui-card) {
  max-width: 95vw !important;
  width: 100% !important;
}

/* Ensure modal content container is full width */
:deep(.ui-modal .max-w-\[95vw\]) {
  max-width: 95vw !important;
  width: 95vw !important;
}

/* Customer Type Cards - ensure they don't shrink */
:deep(.grid.grid-cols-1.lg\\:grid-cols-2) {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (min-width: 1024px) {
  :deep(.grid.grid-cols-1.lg\\:grid-cols-2) {
    grid-template-columns: repeat(2, minmax(250px, 1fr));
  }
}

/* Responsive optimizations - modal uses max-w-[95vw] from template */

@media (max-width: 640px) {
  /* Improve touch targets */
  .grid-cols-1 > * {
    min-height: 44px; /* iOS recommended touch target size */
  }
  
  /* Optimize map for mobile */
  .leaflet-container {
    touch-action: manipulation;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  
  /* Smooth scrolling */
  .overflow-y-auto {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }
  
  /* Prevent zoom on input focus (iOS) */
  input[type="text"],
  input[type="tel"],
  input[type="number"],
  input[type="date"],
  select {
    font-size: 16px;
  }
  
  /* Mobile-specific map height */
  .leaflet-container {
    height: 250px !important;
  }
}

/* Desktop optimizations */
@media (min-width: 1024px) {
  /* Larger map for desktop */
  .leaflet-container {
    height: 450px !important;
  }
  
  /* Better spacing for desktop */
  .space-y-6 > * + * {
    margin-top: 1.5rem;
  }
  
  /* Desktop form spacing */
  .gap-6 {
    gap: 1.5rem;
  }
}

/* Tablet and desktop - UModal handles width via template props */

/* Performance optimizations */
.leaflet-container {
  will-change: transform;
  transform: translateZ(0);
}

/* Smooth animations */
.transition-all {
  transition: all 0.2s ease-in-out;
}

/* Better focus states for accessibility */
button:focus,
input:focus,
select:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Loading states */
.loading {
  opacity: 0.7;
  pointer-events: none;
}

/* Responsive typography */
@media (max-width: 640px) {
  .text-lg {
    font-size: 1rem;
  }
  
  .text-2xl {
    font-size: 1.25rem;
  }
}

/* Card shadows and borders for better visual hierarchy - soft shadows */
.bg-white {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.04);
}

/* Ensure modal background is white */
.customer-form-modal :deep(.ui-modal),
.customer-form-modal :deep([class*="ui-modal"]) {
  background-color: #FFFFFF !important;
}

.customer-form-modal :deep(.ui-modal > div),
.customer-form-modal :deep(.ui-modal > .ui-card) {
  background-color: #FFFFFF !important;
}

/* Perfect column alignment */
.grid-cols-1.md\\:grid-cols-2 > div {
  display: flex;
  flex-direction: column;
}

/* Consistent label spacing */
.space-y-1 > label {
  margin-bottom: 0.25rem;
  font-weight: 500;
  line-height: 1.5;
}

/* Ensure all form elements have consistent height */
.space-y-1 input,
.space-y-1 select,
.space-y-1 [role="combobox"] {
  min-height: 42px;
}

/* Perfect grid alignment */
.grid.grid-cols-1.md\\:grid-cols-2 {
  align-items: start;
}

/* Consistent spacing for form groups */
.space-y-1 {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

/* Single column layout spacing */
.space-y-4 > * + * {
  margin-top: 1rem;
}

/* Ensure proper spacing between form sections */
.space-y-4 {
  display: flex;
  flex-direction: column;
}

/* Custom input styling - white background, clean borders */
:deep(.customer-input input),
:deep(.customer-input) {
  background-color: #F9FAFB !important;
  border-color: #D1D5DB !important;
  color: #000000 !important;
}

:deep(.customer-input input:focus),
:deep(.customer-input:focus-within) {
  border-color: #2563EB !important;
  outline: none !important;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
}

:deep(.customer-input input::placeholder) {
  color: #6B7280 !important;
}

/* Custom select menu styling - clean white background */
:deep(.customer-select button),
:deep(.customer-select [role="combobox"]) {
  background-color: #FFFFFF !important;
  border-color: #D1D5DB !important;
  color: #000000 !important;
}

:deep(.customer-select button:focus),
:deep(.customer-select [role="combobox"]:focus),
:deep(.customer-select:focus-within button) {
  border-color: #2563EB !important;
  outline: none !important;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
}

/* Select menu dropdown items */
:deep(.customer-select [role="option"]) {
  color: #000000 !important;
}

:deep(.customer-select [role="option"]:hover) {
  background-color: #F9FAFB !important;
}

/* Form labels - ensure high contrast */
label {
  color: #000000 !important;
}

/* Ensure all text is readable on white background */
.customer-form-content {
  color: #000000 !important;
}

/* UFormGroup label styling */
:deep(.customer-form-content [class*="UFormGroup"] label),
:deep(.customer-form-content [class*="form-group"] label) {
  color: #000000 !important;
  font-weight: 500 !important;
}

/* Close button styling - make it more visible */
.close-button {
  border: 2px solid #D1D5DB !important;
  background-color: #FFFFFF !important;
  color: #374151 !important;
  min-width: 40px !important;
  min-height: 40px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 8px !important;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
  transition: all 0.2s ease-in-out !important;
}

.close-button:hover {
  background-color: #FEF2F2 !important;
  border-color: #F87171 !important;
  color: #DC2626 !important;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1) !important;
  transform: scale(1.05) !important;
}

.close-button:active {
  transform: scale(0.95) !important;
}

.close-button:focus {
  outline: 2px solid #2563EB !important;
  outline-offset: 2px !important;
}
</style>

<style>
/* Global styles for HeadlessUI dialog panel - ONLY affects customer form modal */
/* Target dialog panel with data-customer-form-modal attribute (added via JavaScript) */
[id^="headlessui-dialog-panel"][data-customer-form-modal="true"] {
  max-width: none !important;
  width: 95vw !important;
}

/* Override sm:max-w-lg class specifically (removes 32rem constraint) */
/* ONLY for customer form modal */
@media (min-width: 640px) {
  [id^="headlessui-dialog-panel"][data-customer-form-modal="true"].sm\:max-w-lg,
  [id^="headlessui-dialog-panel"][data-customer-form-modal="true"][class*="max-w-lg"] {
    max-width: none !important;
    width: 95vw !important;
  }
}
</style>

<template>
  <UModal :ui="{ width: 'w-[95vw]', height: 'h-auto max-h-[95vh] overflow-y-auto', background: 'bg-white' }" class="customer-form-modal">
    <div class="w-full max-w-none mx-auto p-4 lg:p-8 overflow-y-auto max-h-[95vh] customer-form-content bg-white">
      <!-- Modal Header -->
      <div class="flex items-center justify-between mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
        <h1 class="text-xl font-bold text-black">
          {{ props.isEdit ? "Edit" : "Add New" }} Customer
        </h1>
        <UButton 
          @click="closeModal" 
          variant="outline" 
          color="gray"
          size="md"
          class="close-button"
        >
          <LucideIcon name="x" :size="22" />
        </UButton>
      </div>

      <UForm :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
        <!-- Desktop: Two-column layout, Mobile: Single column -->
        <div class="flex flex-col md:flex-row gap-6">
          <!-- Left Column: Customer & Business Information -->
          <div class="flex-1 space-y-6">
            <!-- Customer Information Section -->
            <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 class="text-xl font-bold text-black mb-3 flex items-center gap-2">
                <LucideIcon name="user" :size="20" class="text-blue-600" />
                Customer Information
              </h3>
              
               <div class="space-y-4">
                 <!-- Full width fields -->
                 <UFormGroup name="name">
                   <template #label>
                     <div class="flex items-center gap-2">
                       <LucideIcon name="user" :size="16" class="text-gray-600" />
                       <span class="text-black font-medium">Nama Pelanggan</span>
                     </div>
                   </template>
                   <UInput 
                     v-model="state.name" 
                     placeholder="Masukkan nama lengkap pelanggan"
                     class="w-full customer-input"
                   />
                 </UFormGroup>
                 
                 <UFormGroup name="area_code">
                   <template #label>
                     <div class="flex items-center gap-2">
                       <LucideIcon name="map" :size="16" class="text-gray-600" />
                       <span class="text-black font-medium">Area Code</span>
                     </div>
                   </template>
                   <USelectMenu 
                     v-model="state.area_id" 
                     :options="areas" 
                     value-attribute="value" 
                     option-attribute="label" 
                     placeholder="Pilih area"
                     class="w-full customer-select"
                     searchable
                   />
                 </UFormGroup>
                 
                 <!-- Customer Type Selection -->
                 <div class="space-y-6 mt-6 pt-6 border-t border-gray-200">
                   <h4 class="text-xl font-bold text-black mb-3 flex items-center gap-2">
                     <LucideIcon name="tag" :size="20" class="text-purple-600" />
                     Customer Type
                   </h4>
                   
                   <!-- Customer Type Cards -->
                   <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <!-- Internet Customer Card -->
                     <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                       <div class="flex items-start gap-3 mb-4">
                         <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                           <LucideIcon name="wifi" :size="28" class="text-white" />
                         </div>
                         <div class="flex-1 overflow-hidden">
                           <h5 class="text-lg font-semibold text-black leading-tight whitespace-nowrap">Internet Customer</h5>
                           <p class="text-sm text-gray-600 mt-1 break-words">Regular internet service users</p>
                         </div>
                       </div>
                       <UFormGroup name="is_internet" class="mb-0">
                         <template #label>
                           <span class="text-black font-medium">Status</span>
                         </template>
                         <USelectMenu 
                           v-model="state.is_internet" 
                           :options="[
                             { label: 'Yes', value: 'yes' },
                             { label: 'No', value: 'no' }
                           ]" 
                           value-attribute="value" 
                           option-attribute="label" 
                           placeholder="Select status"
                           class="w-full customer-select"
                         />
                       </UFormGroup>
                     </div>
                     
                     <!-- Collaborator Card -->
                     <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                       <div class="flex items-start gap-3 mb-4">
                         <div class="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                           <LucideIcon name="handshake" :size="28" class="text-white" />
                         </div>
                         <div class="flex-1 overflow-hidden">
                           <h5 class="text-lg font-semibold text-black leading-tight whitespace-nowrap">Collaborator</h5>
                           <p class="text-sm text-gray-600 mt-1 break-words">Business partners & resellers</p>
                         </div>
                       </div>
                       <UFormGroup name="is_collaborator" class="mb-0">
                         <template #label>
                           <span class="text-black font-medium">Status</span>
                         </template>
                         <USelectMenu 
                           v-model="state.is_collaborator" 
                           :options="[
                             { label: 'Yes', value: 'yes' },
                             { label: 'No', value: 'no' }
                           ]" 
                           value-attribute="value" 
                           option-attribute="label" 
                           placeholder="Select status"
                           class="w-full customer-select"
                         />
                       </UFormGroup>
                     </div>
                   </div>
                   
                   <!-- Customer Type Info -->
                   <div class="bg-gray-50 rounded-xl p-6 border border-gray-200">
                     <div class="flex items-start gap-3">
                       <LucideIcon name="info" :size="24" class="text-blue-600 mt-1 flex-shrink-0" />
                       <div class="text-sm text-gray-800">
                         <p class="font-semibold mb-3 text-base text-black">Customer Type Guidelines:</p>
                         <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div class="space-y-2">
                             <div class="flex items-start gap-2">
                               <LucideIcon name="wifi" :size="16" class="text-blue-600 mt-0.5 flex-shrink-0" />
                               <div>
                                 <p class="font-medium text-black">Internet Customer</p>
                                 <p class="text-xs text-gray-600">Regular customers who use internet services</p>
                               </div>
                             </div>
                           </div>
                           <div class="space-y-2">
                             <div class="flex items-start gap-2">
                               <LucideIcon name="handshake" :size="16" class="text-purple-600 mt-0.5 flex-shrink-0" />
                               <div>
                                 <p class="font-medium text-black">Collaborator</p>
                                 <p class="text-xs text-gray-600">Business partners, resellers, or service providers</p>
                               </div>
                             </div>
                           </div>
                         </div>
                         <div class="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                           <p class="text-xs font-medium text-gray-700">
                             💡 <strong>Note:</strong> A customer can be both internet customer and collaborator
                           </p>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 <!-- Single column layout -->
                 <div class="space-y-4 mt-6 pt-6 border-t border-gray-200">
                   <div class="space-y-1">
                     <label class="block text-sm font-medium text-black mb-1 flex items-center gap-2">
                       <LucideIcon name="user-circle" :size="16" class="text-gray-600" />
                       <span>Panggilan / Samaran</span>
                     </label>
                     <UInput 
                       v-model="state.alias" 
                       placeholder="Optional nickname"
                       class="w-full customer-input"
                     />
                   </div>
                   
                   <div class="space-y-1">
                     <label class="block text-sm font-medium text-black mb-1 flex items-center gap-2">
                       <LucideIcon name="phone" :size="16" class="text-gray-600" />
                       <span>No.HP Pelanggan</span>
                     </label>
                     <UInput 
                       v-model="state.phone" 
                       placeholder="Masukkan nomor HP pelanggan"
                       type="tel"
                       class="w-full customer-input"
                     />
                   </div>
                   
                   <div class="space-y-1">
                     <label class="block text-sm font-medium text-black mb-1 flex items-center gap-2">
                       <LucideIcon name="calendar" :size="16" class="text-gray-600" />
                       <span>Tgl. Permintaan PSB</span>
                     </label>
                     <UInput 
                       v-model="state.service_request_date" 
                       type="date"
                       class="w-full customer-input"
                     />
                   </div>
                 </div>
               </div>
            </div>
            
            <!-- Business Information Section -->
            <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 class="text-xl font-bold text-black mb-3 flex items-center gap-2">
                <LucideIcon name="building-2" :size="20" class="text-green-600" />
                Business Information
              </h3>
              
               <div class="space-y-4">
                 <div class="space-y-1">
                   <label class="block text-sm font-medium text-black mb-1 flex items-center gap-2">
                     <LucideIcon name="users" :size="16" class="text-gray-600" />
                     <span>Sales Representative</span>
                   </label>
                   <USelectMenu 
                     v-model="state.sales_representative_id" 
                     :options="salesRepresentatives" 
                     value-attribute="value"
                     option-attribute="label"
                     placeholder="Pilih sales representative"
                     class="w-full customer-select"
                     searchable
                   />
                 </div>
                 
                 <div class="space-y-1">
                   <label class="block text-sm font-medium text-black mb-1 flex items-center gap-2">
                     <LucideIcon name="building-office" :size="16" class="text-gray-600" />
                     <span>Company</span>
                   </label>
                   <USelectMenu 
                     v-model="state.company_id" 
                     :options="companies" 
                     value-attribute="value"
                     option-attribute="label"
                     placeholder="Pilih company (optional)"
                     class="w-full customer-select"
                     searchable
                   />
                 </div>
               </div>
            </div>
          </div>
          
          <!-- Right Column: Location & Map -->
          <div class="flex-1">
            <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 h-fit">
              <h3 class="text-xl font-bold text-black mb-3 flex items-center gap-2">
                <LucideIcon name="map-pin" :size="20" class="text-red-600" />
                Location & Address
              </h3>
              
              <!-- Map Container -->
              <div class="mb-6">
                <LMap 
                  style="height: 450px; width: 100%;" 
                  :zoom="6" 
                  :center="[state.latitude, state.longitude]"
                  :use-global-leaflet="false"
                  class="rounded-lg overflow-hidden border border-gray-200 shadow-sm"
                >
                  <LTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LMarker 
                    ref="map" 
                    :lat-lng="[state.latitude, state.longitude]" 
                    draggable 
                    @dragend="onMarkerDrag" 
                  />
                  <LControl position="bottomleft">
                    <UButton 
                      @click="moveToMyLocation" 
                      size="sm"
                      color="blue"
                      class="mb-2 shadow-sm"
                    >
                      <template #leading>
                        <LucideIcon name="navigation" :size="16" />
                      </template>
                      My Position
                    </UButton>
                  </LControl>
                </LMap>
              </div>
              
              <!-- Address Field -->
              <UFormGroup name="address" class="mb-6">
                <template #label>
                  <div class="flex items-center gap-2">
                    <LucideIcon name="map-pin" :size="16" class="text-gray-600" />
                    <span class="text-black font-medium">Address</span>
                  </div>
                </template>
                <UInput 
                  v-model="state.address" 
                  placeholder="Address will be auto-filled from map"
                  class="w-full customer-input"
                  readonly
                />
              </UFormGroup>
              
              <!-- Coordinates -->
              <UFormGroup name="coordinates">
                <template #label>
                  <div class="flex items-center gap-2">
                    <LucideIcon name="navigation" :size="16" class="text-gray-600" />
                    <span class="text-black font-medium">Coordinates</span>
                  </div>
                </template>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-black mb-1 flex items-center gap-2">
                      <LucideIcon name="map-pin" :size="14" class="text-gray-500" />
                      <span>Latitude</span>
                    </label>
                    <UInput 
                      v-model="state.latitude" 
                      placeholder="Latitude" 
                      type="number" 
                      step="any"
                      class="w-full customer-input"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-black mb-1 flex items-center gap-2">
                      <LucideIcon name="map-pin" :size="14" class="text-gray-500" />
                      <span>Longitude</span>
                    </label>
                    <UInput 
                      v-model="state.longitude" 
                      placeholder="Longitude" 
                      type="number" 
                      step="any"
                      class="w-full customer-input"
                    />
                  </div>
                </div>
              </UFormGroup>
            </div>
          </div>
        </div>
        
        <!-- Submit Button -->
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div class="text-sm text-gray-700 flex items-center gap-1">
            <LucideIcon name="info" :size="16" />
            <span>All fields marked with * are required</span>
          </div>
          <div class="flex gap-3 w-full sm:w-auto">
            <UButton 
              type="button" 
              @click="closeModal" 
              variant="outline" 
              color="gray"
              size="lg"
              class="flex-1 sm:flex-initial border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <template #leading>
                <LucideIcon name="x" :size="16" />
              </template>
              Cancel
            </UButton>
            <UButton 
              type="submit" 
              color="blue"
              size="lg"
              class="flex-1 sm:flex-initial"
            >
              <template #leading>
                <LucideIcon name="check" :size="16" />
              </template>
              Submit
            </UButton>
          </div>
        </div>
      </UForm>
    </div>
  </UModal>
</template>
