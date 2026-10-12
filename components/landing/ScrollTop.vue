<template>
    <transition name="fade-btn">
        <button v-show="isVisible" @click="scrollToTop"
            class="fixed bottom-[100px] right-6 sm:bottom-[104px] sm:right-8 z-[45] flex items-center justify-center w-12 h-12 bg-white text-[#A93133] border-2 border-[#A93133] rounded-full shadow-lg hover:bg-[#A93133] hover:text-white transition-colors duration-300 transform hover:-translate-y-1 focus:outline-none"
            title="Kembali ke Atas" aria-label="Scroll to top">
            <i class="fas fa-chevron-up text-lg"></i>
        </button>
    </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isVisible = ref(false)

const checkScroll = (e) => {
    const t = e?.target
    // Jika target kosong atau document, pakai window. Jika elemen, pakai scrollTop elemen tersebut
    const y = (!t || t === document) ? window.scrollY : t.scrollTop
    isVisible.value = y > 300
}

const scrollToTop = () => {
    // Tembak ketiga jenis container agar aman
    window.scrollTo({ top: 0, behavior: 'smooth' })
    document.documentElement.scrollTo?.({ top: 0, behavior: 'smooth' })
    document.body.scrollTo?.({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
    // capture: true sangat penting di sini untuk menangkap scroll dari child elements
    window.addEventListener('scroll', checkScroll, true)
    checkScroll()
})

onUnmounted(() => {
    window.removeEventListener('scroll', checkScroll, true)
})
</script>

<style scoped>
/* Menghapus transform di sini agar tidak bentrok dengan hover:-translate-y-1 milik Tailwind */
.fade-btn-enter-active,
.fade-btn-leave-active {
    transition: opacity 0.3s ease;
}

.fade-btn-enter-from,
.fade-btn-leave-to {
    opacity: 0;
}
</style>