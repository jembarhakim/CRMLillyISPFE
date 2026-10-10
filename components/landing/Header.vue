<template>
    <header class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white"
        :class="{ 'shadow-md py-3': isScrolled, 'py-5': !isScrolled }">
        <div class="container mx-auto px-4 sm:px-6 md:px-8 flex justify-between items-center max-w-7xl">

            <!-- KIRI: Logo & 3 Menu Mode -->
            <div class="flex items-center gap-8">
                <!-- Logo -->
                <a href="#" class="flex-shrink-0 mr-4">
                    <img src="/statics/images/logolilly.png" alt="Lilly ISP" class="h-10 sm:h-12 w-auto" />
                </a>

                <!-- Mode Switcher (Desktop) -->
                <nav class="hidden md:flex items-center gap-6 h-full">
                    <!-- Tab Personal -->
                    <button @click="setMode('personal')"
                        class="relative py-2 text-sm lg:text-base font-semibold transition-colors duration-300 group"
                        :class="modelValue === 'personal' ? 'text-[#A93133]' : 'text-gray-600 hover:text-[#A93133]'">
                        Personal
                        <span
                            class="absolute bottom-0 left-0 w-full h-0.5 bg-[#A93133] transition-transform duration-300 origin-left"
                            :class="modelValue === 'personal' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'"></span>
                    </button>

                    <!-- Tab Enterprise -->
                    <button @click="setMode('enterprise')"
                        class="relative py-2 text-sm lg:text-base font-semibold transition-colors duration-300 group"
                        :class="modelValue === 'enterprise' ? 'text-[#A93133]' : 'text-gray-600 hover:text-[#A93133]'">
                        Enterprise
                        <span
                            class="absolute bottom-0 left-0 w-full h-0.5 bg-[#A93133] transition-transform duration-300 origin-left"
                            :class="modelValue === 'enterprise' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'"></span>
                    </button>

                    <!-- Tab Tentang Kami -->
                    <button @click="setMode('about')"
                        class="relative py-2 text-sm lg:text-base font-semibold transition-colors duration-300 group"
                        :class="modelValue === 'about' ? 'text-[#A93133]' : 'text-gray-600 hover:text-[#A93133]'">
                        Tentang Kami
                        <span
                            class="absolute bottom-0 left-0 w-full h-0.5 bg-[#A93133] transition-transform duration-300 origin-left"
                            :class="modelValue === 'about' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'"></span>
                    </button>
                </nav>
            </div>

            <!-- KANAN: Bahasa & Login -->
            <div class="flex items-center gap-4 lg:gap-6">
                <!-- Pemilih Bahasa -->
                <div class="hidden sm:flex items-center gap-2 text-sm font-semibold text-gray-600">
                    <button class="text-[#A93133]">ID</button>
                    <span class="text-gray-300">|</span>
                    <button class="hover:text-[#A93133] transition-colors">EN</button>
                </div>

                <!-- Tombol Login (Ikon User) -->
                <a href="/login"
                    class="flex items-center gap-2 px-4 py-2 bg-[#F9EBEB] text-[#A93133] rounded-full hover:bg-[#A93133] hover:text-white transition-all duration-300 group"
                    title="Login Dashboard">
                    <i class="fas fa-user-circle text-xl"></i>
                    <span class="hidden sm:inline font-semibold text-sm">Login</span>
                </a>
            </div>

        </div>
    </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// Menerima activeMode dari index.vue
const props = defineProps({
    modelValue: {
        type: String,
        required: true
    }
})

// Mengirim perubahan mode kembali ke index.vue
const emit = defineEmits(['update:modelValue'])

const setMode = (mode) => {
    emit('update:modelValue', mode)
}

// Logika Sticky Navbar
const isScrolled = ref(false)
const handleScroll = () => {
    isScrolled.value = window.scrollY > 20
}

onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))
</script>