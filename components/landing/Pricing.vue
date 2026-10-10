<template>
    <section id="id_pricing" class="py-16 sm:py-24 bg-gray-50 w-full">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

            <!-- Bagian Header Judul -->
            <div class="text-center mb-12 sm:mb-16">
                <span
                    class="inline-block py-1.5 px-4 rounded-full bg-[#F9EBEB] text-[#A93133] font-bold text-xs sm:text-sm mb-4 border border-[#A93133]/20">
                    PILIHAN PAKET INTERNET
                </span>
                <h2 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                    Internet Cepat Tanpa Batas Kuota
                </h2>
                <p class="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                    Pilih paket internet rumah yang paling sesuai dengan kebutuhan digital keluarga Anda. Streaming
                    lancar, gaming tanpa lag.
                </p>
            </div>

            <!-- Kondisi Loading -->
            <div v-if="pricingLoading" class="flex justify-center items-center py-20">
                <div class="animate-spin rounded-full h-12 w-12 border-4 border-[#F9EBEB] border-t-[#A93133]"></div>
            </div>

            <!-- Kondisi Error (Jika API Backend bermasalah) -->
            <div v-else-if="pricingError"
                class="text-center py-20 bg-white rounded-3xl shadow-sm border border-red-100 max-w-2xl mx-auto">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500 mb-4">
                    <i class="fas fa-exclamation-triangle text-2xl"></i>
                </div>
                <p class="text-red-500 font-medium mb-6">{{ pricingError }}</p>
                <button @click="loadPricingPlans"
                    class="px-8 py-3 bg-[#A93133] text-white font-bold rounded-full hover:bg-red-800 transition-colors shadow-md">
                    Coba Muat Ulang
                </button>
            </div>

            <!-- Daftar Kartu Paket -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch justify-center">
                <div v-for="(plan, index) in pricingPlans" :key="plan.id"
                    class="relative bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden flex flex-col group"
                    :class="{ 'ring-2 sm:ring-4 ring-[#A93133] scale-100 lg:scale-105 z-10': index === 1 }">

                    <!-- Badge Rekomendasi (Muncul di paket urutan ke-2/tengah) -->
                    <div v-if="index === 1"
                        class="absolute top-0 inset-x-0 bg-[#A93133] text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
                        Paling Diminati
                    </div>

                    <!-- Header Kartu -->
                    <div class="p-8 text-center" :class="{ 'mt-4': index === 1 }">
                        <h3 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{{ plan.name }}</h3>
                        <p class="text-sm text-gray-500 min-h-[40px]">{{ plan.description }}</p>
                    </div>

                    <!-- Highlight Kecepatan -->
                    <div class="px-8 pb-6 text-center">
                        <div
                            class="inline-flex items-end justify-center gap-1 text-[#A93133] group-hover:scale-110 transition-transform duration-300">
                            <span class="text-6xl font-black tracking-tighter">{{ plan.downloadSpeed }}</span>
                            <span class="text-xl font-bold mb-1 sm:mb-2">Mbps</span>
                        </div>
                        <p class="text-xs font-medium text-gray-400 mt-3 uppercase tracking-wide">Download / Upload
                            Simetris</p>
                    </div>

                    <!-- Harga dan Fitur -->
                    <div class="bg-gray-50 p-8 flex-grow flex flex-col justify-between border-t border-gray-100">
                        <div class="mb-6">
                            <div class="flex items-center justify-center gap-1 text-gray-900">
                                <span class="text-lg font-bold">Rp</span>
                                <span class="text-3xl sm:text-4xl font-black">{{ plan.price.toLocaleString('id-ID')
                                }}</span>
                            </div>
                            <p class="text-center text-gray-500 text-sm mt-1">/ bulan (Flat)</p>
                        </div>

                        <!-- List Fitur -->
                        <ul class="space-y-3 mb-8">
                            <li class="flex items-center text-sm text-gray-600">
                                <i class="fas fa-check-circle text-[#A93133] mr-3 text-lg"></i> 100% Fiber Optic
                            </li>
                            <li class="flex items-center text-sm text-gray-600">
                                <i class="fas fa-check-circle text-[#A93133] mr-3 text-lg"></i> Kuota Unlimited Tanpa
                                FUP
                            </li>
                            <li class="flex items-center text-sm text-gray-600">
                                <i class="fas fa-check-circle text-[#A93133] mr-3 text-lg"></i> Bantuan Teknisi
                                Prioritas
                            </li>
                            <li class="flex items-center text-sm text-gray-600">
                                <i class="fas fa-check-circle text-[#A93133] mr-3 text-lg"></i> Peminjaman Router Gratis
                            </li>
                        </ul>

                        <!-- Tombol Berlangganan -->
                        <button @click="choosePlan(plan)"
                            class="w-full py-4 text-center font-bold rounded-xl transition-all duration-300 shadow-sm"
                            :class="index === 1 ? 'bg-[#A93133] text-white hover:bg-red-800' : 'bg-white text-[#A93133] border-2 border-[#A93133] hover:bg-[#A93133] hover:text-white'">
                            Berlangganan
                        </button>
                    </div>
                </div>
            </div>

        </div>
    </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { productApi } from '@/api/product'

const pricingPlans = ref([])
const pricingLoading = ref(true)
const pricingError = ref('')

// Mengambil data dari backend Golang
const loadPricingPlans = async () => {
    pricingLoading.value = true
    pricingError.value = ''

    try {
        const response = await productApi().getAll()

        // Null-safety untuk mencegah error .map() jika data kosong
        const data = response?.data || response || []

        if (!Array.isArray(data)) {
            throw new Error('Format data paket tidak valid.')
        }

        pricingPlans.value = data.map((product) => ({
            id: product.id,
            name: product.name,
            description: product.description || 'Paket internet rumah super cepat dan stabil.',
            price: Number(product.price) || 0,
            downloadSpeed: product.download_speed_mbps ?? '-',
            uploadSpeed: product.upload_speed_mbps ?? null
        }))
    } catch (error) {
        pricingError.value = error?.message || 'Gagal memuat daftar paket internet.'
    } finally {
        pricingLoading.value = false
    }
}

const choosePlan = (plan) => {
    const phoneNumber = '6285607121775' // Nomor CS Lilly ISP
    const message = `Halo Lilly ISP, saya tertarik berlangganan paket Personal:\n\n*${plan.name}*\nKecepatan: ${plan.downloadSpeed} Mbps\nHarga: Rp ${plan.price.toLocaleString('id-ID')}/bulan\n\nMohon info ketersediaan jaringan di area rumah saya. Terima kasih.`
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
}

onMounted(() => {
    loadPricingPlans()
})
</script>