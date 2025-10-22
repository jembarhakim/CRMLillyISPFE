<script setup lang="ts">
import { inventoryAdminApi } from '@/api/admin/inventory'
import { assetAdminApi } from '@/api/admin/asset'

// Set page title
useHead({
  title: 'Inventory Management - CRM System'
})

// Reactive data
const inventoryData = ref<any[]>([])
const assets = ref<any[]>([])
const loading = ref(false)

// Purchase form data
const purchaseForm = reactive({
  date: new Date().toISOString().split('T')[0], // Today's date
  notes: '',
  items: [
    {
      asset_id: '',
      serial_number: '',
      qty_masuk: 1,
      harga_satuan: 0,
      sub_total: 0
    }
  ]
})

// Deployment form data
const deploymentForm = reactive({
  asset_item_id: '',
  transaction_type: 'out' as 'in' | 'out',
  notes: '',
  customer_installation_id: '',
  trouble_ticket_id: ''
})

// Filters
const filters = reactive({
  brand: '',
  model: '',
  status: ''
})

// Fetch assets for dropdown
async function fetchAssets() {
  try {
    const response = await assetAdminApi().getAllAssets()
    if (response.success) {
      assets.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch assets:', error)
  }
}

// Fetch inventory status
async function fetchInventoryStatus() {
  loading.value = true
  try {
    const params: any = {}
    if (filters.brand) params.brand = filters.brand
    if (filters.model) params.model = filters.model
    if (filters.status) params.status = filters.status

    const response = await inventoryAdminApi().getInventoryStatus(params)
    if (response.success) {
      inventoryData.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch inventory status:', error)
    useToast().add({
      title: 'Failed to fetch inventory data',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

// Create purchase
async function createPurchase() {
  try {
    const response = await inventoryAdminApi().createPurchase(purchaseForm)
    useToast().add({
      title: 'Purchase created successfully!'
    })
    fetchInventoryStatus()
    // Reset form
    purchaseForm.items = [{
      asset_id: '',
      serial_number: '',
      qty_masuk: 1,
      harga_satuan: 0,
      sub_total: 0
    }]
  } catch (error: any) {
    useToast().add({
      title: error.message || 'Failed to create purchase',
      color: 'red'
    })
  }
}

// Create deployment
async function createDeployment() {
  try {
    const data: any = {
      asset_item_id: deploymentForm.asset_item_id,
      transaction_type: deploymentForm.transaction_type,
      notes: deploymentForm.notes
    }

    if (deploymentForm.customer_installation_id) {
      data.customer_installation_id = deploymentForm.customer_installation_id
    }
    if (deploymentForm.trouble_ticket_id) {
      data.trouble_ticket_id = parseInt(deploymentForm.trouble_ticket_id)
    }

    const response = await inventoryAdminApi().createDeployment(data)
    useToast().add({
      title: 'Asset deployment successful!'
    })
    fetchInventoryStatus()
  } catch (error: any) {
    useToast().add({
      title: error.message || 'Failed to deploy asset',
      color: 'red'
    })
  }
}

// Calculate subtotal
function calculateSubtotal(item: any) {
  item.sub_total = item.qty_masuk * item.harga_satuan
}

// Add new purchase item
function addPurchaseItem() {
  purchaseForm.items.push({
    asset_id: '',
    serial_number: '',
    qty_masuk: 1,
    harga_satuan: 0,
    sub_total: 0
  })
}

// Remove purchase item
function removePurchaseItem(index: number) {
  if (purchaseForm.items.length > 1) {
    purchaseForm.items.splice(index, 1)
  }
}

// Initialize
onMounted(() => {
  fetchAssets()
  fetchInventoryStatus()
})
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Inventory Management</h1>

    <!-- Filters -->
    <UCard class="mb-6">
      <template #header>
        <h3 class="text-lg font-semibold">Filter Inventory</h3>
      </template>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UInput
          v-model="filters.brand"
          placeholder="Filter by brand"
          label="Brand"
        />
        <UInput
          v-model="filters.model"
          placeholder="Filter by model"
          label="Model"
        />
        <USelect
          v-model="filters.status"
          :options="[
            { label: 'All Status', value: '' },
            { label: 'In Stock', value: 'in_stock' },
            { label: 'In Use', value: 'in_use' },
            { label: 'Maintenance', value: 'maintenance' },
            { label: 'Damaged', value: 'damaged' },
            { label: 'Retired', value: 'retired' }
          ]"
          label="Status"
        />
      </div>
      
      <div class="mt-4">
        <UButton @click="fetchInventoryStatus" :loading="loading">
          Apply Filters
        </UButton>
      </div>
    </UCard>

    <!-- Inventory Status -->
    <UCard class="mb-6">
      <template #header>
        <h3 class="text-lg font-semibold">Current Inventory Status</h3>
      </template>
      
      <div v-if="loading" class="text-center py-4">
        <UIcon name="refresh-cw" class="animate-spin h-6 w-6 mx-auto" />
        <p class="mt-2">Loading inventory data...</p>
      </div>
      
      <div v-else-if="inventoryData.length === 0" class="text-center py-4 text-gray-500">
        No inventory data found
      </div>
      
      <div v-else class="space-y-4">
        <div
          v-for="item in inventoryData"
          :key="`${item.brand}-${item.model}-${item.status}`"
          class="border rounded-lg p-4"
        >
          <div class="flex justify-between items-start mb-2">
            <div>
              <h4 class="font-semibold">{{ item.brand }} {{ item.model }}</h4>
              <p class="text-sm text-gray-600">Status: {{ item.status }}</p>
            </div>
            <UBadge :color="item.status === 'in_stock' ? 'green' : 'yellow'">
              {{ item.count }} items
            </UBadge>
          </div>
          
          <div v-if="item.items.length > 0" class="mt-3">
            <details class="cursor-pointer">
              <summary class="text-sm font-medium">View Items ({{ item.items.length }})</summary>
              <div class="mt-2 space-y-1">
                <div
                  v-for="assetItem in item.items.slice(0, 5)"
                  :key="assetItem.id"
                  class="text-xs bg-gray-50 p-2 rounded"
                >
                  MAC: {{ assetItem.mac_address }} | Created: {{ new Date(assetItem.created_at).toLocaleDateString() }}
                </div>
                <div v-if="item.items.length > 5" class="text-xs text-gray-500">
                  ... and {{ item.items.length - 5 }} more items
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Purchase Form -->
    <UCard class="mb-6">
      <template #header>
        <h3 class="text-lg font-semibold">Purchase New Stock</h3>
      </template>
      
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UInput
            v-model="purchaseForm.date"
            type="date"
            label="Purchase Date"
          />
          <UTextarea
            v-model="purchaseForm.notes"
            placeholder="Purchase notes..."
            label="Notes"
          />
        </div>
        
        <div v-for="(item, index) in purchaseForm.items" :key="index" class="border p-4 rounded-lg">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <USelect
              v-model="item.asset_id"
              :options="assets.map(a => ({ label: `${a.brand} ${a.model}`, value: a.id }))"
              placeholder="Select asset"
              label="Asset"
            />
            <UInput
              v-model="item.serial_number"
              placeholder="Serial number"
              label="Serial Number"
            />
            <UInput
              v-model.number="item.qty_masuk"
              type="number"
              min="1"
              label="Quantity"
              @input="calculateSubtotal(item)"
            />
            <UInput
              v-model.number="item.harga_satuan"
              type="number"
              min="0"
              label="Unit Price"
              @input="calculateSubtotal(item)"
            />
            <div>
              <label class="block text-sm font-medium mb-1">Subtotal</label>
              <div class="p-2 bg-gray-50 rounded text-sm">
                {{ item.sub_total.toLocaleString() }}
              </div>
            </div>
          </div>
          
          <div class="mt-2 flex justify-end">
            <UButton
              v-if="purchaseForm.items.length > 1"
              @click="removePurchaseItem(index)"
              color="red"
              variant="outline"
              size="sm"
            >
              Remove
            </UButton>
          </div>
        </div>
        
        <UButton @click="addPurchaseItem" variant="outline">
          Add Item
        </UButton>
        
        <UButton @click="createPurchase" class="w-full">
          Create Purchase
        </UButton>
      </div>
    </UCard>

    <!-- Deployment Form -->
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Asset Deployment</h3>
      </template>
      
      <div class="space-y-4">
        <UInput
          v-model="deploymentForm.asset_item_id"
          placeholder="Asset Item ID"
          label="Asset Item ID"
        />
        
        <USelect
          v-model="deploymentForm.transaction_type"
          :options="[
            { label: 'Deploy (Out)', value: 'out' },
            { label: 'Return (In)', value: 'in' }
          ]"
          label="Transaction Type"
        />
        
        <UTextarea
          v-model="deploymentForm.notes"
          placeholder="Deployment notes..."
          label="Notes"
        />
        
        <UInput
          v-model="deploymentForm.customer_installation_id"
          placeholder="Customer Installation ID (optional)"
          label="Customer Installation ID"
        />
        
        <UInput
          v-model="deploymentForm.trouble_ticket_id"
          type="number"
          placeholder="Trouble Ticket ID (optional)"
          label="Trouble Ticket ID"
        />
        
        <UButton @click="createDeployment" class="w-full">
          Deploy Asset
        </UButton>
      </div>
    </UCard>
  </div>
</template>
