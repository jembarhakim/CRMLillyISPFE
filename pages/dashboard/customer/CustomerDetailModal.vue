<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">Customer Detail</h2>
        <UButton
          color="gray"
          variant="ghost"
          icon="i-heroicons-x-mark-20-solid"
          @click="$emit('close')"
        />
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="p-6 text-center">
        <LoadingComponent />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-6 text-center text-red-600">
        <p>{{ error }}</p>
        <UButton @click="fetchCustomerDetail" class="mt-4">Retry</UButton>
      </div>

      <!-- Content -->
      <div v-else-if="customerDetail" class="p-6 space-y-6">
        <!-- Basic Customer Information -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Name</label>
              <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.name }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Email</label>
              <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.email || 'N/A' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Phone</label>
              <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.phone }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Gender</label>
              <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.gender }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Job</label>
              <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.job }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Type of Service</label>
              <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.type_of_service }}</p>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700">Address</label>
              <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.address }}</p>
            </div>
          </div>
        </div>

        <!-- Location Information -->
        <div class="bg-blue-50 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Location & Area</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Area</label>
              <p class="mt-1 text-sm text-gray-900">
                {{ customerDetail.customer.area?.name_city }} - 
                {{ customerDetail.customer.area?.name_subdistrict }} - 
                {{ customerDetail.customer.area?.name_village }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Company</label>
              <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.company?.name }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Latitude</label>
              <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.latitude }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Longitude</label>
              <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.longitude }}</p>
            </div>
          </div>
        </div>

        <!-- Network Information -->
        <div class="bg-green-50 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Network Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Internet Package</label>
              <p class="mt-1 text-sm text-gray-900">{{ customerDetail.customer.product?.name }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Package Price</label>
              <p class="mt-1 text-sm text-gray-900">{{ formatIDR(customerDetail.customer.product?.price || 0) }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">IP Static</label>
              <p class="mt-1 text-sm text-gray-900">
                <span v-if="getNetworkDeviceIPs().length > 0">
                  {{ getNetworkDeviceIPs().join(', ') }}
                </span>
                <span v-else class="text-gray-500">No IP addresses found</span>
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">MAC Address</label>
              <p class="mt-1 text-sm text-gray-900">
                <span v-if="getNetworkDeviceMACs().length > 0">
                  {{ getNetworkDeviceMACs().join(', ') }}
                </span>
                <span v-else class="text-gray-500">No MAC addresses found</span>
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Installation Date</label>
              <p class="mt-1 text-sm text-gray-900">{{ formatDate(customerDetail.customer.installation_date) }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Next Payment Date</label>
              <p class="mt-1 text-sm text-gray-900">{{ formatDate(customerDetail.customer.next_payment_date) }}</p>
            </div>
          </div>
        </div>

        <!-- Network Devices -->
        <div v-if="customerDetail.network_devices && customerDetail.network_devices.length > 0" class="bg-purple-50 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Network Devices</h3>
          <div class="space-y-3">
            <div 
              v-for="device in customerDetail.network_devices" 
              :key="device.id"
              class="bg-white rounded-lg p-3 border"
            >
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label class="block text-xs font-medium text-gray-700">IP Static</label>
                  <p class="text-sm text-gray-900">{{ device.ip_static || 'N/A' }}</p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700">MAC Address</label>
                  <p class="text-sm text-gray-900">{{ device.mac_address || 'N/A' }}</p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700">Device Status</label>
                  <span 
                    :class="device.status_perangkat === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                    class="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {{ device.status_perangkat?.toUpperCase() }}
                  </span>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700">Ping Status</label>
                  <span 
                    :class="device.last_ping_status === 'up' ? 'bg-green-100 text-green-800' : device.last_ping_status === 'down' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'"
                    class="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {{ device.last_ping_status?.toUpperCase() }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Installation History -->
        <div v-if="customerDetail.installations && customerDetail.installations.length > 0" class="bg-yellow-50 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Installation History</h3>
          <div class="space-y-3">
            <div 
              v-for="installation in customerDetail.installations" 
              :key="installation.id"
              class="bg-white rounded-lg p-3 border"
            >
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-gray-700">Technician</label>
                  <p class="text-sm text-gray-900">{{ installation.technician?.name || 'N/A' }}</p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700">Date</label>
                  <p class="text-sm text-gray-900">{{ formatDate(installation.date) }}</p>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-xs font-medium text-gray-700">Description</label>
                  <p class="text-sm text-gray-900">{{ installation.description || 'No description' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Invoices -->
        <div v-if="customerDetail.invoices && customerDetail.invoices.length > 0" class="bg-indigo-50 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Invoices</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="invoice in customerDetail.invoices" :key="invoice.id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatDate(invoice.createdAt) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatIDR(invoice.amount) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span 
                      :class="getStatusColor(invoice.status)"
                      class="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                    >
                      {{ invoice.status?.toUpperCase() }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end p-6 border-t border-gray-200">
        <UButton @click="$emit('close')" color="gray">Close</UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { customerAdminApi } from '@/api/admin/customer'
import { formatIDR } from '@/helper/currency'
import LoadingComponent from '@/components/LoadingComponent.vue'

interface Props {
  customerId: string
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const customerDetail = ref<any>(null)
const loading = ref(true)
const error = ref<string | undefined>(undefined)

const formatDate = (date: string | Date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString()
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'unpaid':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Extract IP addresses from network devices
const getNetworkDeviceIPs = () => {
  if (!customerDetail.value?.network_devices) return []
  return customerDetail.value.network_devices
    .filter((device: any) => device.ip_static)
    .map((device: any) => device.ip_static)
}

// Extract MAC addresses from network devices
const getNetworkDeviceMACs = () => {
  if (!customerDetail.value?.network_devices) return []
  return customerDetail.value.network_devices
    .filter((device: any) => device.mac_address)
    .map((device: any) => device.mac_address)
}

const fetchCustomerDetail = async () => {
  try {
    loading.value = true
    error.value = undefined
    const response = await customerAdminApi().getCustomerDetail(props.customerId)
    customerDetail.value = response.data
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch customer details'
    useToast().add({
      title: 'Error',
      description: error.value || 'An error occurred',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

// Fetch data when component mounts
onMounted(() => {
  fetchCustomerDetail()
})
</script>