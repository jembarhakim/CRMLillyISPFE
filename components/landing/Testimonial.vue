<template>
    <section id="id_testimonial" class="py-16 sm:py-24 bg-white w-full overflow-hidden">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center">

            <span
                class="inline-block py-1.5 px-4 rounded-full bg-[#F9EBEB] text-[#A93133] font-bold text-xs sm:text-sm mb-4 border border-[#A93133]/20">
                KATA MEREKA
            </span>
            <h2 class="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-12">Pelanggan Kami Berbicara</h2>

            <div class="relative min-h-[250px] flex items-center justify-center">
                <transition-group name="fade" tag="div" class="relative w-full">
                    <div v-for="(testimonial, index) in testimonials" :key="index" v-show="currentTestimonial === index"
                        class="absolute inset-0 flex flex-col items-center justify-center px-4">

                        <i class="fas fa-quote-left text-4xl text-[#F9EBEB] mb-6"></i>
                        <p
                            class="text-lg sm:text-xl md:text-2xl font-medium text-gray-700 italic max-w-3xl leading-relaxed mb-8">
                            "{{ testimonial.text }}"
                        </p>

                        <div class="flex items-center gap-4">
                            <img :src="testimonial.image" :alt="testimonial.name"
                                class="w-16 h-16 rounded-full object-cover border-2 border-[#A93133]" />
                            <div class="text-left">
                                <h3 class="text-lg font-bold text-gray-900">{{ testimonial.name }}</h3>
                                <p class="text-sm font-semibold text-[#A93133] uppercase">{{ testimonial.role }}</p>
                            </div>
                        </div>

                    </div>
                </transition-group>
            </div>

            <!-- Navigation Dots -->
            <div class="flex justify-center gap-2 mt-12 z-20 relative">
                <button v-for="(_, index) in testimonials" :key="index" @click="currentTestimonial = index"
                    class="w-3 h-3 rounded-full transition-all duration-300"
                    :class="currentTestimonial === index ? 'bg-[#A93133] w-8' : 'bg-gray-300 hover:bg-[#A93133]/50'"></button>
            </div>

        </div>
    </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const currentTestimonial = ref(0)
const testimonials = [
    { name: 'Sarah Chen', role: 'Business Owner', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop', text: 'Koneksi dari Lilly ISP sangat stabil. Sangat membantu operasional bisnis online saya yang butuh uptime 24 jam tanpa hambatan!' },
    { name: 'David Miller', role: 'Freelance Designer', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop', text: 'Upload file desain berukuran besar ke klien sekarang jadi sangat cepat. Paket Personal-nya sangat worth it dan ramah di kantong.' },
    { name: 'Jesicca Kim', role: 'Content Creator', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop', text: 'Streaming dan live gaming nggak pernah ngelag lagi semenjak pakai Lilly ISP. Tim teknisinya juga sangat cepat tanggap!' }
]

let interval
onMounted(() => {
    interval = setInterval(() => {
        currentTestimonial.value = (currentTestimonial.value + 1) % testimonials.length
    }, 5000)
})
onUnmounted(() => clearInterval(interval))
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-enter-from {
    opacity: 0;
    transform: translateX(20px);
}

.fade-leave-to {
    opacity: 0;
    transform: translateX(-20px);
}
</style>