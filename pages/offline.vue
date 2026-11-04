<script setup lang="ts">
// Offline fallback page. The service worker (Workbox navigateFallback) serves
// this page for navigation requests while the phone has no connection.
useHead({
  title: 'Tidak Ada Koneksi - Lilly Networks',
})

const isRetrying = ref(false)

function retry() {
  if (typeof window === 'undefined') return
  isRetrying.value = true
  window.location.reload()
}

// When the connection comes back, offer an automatic return to the portal.
const router = useRouter()
onMounted(() => {
  window.addEventListener('online', () => {
    router.replace('/customer')
  })
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-6">
    <div class="bg-white rounded-2xl shadow-lg max-w-sm w-full p-8 text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
        <LucideIcon name="wifi" :size="32" class="text-red-500" />
      </div>

      <h1 class="text-lg font-bold text-gray-800">Tidak Ada Koneksi</h1>
      <p class="text-sm text-gray-500 mt-2">
        Sepertinya HP Anda sedang offline. Periksa koneksi internet (WiFi / data seluler) lalu coba lagi.
      </p>

      <div class="mt-6 space-y-2">
        <UButton block color="green" :loading="isRetrying" @click="retry">
          <LucideIcon name="refresh-cw" :size="16" class="mr-1" />
          Coba Lagi
        </UButton>
        <UButton block color="gray" variant="outline" to="/customer">
          Kembali ke Beranda
        </UButton>
      </div>

      <p class="text-[11px] text-gray-400 mt-6">
        Halaman yang sudah pernah dibuka masih dapat diakses. Tagihan dan pembayaran membutuhkan koneksi internet.
      </p>
    </div>
  </div>
</template>
