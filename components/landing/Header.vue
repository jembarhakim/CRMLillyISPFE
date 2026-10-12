<template>
    <header class="fixed top-0 left-0 right-0 z-[60] flex flex-col transition-all duration-300">

        <!-- 1. NAVBAR ATAS (Gelap & Ramping) -->
        <div class="bg-[#111111] text-gray-400 border-b border-gray-800">
            <div
                class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex justify-between items-center h-10 text-[11px] sm:text-xs lg:text-sm font-semibold">

                <!-- Kiri: Mode Switcher -->
                <div class="flex items-center h-full space-x-4 sm:space-x-8">
                    <button @click="setMode('personal')" class="h-full relative hover:text-white transition-colors"
                        :class="modelValue === 'personal' ? 'text-white' : ''">
                        Personal
                        <span v-if="modelValue === 'personal'"
                            class="absolute bottom-0 left-0 w-full h-[3px] bg-[#A93133]"></span>
                    </button>

                    <button @click="setMode('enterprise')" class="h-full relative hover:text-white transition-colors"
                        :class="modelValue === 'enterprise' ? 'text-white' : ''">
                        Enterprise
                        <span v-if="modelValue === 'enterprise'"
                            class="absolute bottom-0 left-0 w-full h-[3px] bg-[#A93133]"></span>
                    </button>

                    <button @click="setMode('about')" class="h-full relative hover:text-white transition-colors"
                        :class="modelValue === 'about' ? 'text-white' : ''">
                        Tentang Kami
                        <span v-if="modelValue === 'about'"
                            class="absolute bottom-0 left-0 w-full h-[3px] bg-[#A93133]"></span>
                    </button>
                </div>

                <!-- Kanan: Login & Bahasa -->
                <div class="flex items-center h-full">
                    <a href="/login" class="flex items-center gap-1.5 hover:text-white transition-colors px-3 sm:px-4">
                        Login <i class="fas fa-arrow-up-right-from-square text-[10px]"></i>
                    </a>

                    <div class="flex items-center gap-2 border-l border-gray-700 pl-3 sm:pl-4 h-full">
                        <button class="flex items-center gap-1.5 text-white bg-white/10 px-2 py-0.5 rounded-full">
                            <img src="https://flagcdn.com/w20/id.png" alt="ID"
                                class="w-3.5 h-3.5 rounded-full object-cover" /> ID
                        </button>
                        <span class="text-gray-700">|</span>
                        <button class="flex items-center gap-1.5 hover:text-white px-2 py-0.5">
                            <img src="https://flagcdn.com/w20/gb.png" alt="EN"
                                class="w-3.5 h-3.5 rounded-full object-cover opacity-50" /> EN
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 2. NAVBAR BAWAH (Transparan berubah Putih saat di-scroll) -->
        <div class="transition-all duration-300"
            :class="isScrolled ? 'bg-white shadow-[0_4px_20px_rgb(0,0,0,0.05)] py-3 sm:py-4' : 'bg-transparent py-5 sm:py-6'">
            <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex justify-between items-center">

                <!-- Logo -->
                <a href="#" class="flex-shrink-0">
                    <img src="/statics/images/logolilly.png" alt="Lilly ISP" class="h-9 sm:h-11 w-auto transition-all"
                        :class="isDarkHero ? 'brightness-0 invert' : ''" />
                    <!-- Ubah logo jadi putih jika hero gelap -->
                </a>

                <!-- Desktop Menu Dinamis -->
                <nav class="hidden md:flex items-center gap-8">
                    <a v-for="(item, index) in dynamicNavItems" :key="index" :href="item.href"
                        @click="scrollToSection($event, item.href)"
                        class="font-bold text-sm lg:text-base transition-colors hover:text-[#A93133] cursor-pointer"
                        :class="isDarkHero ? 'text-white' : 'text-gray-800'">
                        {{ item.label }} <i></i>
                    </a>

                </nav>

                <!-- Tombol Aksi Kanan (Cari / Bantuan) -->
                <div class="hidden md:flex items-center gap-3">
                    <button class="w-10 h-10 rounded-full flex items-center justify-center transition-colors border"
                        :class="isDarkHero ? 'text-white border-white/30 hover:bg-white/10' : 'text-gray-700 border-gray-200 hover:bg-gray-50'">
                        <i class="fas fa-search"></i>
                    </button>
                    <a href="#id_contact_us"
                        class="px-6 py-2.5 bg-[#A93133] text-white font-bold text-sm rounded-full hover:bg-red-800 transition-all shadow-md">
                        Hubungi Kami
                    </a>
                </div>

                <!-- Mobile Toggle Button -->
                <button @click="mobileMenuOpen = !mobileMenuOpen"
                    class="md:hidden text-2xl focus:outline-none transition-colors"
                    :class="isDarkHero ? 'text-white' : 'text-gray-800'">
                    <i :class="mobileMenuOpen ? 'fas fa-times' : 'fas fa-bars'"></i>
                </button>

            </div>
        </div>

        <!-- Mobile Navigation Dropdown -->
        <transition name="slide-down">
            <div v-if="mobileMenuOpen"
                class="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t border-gray-100 max-h-[80vh] overflow-y-auto">
                <div class="flex flex-col px-4 py-6 gap-4">
                    <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 border-b pb-2">Menu {{
                        modelValue }}</p>
                    <a v-for="(item, index) in dynamicNavItems" :key="index" :href="item.href"
                        @click="mobileMenuOpen = false"
                        class="text-gray-800 font-bold text-lg flex items-center justify-between">
                        {{ item.label }} <i class="fas fa-chevron-right text-sm text-gray-300"></i>
                    </a>
                    <div class="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3">
                        <a href="/login"
                            class="text-center px-4 py-3 bg-gray-100 text-gray-800 font-bold rounded-xl">Masuk Akun</a>
                        <a href="#id_contact_us" @click="mobileMenuOpen = false"
                            class="text-center px-4 py-3 bg-[#A93133] text-white font-bold rounded-xl">Hubungi Kami</a>
                    </div>
                </div>
            </div>
        </transition>

    </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Fungsi untuk Smooth Scroll dengan kompensasi tinggi Navbar (Tahan Banting)
const scrollToSection = (event, href) => {
    if (href.startsWith('#')) {
        event.preventDefault()

        const targetElement = document.querySelector(href)
        if (targetElement) {
            // Perkiraan tinggi Double Navbar agar judul tidak tertutup
            const headerOffset = 110

            // Ambil posisi elemen dari ujung atas layar
            const elementPosition = targetElement.getBoundingClientRect().top

            // Ambil nilai scroll dari container mana pun yang sedang aktif
            const currentScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop

            // Kalkulasi titik berhenti yang akurat
            const offsetPosition = elementPosition + currentScroll - headerOffset

            // Tembak perintah scroll ke 3 jenis container sekaligus agar aman
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
            document.documentElement.scrollTo?.({ top: offsetPosition, behavior: 'smooth' })
            document.body.scrollTo?.({ top: offsetPosition, behavior: 'smooth' })
        }

        // Tutup menu mobile jika sedang digunakan
        mobileMenuOpen.value = false
    }
}

const props = defineProps({
    modelValue: {
        type: String,
        required: true
    }
})

const emit = defineEmits(['update:modelValue'])

const setMode = (mode) => {
    emit('update:modelValue', mode)
    mobileMenuOpen.value = false
}

// State untuk Scroll & Mobile Menu
const isScrolled = ref(false)
const mobileMenuOpen = ref(false)

const checkScroll = (e) => {
    const t = e?.target
    const y = (!t || t === document) ? window.scrollY : t.scrollTop
    isScrolled.value = y > 20
}

onMounted(() => {
    window.addEventListener('scroll', checkScroll, true)
    checkScroll()
})
onUnmounted(() => window.removeEventListener('scroll', checkScroll, true))

// Dinamis: Menu Navbar bawah berubah sesuai mode yang aktif
const dynamicNavItems = computed(() => {
    if (props.modelValue === 'personal') {
        return [
            { label: 'Paket Internet', href: '#id_pricing' },
            { label: 'Cara Pasang', href: '#id_subscription_steps' },
            { label: 'Testimoni', href: '#id_testimonial' },
            { label: 'Informasi Terbaru', href: '#id_news' }
        ]
    } else if (props.modelValue === 'enterprise') {
        return [
            { label: 'Solusi Bisnis', href: '#id_solusi' },
            { label: 'Klien Kami', href: '#id_clients' },
            { label: 'Portofolio', href: '#id_portfolio' },
            { label: 'Informasi Terbaru', href: '#id_news' }
        ]
    } else {
        return [
            { label: 'Profil Perusahaan', href: '#id_about' },
            { label: 'Visi & Misi', href: '#id_visimisi' },
            { label: 'Tim Profesional', href: '#id_team' }
        ]
    }
})

// Dinamis: Warna teks Navbar bawah menyesuaikan background Hero (Enterprise gelap, sisanya terang)
const isDarkHero = computed(() => props.modelValue === 'enterprise' && !isScrolled.value)
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>