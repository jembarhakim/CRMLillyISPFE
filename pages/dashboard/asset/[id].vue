<script setup lang="ts">
import { assetAdminApi } from '@/api/admin/asset'
import { assetItemAdminApi } from '@/api/admin/asset-item'
import { format } from 'date-fns'

const route = useRoute()
const assetId = route.params.id as string

const asset = ref<any>(null)
const assetItems = ref<any[]>([])
const loading = ref(true)

// Set page title
useHead({
  title: 'Asset Details - CRM System'
})

async function getAssetDetails() {
  try {
    const response = await assetAdminApi().getAsset(assetId)
    asset.value = response.data
  } catch (error) {
    console.error('Failed to fetch asset:', error)
    useToast().add({
      title: 'Failed to fetch asset details',
      color: 'red'
    })
  }
}

async function getAssetItems() {
  try {
    const response = await assetItemAdminApi().getAssetItems({ asset_id: assetId })
    assetItems.value = response.data
  } catch (error) {
    console.error('Failed to fetch asset items:', error)
  }
}

async function loadData() {
  loading.value = true
  await Promise.all([getAssetDetails(), getAssetItems()])
  loading.value = false
}

function formatDate(dateString: string) {
  if (!dateString) return 'No Date'
  try {
    const date = new Date(dateString)
    return format(date, 'MMM dd, yyyy HH:mm')
  } catch (error) {
    return 'Invalid Date'
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'in_stock': return 'green'
    case 'in_use': return 'blue'
    case 'maintenance': return 'yellow'
    case 'damaged': return 'red'
    case 'retired': return 'gray'
    default: return 'gray'
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div v-if="loading" class="flex justify-center items-center h-64">
    <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
  </div>

  <div v-else-if="asset" class="space-y-6">
    <!-- Asset Details -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="flex justify-between items-start mb-4">
        <h1 class="text-2xl font-bold">{{ asset.brand }} {{ asset.model }}</h1>
        <UButton 
          label="Edit Asset" 
          @click="navigateTo(`/dashboard/asset/edit/${asset.id}`)"
        />
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label class="text-sm font-medium text-gray-500">Type</label>
          <p class="text-lg">{{ asset.type }}</p>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-500">Serial Number</label>
          <p class="text-lg">{{ asset.serial_number }}</p>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-500">Site</label>
          <p class="text-lg">{{ asset.site || 'Not specified' }}</p>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-500">Total Items</label>
          <p class="text-lg">{{ assetItems.length }}</p>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-500">Price</label>
          <p class="text-lg">Rp {{ asset.price?.toLocaleString() || '0' }}</p>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-500">Company</label>
          <p class="text-lg">{{ asset.company?.name || 'No Company' }}</p>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-500">Created At</label>
          <p class="text-lg">{{ formatDate(asset.createdAt) }}</p>
        </div>
      </div>
      
      <div v-if="asset.description" class="mt-4">
        <label class="text-sm font-medium text-gray-500">Description</label>
        <p class="text-lg">{{ asset.description }}</p>
      </div>
    </div>

    <!-- Asset Items -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Asset Items ({{ assetItems.length }})</h2>
        <UButton 
          label="Add Asset Item" 
          @click="navigateTo(`/dashboard/asset/items?asset_id=${assetId}`)"
        />
      </div>

      <div v-if="assetItems.length === 0" class="text-center py-8 text-gray-500">
        <p>No asset items registered for this asset.</p>
        <UButton 
          label="Add First Asset Item" 
          class="mt-2"
          @click="navigateTo(`/dashboard/asset/items?asset_id=${assetId}`)"
        />
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                MAC Address
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Serial Number
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Created At
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="item in assetItems" :key="item.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-100">
                {{ item.mac_address }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {{ item.serial_number || 'N/A' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <UBadge 
                  :color="getStatusColor(item.status)"
                  :label="item.status.replace('_', ' ').toUpperCase()"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {{ formatDate(item.created_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <UButton 
                  size="sm" 
                  variant="outline"
                  @click="navigateTo(`/dashboard/asset/items?edit=${item.id}`)"
                >
                  Edit
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-8">
    <p class="text-gray-500">Asset not found</p>
    <UButton 
      label="Back to Assets" 
      class="mt-2"
      @click="navigateTo('/dashboard/asset')"
    />
  </div>
</template>

