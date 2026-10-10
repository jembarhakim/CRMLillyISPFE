<template>
    <!-- Background putih dengan ornamen cahaya merah muda -->
    <section class="relative pt-32 pb-24 lg:pt-40 lg:pb-36 overflow-hidden bg-white w-full max-w-full">

        <!-- Ornamen Latar Belakang (Blurry Glow) -->
        <div
            class="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] rounded-full bg-[#F9EBEB] blur-3xl opacity-70">
        </div>
        <div class="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#F9EBEB] blur-3xl opacity-70">
        </div>

        <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
            <div class="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">

                <!-- KOLOM KIRI: Teks & Call to Action -->
                <div class="w-full lg:w-1/2 text-center lg:text-left mt-8 lg:mt-0">
                    <span
                        class="inline-block py-1.5 px-4 rounded-full bg-[#F9EBEB] text-[#A93133] font-bold text-xs sm:text-sm mb-6 tracking-wide uppercase border border-[#A93133]/20 shadow-sm">
                        🚀 Internet Rumah Cepat & Stabil
                    </span>
                    <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                        Koneksi Tanpa Batas untuk <span
                            class="text-transparent bg-clip-text bg-gradient-to-r from-[#A93133] to-red-800">Keluarga
                            Anda</span>
                    </h1>
                    <p class="text-base sm:text-lg text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                        Nikmati pengalaman streaming 4K, gaming tanpa lag, dan produktivitas maksimal dengan jaringan
                        fiber optic super cepat dari Lilly ISP. Tersedia berbagai paket ramah kantong!
                    </p>
                    <div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                        <button @click="scrollToPackages"
                            class="w-full sm:w-auto px-8 py-3.5 bg-[#A93133] text-white font-bold rounded-full hover:bg-red-800 hover:shadow-lg hover:shadow-[#A93133]/30 transition-all transform hover:-translate-y-1 text-center">
                            Berlangganan Sekarang
                        </button>
                        <button @click="scrollToCoverage"
                            class="w-full sm:w-auto px-8 py-3.5 bg-white text-gray-800 border-2 border-gray-200 font-bold rounded-full hover:border-[#A93133] hover:text-[#A93133] transition-all text-center">
                            Cek Area Jaringan
                        </button>
                    </div>
                </div>

                <!-- KOLOM KANAN: Gambar Hero & Badge Melayang -->
                <div class="w-full lg:w-1/2 relative mt-8 lg:mt-0">

                    <!-- Gambar Utama -->
                    <div class="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white z-10 bg-gray-100">
                        <!-- Bisa diganti dengan foto lifestyle keluarga bahagia menggunakan internet -->
                        <img src="/statics/images/ng.jpg" alt="Keluarga menikmati internet cepat"
                            class="w-full object-cover h-[350px] sm:h-[450px]" @error="handleImageError" />

                        <!-- Gradien gelap di bagian bawah gambar agar kontras -->
                        <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent">
                        </div>
                    </div>

                    <!-- Badge 1: Kecepatan (Animasi Naik-Turun) -->
                    <div class="absolute -bottom-6 -left-2 sm:-left-6 bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-4 animate-bounce z-20 border border-gray-50"
                        style="animation-duration: 3s;">
                        <div
                            class="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl">
                            <i class="fas fa-rocket"></i>
                        </div>
                        <div>
                            <p class="text-xs sm:text-sm text-gray-500 font-medium">Kecepatan hingga</p>
                            <p class="text-lg sm:text-xl font-extrabold text-gray-900">100 Mbps</p>
                        </div>
                    </div>

                    <!-- Badge 2: Kuota Unlimited (Glow Merah Muda) -->
                    <div
                        class="absolute -top-6 -right-2 sm:-right-6 bg-white p-3 sm:p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-3 sm:gap-4 z-20 border border-gray-50 transform hover:scale-105 transition-transform duration-300">
                        <div
                            class="w-10 h-10 sm:w-12 sm:h-12 bg-[#F9EBEB] text-[#A93133] rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-inner">
                            <i class="fas fa-infinity"></i>
                        </div>
                        <div>
                            <p class="text-xs sm:text-sm text-gray-500 font-medium leading-tight">Kuota</p>
                            <p class="text-base sm:text-xl font-extrabold text-gray-900 leading-tight">Unlimited</p>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    </section>
</template>

<script setup>
const handleImageError = (e) => {
    // Fallback gambar jika gambar lokal gagal dimuat
    e.target.src = 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=800&auto=format&fit=crop'
}

const scrollToPackages = () => {
    const el = document.getElementById('id_pricing')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
}

const scrollToCoverage = () => {
    const el = document.getElementById('cek-lokasi')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
}
</script>