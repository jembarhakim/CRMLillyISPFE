<template>
    <section id="id_subscription_steps" class="py-16 sm:py-24 bg-gray-50 w-full max-w-full">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

            <!-- Header -->
            <div class="text-center mb-16 sm:mb-20">
                <span
                    class="inline-block py-1.5 px-4 rounded-full bg-[#F9EBEB] text-[#A93133] font-bold text-xs sm:text-sm mb-4 border border-[#A93133]/20">
                    PROSES MUDAH & CEPAT
                </span>
                <h2 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                    Cara Berlangganan di <span class="text-[#A93133]">Lilly ISP</span>
                </h2>
                <p class="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Nikmati pengalaman pasang baru tanpa ribet. Cukup ikuti 4 langkah sederhana berikut untuk
                    menghadirkan internet cepat di rumah Anda.
                </p>
            </div>

            <!-- Steps Grid / Timeline -->
            <div class="relative">

                <!-- Garis Penghubung Desktop -->
                <div class="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-8 z-0"></div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                    <div v-for="(item, index) in steps" :key="index"
                        class="group bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:shadow-xl hover:border-[#A93133]/20 transition-all duration-300 flex flex-col items-center text-center transform hover:-translate-y-2">

                        <!-- Badge Nomor & Icon -->
                        <div class="relative mb-6">
                            <div
                                class="w-16 h-16 sm:w-20 sm:h-20 bg-[#F9EBEB] text-[#A93133] rounded-2xl flex items-center justify-center text-2xl sm:text-3xl group-hover:bg-[#A93133] group-hover:text-white transition-colors duration-300 shadow-sm">
                                <i :class="item.icon"></i>
                            </div>
                            <span
                                class="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#A93133] text-white text-xs font-black flex items-center justify-center shadow-md">
                                {{ item.step }}
                            </span>
                        </div>

                        <!-- Teks -->
                        <h3
                            class="text-lg sm:text-xl font-bold text-gray-900 mb-3 group-hover:text-[#A93133] transition-colors">
                            {{ item.title }}
                        </h3>
                        <p class="text-sm text-gray-600 leading-relaxed">
                            {{ item.description }}
                        </p>

                    </div>
                </div>

            </div>

            <!-- Action Button / CTA -->
            <div class="mt-14 text-center">
                <a href="#id_pricing"
                    class="inline-flex items-center gap-2 px-8 py-4 bg-[#A93133] text-white font-bold rounded-2xl hover:bg-red-800 transition-all shadow-lg hover:shadow-[#A93133]/30">
                    <span>Pilih Paket Sekarang</span>
                    <i class="fas fa-arrow-right"></i>
                </a>
            </div>

        </div>
    </section>
</template>
<script setup>
const steps = [
    {
        step: '01',
        title: 'Cek Area & Pilih Paket',
        description: 'Pastikan rumah Anda berada dalam jangkauan jaringan Lilly ISP melalui form cek lokasi, lalu tentukan paket kecepatan yang sesuai kebutuhan Anda.',
        icon: 'fas fa-map-marked-alt'
    },
    {
        step: '02',
        title: 'Pendaftaran Online',
        description: 'Isi formulir registrasi data diri dengan mudah atau langsung hubungi tim representatif sales kami melalui layanan WhatsApp resmi.',
        icon: 'fas fa-clipboard-list'
    },
    {
        step: '03',
        title: 'Survei & Penjadwalan',
        description: 'Tim operasional kami akan memverifikasi rute tarikan kabel optik terdekat ke rumah Anda dan menjadwalkan kedatangan teknisi lapangan.',
        icon: 'fas fa-calendar-check'
    },
    {
        step: '04',
        title: 'Pemasangan & Aktivasi',
        description: 'Teknisi memasang kabel fiber optic serta router Wi-Fi di rumah Anda. Internet langsung aktif seketika dan siap dinikmati seluruh keluarga.',
        icon: 'fas fa-wifi'
    }
]
</script>