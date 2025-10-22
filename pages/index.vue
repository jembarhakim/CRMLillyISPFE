<script setup>
// Set page title
useHead({
  title: 'CRM System'
})

// Disable SSR to prevent Icon component infinite recursion
definePageMeta({
  ssr: false
})

// Always redirect to login page immediately
onMounted(async () => {
  console.log('Redirecting to login page')
  await navigateTo('/login')
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