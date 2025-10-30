<script setup>
definePageMeta({
  middleware: 'redirect-to-landing'
})

// Set page title - though this will redirect immediately
useHead({
  title: 'Lilly ISP - Welcome'
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-green-800 to-black">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
      <p class="text-white text-lg">Loading...</p>
    </div>
  </div>
</template>