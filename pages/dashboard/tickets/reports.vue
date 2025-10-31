<script setup lang="ts">
// Set page title
useHead({
  title: 'Laporan Tiket - CRM System'
})

// reuse the same component content as trouble report
</script>

<template>
  <ClientOnly>
    <LazyDashboardReportTrouble />
  </ClientOnly>
</template>


