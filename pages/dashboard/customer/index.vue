<script setup lang="ts">
import FormCustomerInstallation from './FormCustomerInstallation.vue'
import FormAddComponent from './FormAddComponent.vue'
import CustomerDetailModal from './CustomerDetailModal.vue'
import { customerAdminApi } from '@/api/admin/customer'
import { useNotification } from '@/composables/useNotification'
// Set page title
useHead({
  title: 'Customer Management - CRM System'
})

let customer = ref<any[]>([])
let installationReports = ref<any[]>([])

type Customer = {
    id: string
    name: string
    phone: string
    address: string
    area_code: string
    gmaps_link: string
    packet_internet: string
    hasInstallationReport?: boolean
}


async function getData() {
    try {
        const response = await customerAdminApi().getAllCustomers()
        response.data.forEach((customer: any) => {
            customer.number = response.data.indexOf(customer) + 1;
            customer.area_name = customer.area.name_city + "-" + customer.area.name_subdistrict + "-" + customer.area.name_village
            // customer.product_name = customer.product.name // Removed since product_id moved to network_devices
            customer.gmaps_link = "https://www.google.com/maps/place/" + customer.latitude + "," + customer.longitude
        })

        customer.value = [...response.data]
        
        // Load installation reports to check which customers already have reports
        await loadInstallationReports()
    } catch (err) {
        console.error('Error loading customers:', err)
        // Only show notification if it's available
        if (notification && notification.error) {
            notification.error('Error', String(err))
        }
    }
}

async function loadInstallationReports() {
    try {
        const response = await customerAdminApi().getInstallationReportComplete()
        installationReports.value = response.data || []
        
        // Update customer data with installation report status
        customer.value.forEach((customerItem: any) => {
            customerItem.hasInstallationReport = installationReports.value.some(
                (report: any) => report.customer_id === customerItem.id
            )
        })
    } catch (error) {
        console.error("Failed to load installation reports:", error)
        // Set all customers as not having installation reports if API fails
        customer.value.forEach((customerItem: any) => {
            customerItem.hasInstallationReport = false
        })
    }
}

async function deleteData(id: string) {
    try {
        const response = await customerAdminApi().deleteCustomer(id)
        await getData()
        if (notification && notification.success) {
            notification.success('Success', response.message)
        }
    } catch (err) {
        console.error('Error deleting customer:', err)
        if (notification && notification.error) {
            notification.error('Error', String(err))
        }
    }
}

// Enhanced delete with confirmation
const showDeleteModal = ref(false)
const deleteCustomerId = ref<string | null>(null)
const deleteCustomerName = ref('')
const deleteCustomerPhone = ref('')

function openDeleteConfirmation(customer: Customer) {
    deleteCustomerId.value = customer.id
    deleteCustomerName.value = customer.name
    deleteCustomerPhone.value = customer.phone
    showDeleteModal.value = true
}

function closeDeleteModal() {
    showDeleteModal.value = false
    deleteCustomerId.value = null
    deleteCustomerName.value = ''
    deleteCustomerPhone.value = ''
}

function onCustomerDeleted() {
    getData() // Refresh the customer list
}

// Load data after component is mounted to ensure notification system is ready
onMounted(async () => {
    await getData()
})

const columns = [
    {
        key: 'number',
        label: 'Number'
    }, {
        key: 'name',
        label: 'Name'
    }, {
        key: 'phone',
        label: 'Phone'
    }, {
        key: 'address',
        label: 'Address'
    }, {
        key: 'area_name',
        label: 'Area Code'
    }, {
        key: 'product_name',
        label: 'Packet Internet'
    }, {
        key: 'actions',
        label: 'Actions'
    }
]

const page = ref(1)
const pageCount = 5

const q = ref('')
const rows = computed(() => {
    if (!q.value) {
        return customer.value.slice((page.value - 1) * pageCount, (page.value) * pageCount)
    }
    const newData = customerData.value.filter((customer) => {
        return Object.values(customer).some((value) => {
            return String(value).toLowerCase().includes(q.value.toLowerCase())
        })
    })

    return newData.slice((page.value - 1) * pageCount, (page.value) * pageCount)
})


let customerData = customer

// const filteredRows = computed(() => {
//     if (!q.value) {
//         customerData = customer
//         return customer.value.slice((page.value - 1) * pageCount, (page.value) * pageCount)
//     }

//     const newData = customer.value.filter((person) => {
//         return Object.values(person).some((value) => {
//             // person with paginate
//             return String(value).toLowerCase().includes(q.value.toLowerCase())
//         })
//     })
//     customerData.value = newData
//     return newData.slice((page.value - 1) * pageCount, (page.value) * pageCount)
// })

const isOpen = ref(false)
const showDetailModal = ref(false)
const selectedCustomerId = ref<string | null>(null)

const items = (row: Customer) => {
    const baseItems = [
        [{
            label: 'View Detail Customer',
            icon: 'i-heroicons-eye-20-solid',
            click: () => OpenCustomerDetailModal(row.id)
        }, {
            label: 'Edit',
            icon: 'i-heroicons-pencil-square-20-solid',
            click: () => OpenModalAddCustomer(true, row)
        }]
    ]

    // Only show "Add Report Installation" if customer doesn't have one yet
    if (!row.hasInstallationReport) {
        baseItems.push([{
            label: 'Add Report Installation',
            icon: 'i-heroicons-archive-box-20-solid',
            click: () => OpenModalReportInstallation(true, row)
        }])
    }

    baseItems.push([{
        label: 'View Maps',
        icon: 'i-heroicons-arrow-right-circle-20-solid',
        click: () => window.open(row.gmaps_link, '_blank')
    }], [{
        label: 'Delete',
        icon: 'i-heroicons-trash-20-solid',
        click: () => openDeleteConfirmation(row)
    }])

    return baseItems
}

const notification = useNotification()
const modal = useModal()

function OpenModalAddCustomer(isEdit: boolean, data: any) {
    modal.open(FormAddComponent, {
        isEdit,
        data,
        async onSuccess() {
            await getData()
            modal.close()
        }
    })
}

function OpenModalReportInstallation(isEdit: boolean, data: any) {
    modal.open(FormCustomerInstallation, {
        isEdit,
        data,
        async onSuccess() {
            await getData()
            if (notification && notification.success) {
                notification.success('Success!', 'Installation report created successfully')
            }
            modal.close()
        }
    })
}

function OpenCustomerDetailModal(customerId: string) {
    selectedCustomerId.value = customerId
    showDetailModal.value = true
}

function closeDetailModal() {
    showDetailModal.value = false
    selectedCustomerId.value = null
}
</script>


<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Customer Management</h1>
        <p class="text-sm text-gray-600">Manage your customer database</p>
      </div>
      <UButton 
        label="Add Customer" 
        icon="i-heroicons-plus"
        @click="OpenModalAddCustomer(false, null)"
        class="w-full sm:w-auto"
      />
    </div>

    <!-- Search and Filter -->
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <UInput 
          v-model="q" 
          placeholder="Search customers by name, email, phone..." 
          icon="i-heroicons-magnifying-glass"
          class="w-full"
        />
      </div>
    </div>

    <!-- Mobile Card View -->
    <div class="block sm:hidden space-y-4">
      <div 
        v-for="customer in rows" 
        :key="customer.id"
        class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
      >
        <!-- Customer Header -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1">
            <button 
              @click="OpenCustomerDetailModal(customer.id)"
              class="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline"
            >
              {{ customer.name }}
            </button>
            <div class="flex items-center gap-2 mt-1">
              <span v-if="customer.hasInstallationReport" 
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <UIcon name="i-heroicons-check-circle" class="w-3 h-3 mr-1" />
                Report
              </span>
            </div>
          </div>
          <UDropdown :items="items(customer)">
            <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
          </UDropdown>
        </div>

        <!-- Customer Details -->
        <div class="space-y-2 text-sm">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-phone" class="w-4 h-4 text-gray-400" />
            <span class="text-gray-600">{{ customer.phone }}</span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-gray-400" />
            <span class="text-gray-600">{{ customer.address }}</span>
          </div>
          <div v-if="customer.area" class="flex items-center gap-2">
            <UIcon name="i-heroicons-building-office" class="w-4 h-4 text-gray-400" />
            <span class="text-gray-600">{{ customer.area.name_city }}</span>
            <span v-if="customer.area.code_name" 
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {{ customer.area.code_name }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop Table View -->
    <div class="hidden sm:block">
      <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <UTable :rows="rows" :columns="columns" class="w-full">
          <template #name-data="{ row }">
            <div class="flex items-center space-x-2">
              <button 
                @click="OpenCustomerDetailModal(row.id)"
                class="text-blue-600 hover:text-blue-800 hover:underline font-medium"
              >
                {{ row.name }}
              </button>
              <span v-if="row.hasInstallationReport" 
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    title="Has Installation Report">
                <UIcon name="i-heroicons-check-circle" class="w-3 h-3 mr-1" />
                Report
              </span>
            </div>
          </template>


          <template #area_name-data="{ row }">
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600">{{ row.area?.name_city || 'N/A' }}</span>
              <span v-if="row.area?.code_name" 
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {{ row.area.code_name }}
              </span>
            </div>
          </template>

          <template #actions-data="{ row }">
            <UDropdown :items="items(row)">
              <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
            </UDropdown>
          </template>
        </UTable>
      </div>
    </div>

    <!-- Pagination -->
    <div class="flex justify-center sm:justify-end">
      <UPagination v-model="page" :page-count="pageCount" :total="customer.length" />
    </div>

    <!-- Customer Detail Modal -->
    <CustomerDetailModal 
      v-if="showDetailModal && selectedCustomerId" 
      :customer-id="selectedCustomerId" 
      @close="closeDetailModal" 
    />

    <!-- Delete Confirmation Modal -->
    <CustomerDeleteConfirmationModal
      v-if="showDeleteModal"
      :is-open="showDeleteModal"
      :customer-id="deleteCustomerId"
      :customer-name="deleteCustomerName"
      :customer-phone="deleteCustomerPhone"
      @close="closeDeleteModal"
      @deleted="onCustomerDeleted"
    />
  </div>
</template>
