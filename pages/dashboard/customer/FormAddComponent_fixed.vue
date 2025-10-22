<script setup lang="ts">
import { object, string, type InferType } from "yup";
import type { FormSubmitEvent } from "#ui/types";
import { customerAdminApi } from "@/api/admin/customer";
import { areaAdminApi } from "@/api/admin/area";
import { internetPackageAdminApi } from "@/api/admin/internet-package";
import { networkDeviceAdminApi } from "@/api/admin/network-device";
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
  proposed_package: string().required(),
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
  proposed_package: "",
  sales_representative_id: "",
  company_id: "",
});

const networkDeviceState = reactive({
  ip_static: "",
  mac_address: "",
  assets_id: "",
  product_id: "",
});

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
        state.proposed_package = props.data.proposed_package || "",
        state.sales_representative_id = props.data.sales_representative_id || "",
        state.company_id = props.data.company_id || ""
      
      // Load existing network device data if available
      try {
        const networkDevices = await networkDeviceAdminApi().getNetworkDevicesByCustomer(props.data.id);
        if (networkDevices.data && networkDevices.data.length > 0) {
          const device = networkDevices.data[0]; // Assuming one device per customer for now
          networkDeviceState.ip_static = device.ip_static || "";
          networkDeviceState.mac_address = device.mac_address || "";
          networkDeviceState.assets_id = device.assets_id || "";
        }
      } catch (error) {
        // Network device data not found, which is fine
        console.log("No network device data found for customer");
      }
    }
  },
  { immediate: true }
)
const emit = defineEmits(["success", "close"]);

function onSuccess() {
  emit("success");
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  console.log("Form submitted with data:", state);
  // Do something with event.data
  if (props.isEdit) {
    try {
      const response = await customerAdminApi().editCustomer(props.data.id, state);
      
      // Update or create network device if data is provided
      if (response.success && (networkDeviceState.assets_id || networkDeviceState.product_id)) {
        try {
          const networkDevices = await networkDeviceAdminApi().getNetworkDevicesByCustomer(props.data.id);
          if (networkDevices.data && networkDevices.data.length > 0) {
            // Update existing network device
            const device = networkDevices.data[0];
            const networkDeviceData: any = {
              customer_id: props.data.id,
              ip_static: device.ip_static || "",
              mac_address: device.mac_address || "",
              status_perangkat: device.status_perangkat || "active",
              last_ping_status: device.last_ping_status || "unknown",
              product_id: state.proposed_package || networkDeviceState.product_id || device.product_id || "",
              assets_id: networkDeviceState.assets_id || device.assets_id || null
            };
            await networkDeviceAdminApi().editNetworkDevice(device.id, networkDeviceData);
          } else {
            // Create new network device
            const networkDeviceData: any = {
              customer_id: props.data.id,
              ip_static: "",
              mac_address: "",
              status_perangkat: "active",
              last_ping_status: "unknown",
              product_id: state.proposed_package || networkDeviceState.product_id || "",
              assets_id: networkDeviceState.assets_id || null
            };
            await networkDeviceAdminApi().createNetworkDevice(networkDeviceData);
          }
        } catch (networkError: any) {
          console.error("Failed to update network device:", networkError);
          // Don't fail the entire operation if network device update fails
        }
      }
      
      notification.success('Success', response.message);
      onSuccess();
    } catch (error: any) {
      notification.error('Error', error.message || 'Failed to update customer');
    }
  } else {
    try {
      // Create customer first
      const customerResponse = await customerAdminApi().createCustomer(state);
      
      // If customer creation is successful, create network device with product information
      if (customerResponse.success) {
        const networkDeviceData: any = {
          customer_id: customerResponse.data.id,
          ip_static: "",
          mac_address: "",
          status_perangkat: "active",
          last_ping_status: "unknown",
          product_id: state.proposed_package || networkDeviceState.product_id || "", // Use proposed_package as product_id
          assets_id: networkDeviceState.assets_id || null // Set to null if empty to avoid foreign key constraint
        };
        
        await networkDeviceAdminApi().createNetworkDevice(networkDeviceData);
      }
      
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


const internet_packages = ref<{label: string, value: string}[]>([]);
const areas = ref<{label: string, value: string}[]>([]);
const salesRepresentatives = ref<{label: string, value: string}[]>([]);
const companies = ref<{label: string, value: string}[]>([]);

async function getDataOptions() {
  internetPackageAdminApi().getAllInternetPacket().then((response) => {
    internet_packages.value = response.data.map((value: any, index: number) => ({
      label: value.name,
      value: value.id
    }))
  })

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
/* Mobile-first optimizations */
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
</style>

<template>
  <UModal :ui="{ width: 'w-full max-w-7xl', height: 'h-auto max-h-[90vh] overflow-y-auto' }">
    <div class="w-full max-w-7xl mx-auto p-2 sm:p-4 overflow-y-auto max-h-[90vh]">
      <!-- Modal Header -->
      <div class="flex items-center justify-between mb-4 p-2 sm:p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
        <h1 class="text-lg sm:text-2xl font-bold text-white">
          {{ props.isEdit ? "Edit" : "Add New" }} Customer
        </h1>
        <UButton 
          @click="$emit('close')" 
          variant="ghost" 
          color="white"
          size="sm"
          class="text-white hover:bg-white/20"
        >
          <UIcon name="x" class="w-5 h-5" />
        </UButton>
      </div>

      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <!-- Mobile-First Responsive Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <!-- Customer Information Section -->
          <div class="w-full space-y-4">
            <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <UIcon name="user" class="w-5 h-5 text-blue-600" />
                Customer Information
              </h3>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormGroup label="Nama Pelanggan" name="name" class="sm:col-span-2">
                  <UInput 
                    v-model="state.name" 
                    placeholder="Masukkan nama lengkap pelanggan"
                    size="lg"
                    class="w-full"
                  />
                </UFormGroup>
                
                <UFormGroup label="Panggilan / Samaran" name="alias">
                  <UInput 
                    v-model="state.alias" 
                    placeholder="Optional nickname"
                    size="lg"
                    class="w-full"
                  />
                </UFormGroup>
                
                <UFormGroup label="No.HP Pelanggan" name="phone">
                  <UInput 
                    v-model="state.phone" 
                    placeholder="Masukkan nomor HP pelanggan"
                    size="lg"
                    class="w-full"
                    type="tel"
                  />
                </UFormGroup>
                
                <UFormGroup label="Area Code" name="area_code" class="sm:col-span-2">
                  <USelectMenu 
                    v-model="state.area_id" 
                    :options="areas" 
                    value-attribute="value" 
                    option-attribute="label" 
                    placeholder="Pilih area"
                    size="lg"
                    class="w-full"
                    searchable
                  />
                </UFormGroup>
                
                <UFormGroup label="Tgl. Permintaan PSB" name="service_request_date">
                  <UInput 
                    v-model="state.service_request_date" 
                    type="date"
                    size="lg"
                    class="w-full"
                  />
                </UFormGroup>
                
                <UFormGroup label="Paket yg Diajukan" name="proposed_package">
                  <USelectMenu 
                    v-model="state.proposed_package" 
                    :options="internet_packages" 
                    value-attribute="value"
                    option-attribute="label" 
                    placeholder="Pilih paket internet"
                    size="lg"
                    class="w-full"
                    searchable
                  />
                </UFormGroup>
              </div>
            </div>
            
            <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <UIcon name="building-2" class="w-5 h-5 text-green-600" />
                Business Information
              </h3>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormGroup label="Sales Representative" name="sales_representative_id">
                  <USelectMenu 
                    v-model="state.sales_representative_id" 
                    :options="salesRepresentatives" 
                    value-attribute="value"
                    option-attribute="label"
                    placeholder="Pilih sales representative"
                    size="lg"
                    class="w-full"
                    searchable
                  />
                </UFormGroup>
                
                <UFormGroup label="Company" name="company_id">
                  <USelectMenu 
                    v-model="state.company_id" 
                    :options="companies" 
                    value-attribute="value"
                    option-attribute="label"
                    placeholder="Pilih company (optional)"
                    size="lg"
                    class="w-full"
                    searchable
                  />
                </UFormGroup>
              </div>
            </div>
          </div>
          
          <!-- Location & Map Section -->
          <div class="w-full space-y-4">
            <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <UIcon name="map-pin" class="w-5 h-5 text-red-600" />
                Location & Address
              </h3>
              
              <!-- Map Container -->
              <div class="mb-4">
                <LMap 
                  style="height: 250px; width: 100%;" 
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
                      <UIcon name="map-pin" class="w-4 h-4 mr-1" />
                      My Position
                    </UButton>
                  </LControl>
                </LMap>
              </div>
              
              <!-- Address Field -->
              <UFormGroup label="Address" name="address" class="mb-4">
                <UInput 
                  v-model="state.address" 
                  placeholder="Address will be auto-filled from map"
                  size="lg"
                  class="w-full"
                  readonly
                />
              </UFormGroup>
              
              <!-- Coordinates -->
              <UFormGroup label="Coordinates" name="coordinates">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="space-y-1">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Latitude</label>
                    <UInput 
                      v-model="state.latitude" 
                      placeholder="Latitude" 
                      type="number" 
                      step="any"
                      size="lg"
                      class="w-full"
                    />
                  </div>
                  <div class="space-y-1">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Longitude</label>
                    <UInput 
                      v-model="state.longitude" 
                      placeholder="Longitude" 
                      type="number" 
                      step="any"
                      size="lg"
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
            <UIcon name="info" class="w-4 h-4 inline mr-1" />
            All fields marked with * are required
          </div>
          <div class="flex gap-3 w-full sm:w-auto">
            <UButton 
              type="button" 
              @click="$emit('close')" 
              variant="outline" 
              color="gray"
              size="lg"
              class="flex-1 sm:flex-initial"
            >
              <UIcon name="x" class="mr-2 w-4 h-4" />
              Cancel
            </UButton>
            <UButton 
              type="submit" 
              color="blue"
              size="lg"
              class="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <UIcon name="check" class="mr-2 w-4 h-4" />
              Submit
            </UButton>
          </div>
        </div>
      </UForm>
    </div>
  </UModal>
</template>
