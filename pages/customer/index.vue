<script setup lang="ts">
import { formatIDR } from "@/helper/currency";
import { dashboardCustomerApi } from "../../api/customer/dashboard";
import { formatDateToYMD } from "@/helper/date";
import { use } from "echarts/core";

// Set page title
useHead({
  title: 'Customer Dashboard - CRM System'
})

// Disable SSR for this page to avoid serialization issues
definePageMeta({
  ssr: false
})

interface Customer {
  id: string;
  address: string;
  area_id: string;
  card_identition: string;
  company_id: string;
  email: string;
  gender: string;
  ip_static: string;
  job: string;
  latitude: number;
  longitude: number;
  mac_address: string;
  name: string;
  no_identition: number;
  phone: string;
  type_of_service: string;
  created_at: string;
  updated_at: string;
  installation_date: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Invoice {
  number: String;
  id: string;
  amount: number;
  customer_id: string;
  link: string;
  status: "unpaid" | "paid" | "pending"; // sesuaikan jika status lain ada
  created_at: string;
  updated_at: string;
}

interface NetworkDevice {
  id: string;
  customer_id: string;
  mac_address: string;
  ip_static: string;
  product_id: string;
  product?: Product;
}

interface DashboardResponse {
  customer: Customer;
  product: Product;
  invoice: Invoice[];
  network_device: NetworkDevice;
}

interface Column {
  key: keyof Invoice;
  label: string;
}

const columns: Column[] = [
  { key: "number", label: "Number" },
  { key: "created_at", label: "Date" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
  // { key: 'plan', label: 'Plan' },
];

let dashboardResponse = ref<DashboardResponse>({
  customer: {} as Customer,
  product: {} as Product,
  invoice: [] as Invoice[],
  network_device: {} as NetworkDevice,
});

function handlePayment() {
  dashboardCustomerApi()
    .createPaymentDashboard({
      invoice_id: dashboardResponse.value.invoice[0].id,
    })
    .then((response) => {
      window.open(`${response.data.redirect_url}`, "_blank");
    })
    .catch((error) => {});
}
async function getData() {
  await dashboardCustomerApi()
    .getCustomerDashboard()
    .then((response) => {
      console.log('Dashboard response:', response);
      
      // Safely handle the response data
      if (response && response.data) {
        const data = response.data;
        
        // Handle invoice numbering safely
        if (data.invoice && Array.isArray(data.invoice)) {
          data.invoice.forEach((invoice: any) => {
            invoice.number = data.invoice.indexOf(invoice) + 1;
          });
        }
        
        // Initialize network_device if not present
        if (!data.network_device) {
          data.network_device = {
            id: "",
            customer_id: "",
            mac_address: "",
            ip_static: "",
            product_id: "",
            product: null
          };
        }
        
        dashboardResponse.value = { ...data };
        
        // Check device status after loading data
        checkDeviceStatus();
      } else {
        console.error('Invalid response structure:', response);
        useCustomToast().add({
          title: 'Invalid response from server',
          color: "red",
        });
      }
    })
    .catch((err) => {
      console.error('Error loading dashboard data:', err);
      useCustomToast().add({
        title: err,
        color: "red",
      });
    });
}

const router = useRouter();

// Device status checking
const deviceStatus = ref<string>('unknown');
const isCheckingStatus = ref(false);
const isLoading = ref(true);
const isLoadingProducts = ref(false);
const availableProducts = ref<any[]>([]);
const showProducts = ref(false);

// Auto-refresh device status every 30 seconds
let statusRefreshInterval: NodeJS.Timeout | null = null;

onMounted(async () => {
  try {
    // Load data only on client side
    await getData();
    
    // Start auto-refresh if device has mac_address
    if (dashboardResponse.value.network_device?.mac_address) {
      statusRefreshInterval = setInterval(() => {
        checkDeviceStatus();
      }, 30000); // 30 seconds
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  if (statusRefreshInterval) {
    clearInterval(statusRefreshInterval);
  }
});

// Function to check device status via Mikrotik
async function checkDeviceStatus() {
  if (!dashboardResponse.value.network_device?.mac_address) {
    deviceStatus.value = 'off';
    return;
  }

  isCheckingStatus.value = true;
  try {
    const response = await dashboardCustomerApi().checkDeviceStatus();
    console.log('Device status response:', response);
    
    // Safely access the response data
    if (response && response.data && typeof response.data === 'object') {
      deviceStatus.value = response.data.status || 'unknown';
    } else {
      deviceStatus.value = 'unknown';
    }
  } catch (error) {
    console.error('Failed to check device status:', error);
    deviceStatus.value = 'unknown';
  } finally {
    isCheckingStatus.value = false;
  }
}

// Function to refresh all data
async function refreshData() {
  isLoading.value = true;
  try {
    await getData();
    console.log('Data refreshed successfully');
  } catch (error) {
    console.error('Failed to refresh data:', error);
  } finally {
    isLoading.value = false;
  }
}

// Function to load available products
async function loadAvailableProducts() {
  isLoadingProducts.value = true;
  try {
    const response = await dashboardCustomerApi().getAvailableProducts();
    console.log('Available products response:', response);
    
    if (response && response.data && Array.isArray(response.data)) {
      availableProducts.value = response.data;
      showProducts.value = true;
      console.log('Loaded products:', availableProducts.value);
    } else {
      console.error('Invalid products response:', response);
    }
  } catch (error) {
    console.error('Failed to load products:', error);
    useCustomToast().add({
      title: 'Failed to load products',
      color: "red",
    });
  } finally {
    isLoadingProducts.value = false;
  }
}

// Status is now determined by network device status
const status = computed(() => {
  if (!dashboardResponse.value.network_device?.mac_address) {
    return 'non active';
  }
  return deviceStatus.value === 'up' ? 'active' : 'non active';
});

const logout = async () => {
  await useAuthStore().logout();
  router.push("/login");
};
</script>

<template>
  <ClientOnly>
    <div class="min-h-screen bg-gray-100">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
      
      <!-- Main Content -->
      <div v-else>
    <div
      class="flex items-center justify-between p-4 text-white bg-green-600 shadow-md"
    >
      <div class="flex space-x-4">
        <div>
          <p class="text-sm">Hello, Welcome</p>
          <p class="text-2xl font-bold">
            {{ dashboardResponse.customer.name }}
          </p>
        </div>
        <UButton @click="logout" color="white" variant="outline"
          >Logout</UButton
        >
      </div>

      <div class="text-2xl font-bold">Lilly Apps</div>
    </div>

    <div class="max-w-4xl p-4 mx-auto space-y-6">
      <div class="p-6 bg-white border border-gray-200 shadow-lg rounded-xl">
        <div class="mb-4 text-center">
          <h2 class="text-xl font-bold text-gray-800">Installation Date</h2>
          <p class="text-gray-600">
            {{ formatDateToYMD(dashboardResponse.customer.installation_date) }}
          </p>
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="p-2">
            <p class="text-gray-600">Package Chosen</p>
            <p class="text-xl font-bold text-gray-800">
              {{ dashboardResponse.product?.name || 'No Package Assigned' }}
            </p>
            <!-- Debug info for package -->
            <div v-if="!dashboardResponse.product?.name" class="text-xs text-red-500 mt-1">
              Debug: Product data missing - Network Device: {{ dashboardResponse.network_device?.id || 'None' }}
            </div>
          </div>
          <div class="p-2">
            <p class="text-gray-600">Package Price</p>
            <p class="text-xl font-bold text-gray-800">
              {{ dashboardResponse.product?.price ? formatIDR(dashboardResponse.product.price) : 'N/A' }}
            </p>
          </div>
        </div>
        
        <!-- Network Device Information -->
        <div v-if="dashboardResponse.network_device?.id" class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 class="text-lg font-semibold text-blue-800 mb-2">Network Device Information</h3>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <p class="text-sm text-blue-600">MAC Address</p>
              <p class="font-mono text-sm text-blue-800">
                {{ dashboardResponse.network_device.mac_address || 'Not Available' }}
              </p>
            </div>
            <div>
              <p class="text-sm text-blue-600">IP Address</p>
              <p class="font-mono text-sm text-blue-800">
                {{ dashboardResponse.network_device.ip_static || 'Not Available' }}
              </p>
            </div>
            <div>
              <p class="text-sm text-blue-600">Product ID</p>
              <p class="font-mono text-sm text-blue-800">
                {{ dashboardResponse.network_device.product_id || 'Not Available' }}
              </p>
            </div>
            <div>
              <p class="text-sm text-blue-600">Device ID</p>
              <p class="font-mono text-sm text-blue-800">
                {{ dashboardResponse.network_device.id }}
              </p>
            </div>
          </div>
        </div>
        
        <!-- No Package Assigned Warning -->
        <div v-if="!dashboardResponse.product?.name" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 class="text-lg font-semibold text-red-800 mb-2">⚠️ No Package Assigned</h3>
          <div class="text-sm text-red-700 space-y-2">
            <p>This customer doesn't have a product/package assigned to them.</p>
            <div class="bg-red-100 p-3 rounded-md">
              <p class="font-medium">Possible Solutions:</p>
              <ul class="list-disc list-inside mt-2 space-y-1">
                <li>Create a network device record for this customer</li>
                <li>Assign a product to the customer in the admin panel</li>
                <li>Complete the installation process to link a product</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Available Products -->
        <div v-if="showProducts && availableProducts.length > 0" class="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 class="text-lg font-semibold text-purple-800 mb-2">Available Products</h3>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div v-for="product in availableProducts" :key="product.id" 
                 class="p-3 bg-white border border-purple-200 rounded-lg">
              <h4 class="font-semibold text-purple-800">{{ product.name }}</h4>
              <p class="text-sm text-purple-600">{{ product.description }}</p>
              <p class="text-lg font-bold text-purple-800">{{ formatIDR(product.price) }}</p>
              <div v-if="product.download_speed_mbps && product.upload_speed_mbps" 
                   class="text-xs text-purple-600">
                Speed: {{ product.download_speed_mbps }}M/{{ product.upload_speed_mbps }}M
              </div>
            </div>
          </div>
        </div>

        <!-- Debug Information -->
        <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 class="text-lg font-semibold text-yellow-800 mb-2">Debug Information</h3>
          <div class="text-xs text-yellow-700 space-y-1">
            <p><strong>Product Data:</strong> {{ JSON.stringify(dashboardResponse.product) }}</p>
            <p><strong>Network Device Data:</strong> {{ JSON.stringify(dashboardResponse.network_device) }}</p>
            <p><strong>Customer Data:</strong> {{ JSON.stringify(dashboardResponse.customer) }}</p>
          </div>
        </div>
      </div>

      <div class="flex flex-col items-center gap-4">
        <div
          class="flex flex-col items-center justify-center w-full max-w-md p-6 transition-all duration-300 rounded-lg"
          :class="status === 'active' ? 'bg-green-500' : 'bg-red-500'"
        >
          <p class="text-lg font-bold text-white">Internet Status</p>
          <p class="text-white capitalize">{{ status }}</p>
          <div v-if="dashboardResponse.network_device?.mac_address" class="mt-2 text-sm text-white/80">
            <p>MAC: {{ dashboardResponse.network_device.mac_address }}</p>
            <p v-if="dashboardResponse.network_device.ip_static">IP: {{ dashboardResponse.network_device.ip_static }}</p>
          </div>
          <div v-else class="mt-2 text-sm text-white/80">
            <p>No device information available</p>
          </div>
        </div>
        
        <!-- Device Status Check Button -->
        <div class="flex flex-col gap-2 w-full max-w-md">
          <UButton
            @click="checkDeviceStatus"
            :loading="isCheckingStatus"
            :disabled="!dashboardResponse.network_device?.mac_address"
            class="w-full"
            color="blue"
            variant="outline"
          >
            <LucideIcon name="refresh-cw" class="w-4 h-4 mr-2" />
            {{ isCheckingStatus ? 'Checking...' : 'Check Device Status' }}
          </UButton>
          
          <UButton
            @click="refreshData"
            :loading="isLoading"
            class="w-full"
            color="green"
            variant="outline"
          >
            <LucideIcon name="refresh-cw" class="w-4 h-4 mr-2" />
            {{ isLoading ? 'Refreshing...' : 'Refresh All Data' }}
          </UButton>
          
          <UButton
            @click="loadAvailableProducts"
            :loading="isLoadingProducts"
            class="w-full"
            color="purple"
            variant="outline"
          >
            <LucideIcon name="package" class="w-4 h-4 mr-2" />
            {{ isLoadingProducts ? 'Loading...' : 'Show Available Products' }}
          </UButton>
        </div>
        <UButton
          :disabled="
            dashboardResponse.invoice.length === 0 ||
            dashboardResponse.invoice[0].status === 'paid'
          "
          class="w-full max-w-md py-3 font-semibold text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
          size="xl"
          @click="handlePayment"
        >
          Payment Now
        </UButton>
      </div>

      <div class="p-6 bg-white border border-gray-200 shadow-lg rounded-xl">
        <h2 class="mb-4 text-lg font-bold text-gray-800">Recent Invoices</h2>
        <UTable
          :rows="dashboardResponse.invoice"
          :columns="columns"
          class="w-full"
          :class="{
            'text-gray-800': true,
            '[&>tbody>tr:nth-child(odd)]:bg-gray-50': true,
            '[&>tbody>tr:hover]:bg-gray-100': true,
          }"
        >
          <template #created_at-data="{ row }">
            <p>{{ row.created_at.split("T")[0] }}</p>
          </template>
          <template #amount-data="{ row }">
            <p>{{ formatIDR(row.amount) }}</p>
          </template>
          <template #status-data="{ row }">
            <UBadge
              size="sm"
              class="capitalize"
              :color="
                row.status === 'paid'
                  ? 'green'
                  : row.status === 'unpaid'
                  ? 'red'
                  : 'yellow'
              "
              :label="row.status"
            />
          </template>
        </UTable>
      </div>
    </div>
    </div>
    </div>
  </ClientOnly>
</template>