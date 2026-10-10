<template>
    <section class="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-50 w-full max-w-full">
        <!-- Dekorasi Latar -->
        <div
            class="absolute top-0 right-0 w-1/2 h-full bg-[#F9EBEB] rounded-l-[100px] opacity-50 transform translate-x-20">
        </div>

        <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
            <div class="flex flex-col lg:flex-row items-center gap-12">

                <!-- Teks Hero -->
                <div class="w-full lg:w-1/2 text-center lg:text-left">
                    <span
                        class="inline-block py-1.5 px-4 rounded-full bg-white text-[#A93133] font-bold text-xs sm:text-sm mb-6 tracking-wide uppercase border border-[#A93133]/20 shadow-sm">
                        👋 Mengenal Lebih Dekat
                    </span>
                    <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                        Menghubungkan <span class="text-[#A93133]">Nusantara</span> dengan Inovasi
                    </h1>
                    <p class="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                        Lilly ISP hadir sebagai mitra teknologi terpercaya yang tidak hanya menyediakan akses internet,
                        tetapi juga solusi IT komprehensif untuk mendukung ekosistem digital di Indonesia.
                    </p>
                </div>

                <!-- Gambar Profil Kantor/Tim -->
                <div class="w-full lg:w-1/2 relative">
                    <div class="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white z-10">
                        <!-- Ganti dengan foto tim Lilly ISP atau foto instalasi lapangan -->
                        <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000&auto=format&fit=crop"
                            alt="Tim Lilly ISP" class="w-full object-cover h-[300px] sm:h-[400px]" />
                    </div>
                    <!-- Elemen Dot dekoratif -->
                    <div
                        class="absolute -bottom-6 -left-6 w-24 h-24 bg-[#A93133] rounded-2xl -z-10 opacity-20 transform rotate-12">
                    </div>
                    <div class="absolute -top-6 -right-6 w-32 h-32 bg-[#F9EBEB] rounded-full -z-10"></div>
                </div>
            </div>

            <!-- Statistik Perusahaan -->
            <div class="mt-20 bg-white rounded-3xl shadow-lg border border-gray-100 p-8 sm:p-10 relative z-20">
                <div
                    class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x-0 md:divide-x md:divide-gray-100">
                    <div class="p-2">
                        <p class="text-4xl sm:text-5xl font-black text-[#A93133] mb-2">5+</p>
                        <p class="text-sm font-semibold text-gray-500 uppercase">Tahun Pengalaman</p>
                    </div>
                    <div class="p-2">
                        <p class="text-4xl sm:text-5xl font-black text-[#A93133] mb-2">1000+</p>
                        <p class="text-sm font-semibold text-gray-500 uppercase">Pelanggan Aktif</p>
                    </div>
                    <div class="p-2">
                        <p class="text-4xl sm:text-5xl font-black text-[#A93133] mb-2">24/7</p>
                        <p class="text-sm font-semibold text-gray-500 uppercase">Layanan Support</p>
                    </div>
                    <div class="p-2">
                        <p class="text-4xl sm:text-5xl font-black text-[#A93133] mb-2">99%</p>
                        <p class="text-sm font-semibold text-gray-500 uppercase">SLA Uptime</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>