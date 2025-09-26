<template>
  <div class="container mx-auto p-6">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Customer Installation Reports</h1>
        <div class="flex space-x-3">
          <UButton @click="navigateTo('/dashboard/report/customer-installation/reports')" color="blue" variant="outline">
            <UIcon name="i-heroicons-chart-bar" class="mr-2" />
            View Reports
          </UButton>
          <UButton @click="navigateTo('/dashboard/customer')" color="blue">
            <UIcon name="i-heroicons-plus" class="mr-2" />
            Add Report Installation
          </UButton>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-blue-50 p-4 rounded-lg">
          <div class="flex items-center">
            <UIcon name="i-heroicons-building-office" class="text-blue-600 text-2xl mr-3" />
            <div>
              <p class="text-sm text-blue-600">Total Installations</p>
              <p class="text-2xl font-bold text-blue-800">{{ stats.totalInstallations }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <div class="flex items-center">
            <UIcon name="i-heroicons-check-circle" class="text-green-600 text-2xl mr-3" />
            <div>
              <p class="text-sm text-green-600">Completed</p>
              <p class="text-2xl font-bold text-green-800">{{ stats.completed }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-yellow-50 p-4 rounded-lg">
          <div class="flex items-center">
            <UIcon name="i-heroicons-clock" class="text-yellow-600 text-2xl mr-3" />
            <div>
              <p class="text-sm text-yellow-600">Pending</p>
              <p class="text-2xl font-bold text-yellow-800">{{ stats.pending }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg">
          <div class="flex items-center">
            <UIcon name="i-heroicons-wrench-screwdriver" class="text-purple-600 text-2xl mr-3" />
            <div>
              <p class="text-sm text-purple-600">In Progress</p>
              <p class="text-2xl font-bold text-purple-800">{{ stats.inProgress }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Add Report Installation -->
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div class="flex items-center mb-4">
            <UIcon name="i-heroicons-document-plus" class="text-3xl mr-3" />
            <h3 class="text-xl font-semibold">Add Report Installation</h3>
          </div>
          <p class="text-blue-100 mb-4">
            Create comprehensive installation reports with asset tracking, network devices, customer services, and cables.
          </p>
          <UButton @click="navigateTo('/dashboard/customer')" color="white" variant="solid">
            Create Report
          </UButton>
        </div>

        <!-- View Reports -->
        <div class="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div class="flex items-center mb-4">
            <UIcon name="i-heroicons-chart-bar" class="text-3xl mr-3" />
            <h3 class="text-xl font-semibold">View Reports</h3>
          </div>
          <p class="text-green-100 mb-4">
            Access comprehensive reports including customer summaries, technician performance, and asset tracking.
          </p>
          <UButton @click="navigateTo('/dashboard/report/customer-installation/reports')" color="white" variant="solid">
            View Reports
          </UButton>
        </div>

        <!-- Installation Management -->
        <div class="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg text-white">
          <div class="flex items-center mb-4">
            <UIcon name="i-heroicons-cog-6-tooth" class="text-3xl mr-3" />
            <h3 class="text-xl font-semibold">Installation Management</h3>
          </div>
          <p class="text-purple-100 mb-4">
            Manage existing installations, update status, and track progress through the installation lifecycle.
          </p>
          <UButton @click="navigateTo('/dashboard/customer-installation')" color="white" variant="solid">
            Manage Installations
          </UButton>
        </div>

        <!-- Asset Tracking -->
        <div class="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg text-white">
          <div class="flex items-center mb-4">
            <UIcon name="i-heroicons-cube" class="text-3xl mr-3" />
            <h3 class="text-xl font-semibold">Asset Tracking</h3>
          </div>
          <p class="text-orange-100 mb-4">
            Track asset movements, monitor inventory, and generate asset reports for installations.
          </p>
          <UButton @click="navigateTo('/dashboard/asset')" color="white" variant="solid">
            Track Assets
          </UButton>
        </div>

        <!-- Customer Management -->
        <div class="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-lg text-white">
          <div class="flex items-center mb-4">
            <UIcon name="i-heroicons-users" class="text-3xl mr-3" />
            <h3 class="text-xl font-semibold">Customer Management</h3>
          </div>
          <p class="text-indigo-100 mb-4">
            Manage customer information, view installation history, and track customer service records.
          </p>
          <UButton @click="navigateTo('/dashboard/customer')" color="white" variant="solid">
            Manage Customers
          </UButton>
        </div>

        <!-- Technician Management -->
        <div class="bg-gradient-to-br from-teal-500 to-teal-600 p-6 rounded-lg text-white">
          <div class="flex items-center mb-4">
            <UIcon name="i-heroicons-wrench-screwdriver" class="text-3xl mr-3" />
            <h3 class="text-xl font-semibold">Technician Management</h3>
          </div>
          <p class="text-teal-100 mb-4">
            Manage technician assignments, track performance, and monitor installation completion rates.
          </p>
          <UButton @click="navigateTo('/dashboard/user-management')" color="white" variant="solid">
            Manage Technicians
          </UButton>
        </div>
      </div>

      <!-- Recent Installations -->
      <div class="mt-8">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Recent Installations</h2>
        <div class="bg-gray-50 rounded-lg p-4">
          <div v-if="recentInstallations.length === 0" class="text-center py-8 text-gray-500">
            <UIcon name="i-heroicons-document-text" class="text-4xl mb-2" />
            <p>No recent installations found</p>
          </div>
          <div v-else class="space-y-3">
            <div v-for="installation in recentInstallations" :key="installation.installation_id" class="bg-white p-4 rounded-lg border">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-medium text-gray-800">{{ installation.customer_name || 'Unknown Customer' }}</h3>
                  <p class="text-sm text-gray-500">{{ installation.installation_type || 'Unknown Type' }}</p>
                  <p class="text-xs text-gray-400">{{ formatDate(installation.on_air_date) }}</p>
                </div>
                <div class="flex items-center space-x-2">
                  <span :class="getStatusColor(installation.installation_status)" class="px-2 py-1 rounded-full text-xs font-medium">
                    {{ installation.installation_status }}
                  </span>
                  <UButton @click="viewInstallation(installation.installation_id)" size="sm" color="blue" variant="outline">
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
</template>

<script setup lang="ts">
import { customerAdminApi } from "@/api/admin/customer";
import type { InstallationAssetReportResponse } from "@/types/requests/installation-report";

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

const recentInstallations = ref<InstallationAssetReportResponse[]>([]);

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
    // You might need to create this endpoint or use existing one
    const response = await customerAdminApi().getAllCustomers();
    recentInstallations.value = (response.data || []).slice(0, 5); // Show only recent 5
  } catch (error) {
    console.error("Failed to load recent installations:", error);
    // Set empty array if API fails
    recentInstallations.value = [];
  }
}

function viewInstallation(installationId: string | undefined) {
  if (!installationId) return;
  navigateTo(`/dashboard/report/customer-installation/${installationId}`);
}

function getStatusColor(status: string | undefined) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
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
