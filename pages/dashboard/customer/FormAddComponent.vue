<script setup lang="ts">
import { object, string, type InferType } from "yup";
import type { FormSubmitEvent } from "#ui/types";
import { customerAdminApi } from "@/api/admin/customer";
import { areaAdminApi } from "@/api/admin/area";
// Removed internet package and network device imports - handled during installation
import { userManagementAdminApi } from "@/api/admin/user-management";
import { companyAdminApi } from "@/api/admin/company";
import { useNotification } from '@/composables/useNotification';

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
        state.company_id = props.data.company_id || ""
      
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

  // Get sales representatives (users with specific role)
  userManagementAdminApi().getAllUsers({ query: { role: "ADMIN" } }).then((response) => {
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


</script>

<style scoped>
/* Responsive optimizations */
@media (max-width: 640px) {
  .max-w-7xl {
    max-width: 100%;
    margin: 0;
    padding: 0.5rem;
  }
  
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
    height: 300px !important;
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

/* Card shadows and borders for better visual hierarchy */
.bg-white {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.dark .bg-gray-800 {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2);
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
</style>

<template>
  <UModal :ui="{ width: 'w-full max-w-6xl', height: 'h-auto max-h-[90vh] overflow-y-auto' }">
    <div class="w-full max-w-6xl mx-auto p-4 lg:p-6 overflow-y-auto max-h-[90vh]">
      <!-- Modal Header -->
      <div class="flex items-center justify-between mb-4 p-2 sm:p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
        <h1 class="text-lg sm:text-2xl font-bold text-white">
          {{ props.isEdit ? "Edit" : "Add New" }} Customer
        </h1>
        <UButton 
          @click="closeModal" 
          variant="ghost" 
          color="white"
          size="sm"
          class="text-white hover:bg-white/20"
        >
          <UIcon name="i-lucide-x" class="w-5 h-5" />
        </UButton>
      </div>

      <UForm :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
        <!-- Desktop: Two-column layout, Mobile: Single column -->
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- Left Column: Customer & Business Information -->
          <div class="flex-1 space-y-6">
            <!-- Customer Information Section -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <UIcon name="i-lucide-user" class="w-5 h-5 text-blue-600" />
                Customer Information
              </h3>
              
               <div class="space-y-4">
                 <!-- Full width fields -->
                 <UFormGroup label="Nama Pelanggan" name="name">
                   <UInput 
                     v-model="state.name" 
                     placeholder="Masukkan nama lengkap pelanggan"
                     class="w-full"
                   />
                 </UFormGroup>
                 
                 <UFormGroup label="Area Code" name="area_code">
                   <USelectMenu 
                     v-model="state.area_id" 
                     :options="areas" 
                     value-attribute="value" 
                     option-attribute="label" 
                     placeholder="Pilih area"
                     class="w-full"
                     searchable
                   />
                 </UFormGroup>
                 
                 <!-- Single column layout -->
                 <div class="space-y-4">
                   <div class="space-y-1">
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                       Panggilan / Samaran
                     </label>
                     <UInput 
                       v-model="state.alias" 
                       placeholder="Optional nickname"
                       class="w-full"
                     />
                   </div>
                   
                   <div class="space-y-1">
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                       No.HP Pelanggan
                     </label>
                     <UInput 
                       v-model="state.phone" 
                       placeholder="Masukkan nomor HP pelanggan"
                       type="tel"
                       class="w-full"
                     />
                   </div>
                   
                   <div class="space-y-1">
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                       Tgl. Permintaan PSB
                     </label>
                     <UInput 
                       v-model="state.service_request_date" 
                       type="date"
                       class="w-full"
                     />
                   </div>
                 </div>
               </div>
            </div>
            
            <!-- Business Information Section -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <UIcon name="i-lucide-building-2" class="w-5 h-5 text-green-600" />
                Business Information
              </h3>
              
               <div class="space-y-4">
                 <div class="space-y-1">
                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                     Sales Representative
                   </label>
                   <USelectMenu 
                     v-model="state.sales_representative_id" 
                     :options="salesRepresentatives" 
                     value-attribute="value"
                     option-attribute="label"
                     placeholder="Pilih sales representative"
                     class="w-full"
                     searchable
                   />
                 </div>
                 
                 <div class="space-y-1">
                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                     Company
                   </label>
                   <USelectMenu 
                     v-model="state.company_id" 
                     :options="companies" 
                     value-attribute="value"
                     option-attribute="label"
                     placeholder="Pilih company (optional)"
                     class="w-full"
                     searchable
                   />
                 </div>
               </div>
            </div>
          </div>
          
          <!-- Right Column: Location & Map -->
          <div class="flex-1">
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-fit">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <UIcon name="i-lucide-map-pin" class="w-5 h-5 text-red-600" />
                Location & Address
              </h3>
              
              <!-- Map Container -->
              <div class="mb-6">
                <LMap 
                  style="height: 300px; width: 100%;" 
                  :zoom="6" 
                  :center="[state.latitude, state.longitude]"
                  :use-global-leaflet="false"
                  class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
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
                      class="mb-2"
                    >
                      <UIcon name="i-lucide-map-pin" class="w-4 h-4 mr-1" />
                      My Position
                    </UButton>
                  </LControl>
                </LMap>
              </div>
              
              <!-- Address Field -->
              <UFormGroup label="Address" name="address" class="mb-6">
                <UInput 
                  v-model="state.address" 
                  placeholder="Address will be auto-filled from map"
                  class="w-full"
                  readonly
                />
              </UFormGroup>
              
              <!-- Coordinates -->
              <UFormGroup label="Coordinates" name="coordinates">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label>
                    <UInput 
                      v-model="state.latitude" 
                      placeholder="Latitude" 
                      type="number" 
                      step="any"
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
                    <UInput 
                      v-model="state.longitude" 
                      placeholder="Longitude" 
                      type="number" 
                      step="any"
                      class="w-full"
                    />
                  </div>
                </div>
              </UFormGroup>
            </div>
          </div>
        </div>
        
        <!-- Submit Button -->
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <UIcon name="i-lucide-info" class="w-4 h-4 inline mr-1" />
            All fields marked with * are required
          </div>
          <div class="flex gap-3 w-full sm:w-auto">
            <UButton 
              type="button" 
              @click="closeModal" 
              variant="outline" 
              color="gray"
              size="lg"
              class="flex-1 sm:flex-initial"
            >
              <UIcon name="i-lucide-x" class="mr-2 w-4 h-4" />
              Cancel
            </UButton>
            <UButton 
              type="submit" 
              color="blue"
              size="lg"
              class="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <UIcon name="i-lucide-check" class="mr-2 w-4 h-4" />
              Submit
            </UButton>
          </div>
        </div>
      </UForm>
    </div>
  </UModal>
</template>
