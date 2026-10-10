<template>
    <section id="id_portfolio" class="py-10 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 bg-gray-50 w-full max-w-full">
        <div class="container mx-auto max-w-full">
            <div class="text-center mb-8 sm:mb-12 md:mb-16 px-4">
                <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-gray-900">Our Services</h2>
                <p class="text-base sm:text-lg md:text-xl text-gray-600">Comprehensive internet solutions tailored to
                    your
                    needs.</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
                <div v-for="(portfolio, index) in portfolioItems" :key="index" class="flashcard-container">
                    <div class="flashcard">
                        <div class="flashcard-front relative group">
                            <img :src="portfolio.image" :alt="portfolio.title" class="w-full h-full object-cover"
                                @error="handleImageError" />
                            <!-- Dark overlay with text -->
                            <div
                                class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                                <div class="absolute bottom-0 left-0 right-0 p-6">
                                    <h3 class="text-white text-lg font-bold uppercase tracking-wide">{{ portfolio.title
                                        }}</h3>
                                    <p class="text-gray-200 text-sm mt-2">{{ portfolio.subtitle }}</p>
                                </div>
                            </div>
                        </div>
                        <div class="flashcard-back relative overflow-hidden"
                            :style="{ background: `linear-gradient(135deg, ${themeColor} 0%, #991b1b 100%)` }">
                            <!-- Decorative circles -->
                            <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                            <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12">
                            </div>

                            <!-- Content -->
                            <div class="relative z-10 flex flex-col items-center justify-center h-full p-4">
                                <!-- Icon -->
                                <div
                                    class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3">
                                    <i class="fas fa-wifi text-2xl text-white"></i>
                                </div>

                                <!-- Title -->
                                <h3 class="text-white text-sm font-bold text-center mb-2 leading-tight uppercase tracking-wide px-2"
                                    style="font-size: 13px; line-height: 1.3;">
                                    {{ portfolio.title }}
                                </h3>

                                <!-- Divider -->
                                <div class="w-12 h-0.5 bg-white/50 rounded-full mb-3"></div>

                                <!-- Description -->
                                <p class="text-white/90 text-xs text-center leading-relaxed px-3"
                                    style="font-size: 12px; line-height: 1.5;">
                                    {{ portfolio.description }}
                                </p>

                                <!-- Learn More Button -->
                                <button
                                    class="mt-3 px-5 py-1.5 bg-white text-gray-900 rounded-full font-semibold text-xs hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg">
                                    Learn More →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup>
// Terima warna tema dari index.vue
defineProps({
    themeColor: {
        type: String,
        default: 'rgb(220, 38, 38)'
    }
})

// Fungsi penanganan jika gambar gagal dimuat
const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/400x300?text=Image+Placeholder'
}

// Data portofolio
const portfolioItems = [
    {
        image: '/statics/images/1.png',
        title: 'INTERNET SERVICE',
        subtitle: 'High-Speed Connection',
        description: 'Experience ultra-fast and stable internet connection. Perfect for streaming, gaming, and all your online activities.'
    },
    {
        image: '/statics/images/2.png',
        title: 'RELIABLE, SCALABLE & SECURE ENTERPRISE CONNECTIVITY',
        subtitle: 'Business Solutions',
        description: 'Enterprise-grade internet solutions with dedicated support and guaranteed uptime for your business needs.'
    },
    {
        image: '/statics/images/3.png',
        title: 'SEAMLESS CONNECTIVITY, FROM ENTRY ROOM TO THE BACKYARD',
        subtitle: 'Whole Home Coverage',
        description: 'Complete WiFi coverage for your entire property. Stay connected from anywhere in your home or office.'
    },
    {
        image: '/statics/images/4.png',
        title: 'SECURE, SCALABLE & ON-DEMAND ACCESS FOR YOUR INFORMATION',
        subtitle: 'Data Security',
        description: 'Advanced security features to protect your data and ensure safe browsing for you and your family.'
    },
    {
        image: '/statics/images/5.png',
        title: 'AUTOMATE & SECURE YOUR LIFE WITH INTEGRATED DEVICES',
        subtitle: 'Smart Home Ready',
        description: 'Connect all your smart devices seamlessly. Perfect for IoT and home automation systems.'
    },
    {
        image: '/statics/images/6.png',
        title: 'FIBER OPTIC NETWORK',
        subtitle: 'Future-Proof Technology',
        description: 'Lightning-fast, reliable & future-proof connectivity using the latest fiber optic technology.'
    }
]
</script>