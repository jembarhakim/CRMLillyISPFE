<template>
    <footer class="py-6 sm:py-8 text-white" style="background-color: #1c1b21"
        :style="{ borderTopColor: themeColor, borderTopWidth: '2px', borderTopStyle: 'solid' }">
        <div class="container mx-auto px-4 sm:px-6 md:px-8 max-w-full">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-4 sm:mb-6">
                <!-- Company Info -->
                <div class="text-center sm:text-left">
                    <div class="mb-3 sm:mb-4">
                        <img src="/statics/images/logolilly.png" alt="Lilly ISP Logo"
                            class="h-10 sm:h-12 w-auto mx-auto sm:mx-0" fetchpriority="high" loading="eager" />
                    </div>
                    <p class="text-gray-400 text-xs sm:text-sm">
                        Your trusted internet service provider. Connecting Indonesia with fast, reliable, and affordable
                        internet
                        solutions.
                    </p>
                </div>

                <!-- Quick Links -->
                <div class="text-center sm:text-left">
                    <h4 class="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Links</h4>
                    <ul class="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        <li><a href="#id_about_us" class="text-gray-400 hover:text-white transition-colors">About Us</a>
                        </li>
                        <li><a href="#id_services" class="text-gray-400 hover:text-white transition-colors">Services</a>
                        </li>
                        <li><a href="#id_pricing" class="text-gray-400 hover:text-white transition-colors">Pricing</a>
                        </li>
                        <li><a href="#id_contact_us"
                                class="text-gray-400 hover:text-white transition-colors">Contact</a></li>
                    </ul>
                </div>

                <!-- Contact Info -->
                <div class="text-center sm:text-left">
                    <h4 class="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Contact Us</h4>
                    <ul class="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-400">
                        <li class="flex items-center gap-2 justify-center sm:justify-start">
                            <i class="fas fa-phone"></i>
                            <span>+62 341 8222 099<br>+62 856 0712 1775</span>
                        </li>
                        <li class="flex items-center gap-2 justify-center sm:justify-start">
                            <i class="fas fa-envelope"></i>
                            <span>info@lilly.net.id</span>
                        </li>
                        <li class="flex items-center gap-2 justify-center sm:justify-start">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>Jl. Pratu Herman No.34, Sedayu, Turen, Kab.Malang</span>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Social Media & Copyright -->
            <div class="border-t border-gray-700 pt-4 sm:pt-6">
                <div class="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
                    <p class="text-gray-400 text-xs sm:text-sm text-center md:text-left order-2 md:order-1">
                        &copy; 2025 Lilly ISP. All rights reserved.
                    </p>
                    <div class="flex justify-center gap-2.5 sm:gap-3 order-1 md:order-2">
                        <a href="https://facebook.com" target="_blank" :style="{ backgroundColor: themeColor }"
                            class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-all"
                            title="Facebook">
                            <i class="fab fa-facebook-f text-sm sm:text-base"></i>
                        </a>
                        <a href="https://instagram.com" target="_blank" :style="{ backgroundColor: themeColor }"
                            class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-all"
                            title="Instagram">
                            <i class="fab fa-instagram text-sm sm:text-base"></i>
                        </a>
                        <a href="https://wa.me/6281234567890" target="_blank" :style="{ backgroundColor: themeColor }"
                            class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-all"
                            title="WhatsApp">
                            <i class="fab fa-whatsapp text-sm sm:text-base"></i>
                        </a>
                        <a href="mailto:support@lillyisp.id" :style="{ backgroundColor: themeColor }"
                            class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-all"
                            title="Email">
                            <i class="fas fa-envelope text-sm sm:text-base"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </footer>
</template>

<script setup>
// Menerima warna tema dari index.vue
defineProps({
    themeColor: {
        type: String,
        default: 'rgb(220, 38, 38)'
    }
})
</script>