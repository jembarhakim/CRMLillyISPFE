<template>
  <!-- Stub component to prevent Nuxt UI icon recursion -->
  <span></span>
</template>

<script setup>
// This component overrides Nuxt UI's UIcon to prevent recursion
// All icons are now handled by Iconify in the navbar
defineProps({
  name: String
})
</script>

