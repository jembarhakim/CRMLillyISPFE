<template>
  <div class="h-[600px] w-full relative flex overflow-hidden bg-gray-50 dark:bg-gray-900 flex-col md:flex-row rounded-lg border border-gray-200 mt-6 shadow-sm">

    <!-- Sidebar List -->
    <div 
      :class="[
        'transition-all duration-300 ease-in-out bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-20 absolute md:relative h-full w-full md:w-80 shadow-lg md:shadow-none',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      ]"
    >
      <div class="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h2 class="font-semibold text-lg flex items-center gap-2">
          <LucideIcon name="Map" :size="20" class="text-primary" />
          Customer Locations
        </h2>
        <UButton 
          icon="i-heroicons-x-mark" 
          color="gray" 
          variant="ghost" 
          class="md:hidden" 
          @click="isSidebarOpen = false" 
        />
      </div>

      <!-- Filters in sidebar for mobile -->
      <div class="p-4 flex flex-col gap-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <UInput
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          placeholder="Search name, phone, address..."
          class="w-full"
          :loading="isLoading"
        />
        
        <USelectMenu
          v-model="selectedArea"
          :options="areaOptions"
          placeholder="Filter by Area"
          value-attribute="value"
          option-attribute="label"
          class="w-full"
        />

        <USelectMenu
          v-model="selectedType"
          :options="typeOptions"
          placeholder="Filter by Type"
          value-attribute="value"
          option-attribute="label"
          class="w-full"
        />
      </div>

      <div class="flex-1 overflow-y-auto p-2">
        <div v-if="isLoading" class="space-y-3 p-2">
          <div v-for="i in 5" :key="i" class="h-16 w-full rounded-lg bg-gray-200 animate-pulse" />
        </div>
        <div v-else-if="filteredCustomers.length === 0" class="text-center p-6 text-gray-500">
          <LucideIcon name="search-x" :size="32" class="mx-auto mb-2 opacity-50" />
          <p>No customers found</p>
        </div>
        <div v-else class="space-y-2">
          <div 
            v-for="customer in filteredCustomers" 
            :key="customer.id"
            class="p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            @click="focusCustomer(customer)"
          >
            <div class="flex justify-between items-start mb-1">
              <span class="font-medium text-sm line-clamp-1">{{ customer.name }}</span>
              <UBadge :color="getTypeColor(customer)" size="xs" variant="subtle">
                {{ getTypeName(customer) }}
              </UBadge>
            </div>
            <p class="text-xs text-gray-500 flex items-center gap-1 mb-1 line-clamp-1">
              <LucideIcon name="map-pin" :size="12" />
              {{ customer.area?.name_subdistrict || customer.area?.name_city || 'Unknown Area' }}
            </p>
            <p v-if="!hasValidCoordinates(customer)" class="text-xs text-red-500 flex items-center gap-1 mt-1">
              <LucideIcon name="alert-triangle" :size="12" />
              No coordinates
            </p>
          </div>
        </div>

        <div class="mt-5 border-t border-gray-200 dark:border-gray-800 pt-4">
          <div class="flex items-center justify-between px-2 mb-2">
            <h3 class="font-semibold text-sm">The Dude Routers</h3>
            <UBadge color="blue" size="xs">{{ filteredDudeDevices.length }}</UBadge>
          </div>
          <p v-if="!isLoading && filteredDudeDevices.length === 0" class="px-2 py-3 text-xs text-gray-500">
            Router akan muncul setelah The Dude mengirim notifikasi status ke backend.
          </p>
          <button
            v-for="device in filteredDudeDevices"
            :key="device.id"
            type="button"
            class="w-full text-left p-3 mb-2 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            @click="editDudeDevice(device)"
          >
            <span class="flex items-center justify-between gap-2">
              <span class="font-medium text-sm line-clamp-1">{{ device.device_name }}</span>
              <UBadge :color="getDudeStatus(device) === 'up' ? 'green' : getDudeStatus(device) === 'down' ? 'red' : 'gray'" size="xs">
                {{ getDudeStatus(device).toUpperCase() }}
              </UBadge>
            </span>
            <span class="block mt-1 text-xs text-gray-500">{{ device.ip_address }}</span>
            <span class="block mt-1 text-xs" :class="hasDudeCoordinates(device) ? 'text-gray-500' : 'text-amber-600'">
              {{ device.address || (hasDudeCoordinates(device) ? 'Alamat belum diisi' : 'Lokasi belum ditentukan — klik untuk mengatur') }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Map Container -->
    <div class="flex-1 relative h-full w-full z-10">
      <div class="absolute top-4 right-4 z-[1100] rounded-lg bg-white/95 px-3 py-2 shadow-md text-xs">
        <div class="flex items-center gap-2 font-medium">
          <span
            class="h-2.5 w-2.5 rounded-full"
            :class="isSocketConnected ? 'bg-green-500' : 'bg-red-500'"
          />
          {{ isSocketConnected ? 'Live monitoring' : 'Reconnecting...' }}
        </div>
        <p v-if="socketError" class="mt-1 max-w-52 text-red-600">{{ socketError }}</p>
      </div>
      <div v-if="isPickingDudeLocation" class="absolute top-16 right-4 z-[1100] rounded-lg bg-blue-700 px-3 py-2 shadow-md text-xs text-white">
        Klik peta untuk menentukan lokasi router
        <button class="ml-2 underline" @click="isPickingDudeLocation = false; isDudeEditorOpen = true">Batal</button>
      </div>
      <ClientOnly>
        <LMap 
          ref="mapRef"
          :use-global-leaflet="false"
          :zoom="zoom"
          :center="center"
          class="h-full w-full z-0"
          @ready="onMapReady"
          @click="handleMapClick"
        >
          <LTileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&amp;copy; <a href=&quot;https://www.openstreetmap.org/copyright&quot;>OpenStreetMap</a> contributors"
            layer-type="base"
            name="OpenStreetMap"
          />

          <!-- Markers -->
          <LMarker 
            v-for="marker in mapMarkers"
            :key="marker.ipAddress || marker.key"
            :ref="(leafletMarker) => setMarkerRef(marker.ipAddress, leafletMarker)"
            :lat-lng="[parseFloat(marker.customer.latitude), parseFloat(marker.customer.longitude)]"
            :icon="getCustomIcon(marker)"
            @click="activeCustomerId = marker.customer.id"
          >
            <LPopup :options="{ maxWidth: 300 }">
              <div class="p-1 min-w-[200px]">
                <div class="flex items-start justify-between mb-2">
                  <h3 class="font-bold text-base m-0 leading-tight">{{ marker.customer.name }}</h3>
                  <UBadge :color="getMarkerTypeColor(marker)" size="xs">{{ getMarkerTypeName(marker) }}</UBadge>
                </div>
                
                <div class="space-y-2 mt-3 text-sm text-gray-600 dark:text-gray-300">
                  <p class="flex items-start gap-2 m-0">
                    <span
                      class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      :class="getDeviceStatus(marker) === 'up' ? 'bg-green-500' : getDeviceStatus(marker) === 'down' ? 'bg-red-500' : 'bg-gray-400'"
                    />
                    <span>
                      {{ getDeviceLabel(marker) }} ·
                      {{ getDeviceStatus(marker) === 'unknown' ? 'Unknown' : getDeviceStatus(marker).toUpperCase() }}
                    </span>
                  </p>
                  <p v-if="marker.ipAddress" class="m-0">
                    <span class="font-medium">IP:</span> {{ marker.ipAddress }}
                  </p>
                  <p class="flex items-start gap-2 m-0">
                    <LucideIcon name="phone" :size="14" class="mt-0.5 shrink-0" />
                    <span>{{ marker.customer.phone || '-' }}</span>
                  </p>
                  <p class="flex items-start gap-2 m-0">
                    <LucideIcon name="map" :size="14" class="mt-0.5 shrink-0" />
                    <span class="leading-tight">{{ marker.customer.address || '-' }}</span>
                  </p>
                  <p class="flex items-start gap-2 m-0">
                    <LucideIcon name="compass" :size="14" class="mt-0.5 shrink-0" />
                    <span>{{ formatArea(marker.customer.area) }}</span>
                  </p>
                </div>

                <div class="mt-4 flex gap-2">
                  <UButton 
                    size="xs" 
                    color="white" 
                    icon="i-heroicons-map"
                    variant="solid" 
                    class="flex-1 justify-center"
                    @click="openInGoogleMaps(marker.customer)"
                  >
                    Maps
                  </UButton>
                  <UButton 
                    size="xs" 
                    color="primary" 
                    icon="i-heroicons-eye"
                    variant="solid" 
                    class="flex-1 justify-center"
                    @click="viewDetail(marker.customer)"
                  >
                    Detail
                  </UButton>
                </div>
              </div>
            </LPopup>
          </LMarker>

          <LMarker
            v-for="device in mappedDudeDevices"
            :key="`dude-${device.id}`"
            :lat-lng="[Number(device.latitude), Number(device.longitude)]"
            :icon="getDudeIcon(device)"
            @click="editDudeDevice(device)"
          >
            <LPopup :options="{ maxWidth: 300 }">
              <div class="p-1 min-w-[200px]">
                <div class="flex items-start justify-between gap-2 mb-2">
                  <h3 class="font-bold text-base m-0 leading-tight">{{ device.device_name }}</h3>
                  <UBadge :color="getDudeStatus(device) === 'up' ? 'green' : getDudeStatus(device) === 'down' ? 'red' : 'gray'" size="xs">
                    {{ getDudeStatus(device).toUpperCase() }}
                  </UBadge>
                </div>
                <div class="space-y-2 mt-3 text-sm text-gray-600">
                  <p class="m-0"><span class="font-medium">IP:</span> {{ device.ip_address }}</p>
                  <p class="m-0"><span class="font-medium">Pengguna:</span> {{ device.user_name || 'Belum diisi' }}</p>
                  <p class="m-0"><span class="font-medium">Telepon:</span> {{ device.user_phone || '-' }}</p>
                  <p class="m-0"><span class="font-medium">Alamat:</span> {{ device.address || 'Belum diisi' }}</p>
                  <p v-if="device.notes" class="m-0"><span class="font-medium">Catatan:</span> {{ device.notes }}</p>
                </div>
                <button
                  type="button"
                  class="mt-3 w-full rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                  @click.stop="editDudeDevice(device)"
                >
                  Edit informasi dan lokasi
                </button>
              </div>
            </LPopup>
          </LMarker>

          <!-- Controls Overlay (Mobile Toggle) -->
          <LControl position="topleft" class="md:hidden !mt-4 !ml-4 border-none shadow-none bg-transparent">
            <UButton 
              icon="i-heroicons-bars-3" 
              color="white" 
              class="shadow-md"
              @click="isSidebarOpen = true" 
            />
          </LControl>
          
          <!-- Custom Controls (Desktop Top Right) -->
          <LControl position="topright" class="!mt-4 !mr-4 border-none shadow-none bg-transparent">
            <div class="flex flex-col gap-2">
              <UButton 
                icon="i-heroicons-arrows-pointing-out" 
                color="white" 
                title="Fit all markers"
                class="shadow-md"
                @click="fitBounds"
              />
              <UButton 
                icon="i-heroicons-map-pin" 
                color="white" 
                title="My Location"
                class="shadow-md"
                @click="goToMyLocation"
              />
            </div>
          </LControl>

          <!-- Stats Panel (Bottom Right or Bottom Left on mobile) -->
          <LControl position="bottomright" class="!mb-6 !mr-4 border-none shadow-none bg-transparent">
            <div class="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 text-xs sm:text-sm">
              <div class="font-semibold mb-2 flex items-center gap-1.5 border-b border-gray-200 dark:border-gray-700 pb-1">
                <LucideIcon name="pie-chart" :size="14" />
                Overview
              </div>
              <div class="grid grid-cols-2 gap-x-4 gap-y-1">
                <span class="text-gray-500">Total Filtered:</span>
                <span class="font-medium text-right">{{ filteredCustomers.length }}</span>
                
                <span class="text-gray-500">On Map:</span>
                <span class="font-medium text-right">{{ mapCustomers.length + mappedDudeDevices.length }}</span>
                
                <span class="text-gray-500">Router The Dude:</span>
                <span class="font-medium text-right">{{ dudeDevices.length }}</span>

                <span class="text-gray-500 text-blue-500">Internet:</span>
                <span class="font-medium text-right">{{ countByType('internet') }}</span>
                
                <span class="text-gray-500 text-green-500">Collaborator:</span>
                <span class="font-medium text-right">{{ countByType('collaborator') }}</span>
                
                <span class="text-gray-500 text-orange-500">Both:</span>
                <span class="font-medium text-right">{{ countByType('both') }}</span>
              </div>
            </div>
          </LControl>
        </LMap>
        
        <template #fallback>
          <div class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div class="flex flex-col items-center gap-4">
              <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary" />
              <p class="text-gray-500 font-medium">Loading map...</p>
            </div>
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>

  <UModal v-model="isDudeEditorOpen">
    <div class="p-5">
      <div class="mb-4">
        <h2 class="text-lg font-semibold">{{ editingDudeDevice?.device_name }}</h2>
        <p class="text-sm text-gray-500">{{ editingDudeDevice?.ip_address }} · status {{ getDudeStatus(editingDudeDevice || {}).toUpperCase() }}</p>
      </div>
      <div class="space-y-3">
        <UFormGroup label="Nama pengguna / pemilik router">
          <UInput v-model="dudeForm.user_name" placeholder="Nama pengguna" />
        </UFormGroup>
        <UFormGroup label="Nomor telepon">
          <UInput v-model="dudeForm.user_phone" placeholder="08..." />
        </UFormGroup>
        <UFormGroup label="Alamat lokasi router">
          <UTextarea v-model="dudeForm.address" placeholder="Alamat lengkap atau patokan lokasi" :rows="2" />
        </UFormGroup>
        <UFormGroup label="Catatan">
          <UTextarea v-model="dudeForm.notes" placeholder="Informasi tambahan (opsional)" :rows="2" />
        </UFormGroup>
        <div class="rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-800">
          <p class="font-medium">Koordinat lokasi</p>
          <p class="mt-1 text-gray-500">
            {{ dudeForm.latitude !== null && dudeForm.longitude !== null
              ? `${dudeForm.latitude.toFixed(6)}, ${dudeForm.longitude.toFixed(6)}`
              : 'Belum ditentukan' }}
          </p>
          <UButton class="mt-2" size="sm" color="primary" variant="soft" @click="startPickingDudeLocation">
            {{ dudeForm.latitude !== null ? 'Pilih ulang titik di peta' : 'Pilih titik di peta' }}
          </UButton>
        </div>
      </div>
      <div class="mt-5 flex justify-end gap-2">
        <UButton color="gray" variant="ghost" @click="isDudeEditorOpen = false">Batal</UButton>
        <UButton color="primary" :loading="isSavingDudeDetails" @click="saveDudeDetails">Simpan</UButton>
      </div>
    </div>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from '#imports'
import { customerAdminApi } from '@/api/admin/customer'
import { dudeDeviceAdminApi } from '@/api/admin/dude-device'
import { networkDeviceAdminApi } from '@/api/admin/network-device'
import { areaAdminApi } from '@/api/admin/area'
import { useNotification } from '@/composables/useNotification'
import { useNetworkSocket } from '@/composables/useNetworkSocket'
import LucideIcon from '@/components/LucideIcon.vue'

const router = useRouter()
const notification = useNotification()

// State
const mapRef = ref<any>(null)
const leaflet = ref<any>(null)
const isLoading = ref(true)
const isSidebarOpen = ref(false)
const customers = ref<any[]>([])
const networkDevices = ref<any[]>([])
const dudeDevices = ref<any[]>([])
const areas = ref<any[]>([])
const zoom = ref(10)
const center = ref<[number, number]>([-6.2088, 106.8456]) // Jakarta default
const activeCustomerId = ref<string | null>(null)
const deviceStatuses = ref(new Map<string, { status: 'up' | 'down'; deviceName: string }>())
const markerRefs = new Map<string, any>()
const isDudeEditorOpen = ref(false)
const isPickingDudeLocation = ref(false)
const isSavingDudeDetails = ref(false)
const editingDudeDevice = ref<any | null>(null)
const dudeForm = ref({
  user_name: '',
  user_phone: '',
  address: '',
  notes: '',
  latitude: null as number | null,
  longitude: null as number | null
})
const runtimeConfig = useRuntimeConfig()
const { isConnected: isSocketConnected, error: socketError, latestUpdate, connect: connectSocket } =
  useNetworkSocket(runtimeConfig.public.NETWORK_WS_URL)

// Filters
const searchQuery = ref('')
const selectedArea = ref('')
const selectedType = ref('all')

const typeOptions = [
  { label: 'All Types', value: 'all' },
  { label: 'Internet Only', value: 'internet' },
  { label: 'Collaborator Only', value: 'collaborator' },
  { label: 'Both', value: 'both' },
  { label: 'Unclassified', value: 'none' }
]

const areaOptions = computed(() => {
  const opts = [{ label: 'All Areas', value: '' }]
  const uniqueAreas = new Map()
  
  areas.value.forEach(area => {
    const label = area.name_subdistrict || area.name_city
    if (label && !uniqueAreas.has(label)) {
      uniqueAreas.set(label, true)
      opts.push({ label, value: area.id })
    }
  })
  
  return opts
})

// Data fetching
const fetchData = async () => {
  isLoading.value = true
  try {
    const [customerRes, deviceRes, areaRes, dudeDeviceRes] = await Promise.all([
      customerAdminApi().getAllCustomers(),
      networkDeviceAdminApi().getAllNetworkDevices(),
      areaAdminApi().getAllAreas(),
      dudeDeviceAdminApi().getAll()
    ])
    
    customers.value = customerRes?.data || []
    networkDevices.value = deviceRes?.data || []
    areas.value = areaRes?.data || []
    dudeDevices.value = dudeDeviceRes?.data || []
    
    // Fit bounds after a short delay to ensure map is ready
    setTimeout(() => {
      fitBounds()
    }, 500)
  } catch (error) {
    notification.error('Error', 'Failed to load mapping data')
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

// Helpers
const hasValidCoordinates = (customer: any) => {
  if (!customer.latitude || !customer.longitude) return false
  const lat = parseFloat(customer.latitude)
  const lng = parseFloat(customer.longitude)
  return !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)
}

const getCustomerType = (customer: any) => {
  const isInternet = customer.is_internet === 'yes'
  const isCollab = customer.is_collaborator === 'yes'
  if (isInternet && isCollab) return 'both'
  if (isInternet) return 'internet'
  if (isCollab) return 'collaborator'
  return 'none'
}

const getTypeName = (customer: any) => {
  const type = getCustomerType(customer)
  switch (type) {
    case 'both': return 'Internet & Collab'
    case 'internet': return 'Internet'
    case 'collaborator': return 'Collaborator'
    default: return 'Unclassified'
  }
}

const getTypeColor = (customer: any) => {
  const type = getCustomerType(customer)
  switch (type) {
    case 'both': return 'orange'
    case 'internet': return 'blue'
    case 'collaborator': return 'green'
    default: return 'gray'
  }
}

const getCustomerDevice = (customer: any) =>
  networkDevices.value.find((device) => String(device.customer_id) === String(customer.id)) ||
  customer.network_devices?.find((device: any) => device.ip_static)

const getDevicesForCustomer = (customer: any) => {
  const devices = networkDevices.value.filter(
    (device) => String(device.customer_id) === String(customer.id) && device.ip_static
  )
  if (devices.length > 0) return devices

  return (customer.network_devices || []).filter((device: any) => device.ip_static)
}

const mapMarkers = computed(() => mapCustomers.value.flatMap((customer) => {
  const devices = getDevicesForCustomer(customer)
  if (devices.length === 0) {
    return [{
      key: `customer-${customer.id}`,
      customer,
      device: null,
      ipAddress: customer.ip_static || ''
    }]
  }

  return devices.map((device: any, index: number) => ({
    key: `device-${device.id || `${customer.id}-${index}`}`,
    customer,
    device,
    ipAddress: device.ip_static
  }))
}))

const getMarkerIp = (marker: any) => marker.ipAddress

const getDeviceType = (marker: any): 'router' | 'server' | 'customer' => {
  const device = marker.device || getCustomerDevice(marker.customer)
  if (!device) return 'customer'

  const deviceDescription = [
    device.device_type,
    device.type,
    device.product?.name,
    device.asset?.name,
    device.name
  ].filter(Boolean).join(' ').toLowerCase()

  if (deviceDescription.includes('server')) return 'server'
  if (deviceDescription.includes('router')) return 'router'
  return 'customer'
}

const getMarkerTypeName = (marker: any) => {
  const type = getDeviceType(marker)
  return type === 'router' ? 'Router' : type === 'server' ? 'Server' : 'Customer'
}

const getMarkerTypeColor = (marker: any) => {
  const type = getDeviceType(marker)
  return type === 'router' ? 'blue' : type === 'server' ? 'purple' : getTypeColor(marker.customer)
}

const getDeviceStatus = (marker: any): 'up' | 'down' | 'unknown' => {
  const ipAddress = getMarkerIp(marker)
  if (!ipAddress) return 'unknown'

  const liveStatus = deviceStatuses.value.get(ipAddress)?.status
  if (liveStatus) return liveStatus

  const status = (marker.device?.last_ping_status || marker.customer.last_ping_status || '').toLowerCase()
  return status === 'up' || status === 'down' ? status : 'unknown'
}

const getDeviceLabel = (marker: any) =>
  deviceStatuses.value.get(getMarkerIp(marker))?.deviceName ||
  marker.device?.product?.name ||
  marker.device?.name ||
  getMarkerTypeName(marker)

const setMarkerRef = (ipAddress: string, marker: any) => {
  if (!ipAddress) return
  if (marker) markerRefs.set(ipAddress, marker)
  else markerRefs.delete(ipAddress)
}

const formatArea = (area: any) => {
  if (!area) return 'Unknown Area'
  const parts = [area.name_village, area.name_subdistrict, area.name_city].filter(Boolean)
  return parts.join(', ') || 'Unknown Area'
}

const countByType = (type: string) => {
  return filteredCustomers.value.filter(c => getCustomerType(c) === type).length
}

// Computed Data
const filteredCustomers = computed(() => {
  return customers.value.filter(customer => {
    // Search
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const matchName = customer.name?.toLowerCase().includes(q)
      const matchPhone = customer.phone?.toLowerCase().includes(q)
      const matchAddress = customer.address?.toLowerCase().includes(q)
      if (!matchName && !matchPhone && !matchAddress) return false
    }
    
    // Area
    if (selectedArea.value && customer.area?.id !== selectedArea.value) {
      return false
    }
    
    // Type
    if (selectedType.value !== 'all' && getCustomerType(customer) !== selectedType.value) {
      return false
    }
    
    return true
  })
})

const mapCustomers = computed(() => {
  return filteredCustomers.value.filter(c => hasValidCoordinates(c))
})

const filteredDudeDevices = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return dudeDevices.value
  return dudeDevices.value.filter((device) =>
    [device.device_name, device.ip_address, device.user_name, device.address]
      .some((value) => String(value || '').toLowerCase().includes(query))
  )
})

const hasDudeCoordinates = (device: any) =>
  device.latitude !== null && device.latitude !== undefined &&
  device.longitude !== null && device.longitude !== undefined &&
  Number.isFinite(Number(device.latitude)) && Number.isFinite(Number(device.longitude))

const mappedDudeDevices = computed(() => dudeDevices.value.filter(hasDudeCoordinates))

// Map Interactions
const onMapReady = async (map: any) => {
  if (process.client) {
    leaflet.value = await import('leaflet')
  }
}

const getCustomIcon = (marker: any) => {
  if (!leaflet.value) return undefined // Fallback to default before L is loaded
  
  const status = getDeviceStatus(marker)
  const color = status === 'up' ? '#22c55e' : status === 'down' ? '#ef4444' : '#6b7280'
  const type = getDeviceType(marker)
  const initials = type === 'router' ? 'R' : type === 'server' ? 'S' : 'C'
  const borderRadius = type === 'server' ? '6px' : type === 'router' ? '0' : '50%'
  const clipPath = type === 'router' ? 'polygon(50% 0%, 100% 100%, 0% 100%)' : 'none'
  
  return leaflet.value.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: ${borderRadius}; clip-path: ${clipPath}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); transition: transform 0.2s;">${initials}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  })
}

const getDudeStatus = (device: any): 'up' | 'down' | 'unknown' => {
  const liveStatus = deviceStatuses.value.get(device.ip_address)?.status
  const status = String(liveStatus || device.status || '').toLowerCase()
  return status === 'up' || status === 'down' ? status : 'unknown'
}

const getDudeIcon = (device: any) => {
  if (!leaflet.value) return undefined
  const status = getDudeStatus(device)
  const color = status === 'up' ? '#22c55e' : status === 'down' ? '#ef4444' : '#6b7280'
  return leaflet.value.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color:${color};width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:13px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)">D</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  })
}

const editDudeDevice = (device: any) => {
  editingDudeDevice.value = device
  dudeForm.value = {
    user_name: device.user_name || '',
    user_phone: device.user_phone || '',
    address: device.address || '',
    notes: device.notes || '',
    latitude: hasDudeCoordinates(device) ? Number(device.latitude) : null,
    longitude: hasDudeCoordinates(device) ? Number(device.longitude) : null
  }
  isPickingDudeLocation.value = false
  isDudeEditorOpen.value = true
}

const startPickingDudeLocation = () => {
  isDudeEditorOpen.value = false
  isPickingDudeLocation.value = true
}

const handleMapClick = (event: any) => {
  if (!isPickingDudeLocation.value || !event?.latlng) return
  dudeForm.value.latitude = Number(event.latlng.lat)
  dudeForm.value.longitude = Number(event.latlng.lng)
  isPickingDudeLocation.value = false
  isDudeEditorOpen.value = true
}

const saveDudeDetails = async () => {
  if (!editingDudeDevice.value) return
  isSavingDudeDetails.value = true
  try {
    const response = await dudeDeviceAdminApi().updateDetails(
      editingDudeDevice.value.id,
      dudeForm.value
    )
    const updatedDevice = response?.data
    if (!updatedDevice) throw new Error('Backend did not return the updated router')
    dudeDevices.value = dudeDevices.value.map((device) =>
      device.id === updatedDevice.id ? updatedDevice : device
    )
    isDudeEditorOpen.value = false
    notification.success('Berhasil', 'Informasi dan lokasi router berhasil disimpan')
    setTimeout(fitBounds, 100)
  } catch (error) {
    console.error('Unable to save The Dude router details:', error)
    notification.error('Gagal', error instanceof Error ? error.message : 'Gagal menyimpan informasi router')
  } finally {
    isSavingDudeDetails.value = false
  }
}

watch(latestUpdate, async (update) => {
  if (!update) return

  const nextStatuses = new Map(deviceStatuses.value)
  nextStatuses.set(update.ip_address, {
    status: update.status,
    deviceName: update.device_name
  })
  deviceStatuses.value = nextStatuses

  const existingDudeDevice = dudeDevices.value.find((device) => device.ip_address === update.ip_address)
  if (existingDudeDevice) {
    dudeDevices.value = dudeDevices.value.map((device) =>
      device.ip_address === update.ip_address
        ? { ...device, device_name: update.device_name, status: update.status }
        : device
    )
  } else {
    try {
      const response = await dudeDeviceAdminApi().getAll()
      dudeDevices.value = response?.data || []
    } catch (error) {
      console.error('Unable to refresh The Dude devices after a status update:', error)
      notification.error('Gagal', 'Status diterima, tetapi daftar router The Dude gagal diperbarui')
    }
  }

  const mapMarker = mapMarkers.value.find((item) => getMarkerIp(item) === update.ip_address)
  const marker = markerRefs.get(update.ip_address)
  if (mapMarker && marker?.leafletObject) {
    marker.leafletObject.setIcon(getCustomIcon(mapMarker))
  }
})

const fitBounds = () => {
  if (!mapRef.value?.leafletObject || !leaflet.value) return
  
  try {
    const map = mapRef.value.leafletObject
    const coordinates = [
      ...mapCustomers.value.map((customer) => [parseFloat(customer.latitude), parseFloat(customer.longitude)]),
      ...mappedDudeDevices.value.map((device) => [Number(device.latitude), Number(device.longitude)])
    ]
    if (coordinates.length === 0) return
    const bounds = leaflet.value.latLngBounds(
      coordinates
    )
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
    }
  } catch (e) {
    console.error('Error fitting bounds:', e)
  }
}

const goToMyLocation = () => {
  if (!navigator.geolocation) {
    notification.error('Error', 'Geolocation is not supported by your browser')
    return
  }
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (mapRef.value?.leafletObject) {
        const map = mapRef.value.leafletObject
        map.flyTo([position.coords.latitude, position.coords.longitude], 15)
      }
    },
    (error) => {
      notification.error('Error', 'Unable to retrieve your location')
    }
  )
}

const focusCustomer = (customer: any) => {
  if (!hasValidCoordinates(customer)) {
    notification.warning('Warning', 'Customer does not have valid coordinates')
    return
  }
  
  if (window.innerWidth < 768) {
    isSidebarOpen.value = false // Close sidebar on mobile
  }
  
  if (mapRef.value?.leafletObject) {
    const map = mapRef.value.leafletObject
    const lat = parseFloat(customer.latitude)
    const lng = parseFloat(customer.longitude)
    map.flyTo([lat, lng], 16, { duration: 1.5 })
    activeCustomerId.value = customer.id
  }
}

const openInGoogleMaps = (customer: any) => {
  const url = `https://www.google.com/maps/place/${customer.latitude},${customer.longitude}`
  window.open(url, '_blank')
}

const emit = defineEmits(['view-detail'])

const viewDetail = (customer: any) => {
  // Emit event to open detail modal in parent page
  emit('view-detail', customer.id)
}

// Watchers
watch([selectedArea, selectedType], () => {
  // Wait a tick for computed mapCustomers to update, then fit bounds
  setTimeout(fitBounds, 100)
})

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(fitBounds, 300)
})

onMounted(() => {
  fetchData()
  connectSocket()
})

onUnmounted(() => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
})
</script>

<style>
/* Global styles for leaflet overrides if needed */
.leaflet-popup-content-wrapper {
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
.leaflet-popup-content {
  margin: 12px;
}
.custom-marker {
  background: transparent;
  border: none;
}
.custom-marker:hover div {
  transform: scale(1.1);
}
</style>
