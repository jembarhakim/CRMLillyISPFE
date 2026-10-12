<template>
    <section id="id_portfolio" class="py-16 sm:py-24 bg-white w-full max-w-full">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

            <!-- Header Section -->
            <div class="text-center mb-12 sm:mb-16">
                <span
                    class="inline-block py-1.5 px-4 rounded-full bg-[#F9EBEB] text-[#A93133] font-bold text-xs sm:text-sm mb-4 border border-[#A93133]/20">
                    REKAM JEJAK KAMI
                </span>
                <h2 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                    Portofolio & Solusi Proyek
                </h2>
                <p class="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                    Mulai dari instalasi fiber optik hingga pengadaan server dan CCTV, kami telah dipercaya
                    menyelesaikan berbagai tantangan IT di lapangan.
                </p>
            </div>

            <!-- Grid Portofolio (Gaya Premium Card) -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <article v-for="(portfolio, index) in portfolioItems" :key="index"
                    class="group relative bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.06)] border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 flex flex-col">

                    <!-- Gambar Proyek -->
                    <div class="relative h-56 sm:h-64 overflow-hidden bg-gray-200">
                        <img :src="portfolio.image" :alt="portfolio.title"
                            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            @error="handleImageError" />

                        <!-- Badge Kategori Melayang -->
                        <div
                            class="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-[#A93133]"></span>
                            <span class="text-xs font-bold text-gray-800 uppercase tracking-wide">{{ portfolio.subtitle
                                }}</span>
                        </div>

                        <!-- Gradien gelap di bawah gambar -->
                        <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent">
                        </div>
                    </div>

                    <!-- Konten Teks -->
                    <div class="p-6 sm:p-8 flex-grow flex flex-col">
                        <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#A93133] transition-colors">
                            {{ portfolio.title }}
                        </h3>
                        <p class="text-sm text-gray-600 leading-relaxed mb-6 flex-grow">
                            {{ portfolio.description }}
                        </p>

                        <!-- Divider & Tombol Aksi -->
                        <div class="pt-4 border-t border-gray-100 mt-auto flex justify-between items-center">
                            <span class="text-xs font-semibold text-gray-400">Proyek Enterprise</span>
                            <button
                                class="w-10 h-10 rounded-full bg-[#F9EBEB] text-[#A93133] flex items-center justify-center group-hover:bg-[#A93133] group-hover:text-white transition-colors duration-300">
                                <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>

                </article>
            </div>

        </div>
    </section>
</template>

<script setup>
// Data portofolio disesuaikan ke Bahasa Indonesia dengan konteks B2B / Proyek
const portfolioItems = [
    {
        image: '/statics/images/1.png',
        title: 'Internet Terdedikasi',
        subtitle: 'Koneksi Rasio 1:1',
        description: 'Konektivitas berkecepatan tinggi dan stabil, didesain khusus untuk menunjang operasional bisnis 24 jam.'
    },
    {
        image: '/statics/images/2.png',
        title: 'Konektivitas Enterprise',
        subtitle: 'Solusi Korporat',
        description: 'Infrastruktur jaringan level enterprise dengan dukungan teknis prioritas dan jaminan SLA tinggi untuk perusahaan.'
    },
    {
        image: '/statics/images/3.png',
        title: 'Instalasi Jaringan Luas',
        subtitle: 'WLAN / LAN Terpusat',
        description: 'Perancangan dan pemasangan akses poin untuk menjangkau seluruh area pabrik, gedung kantor, maupun fasilitas publik.'
    },
    {
        image: '/statics/images/4.png',
        title: 'Keamanan Jaringan',
        subtitle: 'Proteksi Data Bisnis',
        description: 'Implementasi sistem keamanan jaringan dan manajemen bandwidth tingkat lanjut untuk melindungi aset data perusahaan.'
    },
    {
        image: '/statics/images/5.png',
        title: 'Integrasi CCTV & Sistem',
        subtitle: 'Smart Office Ready',
        description: 'Instalasi sistem pengawasan CCTV terpusat dan integrasi perangkat IoT yang dapat dipantau dari mana saja.'
    },
    {
        image: '/statics/images/6.png',
        title: 'Infrastruktur Fiber Optik',
        subtitle: 'Penarikan Kabel FO',
        description: 'Manajemen proyek penarikan kabel fiber optik antar-gedung untuk konektivitas cabang yang cepat dan kebal cuaca.'
    }
]

const handleImageError = (e) => {
    e.target.src = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop'
}
</script>