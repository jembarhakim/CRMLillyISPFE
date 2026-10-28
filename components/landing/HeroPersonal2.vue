<template>
    <section class="relative w-full h-screen min-h-[980px] overflow-hidden bg-gray-950" @mouseenter="stopAutoSlide"
        @mouseleave="startAutoSlide">

        <transition-group name="carousel" tag="div" class="relative w-full h-full">
            <div v-for="(slide, index) in slides" :key="index" v-show="currentSlide === index"
                class="absolute inset-0 w-full h-full">

                <!-- Gambar Latar (Ditambah efek zoom lambat agar lebih hidup) -->
                <img :src="slide.image" :alt="slide.title"
                    class="absolute inset-0 w-full h-full object-cover animate-slow-zoom" />

                <!-- ============================================== -->
                <!-- LAYER PENGGELAP & GRADIEN (Inner Shadow)       -->
                <!-- ============================================== -->
                <!-- 1. Tint gelap dasar untuk seluruh gambar -->
                <div class="absolute inset-0 bg-black/40"></div>

                <!-- 2. Gradien dari bawah ke atas -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

                <!-- 3. Gradien tebal dari kiri ditarik jauh ke kanan agar teks sangat jelas terbaca -->
                <div
                    class="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-transparent w-full lg:w-3/4">
                </div>
                <!-- ============================================== -->

                <!-- Konten Hero -->
                <div class="absolute inset-0">
                    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-full relative">

                        <!-- Posisi Teks: Kiri Bawah (KODE BARU) -->
                        <div
                            class="absolute bottom-40 sm:bottom-52 lg:bottom-64 left-4 sm:left-6 lg:left-8 max-w-2xl animate-fade-in-up z-10">

                            <!-- Judul -->
                            <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4 drop-shadow-xl"
                                v-html="slide.title"></h1>

                            <!-- Subjudul -->
                            <p class="text-base sm:text-lg md:text-xl text-gray-200 mb-8 max-w-xl drop-shadow-lg leading-relaxed"
                                v-html="slide.subtitle"></p>

                            <!-- Tombol Merah (Selengkapnya) -->
                            <a :href="slide.link"
                                class="inline-flex items-center gap-2 px-8 py-3.5 bg-[#E50914] text-white font-bold rounded-full hover:bg-red-700 transition-all shadow-lg hover:shadow-red-500/30 transform hover:-translate-y-1">
                                Selengkapnya <i class="fas fa-chevron-right text-xs ml-1"></i>
                            </a>

                            <!-- Kontrol Carousel (Panah Kiri Kanan & Titik Indikator) -->
                            <div class="mt-12 flex flex-col gap-5">

                                <!-- Panah Kiri Kanan -->
                                <div class="flex items-center gap-3">
                                    <button @click="prevSlide"
                                        class="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur-md hover:bg-white/30 transition-all hover:scale-110">
                                        <i class="fas fa-chevron-left text-sm"></i>
                                    </button>
                                    <button @click="nextSlide"
                                        class="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur-md hover:bg-white/30 transition-all hover:scale-110">
                                        <i class="fas fa-chevron-right text-sm"></i>
                                    </button>
                                </div>

                                <!-- Titik Indikator (Dots) -->
                                <div class="flex items-center gap-2 ml-1">
                                    <button v-for="(_, i) in slides" :key="i" @click="goToSlide(i)"
                                        class="h-1.5 rounded-full transition-all duration-500 ease-out"
                                        :class="currentSlide === i ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/60'">
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition-group>

        <!-- Tombol Jelajahi Lebih Lanjut (Tengah Bawah) -->
        <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
            <button @click="scrollToNext"
                class="px-5 py-2.5 rounded-full bg-black/30 border border-white/10 backdrop-blur-md text-gray-300 hover:text-white text-xs sm:text-sm flex items-center gap-2 hover:bg-black/60 transition-all duration-300 group shadow-lg">
                Jelajahi lebih lanjut
                <i class="fas fa-arrow-down animate-bounce group-hover:text-[#E50914] transition-colors"></i>
            </button>
        </div>

    </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const currentSlide = ref(0)
let slideInterval = null

// Data Carousel (Bisa diganti fotonya sesuai kebutuhan)
const slides = [
    {
        image: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=1920&auto=format&fit=crop',
        title: 'Koneksi Tanpa Batas untuk<br/><span class="text-[#E50914]">Keluarga Anda</span>',
        subtitle: 'Nikmati pengalaman streaming 4K, gaming tanpa lag, dan produktivitas maksimal',
        link: '#id_pricing'
    },
    {
        image: 'https://images.unsplash.com/photo-1583508915901-b5f84c1dcde1?q=80&w=1920&auto=format&fit=crop',
        title: 'Internet Cepat & Stabil di<br/><span class="text-[#E50914]">Seluruh Sudut Rumah</span>',
        subtitle: 'Didukung infrastruktur 100% Fiber Optic dengan rasio kecepatan yang dapat diandalkan.',
        link: '#id_services'
    },
    {
        image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=1920&auto=format&fit=crop',
        title: 'Hiburan Digital Tanpa<br/><span class="text-[#E50914]">Batas FUP</span>',
        subtitle: 'Bebas akses konten favorit bersama keluarga tanpa khawatir kuota habis atau kecepatan turun.',
        link: '#id_coverage'
    }
]

const nextSlide = () => {
    currentSlide.value = (currentSlide.value + 1) % slides.length
}

const prevSlide = () => {
    currentSlide.value = (currentSlide.value - 1 + slides.length) % slides.length
}

const goToSlide = (index) => {
    currentSlide.value = index
}

const startAutoSlide = () => {
    slideInterval = setInterval(nextSlide, 6000)
}

const stopAutoSlide = () => {
    if (slideInterval) clearInterval(slideInterval)
}

// Fungsi untuk scroll otomatis ke section selanjutnya
const scrollToNext = () => {
    const nextSection = document.getElementById('id_coverage') || document.getElementById('id_services')
    if (nextSection) {
        const offsetPosition = nextSection.getBoundingClientRect().top + window.scrollY - 110
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
        document.documentElement.scrollTo?.({ top: offsetPosition, behavior: 'smooth' })
        document.body.scrollTo?.({ top: offsetPosition, behavior: 'smooth' })
    }
}

onMounted(() => {
    startAutoSlide()
})

onUnmounted(() => {
    stopAutoSlide()
})
</script>

<style scoped>
/* Transisi Carousel yang Halus */
.carousel-enter-active,
.carousel-leave-active {
    transition: opacity 1.2s ease-in-out;
}

.carousel-enter-from,
.carousel-leave-to {
    opacity: 0;
}

/* Efek Zoom Lambat pada Gambar Latar */
@keyframes slow-zoom {
    0% {
        transform: scale(1);
    }

    100% {
        transform: scale(1.1);
    }
}

.animate-slow-zoom {
    animation: slow-zoom 20s infinite alternate linear;
}

/* Efek Teks Muncul dari Bawah */
@keyframes fade-in-up {
    0% {
        opacity: 0;
        transform: translateY(30px);
    }

    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in-up {
    animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>