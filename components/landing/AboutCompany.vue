<template>
  <section class="py-16 sm:py-24 bg-white w-full">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div class="flex flex-col md:flex-row items-center gap-12 lg:gap-16">

        <!-- Kolom Gambar -->
        <div class="w-full md:w-1/2 relative">
          <div class="aspect-w-4 aspect-h-3 rounded-3xl overflow-hidden shadow-lg relative z-10">
            <img src="/statics/images/image_1.png" alt="Tentang Lilly ISP"
              class="w-full h-full object-cover object-center" />
          </div>
          <!-- Aksen Kotak Merah -->
          <div class="absolute -bottom-5 -right-5 w-2/3 h-2/3 border-4 border-[#A93133] rounded-3xl -z-10"></div>
        </div>

        <!-- Kolom Teks (Dari kode lama) -->
        <div class="w-full md:w-1/2">
          <h2 class="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">
            Tentang <span class="text-[#A93133]">LILLY</span>
          </h2>
          <div class="prose prose-lg text-gray-600">
            <p class="leading-relaxed mb-6">
              LILLY perusahaan yang bergerak pada bidang Project Management, Konsultan IT dan Internet Service Provider.
            </p>
            <p class="leading-relaxed">
              Bidang usaha kami mengikuti perkembangan dunia teknologi informasi dengan memberikan solusi, perencanaan,
              dan strategi yang terintegrasi sebagai nilai tambah bagi kebutuhan berbagai layanan dibidang Teknologi
              Informasi.
            </p>
          </div>

          <!-- Checklist Mini -->
          <ul class="mt-8 space-y-3">
            <li class="flex items-center text-gray-700 font-medium">
              <i class="fas fa-check-circle text-[#A93133] mr-3"></i> Internet Service Provider (ISP)
            </li>
            <li class="flex items-center text-gray-700 font-medium">
              <i class="fas fa-check-circle text-[#A93133] mr-3"></i> Project Management IT
            </li>
            <li class="flex items-center text-gray-700 font-medium">
              <i class="fas fa-check-circle text-[#A93133] mr-3"></i> Konsultan Teknologi
            </li>
          </ul>
        </div>

      </div>
    </div>
  </section>
</template>