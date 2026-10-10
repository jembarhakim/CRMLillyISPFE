<template>
  <div class="landing-page bg-white min-h-screen text-gray-800" style="font-family: 'Poppins', sans-serif;">

    <!-- NAVBAR UNIVERSAL (Mengontrol activeMode) -->
    <LandingHeader v-model="activeMode" />

    <!-- KONTEN DINAMIS BERDASARKAN MODE -->
    <!-- pt-24 ditambahkan agar konten tidak tertutup oleh header yang fixed -->
    <main class="pt-24 lg:pt-28">
      <transition name="slide-fade" mode="out-in">

        <!-- ============================== -->
        <!-- MODE 1: PERSONAL               -->
        <!-- ============================== -->
        <div v-if="activeMode === 'personal'" key="personal">
          <LandingHeroPersonal />
          <LandingPricing />
          <LandingTestimonial />
          <LandingNews />
          <!-- <LandingPersonalPromo /> (Menyusul) -->
          <!-- <LandingSubscriptionSteps /> (Menyusul) -->
        </div>

        <!-- ============================== -->
        <!-- MODE 2: ENTERPRISE             -->
        <!-- ============================== -->
        <div v-else-if="activeMode === 'enterprise'" key="enterprise">
          <LandingHeroEnterprise />
          <LandingEnterpriseServices />
          <LandingEnterpriseClients />
          <LandingPortfolio />
          <LandingNews />

          <div
            class="min-h-[60vh] flex items-center justify-center bg-[#F9EBEB] rounded-3xl m-4 border-2 border-dashed border-[#A93133]/30">
            <div class="text-center">
              <h2 class="text-3xl font-bold text-[#A93133] mb-4">Mode Enterprise (B2B)</h2>
              <p class="text-gray-500">Area ini siap diisi dengan Solusi Bisnis, Manajemen Jaringan, dan Logo Klien.</p>
            </div>
          </div>
        </div>

        <!-- ============================== -->
        <!-- MODE 3: TENTANG KAMI           -->
        <!-- ============================== -->
        <div v-else-if="activeMode === 'about'" key="about">
          <LandingHeroAbout />
          <LandingAboutCompany />
          <LandingVisionMission />
          <LandingTeam />

          <div
            class="min-h-[60vh] flex items-center justify-center bg-white rounded-3xl m-4 border-2 border-dashed border-gray-200">
            <div class="text-center">
              <h2 class="text-3xl font-bold text-[#A93133] mb-4">Mode Tentang Kami</h2>
              <p class="text-gray-500">Area ini siap diisi dengan Company Profile, Visi Misi, dan Profil Tim.</p>
            </div>
          </div>
        </div>

      </transition>
    </main>

    <!-- FOOTER & WA MENGAMBANG UNIVERSAL -->
    <LandingContactUs />
    <LandingFooter />
    <LandingFloatingWhatsapp />

  </div>
</template>

<script setup>
import { ref } from 'vue'

// Import semua komponen yang sudah aktif
import LandingHeader from '~/components/landing/Header.vue'
import LandingHeroPersonal from '~/components/landing/HeroPersonal.vue'
import LandingPricing from '~/components/landing/Pricing.vue'
import LandingFooter from '~/components/landing/Footer.vue'
import LandingFloatingWhatsapp from '~/components/landing/FloatingWhatsapp.vue'
import LandingNews from '~/components/landing/News.vue'
import LandingHeroEnterprise from '~/components/landing/HeroEnterprise.vue'
import LandingEnterpriseServices from '~/components/landing/EnterpriseServices.vue'
import LandingEnterpriseClients from '~/components/landing/EnterpriseClients.vue'
import LandingPortfolio from '~/components/landing/Portfolio.vue'
import LandingHeroAbout from '~/components/landing/HeroAbout.vue'
import LandingAboutCompany from '~/components/landing/AboutCompany.vue'
import LandingVisionMission from '~/components/landing/VisionMission.vue'
import LandingTestimonial from '~/components/landing/Testimonial.vue'
import LandingTeam from '~/components/landing/Team.vue'
import LandingContactUs from '~/components/landing/ContactUs.vue'

// Set Title & Font
useHead({
  title: 'Lilly ISP - Layanan Internet Cepat & Stabil',
  meta: [
    { name: 'description', content: 'Lilly ISP menyediakan layanan internet Personal dan solusi jaringan Enterprise terbaik.' }
  ]
})

// STATE UTAMA: Mode default saat web dibuka adalah 'personal'
const activeMode = ref('personal')
</script>

<style>
/* Memastikan font Poppins teraplikasi global di landing page */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

body {
  font-family: 'Poppins', sans-serif;
}

/* Animasi Transisi Pindah Mode */
.slide-fade-enter-active {
  transition: all 0.4s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from {
  transform: translateY(15px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-15px);
  opacity: 0;
}
</style>