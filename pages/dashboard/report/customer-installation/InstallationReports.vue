<template>
  <div class="container mx-auto p-6">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Installation Reports</h1>
        <UButton @click="navigateTo('/dashboard/report/customer-installation/add')" color="blue">
          <LucideIcon name="plus" class="mr-2" />
          Add Report Installation
        </UButton>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-blue-50 p-4 rounded-lg">
          <div class="flex items-center">
            <LucideIcon name="building" class="text-blue-600 text-2xl mr-3" />
            <div>
              <p class="text-sm text-blue-600">Total Customers</p>
              <p class="text-2xl font-bold text-blue-800">{{ summaryStats.totalCustomers }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <div class="flex items-center">
            <LucideIcon name="check-circle" class="text-green-600 text-2xl mr-3" />
            <div>
              <p class="text-sm text-green-600">Completed</p>
              <p class="text-2xl font-bold text-green-800">{{ summaryStats.completedInstallations }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-yellow-50 p-4 rounded-lg">
          <div class="flex items-center">
            <LucideIcon name="clock" class="text-yellow-600 text-2xl mr-3" />
            <div>
              <p class="text-sm text-yellow-600">Pending</p>
              <p class="text-2xl font-bold text-yellow-800">{{ summaryStats.pendingInstallations }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg">
          <div class="flex items-center">
            <LucideIcon name="wrench-screwdriver" class="text-purple-600 text-2xl mr-3" />
            <div>
              <p class="text-sm text-purple-600">In Progress</p>
              <p class="text-2xl font-bold text-purple-800">{{ summaryStats.inProgressInstallations }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <UTabs :items="tabs" class="w-full">
        <template #customer-summary="{ item }">
          <div class="p-4">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tgl. Permintaan PSB</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Installations</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Durasi PSB</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tepat Waktu</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terlambat</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="summary in customerSummaries" :key="summary.customer_id">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{{ summary.customer_name }}</div>
                      <div class="text-sm text-gray-500">{{ summary.customer_phone }}</div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="text-sm text-gray-900">{{ summary.customer_address }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ summary.tgl_permintaan_psb ? formatDate(summary.tgl_permintaan_psb) : '-' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {{ summary.total_installations }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {{ summary.completed_installations }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {{ summary.pending_installations }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span v-if="summary.avg_durasi_psb !== null && summary.avg_durasi_psb !== undefined" class="font-medium">
                        {{ Math.round(summary.avg_durasi_psb) }} hari
                      </span>
                      <span v-else class="text-gray-400">-</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {{ summary.tepat_waktu_count || 0 }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {{ summary.terlambat_count || 0 }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <UButton @click="viewCustomerDetails(summary.customer_id)" size="sm" color="blue" variant="outline">
                        View Details
                      </UButton>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <template #technician-report="{ item }">
          <div class="p-4">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technician</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Installations</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Completion Days</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latest Completion</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="report in technicianReports" :key="report.technician_id">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{{ report.technician_name }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ report.technician_phone || '-' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {{ report.total_installations }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {{ report.completed_installations }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {{ report.pending_installations }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ report.avg_completion_days ? Math.round(report.avg_completion_days) + ' days' : '-' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ report.latest_completion_date ? formatDate(report.latest_completion_date) : '-' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <template #asset-report="{ item }">
          <div class="p-4">
            <div class="mb-4">
              <UInput
                v-model="searchInstallationId"
                placeholder="Search by Installation ID"
                class="max-w-md"
              />
              <UButton @click="loadAssetReport" class="ml-2" :loading="loadingAssetReport">
                Search
              </UButton>
            </div>
            
            <div v-if="assetReport" class="bg-gray-50 p-4 rounded-lg">
              <h3 class="text-lg font-semibold mb-4">Asset Report for Installation: {{ assetReport.installation_id }}</h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="bg-white p-3 rounded border">
                  <h4 class="font-medium text-gray-800">Customer</h4>
                  <p class="text-gray-600">{{ assetReport.customer_name }}</p>
                </div>
                <div class="bg-white p-3 rounded border">
                  <h4 class="font-medium text-gray-800">Installation Type</h4>
                  <p class="text-gray-600">{{ assetReport.installation_type }}</p>
                </div>
                <div class="bg-white p-3 rounded border">
                  <h4 class="font-medium text-gray-800">Status</h4>
                  <p class="text-gray-600">{{ assetReport.installation_status }}</p>
                </div>
                <div class="bg-white p-3 rounded border">
                  <h4 class="font-medium text-gray-800">On Air Date</h4>
                  <p class="text-gray-600">{{ assetReport.on_air_date ? formatDate(assetReport.on_air_date) : '-' }}</p>
                </div>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-white p-3 rounded border">
                  
                </div>
                <div class="bg-white p-3 rounded border">
                  
                </div>
              </div>
            </div>
          </div>
        </template>

        <template #complete-reports>
          <div class="p-4">
            <div class="mb-4 flex justify-between items-center">
              <h3 class="text-lg font-semibold">Complete Installation Reports</h3>
              <UButton @click="loadCompleteInstallationReports" :loading="loadingCompleteReports">
                Refresh
              </UButton>
            </div>
            
            <div v-if="loadingCompleteReports" class="text-center py-8">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p class="mt-2 text-gray-600">Loading complete installation reports...</p>
            </div>
            
            <div v-else-if="completeInstallationReports.length === 0" class="text-center py-8 text-gray-500">
              <p>No complete installation reports found.</p>
            </div>
            
            <div v-else class="space-y-4">
              <div v-for="report in completeInstallationReports" :key="report.installation_id" 
                   class="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <!-- Customer Info -->
                  <div>
                    <h4 class="font-semibold text-gray-800 mb-2">Customer Information</h4>
                    <p class="text-sm text-gray-600"><strong>Name:</strong> {{ report.customer_name || '-' }}</p>
                    <p class="text-sm text-gray-600"><strong>Phone:</strong> {{ report.customer_phone || '-' }}</p>
                    <p class="text-sm text-gray-600"><strong>Address:</strong> {{ report.customer_address || '-' }}</p>
                  </div>
                  
                  <!-- Installation Info -->
                  <div>
                    <h4 class="font-semibold text-gray-800 mb-2">Installation Details</h4>
                    <p class="text-sm text-gray-600"><strong>Status:</strong> {{ report.installation_status || '-' }}</p>
                    <p class="text-sm text-gray-600"><strong>Type:</strong> {{ report.installation_type || '-' }}</p>
                    <p class="text-sm text-gray-600"><strong>Technician:</strong> {{ report.technician_name || '-' }}</p>
                    <p class="text-sm text-gray-600"><strong>On Air Date:</strong> {{ report.on_air_date ? formatDate(report.on_air_date) : '-' }}</p>
                  </div>
                  
                  <!-- Network Device Info -->
                  <div>
                    <h4 class="font-semibold text-gray-800 mb-2">Network Device</h4>
                    <p class="text-sm text-gray-600"><strong>MAC Address:</strong> {{ report.mac_address || '-' }}</p>
                    <p class="text-sm text-gray-600"><strong>IP Static:</strong> {{ report.ip_static || '-' }}</p>
                    <p class="text-sm text-gray-600"><strong>Router:</strong> {{ report.router_brand || '-' }} {{ report.router_model || '' }}</p>
                    <p class="text-sm text-gray-600"><strong>Product:</strong> {{ report.product_name || '-' }}</p>
                  </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="mt-4 flex justify-end space-x-2">
                  <UButton 
                    size="sm" 
                    variant="outline"
                    @click="viewReportDetail(report.installation_id)"
                  >
                    View Details
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </template>
      </UTabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { customerAdminApi } from "@/api/admin/customer";
import type { 
  InstallationSummaryResponse, 
  InstallationTechnicianReportResponse, 
  InstallationAssetReportResponse 
} from "@/types/requests/installation-report";
import { useNavigationContext } from "@/composables/useNavigationContext";
import { useCustomToast } from "@/composables/useCustomToast";

// Apply auth middleware
definePageMeta({
  middleware: 'auth'
})

const tabs = [
  {
    key: 'customer-summary',
    label: 'Customer Summary',
    icon: 'building'
  },
  {
    key: 'technician-report',
    label: 'Technician Report',
    icon: 'wrench-screwdriver'
  },
  {
    key: 'asset-report',
    label: 'Asset Report',
    icon: 'cube'
  },
  {
    key: 'complete-reports',
    label: 'Complete Installation Reports',
    icon: 'file-text'
  }
];

const customerSummaries = ref<InstallationSummaryResponse[]>([]);
const technicianReports = ref<InstallationTechnicianReportResponse[]>([]);
const assetReport = ref<InstallationAssetReportResponse | null>(null);
const searchInstallationId = ref('');
const loadingAssetReport = ref(false);
const completeInstallationReports = ref<any[]>([]);
const loadingCompleteReports = ref(false);

const summaryStats = computed(() => {
  const totalCustomers = customerSummaries.value.length;
  const completedInstallations = customerSummaries.value.reduce((sum, item) => sum + item.completed_installations, 0);
  const pendingInstallations = customerSummaries.value.reduce((sum, item) => sum + item.pending_installations, 0);
  const inProgressInstallations = customerSummaries.value.reduce((sum, item) => sum + item.in_progress_installations, 0);
  
  return {
    totalCustomers,
    completedInstallations,
    pendingInstallations,
    inProgressInstallations
  };
});

onMounted(async () => {
  await loadCustomerSummaries();
  await loadTechnicianReports();
  await loadCompleteInstallationReports();
});

async function loadCustomerSummaries() {
  try {
    const response = await customerAdminApi().getInstallationSummaryPerCustomer();
    customerSummaries.value = response.data || [];
  } catch (error) {
    console.error("Failed to load customer summaries:", error);
    useCustomToast().add({
      title: "Error",
      description: "Failed to load customer summaries",
      color: "red",
    });
  }
}

async function loadTechnicianReports() {
  try {
    const response = await customerAdminApi().getInstallationTechnicianReport();
    technicianReports.value = response.data || [];
  } catch (error) {
    console.error("Failed to load technician reports:", error);
    useCustomToast().add({
      title: "Error",
      description: "Failed to load technician reports",
      color: "red",
    });
  }
}

async function loadCompleteInstallationReports() {
  try {
    loadingCompleteReports.value = true;
    const response = await customerAdminApi().getInstallationReportComplete();
    completeInstallationReports.value = response.data || [];
    console.log("Complete installation reports loaded:", completeInstallationReports.value.length);
  } catch (error) {
    console.error("Failed to load complete installation reports:", error);
    useCustomToast().add({
      title: "Error",
      description: "Failed to load complete installation reports",
      color: "red",
    });
  } finally {
    loadingCompleteReports.value = false;
  }
}

async function loadAssetReport() {
  if (!searchInstallationId.value.trim()) {
    useCustomToast().add({
      title: "Error",
      description: "Please enter an installation ID",
      color: "red",
    });
    return;
  }
  
  loadingAssetReport.value = true;
  try {
    const response = await customerAdminApi().getInstallationAssetReport(searchInstallationId.value);
    assetReport.value = response.data;
  } catch (error) {
    console.error("Failed to load asset report:", error);
    useCustomToast().add({
      title: "Error",
      description: "Failed to load asset report",
      color: "red",
    });
    assetReport.value = null;
  } finally {
    loadingAssetReport.value = false;
  }
}

function viewCustomerDetails(customerId: string) {
  navigateTo(`/dashboard/customer/${customerId}`);
}

function formatDate(dateString: string) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function viewReportDetail(installationId: string) {
  // Set navigation context to indicate we came from reports page
  const { setNavigationContext } = useNavigationContext();
  setNavigationContext({
    from: 'reports',
    returnUrl: '/dashboard/report/customer-installation/reports',
    returnLabel: 'Back to Reports'
  });
  
  navigateTo(`/dashboard/report/customer-installation/detail/${installationId}`);
}
</script>
