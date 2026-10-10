<template>
    <section id="id_contact_us" class="py-16 sm:py-24 bg-white w-full max-w-full">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

            <!-- Header Section -->
            <div class="text-center mb-12 sm:mb-16">
                <span
                    class="inline-block py-1.5 px-4 rounded-full bg-[#F9EBEB] text-[#A93133] font-bold text-xs sm:text-sm mb-4 border border-[#A93133]/20">
                    HUBUNGI KAMI
                </span>
                <h2 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                    Siap Membantu Anda 24/7
                </h2>
                <p class="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                    Ada pertanyaan seputar paket internet, keluhan jaringan, atau ingin berdiskusi mengenai proyek IT?
                    Tim kami selalu siap melayani Anda.
                </p>
            </div>

            <div class="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

                <!-- KOLOM KIRI: Informasi Kontak -->
                <div class="w-full lg:w-5/12 space-y-8">
                    <div
                        class="bg-gray-50 p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] h-full">
                        <h3 class="text-2xl font-bold text-gray-900 mb-8">Informasi Kontak</h3>

                        <ul class="space-y-8">
                            <!-- Alamat -->
                            <li class="flex items-start group">
                                <div
                                    class="w-14 h-14 bg-[#F9EBEB] text-[#A93133] rounded-2xl flex items-center justify-center text-2xl shrink-0 group-hover:bg-[#A93133] group-hover:text-white transition-colors duration-300">
                                    <i class="fas fa-map-marker-alt"></i>
                                </div>
                                <div class="ml-5 mt-1">
                                    <h4 class="text-lg font-bold text-gray-900">Kantor Pusat</h4>
                                    <p class="text-gray-600 mt-1 leading-relaxed">Jl. Pratu Herman No.34, Sedayu, Turen,
                                        Kab. Malang, Jawa Timur</p>
                                </div>
                            </li>

                            <!-- Telepon -->
                            <li class="flex items-start group">
                                <div
                                    class="w-14 h-14 bg-[#F9EBEB] text-[#A93133] rounded-2xl flex items-center justify-center text-2xl shrink-0 group-hover:bg-[#A93133] group-hover:text-white transition-colors duration-300">
                                    <i class="fas fa-phone-alt"></i>
                                </div>
                                <div class="ml-5 mt-1">
                                    <h4 class="text-lg font-bold text-gray-900">Telepon / WhatsApp</h4>
                                    <p class="text-gray-600 mt-1 leading-relaxed">+62 341 8222 099<br>+62 856 0712 1775
                                    </p>
                                </div>
                            </li>

                            <!-- Email -->
                            <li class="flex items-start group">
                                <div
                                    class="w-14 h-14 bg-[#F9EBEB] text-[#A93133] rounded-2xl flex items-center justify-center text-2xl shrink-0 group-hover:bg-[#A93133] group-hover:text-white transition-colors duration-300">
                                    <i class="fas fa-envelope"></i>
                                </div>
                                <div class="ml-5 mt-1">
                                    <h4 class="text-lg font-bold text-gray-900">Email Bantuan</h4>
                                    <p class="text-gray-600 mt-1 leading-relaxed">
                                        info@lilly.net.id<br>support@lilly.net.id</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- KOLOM KANAN: Formulir Input -->
                <div class="w-full lg:w-7/12">
                    <div
                        class="bg-white p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100">
                        <h3 class="text-2xl font-bold text-gray-900 mb-6">Kirim Pesan</h3>

                        <!-- Alert Berhasil -->
                        <div v-if="submitSuccess"
                            class="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl flex items-center gap-3 animate-fade-in">
                            <i class="fas fa-check-circle text-xl"></i>
                            <p class="font-medium text-sm sm:text-base">Terima kasih! Pesan Anda telah kami terima dan
                                akan segera diproses.</p>
                        </div>

                        <!-- Form -->
                        <div class="space-y-5">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <!-- Input Nama -->
                                <div class="space-y-2">
                                    <label class="text-sm font-semibold text-gray-700">Nama Lengkap *</label>
                                    <input v-model="contactForm.name" type="text" placeholder="Masukkan nama Anda"
                                        class="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A93133]/30 focus:border-[#A93133] transition-all text-gray-800" />
                                </div>
                                <!-- Input Email -->
                                <div class="space-y-2">
                                    <label class="text-sm font-semibold text-gray-700">Alamat Email *</label>
                                    <input v-model="contactForm.email" type="email" placeholder="email@contoh.com"
                                        class="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A93133]/30 focus:border-[#A93133] transition-all text-gray-800" />
                                </div>
                            </div>

                            <!-- Input No HP -->
                            <div class="space-y-2">
                                <label class="text-sm font-semibold text-gray-700">Nomor Telepon / WA *</label>
                                <input v-model="contactForm.phone" type="tel" placeholder="0812xxxxxx"
                                    class="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A93133]/30 focus:border-[#A93133] transition-all text-gray-800" />
                            </div>

                            <!-- Input Pesan -->
                            <div class="space-y-2">
                                <label class="text-sm font-semibold text-gray-700">Isi Pesan *</label>
                                <textarea v-model="contactForm.message" rows="5"
                                    placeholder="Jelaskan kebutuhan atau pertanyaan Anda di sini..."
                                    class="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A93133]/30 focus:border-[#A93133] transition-all text-gray-800 resize-none"></textarea>
                            </div>

                            <!-- Tombol Submit -->
                            <button @click="submitContactForm" :disabled="isSubmitting"
                                class="w-full mt-4 px-8 py-4 bg-[#A93133] text-white font-bold rounded-xl hover:bg-red-800 transition-all shadow-lg hover:shadow-[#A93133]/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                                <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
                                <i v-else class="fas fa-paper-plane"></i>
                                {{ isSubmitting ? 'Mengirim Pesan...' : 'Kirim Pesan Sekarang' }}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </section>
</template>

<script setup>
import { ref } from 'vue'

const contactForm = ref({
    name: '',
    email: '',
    phone: '',
    message: ''
})

const isSubmitting = ref(false)
const submitSuccess = ref(false)

const submitContactForm = () => {
    // Validasi form kosong
    if (!contactForm.value.name || !contactForm.value.email || !contactForm.value.phone || !contactForm.value.message) {
        alert('Mohon lengkapi semua kolom yang wajib diisi.')
        return
    }

    isSubmitting.value = true

    // Simulasi proses pengiriman ke API (Bisa kamu ganti dengan endpoint Golang-mu nanti)
    setTimeout(() => {
        isSubmitting.value = false
        submitSuccess.value = true

        // Reset isi form
        contactForm.value = { name: '', email: '', phone: '', message: '' }

        // Sembunyikan alert sukses setelah 5 detik
        setTimeout(() => {
            submitSuccess.value = false
        }, 5000)
    }, 1500)
}
</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>