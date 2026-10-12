<template>
    <section id="id_team" class="py-16 sm:py-24 bg-gray-50 w-full">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

            <div class="text-center mb-16">
                <span
                    class="inline-block py-1.5 px-4 rounded-full bg-[#F9EBEB] text-[#A93133] font-bold text-xs sm:text-sm mb-4 border border-[#A93133]/20">
                    TIM PROFESIONAL
                </span>
                <h2 class="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Penggerak Inovasi Kami</h2>
                <p class="text-gray-600 max-w-2xl mx-auto">Dedikasi dan keahlian mereka adalah kunci di balik koneksi
                    stabil yang Anda nikmati setiap hari.</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div v-for="(member, index) in teamMembers" :key="index"
                    class="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group">
                    <div class="relative h-72 overflow-hidden bg-gray-100">
                        <img :src="member.image" :alt="member.name"
                            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div
                            class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        </div>
                    </div>
                    <div class="p-6 text-center relative bg-white">
                        <h3 class="text-xl font-bold text-gray-900 mb-1">{{ member.name }}</h3>
                        <p class="text-sm font-semibold text-[#A93133] uppercase">{{ member.role }}</p>
                    </div>
                </div>
            </div>

        </div>
    </section>
</template>

<script setup>
const teamMembers = [
    { name: 'Budi Santoso', role: 'Direktur Utama', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=300&auto=format&fit=crop' },
    { name: 'Anita Wijaya', role: 'Head of Operations', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop' },
    { name: 'Rizky Pratama', role: 'Lead Network Engineer', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=300&auto=format&fit=crop' },
    { name: 'Diana Fitri', role: 'Customer Success', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=300&auto=format&fit=crop' }
]
</script>