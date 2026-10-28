<template>
    <!-- 1. HAPUS margin negatif di section, ganti py-12 menjadi pb-12 (padding bawah saja) -->
    <section id="id_coverage" class="pb-12 bg-white w-full max-w-full relative z-20">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

            <!-- 2. PINDAHKAN margin negatif ke kotak putih ini (-mt-16 atau -mt-24) -->
            <div
                class="relative -mt-16 sm:-mt-24 z-30 bg-white rounded-3xl shadow-[0_15px_40px_rgb(0,0,0,0.12)] border border-gray-100 p-6 sm:p-8 flex flex-col lg:flex-row items-center gap-6 lg:gap-8">

                <!-- Bagian Judul (Hanya Title, Tanpa Subtitle) -->
                <div class="lg:w-1/4 shrink-0 text-center lg:text-left">
                    <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight whitespace-nowrap">
                        Cek Jangkauan<br class="hidden lg:block" /><span class="text-[#A93133]">Jaringan</span>
                    </h2>
                </div>

                <!-- Bagian Formulir Memanjang -->
                <div class="w-full lg:w-3/4 flex flex-col sm:flex-row items-center gap-4">

                    <div class="flex-1 flex flex-col sm:flex-row gap-3 w-full">
                        <!-- Select Kota -->
                        <select v-model="selectedCity"
                            class="flex-1 px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A93133]/30 focus:border-[#A93133] transition-all text-gray-800 font-medium whitespace-nowrap cursor-pointer">
                            <option value="" disabled>Pilih Kabupaten/Kota</option>
                            <option v-for="city in cities" :key="city" :value="city">{{ city }}</option>
                        </select>

                        <!-- Select Kecamatan (Disabled & Kosong jika Kota belum dipilih) -->
                        <select v-model="selectedDistrict" :disabled="!selectedCity"
                            class="flex-1 px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A93133]/30 focus:border-[#A93133] transition-all text-gray-800 font-medium disabled:opacity-50 disabled:bg-gray-100 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer">
                            <option value="" disabled>{{ selectedCity ? 'Pilih Kecamatan' : 'Pilih Kota Dulu' }}
                            </option>
                            <option v-for="district in availableDistricts" :key="district" :value="district">{{ district
                            }}</option>
                        </select>

                        <!-- Tombol Cek -->
                        <button @click="checkManual" :disabled="isChecking || isLoadingGeo || !selectedDistrict"
                            class="px-6 py-3.5 bg-[#111111] text-white font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                            <i v-if="isChecking" class="fas fa-spinner fa-spin"></i>
                            <span v-else>Cek Area</span>
                        </button>
                    </div>

                    <!-- Garis Pemisah (Vertikal di Desktop, Horizontal di Mobile) -->
                    <div class="hidden sm:block h-10 w-px bg-gray-200 mx-2 shrink-0"></div>
                    <div class="sm:hidden w-full h-px bg-gray-200 my-2"></div>

                    <!-- Tombol Lokasi Saat Ini -->
                    <button @click="checkAutoLocation" :disabled="isLoadingGeo || isChecking"
                        class="w-full sm:w-auto px-6 py-3.5 bg-[#F9EBEB] text-[#A93133] font-bold rounded-xl hover:bg-[#A93133] hover:text-white transition-all flex items-center justify-center gap-2 border border-[#A93133]/20 shadow-sm disabled:opacity-50 whitespace-nowrap shrink-0">
                        <i v-if="isLoadingGeo" class="fas fa-spinner fa-spin"></i>
                        <i v-else class="fas fa-location-arrow"></i>
                        {{ isLoadingGeo ? 'Mendeteksi...' : 'Lokasi Saat Ini' }}
                    </button>
                </div>
            </div>

            <!-- Hasil Pencarian -->
            <transition name="fade">
                <div v-if="checkResult"
                    class="mt-6 max-w-3xl mx-auto p-4 rounded-xl flex items-start gap-3 border shadow-sm"
                    :class="checkResult.status === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'">
                    <i class="mt-0.5 text-xl"
                        :class="checkResult.status === 'success' ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                    <p class="font-medium text-sm sm:text-base leading-relaxed">{{ checkResult.message }}</p>
                </div>
            </transition>

        </div>
    </section>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const selectedCity = ref('')
const selectedDistrict = ref('')
const cities = ref([])
const availableDistricts = ref([])

const isChecking = ref(false)
const checkResult = ref(null)
const isLoadingGeo = ref(false)

// Simpan data mentah kabupaten
const rawRegencies = ref([])

const BASE_API = 'https://emsifa.github.io/api-wilayah-indonesia/api'

// 1. Ambil daftar Kabupaten/Kota saat komponen dimount
onMounted(async () => {
    try {
        const provRes = await fetch(`${BASE_API}/provinces.json`)
        const provinces = await provRes.json()

        // Ambil data per provinsi secara bertahap agar tidak kena rate-limit
        const regencyList = []
        for (const prov of provinces) {
            try {
                const res = await fetch(`${BASE_API}/regencies/${prov.id}.json`)
                const data = await res.json()
                regencyList.push(...data)
            } catch (e) {
                console.warn(`Gagal memuat kab/kota prov ${prov.name}`)
            }
        }

        rawRegencies.value = regencyList
        cities.value = regencyList.map(r => r.name).sort()
    } catch (err) {
        console.error('Gagal mengambil data wilayah:', err)
    }
})

// 2. Saat Kota/Kabupaten dipilih, cari ID-nya lalu ambil daftar Kecamatan
watch(selectedCity, async (newCity) => {
    selectedDistrict.value = ''
    availableDistricts.value = []

    const foundRegency = rawRegencies.value.find(r => r.name === newCity)
    if (!foundRegency) return

    try {
        const res = await fetch(`${BASE_API}/districts/${foundRegency.id}.json`)
        const districtData = await res.json()
        availableDistricts.value = districtData.map(d => d.name).sort()
    } catch (err) {
        console.error('Gagal mengambil data kecamatan:', err)
    }
})

// 3. Tombol Cek Manual
const checkManual = () => {
    if (!selectedCity.value || !selectedDistrict.value) {
        alert('Mohon pilih Kabupaten/Kota dan Kecamatan terlebih dahulu.')
        return
    }

    isChecking.value = true
    checkResult.value = null

    setTimeout(() => {
        isChecking.value = false
        checkResult.value = {
            status: 'success',
            message: `Hore! Jaringan Fiber Optic Lilly ISP sudah tersedia di area Kec. ${selectedDistrict.value}, ${selectedCity.value}.`
        }
    }, 1000)
}

// 4. Tombol Lokasi Otomatis via GPS
const checkAutoLocation = () => {
    if (!navigator.geolocation) {
        alert('Browser Anda tidak mendukung fitur deteksi lokasi otomatis.')
        return
    }

    isLoadingGeo.value = true
    checkResult.value = null

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude.toFixed(4)
            const lng = position.coords.longitude.toFixed(4)

            setTimeout(() => {
                isLoadingGeo.value = false
                checkResult.value = {
                    status: 'success',
                    message: `Lokasi Anda terdeteksi (Lat: ${lat}, Lng: ${lng}). Area Anda berada dalam jangkauan layanan Lilly ISP!`
                }
            }, 1000)
        },
        () => {
            isLoadingGeo.value = false
            checkResult.value = {
                status: 'error',
                message: 'Gagal mendeteksi lokasi. Pastikan izin akses lokasi pada browser Anda sudah diaktifkan.'
            }
        },
        { enableHighAccuracy: true, timeout: 6000 }
    )
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>