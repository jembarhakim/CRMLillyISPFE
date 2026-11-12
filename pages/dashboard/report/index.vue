<script setup lang="ts">
import CashFlow from "./cash-flow/CashFlow.vue";
import FormAddComponent from "./cash-flow/FormAddComponent.vue";
import CustomerInstallation from "./customer-installation/index.vue";
import Internet from "./internet/Internet.vue";

// Set page title
useHead({
  title: 'Reports - CRM System'
})

const customerInstallationRef = ref();

const tab_items = [
  {
    label: "Report Cash Flow",
    value: "report-cash-flow",
  },
  {
    label: "Report Internet",
    value: "report-internet",
  },
  {
    label: "Report Customer Installation",
    value: "report-customer",
  }
];

// Listen for installation creation events
onMounted(() => {
  // Listen for custom events from the form
  window.addEventListener('installation-created', () => {
    if (customerInstallationRef.value) {
      customerInstallationRef.value.refreshData();
    }
  });
});

onUnmounted(() => {
  window.removeEventListener('installation-created', () => {});
});
</script>

<template>
  <div class="space-y-5">
    <AdminPageHeader
      title="Report"
      description="Tinjau laporan arus kas, layanan internet, dan instalasi pelanggan."
      icon="bar-chart"
      eyebrow="Analitik & Laporan"
    />
    <section class="admin-data-panel p-4 sm:p-5">
      <UTabs :items="tab_items" class="w-full">
        <template #item="{ item }">
          <div v-if="item.value == 'report-cash-flow'">
            <CashFlow />
          </div>

          <div v-if="item.value == 'report-internet'">
            <Internet />
          </div>

          <div v-if="item.value == 'report-customer'">
            <CustomerInstallation ref="customerInstallationRef" />
          </div>
        </template>
      </UTabs>
    </section>
  </div>
</template>
