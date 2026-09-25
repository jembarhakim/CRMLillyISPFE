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
      </div>
    </div>

    <!-- Map Container -->
    <div class="flex-1 relative h-full w-full z-10">
      <ClientOnly>
        <LMap 
          ref="mapRef"
          :use-global-leaflet="false"
          :zoom="zoom"
          :center="center"
          class="h-full w-full z-0"
          @ready="onMapReady"
        >
          <LTileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&amp;copy; <a href=&quot;https://www.openstreetmap.org/copyright&quot;>OpenStreetMap</a> contributors"
            layer-type="base"
            name="OpenStreetMap"
          />

          <!-- Markers -->
          <LMarker 
            v-for="customer in mapCustomers" 
            :key="customer.id" 
            :lat-lng="[parseFloat(customer.latitude), parseFloat(customer.longitude)]"
            :icon="getCustomIcon(customer)"
            @click="activeCustomerId = customer.id"
          >
            <LPopup :options="{ maxWidth: 300 }">
              <div class="p-1 min-w-[200px]">
                <div class="flex items-start justify-between mb-2">
                  <h3 class="font-bold text-base m-0 leading-tight">{{ customer.name }}</h3>
                  <UBadge :color="getTypeColor(customer)" size="xs">{{ getTypeName(customer) }}</UBadge>
                </div>
                
                <div class="space-y-2 mt-3 text-sm text-gray-600 dark:text-gray-300">
                  <p class="flex items-start gap-2 m-0">
                    <LucideIcon name="phone" :size="14" class="mt-0.5 shrink-0" />
                    <span>{{ customer.phone || '-' }}</span>
                  </p>
                  <p class="flex items-start gap-2 m-0">
                    <LucideIcon name="map" :size="14" class="mt-0.5 shrink-0" />
                    <span class="leading-tight">{{ customer.address || '-' }}</span>
                  </p>
                  <p class="flex items-start gap-2 m-0">
                    <LucideIcon name="compass" :size="14" class="mt-0.5 shrink-0" />
                    <span>{{ formatArea(customer.area) }}</span>
                  </p>
                </div>

                <div class="mt-4 flex gap-2">
                  <UButton 
                    size="xs" 
                    color="white" 
                    icon="i-heroicons-map"
                    variant="solid" 
                    class="flex-1 justify-center"
                    @click="openInGoogleMaps(customer)"
                  >
                    Maps
                  </UButton>
                  <UButton 
                    size="xs" 
                    color="primary" 
                    icon="i-heroicons-eye"
                    variant="solid" 
                    class="flex-1 justify-center"
                    @click="viewDetail(customer)"
                  >
                    Detail
                  </UButton>
                </div>
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
                <span class="font-medium text-right">{{ mapCustomers.length }}</span>
                
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from '#imports'
import { customerAdminApi } from '@/api/admin/customer'
import { areaAdminApi } from '@/api/admin/area'
import { useNotification } from '@/composables/useNotification'
import LucideIcon from '@/components/LucideIcon.vue'

const router = useRouter()
const notification = useNotification()

// State
const mapRef = ref<any>(null)
const leaflet = ref<any>(null)
const isLoading = ref(true)
const isSidebarOpen = ref(false)
const customers = ref<any[]>([])
const areas = ref<any[]>([])
const zoom = ref(10)
const center = ref<[number, number]>([-6.2088, 106.8456]) // Jakarta default
const activeCustomerId = ref<string | null>(null)

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
    const [customerRes, areaRes] = await Promise.all([
      customerAdminApi().getAllCustomers(),
      areaAdminApi().getAllAreas()
    ])
    
    customers.value = customerRes?.data || []
    areas.value = areaRes?.data || []
    
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

const getTypeHexColor = (customer: any) => {
  const type = getCustomerType(customer)
  switch (type) {
    case 'both': return '#f97316' // orange-500
    case 'internet': return '#3b82f6' // blue-500
    case 'collaborator': return '#22c55e' // green-500
    default: return '#6b7280' // gray-500
  }
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

// Map Interactions
const onMapReady = async (map: any) => {
  if (process.client) {
    leaflet.value = await import('leaflet')
  }
}

const getCustomIcon = (customer: any) => {
  if (!leaflet.value) return undefined // Fallback to default before L is loaded
  
  const color = getTypeHexColor(customer)
  const initials = (customer.name || 'U').substring(0, 1).toUpperCase()
  
  return leaflet.value.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); transition: transform 0.2s;">${initials}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  })
}

const fitBounds = () => {
  if (!mapRef.value?.leafletObject || !leaflet.value || mapCustomers.value.length === 0) return
  
  try {
    const map = mapRef.value.leafletObject
    const bounds = leaflet.value.latLngBounds(
      mapCustomers.value.map(c => [parseFloat(c.latitude), parseFloat(c.longitude)])
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
