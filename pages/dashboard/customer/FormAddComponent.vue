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
const emit = defineEmits(["success"]);

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
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    state.address = data.display_name || "Address not found";
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

<template>
  <UModal>
    <div class="w-full p-4">


      <div class="p-2 mb-4 text-2xl font-bold text-center">
        <h1>{{ props.isEdit ? "Edit" : "Add New" }} Customer</h1>
      </div>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <!-- <URadioGroup v-model="state.submission_type" legend="Submission Type" :options="submission_types" /> -->
        <div class="flex gap-4 flex-row-2">

          <div class="w-full">
            <UFormGroup label="Nama Pelanggan" name="name">
              <UInput v-model="state.name" placeholder="Masukkan nama lengkap pelanggan" />
            </UFormGroup>
            <UFormGroup label="Panggilan / Samaran" name="alias">
              <UInput v-model="state.alias" placeholder="Optional nickname" />
            </UFormGroup>
            <UFormGroup label="Area Code" name="area_code">
              <USelectMenu v-model="state.area_id" :options="areas" value-attribute="value" 
                option-attribute="label" placeholder="Pilih area" />
            </UFormGroup>
            <UFormGroup label="No.HP Pelanggan" name="phone">
              <UInput v-model="state.phone" placeholder="Masukkan nomor HP pelanggan" />
            </UFormGroup>
            <UFormGroup label="Tgl. Permintaan PSB" name="service_request_date">
              <UInput v-model="state.service_request_date" type="date" />
            </UFormGroup>
            <UFormGroup label="Paket yg Diajukan" name="proposed_package">
              <USelectMenu v-model="state.proposed_package" :options="internet_packages" value-attribute="value"
                option-attribute="label" placeholder="Pilih paket internet" />
            </UFormGroup>
            <UFormGroup label="Sales Representative" name="sales_representative_id">
              <USelectMenu 
                v-model="state.sales_representative_id" 
                :options="salesRepresentatives" 
                value-attribute="value"
                option-attribute="label"
                placeholder="Pilih sales representative"
              />
            </UFormGroup>
            <UFormGroup label="Company" name="company_id">
              <USelectMenu 
                v-model="state.company_id" 
                :options="companies" 
                value-attribute="value"
                option-attribute="label"
                placeholder="Pilih company (optional)"
              />
            </UFormGroup>
          </div>
          <div class="w-full">

            <LMap style="height: 300px" :zoom="6" :center="[state.latitude, state.longitude]"
              :use-global-leaflet="false">
              <LTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LMarker ref="map" :lat-lng="[state.latitude, state.longitude]" draggable @dragend="onMarkerDrag" />
              <LControl position="bottomleft">
                <UButton @click="moveToMyLocation">My Position</UButton>
              </LControl>
            </LMap>
            <UFormGroup label="Address" name="address">
              <UInput v-model="state.address" />
            </UFormGroup>
            <UFormGroup label="Map" name="coordinates">
              <div class="flex justify-around gap-4 flex-row-2">
                <div class="w-full text-sm">
                  <span>Latitude</span>
                  <UInput v-model="state.latitude" class="w-full" placeholder="Latitude" type="number" />
                </div>
                <div class="w-full text-sm">
                  Longitude
                  <UInput v-model="state.longitude" class="w-full" placeholder="Longitude" type="number" />
                </div>
              </div>
            </UFormGroup>


            <div class="flex justify-end mt-4">
              <UButton type="submit"> Submit </UButton>
            </div>
          </div>
        </div>
      </UForm>
    </div>
  </UModal>
</template>
