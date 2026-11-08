<script setup lang="ts">
definePageMeta({
  middleware: () => navigateTo('/customer/login', { redirectCode: 301 }),
})
</script>
