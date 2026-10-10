<template>
    <section class="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-900 w-full max-w-full">
        <!-- Gambar Latar Belakang (Server Room/Corporate) dengan Overlay Gelap -->
        <div
            class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay">
        </div>
        <div class="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent"></div>

        <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
            <div class="max-w-3xl">
                <span
                    class="inline-block py-1.5 px-4 rounded-full bg-white/10 text-[#F9EBEB] font-bold text-xs sm:text-sm mb-6 tracking-wide uppercase border border-white/20 backdrop-blur-sm">
                    🏢 Lilly Enterprise Solutions
                </span>
                <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                    Transformasi Digital untuk <span class="text-[#A93133]">Skala Bisnis Anda</span>
                </h1>
                <p class="text-base sm:text-lg text-gray-300 mb-8 leading-relaxed max-w-2xl">
                    Infrastruktur jaringan berkinerja tinggi, manajemen proyek IT komprehensif, dan solusi konektivitas
                    terdedikasi yang dirancang khusus untuk mendukung misi kritis perusahaan.
                </p>
                <div class="flex flex-col sm:flex-row gap-4">
                    <a href="#konsultasi"
                        class="px-8 py-3.5 bg-[#A93133] text-white font-bold rounded-full hover:bg-red-800 transition-all text-center flex items-center justify-center gap-2">
                        <i class="fas fa-headset"></i> Konsultasi Bersama Ahli
                    </a>
                    <a href="#solusi"
                        class="px-8 py-3.5 bg-transparent text-white border-2 border-white/30 font-bold rounded-full hover:bg-white/10 transition-all text-center">
                        Eksplorasi Solusi Kami
                    </a>
                </div>
            </div>

            <!-- Quick Stats / Trust Indicators di Bawah Hero -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-8 border-t border-white/10">
                <div>
                    <p class="text-3xl font-black text-white">99.9%</p>
                    <p class="text-sm text-gray-400 font-medium mt-1">SLA Guarantee</p>
                </div>
                <div>
                    <p class="text-3xl font-black text-white">24/7</p>
                    <p class="text-sm text-gray-400 font-medium mt-1">Dedicated Support NOC</p>
                </div>
                <div>
                    <p class="text-3xl font-black text-white">100+</p>
                    <p class="text-sm text-gray-400 font-medium mt-1">Klien Enterprise</p>
                </div>
                <div>
                    <p class="text-3xl font-black text-white">Custom</p>
                    <p class="text-sm text-gray-400 font-medium mt-1">Topologi & Bandwidth</p>
                </div>
            </div>
        </div>
    </section>
</template>