<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
    <div class="container mx-auto p-4 sm:p-6">
      <div class="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <!-- Header Section -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-gray-800">Customer Installation Reports</h1>
            <p class="text-sm text-gray-600 mt-1">Manage installation reports and track progress</p>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div class="bg-blue-50 p-3 sm:p-4 rounded-lg">
            <div class="flex items-center">
              <LucideIcon name="building" :size="24" class="text-blue-600 mr-2 sm:mr-3" />
              <div>
                <p class="text-xs sm:text-sm text-blue-600">Total Installations</p>
                <p class="text-lg sm:text-2xl font-bold text-blue-800">{{ stats.totalInstallations }}</p>
              </div>
            </div>
          </div>

          <div class="bg-green-50 p-3 sm:p-4 rounded-lg">
            <div class="flex items-center">
              <LucideIcon name="check-circle" :size="24" class="text-green-600 mr-2 sm:mr-3" />
              <div>
                <p class="text-xs sm:text-sm text-green-600">Completed</p>
                <p class="text-lg sm:text-2xl font-bold text-green-800">{{ stats.completed }}</p>
              </div>
            </div>
          </div>

          <div class="bg-yellow-50 p-3 sm:p-4 rounded-lg">
            <div class="flex items-center">
              <LucideIcon name="clock" :size="24" class="text-yellow-600 mr-2 sm:mr-3" />
              <div>
                <p class="text-xs sm:text-sm text-yellow-600">Pending</p>
                <p class="text-lg sm:text-2xl font-bold text-yellow-800">{{ stats.pending }}</p>
              </div>
            </div>
          </div>

          <div class="bg-purple-50 p-3 sm:p-4 rounded-lg">
            <div class="flex items-center">
              <LucideIcon name="wrench-screwdriver" :size="24" class="text-purple-600 mr-2 sm:mr-3" />
              <div>
                <p class="text-xs sm:text-sm text-purple-600">In Progress</p>
                <p class="text-lg sm:text-2xl font-bold text-purple-800">{{ stats.inProgress }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Feature Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <!-- Add Report Installation -->
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 p-4 sm:p-6 rounded-lg text-white">
            <div class="flex items-center mb-3 sm:mb-4">
              <LucideIcon name="file-plus" :size="32" class="mr-2 sm:mr-3" />
              <h3 class="text-lg sm:text-xl font-semibold">Add Report Installation</h3>
            </div>
            <p class="text-blue-100 mb-3 sm:mb-4 text-sm sm:text-base">
              Create comprehensive installation reports with asset tracking, network devices, customer services, and
              cables.
            </p>
            <UButton @click="navigateTo('/dashboard/customer')" color="white" variant="solid" class="w-full sm:w-auto">
              <template #leading>
                <LucideIcon name="plus" :size="16" />
              </template>
              Create Report
            </UButton>
          </div>

          <!-- View Reports -->
          <div class="bg-gradient-to-br from-green-500 to-green-600 p-4 sm:p-6 rounded-lg text-white">
            <div class="flex items-center mb-3 sm:mb-4">
              <LucideIcon name="bar-chart" :size="32" class="mr-2 sm:mr-3" />
              <h3 class="text-lg sm:text-xl font-semibold">View Reports</h3>
            </div>
            <p class="text-green-100 mb-3 sm:mb-4 text-sm sm:text-base">
              Access comprehensive reports including customer summaries, technician performance, and asset tracking.
            </p>
            <UButton @click="navigateTo('/dashboard/report/customer-installation/reports')" color="white"
              variant="solid" class="w-full sm:w-auto">
              <template #leading>
                <LucideIcon name="eye" :size="16" />
              </template>
              View Reports
            </UButton>
          </div>


          <!-- Asset Tracking -->
          <div class="bg-gradient-to-br from-orange-500 to-orange-600 p-4 sm:p-6 rounded-lg text-white">
            <div class="flex items-center mb-3 sm:mb-4">
              <LucideIcon name="cube" :size="32" class="mr-2 sm:mr-3" />
              <h3 class="text-lg sm:text-xl font-semibold">Asset Tracking</h3>
            </div>
            <p class="text-orange-100 mb-3 sm:mb-4 text-sm sm:text-base">
              Track asset movements, monitor inventory, and generate asset reports for installations.
            </p>
            <UButton @click="navigateTo('/dashboard/asset')" color="white" variant="solid" class="w-full sm:w-auto">
              <template #leading>
                <LucideIcon name="package" :size="16" />
              </template>
              Track Assets
            </UButton>
          </div>

          <!-- Customer Management -->
          <div class="bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 sm:p-6 rounded-lg text-white">
            <div class="flex items-center mb-3 sm:mb-4">
              <LucideIcon name="users" :size="32" class="mr-2 sm:mr-3" />
              <h3 class="text-lg sm:text-xl font-semibold">Customer Management</h3>
            </div>
            <p class="text-indigo-100 mb-3 sm:mb-4 text-sm sm:text-base">
              Manage customer information, view installation history, and track customer service records.
            </p>
            <UButton @click="navigateTo('/dashboard/customer')" color="white" variant="solid" class="w-full sm:w-auto">
              <template #leading>
                <LucideIcon name="user-circle" :size="16" />
              </template>
              Manage Customers
            </UButton>
          </div>

          <!-- Technician Management -->
          <div class="bg-gradient-to-br from-teal-500 to-teal-600 p-4 sm:p-6 rounded-lg text-white">
            <div class="flex items-center mb-3 sm:mb-4">
              <LucideIcon name="wrench-screwdriver" :size="32" class="mr-2 sm:mr-3" />
              <h3 class="text-lg sm:text-xl font-semibold">Technician Management</h3>
            </div>
            <p class="text-teal-100 mb-3 sm:mb-4 text-sm sm:text-base">
              Manage technician assignments, track performance, and monitor installation completion rates.
            </p>
            <UButton @click="navigateTo('/dashboard/user-management')" color="white" variant="solid"
              class="w-full sm:w-auto">
              <template #leading>
                <LucideIcon name="user-group" :size="16" />
              </template>
              Manage Technicians
            </UButton>
          </div>
        </div>

        <!-- Recent Installations -->
        <div class="mt-6 sm:mt-8">
          <h2 class="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Recent Installations</h2>
          <div class="bg-gray-50 rounded-lg p-3 sm:p-4">
            <div v-if="recentInstallations.length === 0" class="text-center py-6 sm:py-8 text-gray-500">
              <LucideIcon name="file-text" :size="48" class="mb-2 mx-auto" />
              <p class="text-sm sm:text-base">No recent installations found</p>
            </div>
            <div v-else class="space-y-3">
              <div v-for="installation in recentInstallations" :key="installation.id"
                class="bg-white p-3 sm:p-4 rounded-lg border">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div class="flex-1">
                    <h3 class="font-medium text-gray-800 text-sm sm:text-base">
                      {{ installation.customer?.name || installation.customer_name || 'Unknown Customer' }}
                    </h3>
                    <p class="text-xs sm:text-sm text-gray-500">
                      {{ installation.installation_type || 'Unknown Type' }}
                    </p>
                    <p class="text-xs text-gray-400">
                      {{ formatDate(installation.on_air_date || installation.created_at) }}
                    </p>
                  </div>
                  <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span :class="getStatusColor(installation.status || installation.installation_status)"
                      class="px-2 py-1 rounded-full text-xs font-medium self-start sm:self-auto">
                      {{ installation.status || installation.installation_status || 'Unknown' }}
                    </span>
                    <UButton @click="viewInstallation(installation.id)" size="sm" color="blue" variant="outline"
                      class="w-full sm:w-auto">
                      <template #leading>
                        <LucideIcon name="eye" :size="16" />
                      </template>
                      View
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { customerAdminApi } from "@/api/admin/customer";
import { archiveInstallationAdminApi } from "@/api/admin/archive-installation";
import type { InstallationAssetReportResponse, CompleteInstallationReportWithTechnicianPhotosResponse } from "@/types/requests/installation-report";
import { useNavigationContext } from "@/composables/useNavigationContext";
import LucideIcon from '@/components/LucideIcon.vue';

// Apply auth middleware
definePageMeta({
  middleware: 'auth'
})

const stats = ref({
  totalInstallations: 0,
  completed: 0,
  pending: 0,
  inProgress: 0
});

const recentInstallations = ref<CompleteInstallationReportWithTechnicianPhotosResponse[]>([]);

onMounted(async () => {
  await loadStats();
  await loadRecentInstallations();
});

async function loadStats() {
  try {
    const response = await customerAdminApi().getInstallationSummaryPerCustomer();
    const summaries = response.data || [];

    stats.value = {
      totalInstallations: summaries.reduce((sum: number, item: any) => sum + (item.total_installations || 0), 0),
      completed: summaries.reduce((sum: number, item: any) => sum + (item.completed_installations || 0), 0),
      pending: summaries.reduce((sum: number, item: any) => sum + (item.pending_installations || 0), 0),
      inProgress: summaries.reduce((sum: number, item: any) => sum + (item.in_progress_installations || 0), 0)
    };
  } catch (error) {
    console.error("Failed to load stats:", error);
    // Set default values if API fails
    stats.value = {
      totalInstallations: 0,
      completed: 0,
      pending: 0,
      inProgress: 0
    };
  }
}

async function loadRecentInstallations() {
  try {
    const response = await archiveInstallationAdminApi().getAllArchiveInstallation();
    const installations = response.data || [];

    // Sort by created_at date (most recent first) and take only the first 5
    const sortedInstallations = installations
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    recentInstallations.value = sortedInstallations;
  } catch (error) {
    console.error("Failed to load recent installations:", error);
    // Set empty array if API fails
    recentInstallations.value = [];
  }
}

function viewInstallation(installationId: string | undefined) {
  if (!installationId) return;

  // Set navigation context to indicate we came from reports page
  const { setNavigationContext } = useNavigationContext();
  setNavigationContext({
    from: 'reports',
    returnUrl: '/dashboard/report/customer-installation',
    returnLabel: 'Back to Dashboard'
  });

  navigateTo(`/dashboard/report/customer-installation/detail/${installationId}`);
}

function getStatusColor(status: string | undefined) {
  if (!status) return 'bg-gray-100 text-gray-800';

  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'completed':
    case 'done':
    case 'finished':
      return 'bg-green-100 text-green-800';
    case 'pending':
    case 'waiting':
      return 'bg-yellow-100 text-yellow-800';
    case 'in_progress':
    case 'in progress':
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
    case 'canceled':
      return 'bg-red-100 text-red-800';
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function formatDate(dateString: string | undefined) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>
